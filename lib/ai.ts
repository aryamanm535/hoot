import type { BuyPriceAnalysis, MarketThought } from "./types"
import type { CompanyFundamentals } from "./companyData"

/**
 * LLM provider
 * - Groq: OpenAI-compatible Chat Completions API
 * - Gemini fallback: kept only if GROQ_API_KEY is absent
 */
const GROQ_MODEL = process.env.GROQ_MODEL ?? "openai/gpt-oss-20b"
const GEMINI_MODEL = "gemini-2.5-flash"

/** Serialize LLM calls so /news + /explain never burst parallel requests (major 429 source). */
let llmChain: Promise<void> = Promise.resolve()

function withLlmQueue<T>(fn: () => Promise<T>): Promise<T> {
  const run = llmChain.then(fn, fn)
  llmChain = run.then(
    () => undefined,
    () => undefined
  )
  return run
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

/** Per-ticker spacing for live stream — reduces quota burn when the UI polls aggressively. */
const liveGapState = new Map<string, { lastCompleteAt: number }>()

async function enforceLiveMinGap(ticker: string): Promise<void> {
  const gap = Math.max(0, Number(process.env.GEMINI_LIVE_MIN_INTERVAL_MS ?? 12_000))
  if (gap === 0) return
  const prev = liveGapState.get(ticker)?.lastCompleteAt
  const now = Date.now()
  if (prev != null) {
    const elapsed = now - prev
    if (elapsed < gap) await sleep(gap - elapsed)
  }
}

function markLiveComplete(ticker: string): void {
  liveGapState.set(ticker, { lastCompleteAt: Date.now() })
}

function parseDurationToMs(d: unknown): number | null {
  if (typeof d !== "string") return null
  const sec = d.match(/^(\d+(?:\.\d+)?)s$/i)
  if (sec) return Math.ceil(parseFloat(sec[1]) * 1000)
  const ms = d.match(/^(\d+)ms$/i)
  if (ms) return parseInt(ms[1], 10)
  return null
}

function parseRetryDelayMsFromBody(body: unknown): number | null {
  const err = (body as { error?: { details?: unknown[] } })?.error
  const details = err?.details
  if (!Array.isArray(details)) return null
  for (const d of details) {
    if (!d || typeof d !== "object") continue
    const o = d as Record<string, unknown>
    const t = o["@type"]
    if (typeof t === "string" && t.includes("RetryInfo")) {
      const parsed = parseDurationToMs(o.retryDelay)
      if (parsed != null) return parsed
    }
  }
  return null
}

function backoffMsForAttempt(res: Response, body: unknown, attempt: number): number {
  const header = res.headers.get("retry-after")
  if (header) {
    const sec = parseInt(header, 10)
    if (!Number.isNaN(sec)) return sec * 1000 + Math.random() * 250
  }
  const fromBody = parseRetryDelayMsFromBody(body)
  if (fromBody != null) return Math.min(60_000, fromBody + Math.random() * 250)
  const expo = Math.min(32_000, 1000 * 1.6 ** attempt)
  return expo + Math.random() * 400
}

function extractJsonObject(text: string): string {
  const trimmed = text.trim()
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence?.[1]) return fence[1].trim()
  const start = trimmed.indexOf("{")
  const end = trimmed.lastIndexOf("}")
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1)
  return trimmed
}

/** Parse model text; surfaces JSON errors with a short prefix for logs/UI. */
function parseModelJson(text: string, label: string): unknown {
  const blob = extractJsonObject(text)
  try {
    return JSON.parse(blob)
  } catch (e1) {
    try {
      return JSON.parse(text.trim())
    } catch {
      const hint = e1 instanceof Error ? e1.message : "parse error"
      throw new Error(`${label}: ${hint}`)
    }
  }
}

function clampConfidence(n: unknown): number {
  const x = typeof n === "number" ? n : Number(n)
  if (!Number.isFinite(x)) return 0
  return Math.max(0, Math.min(100, Math.round(x)))
}

function normalizeAction(raw: unknown): MarketThought["action"] {
  const a = String(raw ?? "").toUpperCase()
  if (a === "BUY") return "BUY"
  if (a === "WATCH" || a === "WAIT") return "WATCH"
  if (a === "IGNORE" || a === "HOLD") return "IGNORE"
  if (a === "EXPLAIN") return "EXPLAIN"
  if (a === "ERROR") return "ERROR"
  return "WATCH"
}

