import { fetchMarketChartSeries } from "@/lib/marketChart"
import type { ChartTimeframe } from "@/lib/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const ALLOW_TF = new Set<ChartTimeframe>(["1D", "1W", "1M", "3M", "1Y", "5Y"])

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const symbol = (searchParams.get("symbol") ?? "AAPL").trim().toUpperCase()
  const tfRaw = searchParams.get("timeframe") ?? "1D"
  const timeframe: ChartTimeframe = ALLOW_TF.has(tfRaw as ChartTimeframe)
    ? (tfRaw as ChartTimeframe)
    : "1D"

  try {
    const { points, source } = await fetchMarketChartSeries(symbol, timeframe)
    return Response.json({ source, symbol, timeframe, points })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Chart request failed"
    return Response.json(
      { source: "none" as const, symbol, timeframe, points: [] as unknown[], error: msg },
      { status: 502 }
    )
  }
}
