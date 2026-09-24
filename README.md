# Hoot — markets made simple 

An AI owl tutor that turns any stock chart into an interactive lesson. Drag across a region of the chart and Hoot explains, in plain English, *why* the price moved — then quizzes you on it and builds flashcards from the new terms.

Built for Hook 'Em Hacks 2026 at UT Austin.

**Live demo:** [use-hoot.vercel.app](https://use-hoot.vercel.app/)

[![Watch the demo](https://img.youtube.com/vi/4kQi3DuMSqk/maxresdefault.jpg)](https://youtu.be/4kQi3DuMSqk)

---

## The idea

When you open a stock chart, all you see is a line going up and down — you don't see *why*. And every explanation online assumes you already know the jargon. Hoot is a friendly tutor that sits on your shoulder while you browse the markets and explains things as you go. No finance background required.

## Features

- **Drag-to-explain charts.** Highlight any slice of a price chart and Gemini writes up what happened, ranks the drivers by importance, and flags any terms a beginner wouldn't know.
- **Auto-generated quizzes.** Every explanation spins up a short quiz tied to that exact move — driver questions, term definitions, direction calls. Earn XP for correct answers.
- **Spaced-repetition flashcards.** Terms you miss get dropped into a flashcard deck and resurfaced on a Leitner-style schedule so they actually stick.
- **Mastery dashboard.** See accuracy per topic (Macro, Earnings, Technicals, Sentiment, Risk, Market Structure) so you know what you're weak on.
- **Finance-only chatbot with live prices.** Ask the owl anything about markets. It pulls live Yahoo Finance quotes before responding, so "what's Apple trading at?" actually works — no "I don't have real-time access" cop-outs.
- **Gamified progress.** XP, ranks, and badge unlocks for hitting milestones. Progress is saved to your account.
- **Candles or line view.** Toggle between a smoothed line and full OHLC candles on any timeframe (1D through 5Y).

## Tech stack

- **Framework:** Next.js 16 (App Router, Turbopack) with React 19 and TypeScript
- **Styling:** Tailwind CSS v4, Framer Motion for animations
- **Charts:** Recharts + custom SVG overlays for the candle layer
- **AI:**
  - **Gemini** for region explanations and learn-pack generation (quizzes, flashcard terms, trade ideas)
  - **Groq** (`llama-3.1-8b-instant`) for the conversational chatbot
- **Market data:** `yahoo-finance2` for live quotes and historical candles, Finnhub as a fallback
- **Accounts and persistence:** Supabase Auth and a row-level protected `user_state` table
- **Deployment:** Vercel

## Project structure

```
app/
  api/
    chart/     — historical OHLC data
    chat/      — finance chatbot (Groq + live Yahoo quotes)
    explain/   — Gemini region explanations + learn packs
    news/      — market headlines
  page.tsx     — main UI (Home, Chart, Learn, You tabs)
components/
  StockChart.tsx        — chart with drag-to-select
  AiThoughtCard.tsx     — explanation + quiz card
  FlashcardsPanel.tsx   — spaced-repetition review
  MasteryPanel.tsx      — per-topic accuracy dashboard
  FinanceChatbot.tsx    — owl chatbot popup
  CompanionOwl.tsx      — floating owl mascot
  Owl.tsx               — owl SVG (three poses)
hooks/
  useLearningStore.ts   — flashcards, attempts, mastery math
  useGameProfile.ts     — XP, ranks, badges
lib/
  ai.ts                 — Gemini prompt + learn-pack synthesis
  marketChart.ts        — price fetching + downsampling
```

## Running locally

```bash
npm install
cp .env.local.example .env.local   # fill in keys
npm run dev
```

Then open [localhost:3000](http://localhost:3000).

### Account setup

1. Create a Supabase project. Copy its Project URL and publishable/anon key into `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` (and your deployment environment).
2. Run [`supabase/user_state.sql`](supabase/user_state.sql) in the Supabase SQL editor. Its row-level security policies keep each user's stocks, progress, and chat separate.
3. In Supabase Auth URL Configuration, set the Site URL to your app URL and allow `http://localhost:3000/**` and your production URL as redirect URLs. Keep email confirmation enabled.
4. Configure Supabase Auth email delivery with an SMTP provider for production. Password reset emails use Supabase Auth's one-time recovery links, redirect back to `/?reset=1`, and let the user choose a new password.

New accounts start with empty saved stocks, progress, and chat, plus default chart settings. Account data, including chart preferences, is restored on sign-in. Existing browser-only data is not automatically assigned to an account, since it cannot be safely attributed to a specific user.

### Required env vars

```
GROQ_API_KEY=      # for the chatbot
GEMINI_API_KEY=    # for chart explanations
```

### Optional

```
GROQ_MODEL=llama-3.1-8b-instant
FINNHUB_API_KEY=   # fallback market data source
```

## Hackathon tracks

- **Intelligent Financial & Market Systems** — primary track
- **Best Use of Gemini API** — Gemini powers the core chart-explanation and learn-pack generation loop

## Team

Built in 24 hours at Hook 'Em Hacks 2026.
