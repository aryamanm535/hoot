export type MarketAction = "BUY" | "WATCH" | "IGNORE" | "EXPLAIN" | "ERROR"

export type MarketThought = {
  ticker: string
  thought: string
  reasoning: string[]
  /** Top 2 drivers, ranked by importance */
  topFactors?: Array<{ factor: string; evidence: string }>
  confidence: number
  action: MarketAction
  /** Present for chart-region explanations */
  regionLabel?: string
  /** Optional: next level/catalyst to watch */
  whatToWatch?: string
  /** Optional supporting links (education / references) */
  sources?: Array<{ title: string; url: string }>
}

export type BuyPriceAnalysis = {
  symbol: string
  /** Native trading currency of the stock — "USD" or "INR" (all figures below are in this currency). */
  currency: "USD" | "INR"
  targetPrice: number
  currentPrice: number
  verdict: "good" | "wait"
  reasoning: string
  suggestedLow?: number
  suggestedHigh?: number
  targetTimeframe?: string
}

/** Simulated series horizon (labels + bar count change per range). */
export type ChartTimeframe = "1D" | "1W" | "1M" | "3M" | "1Y" | "5Y"

export const CHART_TIMEFRAMES: { id: ChartTimeframe; short: string; detail: string }[] = [
  { id: "1D", short: "1D", detail: "Intraday · 5m" },
  { id: "1W", short: "1W", detail: "1 wk · 3×/day" },
  { id: "1M", short: "1M", detail: "1 mo · 3×/day" },
  { id: "3M", short: "3M", detail: "1 qtr · daily" },
  { id: "1Y", short: "1Y", detail: "1 yr · weekly" },
  { id: "5Y", short: "5Y", detail: "5 yr · monthly" },
]

export type ChartPoint = {
  /** X index for Recharts (0..n-1) */
  time: number
  label: string
  price: number
  /** Bar time (seconds since epoch) when data comes from Yahoo — used for explain date strings. */
  ts?: number
  /** OHLCV when available (live sources populate these). */
  open?: number
  high?: number
  low?: number
  close?: number
  volume?: number
}

export type ChartEvent = {
  id: string
  index: number
  /** Contiguous window anchoring this event. */
  startIndex: number
  endIndex: number
  kind: "drop" | "spike" | "volatility" | "volume" | "reversal"
  magnitudePct: number
  label: string
  emoji: string
}

export type ChartSelectionRange = {
  ticker: string
  /** Horizon used for this chart (sent to explain API). */
  timeframe: ChartTimeframe
  startIndex: number
  endIndex: number
  startLabel: string
  endLabel: string
  /** Full calendar labels for AI / UI (not the short D1 axis labels). */
  startLabelFull?: string
  endLabelFull?: string
  startPrice: number
  endPrice: number
  pctChange: number
}

