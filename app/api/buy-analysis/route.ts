import { generateBuyPriceAnalysis } from "@/lib/ai"
import { fetchCompanyFundamentals } from "@/lib/companyData"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  let body: { symbol?: string; targetPrice?: number }
  try {
    body = (await req.json()) as { symbol?: string; targetPrice?: number }
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const symbol = String(body.symbol ?? "").trim()
  const targetPrice = Number(body.targetPrice)
  if (!symbol) {
    return Response.json({ error: "symbol is required" }, { status: 400 })
  }
  if (!Number.isFinite(targetPrice) || targetPrice <= 0) {
    return Response.json({ error: "targetPrice must be a positive number" }, { status: 400 })
  }

  try {
    const fundamentals = await fetchCompanyFundamentals(symbol)
    const result = await generateBuyPriceAnalysis(symbol, targetPrice, fundamentals)
    return Response.json(result)
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Buy analysis failed"
    return Response.json({ error: msg }, { status: 502 })
  }
}
