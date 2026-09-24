import YahooFinance from "yahoo-finance2"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const yahooFinance = new YahooFinance()

export type SymbolSearchResult = {
  symbol: string
  name: string
  exchange: string
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get("q") ?? "").trim()
  if (q.length < 1) {
    return Response.json({ results: [] })
  }

  try {
    // yahoo-finance2's search schema validation has known false positives (typeDisp casing) —
    // the data itself is fine, so skip validation for this call.
    const res = (await yahooFinance.search(q, {}, { validateResult: false })) as {
      quotes?: unknown[]
    }
    const results: SymbolSearchResult[] = (res.quotes ?? [])
      .filter(
        (r): r is Record<string, unknown> =>
          !!r && typeof r === "object" && "symbol" in r && (r as Record<string, unknown>).quoteType === "EQUITY"
      )
      .map((r) => ({
        symbol: String(r.symbol),
        name: String(r.shortname ?? r.longname ?? r.symbol),
        exchange: String(r.exchDisp ?? r.exchange ?? ""),
      }))
      .slice(0, 12)
    return Response.json({ results })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Search failed"
    return Response.json({ error: msg }, { status: 502 })
  }
}
