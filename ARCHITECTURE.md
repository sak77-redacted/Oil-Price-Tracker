# Hormuz Signal Tracker — Architecture

> Ship today. Track 4 signals. Zero noise.

---

## Architecture Decision: Lean Monolith

**Why:** Same-day shipping. No database, no auth, no microservices. A single Next.js app with API routes, a JSON data file for manual updates, and free external APIs where available.

```
┌─────────────────────────────────────────────────────┐
│                    Vercel (Edge)                     │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │           Next.js 15 (App Router)             │  │
│  │                                               │  │
│  │  ┌─────────┐  ┌──────────┐  ┌─────────────┐  │  │
│  │  │  Page   │  │   API    │  │   Static    │  │  │
│  │  │ (SSR)   │  │  Routes  │  │   Assets    │  │  │
│  │  └────┬────┘  └────┬─────┘  └─────────────┘  │  │
│  │       │            │                          │  │
│  │       ▼            ▼                          │  │
│  │  ┌─────────────────────────┐                  │  │
│  │  │    Signal Data Layer    │                  │  │
│  │  │                         │                  │  │
│  │  │  signals.json (manual)  │                  │  │
│  │  │  + API fetches (live)   │                  │  │
│  │  └────────┬────────────────┘                  │  │
│  └───────────│───────────────────────────────────┘  │
│              │                                      │
└──────────────│──────────────────────────────────────┘
               │
    ┌──────────┴──────────┐
    │   External APIs     │
    ├─────────────────────┤
    │ Oil Prices (free)   │ ← Brent + Dubai proxy
    │ AIS Data (free)     │ ← Ship count estimates
    │ HormuzTracker       │ ← Insurance reference
    └─────────────────────┘
```

---

## Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| **Framework** | Next.js 15 (App Router) | SSR for SEO, API routes for data, ships on Vercel in minutes |
| **Language** | TypeScript (strict) | Type safety for signal data |
| **Styling** | Tailwind CSS 4 | Rapid dark-theme dashboard UI |
| **Charts** | Recharts | Lightweight, React-native, sparklines + threshold lines |
| **Data Store** | `src/data/signals.json` | No DB needed — manual updates via JSON, redeploy on Vercel |
| **Live Data** | Next.js API routes + ISR | Fetch oil prices on interval, cache with revalidation |
| **Deploy** | Vercel | Push-to-deploy, edge CDN, free tier sufficient |
| **Domain** | Vercel subdomain (MVP) | Custom domain later if needed |

---

## Data Strategy Per Signal

