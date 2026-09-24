import { generateLiveThought } from "@/lib/ai"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const ticker = (searchParams.get("ticker") ?? "AAPL").toUpperCase()

  const data = await generateLiveThought(ticker)

  return Response.json(data)
}
