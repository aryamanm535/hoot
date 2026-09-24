export type NewsArticle = {
  id: string
  title: string
  url: string
  publisher: string
  publishedAt: number
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, "")
}

function textBetween(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i"))
  return m?.[1] ? decodeEntities(stripTags(m[1].trim())) : ""
}

function sourceFrom(block: string): string {
  const m = block.match(/<source\b[^>]*>([\s\S]*?)<\/source>/i)
  return m?.[1] ? decodeEntities(stripTags(m[1].trim())) : "Google News"
}

function safeSymbol(s: string): string {
  return s.trim().toUpperCase().replace(/[^A-Z0-9.\-]/g, "").slice(0, 16)
}

/** Fetch recent exact article entries from Google News RSS for a ticker query. */
export async function fetchGoogleNewsArticles(ticker: string, limit = 8): Promise<NewsArticle[]> {
  const sym = safeSymbol(ticker)
  if (!sym) return []
  const q = encodeURIComponent(`${sym} stock`)
  const url = `https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; MarketMindStream/1.0)",
      Accept: "application/rss+xml, application/xml, text/xml",
    },
    next: { revalidate: 0 },
  })
  if (!res.ok) return []

  const xml = await res.text()
  const items = xml.match(/<item>([\s\S]*?)<\/item>/gi) ?? []
  return items.slice(0, limit).map((item, i) => {
    const title = textBetween(item, "title")
    const rawLink = textBetween(item, "link")
    const link = rawLink.startsWith("http://") || rawLink.startsWith("https://") ? rawLink : "https://news.google.com/"
    const pubDate = textBetween(item, "pubDate")
    const publishedAt = pubDate ? Date.parse(pubDate) : Date.now() - i * 60_000
    return {
      id: `${sym}-${i}-${title.slice(0, 24)}`,
      title,
      url: link,
      publisher: sourceFrom(item),
      publishedAt: Number.isFinite(publishedAt) ? publishedAt : Date.now() - i * 60_000,
    }
  })
}

