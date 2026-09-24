import YahooFinance from "yahoo-finance2"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const yahooFinance = new YahooFinance()

const CACHE_MS = 5 * 60_000
let cache: { usdInr: number; fetchedAt: number } | null = null

export async function GET() {
  if (cache && Date.now() - cache.fetchedAt < CACHE_MS) {
    return Response.json(cache)
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const quote = (await yahooFinance.quote("USDINR=X")) as any
    const usdInr = Number(quote?.regularMarketPrice)
    if (!Number.isFinite(usdInr) || usdInr <= 0) throw new Error("Bad FX quote")
    cache = { usdInr, fetchedAt: Date.now() }
    return Response.json(cache)
  } catch (e) {
    if (cache) return Response.json(cache)
    const msg = e instanceof Error ? e.message : "FX lookup failed"
    return Response.json({ error: msg }, { status: 502 })
  }
}
