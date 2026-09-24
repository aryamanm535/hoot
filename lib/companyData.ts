import YahooFinance from "yahoo-finance2"

const yahooFinance = new YahooFinance()

export type RevenueYearPoint = {
  year: number
  revenue: number
  earnings: number
  profitMargin: number
}

export type EpsQuarterPoint = {
  label: string
  actual: number
  estimate: number
  surprisePct: number
}

export type CompanyFundamentals = {
  symbol: string
  name?: string
  currency?: string
  currentPrice?: number
  changePct?: number
  dayHigh?: number
  dayLow?: number
  prevClose?: number
  volume?: number
  marketState?: string
  marketCap?: number
  trailingPE?: number
  forwardPE?: number
  trailingEps?: number
  forwardEps?: number
  dividendYield?: number
  profitMargin?: number
  grossMargin?: number
  operatingMargin?: number
  week52Low?: number
  week52High?: number
  fiftyDayAvg?: number
  twoHundredDayAvg?: number
  totalRevenue?: number
  recommendationKey?: string
  numberOfAnalystOpinions?: number
  analystTargetLow?: number
  analystTargetMean?: number
  analystTargetHigh?: number
  nextEarningsDate?: number
  revenueYearly: RevenueYearPoint[]
  epsQuarterly: EpsQuarterPoint[]
}

function safeSymbol(s: string): string {
  return s.trim().toUpperCase().replace(/[^A-Z0-9.\-^]/g, "").slice(0, 16)
}

export async function fetchCompanyFundamentals(rawSymbol: string): Promise<CompanyFundamentals> {
  const symbol = safeSymbol(rawSymbol)
  const raw = await yahooFinance.quoteSummary(symbol, {
    modules: ["price", "summaryDetail", "defaultKeyStatistics", "financialData", "earnings"],
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const res = raw as any

  const price = res.price ?? {}
  const summary = res.summaryDetail ?? {}
  const stats = res.defaultKeyStatistics ?? {}
  const fin = res.financialData ?? {}
  const earnings = res.earnings ?? {}

  const revenueYearly: RevenueYearPoint[] = Array.isArray(earnings?.financialsChart?.yearly)
    ? earnings.financialsChart.yearly.map((y: Record<string, unknown>) => ({
        year: Number(y.date),
        revenue: Number(y.revenue) || 0,
        earnings: Number(y.earnings) || 0,
        profitMargin: Number(y.profitMargin) || 0,
      }))
    : []

  const epsQuarterly: EpsQuarterPoint[] = Array.isArray(earnings?.earningsChart?.quarterly)
    ? earnings.earningsChart.quarterly.map((q: Record<string, unknown>) => ({
        label: String(q.date ?? q.fiscalQuarter ?? ""),
        actual: Number(q.actual) || 0,
        estimate: Number(q.estimate) || 0,
        surprisePct: Number(q.surprisePct) || 0,
      }))
    : []

  const earningsDateRaw = earnings?.earningsChart?.earningsDate
  const nextEarningsDate = Array.isArray(earningsDateRaw) && earningsDateRaw[0]
    ? Date.parse(earningsDateRaw[0])
    : undefined

  return {
    symbol,
    name: price.longName ?? price.shortName,
    currency: price.currency,
    currentPrice: price.regularMarketPrice ?? fin.currentPrice,
    changePct: price.regularMarketChangePercent != null
      ? price.regularMarketChangePercent * 100
      : undefined,
    dayHigh: price.regularMarketDayHigh,
    dayLow: price.regularMarketDayLow,
    prevClose: price.regularMarketPreviousClose,
    volume: price.regularMarketVolume,
    marketState: price.marketState,
    marketCap: price.marketCap ?? summary.marketCap,
    trailingPE: summary.trailingPE,
    forwardPE: summary.forwardPE ?? stats.forwardPE,
    trailingEps: stats.trailingEps,
    forwardEps: stats.forwardEps,
    dividendYield: summary.dividendYield,
    profitMargin: fin.profitMargins ?? stats.profitMargins,
    grossMargin: fin.grossMargins,
    operatingMargin: fin.operatingMargins,
    week52Low: summary.fiftyTwoWeekLow,
    week52High: summary.fiftyTwoWeekHigh,
    fiftyDayAvg: summary.fiftyDayAverage,
    twoHundredDayAvg: summary.twoHundredDayAverage,
    totalRevenue: fin.totalRevenue,
    recommendationKey: fin.recommendationKey,
    numberOfAnalystOpinions: fin.numberOfAnalystOpinions,
    analystTargetLow: fin.targetLowPrice,
    analystTargetMean: fin.targetMeanPrice,
    analystTargetHigh: fin.targetHighPrice,
    nextEarningsDate: Number.isFinite(nextEarningsDate) ? nextEarningsDate : undefined,
    revenueYearly,
    epsQuarterly,
  }
}
