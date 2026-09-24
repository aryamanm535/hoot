"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import StockChart from "@/components/StockChart"
import BuyPriceAnalyzer from "@/components/BuyPriceAnalyzer"
import CompanyFinancials from "@/components/CompanyFinancials"
import InlineChat from "@/components/InlineChat"
import LandingView from "@/components/LandingView"
import CompanionOwl from "@/components/CompanionOwl"
import ProfilePanel from "@/components/ProfilePanel"
import Owl from "@/components/Owl"
import TickerSearch from "@/components/TickerSearch"
import { useGameProfile } from "@/hooks/useGameProfile"
import { useSavedStocks } from "@/hooks/useSavedStocks"
import { useUserState } from "@/hooks/useUserState"
import AuthGate, { useCurrentUser } from "@/components/AuthGate"
import { supabase } from "@/lib/supabase"
import { flushUserStateWrites } from "@/lib/userStateWrites"
import { buildSimulatedSeries } from "@/lib/chartSeries"
import { convertCurrency, currencySymbol, nativeCurrencyForSymbol, type Currency } from "@/lib/currency"
import { CHART_TIMEFRAMES, type ChartPoint, type ChartTimeframe } from "@/lib/types"

const PRESETS = ["AAPL", "NVDA", "TSLA", "AMZN", "GOOG"] as const
const INDIA_PRESETS = ["RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS", "ICICIBANK.NS"] as const

type Tab = "home" | "terminal" | "you"

function ResizeHandle({ onPointerDown }: { onPointerDown: (e: React.PointerEvent) => void }) {
  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      onPointerDown={onPointerDown}
      className="group relative h-[7px] shrink-0 cursor-row-resize touch-none border-y border-white/5 bg-black/10 hover:bg-emerald-400/10"
    >
      <div className="absolute left-1/2 top-1/2 h-[3px] w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/15 transition-colors group-hover:bg-emerald-400/60" />
    </div>
  )
}

export default function Home() {
  return <AuthGate><AccountHome /></AuthGate>
}

