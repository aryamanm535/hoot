"use client"

import { useEffect, useState } from "react"
import type { CompanyFundamentals } from "@/lib/companyData"
import type { NewsArticle } from "@/lib/googleNews"
import { convertCurrency, currencySymbol, type Currency } from "@/lib/currency"

function fmtCap(n: number | undefined, sym: string): string {
  if (n == null || !Number.isFinite(n)) return "—"
  if (n >= 1e12) return `${sym}${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9) return `${sym}${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `${sym}${(n / 1e6).toFixed(1)}M`
  return `${sym}${n.toLocaleString()}`
}

function fmtNum(n: number | undefined, digits = 2): string {
  if (n == null || !Number.isFinite(n)) return "—"
  return n.toFixed(digits)
}

function fmtMoney(n: number | undefined, sym: string, digits = 2): string {
  if (n == null || !Number.isFinite(n)) return "—"
  return `${sym}${n.toFixed(digits)}`
}

function fmtPct(n: number | undefined, alreadyPct = false): string {
  if (n == null || !Number.isFinite(n)) return "—"
  const v = alreadyPct ? n : n * 100
  return `${v.toFixed(1)}%`
}

function fmtAge(ms: number): string {
  const m = Math.floor((Date.now() - ms) / 60_000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 48) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-0.5 font-mono text-[13px] text-white">{value}</div>
    </div>
  )
}

export default function CompanyFinancials({
  symbol,
  displayCurrency,
  usdInrRate,
}: {
  symbol: string
  displayCurrency: Currency
  usdInrRate: number | null
}) {
  const [fundamentals, setFundamentals] = useState<CompanyFundamentals | null>(null)
  const [news, setNews] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        const res = await fetch(`/api/company?symbol=${encodeURIComponent(symbol)}`)
        const json = (await res.json()) as {
          fundamentals?: CompanyFundamentals
          news?: NewsArticle[]
          error?: string
        }
        if (cancelled) return
        if (!res.ok || json.error) throw new Error(json.error || "Failed to load company data")
        setFundamentals(json.fundamentals ?? null)
        setNews(json.news ?? [])
      } catch (e) {
        if (cancelled) return
        setError(e instanceof Error ? e.message : "Failed to load company data")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [symbol])

  if (loading && !fundamentals) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-[12px] text-slate-500">
        Loading financials for {symbol}…
      </div>
    )
  }

  if (error && !fundamentals) {
    return (
      <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 p-4 text-[12px] text-rose-200">
        {error}
      </div>
    )
  }

  const f = fundamentals
  const nativeCurrency: Currency = f?.currency === "INR" ? "INR" : "USD"
  const sym = currencySymbol(displayCurrency)
  const conv = (n: number | undefined) =>
    n == null ? undefined : convertCurrency(n, nativeCurrency, displayCurrency, usdInrRate ?? 1)

  const revenueRows = [...(f?.revenueYearly ?? [])].sort((a, b) => a.year - b.year)
  const epsRows = f?.epsQuarterly ?? []

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {f?.name ?? symbol} · fundamentals
          </div>
          {f?.recommendationKey ? (
            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] uppercase text-emerald-200">
              analysts: {f.recommendationKey}
            </span>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Stat label="Market cap" value={fmtCap(conv(f?.marketCap), sym)} />
          <Stat label="P/E (trail / fwd)" value={`${fmtNum(f?.trailingPE, 1)} / ${fmtNum(f?.forwardPE, 1)}`} />
          <Stat
            label="EPS (trail / fwd)"
            value={`${fmtMoney(conv(f?.trailingEps), sym)} / ${fmtMoney(conv(f?.forwardEps), sym)}`}
          />
          <Stat label="Profit margin" value={fmtPct(f?.profitMargin)} />
          <Stat label="Dividend yield" value={f?.dividendYield ? fmtPct(f.dividendYield) : "—"} />
          <Stat
            label="52w range"
            value={`${fmtMoney(conv(f?.week52Low), sym)}–${fmtMoney(conv(f?.week52High), sym)}`}
          />
          <Stat
            label="Analyst target"
            value={
              f?.analystTargetMean
                ? `${fmtMoney(conv(f.analystTargetLow), sym)}–${fmtMoney(conv(f.analystTargetHigh), sym)} (avg ${fmtMoney(conv(f.analystTargetMean), sym)})`
                : "—"
            }
          />
          <Stat
            label="50d / 200d avg"
            value={`${fmtMoney(conv(f?.fiftyDayAvg), sym)} / ${fmtMoney(conv(f?.twoHundredDayAvg), sym)}`}
          />
          <Stat
            label="Next earnings"
            value={f?.nextEarningsDate ? new Date(f.nextEarningsDate).toLocaleDateString() : "—"}
          />
        </div>
      </div>

      {revenueRows.length > 0 ? (
        <div>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Revenue &amp; profit (annual)
          </div>
          <ul className="flex flex-col gap-1.5">
            {revenueRows.map((r) => (
              <li
                key={r.year}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 font-mono text-[12px]"
              >
                <span className="text-slate-400">{r.year}</span>
                <span className="text-white">rev {fmtCap(conv(r.revenue), sym)}</span>
                <span className="text-emerald-300">net {fmtCap(conv(r.earnings), sym)}</span>
                <span className="text-slate-500">{fmtPct(r.profitMargin)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {epsRows.length > 0 ? (
        <div>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Earnings (EPS actual vs. estimate)
          </div>
          <ul className="flex flex-col gap-1.5">
            {epsRows.map((q, i) => {
              const beat = q.actual >= q.estimate
              return (
                <li
                  key={`${q.label}-${i}`}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 font-mono text-[12px]"
                >
                  <span className="text-slate-400">{q.label}</span>
                  <span className="text-white">actual {fmtMoney(conv(q.actual), sym)}</span>
                  <span className="text-slate-500">est {fmtMoney(conv(q.estimate), sym)}</span>
                  <span className={beat ? "text-emerald-300" : "text-rose-300"}>
                    {beat ? "+" : ""}
                    {fmtNum(q.surprisePct, 1)}%
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}

      <div>
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Latest news
        </div>
        {news.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 p-4 text-center text-[12px] text-slate-500">
            No recent articles found.
          </div>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {news.map((a) => (
              <li key={a.id} className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2">
                <a
                  href={a.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[13px] font-medium text-slate-100 underline decoration-slate-600 decoration-1 underline-offset-2 hover:text-emerald-200"
                >
                  {a.title}
                </a>
                <div className="mt-1 flex items-center gap-2 font-mono text-[10px] text-slate-500">
                  <span>{a.publisher}</span>
                  <span>·</span>
                  <span>{fmtAge(a.publishedAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
