import YahooFinance from "yahoo-finance2"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const yahooFinance = new YahooFinance()

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const symbol = (searchParams.get("symbol") ?? "").trim()
  if (!symbol) {
    return Response.json({ error: "symbol is required" }, { status: 400 })
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const q = (await yahooFinance.quote(symbol)) as any
    const price = Number(q?.regularMarketPrice)
    if (!Number.isFinite(price)) throw new Error("No live quote for this symbol")
    return Response.json({
      price,
      changePct: Number.isFinite(Number(q?.regularMarketChangePercent))
        ? Number(q.regularMarketChangePercent)
        : undefined,
      currency: q?.currency,
      marketState: q?.marketState,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Quote lookup failed"
    return Response.json({ error: msg }, { status: 502 })
  }
}
