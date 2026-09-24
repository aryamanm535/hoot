"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  LineChart,
  Line,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
  ReferenceDot,
  CartesianGrid,
  useOffset,
  usePlotArea,
  useXAxisScale,
  useYAxisScale,
  type ChartOffset,
} from "recharts"
import { explainDateLabel } from "@/lib/chartDateLabels"
import { detectChartEvents } from "@/lib/events"
import { convertCurrency, currencySymbol, type Currency } from "@/lib/currency"
import type {
  ChartEvent,
  ChartPoint,
  ChartSelectionRange,
  ChartTimeframe,
} from "@/lib/types"

const PLOT_FALLBACK = { L: 52, R: 22, T: 18, B: 42 }
const CHART_INNER_H = 420
const CHART_MIN_H = 300

function buildSelection(
  ticker: string,
  timeframe: ChartTimeframe,
  data: ChartPoint[],
  startIndex: number,
  endIndex: number
): ChartSelectionRange {
  const n = data.length
  if (n === 0) {
    return {
      ticker,
      timeframe,
      startIndex: 0,
      endIndex: 0,
      startLabel: "",
      endLabel: "",
      startLabelFull: "",
      endLabelFull: "",
      startPrice: 0,
      endPrice: 0,
      pctChange: 0,
    }
  }
  let lo = Math.max(0, Math.min(startIndex, endIndex, n - 1))
  let hi = Math.max(0, Math.max(startIndex, endIndex, 0))
  lo = Math.min(lo, hi)
  if (lo === hi && n > 1) {
    lo = Math.max(0, lo - 1)
    hi = Math.min(n - 1, hi + 1)
  }
  const a = data[lo]!
  const b = data[hi]!
  const pct = a.price !== 0 ? ((b.price - a.price) / a.price) * 100 : 0
  return {
    ticker,
    timeframe,
    startIndex: lo,
    endIndex: hi,
    startLabel: a.label,
    endLabel: b.label,
    startLabelFull: explainDateLabel(timeframe, lo, a),
    endLabelFull: explainDateLabel(timeframe, hi, b),
    startPrice: a.price,
    endPrice: b.price,
    pctChange: Math.round(pct * 100) / 100,
  }
}

function xToIndex(clientX: number, rect: DOMRect, n: number, plot: ChartOffset | null): number {
  if (n <= 1) return 0
  const insetL = plot?.left ?? PLOT_FALLBACK.L
  const insetR = plot?.right ?? PLOT_FALLBACK.R
  const plotLeft = rect.left + insetL
  const plotRight = rect.right - insetR
  const w = Math.max(1, plotRight - plotLeft)
  const t = (clientX - plotLeft) / w
  const clamped = Math.max(0, Math.min(1, t))
  return Math.round(clamped * (n - 1))
}

function PlotOffsetSync({ onOffset }: { onOffset: (o: ChartOffset) => void }) {
  const off = useOffset()
  useEffect(() => {
    if (off) onOffset(off)
  }, [off, onOffset])
  return null
}

function formatPx(v: number): string {
  const a = Math.abs(v)
  const d = a < 1 ? 4 : a < 10 ? 3 : 2
  return v.toFixed(d)
}

