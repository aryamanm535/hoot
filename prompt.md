Product: MarketLens
Tagline

An AI-powered market learning platform that helps beginners understand why stocks move through guided chart exploration, real-world news explanations, and interactive lessons.

1. Executive Summary

MarketLens is an educational financial product that transforms stock market learning from passive reading into an interactive, guided experience. Instead of showing users static charts and generic articles, MarketLens lets users explore real market events visually and conversationally.

The product is built around one core insight:

Most beginners do not know what to look for on a chart, and even when they see a major price move, they do not know how to connect that move to earnings, macro news, sentiment, or sector trends.

MarketLens solves this by:

automatically highlighting important moments on stock charts,
explaining why those moves likely happened,
letting users drag-select any time range to interrogate a move,
teaching users through gamified prediction prompts and AI-guided lessons,
adapting explanations based on user expertise level.

This is not meant to be a brokerage, trading terminal, or professional analysis platform. It is an AI-native educational interface for market understanding.

2. Product Vision

Build the most intuitive way for a beginner to learn how the market reacts to real events.

The product should feel like:

a tutor,
an analyst,
and an interactive simulator

all in one interface.

A user should be able to open the app, click on a highlighted market event, and say:

“Oh, now I understand why this happened.”

3. Problem Statement
3.1 Current State

Today, beginner investors and market learners face several problems:

Charts are intimidating
Users can see price movement but do not know what matters.
They do not know whether to focus on dips, spikes, volume, trend breaks, or news timing.
Financial news is disconnected from price action
Users read headlines but cannot infer how that news affects stocks.
They do not understand whether a headline is likely bullish, bearish, temporary, or irrelevant.
Existing platforms assume background knowledge
Most tools are built for traders, not learners.
They use jargon, dense dashboards, and little pedagogical structure.
Learning is passive
Articles, videos, and newsletters tell users information.
They do not let users interact with real examples and test their understanding.
Beginners do not know where to start
A drag-to-explore feature alone is not enough because a novice does not know what to drag.
4. Proposed Solution

MarketLens is an AI-powered learning experience for market understanding.

It combines:

interactive charts,
news-aware AI explanations,
guided event discovery,
gamified prediction flows,
multi-level tutoring modes.

The system helps users understand:

why a stock moved,
what news or market factors likely caused it,
how to reason about similar events in the future.

The app should prioritize:

clarity,
visual guidance,
educational value,
delight.
5. Goals
5.1 Primary Goals
Help beginners understand why stock price movements happen.
Create a strong “wow” moment through interactive chart-based AI explanation.
Make financial learning visual, engaging, and beginner-friendly.
Deliver an impressive demo suitable for a hackathon.
Build a product that feels clearly differentiated from generic stock/news apps.
5.2 Secondary Goals
Support intermediate users through deeper analysis modes.
Build a flexible architecture that can later support:
sectors,
ETFs,
macro events,
crypto,
personalized learning paths.
5.3 Non-Goals
Executing trades
Giving personalized investment advice
Portfolio management
Replacing brokerage platforms
Producing institution-grade causal inference or guaranteed explanations
6. Target Users
6.1 Primary User Persona: Beginner Investor

Profile

College student or young professional
Curious about stocks but lacks confidence
Reads headlines but struggles to interpret them
Wants to learn in a more interactive way

Needs

Guidance
Simplicity
Real-world examples
Explanations without jargon

Pain Points

“I don’t know what I’m looking at.”
“I saw the stock dropped, but I don’t know why.”
“Financial apps feel made for experts.”
6.2 Secondary User Persona: Intermediate Learner

Profile

Understands basic stock concepts
Wants faster insight into price moves
Interested in connecting charts to events

Needs

Better explanations
Pattern recognition
Confidence in reasoning
6.3 Tertiary User Persona: Hackathon Judge / Demo Viewer

Profile

Sees product for 2–3 minutes
Needs immediate clarity
Wants to be impressed quickly

Needs

Instant value proposition
Strong visual demo moment
Clear differentiation
Obvious AI contribution
7. Core Product Principles
Guide, don’t overwhelm
Never drop users into a blank chart with no direction.
Show, then explain
Visual markers and interactions should come before long text.
Teach through real examples
Always connect concepts to actual price moves and real news.
Keep explanations layered
Beginner mode should be simple.
Analyst mode should be richer.
Optimize for demoable delight
The product should produce visible intelligence quickly.
Avoid overclaiming
Present explanations as likely drivers, not guaranteed truth.
8. User Experience Overview

