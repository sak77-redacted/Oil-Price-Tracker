# Hormuz Signal Tracker — Build Plan

> Ship today. 11 tasks. ~4 hours total.

---

## Task 1: Project Scaffolding
**Status:** [x]
**Skill:** genius-dev-frontend
**Duration:** 15 min
**Dependencies:** None
**Parallel:** Can run alone

**Steps:**
1. Initialize Next.js 15 project with App Router + TypeScript + Tailwind CSS 4
2. Install dependencies: `recharts`
3. Configure `tailwind.config.ts` with dark theme tokens
4. Set up `globals.css` with dark dashboard variables
5. Create `vercel.json` with ISR config
6. Set up `tsconfig.json` strict mode

**Files:**
- `package.json`
- `next.config.ts`
- `tailwind.config.ts`
- `tsconfig.json`
- `vercel.json`
- `src/app/globals.css`
- `src/app/layout.tsx` (root layout with metadata + fonts)

**Verify:** `npm run dev` starts without errors

---

## Task 2: Type Definitions + Signal Data
**Status:** [x]
**Skill:** genius-dev-frontend
**Duration:** 15 min
**Dependencies:** Task 1
**Parallel:** Can run with Task 3

**Steps:**
1. Define TypeScript types for all 4 signals
2. Create `signals.json` with current real data:
   - Insurance: 5.0% current, 0.25% baseline, threshold 2%
   - Ships: 8 daily, 100 baseline, threshold 35
   - Brent: $112, Dubai: $126, spread: $14
   - Timeline events: SPR Apr 15, waiver expiry, Formosa Apr 1
3. Create `signals.ts` data loader
4. Create `utils.ts` with status logic, formatters, countdown

**Files:**
- `src/lib/types.ts`
- `src/data/signals.json`
- `src/lib/signals.ts`
- `src/lib/utils.ts`

**Verify:** Types compile, signal data loads correctly

---

## Task 3: Oil Price API Route
**Status:** [x]
**Skill:** genius-dev-api
**Duration:** 15 min
**Dependencies:** Task 1
**Parallel:** Can run with Task 2

**Steps:**
1. Research and select free oil price API (try commodities-api.com or fallback)
2. Create API route at `/api/oil-price` to proxy Brent crude price
3. Add error handling and fallback to cached/static value
4. Configure ISR revalidation (15 min)

**Files:**
- `src/lib/oil-api.ts`
- `src/app/api/oil-price/route.ts`

**Verify:** `curl localhost:3000/api/oil-price` returns Brent price JSON

---

## Task 4: Reusable Components — SignalCard + StatusBadge + SparkChart
**Status:** [x]
**Skill:** genius-dev-frontend
**Duration:** 30 min
**Dependencies:** Task 2
**Parallel:** Can run with Task 3

**Steps:**
1. Build `SignalCard.tsx` — dark card with title, current value, status, chart slot, last-updated
2. Build `StatusBadge.tsx` — red/yellow/green pill with label
3. Build `SparkChart.tsx` — mini Recharts line chart with threshold line overlay
4. Ensure responsive sizing

**Files:**
- `src/components/SignalCard.tsx`
- `src/components/StatusBadge.tsx`
- `src/components/SparkChart.tsx`

**Verify:** Components render in isolation with mock data

---

## Task 5: Signal 1 — Insurance Premium Panel
**Status:** [x]
**Skill:** genius-dev-frontend
**Duration:** 20 min
**Dependencies:** Task 4
**Parallel:** Can run with Tasks 6, 7, 8

**Steps:**
1. Build `InsuranceSignal.tsx`
2. Display: current rate (% hull value), baseline comparison, cost example ($100M tanker)
3. Sparkline with threshold line at 2%
4. Status badge based on threshold logic
5. Source attribution: "Lloyd's market quotes via HormuzTracker"

**Files:**
- `src/components/InsuranceSignal.tsx`

**Verify:** Panel renders with real data from signals.json

---

## Task 6: Signal 2 — Ship Transit Panel
**Status:** [x]
**Skill:** genius-dev-frontend
**Duration:** 20 min
**Dependencies:** Task 4
**Parallel:** Can run with Tasks 5, 7, 8

**Steps:**
1. Build `ShipTransitSignal.tsx`
2. Display: daily transit count, outbound vs return legs breakdown
3. Dark fleet caveat banner ("AIS accuracy is itself a normalcy signal")
4. Sparkline with threshold line at 30-40
5. 92% collapse stat from baseline
6. Source attribution: "AIS tracking data, WTO Hormuz Trade Tracker"

**Files:**
- `src/components/ShipTransitSignal.tsx`

**Verify:** Panel renders with transit data + return leg display

---

## Task 7: Signal 3 — Oil Spread Panel
**Status:** [x]
**Skill:** genius-dev-frontend
**Duration:** 20 min
**Dependencies:** Task 3, Task 4
**Parallel:** Can run with Tasks 5, 6, 8

