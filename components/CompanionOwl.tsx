"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import Owl, { type OwlPose } from "./Owl"
import { BADGE_BY_ID, RANKS } from "@/lib/game"
import type { GameProfileHook, GameEvent } from "@/hooks/useGameProfile"

type Bubble = {
  id: string
  text: string
  pose: OwlPose
  accent: string
  duration: number
}

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

function bubbleFor(e: GameEvent): Bubble | null {
  switch (e.kind) {
    case "badge": {
      const b = BADGE_BY_ID[e.badgeId]
      if (!b) return null
      return {
        id: uid(),
        text: `Badge unlocked: ${b.icon} ${b.label}`,
        pose: "cheer",
        accent: "#fbbf24",
        duration: 4200,
      }
    }
    case "rank-up": {
      const r = RANKS.find((x) => x.id === e.rankId)
      if (!r) return null
      return {
        id: uid(),
        text: `Rank up — you're now a ${r.label}!`,
        pose: "cheer",
        accent: r.accent,
        duration: 5200,
      }
    }
    case "streak": {
      return {
        id: uid(),
        text: `${e.days}-day streak. Keep it going!`,
        pose: "cheer",
        accent: "#fb7185",
        duration: 3800,
      }
    }
    case "greet": {
      const msg =
        e.days > 0
          ? `Welcome back! ${e.days}-day streak — nice.`
          : `Hey, welcome. Drag across the chart to start.`
      return { id: uid(), text: msg, pose: "idle", accent: "#34d399", duration: 4200 }
    }
    case "xp": {
      if (e.amount < 10) return null
      return {
        id: uid(),
        text: `+${e.amount} XP · ${e.reason}`,
        pose: "idle",
        accent: "#34d399",
        duration: 1800,
      }
    }
  }
}

const CONTEXT_TIPS = [
  "Try drawing a comparison line between a peak and a dip.",
  "Switch to candlestick view to see open/close tension.",
  "Ask Hoot in the chat what a term you don't know means.",
  "Change timeframe to see if the move looks different over 1Y vs 1M.",
  "Check the buy-price tool to see if today's price is a good entry.",
]

export default function CompanionOwl({
  profile,
  onOpenChat,
}: {
  profile: GameProfileHook
  onOpenChat?: () => void
}) {
  const [queue, setQueue] = useState<Bubble[]>([])
  const [open] = useState(true)
  const lastTipAt = useRef(0)

  useEffect(() => {
    const unsub = profile.subscribe((e) => {
      const b = bubbleFor(e)
      if (b) setQueue((q) => [...q, b].slice(-4))
    })
    return () => unsub()
  }, [profile])

  // Drip contextual tips when idle (every ~90s of uptime, max once per window).
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now()
      if (now - lastTipAt.current < 90_000) return
      lastTipAt.current = now
      if (queue.length > 0) return
      const t = CONTEXT_TIPS[Math.floor(Math.random() * CONTEXT_TIPS.length)]!
      setQueue((q) => [
        ...q,
        { id: uid(), text: t, pose: "think", accent: "#a78bfa", duration: 4600 },
      ])
    }, 30_000)
    return () => clearInterval(id)
  }, [queue.length])

  // Auto-dismiss current bubble
  useEffect(() => {
    if (queue.length === 0) return
    const head = queue[0]!
    const t = setTimeout(() => {
      setQueue((q) => q.slice(1))
    }, head.duration)
    return () => clearTimeout(t)
  }, [queue])

  const current = queue[0] ?? null

  return (
    <div className="pointer-events-none fixed bottom-4 left-4 z-[70] flex flex-col items-start gap-2">
      <AnimatePresence>
        {open && current ? (
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto max-w-[280px] rounded-2xl border bg-[#0b1220]/95 px-3.5 py-2.5 text-[12px] leading-snug text-slate-100 shadow-2xl backdrop-blur-xl"
            style={{ borderColor: `${current.accent}66` }}
          >
            <span
              className="mr-1 inline-block font-mono text-[10px] uppercase tracking-wider"
              style={{ color: current.accent }}
            >
              Hoot
            </span>
            {current.text}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => onOpenChat?.()}
        className="pointer-events-auto rounded-full border border-emerald-400/30 bg-black/50 p-1 shadow-[0_12px_36px_-12px_rgba(16,185,129,0.55)] backdrop-blur-xl transition-transform hover:scale-105"
        title="Chat with Hoot"
      >
        <Owl pose={current?.pose ?? "idle"} size={62} />
      </button>
    </div>
  )
}
