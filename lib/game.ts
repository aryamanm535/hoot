export type RankId = "novice" | "analyst" | "trader" | "strategist" | "oracle"

export type Rank = {
  id: RankId
  label: string
  xpStart: number
  accent: string
}

export const RANKS: Rank[] = [
  { id: "novice", label: "Novice", xpStart: 0, accent: "#94a3b8" },
  { id: "analyst", label: "Analyst", xpStart: 100, accent: "#34d399" },
  { id: "trader", label: "Trader", xpStart: 300, accent: "#38bdf8" },
  { id: "strategist", label: "Strategist", xpStart: 750, accent: "#a78bfa" },
  { id: "oracle", label: "Oracle", xpStart: 1500, accent: "#fbbf24" },
]

export function rankForXp(xp: number): { rank: Rank; next: Rank | null; pct: number } {
  let rank = RANKS[0]
  for (const r of RANKS) if (xp >= r.xpStart) rank = r
  const idx = RANKS.findIndex((r) => r.id === rank.id)
  const next = RANKS[idx + 1] ?? null
  const span = next ? next.xpStart - rank.xpStart : 1
  const into = Math.max(0, xp - rank.xpStart)
  const pct = next ? Math.min(100, Math.round((into / span) * 100)) : 100
  return { rank, next, pct }
}

export type BadgeCategory = "Explorer" | "Quiz" | "Chartist" | "Streak"

export type Badge = {
  id: string
  label: string
  description: string
  category: BadgeCategory
  icon: string
}

export const BADGES: Badge[] = [
  // Explorer
  { id: "explorer-first", label: "First Look", description: "Explain your first chart range", category: "Explorer", icon: "🔍" },
  { id: "explorer-5", label: "Chart Sleuth", description: "Explain 5 different ranges", category: "Explorer", icon: "🧭" },
  { id: "explorer-20", label: "Market Cartographer", description: "Explain 20 ranges", category: "Explorer", icon: "🗺️" },
  { id: "tickers-3", label: "Three Tickers Deep", description: "Look at 3 different stocks", category: "Explorer", icon: "🎯" },
  { id: "tickers-10", label: "Broad Watchlist", description: "Look at 10 different stocks", category: "Explorer", icon: "📡" },
  // Quiz
  { id: "quiz-1", label: "First Answer", description: "Answer a quiz question", category: "Quiz", icon: "✏️" },
  { id: "quiz-10", label: "Quiz Climber", description: "Get 10 correct answers", category: "Quiz", icon: "🧠" },
  { id: "quiz-25", label: "Quiz Master", description: "Get 25 correct answers", category: "Quiz", icon: "🏆" },
  { id: "topic-macro", label: "Macro Mind", description: "Answer a Macro question correctly", category: "Quiz", icon: "🌐" },
  { id: "topic-earnings", label: "Earnings Ear", description: "Answer an Earnings question correctly", category: "Quiz", icon: "📣" },
  { id: "topic-tech", label: "Chart Reader", description: "Answer a Technicals question correctly", category: "Quiz", icon: "📈" },
  { id: "topic-sentiment", label: "Mood Reader", description: "Answer a Sentiment question correctly", category: "Quiz", icon: "🫀" },
  { id: "topic-risk", label: "Risk Radar", description: "Answer a Risk question correctly", category: "Quiz", icon: "🛡️" },
  // Chartist
  { id: "draw-1", label: "First Line", description: "Draw a comparison line", category: "Chartist", icon: "✏️" },
  { id: "draw-10", label: "Pattern Hunter", description: "Draw 10 comparison lines", category: "Chartist", icon: "🪢" },
  { id: "candles-1", label: "Candle Lit", description: "View the candlestick chart", category: "Chartist", icon: "🕯️" },
  { id: "timeframe-all", label: "Time Traveler", description: "View every timeframe (1D–5Y)", category: "Chartist", icon: "⏳" },
  // Streak
  { id: "streak-3", label: "Habit Forming", description: "3-day activity streak", category: "Streak", icon: "🔥" },
  { id: "streak-7", label: "Week Strong", description: "7-day activity streak", category: "Streak", icon: "💪" },
  { id: "streak-30", label: "Unshakable", description: "30-day activity streak", category: "Streak", icon: "🏔️" },
]

export const BADGE_BY_ID = Object.fromEntries(BADGES.map((b) => [b.id, b])) as Record<
  string,
  Badge
>

export type GameProfile = {
  xp: number
  tickersExplored: string[]
  rangesExplained: number
  quizCorrect: number
  quizTotal: number
  topicsCorrect: Record<string, number>
  drawLines: number
  candlesViewed: boolean
  timeframesSeen: string[]
  streakDays: number
  lastActiveDay: string // ISO date (yyyy-mm-dd)
  badges: string[]
}

export const INITIAL_PROFILE: GameProfile = {
  xp: 0,
  tickersExplored: [],
  rangesExplained: 0,
  quizCorrect: 0,
  quizTotal: 0,
  topicsCorrect: {},
  drawLines: 0,
  candlesViewed: false,
  timeframesSeen: [],
  streakDays: 0,
  lastActiveDay: "",
  badges: [],
}

export const ALL_TIMEFRAMES = ["1D", "1W", "1M", "3M", "1Y", "5Y"]

export function earnedBadges(p: GameProfile): string[] {
  const out = new Set<string>(p.badges)
  if (p.rangesExplained >= 1) out.add("explorer-first")
  if (p.rangesExplained >= 5) out.add("explorer-5")
  if (p.rangesExplained >= 20) out.add("explorer-20")
  if (p.tickersExplored.length >= 3) out.add("tickers-3")
  if (p.tickersExplored.length >= 10) out.add("tickers-10")
  if (p.quizTotal >= 1) out.add("quiz-1")
  if (p.quizCorrect >= 10) out.add("quiz-10")
  if (p.quizCorrect >= 25) out.add("quiz-25")
  if ((p.topicsCorrect.Macro ?? 0) >= 1) out.add("topic-macro")
  if ((p.topicsCorrect.Earnings ?? 0) >= 1) out.add("topic-earnings")
  if ((p.topicsCorrect.Technicals ?? 0) >= 1) out.add("topic-tech")
  if ((p.topicsCorrect.Sentiment ?? 0) >= 1) out.add("topic-sentiment")
  if ((p.topicsCorrect.Risk ?? 0) >= 1) out.add("topic-risk")
  if (p.drawLines >= 1) out.add("draw-1")
  if (p.drawLines >= 10) out.add("draw-10")
  if (p.candlesViewed) out.add("candles-1")
  if (ALL_TIMEFRAMES.every((tf) => p.timeframesSeen.includes(tf))) out.add("timeframe-all")
  if (p.streakDays >= 3) out.add("streak-3")
  if (p.streakDays >= 7) out.add("streak-7")
  if (p.streakDays >= 30) out.add("streak-30")
  return Array.from(out)
}

export function todayStamp(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export function bumpStreak(prevDay: string, prevStreak: number): number {
  const today = todayStamp()
  if (prevDay === today) return prevStreak || 1
  if (!prevDay) return 1
  const y = new Date()
  y.setDate(y.getDate() - 1)
  const yesterday = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, "0")}-${String(y.getDate()).padStart(2, "0")}`
  if (prevDay === yesterday) return prevStreak + 1
  return 1
}
