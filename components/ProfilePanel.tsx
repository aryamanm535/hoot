"use client"

import { useMemo } from "react"
import Owl from "./Owl"
import { BADGES, RANKS, type BadgeCategory } from "@/lib/game"
import type { GameProfileHook } from "@/hooks/useGameProfile"

const CATEGORY_ACCENT: Record<BadgeCategory, string> = {
  Explorer: "text-emerald-300 border-emerald-400/30 bg-emerald-400/5",
  Quiz: "text-violet-300 border-violet-400/30 bg-violet-400/5",
  Chartist: "text-sky-300 border-sky-400/30 bg-sky-400/5",
  Streak: "text-rose-300 border-rose-400/30 bg-rose-400/5",
}

export default function ProfilePanel({ profile }: { profile: GameProfileHook }) {
  const { profile: p, rank } = profile

  const grouped = useMemo(() => {
    const g: Record<BadgeCategory, typeof BADGES> = {
      Explorer: [],
      Quiz: [],
      Chartist: [],
      Streak: [],
    }
    for (const b of BADGES) g[b.category].push(b)
    return g
  }, [])

  const owned = new Set(p.badges)
  const totalBadges = BADGES.length
  const unlockedCount = p.badges.length
  const quizAccuracy = p.quizTotal > 0 ? Math.round((p.quizCorrect / p.quizTotal) * 100) : 0

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto scroll-soft">
      <div className="border-b border-white/5 bg-gradient-to-b from-white/[0.04] to-transparent px-8 py-6">
        <div className="flex flex-wrap items-center gap-6">
          <div
            className="shrink-0 rounded-3xl border p-2"
            style={{ borderColor: `${rank.rank.accent}55`, boxShadow: `0 0 60px -20px ${rank.rank.accent}` }}
          >
            <Owl pose="cheer" size={112} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Your rank
            </div>
            <div className="mt-1 flex flex-wrap items-baseline gap-3">
              <h1
                className="text-3xl font-bold tracking-tight"
                style={{ color: rank.rank.accent }}
              >
                {rank.rank.label}
              </h1>
              <span className="font-mono text-[12px] text-slate-400">
                {p.xp} XP
                {rank.next ? (
                  <span className="text-slate-500"> · next: {rank.next.label} at {rank.next.xpStart}</span>
                ) : (
                  <span className="text-slate-500"> · max rank</span>
                )}
              </span>
            </div>
            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${rank.pct}%`,
                  background: `linear-gradient(90deg, ${rank.rank.accent}, ${
                    rank.next?.accent ?? rank.rank.accent
                  })`,
                }}
              />
            </div>
            <div className="mt-4 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Ranges explained" value={p.rangesExplained} />
              <Stat label="Tickers explored" value={p.tickersExplored.length} />
              <Stat label="Quiz accuracy" value={`${quizAccuracy}%`} sub={`${p.quizCorrect}/${p.quizTotal}`} />
              <Stat label="Day streak" value={`${p.streakDays}🔥`} />
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-white/5 px-8 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-white">Rank ladder</div>
            <div className="text-[11px] text-slate-400">
              Earn XP by explaining ranges, answering quizzes, drawing comparisons, and keeping a streak.
            </div>
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            {unlockedCount}/{totalBadges} badges
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {RANKS.map((r) => {
            const reached = p.xp >= r.xpStart
            const current = r.id === rank.rank.id
            return (
              <div
                key={r.id}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] ${
                  current
                    ? "border-white/40 bg-white/10 text-white"
                    : reached
                    ? "border-white/10 bg-white/5 text-slate-200"
                    : "border-white/5 bg-transparent text-slate-500"
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: reached ? r.accent : "#334155" }}
                />
                <span className="font-semibold">{r.label}</span>
                <span className="font-mono text-[10px] text-slate-500">{r.xpStart}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="px-8 py-6">
        <h2 className="text-sm font-semibold text-white">Badges</h2>
        <p className="mt-1 text-[11px] text-slate-400">
          Collect them all to prove your market fluency.
        </p>
        <div className="mt-5 space-y-6">
          {(Object.keys(grouped) as BadgeCategory[]).map((cat) => (
            <div key={cat}>
              <div className="mb-2 flex items-center gap-2">
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${CATEGORY_ACCENT[cat]}`}
                >
                  {cat}
                </span>
                <span className="font-mono text-[10px] text-slate-500">
                  {grouped[cat].filter((b) => owned.has(b.id)).length}/{grouped[cat].length}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {grouped[cat].map((b) => {
                  const got = owned.has(b.id)
                  return (
                    <div
                      key={b.id}
                      className={`flex items-start gap-3 rounded-2xl border p-3 transition-all ${
                        got
                          ? "border-white/10 bg-white/[0.04]"
                          : "border-white/5 bg-white/[0.015] opacity-55"
                      }`}
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl ${
                          got ? "bg-amber-400/15" : "bg-white/5"
                        }`}
                      >
                        {got ? b.icon : "🔒"}
                      </div>
                      <div className="min-w-0">
                        <div className={`text-[12px] font-semibold ${got ? "text-white" : "text-slate-400"}`}>
                          {b.label}
                        </div>
                        <div className="mt-0.5 text-[11px] leading-snug text-slate-500">
                          {b.description}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div className="mt-0.5 font-mono text-lg text-white">{value}</div>
      {sub ? <div className="font-mono text-[10px] text-slate-500">{sub}</div> : null}
    </div>
  )
}