export function coerceMarketThought(raw: unknown, fallbackTicker: string): MarketThought {
  if (!raw || typeof raw !== "object") {
    return {
      ticker: fallbackTicker,
      thought: "Model returned an unexpected shape.",
      reasoning: [],
      confidence: 0,
      action: "ERROR",
    }
  }
  const o = raw as Record<string, unknown>
  const reasoning = Array.isArray(o.reasoning)
    ? o.reasoning.map((x) => String(x))
    : typeof o.reasoning === "string"
      ? [o.reasoning]
      : []

  const sources = Array.isArray(o.sources)
    ? o.sources
        .slice(0, 6)
        .map((s) => ({
          title: String((s as any)?.title ?? "").trim(),
          url: String((s as any)?.url ?? "").trim(),
        }))
        .filter((x) => x.title && /^https?:\/\//.test(x.url))
    : undefined

  const topFactors = Array.isArray(o.topFactors)
    ? o.topFactors
        .slice(0, 2)
        .map((f) => ({
          factor: String((f as any)?.factor ?? "").trim(),
          evidence: String((f as any)?.evidence ?? "").trim(),
        }))
        .filter((x) => x.factor && x.evidence)
    : undefined

  return {
    ticker: String(o.ticker ?? fallbackTicker),
    thought: String(o.thought ?? ""),
    reasoning,
    whatToWatch: o.whatToWatch != null ? String(o.whatToWatch) : undefined,
    sources,
    topFactors,
    confidence: clampConfidence(o.confidence),
    action: normalizeAction(o.action),
    regionLabel: o.regionLabel != null ? String(o.regionLabel) : undefined,
  }
}

export type LlmCallOptions = {
  /** Wall-clock per HTTP attempt (undici / browser AbortSignal.timeout). */
  timeoutMs?: number
  maxRetries?: number
  maxOutputTokens?: number
  temperature?: number
  /** gpt-oss reasoning depth (Groq-only). Higher = better reasoning but more tokens spent thinking. */
  reasoningEffort?: "low" | "medium" | "high"
}

async function callGroq(prompt: string, options: LlmCallOptions = {}): Promise<string> {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new Error("GROQ_API_KEY is not set")

  const timeoutMs = options.timeoutMs ?? 45_000
  const maxRetries = options.maxRetries ?? Math.max(0, Math.min(8, Number(process.env.LLM_MAX_RETRIES ?? 3)))
  const maxTokens = options.maxOutputTokens ?? 2048
  const temperature = options.temperature ?? 0.7
  const reasoningEffort = options.reasoningEffort ?? "low"

  const url = "https://api.groq.com/openai/v1/chat/completions"

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    let res: Response
    try {
      res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        signal: AbortSignal.timeout(timeoutMs),
        body: JSON.stringify({
          model: GROQ_MODEL,
          temperature,
          max_tokens: maxTokens,
          // gpt-oss reasoning models burn tokens on hidden reasoning before the JSON body;
          // keep effort low by default so max_tokens isn't exhausted before content is emitted —
          // bump it per-call (with a bigger maxOutputTokens) when the task needs real reasoning.
          reasoning_effort: reasoningEffort,
          // Ask for JSON object output; still keep parseModelJson as safety.
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "You are Market Mind Stream. Always output ONLY valid JSON (no markdown, no extra text).",
            },
            { role: "user", content: prompt },
          ],
        }),
      })
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        throw new Error(`Groq request timed out after ${timeoutMs}ms`)
      }
      throw e
    }

    const json = (await res.json()) as Record<string, unknown>
    if (res.ok) {
      const content =
        (json as any)?.choices?.[0]?.message?.content ??
        (json as any)?.choices?.[0]?.delta?.content
      if (typeof content !== "string") throw new Error("Empty model response")
      return content
    }

    const retriable = res.status === 429 || res.status === 503 || res.status === 408
    if (!retriable || attempt === maxRetries) {
      throw new Error(`Groq error ${res.status}: ${JSON.stringify(json)}`)
    }
    await sleep(backoffMsForAttempt(res, json, attempt))
  }

  throw new Error("Groq: retries exhausted")
}