**Steps:**
1. Build `OilSpreadSignal.tsx`
2. Display: Brent price, Dubai physical price, spread calculation
3. "Jawboning discount" explainer note
4. Dual-line sparkline (Brent + Dubai) showing divergence
5. Status badge on spread size
6. Note: "If you're looking at Brent to assess India's oil bill, you're looking at the wrong number"

**Files:**
- `src/components/OilSpreadSignal.tsx`

**Verify:** Panel renders with both prices and calculated spread

---

## Task 8: Signal 4 — Timeline Panel
**Status:** [x]
**Skill:** genius-dev-frontend
**Duration:** 20 min
**Dependencies:** Task 4
**Parallel:** Can run with Tasks 5, 6, 7

**Steps:**
1. Build `TimelineSignal.tsx`
2. Vertical timeline with countdown timers per event
3. Events: SPR depletion (~Apr 15), US-Russia waiver expiry, Formosa force majeure (Apr 1)
4. Supply gap indicator: current 5 mb/d → projected 10 mb/d
5. Overall status based on nearest deadline
6. "Largest crude disruption ever" warning when gap exceeds threshold

**Files:**
- `src/components/TimelineSignal.tsx`

**Verify:** Countdown timers tick correctly, events display in order

---

## Task 9: Verdict Banner — Composite Signal
**Status:** [x]
**Skill:** genius-dev-frontend
**Duration:** 25 min
**Dependencies:** Task 4 (components)
**Parallel:** Can run with Tasks 5, 6, 7, 8

**Steps:**
1. Build `VerdictBanner.tsx` — full-width hero panel at top of dashboard
2. Implement weighted composite scoring:
   - Insurance (35%), Ship Count (25%), Spread (20%), Timeline (20%)
   - Each signal scores -1 (crisis) to +1 (normalizing)
   - Composite < -0.3 = "OIL LIKELY TRENDING HIGHER" (red ▲)
   - Composite > +0.3 = "OIL LIKELY TRENDING LOWER" (green ▼)
   - Else = "OIL DIRECTION UNCERTAIN" (yellow ◆)
3. Duration estimate based on insurance trend + timeline proximity
4. Magnitude estimate based on supply gap (5 mb/d → +$15-25, 10 mb/d → +$30-50)
5. Signal count bar: visual showing X of 4 signals at crisis level
6. Add composite scoring logic to `src/lib/verdict.ts`

**Files:**
- `src/components/VerdictBanner.tsx`
- `src/lib/verdict.ts`

**Verify:** Banner shows correct direction arrow, duration text, and magnitude range based on signal data

---

## Task 10: Main Dashboard Page + Layout
**Status:** [x]
**Skill:** genius-dev-frontend
**Duration:** 30 min
**Dependencies:** Tasks 5, 6, 7, 8, 9

**Steps:**
1. Build `Dashboard.tsx` — Verdict Banner on top + 4-panel grid (2x2 desktop, 1-col mobile)
2. Build `Footer.tsx` — data sources, methodology note, last update time
3. Wire up `page.tsx` — server component that loads signals.json + fetches oil price
4. Add page metadata: title, description, OG tags for social sharing
5. Add header: "Hormuz Signal Tracker" + tagline "4 signals. Zero noise."
6. Responsive layout testing

**Files:**
- `src/components/Dashboard.tsx`
- `src/components/Footer.tsx`
- `src/app/page.tsx`

**Verify:** Full dashboard renders at localhost:3000 — verdict banner + all 4 signals

---

## Task 11: Deploy to Vercel
**Status:** [x]
**Skill:** genius-dev-frontend
**Duration:** 15 min
**Dependencies:** Task 10

**Steps:**
1. Create OG image (simple branded card)
2. Verify build: `npm run build` passes
3. Push to GitHub
4. Connect Vercel, set env vars if needed
5. Deploy and verify live URL
6. Test social sharing preview (OG tags)

**Files:**
- `public/og-image.png` (or generate via next/og)
- Final build verification

**Verify:** Live URL loads, all 4 signals display, mobile responsive

---

## Execution Graph

```
Task 1 (scaffold)
  ├── Task 2 (types + data)  ──┐
  │   └── Task 4 (components) ─┼── Tasks 5,6,7,8,9 (4 signals + verdict — PARALLEL)
  └── Task 3 (oil API)  ───────┘       │
                                        ▼
                                  Task 10 (dashboard page)
                                        │
                                        ▼
                                  Task 11 (deploy)
```

**Critical path:** 1 → 2 → 4 → [5|6|7|8|9] → 10 → 11
**Parallelism:** Tasks 2+3 in parallel, Tasks 5+6+7+8+9 in parallel
**Total tasks:** 11
**Estimated total:** ~4 hours with parallel execution
