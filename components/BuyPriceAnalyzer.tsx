"use client"

import { useState } from "react"
import type { BuyPriceAnalysis } from "@/lib/types"
import { convertCurrency, currencySymbol, type Currency } from "@/lib/currency"

export default function BuyPriceAnalyzer({
  symbol,
  nativeCurrency,
  displayCurrency,
  usdInrRate,
}: {
  symbol: string
  nativeCurrency: Currency
  displayCurrency: Currency
  usdInrRate: number | null
}) {
  const [price, setPrice] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<BuyPriceAnalysis | null>(null)

  const sym = currencySymbol(displayCurrency)
  const toDisplay = (amount: number) =>
    convertCurrency(amount, nativeCurrency, displayCurrency, usdInrRate ?? 1)

  const analyze = async () => {
    const enteredPrice = Number(price)
    if (!Number.isFinite(enteredPrice) || enteredPrice <= 0) {
      setError("Enter a valid price")
      return
    }
    if (nativeCurrency !== displayCurrency && !usdInrRate) {
      setError("Exchange rate unavailable — try again in a moment")
      return
    }
    const targetPrice = convertCurrency(enteredPrice, displayCurrency, nativeCurrency, usdInrRate ?? 1)
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch("/api/buy-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, targetPrice }),
      })
      const json = (await res.json()) as BuyPriceAnalysis & { error?: string }
      if (!res.ok || json.error) throw new Error(json.error || "Analysis failed")
      setResult(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed")
    } finally {
      setLoading(false)
    }
  }

  const isGood = result?.verdict === "good"

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        Should I buy {symbol} at…
      </div>
      <div className="mt-2 flex gap-2">
        <div className="relative min-w-0 flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
            {sym}
          </span>
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ""))}
            onKeyDown={(e) => {
              if (e.key === "Enter") void analyze()
            }}
            inputMode="decimal"
            placeholder={displayCurrency === "INR" ? "e.g. 24500" : "e.g. 310.00"}
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-7 pr-3 font-mono text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/50"
          />
        </div>
        <button
          type="button"
          onClick={() => void analyze()}
          disabled={loading || price.trim().length === 0}
          className="shrink-0 rounded-xl brand-gradient-bg px-4 py-2 text-xs font-semibold text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
        >
          {loading ? "Thinking…" : "Analyze"}
        </button>
      </div>

      {error ? (
        <div className="mt-3 rounded-xl border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-[12px] text-rose-200">
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="flex items-center justify-between gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                isGood
                  ? "bg-emerald-400/15 text-emerald-300"
                  : "bg-amber-400/15 text-amber-200"
              }`}
            >
              {isGood ? "Good price" : "Consider waiting"}
            </span>
            <span className="font-mono text-[11px] text-slate-500">
              current {sym}
              {toDisplay(result.currentPrice).toFixed(2)}
            </span>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-slate-200">{result.reasoning}</p>
          {!isGood && (result.suggestedLow != null || result.suggestedHigh != null) ? (
            <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-white/5 pt-3 text-[12px]">
              {result.suggestedLow != null && result.suggestedHigh != null ? (
                <span className="font-mono text-emerald-300">
                  Target range: {sym}
                  {toDisplay(result.suggestedLow).toFixed(2)}–{sym}
                  {toDisplay(result.suggestedHigh).toFixed(2)}
                </span>
              ) : null}
              {result.targetTimeframe ? (
                <span className="text-slate-400">Timeframe: {result.targetTimeframe}</span>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
