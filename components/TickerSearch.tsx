"use client"

import { useEffect, useRef, useState } from "react"
import type { SymbolSearchResult } from "@/app/api/search/route"

export default function TickerSearch({ onPick }: { onPick: (symbol: string) => void }) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SymbolSearchResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      return
    }
    let cancelled = false
    setLoading(true)
    const t = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
        const json = (await res.json()) as { results?: SymbolSearchResult[] }
        if (!cancelled) setResults(json.results ?? [])
      } catch {
        if (!cancelled) setResults([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 300)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [query])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  const pick = (symbol: string) => {
    onPick(symbol)
    setQuery("")
    setResults([])
    setOpen(false)
  }

  const applyRaw = () => {
    const u = query.trim().toUpperCase()
    if (/^[A-Z0-9.\-]{1,20}$/.test(u)) pick(u)
  }

  return (
    <div ref={boxRef} className="relative">
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (results.length > 0) pick(results[0]!.symbol)
              else applyRaw()
            } else if (e.key === "Escape") {
              setOpen(false)
            }
          }}
          placeholder="Search e.g. Reliance, TCS, AMD…"
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/50"
        />
        <button
          type="button"
          onClick={applyRaw}
          className="shrink-0 rounded-xl brand-gradient-bg px-3 py-2 text-xs font-semibold text-white hover:scale-105 active:scale-95"
        >
          Go
        </button>
      </div>

      {open && query.trim().length >= 2 ? (
        <div className="absolute left-0 right-0 top-full z-20 mt-1.5 max-h-72 overflow-y-auto scroll-soft rounded-xl border border-white/10 bg-[#0b1220] shadow-2xl">
          {loading && results.length === 0 ? (
            <div className="px-3 py-3 text-[11px] text-slate-500">Searching…</div>
          ) : results.length === 0 ? (
            <div className="px-3 py-3 text-[11px] text-slate-500">
              No matches — press Go to try &quot;{query.trim().toUpperCase()}&quot; directly.
            </div>
          ) : (
            results.map((r) => (
              <button
                key={r.symbol}
                type="button"
                onClick={() => pick(r.symbol)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-white/5"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[12px] text-white">{r.name}</span>
                  <span className="block font-mono text-[10px] text-slate-500">{r.symbol}</span>
                </span>
                <span className="shrink-0 rounded-full border border-white/10 px-1.5 py-0.5 text-[9px] uppercase text-slate-400">
                  {r.exchange || "—"}
                </span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  )
}