The app should feel like an AI tutor embedded inside a market charting experience.

A user should be able to:

land on a stock page,
see important moments already highlighted,
click one to get a reasoned explanation,
answer a prediction question,
ask follow-up questions,
switch between beginner and analyst explanations,
optionally drag-select a custom range for deeper exploration.
9. Feature Set
9.1 MVP Features

These are required for the first usable version.

9.1.1 Guided Chart Highlights

The app automatically detects and annotates important events on a stock chart.

Examples:

Major drop
Major spike
Unusual volatility
Earnings-related move
Trend reversal

Each highlight should appear as a chart annotation or marker.

When clicked, the app opens an explanation panel.

Purpose

removes blank-slate problem,
gives beginners an obvious starting point,
creates immediate interactivity.
9.1.2 Event Explanation Panel

When a highlight is clicked, the app generates an explanation for why the move happened.

The explanation panel should include:

event title,
timeframe,
price movement summary,
likely causes,
relevant news items,
confidence indicator,
beginner/analyst toggle.

Example:

“AAPL dropped 4.3% over this window.”
“Likely drivers: earnings miss, sector weakness, negative sentiment.”
“Confidence: Medium.”
9.1.3 Drag-to-Explain Interaction

Users can drag-select any chart region.

Once selected, the system should:

identify the date/time range,
fetch relevant news around that period,
retrieve price/volume context,
ask the LLM to explain likely drivers,
display a structured explanation.

This is the primary advanced interaction and major demo feature.

9.1.4 Guided Discovery Mode

The app should proactively help users learn.

Possible entry points:

“Why do stocks crash?”
“What causes spikes?”
“Show me a real earnings reaction.”
“Show me an example of macro news affecting a stock.”

The system should then jump to a real chart example and explain it.

This is critical for beginners.

9.1.5 Gamified Prediction Prompt

When a highlighted event is selected, the app may ask:

“What do you think caused this move?”

Answer choices:

Earnings
Company news
Market-wide sentiment
Macro event
Sector pressure

After the user chooses, the system reveals:

the likely explanation,
why that answer was right/wrong,
the learning takeaway.

This should feel educational, not gimmicky.

9.1.6 Beginner vs Analyst Explanation Modes

A UI toggle should allow the user to switch between:

Beginner Mode
Analyst Mode

Beginner Mode:

simpler language,
fewer terms,
shorter sentences,
concrete examples.

Analyst Mode:

more detail,
more nuanced market reasoning,
includes sector/macro/sentiment interplay.
9.1.7 Auto-Explain Feed

The homepage or dashboard should include a curated list of notable market events.

Examples:

“Biggest move of the week”
“Most interesting volatility event”
“Earnings surprise reaction”
“Macro-driven selloff”

Each card links into the chart/event explanation experience.

This provides instant value even before active exploration.

9.2 Stretch Features

These are not required for MVP but should be accommodated architecturally.

9.2.1 AI Tutor Chat

A conversational interface for follow-up questions like:

“Explain this like I’m 12.”
“Why would bad earnings cause this?”
“Has this happened before?”
“Was this mostly due to market sentiment?”
9.2.2 Pattern Recognition Overlay

The system identifies event archetypes such as:

post-earnings dip,
overreaction recovery,
macro shock selloff,
momentum spike,
sector sympathy move.
9.2.3 Similar Historical Events

For any selected event:

find prior similar moves,
compare causes and outcomes.
9.2.4 Voice Explanations

Use a TTS system to read explanations aloud.

9.2.5 “What If” Scenario Simulation

User asks:

“What if interest rates rise?”
“What if earnings beat expectations?”

The app provides a conceptual market impact explanation.

10. Functional Requirements
10.1 Stock Selection

The system must allow a user to select or search for a stock ticker.

Requirements
Search input with autocomplete or simple symbol entry
Load associated chart and data
Persist current stock in URL or app state
10.2 Chart Display

The system must render an interactive stock chart.

Requirements
Timeframe switching: 1D, 1W, 1M, 3M, 1Y, Max
Hover tooltip for date and price
Highlight overlays/markers
Drag selection support
Smooth rendering and responsiveness
10.3 Event Detection

The system must identify interesting chart events for guided exploration.

