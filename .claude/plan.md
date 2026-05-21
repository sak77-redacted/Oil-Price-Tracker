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

---

## Task 17: Signal 13 — Visible Inventory Draws + Sellside-vs-HFI framing
**Status:** [x]
**Skill:** genius-dev-frontend
**Duration:** ~60 min
**Dependencies:** Task 16
**Date:** 2026-05-19

**Goal:** Integrate HFI Research's May 19, 2026 "Point of No Return" note. Sellside (JPM, Goldman, Morgan Stanley) has converged on a "Strait reopens June 1, Brent $100 year-end" base case; JPM Figure 1 shows 2026 inventories plunging through every prior year's range by June. HFI's counter: logistical constraints (ballast tankers redirected to US drainage) push Persian Gulf restart to August at earliest, and anchoring biases lower diplomatic-resolution probability daily. Goldman Exhibit 10 (the strongest new evidence): global visible draws have averaged -4.4 mb/d since Mar 1, accelerating to -7.5 mb/d in May.

**Steps:**
1. Add `VisibleStocksMonthEntry`, `ImpliedFlowComponent`, `InventoryDrawsSignal` interfaces to `src/lib/types.ts`. Add optional `inventoryDraws?: InventoryDrawsSignal` to `SignalData`.
2. Populate `src/data/signals.json` with the full `inventoryDraws` block: Goldman Exhibit 10 dataset (March / April / May rows for global visible, landed crude OECD/China/Non-OECD, landed products OECD NGL/OECD refined/Non-OECD, oil-on-water floating crude/floating products/crude in transit/products in transit), implied-flow decomposition (12 mb/d shut-in + 2 mb/d demand loss − 2.5 mb/d SPR releases = 7.5 mb/d net), and HFI May 19 quote in physicalMarketNotes.
3. Build `src/components/InventoryDrawsSignal.tsx` — SignalCard with -7.5 mb/d hero, three sub-stat chips (period avg, MoM acceleration, tank-bottom risk), implied-flow decomposition strip with reconciling-math chips (red drains, green fill, red net-draw highlight), full Goldman Exhibit 10 mini-table with color-coded cells (red <-1, yellow -1 to -0.3, green/neutral >-0.3) and partial-month tag for May, status-driven insight banner tying back to JPM tank-bottom thesis vs HFI logistical-constraint counter, and methodology footer.
4. Wire `InventoryDrawsSignal` into `src/components/Dashboard.tsx` between Signal 10 (USProductStocksSignal) and the Market Belief Signals section (Signals 11 + 12).
5. Add a "Sellside Consensus vs HFI" contrast block to `src/components/VerdictBanner.tsx` Reopening Scenario sub-panel — two side-by-side cards (muted gray sellside vs amber HFI) below the existing status-quo / Iranian-controlled cards.
6. Prepend HFI May 19 quotes to `bufferMath.physicalMarketNotes` (May draw decomposition) and `oilSpread.physicalMarketNotes` (sellside-mark-to-market). Append HFI commentary to `recoveryClock.keyInsight` (logistical constraints on Persian Gulf restart).
7. Append decision `d-013` to `.genius/memory/decisions.json`.

**Files:**
- `src/lib/types.ts`
- `src/data/signals.json`
- `src/components/InventoryDrawsSignal.tsx` (new)
- `src/components/Dashboard.tsx`
- `src/components/VerdictBanner.tsx`
- `.genius/memory/decisions.json`

**Verify:** `npm run build` passes. Dashboard at localhost:3000 shows Signal 13 card below Signal 10 with "-7.5 mb/d" hero metric, implied-flow chips (+12.0 shut-in, +2.0 demand loss, −2.5 SPR releases, = 7.5 mb/d net draw), and Goldman Exhibit 10 mini-table with May column flagged partial. Verdict Banner Reopening Scenario sub-panel now has Sellside-vs-HFI contrast block below the two scenario cards. HFI May 19 quote appears newest-first on Signal 3 (oilSpread), Signal 8 (bufferMath), and Recovery Clock keyInsight.

---

## Task 18: Signal 14 — Paper Market Conviction Gauge (OIES / JH May 21)
**Status:** [x]
**Skill:** genius-dev-frontend
**Duration:** ~60 min
**Dependencies:** Task 17
**Date:** 2026-05-21

**Goal:** Add the *missing layer* explaining why spot Brent stays $107 despite physical tightness — paper-market deleveraging. Per JH/@CRUDEOIL231's read of OIES Q1–Q2 2026 paper market review: Brent OI cratered (anomaly — scares typically spike OI), money managers forced out by VaR + margin hikes, mega traders pinned WTI OI via Long WTI / Short Brent spread, and flow migrated to 0DTE/short-dated options (defined risk, no overnight margin calls). When paper conviction collapses, physical signals lead price by weeks not days — the dashboard's verdict needs this context.