function AccountHome() {
  const user = useCurrentUser()
  const [tab, setTab, tabReady, tabError] = useUserState<Tab>("tab", "home")
  const [chartSymbol, setChartSymbol, symbolReady, symbolError] = useUserState("chart-symbol", "AAPL")
  const [chartTimeframe, setChartTimeframe, timeframeReady, timeframeError] = useUserState<ChartTimeframe>("chart-timeframe", "1M")
  const [chartDetail, setChartDetail, detailReady, detailError] = useUserState<"line" | "candles">("chart-detail", "line")
  const [displayCurrency, setDisplayCurrency, currencyReady, currencyError] = useUserState<Currency>("display-currency", "USD")
  const [usdInrRate, setUsdInrRate] = useState<number | null>(null)
  const game = useGameProfile()
  const savedStocks = useSavedStocks()
  const initialChartRecorded = useRef(false)
  const initialTimeframeRecorded = useRef(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/fx")
        const json = (await res.json()) as { usdInr?: number }
        if (!cancelled && typeof json.usdInr === "number") setUsdInrRate(json.usdInr)
      } catch {
        /* toggle stays disabled-ish until it succeeds */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // Fixed pixel row heights sized for a 13"/14" MacBook viewport by default; only change via drag.
  const [chatH, setChatH, chatHeightReady, chatHeightError] = useUserState("chat-height", 340)
  const [buyH, setBuyH, buyHeightReady, buyHeightError] = useUserState("buy-height", 200)
  const rowDragRef = useRef<{ row: "chat" | "buy"; startY: number; startH: number } | null>(null)

  const startRowDrag = useCallback(
    (row: "chat" | "buy") => (e: React.PointerEvent) => {
      rowDragRef.current = { row, startY: e.clientY, startH: row === "chat" ? chatH : buyH }
      try {
        ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
    },
    [chatH, buyH]
  )

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = rowDragRef.current
      if (!d) return
      const delta = e.clientY - d.startY
      const min = d.row === "chat" ? 160 : 110
      const next = Math.max(min, d.startH + delta)
      if (d.row === "chat") setChatH(next)
      else setBuyH(next)
    }
    const onUp = () => {
      rowDragRef.current = null
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
    }
  }, [])

  const sym = chartSymbol.trim().toUpperCase()
  const nativeCurrency = nativeCurrencyForSymbol(sym)
  const [chartData, setChartData] = useState<ChartPoint[]>([])
  const [chartHint, setChartHint] = useState<string | null>(null)
  const [chartSource, setChartSource] = useState<"finnhub" | "twelvedata" | "yahoo" | "demo">(
    "yahoo"
  )

  // Live price ticker — polls a lightweight quote endpoint at a steady 10s cadence.
  const LIVE_PRICE_POLL_MS = 10_000
  const [livePrice, setLivePrice] = useState<{ price: number; changePct?: number } | null>(null)

  useEffect(() => {
    let cancelled = false
    setLivePrice(null)
    const poll = async () => {
      try {
        const res = await fetch(`/api/quote?symbol=${encodeURIComponent(sym)}`)
        const json = (await res.json()) as { price?: number; changePct?: number; error?: string }
        if (cancelled) return
        if (res.ok && typeof json.price === "number") {
          setLivePrice({ price: json.price, changePct: json.changePct })
        }
      } catch {
        /* transient failure — keep showing the last known price, retry next tick */
      }
    }
    void poll()
    const id = window.setInterval(poll, LIVE_PRICE_POLL_MS)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [sym])

  useEffect(() => {
    let cancelled = false
    setChartHint(null)
    ;(async () => {
      try {
        const res = await fetch(
          `/api/chart?symbol=${encodeURIComponent(sym)}&timeframe=${chartTimeframe}`
        )
        const json = (await res.json()) as {
          points?: ChartPoint[]
          error?: string
          source?: string
        }
        if (cancelled) return
        const pts = Array.isArray(json.points) ? json.points : []
        if (res.ok && pts.length > 0) {
          setChartData(pts)
          setChartHint(null)
          const src = json.source
          if (src === "finnhub" || src === "twelvedata" || src === "yahoo") {
            setChartSource(src)
          } else {
            setChartSource("yahoo")
          }
          return
        }
        throw new Error(typeof json.error === "string" ? json.error : "No chart bars returned")
      } catch {
        if (cancelled) return
        setChartData(buildSimulatedSeries(sym || "AAPL", chartTimeframe))
        setChartSource("demo")
        setChartHint(
          "Live prices unavailable — showing a simulated series. Add TWELVE_DATA_API_KEY in .env.local for backup."
        )
      }
    })()
    return () => {
      cancelled = true
    }
  }, [sym, chartTimeframe])

  useEffect(() => {
    if (!game.ready || !symbolReady) return
    if (!initialChartRecorded.current) { initialChartRecorded.current = true; return }
    game.recordTicker(sym)
  }, [sym, game.ready, symbolReady]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!game.ready || !timeframeReady) return
    if (!initialTimeframeRecorded.current) { initialTimeframeRecorded.current = true; return }
    game.recordTimeframe(chartTimeframe)
  }, [chartTimeframe, game.ready, timeframeReady]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!game.ready || !detailReady) return
    if (chartDetail === "candles") game.recordCandles()
  }, [chartDetail, game.ready, detailReady]) // eslint-disable-line react-hooks/exhaustive-deps

  const applyChartSymbol = (raw: string) => {
    const u = raw.trim().toUpperCase()
    if (/^[A-Z0-9.\-]{1,20}$/.test(u)) {
      setChartSymbol(u)
      savedStocks.record(u)
    }
  }

  const goExplore = (symbol: string, tf: ChartTimeframe) => {
    applyChartSymbol(symbol)
    setChartTimeframe(tf)
    setTab("terminal")
  }

  const liveCurSym = currencySymbol(displayCurrency)
  const livePriceDisplay =
    livePrice != null
      ? convertCurrency(livePrice.price, nativeCurrency, displayCurrency, usdInrRate ?? 1)
      : null

  const accountError = game.error ?? savedStocks.error ?? tabError ?? symbolError ?? timeframeError ?? detailError ?? currencyError ?? chatHeightError ?? buyHeightError
  if (accountError) return <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center text-slate-200"><p>Could not load your account data.</p><p className="text-sm text-slate-400">{accountError}</p><button onClick={() => window.location.reload()} className="rounded-xl border border-white/20 px-4 py-2">Try again</button></div>
  if (![game.ready, savedStocks.ready, tabReady, symbolReady, timeframeReady, detailReady, currencyReady, chatHeightReady, buyHeightReady].every(Boolean)) return <div className="flex min-h-screen items-center justify-center text-slate-300">Loading your account…</div>

  return (
    <div className="flex min-h-screen flex-col">
      <TopNav tab={tab} onTab={setTab} game={game} email={user.email ?? ""} />

      <AnimatePresence mode="wait">
        {tab === "home" ? (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1"
          >
            <LandingView
              onSelect={(s, tf) => goExplore(s, tf)}
              onSearch={(s) => goExplore(s, "1M")}
            />
          </motion.div>
        ) : tab === "terminal" ? (
          <motion.div
            key="terminal"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex min-h-0 flex-1"
          >
            <aside className="flex w-[260px] shrink-0 flex-col border-r border-white/5 bg-black/20 backdrop-blur-xl">
              <div className="border-b border-white/5 p-5">
                <h1 className="text-sm font-semibold text-white">Chart symbol</h1>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                  Pick a ticker + horizon. Click two points to compare a move.
                </p>
              </div>
              <div className="border-b border-white/5 p-4">
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Horizon
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {CHART_TIMEFRAMES.map((tf) => (
                    <button
                      key={tf.id}
                      type="button"
                      onClick={() => setChartTimeframe(tf.id)}
                      title={tf.detail}
                      className={`rounded-full border px-2.5 py-1 font-mono text-[10px] transition-all ${
                        chartTimeframe === tf.id
                          ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-100"
                          : "border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200"
                      }`}
                    >
                      {tf.short}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-4">
                <div className="mb-3">
                  <TickerSearch onPick={applyChartSymbol} />
                </div>
                {savedStocks.symbols.length > 0 ? (
                  <>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        Saved stocks
                      </span>
                      <span className="text-[10px] text-slate-600">
                        {savedStocks.symbols.length}
                      </span>
                    </div>
                    <nav className="mb-3 max-h-48 space-y-1 overflow-y-auto scroll-soft">
                      {savedStocks.symbols.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setChartSymbol(s)}
                          className={`group flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left font-mono text-sm transition-all ${
                            sym === s
                              ? "border-amber-400/50 bg-amber-400/10 text-amber-100"
                              : "border-transparent text-slate-300 hover:border-white/10 hover:bg-white/5"
                          }`}
                        >
                          <span className="truncate">{s}</span>
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation()
                              savedStocks.remove(s)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.stopPropagation()
                                e.preventDefault()
                                savedStocks.remove(s)
                              }
                            }}
                            title="Remove from saved"
                            className="shrink-0 rounded-full px-1.5 text-[11px] text-slate-500 opacity-0 transition-opacity hover:text-rose-300 group-hover:opacity-100"
                          >
                            ✕
                          </span>
                        </button>
                      ))}
                    </nav>
                  </>
                ) : null}
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  US presets
                </div>
                <nav className="mb-3 space-y-1">
                  {PRESETS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setChartSymbol(s)}
                      className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left font-mono text-sm transition-all ${
                        sym === s
                          ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-100"
                          : "border-transparent text-slate-300 hover:border-white/10 hover:bg-white/5"
                      }`}
                    >
                      {s}
                      {sym === s ? (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                      ) : null}
                    </button>
                  ))}
                </nav>
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  India presets (NSE)
                </div>
                <nav className="space-y-1">
                  {INDIA_PRESETS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setChartSymbol(s)}
                      className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left font-mono text-sm transition-all ${
                        sym === s
                          ? "border-violet-400/50 bg-violet-400/10 text-violet-100"
                          : "border-transparent text-slate-300 hover:border-white/10 hover:bg-white/5"
                      }`}
                    >
                      {s.replace(".NS", "")}
                      {sym === s ? (
                        <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_#a78bfa]" />
                      ) : null}
                    </button>
                  ))}
                </nav>
                <p className="mt-3 text-[10px] leading-relaxed text-slate-500">
                  Search covers every NSE/BSE-listed stock, not just these — try any Indian company
                  name above.
                </p>
              </div>
            </aside>

            <main className="flex min-h-0 min-w-0 flex-1 flex-col">
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-6 py-4">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Active chart
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold tracking-tight text-white">{sym}</span>
                    <span className="text-[12px] text-slate-400">
                      {CHART_TIMEFRAMES.find((x) => x.id === chartTimeframe)?.detail ?? ""}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {chartHint ? (
                        <span className="text-amber-400/90">· simulated</span>
                      ) : chartSource === "finnhub" ? (
                        <span className="text-emerald-400/70">· Finnhub</span>
                      ) : chartSource === "twelvedata" ? (
                        <span className="text-emerald-400/70">· Twelve Data</span>
                      ) : (
                        <span className="text-emerald-400/70">· Yahoo Finance</span>
                      )}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    </span>
                    {livePriceDisplay != null ? (
                      <>
                        <span className="font-mono text-lg font-semibold text-white">
                          {liveCurSym}
                          {livePriceDisplay.toFixed(2)}
                        </span>
                        {livePrice?.changePct != null ? (
                          <span
                            className={`font-mono text-[12px] ${
                              livePrice.changePct >= 0 ? "text-emerald-400" : "text-rose-400"
                            }`}
                          >
                            {livePrice.changePct >= 0 ? "+" : ""}
                            {livePrice.changePct.toFixed(2)}%
                          </span>
                        ) : null}
                      </>
                    ) : (
                      <span className="font-mono text-[12px] text-slate-500">Fetching live price…</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {/* Currency: USD vs INR display */}
                  <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
                    {(["USD", "INR"] as const).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setDisplayCurrency(c)}
                        disabled={c !== nativeCurrency && !usdInrRate}
                        title={
                          c !== nativeCurrency && !usdInrRate
                            ? "Fetching exchange rate…"
                            : `Show prices in ${c}`
                        }
                        className={`rounded-full px-3 py-1 text-[11px] font-medium transition-all disabled:opacity-30 ${
                          displayCurrency === c
                            ? "bg-white/15 text-white"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  {/* Chart style: line vs candles */}
                  <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
                    {(["line", "candles"] as const).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setChartDetail(d)}
                        title={
                          d === "line"
                            ? "Line view"
                            : "Candlestick view (uses OHLC when available)"
                        }
                        className={`rounded-full px-3 py-1 text-[11px] font-medium capitalize transition-all ${
                          chartDetail === d
                            ? "bg-white/15 text-white"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </header>

              <div className="min-h-0 min-w-0 flex-1 overflow-auto scroll-soft p-6">
                {chartHint ? (
                  <div className="mb-4 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-2.5 text-[12px] text-amber-100">
                    {chartHint}
                  </div>
                ) : null}
                <StockChart
                  data={chartData}
                  ticker={sym}
                  timeframe={chartTimeframe}
                  mode="draw"
                  detail={chartDetail}
                  onSelect={() => {}}
                  onLineDrawn={game.recordDraw}
                  nativeCurrency={nativeCurrency}
                  displayCurrency={displayCurrency}
                  usdInrRate={usdInrRate}
                />
              </div>
            </main>

            <section className="flex min-h-0 w-[min(440px,40vw)] shrink-0 flex-col border-l border-white/5 bg-black/20 backdrop-blur-xl">
              <div
                className="flex shrink-0 flex-col overflow-hidden"
                style={{ height: chatH }}
              >
                <InlineChat key={sym} symbol={sym} />
              </div>
              <ResizeHandle onPointerDown={startRowDrag("chat")} />
              <div
                className="shrink-0 overflow-y-auto scroll-soft p-4"
                style={{ height: buyH }}
              >
                <BuyPriceAnalyzer
                  symbol={sym}
                  nativeCurrency={nativeCurrency}
                  displayCurrency={displayCurrency}
                  usdInrRate={usdInrRate}
                />
              </div>
              <ResizeHandle onPointerDown={startRowDrag("buy")} />
              <div className="min-h-[110px] flex-1 overflow-y-auto scroll-soft p-4">
                <CompanyFinancials
                  symbol={sym}
                  displayCurrency={displayCurrency}
                  usdInrRate={usdInrRate}
                />
              </div>
            </section>
          </motion.div>
        ) : (
          <motion.div
            key="you"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex min-h-0 flex-1"
          >
            <ProfilePanel profile={game} />
          </motion.div>
        )}
      </AnimatePresence>

      <CompanionOwl profile={game} />
    </div>
  )
}

