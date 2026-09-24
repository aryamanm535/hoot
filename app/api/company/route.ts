import { fetchCompanyFundamentals } from "@/lib/companyData"
import { fetchGoogleNewsArticles } from "@/lib/googleNews"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const symbol = (searchParams.get("symbol") ?? "").trim()
  if (!symbol) {
    return Response.json({ error: "symbol is required" }, { status: 400 })
  }

  try {
    const [fundamentals, news] = await Promise.all([
      fetchCompanyFundamentals(symbol),
      fetchGoogleNewsArticles(symbol, 10).catch(() => []),
    ])
    return Response.json({ fundamentals, news })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load company data"
    return Response.json({ error: msg }, { status: 502 })
  }
}