### Signal 1: Insurance Premiums
- **Source:** Manual entry in `signals.json` (updated from Lloyd's List / HormuzTracker)
- **Format:** `{ current: 5.0, baseline: 0.25, threshold: 2.0, history: [{date, value}] }`
- **Update frequency:** 1-2x daily (when new quotes published)
- **Display:** Gauge + sparkline + threshold marker at 2%

### Signal 2: AIS Ship Transits
- **Source:** Manual entry + reference to WTO Hormuz Trade Tracker
- **Format:** `{ dailyCount: 8, baseline: 100, threshold: 35, returnLegs: 3, darkFleetNote: "..." , history: [{date, count, returnCount}] }`
- **Update frequency:** Daily
- **Display:** Count card + outbound vs return breakdown + dark fleet caveat banner

### Signal 3: Brent vs Dubai Physical Spread
- **Brent:** Free API — `commodities-api.com` or `api.oilpriceapi.com` (auto-fetched)
- **Dubai Physical:** Manual entry (not available free — use S&P Global published quotes)
- **Format:** `{ brent: 112, dubai: 126, spread: 14, history: [{date, brent, dubai}] }`
- **Update frequency:** Brent auto every 15min (ISR), Dubai manual daily
- **Display:** Dual price cards + spread bar + convergence chart

### Signal 4: Mid-April Cliff Timeline
- **Source:** Static editorial data with dates
- **Format:** Array of `{ event, date, status: "active"|"expired"|"extended", impact }`
- **Update frequency:** As events happen (manual)
- **Display:** Vertical timeline with countdown timers + supply gap indicator (5→10 mb/d)

---

## Project Structure

```
hormuz-tracker/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout, metadata, fonts
│   │   ├── page.tsx                # Main dashboard (server component)
│   │   ├── globals.css             # Tailwind imports + custom vars
│   │   └── api/
│   │       └── oil-price/
│   │           └── route.ts        # Proxy to oil price API (avoids CORS)
│   ├── components/
│   │   ├── VerdictBanner.tsx       # TOP: composite signal → direction + duration + magnitude
│   │   ├── Dashboard.tsx           # 4-signal grid layout
│   │   ├── SignalCard.tsx          # Reusable signal card wrapper
│   │   ├── InsuranceSignal.tsx     # Signal 1: premium gauge
│   │   ├── ShipTransitSignal.tsx   # Signal 2: transit count + return legs
│   │   ├── OilSpreadSignal.tsx     # Signal 3: Brent vs Dubai
│   │   ├── TimelineSignal.tsx      # Signal 4: April cliff countdown
│   │   ├── SparkChart.tsx          # Mini trend chart (Recharts)
│   │   ├── StatusBadge.tsx         # Red/yellow/green indicator
│   │   └── Footer.tsx              # Attribution + data sources
│   ├── lib/
│   │   ├── types.ts                # Signal data types
│   │   ├── signals.ts              # Load + merge signal data
│   │   ├── oil-api.ts              # Brent price fetcher
│   │   └── utils.ts                # Formatting, countdown calc
│   └── data/
│       └── signals.json            # Manual signal data store
├── public/
│   ├── og-image.png                # Social share preview
│   └── favicon.ico
├── tailwind.config.ts
├── next.config.ts
├── package.json
├── tsconfig.json
└── vercel.json                     # ISR + caching config
```

---

## UI Design Principles

- **Dark theme** — professional, financial dashboard aesthetic
- **4-panel grid** — each signal gets equal weight, responsive to 2-col on tablet, 1-col on mobile
- **Traffic light status** — each signal shows red (crisis), yellow (improving), green (normalizing)
- **Threshold lines** — clearly marked on every chart
- **Last updated timestamps** — builds trust, shows data freshness
- **Data source attribution** — every number links to its source
- **No clutter** — zero ads, zero signup, zero analytics popups

---

## Verdict Banner — Composite Signal

Sits at the top of the dashboard. Synthesizes all 4 signals into 3 plain-English readings:

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│   ▲ OIL LIKELY TRENDING HIGHER          Disruption: SEVERE       │
│                                                                  │
│   Duration: Weeks to months             Price risk: +$20–40/bbl  │
│                                                                  │
│   [■■■■ ] 3 of 4 signals at crisis levels                       │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Direction Logic (weighted composite)

Each signal contributes a score from -1 (bullish for oil) to +1 (bearish for oil):

```typescript
// Weights reflect information quality
const weights = {
  insurance: 0.35,   // Highest — real money, billions at stake
  shipCount: 0.25,   // Direct physical measure
  spread:    0.20,   // Market pricing disconnect
  timeline:  0.20,   // Forward-looking catalyst
};

// Score per signal: -1 = crisis (oil higher), 0 = neutral, +1 = normalizing (oil lower)
insuranceScore:  rate >= 5 → -1,  rate >= 2 → 0,  rate < 2 → +1
shipScore:       count < 20 → -1, count < 40 → 0, count >= 40 → +1
spreadScore:     gap > 8 → -1,   gap > 3 → 0,    gap <= 3 → +1
timelineScore:   days <= 7 → -1, days <= 21 → 0,  days > 21 → +1

composite = weighted average of all scores
composite < -0.3 → "OIL LIKELY TRENDING HIGHER"  (▲ red)
composite > +0.3 → "OIL LIKELY TRENDING LOWER"   (▼ green)
else             → "OIL DIRECTION UNCERTAIN"      (◆ yellow)
```

### Duration Estimate

Based on insurance trend + timeline proximity:
- All signals red + timeline < 14 days → **"Weeks to months"**
- Mixed signals → **"1–3 weeks if diplomacy progresses"**
- Most signals improving → **"Days to weeks"**

### Magnitude Estimate

Based on supply gap and historical precedents:
- Supply gap 5 mb/d (current with stopgaps) → **"+$15–25/bbl above baseline"**
- Supply gap 10 mb/d (post-April cliff) → **"+$30–50/bbl — uncharted territory"**
- Gap narrowing → **"+$5–15/bbl, normalizing"**

Baseline reference: pre-crisis Brent ~$75–80.

### Signal Count Bar

Simple visual: `[■■■■ ]` showing how many of 4 signals are at crisis level. Quick glance = severity.

---

## Status Logic Per Signal

```typescript
// Insurance: lower is better
insurance < 2.0  → "green"  // Safe to transit
insurance < 5.0  → "yellow" // Improving but risky
insurance >= 5.0 → "red"    // Crisis pricing

// Ship count: higher is better
ships >= 40      → "green"  // Trade resuming
ships >= 20      → "yellow" // Trickle
ships < 20       → "red"    // Effectively closed

// Spread: lower is better
spread <= 3      → "green"  // Paper = physical
spread <= 8      → "yellow" // Diverging
spread > 8       → "red"    // Severe disconnect

// Timeline: days until cliff
days > 21        → "green"  // Breathing room
days > 7         → "yellow" // Approaching
days <= 7        → "red"    // Imminent
```

---

## Performance Targets

| Metric | Target |
|--------|--------|
| First load | < 1.5s (Vercel edge) |
| Lighthouse perf | > 90 |
| Bundle size | < 150KB (JS) |
| Data freshness | Oil prices: 15min, Manual: same-day |

---

## Security Considerations

- No user data collected
- No auth needed (public dashboard)
- API routes proxied to avoid exposing third-party API keys
- Rate limiting via Vercel's built-in protections
- `signals.json` updates via git push (no admin API needed for MVP)

---

## Deployment Strategy

1. Push to GitHub
2. Connect to Vercel (auto-deploy on push)
3. Set env vars: `OIL_API_KEY` (if needed)
4. Manual data updates: edit `signals.json` → push → auto-redeploy (~30s)

---

## Dev Sub-Skills Required

- **genius-dev-frontend** — Dashboard UI, components, charts
- **genius-dev-api** — Oil price API integration, proxy route

---

## What This Architecture Does NOT Include (By Design)

- No database (JSON file is sufficient for 4 signals)
- No user accounts or auth
- No push notifications (dashboard-only)
- No CMS (edit JSON, push to git)
- No WebSocket/real-time (ISR revalidation is sufficient)
- No testing framework (ship today, add tests later)