**Steps:**
1. Add `PaperMarketSignal`, `OpenInterestSnapshot`, `OptionsShareEntry`, `PositioningEntry`, `PaperMarketHistoryPoint` interfaces to `src/lib/types.ts`. Add optional `paperMarket?: PaperMarketSignal` to `SignalData`.
2. Add `paperMarket` block to `src/data/signals.json` with:
   - Brent OI hero: current ≈1.9M contracts vs Jan baseline ≈2.9M (≈ -34%), labeled estimate "OIES Q1–Q2 2026 paper market review (JH/@CRUDEOIL231 synthesis, May 21)"
   - WTI OI snapshot: held flatter via mega-trader Long-WTI/Short-Brent spread (note ICE doubled Brent margins; CME SPAN portfolio offsets favor WTI capital efficiency)
   - Money manager net length: Brent MM net long collapsed from ~250k to ~80k (forced retrenchment, VaR breach)
   - Swap dealer / commercial offset: WTI swap dealer short spike from shale panic hedging, mirrored by commercial long
   - Options share table: 0DTE 25% → 30%, 1–3 DTE 34% → 39%, weekly WTI options ADV ~33,000 contracts (+50% YoY)
   - ADV/OI ratio: hot-potato intraday turnover at multi-year high
   - 6-point history of Brent OI and MM net length
   - JH May 21 quote: full 8-point thesis condensed to 3-line attribution block
3. Build `src/components/PaperMarketSignal.tsx` — full SignalCard with:
   - Hero: Brent OI delta vs baseline ("-34%" red), with absolute contract count
   - Three sub-stat chips: MM net length collapse / 0DTE share / Weekly options ADV YoY
   - "Anomaly" insight banner: "Geopolitical scares usually SPIKE open interest. This one cratered. That's the deleveraging tell."
   - Two-card positioning strip: Brent (deleveraging) vs WTI (mega-trader floor) — explains the divergence
   - Options-share comparison table: pre-crisis vs current shares for 0DTE / 1–3 DTE / weekly ADV
   - SparkChart of Brent OI history with horizontal baseline line
   - Status-driven insight tying to spot-price suppression thesis (low conviction = physical signals lead price by weeks not days)
   - Methodology footer crediting OIES report + JH synthesis
4. Status logic: red if `currentBrentOI / baselineBrentOI < 0.75` (forced retrenchment confirmed), yellow 0.75–0.90, green ≥0.90.
5. Wire `PaperMarketSignal` into `src/components/Dashboard.tsx` inside the "Market Belief Signals" section as a third card. Restructure that section's grid from `lg:grid-cols-2` to `lg:grid-cols-3` (or stack PaperMarket full-width above the existing CurveShape + EquityDisbelief pair if visual density warrants).
6. Annotation additions (newest-first prepends):
   - Prepend JH paper-market quote to `curveShape.physicalMarketNotes` — *"Backwardation hit ATH but spot can't break out because the marginal buyer/seller has been forced out. Money manager VaR limits + ICE margin doubling pushed conviction money to the sidelines; 0DTE option flow now dominates and exits by 4pm."*
   - Prepend JH paper-market quote to `equityDisbelief.physicalMarketNotes` (add the field if not present) — *"Energy equity dislocation is amplified by the paper-market deleveraging. With OI cratered and CTAs sidelined, the marginal mark-to-market that would force rotation isn't there. Until paper conviction returns, the FCF gap persists."*
   - Append JH paper-market quote to `verdictBanner` or top-of-dashboard caveat (decide best home during implementation; may live in Dashboard.tsx header instead).
7. Append decision `d-014` to `.genius/memory/decisions.json` documenting the OIES/JH paper-market integration.
8. `npm run build` passes.

**Files:**
- `src/lib/types.ts`
- `src/data/signals.json`
- `src/components/PaperMarketSignal.tsx` (new)
- `src/components/Dashboard.tsx`
- `.genius/memory/decisions.json`

**Verify:** `npm run build` passes. Dashboard shows new "Signal 14 — Paper Market Conviction" card inside the Market Belief Signals section with "-34%" Brent OI hero, anomaly insight banner, Brent-vs-WTI positioning strip, options-share comparison table, and JH May 21 quote. Signal 11 (curveShape) and Signal 12 (equityDisbelief) each show the new JH paper-market quote stacked newest-first above prior Currie quotes. `d-014` appears in decisions.json with full rationale.

---

## Task 19: Actionability Restructure — 3-Tier Layout + Today's Tape + Watch This Week
**Status:** [ ]
**Skill:** genius-dev-frontend
**Duration:** ~75 min
**Dependencies:** Task 18
**Date:** 2026-05-21

