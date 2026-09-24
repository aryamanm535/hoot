"use client"

import { motion } from "framer-motion"

export type GuidedPrompt = {
  id: string
  title: string
  subtitle: string
  symbol: string
  timeframe: "1D" | "1W" | "1M" | "3M" | "1Y" | "5Y"
  emoji: string
  tint: string
}

export const GUIDED_PROMPTS: GuidedPrompt[] = [
  {
    id: "crash",
    title: "Why do stocks crash?",
    subtitle: "Explore a real selloff and what triggered it.",
    symbol: "META",
    timeframe: "1Y",
    emoji: "⚡",
    tint: "from-rose-500/20 to-orange-500/10",
  },
  {
    id: "spike",
    title: "What causes a sudden spike?",
    subtitle: "Look at an earnings beat that sent a stock flying.",
    symbol: "NVDA",
    timeframe: "1Y",
    emoji: "🚀",
    tint: "from-emerald-500/20 to-cyan-500/10",
  },
  {
    id: "earnings",
    title: "How do earnings move a stock?",
    subtitle: "See the reaction to a quarterly report in real time.",
    symbol: "AAPL",
    timeframe: "3M",
    emoji: "📊",
    tint: "from-violet-500/20 to-indigo-500/10",
  },
  {
    id: "macro",
    title: "What is market sentiment?",
    subtitle: "Watch a macro shock ripple across a mega-cap.",
    symbol: "TSLA",
    timeframe: "1M",
    emoji: "🌐",
    tint: "from-amber-500/20 to-rose-500/10",
  },
]

const FEATURED = [
  { symbol: "AAPL", name: "Apple", tf: "1M" as const, note: "Earnings reaction" },
  { symbol: "NVDA", name: "NVIDIA", tf: "1Y" as const, note: "AI rally arc" },
  { symbol: "TSLA", name: "Tesla", tf: "3M" as const, note: "Volatility event" },
]

type Props = {
  onSelect: (symbol: string, timeframe: GuidedPrompt["timeframe"]) => void
  onSearch: (symbol: string) => void
}

export default function LandingView({ onSelect, onSearch }: Props) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-10 md:py-16">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-[28px] border border-white/5 bg-gradient-to-br from-white/[0.04] to-white/[0.01] px-8 py-14 md:px-14 md:py-20"
      >
        <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[120%] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 right-0 h-72 w-96 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="relative">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[11px] font-medium text-emerald-300"
          >
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            AI-powered market learning
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mt-5 max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight text-white md:text-6xl"
          >
            Understand <span className="brand-gradient-text">why</span> the market moves.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-5 max-w-2xl text-[15px] leading-relaxed text-slate-300 md:text-[17px]"
          >
            Instead of staring at raw charts and disconnected headlines, drag across any price
            move and let MarketLens explain what likely caused it — in plain English or analyst-grade detail.
          </motion.p>

          {/* Search */}
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            onSubmit={(e) => {
              e.preventDefault()
              const data = new FormData(e.currentTarget)
              const s = String(data.get("sym") ?? "").trim().toUpperCase()
              if (s) onSearch(s)
            }}
            className="mt-8 flex max-w-xl items-center gap-2 rounded-2xl border border-white/10 bg-black/40 p-1.5 shadow-[0_20px_60px_-20px_rgba(16,185,129,0.3)] backdrop-blur-xl"
          >
            <div className="flex items-center gap-2 px-3 text-slate-500">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
            <input
              name="sym"
              placeholder="Search a ticker — AAPL, NVDA, TSLA…"
              className="min-w-0 flex-1 bg-transparent px-1 py-2 text-[15px] text-white placeholder:text-slate-500 focus:outline-none"
              autoComplete="off"
            />
            <button
              type="submit"
              className="rounded-xl brand-gradient-bg px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-95"
            >
              Explore
            </button>
          </motion.form>

          {/* Featured quick chips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 flex flex-wrap gap-2"
          >
            {FEATURED.map((f) => (
              <button
                key={f.symbol}
                type="button"
                onClick={() => onSelect(f.symbol, f.tf)}
                className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[12px] text-slate-200 transition-all hover:scale-105 hover:border-emerald-400/40 hover:bg-emerald-400/10"
              >
                <span className="font-semibold text-white">{f.symbol}</span>
                <span className="text-slate-500">·</span>
                <span className="text-slate-400">{f.note}</span>
                <span className="text-emerald-300 opacity-0 transition-opacity group-hover:opacity-100">→</span>
              </button>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Guided prompts */}
      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-violet-300">
              Start learning
            </div>
            <h2 className="mt-1 text-2xl font-bold text-white md:text-3xl">
              Pick a question, get a real example
            </h2>
          </div>
          <div className="hidden text-[13px] text-slate-400 md:block">
            Each card jumps into a live chart with a moment already highlighted.
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {GUIDED_PROMPTS.map((p, i) => (
            <motion.button
              key={p.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08, duration: 0.4 }}
              whileHover={{ y: -4 }}
              onClick={() => onSelect(p.symbol, p.timeframe)}
              className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${p.tint} p-6 text-left backdrop-blur-xl transition-all hover:border-white/20`}
            >
              <div className="pointer-events-none absolute -right-8 -top-8 text-6xl opacity-30 transition-transform duration-300 group-hover:scale-110 group-hover:opacity-40">
                {p.emoji}
              </div>
              <div className="relative">
                <div className="text-2xl">{p.emoji}</div>
                <div className="mt-3 text-lg font-semibold text-white">{p.title}</div>
                <div className="mt-1 text-[13px] text-slate-300">{p.subtitle}</div>
                <div className="mt-4 inline-flex items-center gap-2 text-[12px] text-emerald-300">
                  Explore {p.symbol} · {p.timeframe}
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Feature strip */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          {
            icon: "🎯",
            title: "Drag to explain",
            body: "Select any window on the chart. The AI reasons through what drove that move using real news.",
          },
          {
            icon: "🧠",
            title: "Beginner ↔ Analyst",
            body: "Toggle between plain-English explanations and richer, analyst-grade market framing.",
          },
          {
            icon: "🎮",
            title: "Learn by playing",
            body: "Predict the driver first, then see the answer. Build a flashcard deck from real market events.",
          },
        ].map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className="rounded-2xl border border-white/5 bg-white/[0.02] p-5"
          >
            <div className="text-2xl">{f.icon}</div>
            <div className="mt-3 font-semibold text-white">{f.title}</div>
            <div className="mt-1 text-[13px] leading-relaxed text-slate-400">{f.body}</div>
          </motion.div>
        ))}
      </section>
    </div>
  )
}
