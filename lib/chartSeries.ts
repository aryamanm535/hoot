import type { ChartPoint, ChartTimeframe } from "./types"

function hashSeed(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h) + 1
}

/** Deterministic pseudo-random in [0, 1) from seed + index */
function prng(seed: number, i: number): number {
  const x = Math.sin(seed * 9999 + i * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

function intradayLabel(i: number): string {
  const minutes = 9 * 60 + 30 + i * 5
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

function quarterLabel(i: number): string {
  const baseYear = 2021
  const y = baseYear + Math.floor(i / 4)
  const q = (i % 4) + 1
  return `${y} Q${q}`
}

type TfSpec = { points: number; vol: number; drift: number; wave: number; cycle: number }

const TF: Record<ChartTimeframe, TfSpec> = {
  "1D": { points: 48, vol: 0.35, drift: 0.02, wave: 0.08, cycle: 1 },
  // Multi-day horizons: use a higher sampling density so the chart feels "alive".
  // Requirement: 1M should have ~3 samples per trading day.
  "1W": { points: 15, vol: 1.1, drift: 0.12, wave: 0.22, cycle: 1.2 }, // 5 trading days * 3
  "1M": { points: 66, vol: 0.85, drift: 0.07, wave: 0.14, cycle: 2.5 }, // 22 trading days * 3
  "3M": { points: 66, vol: 1.4, drift: 0.18, wave: 0.35, cycle: 2 }, // ~1 sample / trading day
  "1Y": { points: 52, vol: 2.8, drift: 0.35, wave: 0.75, cycle: 1.8 }, // weekly
  "5Y": { points: 60, vol: 5.5, drift: 0.8, wave: 1.3, cycle: 2.2 }, // monthly
}

function labelFor(tf: ChartTimeframe, i: number): string {
  const now = new Date()
  switch (tf) {
    case "1D":
      return intradayLabel(i)
    case "1W":
    case "1M":
      return `D${Math.floor(i / 3) + 1}`
    case "3M": {
      const d = new Date(now)
      d.setDate(d.getDate() - (65 - i))
      return `${MONTHS[d.getMonth()]} ${d.getDate()}`
    }
    case "1Y": {
      const d = new Date(now)
      d.setDate(d.getDate() - (51 - i) * 7)
      return MONTHS[d.getMonth()] ?? `W${i + 1}`
    }
    case "5Y": {
      const d = new Date(now)
      d.setMonth(d.getMonth() - (59 - i))
      return `${MONTHS[d.getMonth()]} '${String(d.getFullYear()).slice(-2)}`
    }
    default:
      return String(i)
  }
}

/**
 * Simulated price path per ticker + horizon (no external API).
 * Volatility / drift scale with timeframe so longer horizons swing more in % terms.
 */
export function buildSimulatedSeries(ticker: string, timeframe: ChartTimeframe): ChartPoint[] {
  const seed = hashSeed(`${ticker}|${timeframe}`)
  const spec = TF[timeframe]
  // "More like real tickers": base is roughly log-uniform (penny → mega-cap prices),
  // deterministic per ticker, and stable across timeframes.
  const baseU = prng(hashSeed(ticker), 1)
  const base = Math.round(Math.exp(Math.log(8) + baseU * (Math.log(1500) - Math.log(8))) * 100) / 100
  const driftSign = ((seed % 17) - 8) * 0.001
  const cycleLen = spec.cycle * (3 + (seed % 5))

  let price = base
  let ret = 0 // AR-ish return component for jaggedness
  const out: ChartPoint[] = []

  for (let i = 0; i < spec.points; i++) {
    // Market-like: heteroskedastic noise + occasional jumps + autocorrelated returns
    const u = prng(seed, i * 17 + timeframe.length)
    const v = prng(seed, i * 29 + 7)
    const w = prng(seed, i * 41 + 13)

    const wave = Math.sin(i / cycleLen) * spec.wave * (2 + (seed % 3) * 0.15)
    const vol = spec.vol * (0.7 + 0.9 * Math.abs(Math.sin(i / (1.7 + (seed % 5) * 0.25))))
    const noise = (u - 0.5) * vol

    // Rare jump events (earnings-like gaps), probability scales with timeframe
    const jumpP = timeframe === "1D" ? 0.06 : timeframe === "1W" ? 0.08 : timeframe === "1M" ? 0.07 : 0.05
    const jump = w < jumpP ? (v - 0.5) * vol * (timeframe === "5Y" ? 10 : timeframe === "1Y" ? 6 : 4) : 0

    // AR return: keeps it jagged but coherent
    ret = 0.45 * ret + noise + jump
    const drift = spec.drift * driftSign * (timeframe === "1D" ? 6 : timeframe === "1W" ? 10 : 14)

    price += drift + wave + ret
    price = Math.max(12, price)

    out.push({
      time: i,
      label: labelFor(timeframe, i),
      price: Math.round(price * 100) / 100,
    })
  }

  return out
}