function TopNav({
  tab,
  onTab,
  game,
  email,
}: {
  tab: Tab
  onTab: (t: Tab) => void
  game: ReturnType<typeof useGameProfile>
  email: string
}) {
  const items: { id: Tab; label: string; color: string }[] = [
    { id: "home", label: "Home", color: "emerald" },
    { id: "terminal", label: "Chart", color: "emerald" },
    { id: "you", label: "You", color: "emerald" },
  ]
  const { rank, profile: gp } = game
  return (
    <header className="sticky top-0 z-40 flex shrink-0 flex-wrap items-center gap-3 border-b border-white/5 bg-black/40 px-6 py-3 backdrop-blur-xl">
      <button
        type="button"
        onClick={() => onTab("home")}
        className="flex items-center gap-2"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-400/30 bg-emerald-400/10">
          <Owl pose="idle" size={24} />
        </div>
        <div className="flex items-baseline gap-2">
          <div className="text-base font-semibold tracking-tight text-white">
            <span className="brand-gradient-text">Hoot</span>
          </div>
          <div className="hidden text-[11px] font-medium text-slate-500 sm:block">
            · markets made simple
          </div>
        </div>
      </button>
      <nav className="ml-6 flex gap-1">
        {items.map((it) => (
          <button
            key={it.id}
            type="button"
            onClick={() => onTab(it.id)}
            className={`relative rounded-full px-4 py-1.5 text-[12px] font-medium transition-all ${
              tab === it.id ? "text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab === it.id ? (
              <motion.span
                layoutId="nav-pill"
                className="absolute inset-0 rounded-full bg-white/10"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            ) : null}
            <span className="relative">{it.label}</span>
          </button>
        ))}
      </nav>
      <div className="ml-auto hidden max-w-40 truncate text-[11px] text-slate-400 lg:block" title={email}>{email}</div>
      <button type="button" onClick={() => void flushUserStateWrites().then(() => supabase?.auth.signOut())} className="rounded-full border border-white/10 px-3 py-1.5 text-[11px] text-slate-300 hover:bg-white/10">Sign out</button>
      <button
        type="button"
        onClick={() => onTab("you")}
        title={`${rank.rank.label} · ${gp.xp} XP`}
        className="flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-2 py-1 transition-colors hover:bg-white/10"
      >
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full border"
          style={{ borderColor: `${rank.rank.accent}66`, background: `${rank.rank.accent}15` }}
        >
          <Owl pose="idle" size={22} />
        </span>
        <span className="flex flex-col items-start gap-0.5 pr-1">
          <span
            className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: rank.rank.accent }}
          >
            {rank.rank.label}
          </span>
          <span className="h-1 w-20 overflow-hidden rounded-full bg-white/10">
            <span
              className="block h-full rounded-full transition-all"
              style={{
                width: `${rank.pct}%`,
                background: `linear-gradient(90deg, ${rank.rank.accent}, ${
                  rank.next?.accent ?? rank.rank.accent
                })`,
              }}
            />
          </span>
        </span>
      </button>
    </header>
  )
}