Event Types
large percentage move,
sudden volatility,
volume spike,
local max/min,
post-news move,
post-earnings move.
Implementation Guidance

Can begin with heuristic detection:

price change threshold over time window,
volume spike threshold,
volatility threshold.

No heavy ML required for MVP.

10.4 News Retrieval

The system must fetch news articles relevant to a selected stock and time range.

Requirements
Retrieve headline, source, timestamp, URL, summary if available
Filter by date proximity to selected event
Rank likely relevance to move
Notes

For MVP, relevance ranking can be heuristic before AI refinement:

same-day articles,
ticker mention,
source credibility,
keyword overlap.
10.5 AI Explanation Generation

The system must generate a structured explanation for a selected event.

Required Inputs
ticker
selected time window
price movement summary
volume summary
relevant news articles
optional market/sector context
explanation mode (Beginner / Analyst)
Required Output

Structured JSON:

event_summary
likely_causes[]
confidence
key_news[]
teaching_takeaway
quiz_question (optional)
quiz_options[]
quiz_answer
quiz_explanation
10.6 Guided Discovery

The system must allow users to start with a conceptual prompt rather than a chart action.

Supported Starter Prompts
Why do stocks crash?
What causes sudden spikes?
What do earnings do to stocks?
How does bad news affect a company?
What is market sentiment?

The app should map these to prepared or dynamically selected examples.

10.7 Gamification

The system must optionally provide a lightweight quiz interaction.

Requirements
generate one multiple-choice question for selected event,
accept user answer,
reveal correct answer and explanation,
avoid blocking main explanation if user skips.
10.8 Explanation Modes

The system must adapt explanation style based on user preference.

Beginner Mode
max concise length target,
explain jargon,
simple analogies,
focus on cause-effect.
Analyst Mode
richer details,
mention sector, macro, sentiment,
more precise financial framing.
11. Non-Functional Requirements
11.1 Performance
Initial page load should feel fast
Explanation generation should ideally complete within 3–8 seconds
Chart interactions should be immediate
Loading states should feel polished
11.2 Reliability
If AI explanation fails, app should still show chart and news
If news retrieval is weak, app should degrade gracefully
System should never crash from missing article metadata
11.3 Usability
Must work well for first-time users
UI must clearly indicate where to click
Text should be readable and not overwhelming
11.4 Demo Readiness
Must support a polished happy path
Must allow preselected examples
Should avoid dependence on fragile real-time behavior where possible
12. Information Architecture
12.1 Primary Screens
A. Home / Discovery Page

Purpose:

introduce concept,
let users search a stock,
present featured market events,
provide “start learning” prompts.

Sections:

hero area with stock search,
featured event cards,
guided questions,
recently explored events.
B. Stock Exploration Page

Purpose:

central product experience.

Layout:

Chart in center
AI explanation panel on right
Event list or highlights summary on left/top

Components:

timeframe selector,
chart with overlays,
drag-select hint,
beginner/analyst toggle,
explanation panel,
relevant news list,
quiz section.
C. Guided Lesson Page or Modal

Purpose:

story-driven learning journey for beginners.

Flow:

ask question,
show real event,
explain,
quiz,
takeaway.
12.2 Optional Future Screens
Profile / learning history
Saved events
Compare events
Voice mode
Similar events explorer
13. Detailed UX Flows
13.1 Flow A: Beginner First-Time Experience
User opens app
Sees headline: “Understand why the market moves”
Sees guided prompts like:
Why do stocks crash?
Show me a real spike
Clicks one prompt
App opens stock chart at a relevant event
Highlight is preselected
AI explanation appears
User answers a prediction question
App shows takeaway

Success condition:
User learns something without needing prior market knowledge.

13.2 Flow B: Guided Highlight Exploration
User searches for NVDA
App loads chart with annotations
User clicks a spike marker
Explanation panel opens
User switches from Beginner to Analyst mode
User reviews related headlines
User asks follow-up via tutor mode or moves to another highlight

Success condition:
User quickly connects chart movement to likely drivers.

13.3 Flow C: Drag-to-Explain
User opens AAPL chart
User drags over a sudden dip
App shows loading state: “Analyzing selected move...”
App fetches relevant news and chart metrics
AI explanation appears with cause breakdown
User gets optional quiz

Success condition:
Selected event is explained in a way that feels intelligent and grounded.

