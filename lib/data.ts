export async function getStockData(ticker: string) {
    const res = await fetch(`https://api.example.com/stock/${ticker}`)
    return res.json()
  }
  
  export async function getNews() {
    const res = await fetch(`https://newsapi.org/v2/top-headlines?category=business`)
    return res.json()
  }