function formatVol(v: number | undefined): string {
  if (v == null || !Number.isFinite(v)) return "—"
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`
  return String(v)
}

function ChartCrosshairG({
  data,
  hoverIndex,
  hoverXPx,
  show,
}: {
  data: ChartPoint[]
  hoverIndex: number | null
  hoverXPx: number | null
  show: boolean
}) {
  const area = usePlotArea()
  const yScale = useYAxisScale(0)
  const xScale = useXAxisScale(0)
  if (!show || hoverIndex == null || !area || !yScale || !xScale) return null
  const p = data[hoverIndex]
  if (!p) return null
  const yPix = yScale(p.price)
  if (yPix == null || Number.isNaN(Number(yPix))) return null
  const snapped = xScale(p.time)
  const rawX = hoverXPx ?? (typeof snapped === "number" ? snapped : null)
  if (rawX == null || Number.isNaN(rawX)) return null
  const left = area.x
  const right = area.x + area.width
  const top = area.y
  const bottom = area.y + area.height
  const xLine = Math.max(left, Math.min(right, rawX))
  return (
    <g className="pointer-events-none" aria-hidden>
      <line
        x1={xLine}
        x2={xLine}
        y1={top}
        y2={bottom}
        stroke="#64748b"
        strokeOpacity={0.4}
        strokeDasharray="3 6"
      />
      <circle cx={xLine} cy={yPix} r={5} fill="#10b981" fillOpacity={0.25} />
      <circle cx={xLine} cy={yPix} r={3} fill="#34d399" />
    </g>
  )
}

type Props = {
  data: ChartPoint[]
  ticker: string
  timeframe: ChartTimeframe
  mode: "explain" | "draw"
  detail?: "line" | "candles"
  onSelect: (range: ChartSelectionRange) => void
  onLineDrawn?: () => void
  busy?: boolean
  /** Currently loading or null. */
  activeEventId?: string | null
  /** Native currency the raw `data` prices are denominated in. */
  nativeCurrency?: Currency
  /** Currency to render prices as — converted from nativeCurrency using usdInrRate. */
  displayCurrency?: Currency
  usdInrRate?: number | null
}

function formatTimeSpan(
  tf: ChartTimeframe,
  data: ChartPoint[],
  a: number,
  b: number
): string {
  const lo = Math.min(a, b)
  const hi = Math.max(a, b)
  const diff = hi - lo
  const ptA = data[lo]
  const ptB = data[hi]
  if (ptA?.ts != null && ptB?.ts != null) {
    const ms = Math.abs(ptB.ts - ptA.ts) * 1000
    const mins = Math.round(ms / 60000)
    if (mins < 60) return `${mins} min`
    const hours = Math.round(mins / 60)
    if (hours < 48) return `${hours}h`
    const days = Math.round(hours / 24)
    if (days < 60) return `${days}d`
    const months = Math.round(days / 30)
    if (months < 24) return `${months}mo`
    return `${(days / 365).toFixed(1)}y`
  }
  // Simulated: translate bar count per timeframe.
  switch (tf) {
    case "1D":
      return `${diff * 5} min`
    case "1W":
      return diff >= 3 ? `${Math.round(diff / 3)}d` : `${diff} bars`
    case "1M":
      return diff >= 3 ? `${Math.round(diff / 3)}d` : `${diff} bars`
    case "3M":
      return `${diff}d`
    case "1Y":
      return diff >= 4 ? `${Math.round(diff / 4)}mo` : `${diff}wk`
    case "5Y":
      return diff >= 12 ? `${Math.round(diff / 12)}y` : `${diff}mo`
    default:
      return `${diff} bars`
  }
}

function CandlesLayer({
  data,
  show,
}: {
  data: ChartPoint[]
  show: boolean
}) {
  const area = usePlotArea()
  const yScale = useYAxisScale(0)
  const xScale = useXAxisScale(0)
  if (!show || !area || !yScale || !xScale) return null
  const n = data.length
  if (n < 2) return null
  const step = area.width / n
  const bodyW = Math.max(1.5, Math.min(12, step * 0.66))
  return (
    <g aria-hidden>
      {data.map((p, i) => {
        const o = p.open ?? p.price
        const c = p.close ?? p.price
        const h = p.high ?? Math.max(o, c)
        const l = p.low ?? Math.min(o, c)
        const x = xScale(p.time)
        const cx = typeof x === "number" ? x : area.x + step * (i + 0.5)
        if (Number.isNaN(cx)) return null
        const yH = yScale(h)
        const yL = yScale(l)
        const yO = yScale(o)
        const yC = yScale(c)
        if ([yH, yL, yO, yC].some((v) => v == null || Number.isNaN(Number(v)))) return null
        const up = c >= o
        const color = up ? "#10b981" : "#f43f5e"
        const top = Math.min(Number(yO), Number(yC))
        const bottom = Math.max(Number(yO), Number(yC))
        const bodyH = Math.max(1, bottom - top)
        return (
          <g key={`cn-${i}`}>
            <line
              x1={cx}
              x2={cx}
              y1={Number(yH)}
              y2={Number(yL)}
              stroke={color}
              strokeWidth={1}
              strokeOpacity={0.9}
            />
            <rect
              x={cx - bodyW / 2}
              y={top}
              width={bodyW}
              height={bodyH}
              fill={color}
              fillOpacity={up ? 0.85 : 0.9}
              stroke={color}
              strokeWidth={0.6}
            />
          </g>
        )
      })}
    </g>
  )
}

type DrawLine = { id: string; a: number; b: number }
type HoverData = {
  idx: number
  xPx: number
  yPx: number
  containerRect: DOMRect
}

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export default function StockChart({
  data: rawData,
  ticker,
  timeframe,
  mode,
  detail = "line",
  onSelect,
  onLineDrawn,
  busy,
  activeEventId,
  nativeCurrency = "USD",
  displayCurrency = "USD",
  usdInrRate,
}: Props) {
  const currencySym = currencySymbol(displayCurrency)
  const fxFactor = useMemo(
    () => convertCurrency(1, nativeCurrency, displayCurrency, usdInrRate ?? 1),
    [nativeCurrency, displayCurrency, usdInrRate]
  )
  const data = useMemo(() => {
    if (fxFactor === 1) return rawData
    return rawData.map((p) => ({
      ...p,
      price: p.price * fxFactor,
      open: p.open != null ? p.open * fxFactor : undefined,
      high: p.high != null ? p.high * fxFactor : undefined,
      low: p.low != null ? p.low * fxFactor : undefined,
      close: p.close != null ? p.close * fxFactor : undefined,
    }))
  }, [rawData, fxFactor])
  const plotRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ a: number; b: number } | null>(null)
  const [drag, setDrag] = useState<{ a: number; b: number } | null>(null)
  const [committed, setCommitted] = useState<{ lo: number; hi: number } | null>(null)
  const [drawLines, setDrawLines] = useState<DrawLine[]>([])
  const [drawStart, setDrawStart] = useState<number | null>(null)
  const [drawHover, setDrawHover] = useState<number | null>(null)
  const [hover, setHover] = useState<HoverData | null>(null)
  const [plotOffset, setPlotOffset] = useState<ChartOffset | null>(null)

  const onPlotOffset = useCallback((o: ChartOffset) => setPlotOffset(o), [])

  const events = useMemo(() => detectChartEvents(data, timeframe, 5), [data, timeframe])

  const xTickIndices = useMemo(() => {
    const n = data.length
    if (n === 0) return [] as number[]
    const targets: Record<ChartTimeframe, number> = {
      "1D": 6,
      "1W": 6,
      "1M": 6,
      "3M": 6,
      "1Y": 6,
      "5Y": 6,
    }
    const want = Math.min(targets[timeframe] ?? 6, n)
    if (want <= 1) return [0]
    const out: number[] = []
    for (let i = 0; i < want; i++) {
      const idx = Math.round((i / (want - 1)) * (n - 1))
      if (out[out.length - 1] !== idx) out.push(idx)
    }
    return out
  }, [data.length, timeframe])

  useEffect(() => {
    setCommitted(null)
    setDrag(null)
    dragRef.current = null
    setDrawLines([])
    setDrawStart(null)
    setDrawHover(null)
    setHover(null)
  }, [data, ticker, timeframe])

  const commitRange = useCallback(
    (startIndex: number, endIndex: number) => {
      if (data.length === 0) return
      const sel = buildSelection(ticker, timeframe, data, startIndex, endIndex)
      setCommitted({ lo: sel.startIndex, hi: sel.endIndex })
      onSelect(sel)
    },
    [data, onSelect, ticker, timeframe]
  )

  const finishDrag = useCallback(() => {
    const d = dragRef.current
    if (!d || data.length === 0) return
    dragRef.current = null
    setDrag(null)
    commitRange(d.a, d.b)
  }, [data, commitRange])

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (busy || data.length === 0) return
    const el = plotRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = e.clientX
    const insetL = plotOffset?.left ?? PLOT_FALLBACK.L
    const insetR = plotOffset?.right ?? PLOT_FALLBACK.R
    if (x < rect.left + insetL || x > rect.right - insetR) return
    const i = xToIndex(x, rect, data.length, plotOffset)
    if (mode === "draw") {
      if (drawStart == null) {
        setDrawStart(i)
        setDrawHover(i)
        try {
          e.currentTarget.setPointerCapture(e.pointerId)
        } catch {
          /* ignore */
        }
      } else {
        const a = drawStart
        const b = i
        setDrawLines((prev) => [...prev, { id: uid(), a, b }].slice(-12))
        setDrawStart(null)
        setDrawHover(null)
        onLineDrawn?.()
      }
      return
    }
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
    const next = { a: i, b: i }
    dragRef.current = next
    setDrag(next)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (data.length === 0) return
    const el = plotRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const i = xToIndex(e.clientX, rect, data.length, plotOffset)
    const insetL = plotOffset?.left ?? PLOT_FALLBACK.L
    const insetR = plotOffset?.right ?? PLOT_FALLBACK.R
    const plotLeft = rect.left + insetL
    const plotRight = rect.right - insetR
    const xClamped = Math.max(plotLeft, Math.min(plotRight, e.clientX))
    // Compute Y pixel for hover tooltip positioning.
    const p = data[i]
    const priceMin = Math.min(...data.map((d) => d.price))
    const priceMax = Math.max(...data.map((d) => d.price))
    const span = priceMax - priceMin || 1
    const pad = span * 0.06
    const yMin = priceMin - pad
    const yMax = priceMax + pad
    const yRange = yMax - yMin || 1
    const plotTop = rect.top + (plotOffset?.top ?? PLOT_FALLBACK.T)
    const plotBottom = rect.bottom - (plotOffset?.bottom ?? PLOT_FALLBACK.B)
    const plotH = plotBottom - plotTop
    const yPix = p ? plotTop + (1 - (p.price - yMin) / yRange) * plotH : 0

    setHover({
      idx: i,
      xPx: xClamped - rect.left,
      yPx: yPix - rect.top,
      containerRect: rect,
    })
    if (mode === "draw") {
      if (drawStart != null) setDrawHover(i)
      return
    }
    if (dragRef.current === null) return
    const next = { a: dragRef.current.a, b: i }
    dragRef.current = next
    setDrag(next)
  }

  const onPointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (mode === "draw") {
      if (drawStart != null && drawHover != null && Math.abs(drawHover - drawStart) >= 1) {
        const a = drawStart
        const b = drawHover
        setDrawLines((prev) => [...prev, { id: uid(), a, b }].slice(-12))
        setDrawStart(null)
        setDrawHover(null)
        onLineDrawn?.()
        try {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId)
          }
        } catch {
          /* ignore */
        }
      }
      return
    }
    if (dragRef.current === null) return
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }
    } catch {
      /* ignore */
    }
    finishDrag()
  }

  const lo = drag ? Math.min(drag.a, drag.b) : committed?.lo ?? 0
  const hi = drag ? Math.max(drag.a, drag.b) : committed?.hi ?? Math.max(0, data.length - 1)
  const x0 = data[lo]?.time ?? 0
  const x1 = data[hi]?.time ?? x0

  const prices = data.map((d) => d.price)
  const dMin = prices.length ? Math.min(...prices) : 0
  const dMax = prices.length ? Math.max(...prices) : 0
  const span = dMax - dMin || Math.abs(dMax) * 0.02 || 1
  const pad = span * 0.06
  const yMin = dMin - pad
  const yMax = dMax + pad

  const first = data[0]?.price ?? 0
  const last = data[data.length - 1]?.price ?? 0
  const trend = last >= first ? "up" : "down"
  const trendColor = trend === "up" ? "#10b981" : "#f43f5e"
  const trendGlow = trend === "up" ? "rgba(16,185,129,0.35)" : "rgba(244,63,94,0.35)"

  const hoverPoint = hover ? data[hover.idx] : null
  const prevPoint = hover && hover.idx > 0 ? data[hover.idx - 1] : null
  const barPct =
    hoverPoint && prevPoint && prevPoint.price > 0
      ? ((hoverPoint.price - prevPoint.price) / prevPoint.price) * 100
      : 0
  const sessionPct =
    hoverPoint && first > 0 ? ((hoverPoint.price - first) / first) * 100 : 0

  return (
    <div className="flex flex-col gap-3">
      <div
        role="application"
        aria-label={`Price chart (${timeframe}) — ${mode === "draw" ? "draw mode" : "drag-select explain mode"}`}
        className="relative w-full min-w-0 overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-b from-[#0d1220] to-[#0a0e1a] p-4 shadow-[0_20px_60px_-20px_rgba(16,185,129,0.25)]"
      >
        <AnimatePresence>
          {busy ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex cursor-wait items-center justify-center rounded-3xl bg-black/55 backdrop-blur-sm"
            >
              <div className="flex items-center gap-3 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-5 py-2.5 text-sm font-medium text-emerald-100">
                <span className="inline-block h-2 w-2 animate-ping rounded-full bg-emerald-400" />
                Reasoning through this move…
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div
          ref={plotRef}
          className="relative w-full min-w-0"
          style={{ height: CHART_INNER_H, minHeight: CHART_INNER_H }}
        >
          {mode === "draw" ? (
            <div className="absolute left-2 top-2 z-30 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setDrawLines([])
                  setDrawStart(null)
                  setDrawHover(null)
                }}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-slate-200 backdrop-blur hover:border-emerald-400/40 hover:text-emerald-200"
              >
                Clear lines
              </button>
            </div>
          ) : null}
          <ResponsiveContainer
            width="100%"
            height="100%"
            minWidth={0}
            minHeight={CHART_MIN_H}
            initialDimension={{ width: 800, height: CHART_INNER_H }}
            debounce={32}
          >
            <AreaChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 24 }}>
              <PlotOffsetSync onOffset={onPlotOffset} />
              <defs>
                <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={trendColor} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={trendColor} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="priceStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={trendColor} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={trendColor} stopOpacity={1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 8" stroke="rgba(148,163,184,0.09)" vertical={false} />
              <XAxis
                dataKey="time"
                ticks={xTickIndices}
                interval={0}
                tick={{ fill: "#94a3b8", fontSize: 11, fontFamily: "var(--font-geist-mono)" }}
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                tickFormatter={(v: number) => {
                  const raw = data[v]?.label ?? String(v)
                  const prevIdx = xTickIndices[xTickIndices.indexOf(v) - 1]
                  if (prevIdx != null && data[prevIdx]?.label === raw) return ""
                  return raw
                }}
              />
              <YAxis
                domain={[yMin, yMax]}
                tick={{ fill: "#64748b", fontSize: 11, fontFamily: "var(--font-geist-mono)" }}
                tickFormatter={(v: number) => formatPx(v)}
                tickLine={false}
                axisLine={false}
                width={52}
                orientation="right"
              />
              {data.length > 0 && (committed || drag) ? (
                <ReferenceArea
                  x1={x0}
                  x2={x1}
                  stroke={trendColor}
                  strokeOpacity={drag ? 0.65 : 0.35}
                  fill={trendColor}
                  fillOpacity={drag ? 0.12 : 0.06}
                  ifOverflow="visible"
                />
              ) : null}
              <Area
                type="monotone"
                dataKey="price"
                stroke={detail === "candles" ? "transparent" : "url(#priceStroke)"}
                strokeWidth={2.5}
                fill={detail === "candles" ? "transparent" : "url(#priceFill)"}
                dot={false}
                activeDot={false}
                isAnimationActive={detail !== "candles"}
                animationDuration={700}
              />
              <CandlesLayer data={data} show={detail === "candles"} />

              {events.map((ev) => {
                const p = data[ev.index]
                if (!p) return null
                const color =
                  ev.kind === "drop"
                    ? "#f43f5e"
                    : ev.kind === "spike"
                    ? "#10b981"
                    : ev.kind === "volume"
                    ? "#8b5cf6"
                    : "#f59e0b"
                const isActive = activeEventId === ev.id
                return (
                  <ReferenceDot
                    key={ev.id}
                    x={p.time}
                    y={p.price}
                    r={isActive ? 9 : 6}
                    fill={color}
                    fillOpacity={0.85}
                    stroke="#0a0e1a"
                    strokeWidth={2}
                    ifOverflow="visible"
                  />
                )
              })}

              {drawLines.map((ln) => {
                const a = data[Math.max(0, Math.min(data.length - 1, ln.a))]!
                const b = data[Math.max(0, Math.min(data.length - 1, ln.b))]!
                const pct = a.price !== 0 ? ((b.price - a.price) / a.price) * 100 : 0
                return (
                  <ReferenceLine
                    key={ln.id}
                    segment={[
                      { x: a.time, y: a.price },
                      { x: b.time, y: b.price },
                    ]}
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    strokeOpacity={0.8}
                    ifOverflow="discard"
                    label={{
                      value: `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`,
                      position: "insideTopRight",
                      fill: "#c4b5fd",
                      fontSize: 11,
                    }}
                  />
                )
              })}
              {mode === "draw" && drawStart != null && drawHover != null ? (() => {
                const a = data[Math.max(0, Math.min(data.length - 1, drawStart))]!
                const b = data[Math.max(0, Math.min(data.length - 1, drawHover))]!
                return (
                  <ReferenceLine
                    segment={[
                      { x: a.time, y: a.price },
                      { x: b.time, y: b.price },
                    ]}
                    stroke="#a78bfa"
                    strokeWidth={2}
                    strokeOpacity={0.4}
                    strokeDasharray="6 6"
                    ifOverflow="discard"
                  />
                )
              })() : null}
              <ChartCrosshairG
                data={data}
                hoverIndex={hover?.idx ?? null}
                hoverXPx={hover?.xPx ?? null}
                show={Boolean(!busy && hover && data[hover.idx])}
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* Event marker click overlays (SVG dots can't easily capture clicks through the overlay layer) */}
          <div className="pointer-events-none absolute inset-0 z-10">
            {events.map((ev) => {
              const p = data[ev.index]
              if (!p || !plotOffset) return null
              const rect = plotRef.current?.getBoundingClientRect()
              if (!rect) return null
              const plotLeft = plotOffset.left ?? PLOT_FALLBACK.L
              const plotRight = (rect.width ?? 0) - (plotOffset.right ?? PLOT_FALLBACK.R)
              const w = Math.max(1, plotRight - plotLeft)
              const xPx = plotLeft + (data.length > 1 ? (ev.index / (data.length - 1)) * w : 0)
              const plotTop = plotOffset.top ?? PLOT_FALLBACK.T
              const plotBottom = (rect.height ?? 0) - (plotOffset.bottom ?? PLOT_FALLBACK.B)
              const plotH = plotBottom - plotTop
              const yRange = yMax - yMin || 1
              const yPx = plotTop + (1 - (p.price - yMin) / yRange) * plotH
              const color =
                ev.kind === "drop"
                  ? "#f43f5e"
                  : ev.kind === "spike"
                  ? "#10b981"
                  : ev.kind === "volume"
                  ? "#8b5cf6"
                  : "#f59e0b"
              return (
                <button
                  key={ev.id}
                  type="button"
                  disabled={busy}
                  onClick={(e) => {
                    e.stopPropagation()
                    commitRange(ev.startIndex, ev.endIndex)
                  }}
                  title={`${ev.label} · click to explain`}
                  style={{
                    position: "absolute",
                    left: xPx - 14,
                    top: yPx - 14,
                    width: 28,
                    height: 28,
                  }}
                  className="pointer-events-auto rounded-full transition-transform hover:scale-125"
                >
                  <span
                    className="pulse-glow block h-full w-full rounded-full"
                    style={{
                      background: color,
                      opacity: 0.25,
                    }}
                  />
                </button>
              )
            })}
          </div>

          {!busy ? (
            <div
              className="absolute inset-0 z-[5] cursor-crosshair touch-none"
              style={{ background: "transparent" }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerEnd}
              onPointerCancel={onPointerEnd}
              onPointerLeave={() => setHover(null)}
            />
          ) : null}

          {/* Floating OHLCV Hover Card */}
          <AnimatePresence>
            {hover && hoverPoint && !busy ? (
              <motion.div
                key="hover-card"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="pointer-events-none absolute z-30"
                style={{
                  left: Math.min(
                    Math.max(10, hover.xPx + 16),
                    (hover.containerRect.width ?? 600) - 220
                  ),
                  top: Math.max(10, hover.yPx - 110),
                }}
              >
                <div className="min-w-[200px] rounded-2xl border border-white/10 bg-[#0a0e1a]/95 p-3 shadow-2xl backdrop-blur-xl">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                      {hoverPoint.label}
                    </div>
                    <div
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        barPct >= 0
                          ? "bg-emerald-400/15 text-emerald-300"
                          : "bg-rose-400/15 text-rose-300"
                      }`}
                    >
                      {barPct >= 0 ? "+" : ""}
                      {barPct.toFixed(2)}%
                    </div>
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <div className="font-mono text-2xl font-semibold text-white">
                      {currencySym}
                      {formatPx(hoverPoint.price)}
                    </div>
                    <div
                      className={`font-mono text-[11px] ${
                        sessionPct >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {sessionPct >= 0 ? "+" : ""}
                      {sessionPct.toFixed(2)}% session
                    </div>
                  </div>
                  {hoverPoint.open != null ||
                  hoverPoint.high != null ||
                  hoverPoint.low != null ? (
                    <div className="mt-2 grid grid-cols-4 gap-1 border-t border-white/5 pt-2 text-center">
                      <div>
                        <div className="text-[9px] uppercase tracking-wider text-slate-500">O</div>
                        <div className="font-mono text-[11px] text-slate-200">
                          {hoverPoint.open != null ? formatPx(hoverPoint.open) : "—"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] uppercase tracking-wider text-slate-500">H</div>
                        <div className="font-mono text-[11px] text-emerald-300">
                          {hoverPoint.high != null ? formatPx(hoverPoint.high) : "—"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] uppercase tracking-wider text-slate-500">L</div>
                        <div className="font-mono text-[11px] text-rose-300">
                          {hoverPoint.low != null ? formatPx(hoverPoint.low) : "—"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] uppercase tracking-wider text-slate-500">C</div>
                        <div className="font-mono text-[11px] text-slate-200">
                          {hoverPoint.close != null ? formatPx(hoverPoint.close) : "—"}
                        </div>
                      </div>
                    </div>
                  ) : null}
                  {hoverPoint.volume != null ? (
                    <div className="mt-2 flex items-center justify-between border-t border-white/5 pt-2">
                      <span className="text-[10px] uppercase tracking-wider text-slate-500">
                        Volume
                      </span>
                      <span className="font-mono text-[11px] text-slate-200">
                        {formatVol(hoverPoint.volume)}
                      </span>
                    </div>
                  ) : null}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Event legend (if any) */}
        {events.length > 0 ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/5 pt-3">
            <span className="text-[10px] uppercase tracking-wider text-slate-500">
              Auto-detected moments
            </span>
            {events.map((ev) => {
              const isDrop = ev.kind === "drop"
              const isSpike = ev.kind === "spike"
              return (
                <button
                  key={ev.id}
                  type="button"
                  disabled={busy}
                  onClick={() => commitRange(ev.startIndex, ev.endIndex)}
                  className={`group flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-all hover:scale-105 ${
                    isDrop
                      ? "border-rose-400/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20"
                      : isSpike
                      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"
                      : "border-violet-400/30 bg-violet-500/10 text-violet-200 hover:bg-violet-500/20"
                  }`}
                >
                  <span className="font-semibold">{ev.emoji}</span>
                  <span>{ev.label}</span>
                  <span className="text-[9px] opacity-70">· {data[ev.index]?.label}</span>
                </button>
              )
            })}
          </div>
        ) : null}
      </div>
      {mode === "draw" && drawLines.length > 0 ? (
        <div className="rounded-2xl border border-violet-400/20 bg-violet-500/5 p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-violet-300">
              Drawn comparisons
            </div>
            <button
              type="button"
              onClick={() => {
                setDrawLines([])
                setDrawStart(null)
                setDrawHover(null)
              }}
              className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-slate-300 hover:border-rose-400/40 hover:text-rose-200"
            >
              Clear all
            </button>
          </div>
          <ul className="flex flex-col gap-1.5">
            {drawLines.map((ln) => {
              const a = data[Math.max(0, Math.min(data.length - 1, ln.a))]!
              const b = data[Math.max(0, Math.min(data.length - 1, ln.b))]!
              const dPct = a.price !== 0 ? ((b.price - a.price) / a.price) * 100 : 0
              const dAbs = b.price - a.price
              const span = formatTimeSpan(timeframe, data, ln.a, ln.b)
              const up = dAbs >= 0
              return (
                <li
                  key={ln.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/[0.03] px-2.5 py-1.5 font-mono text-[11px]"
                >
                  <span className="text-slate-400">
                    {a.label} → {b.label}{" "}
                    <span className="text-slate-500">· {span}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className={up ? "text-emerald-300" : "text-rose-300"}>
                      {up ? "+" : ""}
                      {currencySym}
                      {dAbs.toFixed(2)}
                    </span>
                    <span className={up ? "text-emerald-300" : "text-rose-300"}>
                      {up ? "+" : ""}
                      {dPct.toFixed(2)}%
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setDrawLines((prev) => prev.filter((x) => x.id !== ln.id))
                      }
                      className="rounded-full border border-white/10 px-1.5 text-[10px] text-slate-500 hover:border-rose-400/40 hover:text-rose-200"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}

      <p className="px-1 text-[12px] leading-relaxed text-slate-400">
        {mode === "draw" ? (
          <>
            <span className="text-violet-300">Click two points</span> (or drag between them) to
            compare. Each line shows % move, $ change, and span.
          </>
        ) : (
          <>
            <span className="text-emerald-300">Drag</span> across the chart to ask the AI to explain
            that window — or{" "}
            <span className="text-emerald-300">click a highlighted moment</span> above.
          </>
        )}
      </p>
    </div>
  )
}