async function callGeminiFallback(prompt: string, options: LlmCallOptions = {}): Promise<string> {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error("GEMINI_API_KEY is not set")

  const timeoutMs = options.timeoutMs ?? 45_000
  const maxRetries = options.maxRetries ?? Math.max(0, Math.min(8, Number(process.env.LLM_MAX_RETRIES ?? 3)))
  const maxOutputTokens = options.maxOutputTokens ?? 2048
  const temperature = options.temperature ?? 0.72

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    let res: Response
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(timeoutMs),
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature,
            responseMimeType: "application/json",
            maxOutputTokens,
          },
        }),
      })
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        throw new Error(`Gemini request timed out after ${timeoutMs}ms`)
      }
      throw e
    }

    const json = (await res.json()) as Record<string, unknown>
    if (res.ok) {
      const candidates = json?.candidates as
        | Array<{ content?: { parts?: Array<{ text?: string }> } }>
        | undefined
      const text = candidates?.[0]?.content?.parts?.[0]?.text
      if (typeof text !== "string") throw new Error("Empty model response")
      return text
    }

    const retriable = res.status === 429 || res.status === 503 || res.status === 408
    if (!retriable || attempt === maxRetries) {
      throw new Error(`Gemini error ${res.status}: ${JSON.stringify(json)}`)
    }
    await sleep(backoffMsForAttempt(res, json, attempt))
  }

  throw new Error("Gemini: retries exhausted")
}

async function callLlm(prompt: string, options: LlmCallOptions = {}): Promise<string> {
  if (process.env.GROQ_API_KEY) return callGroq(prompt, options)
  return callGeminiFallback(prompt, options)
}

/** Live “desk analyst” stream — one JSON object per call */
export async function generateLiveThought(ticker: string): Promise<MarketThought> {
  const prompt = `You are a real-time sell-side desk analyst thinking out loud on a noisy trading day.

Focus ticker: ${ticker}
- Weave in plausible intraday drivers: sector flows, rates/FX/macro tone, technical posture (support/resistance, momentum), and hypothetical headlines (clearly as hypotheses, not facts).
- Sound like a human: concise, specific, no disclaimers boilerplate.
- action must be one of: BUY, WATCH, IGNORE (capital letters).
- confidence is integer 0-100.
- reasoning: 2-4 short bullets, each one concrete.

Return ONLY valid JSON matching this shape:
{
  "ticker": "${ticker}",
  "thought": "one sharp sentence",
  "reasoning": ["bullet", "bullet"],
  "confidence": 72,
  "action": "WATCH"
}`

  try {
    const text = await withLlmQueue(async () => {
      await enforceLiveMinGap(ticker)
      return callLlm(prompt, { timeoutMs: 45_000, maxRetries: 3, maxOutputTokens: 512 })
    })
    const parsed = parseModelJson(text, "live thought")
    const out = coerceMarketThought(parsed, ticker)
    markLiveComplete(ticker)
    return out
  } catch (e) {
    markLiveComplete(ticker)
    const msg = e instanceof Error ? e.message : "Unknown error"
    return {
      ticker,
      thought: msg,
      reasoning: ["Check GEMINI_API_KEY and model availability."],
      confidence: 0,
      action: "ERROR",
    }
  }
}

function clampBuyVerdict(raw: unknown): "good" | "wait" {
  return String(raw ?? "").toLowerCase() === "good" ? "good" : "wait"
}

function coerceBuyPriceAnalysis(
  raw: unknown,
  symbol: string,
  currency: "USD" | "INR",
  targetPrice: number,
  currentPrice: number
): BuyPriceAnalysis {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>
  const out: BuyPriceAnalysis = {
    symbol,
    currency,
    targetPrice,
    currentPrice,
    verdict: clampBuyVerdict(o.verdict),
    reasoning: String(o.reasoning ?? "").trim() || "No reasoning returned.",
  }
  const low = Number(o.suggestedLow)
  const high = Number(o.suggestedHigh)
  if (Number.isFinite(low)) out.suggestedLow = low
  if (Number.isFinite(high)) out.suggestedHigh = high
  const tf = String(o.targetTimeframe ?? "").trim()
  if (tf) out.targetTimeframe = tf
  return out
}