**Goal:** Re-prioritize the dashboard around a single user goal: *actionable direction on oil*. Today the 14 signals sit in a flat grid that mixes tick-horizon signals (Insurance, Spread, Curve, Paper market — move daily) with structural signals (SPR cliff, Buffer math, Visible draws, Equity disbelief — move monthly). The flat layout dilutes tick signals with structural noise. Fix is hierarchy not deletion.

**Steps:**
1. Build `src/components/TodaysTape.tsx` — full-width horizontal strip directly beneath VerdictBanner. Six live numbers in one row, mobile-stacks-to-2-col: Brent ($), Dubai ($), spread ($), % backwardation, 0DTE share (%), insurance (% hull). Each tile shows: number, label, and tiny color-coded delta-vs-yesterday arrow. Data pulled from existing `oilSpread`, `curveShape`, `paperMarket`, `insurance` blocks — no new fields required.
2. Build `src/components/WatchThisWeek.tsx` — full-width card beneath TodaysTape. Auto-compose the top 3 dated catalysts from `timeline.events`, `timeline.refineryTurnarounds`, and `buyerStress.wafProgrammeStatus`. Each row: date, event, why-it-matters one-liner, magnitude tag (Tier 1 / Tier 2 / Tier 3). Pure derived component — no new data.
3. Restructure `src/components/Dashboard.tsx` into three explicit sections with prominent dividers:
   - **TIER 1 — ACTION** (always visible): VerdictBanner → TodaysTape → WatchThisWeek
   - **TIER 2 — REGIME** (always visible, 5–6 cards in 2-col grid): InsuranceSignal, OilSpreadSignal, CurveShapeSignal, PaperMarketSignal, BuyerStressSignal, ShipTransitSignal
   - **TIER 3 — STRUCTURAL CONTEXT** (collapsible `<details>` block, closed by default): SPRCliffSignal, SupplyBalanceSignal (buffer math), InventoryDrawsSignal, USProductStocksSignal, EquityDisbeliefSignal, CriticalDeadlines (timeline detail + turnaround calendar), RecoveryClock
4. Add visual section dividers between tiers — bold uppercase label + horizontal rule + one-sentence tier description: "Tier 1 — what to act on today / Tier 2 — the five signals that move the verdict / Tier 3 — depth, context, and structural drivers".
5. Sharpen `VerdictBanner.tsx` direction call: add explicit "5-day directional bias" line beneath the headline magnitude band (e.g., "Bias: ↑ HIGHER over next 5 trading days · 60% confidence based on regime + paper market state"). Pull bias logic into a new helper in `src/lib/verdict.ts`.
6. Update Dashboard header tagline from "X signals. Zero noise." to "Direction. Duration. Magnitude." — matches the new actionability framing.
7. Append decision `d-015` to `.genius/memory/decisions.json` documenting the tier restructure rationale.

**Files:**
- `src/components/TodaysTape.tsx` (new)
- `src/components/WatchThisWeek.tsx` (new)
- `src/components/Dashboard.tsx`
- `src/components/VerdictBanner.tsx`
- `src/lib/verdict.ts`
- `.genius/memory/decisions.json`

**Verify:** `npm run build` passes. Dashboard at localhost:3000 shows three clearly delineated tiers. Tier 1 (VerdictBanner + TodaysTape + WatchThisWeek) is the first viewport. Tier 2 shows the 6 regime cards in a 2-col grid. Tier 3 is collapsed by default behind a single "Structural Context (7 signals)" toggle. Verdict banner now includes explicit 5-day directional bias line with confidence %.

---

## Task 20: Signal 15 — Tanker Rates (VLCC TD3 + Suezmax)
**Status:** [ ]
**Skill:** genius-dev-frontend
**Duration:** ~45 min
**Dependencies:** Task 19
**Date:** 2026-05-21

**Goal:** Add the highest-leverage missing leading indicator. VLCC TD3 (Middle East Gulf → China) and Suezmax day rates are daily-moving, Hormuz-attributable, and historically lead spot Brent moves by 1–3 days because freight is the first cost to spike when arbitrage opportunities open or close. Currently the dashboard has *ship counts* (Signal 2) but not *ship economics*.

**Steps:**
1. Add `TankerRatesSignal`, `TankerRoute`, `TankerHistoryPoint` interfaces to `src/lib/types.ts`. Add optional `tankerRates?: TankerRatesSignal` to `SignalData`.
2. Add `tankerRates` block to `src/data/signals.json` with:
   - VLCC TD3 (MEG→China): current ~$95k/day vs $30k baseline (≈ +217%), Worldscale WS135 vs WS50
   - Suezmax: current ~$72k/day vs $25k baseline
   - Aframax (Mediterranean): ~$58k/day vs $22k baseline (sanity check)
   - 14-point daily history for each route
   - Source attribution: Baltic Exchange BDTI + Clarksons + Argus
