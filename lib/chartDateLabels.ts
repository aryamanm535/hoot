import type { ChartPoint, ChartTimeframe } from "./types"

/** Normalize to last Mon–Fri on or before `d` (local TZ). */
function normalizeToTradingDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(12, 0, 0, 0)
  for (let guard = 0; guard < 14; guard++) {
    const wd = x.getDay()
    if (wd !== 0 && wd !== 6) break
    x.setDate(x.getDate() - 1)
  }
  return x
}

function addTradingDays(d: Date, delta: number): Date {
  const x = new Date(d)
  let n = Math.abs(delta)
  const step = delta >= 0 ? 1 : -1
  let guard = 0
  while (n > 0 && guard < 600) {
    guard++
    x.setDate(x.getDate() + step)
    const wd = x.getDay()
    if (wd !== 0 && wd !== 6) n -= 1
  }
  return x
}

const SLOT_H = [10, 13, 15]
const SLOT_M = [30, 30, 45]

function formatFullDateTime(d: Date): string {
  return d.toLocaleString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function formatFullDate(d: Date): string {
  return d.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

/**
 * Human-readable timestamp for the simulated series index (used in AI prompts / cards).
 * Anchored to `anchor` (defaults to “now”) so labels feel current without persisting dates in chart data.
 */
export function fullDateLabelForSeriesIndex(
  timeframe: ChartTimeframe,
  index: number,
  anchor: Date = new Date()
): string {
  const end = normalizeToTradingDay(anchor)

  switch (timeframe) {
    case "1D": {
      const minutes = 9 * 60 + 30 + index * 5
      const h = Math.floor(minutes / 60)
      const m = minutes % 60
      const dt = new Date(end)
      dt.setHours(h, m, 0, 0)
      return formatFullDateTime(dt)
    }
    case "1W": {
      const dayIdx = Math.floor(index / 3)
      const slot = index % 3
      const dayDate = addTradingDays(end, -(4 - dayIdx))
      const dt = new Date(dayDate)
      dt.setHours(SLOT_H[slot]!, SLOT_M[slot]!, 0, 0)
      return formatFullDateTime(dt)
    }
    case "1M": {
      const dayIdx = Math.floor(index / 3)
      const slot = index % 3
      const dayDate = addTradingDays(end, -(21 - dayIdx))
      const dt = new Date(dayDate)
      dt.setHours(SLOT_H[slot]!, SLOT_M[slot]!, 0, 0)
      return formatFullDateTime(dt)
    }
    case "3M": {
      const dayDate = addTradingDays(end, -(65 - index))
      return formatFullDate(dayDate)
    }
    case "1Y": {
      const dt = addTradingDays(end, -(51 - index) * 7)
      return formatFullDate(dt)
    }
    case "5Y": {
      const dt = new Date(end)
      dt.setMonth(dt.getMonth() - (59 - index))
      return formatFullDate(dt)
    }
    default:
      return String(index)
  }
}

/** Use real bar timestamps when present (Yahoo), else simulated index-based labels. */
export function explainDateLabel(timeframe: ChartTimeframe, index: number, point: ChartPoint): string {
  if (point.ts != null) {
    const d = new Date(point.ts * 1000)
    if (timeframe === "1D" || timeframe === "1W") {
      return formatFullDateTime(d)
    }
    return formatFullDate(d)
  }
  return fullDateLabelForSeriesIndex(timeframe, index)
}