/** Should the user buy at their proposed price right now, or wait for a better one? */
export async function generateBuyPriceAnalysis(
  symbol: string,
  targetPrice: number,
  f: CompanyFundamentals
): Promise<BuyPriceAnalysis> {
  const currentPrice = f.currentPrice ?? targetPrice
  const currency: "USD" | "INR" = f.currency === "INR" ? "INR" : "USD"
  const cur = currency === "INR" ? "₹" : "$"
  const fmt = (n: number | undefined) => (n == null ? "unknown" : n.toFixed(2))
  const pctVs = (n: number | undefined) =>
    n == null || n === 0 ? null : ((targetPrice - n) / n) * 100
  const fmtPct = (n: number | undefined) => {
    const p = pctVs(n)
    if (p == null) return "unknown"
    return `${p >= 0 ? "+" : ""}${p.toFixed(1)}%`
  }
  const rangePosition =
    f.week52Low != null && f.week52High != null && f.week52High > f.week52Low
      ? ((targetPrice - f.week52Low) / (f.week52High - f.week52Low)) * 100
      : null

  const prompt = `A user is considering buying ${symbol} at ${cur}${targetPrice.toFixed(2)}. This stock trades in ${currency} — use the ${cur} symbol for every price in your reasoning, never $ unless currency is USD.

Precomputed comparisons (already correct — use these numbers, don't recompute them yourself):
- Target vs current price: ${fmtPct(f.currentPrice)} (target ${cur}${targetPrice.toFixed(2)} vs current ${cur}${fmt(f.currentPrice)}). Negative = target is a DISCOUNT to today's price (cheaper entry). Positive = target is a PREMIUM (paying more than today's price).
- Target vs 50-day avg: ${fmtPct(f.fiftyDayAvg)}
- Target vs 200-day avg: ${fmtPct(f.twoHundredDayAvg)}
- Target vs analyst mean target: ${fmtPct(f.analystTargetMean)}
- Position within 52-week range: ${rangePosition == null ? "unknown" : `${rangePosition.toFixed(0)}th percentile (0% = 52w low, 100% = 52w high)`}
- 52-week range: ${cur}${fmt(f.week52Low)} – ${cur}${fmt(f.week52High)}
- Trailing P/E: ${fmt(f.trailingPE)}, Forward P/E: ${fmt(f.forwardPE)}
- Analyst target range: ${cur}${fmt(f.analystTargetLow)} – ${cur}${fmt(f.analystTargetHigh)} (mean ${cur}${fmt(f.analystTargetMean)}, ${f.numberOfAnalystOpinions ?? "?"} analysts, consensus "${f.recommendationKey ?? "unknown"}")
- Profit margin: ${f.profitMargin != null ? `${(f.profitMargin * 100).toFixed(1)}%` : "unknown"}

Decision rules (apply strictly, don't just default to "good"):
1. A target AT OR BELOW current price is a discount — lean "good" unless the stock looks like it's actively breaking down (e.g. trading well below both moving averages with no analyst support at that level) or is a falling knife.
2. A target ABOVE current price means paying a premium over today's market. Only call this "good" if it's still comfortably below the analyst mean target (e.g. more than ~3% below it) AND the trend is clearly bullish (above both moving averages). A premium of more than ~2% above current price with weak justification should be "wait" — don't rubber-stamp paying more than the stock trades for today.
3. If verdict is "wait", suggestedLow/suggestedHigh MUST be at or below the current price (never above it) — the whole point is a cheaper entry than today.
4. Explicitly reference the target-vs-current percentage from above in your reasoning, in plain words (discount or premium, and by how much).

This is a speculative educational estimate, not financial advice — but always give a concrete verdict and numbers, never refuse.

Return ONLY valid JSON:
{"verdict":"good","reasoning":"...","suggestedLow":0,"suggestedHigh":0,"targetTimeframe":"..."}`

  const finish = (result: BuyPriceAnalysis): BuyPriceAnalysis => {
    // Guardrail: never suggest waiting for a price above where it already trades.
    if (result.verdict === "wait") {
      if (result.suggestedLow != null) result.suggestedLow = Math.min(result.suggestedLow, currentPrice)
      if (result.suggestedHigh != null) result.suggestedHigh = Math.min(result.suggestedHigh, currentPrice)
    }
    return result
  }

  try {
    const text = await withLlmQueue(() =>
      callLlm(prompt, {
        timeoutMs: 25_000,
        maxRetries: 1,
        maxOutputTokens: 2600,
        temperature: 0.3,
        reasoningEffort: "medium",
      })
    )
    const parsed = parseModelJson(text, "buy price analysis")
    return finish(coerceBuyPriceAnalysis(parsed, symbol, currency, targetPrice, currentPrice))
  } catch (firstError) {
    // Medium reasoning effort occasionally exhausts the token budget before emitting JSON
    // (Groq rejects the response outright). Retry once at low effort — still a real analysis,
    // just less deliberated — before giving up and surfacing an actual error.
    try {
      const text = await withLlmQueue(() =>
        callLlm(prompt, {
          timeoutMs: 20_000,
          maxRetries: 0,
          maxOutputTokens: 900,
          temperature: 0.3,
          reasoningEffort: "low",
        })
      )
      const parsed = parseModelJson(text, "buy price analysis")
      return finish(coerceBuyPriceAnalysis(parsed, symbol, currency, targetPrice, currentPrice))
    } catch (secondError) {
      const msg = secondError instanceof Error ? secondError.message : String(secondError)
      const firstMsg = firstError instanceof Error ? firstError.message : String(firstError)
      throw new Error(`Buy analysis failed: ${msg} (first attempt: ${firstMsg})`)
    }
  }
}