3. Build `src/components/TankerRatesSignal.tsx` — SignalCard with VLCC TD3 hero ("$95k/day · +217%"), three-route sub-stat grid, dual SparkChart (VLCC + Suezmax overlay) with baseline reference lines, status insight tying freight spikes to spot price lead-lag pattern, methodology footer.
4. Status logic: red if VLCC TD3 >2× baseline, yellow 1.5–2×, green <1.5×.
5. Insert into Dashboard Tier 2 (after Task 19 restructure) as the 7th regime card OR promote to Tier 1 if user prefers — leave layout decision to implementation pass.

**Files:**
- `src/lib/types.ts`
- `src/data/signals.json`
- `src/components/TankerRatesSignal.tsx` (new)
- `src/components/Dashboard.tsx`

**Verify:** `npm run build` passes. Card renders with VLCC TD3 hero, dual sparkline, and freight-leads-spot insight banner. Slots cleanly into Tier 2 regime grid.

---

## Task 21: Signal 16 — Implied Vol Skew (Brent options market expectations)
**Status:** [ ]
**Skill:** genius-dev-frontend
**Duration:** ~50 min
**Dependencies:** Task 20
**Date:** 2026-05-21

**Goal:** Complete the paper-market picture. Signal 14 captures positioning (who's exposed). Signal 16 captures expectations (what options money EXPECTS to happen). Together they answer: "is there enough conviction in either direction for the verdict to play out, and which way are the options-money bets leaning?" Risk reversal (call IV − put IV) is the cleanest single number — positive = upside bid, negative = downside bid. Pair with ATM IV (how big a move) and term structure (how soon).

**Steps:**
1. Add `VolSkewSignal`, `VolPoint`, `RiskReversalSnapshot`, `VolHistoryPoint` interfaces to `src/lib/types.ts`. Add optional `volSkew?: VolSkewSignal` to `SignalData`.
2. Add `volSkew` block to `src/data/signals.json` with:
   - Front-month Brent ATM IV: current ~52%, baseline ~24% (≈ +117%)
   - 3-month Brent ATM IV: current ~45%, baseline ~22%
   - 25-delta call skew (front): +8 vol pts
   - 25-delta put skew (front): +5 vol pts
   - Risk reversal (25d front): +3 vol pts (call bid net)
   - OVX equivalent: ~55 vs baseline ~28
   - 14-point daily history of ATM IV + Risk Reversal
   - Source: "CBOE OVX · ICE Brent options surface · Bloomberg consensus"
   - Methodology line on what risk reversal means
3. Build `src/components/VolSkewSignal.tsx` — SignalCard with:
   - Hero: Risk Reversal "+3 vol pts" with label "CALLS BID" (or "PUTS BID" if negative)
   - Three sub-stat chips: Front ATM IV (52%) / 3M ATM IV (45%) / OVX (55)
   - Direction interpretation banner: "Options market leaning ↑ HIGHER — 25-delta calls trading 3 vol points over equivalent puts. Front-month ATM IV at 2.2× baseline = market pricing $14–18 daily Brent moves."
   - Dual sparkline: ATM IV (red) + Risk Reversal (accent) overlay
   - Term-structure mini display: front (52%) vs 3M (45%) showing backwardation in vol
   - Methodology footer
4. Status logic:
   - red: |risk reversal| > 5 AND ATM IV > 45% (strong directional conviction in stressed market)
   - yellow: ATM IV > 35% but risk reversal ambiguous
   - green: ATM IV < 35% (normalizing)
5. Wire `VolSkewSignal` into `src/components/Dashboard.tsx` Tier 2 REGIME grid after `TankerRatesSignal`. Grid stays 2-col.
6. Append decision `d-016` to `.genius/memory/decisions.json` documenting why vol skew completes the paper-market picture (Signal 14 = positioning, Signal 16 = expectations; together they tell you whether the verdict will play out via options-driven flow or require physical signals to push through alone).

**Files:**
- `src/lib/types.ts`
- `src/data/signals.json`
- `src/components/VolSkewSignal.tsx` (new)
- `src/components/Dashboard.tsx`
- `.genius/memory/decisions.json`

**Verify:** `npm run build` passes. Card renders with Risk Reversal hero, three sub-stats, dual sparkline, term-structure mini display, and direction-interpretation banner. Slots into Tier 2 grid as the 8th regime card.

---

## Task 22: TradeSetup — Conviction on the Trade + Exit Triggers + Thesis Health Score
**Status:** [ ]
**Skill:** genius-dev-frontend
**Duration:** ~90 min
**Dependencies:** Task 21
**Date:** 2026-05-21

**Goal:** The dashboard already conveys thesis (direction, magnitude, confidence). It does NOT construct a trade or surface exit triggers. A trader looking at the verdict knows "oil higher" but not (a) which instrument, (b) where to enter, (c) where to take profit, (d) what signal levels would invalidate the thesis. The exit-trigger piece is the most important — exits are where traders die. Build a TradeSetup component that auto-derives the entire trade lifecycle from existing signals and outputs a single Thesis Health Score.

**Steps:**
1. Add to `src/lib/verdict.ts`:
   - `TradeDirection`, `ConvictionTier` types
   - `EntryZone`, `TakeProfitLevel`, `InstrumentRecommendation`, `ExitTrigger`, `TradeSetup` interfaces
   - `computeTradeSetup(data: SignalData, verdict: Verdict): TradeSetup` function
   - `computeThesisHealth(triggers: ExitTrigger[]): { scorePct: number; label: string }` function — 100% = no triggers near firing, 0% = all triggers fired

2. **Exit-trigger logic** (auto-derived from existing signals):
   - Insurance threshold: when `data.insurance.current` falls below 2.0% — trigger fired if below, "% to trigger" if approaching from above
   - VLCC TD3 threshold: when `data.tankerEconomics.routes[VLCC].currentRate` falls below $60,000/d
   - Risk reversal flip: when `data.volSkew.hero.riskReversalVolPts` crosses zero (from positive to negative)
   - Backwardation softening: when `data.curveShape.backwardationPct` falls below 15%
   - Paper market OI recovery: when `data.paperMarket` OI delta improves to better than -20% (i.e., recovery to 80% of baseline)
   - Ship transit normalizing: when `data.shipTransit.dailyCount` exceeds 50
   - For each, compute: `current`, `trigger`, `pctToTrigger` (0% = not fired, 100% = fired or beyond), `status` (red = far from trigger, amber = within 30%, green = within 10% or fired)

3. **Instrument recommendation logic:**
   - If verdict direction = "higher" AND `data.volSkew.atmIv.front.current` > 40 AND `data.paperMarket` OI delta < -25% → recommend long calls (defined risk, paper-deleveraging-safe)
   - If verdict direction = "higher" AND `data.curveShape.backwardationPct` > 20 → also recommend front-month futures (positive roll yield)
   - If verdict direction = "higher" AND `data.equityDisbelief` exists → recommend energy basket (XLE/XOM/CVX) per Currie thesis
   - If verdict direction = "lower" → recommend put spreads + short energy beta
   - If "uncertain" → recommend strangle or sidelined
   - Each instrument: `name`, `rationale`, `priority` ("primary" | "secondary" | "avoid")
   - Include "AVOID" instruments too (e.g., outright futures when paper conviction collapsed)

4. **Entry zone logic:**
   - For long: buy zone = spot − (5%–7% pullback), or "buy now" if spot already at zone or below
   - For short: sell zone = spot + (5%–7% rally)
   - For uncertain: no zone, just "wait for break"
   - Show current spot, whether it's in zone, and action ("scale in" / "wait" / "ahead of zone — patience")

5. **Take profit logic:**
   - T1 (trim 50%): `verdict.reopeningScenario.statusQuo.brentLow`
   - T2 (full exit): `verdict.reopeningScenario.statusQuo.brentHigh`
   - Show both with implied % return from current spot

6. **Sizing guidance:**
   - High conviction (composite |c| > 0.6): "1.5–2% portfolio risk"
   - Moderate (0.4–0.6): "0.75–1% portfolio risk"
   - Low (<0.4): "0.25–0.5% portfolio risk or sidelined"

7. Build `src/components/TradeSetup.tsx`:
   - Full-width Tier 1 card, sits directly below VerdictBanner (above TodaysTape)
   - Header: "Trade Setup" + Direction badge + Conviction tier badge
   - Row 1: Entry zone tile + Take Profit tile (2-col grid)
   - Row 2: Instrument recommendations (3-tile horizontal — primary / secondary / avoid)
   - Row 3: Exit Triggers table — 6 rows, each with: signal name · current · trigger level · % to trigger (progress bar) · status dot
   - Footer row: large Thesis Health Score (e.g., "82% — THESIS INTACT") with color-coded status banner. If score drops below 40%, show "⚠ THESIS DEGRADING — REVIEW EXIT"
   - Methodology footnote: how the score is computed, link to exit-trigger logic

8. Wire `TradeSetup` into `src/components/Dashboard.tsx` Tier 1 between VerdictBanner and TodaysTape.

9. Append decision `d-017` to `.genius/memory/decisions.json` documenting the trade-construction + exit-trigger framework.

**Files:**
- `src/lib/verdict.ts`
- `src/components/TradeSetup.tsx` (new)
- `src/components/Dashboard.tsx`
- `.genius/memory/decisions.json`

**Verify:** `npm run build` passes. Dashboard at localhost:3000 shows new TradeSetup card directly below VerdictBanner with: direction + conviction header, entry zone tile, take-profit tile, instrument recommendations row, 6-row exit-trigger table with progress bars + % to invalidation per signal, and a large Thesis Health Score at the bottom (intact/degrading/broken banner). `d-017` appended to decisions.json.

---

## Task 23: EIA May 21 Refresh + Diplomatic Watch (Trump "final stages with Iran")
**Status:** [ ]
**Skill:** genius-dev-frontend
**Duration:** ~45 min
**Dependencies:** Task 22
**Date:** 2026-05-21

**Goal:** Fold in the Ole S Hansen (Saxo) / EIA Weekly Stocks Report (week ending ~May 16, 2026) — a major data release with five distinct cross-signal touches — AND surface Trump's "final stages with Iran" statement (May 21) as a Diplomatic Watch banner. The Trump statement is the single highest-leverage data point because it could invalidate the entire bullish thesis fastest — diplomatic resolution is currently implicit in the composite but not visible. Make it explicit.

**Steps:**

**Part A — EIA data refresh (signals.json):**
1. Update `inventoryDraws` block (Signal 13):
   - Add EIA May 21 data row: -17.8 mb total US crude (single-week record), -9.9 mb SPR, -7.9 mb commercial
   - Add `physicalMarketNotes` entry attributed to EIA Weekly Stocks Report via Ole S Hansen/Saxo (May 21, 2026): "Record 17.8 mb total US crude draw. 9.9 mb SPR release + 7.9 mb commercial draw. Cushing 4th consecutive weekly decline. Total commercial oil + product stock at 5-year range floor."
2. Update `sprStatus` block (Signal 7):
   - Recalculate SPR remaining: prior value minus 9.9 mb
   - Add EIA attribution
3. Update `usProductStocks` block (Signal 10):
   - Sharpen framing: distillate inventories near 20-year seasonal lows (per EIA report)
   - Add EIA attribution
4. Update `bufferMath` block (Signal 8):
   - Add `physicalMarketNotes` EIA entry crediting the 7.9 mb commercial draw + Cushing 4 consecutive weeks
5. Update `oilSpread` or `curveShape` block:
   - Cushing 4 consecutive draws → strengthens backwardation thesis; add `physicalMarketNotes` entry

**Part B — Diplomatic Watch surface:**
6. Add new `diplomaticWatch` block to `src/data/signals.json`:
   ```json
   {
     "status": "ACTIVE_RUMORED",
     "headline": "Trump: 'final stages with Iran'",
     "date": "2026-05-21",
     "source": "POTUS public statement, May 21, 2026",
     "interpretation": "Diplomatic resolution probability rising sharply but unconfirmed. Bullish thesis exit-trigger candidate if confirmed; could be jawboning per HFI anchoring-bias framework.",
     "credibility": "rumored",
     "impactIfConfirmed": "Brent could retest $95-100 within 5-10 days; would invalidate primary long thesis",
     "impactIfFails": "Hormuz crisis re-escalates, +$10-15 Brent in 48h"
   }
   ```

7. Add `DiplomaticWatch` interface to `src/lib/types.ts` (matching the JSON shape), plus optional `diplomaticWatch?: DiplomaticWatch` on `SignalData`.

8. In `src/components/VerdictBanner.tsx`: add a top-row Diplomatic Watch badge (red-amber accent border, "⚠ DIPLOMATIC ESCALATION" label + headline + date) ABOVE the existing direction headline. Render only when `data.diplomaticWatch != null`. Pattern matches the existing Reopening Scenario block but lives at the top to flag the meta-risk.

9. In `src/components/WatchThisWeek.tsx`: inject Diplomatic Watch as a synthetic Tier-1 row (red dot, dated today) if `data.diplomaticWatch.status` is non-null, so it appears in the 3-row catalyst list.

10. In `src/lib/verdict.ts` `computeTradeSetup`: add a 7th exit trigger when `data.diplomaticWatch` is present:
    - signalName: "Diplomatic resolution status"
    - current: diplomaticWatch.status (qualitative)
    - trigger: "CONFIRMED"
    - direction: "above" (toward confirmation)
    - pctToTrigger: map status → ladder (NONE=0, RUMORED=40, ACTIVE_RUMORED=60, CONFIRMED=100)
    - status: intact (NONE) → warning (RUMORED, ACTIVE_RUMORED) → fired (CONFIRMED)
    - rationale: "If diplomatic resolution confirmed, bullish thesis invalidated within 5-10 days"

11. Append decision `d-018` to `.genius/memory/decisions.json` documenting:
    - EIA May 21 refresh integration
    - Diplomatic Watch surface as new dimension
    - Trump statement explicitly elevated as exit-trigger candidate
    - Why this matters: the dashboard's biggest blind spot was discrete diplomatic events; this fixes that

**Files:**
- `src/data/signals.json`
- `src/lib/types.ts`
- `src/lib/verdict.ts`
- `src/components/VerdictBanner.tsx`
- `src/components/WatchThisWeek.tsx`
- `.genius/memory/decisions.json`

**Verify:** `npm run build` passes. Dashboard shows: (1) Diplomatic Watch badge at top of VerdictBanner with Trump statement + date + interpretation, (2) Diplomatic Watch as a Tier-1 red catalyst in WatchThisWeek, (3) Diplomatic resolution as 7th exit trigger in TradeSetup, (4) EIA May 21 attribution blocks newest-first on Signals 7, 8, 10, 11, 13.

---

## Task 24: Diplomatic JAWBONE Reframe — fix Task 23 miscalibration
**Status:** [ ]
**Skill:** genius-dev-frontend
**Duration:** ~40 min
**Dependencies:** Task 23
**Date:** 2026-05-21

**Goal:** Task 23 elevated Trump's "final stages with Iran" statement to ACTIVE_RUMORED with a red-alert banner and a 60% exit-trigger weight. That was the wrong calibration — Trump has made similar "deal imminent" statements throughout the war without follow-through. Per HFI anchoring-bias framework, repeated unconfirmed jawboning that doesn't produce physical change is actually a BULLISH signal (extends crisis duration; markets anchor lower diplomatic-resolution probability daily). Rebuild the status ladder around physical-confirmation gates, not rhetoric.

**Steps:**

1. **Rewrite DiplomaticStatus ladder in `src/lib/types.ts`:**
   ```ts
   export type DiplomaticStatus =
     | "NONE"                      // pre-conflict baseline, no diplomatic activity
     | "JAWBONE_ONLY"              // rhetoric only — POTUS / officials claim "imminent", no concrete signals
     | "SPECIFIC_TERMS_LEAKED"     // specific terms appear in credible reporting
     | "PHYSICAL_CONFIRMATION"     // observable physical changes: ships repositioning, insurance falling, flow resumption
     | "CONFIRMED";                // formal agreement announced, flows resuming
   ```

2. **Extend DiplomaticWatch interface:**
   ```ts
   export interface DiplomaticWatch {
     status: DiplomaticStatus;
     latestHeadline: string;
     latestDate: string;
     latestSource: string;
     jawboneCount: number;             // total "imminent" statements logged since war start
     daysSinceFirstJawbone: number;    // anchoring-bias countdown
     firstJawboneDate: string;
     physicalConfirmationGates: {
       label: string;                  // e.g., "Insurance below 3%"
       currentValue: string;           // e.g., "5.8%"
       status: "not met" | "approaching" | "met";
     }[];
     interpretation: string;           // HFI-style framing front and center
     impactIfConfirmed: string;        // kept for when status escalates
     impactIfJawboneContinues: string; // anchoring-bias upside
   }
   ```

3. **Rebuild `diplomaticWatch` block in `src/data/signals.json`** (replace Task 23's version):
   ```json
   {
     "status": "JAWBONE_ONLY",
     "latestHeadline": "Trump: 'final stages with Iran'",
     "latestDate": "2026-05-21",
     "latestSource": "POTUS public statement, May 21, 2026",
     "jawboneCount": 8,
     "daysSinceFirstJawbone": 51,
     "firstJawboneDate": "2026-03-31",
     "physicalConfirmationGates": [
       { "label": "Insurance below 3%", "currentValue": "<from data.insurance.current>%", "status": "not met" },
       { "label": "Ship transit above 50/day", "currentValue": "<from data.shipTransit.dailyCount>/day", "status": "not met" },
       { "label": "VLCC TD3 below $60k/day", "currentValue": "$<from data.tankerEconomics.routes[VLCC].currentRate / 1000>k/day", "status": "not met" },
       { "label": "Spread compression below $5", "currentValue": "$<from data.oilSpread.spread>", "status": "not met" },
       { "label": "Backwardation below 15%", "currentValue": "<from data.curveShape.percentBackwardation>%", "status": "not met" }
     ],
     "interpretation": "Trump has made 8 'final stages' / 'deal imminent' / 'very close' statements since the war began (51 days ago). Per HFI anchoring-bias framework, repeated unconfirmed jawboning that doesn't produce physical change is itself a bullish signal — extends crisis duration and erodes diplomatic-resolution probability daily. Status will not escalate above JAWBONE_ONLY without concrete physical confirmation across the gates below.",
     "impactIfConfirmed": "Brent could retest $95-100 within 5-10 days; would invalidate primary long thesis",
     "impactIfJawboneContinues": "Each unconfirmed statement extends crisis duration — bullish thesis strengthens, not weakens. Watch for the FIRST physical-confirmation gate to flip — that's the real exit signal."
   }
   ```

   NOTE: The "currentValue" strings above are placeholders — populate them in signals.json with the actual values from the corresponding signal blocks (e.g., look at insurance.current and copy that value in). Don't make them dynamically resolved at runtime — make them static snapshot strings written into the JSON.

4. **Reframe VerdictBanner badge:**
   - Change border from `border-amber-500/50` (alarming) to `border-white/15` (informational) when status === "JAWBONE_ONLY"
   - Change icon from "⚠" to "📰" or "💬" (rhetoric, not emergency)
   - Change label from "Diplomatic Watch · ACTIVE RUMORED" to "Diplomatic Jawbone Tracking · status: JAWBONE_ONLY (no physical confirmation)"
   - Lead the interpretation paragraph with the HFI framing: "Trump has made N similar statements since [date]. Per HFI anchoring-bias framework, repetition without physical change is a bullish signal..."
   - Replace the if-confirmed / if-fails tiles with:
     - **Physical Confirmation Gates** mini-table (5 rows, each gate with current value + status pill)
     - "Status escalates only when gates flip from 'not met' → 'approaching' → 'met'"
   - At top, prominent "Jawbone counter": `8 statements · 51 days · 0 physical confirmations`
   - Only show the alarming amber/red treatment if status escalates above JAWBONE_ONLY

5. **Reframe WatchThisWeek catalyst row:**
   - When status === "JAWBONE_ONLY", DEMOTE the synthetic Trump row from Tier 1 (red) to Tier 3 (gray)
   - Change the row's `whyItMatters` line from "primary long-oil thesis invalidated within 5-10 days" to "Watch for physical confirmation gates to flip — rhetoric alone does not escalate diplomatic risk"
   - Only escalate to Tier 1 when status >= SPECIFIC_TERMS_LEAKED

6. **Recalibrate exit trigger in `computeTradeSetup` (`src/lib/verdict.ts`):**
   - New ladder mapping:
     ```ts
     const statusLadder: Record<DiplomaticStatus, number> = {
       NONE: 0,
       JAWBONE_ONLY: 10,            // demoted hard — rhetoric should not drag Thesis Health
       SPECIFIC_TERMS_LEAKED: 35,
       PHYSICAL_CONFIRMATION: 75,
       CONFIRMED: 100,
     };
     ```
   - Status: fired only at CONFIRMED; warning at PHYSICAL_CONFIRMATION; "approaching" at SPECIFIC_TERMS_LEAKED; intact otherwise.
   - Update rationale text: "If diplomatic resolution confirmed via physical signals (not rhetoric), bullish thesis invalidated within 5-10 days. Jawbone-only statements do not invalidate — they extend crisis duration."

7. **Append decision `d-019` to `.genius/memory/decisions.json`:**
   - title: "DIPLOMATIC JAWBONE REFRAME — fix Task 23 miscalibration"
   - description: User flagged that Trump has been making 'deal imminent' statements throughout the war. Task 23 treated May 21 statement as fresh ACTIVE_RUMORED news. Rebuilt status ladder around physical-confirmation gates: JAWBONE_ONLY (rhetoric only) does not escalate without observable physical changes (insurance dropping, ships returning, freight collapsing, spread compressing, backwardation softening). Per HFI anchoring-bias framework: repeated unconfirmed jawboning is itself a bullish signal. Demoted exit-trigger weight from 60% → 10%. Demoted WatchThisWeek catalyst from Tier 1 → Tier 3.

**Files:**
- `src/lib/types.ts`
- `src/lib/verdict.ts`
- `src/data/signals.json`
- `src/components/VerdictBanner.tsx`
- `src/components/WatchThisWeek.tsx`
- `.genius/memory/decisions.json`

**Verify:** `npm run build` passes. Dashboard: (1) VerdictBanner shows calmer informational Diplomatic Jawbone Tracking panel with jawbone counter (8 statements · 51 days · 0 physical confirmations) + 5-row physical-confirmation-gates mini-table; no alarming amber border. (2) WatchThisWeek shows Trump row at Tier 3 gray. (3) TradeSetup exit-trigger table shows Diplomatic resolution at 10% (intact), no longer dragging Thesis Health Score.
