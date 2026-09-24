"use client"

import { useUserState } from "./useUserState"
const MAX = 20

/** Tracks tickers the user has searched for (most recent first). */
export function useSavedStocks() {
  const [symbols, setSymbols, ready, error] = useUserState<string[]>("saved-stocks", [])

  const record = (symbol: string) => {
    const s = symbol.trim().toUpperCase()
    if (!s) return
    setSymbols((prev) => [s, ...prev.filter((x) => x !== s)].slice(0, MAX))
  }

  const remove = (symbol: string) => {
    setSymbols((prev) => prev.filter((x) => x !== symbol))
  }

  return { symbols, ready, error, record, remove }
}