14. Data Model
14.1 Stock
type Stock = {
  symbol: string;
  name: string;
  exchange?: string;
  sector?: string;
};
14.2 PricePoint
type PricePoint = {
  timestamp: string; // ISO
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};
14.3 NewsArticle
type NewsArticle = {
  id: string;
  title: string;
  source: string;
  publishedAt: string; // ISO
  url: string;
  summary?: string;
  tickers?: string[];
};
14.4 ChartEvent
type ChartEvent = {
  id: string;
  symbol: string;
  startTime: string;
  endTime: string;
  eventType: "drop" | "spike" | "volatility" | "earnings" | "reversal";
  magnitudePct: number;
  volumeChangePct?: number;
  title: string;
  description?: string;
};
14.5 AIExplanation
type AIExplanation = {
  eventSummary: string;
  likelyCauses: {
    label: string;
    weight: number;
    explanation: string;
  }[];
  confidence: "low" | "medium" | "high";
  keyNews: {
    title: string;
    rationale: string;
  }[];
  teachingTakeaway: string;
  mode: "beginner" | "analyst";
  quiz?: {
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  };
};
15. System Architecture
15.1 Frontend

Recommended:

Next.js
TypeScript
Tailwind CSS
shadcn/ui
Chart library such as TradingView lightweight charts or Recharts-compatible market chart component

Responsibilities:

render chart,
support drag interaction,
display annotations,
render AI explanation panel,
manage guided flows,
manage mode toggles and quiz interactions.
15.2 Backend

Recommended:

Next.js API routes or standalone Node/Express service

Responsibilities:

fetch market data,
fetch news data,
run event detection,
call LLM,
normalize structured responses,
cache frequent queries.
15.3 Data Sources

Potential sources:

stock prices: Yahoo Finance, Alpha Vantage, Polygon, Twelve Data
news: NewsAPI, Finnhub, market news providers

For hackathon MVP:

pick the fastest API with low setup friction.
15.4 AI Layer

Recommended:

Gemini or equivalent LLM

Responsibilities:

synthesize market/news context,
produce explanation JSON,
generate quiz content,
adapt output by expertise mode.

Important:
Use structured prompting and JSON schema enforcement.

16. AI Prompting Requirements

The model should not produce generic commentary. It should behave like an educational market reasoning engine.

16.1 Prompt Goals
explain selected move,
connect news to price action,
present multiple plausible causes,
acknowledge uncertainty,
adapt explanation style,
produce structured response.
16.2 Prompt Constraints
do not give investment advice,
do not guarantee causality,
frame output as likely explanations,
keep beginner mode jargon-light,
ensure output is valid JSON.
16.3 Example Prompt Skeleton
You are an AI market tutor.

You are given:
- stock symbol
- selected chart window
- price movement statistics
- volume context
- relevant news headlines and summaries
- explanation mode: beginner or analyst

Your job is to explain why the stock likely moved during that window.

Rules:
- Do not provide investment advice.
- Do not claim certainty unless the evidence is overwhelming.
- Present likely causes with weights summing to 100.
- Explain in a way appropriate to the requested mode.
- Use concrete reasoning tied to the provided articles and movement data.
- Return ONLY valid JSON.

Return this schema:
{
  "eventSummary": "string",
  "likelyCauses": [
    {
      "label": "string",
      "weight": number,
      "explanation": "string"
    }
  ],
  "confidence": "low | medium | high",
  "keyNews": [
    {
      "title": "string",
      "rationale": "string"
    }
  ],
  "teachingTakeaway": "string",
  "mode": "beginner | analyst",
  "quiz": {
    "question": "string",
    "options": ["string", "string", "string", "string"],
    "correctAnswer": "string",
    "explanation": "string"
  }
}
17. Event Detection Logic

For MVP, use deterministic heuristics rather than ML.

17.1 Major Drop

Detect windows where:

price decline exceeds a threshold within a time period
optional volume spike supports significance

Example:

daily price move < -3%
or intraday move > configurable threshold
17.2 Major Spike

Detect windows where:

price increase exceeds threshold
optional high volume
17.3 Unusual Volatility

Detect windows with:

high ATR-like movement,
large candle range,
consecutive sharp moves.
17.4 Event Prioritization

Rank events by:

