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

## Task 12: JH Physical Market Integration
**Status:** [x]
**Skill:** genius-dev-frontend
**Duration:** ~45 min
**Dependencies:** Task 11
**Date:** 2026-05-08

**Goal:** Fold the JH/@CRUDEOIL231 physical-oil-market thesis into the dashboard so the verdict reflects (1) the temporary buyer-stress lull, (2) Kpler's reopening-capacity floor, and (3) inline JH commentary on the relevant signals.

**Steps:**
1. Add `PhysicalMarketNote` type and an optional `physicalMarketNote` field to InsuranceSignal, ShipTransitSignal, OilSpreadSignal, TimelineSignal, BufferMathSignal, and BuyerStressSignal in `src/lib/types.ts`.
2. Add new `BuyerStressSignal` type: WAF programme status, WTI 3-2-1 crack, buyer-behavior label, days-since-crisis, etc. Wire status logic per the JH thesis.
3. Populate `src/data/signals.json` with:
   - JH notes on `oilSpread`, `timeline`, and `bufferMath` (Signal 3 / 4 / 8) dated 2026-05-07.
   - A new `buyerStress` block (Signal 9) dated 2026-05-08: WAF stalled, 3-2-1 crack $54, wait-and-see.
4. Build `src/components/BuyerStressSignal.tsx` — full SignalCard with crack hero number, three sub-stat chips, status-driven insight, and methodology footnote.
5. Render `physicalMarketNote` in `src/components/SignalCard.tsx` as an italic blockquote with `border-l-2 border-amber-500/40 pl-3` accent and date+attribution footer.
6. Pass `bufferMath.physicalMarketNote` into `SupplyBalanceSignal` (which doesn't use SignalCard) and render the same blockquote pattern in its footer.
7. Add `ReopeningScenario` to `src/lib/verdict.ts`: scale the status-quo magnitude move toward spot by `REOPENING_CAPACITY_FLOOR = 0.5` (Kpler thesis: Iranian-controlled reopening structurally capped at 40–50% of pre-crisis Gulf export capacity).
8. Render the Reopening Scenario Sensitivity sub-panel in `src/components/VerdictBanner.tsx` — two side-by-side cards (Status quo vs Iranian-controlled reopening) with Brent + Dubai Physical bands, source attribution.
9. Restructure the Early Warning Signals strip in `src/components/Dashboard.tsx` from `xl:grid-cols-5` to `lg:grid-cols-3`, and insert Signal 9 (BuyerStressSignal) as a full-detail card between the strip and Signal 7 (SPRCliffSignal).

**Files:**
- `src/lib/types.ts`
- `src/lib/verdict.ts`
- `src/data/signals.json`
- `src/components/BuyerStressSignal.tsx` (new)
- `src/components/SignalCard.tsx`
- `src/components/SupplyBalanceSignal.tsx`
- `src/components/OilSpreadSignal.tsx`
- `src/components/TimelineSignal.tsx`
- `src/components/VerdictBanner.tsx`
- `src/components/Dashboard.tsx`

**Verify:** `npm run build` passes; dashboard at localhost:3000 shows new Signal 9 card, JH quote blocks on Signals 3/4/8, Reopening Scenario sub-panel inside the verdict banner.

---

## Task 13: Fact-check fixes (importer cover frames + India narrative)
**Status:** [x]
**Skill:** genius-dev-frontend
**Duration:** ~45 min
**Dependencies:** Task 12
**Date:** 2026-05-08

**Goal:** Resolve the audit verdicts on Signal 7's Importer Days of Cover panel — methodology was mixing IEA stockholding, Hormuz-share burn-down, and bespoke calculations across countries, producing misleading rankings. Fix India numbers, reconcile US SPR contradictions, and label every importer's frame.

**Steps:**
1. Switch canonical importer metric to IEA "days of net imports" where it applies (SK, Japan, EU). Label per-country alternates explicitly under the bar.
2. Replace numbers per audit: India dual ~9d SPR / ~74d total; SK ~200d; Japan ~200d; US ~173d (to 150 Mb floor @ 1.4 Mbpd from EIA May 1 SPR = 392.7 Mb); China ~120d; EU well-buffered (108 Mt vs 90 Mt obligation).
3. Add `frame`, `staticDays`, `secondaryDays`, `secondaryLabel`, `forceWellBuffered`, `wellBufferedLabel` optional fields to the local `Importer` interface in `SPRCliffSignal.tsx` so dual display + IEA reference numbers can render without elapsed-days subtraction.
4. Replace the "binding constraint" paragraph with the verbatim India narrative (45–50% Hormuz share, ISPRL Phase-1 5.33 MMT / ~36.9 Mbbl, 9.5 days full / 6 days at 64% fill, +OMC 64d → 74d total, IEA 90-day standard not binding, Phase 2 ~2030).
5. Reconcile US SPR across signals.json: `bufferMath.sprBreakdown.us` 413 → 392.7; `sprStatus.countries.us.totalMb` 700 → 392.7 with EIA-anchored note; `timeline.events[spr-depletion].event` reframed as "release authorization runs dry" with new tranche context.
6. Update India entry in `regionalImpact[]` with the dual reserve framing.
7. Rewrite the methodology footer of Signal 7 to lead with IEA canonical metric and cite per-country sources (IEA, EIA weekly, Eurostat / EU Directive 2009/119, PPAC/Vortexa, ISPRL, The Print).
8. `npm run build` passes.

**Files:**
- `src/components/SPRCliffSignal.tsx`
- `src/data/signals.json`

**Verify:** `npm run build` passes. On localhost:3000, Signal 7 panel shows India "9d / 74d total" with "SPR-only / +OMC commercial" frame label, SK & Japan ~200d "IEA · days of net imports", US ~173d "days to 150 Mb floor @ 1.4 Mbpd", China ~120d, EU "108 Mt vs 90 Mt IEA obligation" green-bar treatment. New India narrative paragraph appears beneath the bars. Source attribution lists IEA / EIA / Eurostat / PPAC / ISPRL.

---

## Task 14: Podcast intel integration (Signal 10 + turnarounds + quality note + quotes)
**Status:** [x]
**Skill:** genius-dev-frontend
**Duration:** ~60 min
**Dependencies:** Task 13
**Date:** 2026-05-08

**Goal:** Layer the May 8, 2026 Trade with Conviction podcast (Neil Crosby + June Goh + Jorge Molina) onto the dashboard — add a new Signal 10 (US Product Stocks Runway), a Refinery Turnaround Calendar sub-panel on Signal 4, a TAN/quality bottleneck explainer on the Reopening Scenario sub-panel, and dated quote blocks on Signals 3 / 8 / Verdict Banner.

**Steps:**
1. Add `USProductStocksSignal` and `RefineryTurnaround` types to `src/lib/types.ts`. Add `physicalMarketNotes?: PhysicalMarketNote[]` to all signal types (keep singular `physicalMarketNote?` for backward compat).
2. Build `src/components/USProductStocksSignal.tsx` — full SignalCard with weeks-to-critical hero, three sub-stat chips (commercial draws, PAD1 status, Japan Aug fixtures), status-driven insight, methodology footnote.
3. Add `usProductStocks` block to `src/data/signals.json` (3 weeks to PAD1 critical, 1.4 mb/d commercial draws, "2–3 draws from critical", 12 mb Japan Aug fixtures, etc.).
4. Add `timeline.refineryTurnarounds[]` array to `signals.json` (SK Osan, Reliance Sika, Valero) with capacity, start date, duration, notes — plus a `refineryTurnaroundsNote` and `refineryTurnaroundsSource`.
5. Render the Planned Refinery Turnarounds sub-panel inside `CriticalDeadlines.tsx` as a horizontal grid table under the chip row.
6. Update `SignalCard.tsx` and `SupplyBalanceSignal.tsx` to render `physicalMarketNotes` array (newest first) with backward compat for singular `physicalMarketNote`.
7. Append Crosby quote (gasoil spread + OSP) to `oilSpread.physicalMarketNotes`. Append Crosby quote (Japan 12 mb fixture) to `bufferMath.physicalMarketNotes`.
8. In `VerdictBanner.tsx`, fold a TAN/quality bottleneck italic note + Neil Crosby quote into the Reopening Scenario sub-panel.
9. Insert Signal 10 in `Dashboard.tsx` immediately after Signal 9.
10. Append decision `d-012` to `.genius/memory/decisions.json` documenting the Trade with Conviction integration.
11. `npm run build` passes.

**Files:**
- `src/lib/types.ts`
- `src/data/signals.json`
- `src/components/USProductStocksSignal.tsx` (new)
- `src/components/SignalCard.tsx`
- `src/components/SupplyBalanceSignal.tsx`
- `src/components/CriticalDeadlines.tsx`
- `src/components/VerdictBanner.tsx`
- `src/components/Dashboard.tsx`
- `.genius/memory/decisions.json`

**Verify:** `npm run build` passes. Signal 10 card renders below Signal 9 with "~3 weeks" hero metric and three sub-stats. Signal 4 shows the Planned Refinery Turnarounds sub-panel. Verdict Banner Reopening Scenario block has the TAN/metals italic note and Crosby quote. Signal 3 and Signal 8 each show the new May 8 Crosby quote stacked above the existing JH quote.

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

---

## Task 15: Signal 11 — Curve Shape / % Backwardation
**Status:** [x]
**Skill:** genius-dev-frontend
**Duration:** ~45 min
**Dependencies:** Task 14
**Date:** 2026-05-16

**Goal:** Add curve-shape signal capturing how much of the supply shock is priced in. Per Jeff Currie (Carlyle, May 16): % backwardation hit ATH in April, near record today — supply shock priced in spot, not in long-run. Back end at $75 vs Russia-Ukraine $86 is why spot can't break out.

**Steps:**
1. Add `CurveShapeSignal`, `CurveShapeHistoryPoint`, `CurveShapeAtHigh`, `CurveShapeHistoricalParallel` interfaces to `src/lib/types.ts`. Add optional `curveShape?: CurveShapeSignal` to `SignalData`.
2. Add `curveShape` block to `src/data/signals.json` with spot ($107), 12m ($94), 24m ($82), 36m ($75), 29.9% backwardation, $32 absolute, ATH @ Apr 30 ($126 spot / $84 back / 33.5%), two historical parallels (RUS-UA peak, Pre-Hormuz baseline), 10-point history.
3. Build `src/components/CurveShapeSignal.tsx` — full SignalCard with backwardation hero, three-column sub-stat (spot / 24mo / 36mo), historical-parallel strip (2 cards), SparkChart of % backwardation history with threshold line at 25, status-driven insight, methodology footer.
4. Status logic: red >25%, yellow 15–25%, green <15%.
5. Bind PhysicalMarketNote Currie quote (back-end anchoring thesis) via SignalCard.

**Files:**
- `src/lib/types.ts`
- `src/data/signals.json`
- `src/components/CurveShapeSignal.tsx` (new)

**Verify:** `npm run build` passes. Card renders inside Market Belief Signals section with "29.9%" hero, three sub-stat chips, two historical-parallel mini-cards, sparkline with threshold line, and Currie quote.

---

## Task 16: Signal 12 — Energy Equity Disbelief Gauge
**Status:** [x]
**Skill:** genius-dev-frontend
**Duration:** ~45 min
**Dependencies:** Task 15
**Date:** 2026-05-16

**Goal:** Add energy equity dislocation signal. Per Currie: S&P Energy ÷ S&P 500 implies long-run Brent ~$70 below strip $75; Munificent 7 (XOM/CVX/COP/SHEL/TTE/BP/EQNR) yields 15.5% FCF at $105 vs Magnificent 7 at 1.5%; 1,000bp FCF gap means forced rotation or oil collapse.

**Steps:**
1. Add `EquityDisbeliefSignal`, `EquityDisbeliefBasket`, `EquityDisbeliefHistoryPoint` interfaces to `src/lib/types.ts`. Add optional `equityDisbelief?: EquityDisbeliefSignal` to `SignalData`.
2. Add `equityDisbelief` block to `src/data/signals.json`: energy 4.0% of SPX, 1,040 bps gap, $70 implied long-run vs $75 strip, Munificent / Magnificent 7 baskets, $10tn rotation potential, 7-point history.
3. Build `src/components/EquityDisbeliefSignal.tsx` — SignalCard with bps-gap hero, three sub-stats (Energy weight / Implied LR Brent / Muni-vs-Mag FCF), two basket comparison cards (constituents/FCF/PE/capex), SparkChart of bps gap with threshold at 500, status insight, methodology footer.
4. Status logic: red >800 bps, yellow 500–800, green <500.
5. Wire into Dashboard.tsx below Signal 10 inside a new "Market Belief Signals" divider, two-column grid alongside CurveShapeSignal (lg:grid-cols-2).
6. Three annotation additions: prepend Currie Dated-Brent caveat to `oilSpread.physicalMarketNotes`; prepend Currie capex-starvation quote to `bufferMath.physicalMarketNotes`; append Currie HALO/security-premium framing to `recoveryClock.keyInsight`.

**Files:**
- `src/lib/types.ts`
- `src/data/signals.json`
- `src/components/EquityDisbeliefSignal.tsx` (new)
- `src/components/Dashboard.tsx`

**Verify:** `npm run build` passes. Market Belief Signals section appears below Signal 10 with Signal 11 + Signal 12 side-by-side on desktop. Annotations visible on Signal 3 (oilSpread), Signal 8 (bufferMath), and Recovery Clock insight.
