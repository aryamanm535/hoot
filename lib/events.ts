import type { ChartEvent, ChartPoint, ChartTimeframe } from "./types"

const THRESHOLDS: Record<ChartTimeframe, { drop: number; spike: number; window: number }> = {
  "1D": { drop: 0.8, spike: 0.8, window: 3 },
  "1W": { drop: 1.5, spike: 1.5, window: 3 },
  "1M": { drop: 2.5, spike: 2.5, window: 2 },
  "3M": { drop: 3.5, spike: 3.5, window: 2 },
  "1Y": { drop: 5, spike: 5, window: 2 },
  "5Y": { drop: 8, spike: 8, window: 2 },
}

export function detectChartEvents(
  data: ChartPoint[],
  timeframe: ChartTimeframe,
  maxEvents = 5
): ChartEvent[] {
  if (data.length < 4) return []
  const { drop, spike, window } = THRESHOLDS[timeframe]
  const candidates: ChartEvent[] = []

  for (let i = window; i < data.length; i++) {
    const a = data[i - window]!
    const b = data[i]!
    if (a.price <= 0) continue
    const pct = ((b.price - a.price) / a.price) * 100
    if (pct <= -drop) {
      candidates.push({
        id: `drop-${i}`,
        index: i,
        startIndex: i - window,
        endIndex: i,
        kind: "drop",
        magnitudePct: pct,
        label: `${pct.toFixed(1)}% drop`,
        emoji: "↓",
      })
    } else if (pct >= spike) {
      candidates.push({
        id: `spike-${i}`,
        index: i,
        startIndex: i - window,
        endIndex: i,
        kind: "spike",
        magnitudePct: pct,
        label: `+${pct.toFixed(1)}% spike`,
        emoji: "↑",
      })
    }
  }

  // Volume anomalies (if present): flag bars >2.5x median.
  const vols = data.map((d) => d.volume).filter((v): v is number => typeof v === "number" && v > 0)
  if (vols.length > 8) {
    const sorted = [...vols].sort((a, b) => a - b)
    const median = sorted[Math.floor(sorted.length / 2)] || 0
    if (median > 0) {
      for (let i = 1; i < data.length; i++) {
        const v = data[i]?.volume
        if (typeof v === "number" && v > median * 2.5) {
          const a = data[Math.max(0, i - 1)]!
          const b = data[i]!
          const pct = a.price > 0 ? ((b.price - a.price) / a.price) * 100 : 0
          candidates.push({
            id: `vol-${i}`,
            index: i,
            startIndex: Math.max(0, i - 1),
            endIndex: i,
            kind: "volume",
            magnitudePct: pct,
            label: `Volume surge`,
            emoji: "◎",
          })
        }
      }
    }
  }

  // De-dupe nearby events: keep the one with the largest |magnitudePct|.
  candidates.sort((a, b) => Math.abs(b.magnitudePct) - Math.abs(a.magnitudePct))
  const chosen: ChartEvent[] = []
  const minGap = Math.max(2, Math.floor(data.length / 12))
  for (const c of candidates) {
    if (chosen.every((e) => Math.abs(e.index - c.index) >= minGap)) {
      chosen.push(c)
      if (chosen.length >= maxEvents) break
    }
  }
  return chosen.sort((a, b) => a.index - b.index)
}
