export type Currency = "USD" | "INR"

/** Indian exchanges use Yahoo's .NS (NSE) / .BO (BSE) suffixes — everything else defaults to USD. */
export function nativeCurrencyForSymbol(symbol: string): Currency {
  const s = symbol.trim().toUpperCase()
  return s.endsWith(".NS") || s.endsWith(".BO") ? "INR" : "USD"
}

export function currencySymbol(c: Currency): string {
  return c === "INR" ? "₹" : "$"
}

/** Convert between USD and INR using a USD→INR rate (1 USD = rate INR). No-ops if currencies match. */
export function convertCurrency(amount: number, from: Currency, to: Currency, usdInrRate: number): number {
  if (from === to || !Number.isFinite(usdInrRate) || usdInrRate <= 0) return amount
  if (from === "USD" && to === "INR") return amount * usdInrRate
  if (from === "INR" && to === "USD") return amount / usdInrRate
  return amount
}
