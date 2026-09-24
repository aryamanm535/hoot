"use client"

import { useEffect, useRef, useState } from "react"
import Owl from "./Owl"
import { useUserState } from "@/hooks/useUserState"

type ChatMessage = { role: "user" | "assistant"; content: string }

/**
 * Render with `key={symbol}` from the parent — that forces a fresh mount (and thus a fresh
 * conversation) whenever the active ticker changes, instead of one chat shared across stocks.
 */
export default function InlineChat({ symbol }: { symbol: string }) {
  const [messages, setMessages, ready] = useUserState<ChatMessage[]>(`chat:${symbol}`, [])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  const send = async () => {
    const text = input.trim()
    if (!text || sending || !ready) return
    const next: ChatMessage[] = [...messages, { role: "user", content: text }]
    setMessages(next)
    setInput("")
    setSending(true)
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, symbol }),
      })
      const json = (await res.json()) as { reply?: string; error?: string }
      const reply = json.reply ?? (json.error ? `⚠︎ ${json.error}` : "No reply.")
      setMessages((m) => [...m, { role: "assistant" as const, content: reply }].slice(-60))
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error"
      setMessages((m) => [...m, { role: "assistant" as const, content: `⚠︎ ${msg}` }].slice(-60))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-white/5 bg-gradient-to-b from-white/[0.04] to-transparent px-4 py-3">
        <div className="flex items-center gap-2">
          <Owl pose="think" size={28} />
          <div>
            <div className="text-sm font-semibold text-white">Ask Hoot about {symbol}</div>
            <div className="text-[10px] text-slate-400">Finance-only · context stays local</div>
          </div>
        </div>
        {messages.length > 0 ? (
          <button
            type="button"
            onClick={() => setMessages([])}
            className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-slate-400 hover:border-rose-400/40 hover:text-rose-200"
            title="Clear this stock's chat history"
          >
            Clear
          </button>
        ) : null}
      </div>

      <div ref={scrollRef} className="scroll-soft flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-center">
            <div className="text-sm font-semibold text-white">Ask me anything about {symbol}</div>
            <div className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
              Try: &quot;What&apos;s your projection for this?&quot; · &quot;Why did it move
              today?&quot; · &quot;What does a P/E ratio actually tell me?&quot;
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-[13px] leading-relaxed ${
                  m.role === "user"
                    ? "bg-emerald-400/15 text-emerald-50"
                    : "bg-white/[0.04] text-slate-100"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))
        )}
        {sending ? (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-white/[0.04] px-3 py-2 text-[12px] text-slate-400">
              Hoot is thinking…
            </div>
          </div>
        ) : null}
      </div>

      <div className="border-t border-white/5 bg-black/30 p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            placeholder={`Ask about ${symbol}…`}
            rows={2}
            className="scroll-soft min-h-[40px] max-h-28 flex-1 resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[13px] text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/50"
          />
          <button
            type="button"
            onClick={send}
            disabled={sending || input.trim().length === 0}
            className="shrink-0 rounded-xl border border-emerald-400/40 bg-emerald-400/15 px-3 py-2 text-xs font-semibold text-emerald-100 transition-all hover:bg-emerald-400/25 disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