magnitude,
volume anomaly,
news density,
recency.
18. UI Requirements
18.1 Design Goals
sleek,
modern,
high-contrast,
visually chart-centric,
easy to understand at a glance.
18.2 Required Components
stock search
chart container
annotation markers
explanation side panel
mode toggle
event cards
quiz widget
loading skeletons
empty/error states
18.3 UI Behavior
highlight selection should visibly animate or focus
loading state should explain what is happening
explanation panel should not completely block chart
key cause weights should be visually represented (bars, chips, or stacked indicator)
19. Error Handling Requirements

The system must gracefully handle:

No news found
show price-based reasoning only
say “No highly relevant headlines were found for this exact window.”
AI timeout
show fallback “Top candidate causes” using heuristic ranking
Bad or malformed AI JSON
retry once,
otherwise show fallback explanation
Invalid stock symbol
show friendly search error
Sparse price history
disable certain views and explain why
20. Analytics / Instrumentation

For hackathon MVP, lightweight instrumentation is enough.

Track:

stock searched,
highlight clicked,
drag selections made,
quiz completion,
mode toggles,
guided prompt clicks,
explanation generation latency.

Purpose:

useful for debugging,
helpful to mention in future roadmap,
may support product narrative.
21. Success Metrics
21.1 Product Success
User can understand a highlighted move within 10–15 seconds
User can start learning without knowing where to click
Explanation feels specific, not generic
Users engage with at least one guided or quiz interaction
21.2 Demo Success
Judge immediately understands product in <20 seconds
Core chart-to-explanation interaction works reliably
Guided highlight flow feels magical
Product feels educational and differentiated
21.3 Technical Success
chart renders correctly
event detection identifies at least 3 meaningful highlights
drag-to-explain works for at least one strong demo stock/timeframe
AI returns structured output consistently
22. MVP Scope Recommendation
Must Have
stock search
chart display
automatic highlights
click highlight to explain
drag-select to explain
beginner/analyst toggle
related news display
one gamified prediction interaction
guided starter prompts
Nice to Have
tutor chat
similar event comparison
voice output
scenario simulation
account persistence
Do Not Build in MVP
brokerage integrations
portfolio syncing
user authentication unless trivial
complex personalization
real-time streaming complexity unless already easy
23. Build Order for Claude Code
Phase 1: Scaffold
Next.js app
routing
design system
chart page shell
search input
static mock data
Phase 2: Market Data Integration
ticker search
price history fetching
chart rendering
timeframe selection
Phase 3: Event Detection + Highlights
heuristic event detector
marker rendering
selectable events
Phase 4: News Integration
fetch relevant articles
date filtering
stock relevance filtering
Phase 5: AI Explanation Engine
backend endpoint
structured prompt
JSON parsing
fallback handling
Phase 6: Guided UX
starter prompt cards
event preselection
quiz flow
beginner/analyst toggle
Phase 7: Polish
loaders
animations
better empty states
responsive layout
demo scenario hardening
24. Demo Script Alignment

The app should support the following demo flow cleanly:

“Most people can see the market move, but they don’t know why.”
Open a stock chart with highlighted events.
Click a highlighted drop.
Show AI-generated explanation with cause breakdown.
Switch to Beginner vs Analyst mode.
Ask the judge to answer a prediction question.
Drag over another chart region.
Show AI explaining that custom-selected move.
End with: “We built an AI that teaches you how to think about the market using real data.”
25. Future Roadmap

After MVP, possible directions:

personalized learning journeys,
portfolio-aware explanations,
sector heatmaps,
ETF education mode,
watchlists,
historical pattern explorer,
AI tutor memory,
market concept curriculum.
26. Claude Code Handoff Notes

Claude Code should treat this as:

a polished hackathon MVP,
strongly UX-driven,
not a backend-heavy finance platform.

Implementation priorities:

Make the chart interactions feel real.
Make the explanations feel specific.
Make onboarding intuitive for beginners.
Optimize for demo stability and clarity.

The product should feel:

educational,
intelligent,
modern,
visually compelling.

Avoid spending too much time on:

auth,
databases,
excessive abstraction,
enterprise-scale backend design.

Favor:

speed,
reliable demo path,
clean UI,
mocked or cached examples where useful.
27. One-Paragraph Product Summary

MarketLens is an AI-powered educational market interface that helps beginners understand why stocks move. Instead of forcing users to interpret raw charts and disconnected financial news, it highlights meaningful market events, explains likely causes using real-world data, and teaches through guided prompts, chart interactions, and lightweight gamification. The core experience combines visual exploration with AI reasoning so users can learn how to think about the market, not just consume information.