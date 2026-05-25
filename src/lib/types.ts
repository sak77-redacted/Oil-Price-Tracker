export type SignalStatus = "red" | "yellow" | "green";

export interface HistoryPoint {
  date: string;
  value: number;
}

/**
 * Optional per-signal annotation for physical-market commentary.
 * Used to surface JH/@CRUDEOIL231 (and similar) excerpts inside SignalCards.
 */
export interface PhysicalMarketNote {
  date: string;        // ISO date
  quote: string;       // 1–3 sentence excerpt
  attribution: string; // e.g., "JH (@CRUDEOIL231)"
  context?: string;    // optional 1-line framing
}

export interface InsuranceSignal {
  current: number;
  baseline: number;
  threshold: number;
  unit: string;
  history: HistoryPoint[];
  lastUpdated: string;
  source: string;
  physicalMarketNote?: PhysicalMarketNote;
  physicalMarketNotes?: PhysicalMarketNote[];
}

export interface ShipTransitSignal {
  dailyCount: number;
  returnLegs: number;
  baseline: number;
  threshold: number;
  darkFleetNote: string;
  history: { date: string; count: number; returnCount: number }[];
  lastUpdated: string;
  source: string;
  physicalMarketNote?: PhysicalMarketNote;
  physicalMarketNotes?: PhysicalMarketNote[];
}

export interface OilSpreadSignal {
  brent: number;
  dubai: number;
  spread: number;
  history: { date: string; brent: number; dubai: number }[];
  lastUpdated: string;
  brentSource: string;
  dubaiSource: string;
  note?: string;
  physicalMarketNote?: PhysicalMarketNote;
  physicalMarketNotes?: PhysicalMarketNote[];
}

export interface TimelineEvent {
  id: string;
  event: string;
  date: string;
  status: "active" | "expired" | "extended";
  impact: string;
  supplyGapMbd: number;
}

/**
 * Planned refinery turnaround event — operational supply pressure
 * layered on top of the geopolitical timeline. Sourced from
 * Trade with Conviction (June Goh + Neil Crosby, May 8, 2026).
 */
export interface RefineryTurnaround {
  id: string;
  refiner: string;            // e.g. "SK Osan (Korea)"
  capacityNote: string;       // e.g. "260 kbpd CDU + 66 kbpd RFCC + 30 kbpd CCR"
  startDate: string;          // ISO YYYY-MM-DD
  durationDays: number;
  notes: string;
}

export interface TimelineSignal {
  events: TimelineEvent[];
  currentGapMbd: number;
  projectedGapMbd: number;
  lastUpdated: string;
  refineryTurnarounds?: RefineryTurnaround[];
  refineryTurnaroundsNote?: string;
  refineryTurnaroundsSource?: string;
  physicalMarketNote?: PhysicalMarketNote;
  physicalMarketNotes?: PhysicalMarketNote[];
}

/**
 * Per JH/@CRUDEOIL231 (March 18 2026 framework, re-shared May 21 2026):
 * Not all inventory is available. Of ~2.3Bn bbl global onshore inventory,
 * ~60–70% is Minimum Operating Inventory (MOI = linefill + tank bottoms +
 * working stock minimum) — physically locked, cannot be pulled. Another
 * ~20–25% is minimum working stock. Only the remaining ~5–15% is ACTUALLY
 * available to absorb shocks. So a -7.9 mb EIA commercial draw is 5–6% of
 * US available buffer per week, NOT 1.8% of total. The burn rate is
 * 3–4× faster against what matters than against the headline.
 */
export interface InventoryDecomposition {
  region: string;
  totalMb: number;
  moiFloorMb: number;
  availableBufferMb: number;
  weeklyBurnMb: number;
  weeksToMOI: number;
  moiComponents: {
    linefillMb: number;
    tankBottomsMb: number;
    workingStockMb: number;
  };
}

export interface BufferMathSignal {
  oecdCommercialDaysCover: number;
  operationalFloor: number;
  oecdSPRRemainingMb: number;
  oecdSPRTotalCapacityMb: number;
  cumulativeMissingMb: number;
  dailyMissingMbd: number;
  projectedShortfall6moMb: number;
  burnDownDays: number;
  futureBestCaseMissingMb: number;
  sprBreakdown: { us: number; japan: number; europe: number };
  coverageRatio: number;
  breakthroughWindowWeeks: string;
  historicalParallel: {
    year: number;
    pricePeak: number;
    pricePeakInflationAdjusted: number;
    insight: string;
  };
  subsidizedExportsMbd: number;
  recordExportsMbd: number;
  history: { date: string; daysCover: number; sprMb: number }[];
  lastUpdated: string;
  source: string;
  physicalMarketNote?: PhysicalMarketNote;
  physicalMarketNotes?: PhysicalMarketNote[];
  /** US commercial inventory decomposition per JH MOI framework. */
  usInventoryDecomp?: InventoryDecomposition;
  /** Global onshore inventory decomposition per JH MOI framework. */
  globalInventoryDecomp?: InventoryDecomposition;
}

/**
 * Signal 10 — US Product Stocks Runway.
 *
 * Tracks how close PAD1 (East Coast) diesel stocks are to a critical
 * breakpoint at current draw rates. Per Neil Crosby on Trade with
 * Conviction (May 8, 2026): "PAD1 stocks 2–3 draws away from very low,"
 * with US commercial crude+product draws averaging 1.4 mb/d in April,
 * compounded by Japan locking 12 mb US crude for August delivery.
 */
export interface USProductStocksSignal {
  /** Estimated weeks until PAD1 hits the "very low" breakpoint. */
  weeksToCritical: number;
  /** Display date that approximates the breakpoint (e.g. "end of May 2026"). */
  criticalDateLabel: string;
  /** Avg US commercial crude+product draws (mb/d). */
  commercialDrawsMbd: number;
  /** PAD1 status text, e.g. "2–3 draws from critical". */
  pad1Status: string;
  /** Japan August fixture volume (Mb US crude). */
  japanAugFixturesMb: number;
  /** Pre-crisis Japan monthly fixture range, e.g. "1–5 mb/month". */
  japanPreCrisisRange: string;
  /** Methodology footnote text. */
  methodology: string;
  lastUpdated: string;
  source: string;
  physicalMarketNote?: PhysicalMarketNote;
  physicalMarketNotes?: PhysicalMarketNote[];
}

/**
 * Signal 9 — Physical Buyer Stress.
 *
 * Captures the JH/@CRUDEOIL231 thesis that physical buyers (Asian refineries)
 * are in a temporary wait-and-see lull driven by panic-bought cargoes arriving,
 * SPR releases, and lucrative cracks. The leading indicator that the lull is
 * breaking is West African (WAF) programme activity for Asian buyers.
 */
export type WAFProgrammeStatus = "stalled" | "normal" | "accelerating";
export type BuyerBehavior = "wait-and-see" | "capitulation-begins" | "forced-bidding";

export interface BuyerStressSignal {
  /** WAF May programme status — leading indicator for the lull breaking. */
  wafProgrammeStatus: WAFProgrammeStatus;
  /** Qualitative description of WAF programme activity. */
  wafProgrammeDescription: string;
  /** WTI 3-2-1 crack spread, $/bbl. */
  crackSpread321: number;
  /** Threshold below which capitulation is expected ($/bbl). */
  crackSpreadThreshold: number;
  /** Refinery buyer behavior label. */
  buyerBehavior: BuyerBehavior;
  /** Qualitative description of current buyer behavior. */
  buyerBehaviorDescription: string;
  /** Crisis start date (ISO). Used to compute days elapsed. */
  crisisStartDate: string;
  /** Whether forced demand destruction is visible (used for green status). */
  demandDestructionVisible: boolean;
  lastUpdated: string;
  source: string;
  methodology: string;
  physicalMarketNote?: PhysicalMarketNote;
  physicalMarketNotes?: PhysicalMarketNote[];
}

/**
 * Signal 11 — Curve Shape / % Backwardation.
 *
 * Captures how much of the supply shock is priced into the Brent futures
 * curve. Per Jeff Currie (Carlyle, May 16, 2026): "the largest supply shock
 * in history is reasonably priced into the curve, and it likely has much
 * more to run." Extreme % backwardation = supply shock priced in spot, not
 * in long-run expectations.
 */
export interface CurveShapeHistoryPoint {
  date: string;
  spotBrent: number;
  brent36m: number;
  percentBackwardation: number;
}

export interface CurveShapeAtHigh {
  date: string;
  percentBackwardation: number;
  absoluteBackwardation: number;
  spotBrent: number;
  brent36m: number;
  note: string;
}

export interface CurveShapeHistoricalParallel {
  label: string;
  date: string;
  spotBrent: number;
  brent36m: number;
  percentBackwardation: number;
  insight: string;
}

export interface CurveShapeSignal {
  spotBrent: number;
  brent12m: number;
  brent24m: number;
  brent36m: number;
  percentBackwardation: number;
  absoluteBackwardation: number;
  threshold: number;
  atHigh: CurveShapeAtHigh;
  historicalParallels: CurveShapeHistoricalParallel[];
  impliedNormalizationYears: number;
  history: CurveShapeHistoryPoint[];
  lastUpdated: string;
  source: string;
  methodology: string;
  physicalMarketNote?: PhysicalMarketNote;
  physicalMarketNotes?: PhysicalMarketNote[];
}

/**
 * Signal 12 — Energy Equity Disbelief Gauge.
 *
 * Equity-side dislocation. Per Jeff Currie (Carlyle, May 16, 2026): the
 * S&P Energy ÷ S&P 500 ratio implies a long-run Brent below the strip; the
 * energy complex is pricing the opposite of physical reality. The
 * Munificent 7 (XOM, CVX, COP, SHEL, TTE, BP, EQNR) yield 15.5% FCF at $105
 * while the Magnificent 7 yield 1.5%. Either oil must collapse or capital
 * must rotate.
 */
export interface EquityDisbeliefBasket {
  constituents: string[];
  fcfYield?: number;
  fcfYield_at105?: number;
  fcfYield_atConsensus?: number;
  pe: number;
  capex2026Bn?: number;
  amazonPrimaryEnergyMbpd?: number;
  label: string;
}

export interface EquityDisbeliefHistoryPoint {
  date: string;
  energyPctOfSP500: number;
  fcfYieldGapBps: number;
  impliedLongRunBrent: number;
}

export interface EquityDisbeliefSignal {
  energyPctOfSP500: number;
  energyPctOfSP500_preHormuz: number;
  energyPctOfSP500_GFCLow: number;
  techPctOfSP500: number;
  sp500FCFYield: number;
  energyFCFYield_at105: number;
  energyFCFYield_atConsensus: number;
  fcfYieldGapBps_at105: number;
  fcfYieldGapBps_atConsensus: number;
  fcfYieldGapThresholdBps: number;
  impliedLongRunBrent: number;
  strip36m: number;
  spotBrent: number;
  energyVsPreHormuzPct: number;
  munificent7: EquityDisbeliefBasket;
  magnificent7: EquityDisbeliefBasket;
  rotationPotentialTn: number;
  history: EquityDisbeliefHistoryPoint[];
  lastUpdated: string;
  source: string;
  methodology: string;
  physicalMarketNote?: PhysicalMarketNote;
  physicalMarketNotes?: PhysicalMarketNote[];
}

/**
 * Signal 13 — Visible Inventory Draws (Goldman Exhibit 10 dataset).
 *
 * Goldman Sachs Global Investment Research, May 19, 2026 (reported via HFI):
 * "Global Visible Draws Have Averaged 4.4 mb/d Since March 1st." The dataset
 * captures monthly changes (mb/d) across landed crude (OECD, China, non-OECD
 * ex-China), landed products (OECD NGL, OECD refined products, non-OECD
 * total products), and oil-on-water (floating crude/products, crude/products
 * in transit). May draws accelerated to -7.5 mb/d as ballast tankers
 * redirected to the US to drain remaining excess crude — restart of shut-in
 * production cannot return barrels to the Persian Gulf before August.
 *
 * Implied flow: 12 mb/d shut-in + 2 mb/d demand loss − 2.5 mb/d SPR
 * releases = 7.5 mb/d net visible draw.
 */
export interface VisibleStocksMonthEntry {
  month: string;          // e.g. "March", "April", "May"
  monthIso: string;       // e.g. "2026-03", "2026-04", "2026-05"
  globalVisibleStocks: number;       // mb/d MoM change
  landedCrude: number;
  oecdLandedCrude: number;
  chinaLandedCrude: number;
  nonOecdExChinaLandedCrude: number;
  landedProducts: number;
  oecdNgl: number;
  oecdRefinedProducts: number;
  nonOecdProducts: number;
  oilOnWater: number;
  floatingCrude: number;
  floatingProducts: number;
  crudeInTransit: number;
  productsInTransit: number;
  partial?: boolean;      // true if month is in-progress
}

export interface ImpliedFlowComponent {
  label: string;          // "Production shut-in"
  valueMbd: number;       // 12
  direction: "drain" | "fill"; // visual sign
  description: string;
}

export interface InventoryDrawsSignal {
  /** Period-average daily draw rate, mb/d (e.g. 4.4). */
  averageDrawMbd: number;
  /** Most-recent-month draw rate, mb/d (e.g. 7.5). */
  latestMonthDrawMbd: number;
  latestMonthLabel: string;     // "May 2026"
  /** Acceleration from prior month draw → latest, mb/d. */
  accelerationMbd: number;
  /** Threshold for red status (mb/d). */
  threshold: number;
  /** Goldman visible-stocks dataset (oldest first). */
  monthlyEntries: VisibleStocksMonthEntry[];
  /** Stacked-flow decomposition reconciling the latest-month draw. */
  impliedFlow: {
    components: ImpliedFlowComponent[];
    netDrawMbd: number;       // 7.5
    asOfLabel: string;        // "May 2026"
  };
  methodology: string;
  source: string;
  lastUpdated: string;
  physicalMarketNote?: PhysicalMarketNote;
  physicalMarketNotes?: PhysicalMarketNote[];
}

/**
 * Signal 14 — Paper Market Conviction Gauge.
 *
 * Per JH/@CRUDEOIL231 synthesis of OIES Q1–Q2 2026 paper market review
 * (May 21, 2026): in this geopolitical scare, Brent open interest
 * CRATERED instead of spiking (historical norm). Money managers hit
 * VaR + ICE doubled Brent margins → forced retrenchment; mega physical
 * trading houses ran Long-WTI / Short-Brent spreads (CME SPAN capital
 * efficiency) which pinned WTI OI. Flow migrated to defined-risk
 * options — 0DTE rose 25%→30% of WTI options, 1–3 DTE 34%→39%,
 * weekly WTI options ADV +50% YoY (~33k contracts).
 *
 * Interpretation: spot price discovery is structurally degraded —
 * physical signals lead price by weeks not days until paper
 * conviction returns.
 */
export interface OpenInterestSnapshot {
  /** Current OI (contracts). */
  currentContracts: number;
  /** Baseline OI (contracts) at the reference date. */
  baselineContracts: number;
  /** ISO date for baseline reading. */
  baselineDate: string;
  /** % change from baseline (negative = cratered). */
  percentChange: number;
  /** One-line behavioral interpretation. */
  note: string;
}

export interface OptionsShareEntry {
  /** Bucket label, e.g. "0DTE", "1–3 DTE", "Weekly WTI ADV". */
  bucket: string;
  /** Pre-crisis share or level (% or contracts). */
  pre: number;
  /** Current share or level (% or contracts). */
  current: number;
  /** Display unit: "%" for share, "k" for thousands of contracts. */
  unit: "%" | "k";
  /** Optional context for the change. */
  context?: string;
}

export interface PositioningEntry {
  /** Cohort label, e.g. "Brent Money Managers", "WTI Swap Dealers". */
  cohort: string;
  /** Pre-crisis net length or short (contracts). */
  pre: number;
  /** Current net length or short (contracts). */
  current: number;
  /** "long" if positive number = long; "short" if positive = short. */
  side: "long" | "short";
  /** Short narrative explaining the move. */
  note: string;
}

export interface PaperMarketHistoryPoint {
  date: string;
  brentOI: number;          // contracts
  mmNetLong: number;        // contracts (Brent MM)
}

export interface PaperMarketSignal {
  /** Brent OI (the headline anomaly: scares usually spike OI). */
  brentOI: OpenInterestSnapshot;
  /** WTI OI (held flat via mega-trader spread pinning). */
  wtiOI: OpenInterestSnapshot;
  /** Brent money-manager net length — the forced-retrenchment proof. */
  mmNetLong: PositioningEntry;
  /** WTI swap dealer / commercial offset — shale panic-hedging tell. */
  swapDealerShort: PositioningEntry;
  /** Options-share migration table. */
  optionsShares: OptionsShareEntry[];
  /** ADV / OI ratio — multi-year high (intraday churn). */
  advOiRatioStatus: string;
  /** Threshold for red status (currentBrentOI / baselineBrentOI). */
  retrenchmentThreshold: number;
  /** 6-point history of OI + MM net length. */
  history: PaperMarketHistoryPoint[];
  /** Methodology footnote text. */
  methodology: string;
  lastUpdated: string;
  source: string;
  physicalMarketNote?: PhysicalMarketNote;
  physicalMarketNotes?: PhysicalMarketNote[];
}

/**
 * Signal 15 — Tanker Day Rates (VLCC TD3 / Suezmax / Aframax).
 *
 * Per Baltic Exchange BDTI + Clarksons consensus (May 2026): freight is the
 * FIRST cost to spike when arbitrage opens or closes — tanker day rates
 * historically lead spot Brent by 1–3 trading days. VLCC TD3 (Middle East
 * Gulf → China) is the canonical Hormuz-attributable freight benchmark;
 * Worldscale (WS) is the freight-pricing convention. Suezmax and Aframax
 * supply complementary route reads (MEG→Europe and Mediterranean).
 *
 * Distinct from the legacy `tankerRates` field on `ExtendedSignalData`,
 * which carries the simpler `TankerRatesData` vessel snapshot.
 */
export interface TankerRoute {
  name: string;              // "VLCC TD3", "Suezmax", "Aframax"
  description: string;       // "Middle East Gulf → China"
  currentRate: number;       // dollars/day
  baselineRate: number;
  worldscaleCurrent?: number;
  worldscaleBaseline?: number;
  pctChange: number;         // derived but stored for display
}

export interface TankerHistoryPoint {
  date: string;
  vlcc: number;
  suezmax: number;
  aframax: number;
}

export interface TankerRatesSignal {
  title: string;
  hero: {
    route: string;           // "VLCC TD3"
    rate: number;            // 95000
    pctVsBaseline: number;   // 217
  };
  routes: TankerRoute[];
  history: TankerHistoryPoint[];
  status: SignalStatus;
  insight: string;
  lastUpdated: string;
  source: string;
  methodology: string;
  physicalMarketNote?: PhysicalMarketNote;
  physicalMarketNotes?: PhysicalMarketNote[];
}

/**
 * Signal 16 — Vol Skew / Options Market Expectations.
 *
 * Paired with Signal 14 (Paper Market Conviction) to complete the
 * paper-market picture: Signal 14 captures POSITIONING (who's exposed —
 * OI, MM net length, 0DTE share); Signal 16 captures EXPECTATIONS
 * (what the options surface implies — risk reversal, ATM IV, term
 * structure).
 *
 * Risk reversal (25-delta call IV minus 25-delta put IV) is the single
 * cleanest directional read: positive = calls bid (bullish lean);
 * negative = puts bid (bearish lean). ATM IV sizes the implied daily
 * move; term-structure backwardation (front > 3M > 6M) flags near-term
 * stress.
 */
export interface VolPoint {
  date: string;
  atmIv: number;          // %, e.g. 52
  riskReversal: number;   // vol pts, signed
}

export interface RiskReversalSnapshot {
  delta: number;          // e.g. 25 for 25-delta
  currentVolPts: number;  // signed
  baselineVolPts: number;
  interpretation: string; // "Calls bid (bullish lean)" or "Puts bid (bearish lean)"
}

export interface VolSkewSignal {
  title: string;
  hero: {
    riskReversalVolPts: number;  // signed
    label: string;               // "CALLS BID" | "PUTS BID" | "BALANCED"
  };
  atmIv: {
    front: { current: number; baseline: number };
    threeMonth: { current: number; baseline: number };
    sixMonth: { current: number; baseline: number };
  };
  callSkew25d: number;             // vol pts
  putSkew25d: number;              // vol pts
  riskReversalSnapshot: RiskReversalSnapshot;
  ovx: { current: number; baseline: number };
  history: VolPoint[];
  status: SignalStatus;
  insight: string;
  lastUpdated: string;
  source: string;
  methodology: string;
  physicalMarketNote?: PhysicalMarketNote;
  physicalMarketNotes?: PhysicalMarketNote[];
}

/**
 * Diplomatic Watch — surface explicit diplomatic state on the dashboard.
 *
 * Status ladder is calibrated to PHYSICAL CONFIRMATION GATES, not rhetoric.
 * Task 23 mistakenly elevated Trump's May 21 "final stages" statement to
 * ACTIVE_RUMORED with a red-alert banner and 60% exit-trigger weight.
 * Correction (Task 24): Trump has been making 'deal imminent' statements
 * throughout the entire 51-day war without follow-through. Per HFI
 * anchoring-bias framework, repeated unconfirmed jawboning that doesn't
 * produce physical change is itself a bullish signal — it extends crisis
 * duration and erodes diplomatic-resolution probability daily.
 *
 * Ladder mapping used by computeTradeSetup as the 7th long-exit trigger:
 *   NONE (0) ▸ JAWBONE_ONLY (10) ▸ SPECIFIC_TERMS_LEAKED (35)
 *            ▸ PHYSICAL_CONFIRMATION (75) ▸ CONFIRMED (100)
 *
 * Status escalates ONLY when physical-confirmation gates flip — never on
 * rhetoric alone.
 */
export type DiplomaticStatus =
  | "NONE"
  | "JAWBONE_ONLY"
  | "SPECIFIC_TERMS_LEAKED"
  | "PHYSICAL_CONFIRMATION"
  | "CONFIRMED";

export interface PhysicalConfirmationGate {
  label: string;
  currentValue: string;
  status: "not met" | "approaching" | "met";
}

/**
 * Townsend (Macrovoices, May 24 2026) falsifiability framework.
 * The three discrete events that would actually end the war — distinct
 * from the existing physical-confirmation gates (which track tactical
 * normalization). These are diplomatic-resolution proofs.
 */
export interface WarEndingTrigger {
  id: string;
  label: string;
  detail: string;
  status: "not occurred" | "rumored" | "occurred";
  asOfDate: string;
  source?: string;
}

/**
 * Major diplomatic announcement event (jawbone) with outcome tracking.
 * Used to display the April 7 → May 23 pattern repeat.
 */
export interface JawboneEvent {
  date: string;
  headline: string;
  source: string;
  outcome: "unfulfilled" | "partial" | "fulfilled" | "pending";
  outcomeNote?: string;
}

/**
 * Townsend MOU follow-on negotiation window (e.g. 30–60 day nuclear file).
 */
export interface NuclearMouCountdown {
  mouSignedDate: string;
  negotiationWindowDays: number;
  deadline: string;
  whatExpiresLabel: string;
}

/**
 * Iran HEU stockpile fact block — the central war fact per Townsend.
 * 440.9 kg of 60% enriched uranium, ~99% of SWU to weapons-grade
 * already completed (only ~1% additional SWU required to reach 90%).
 */
export interface HeuStockpile {
  kg: number;
  enrichmentPct: number;
  swuToWeaponsGradePct: number;
  swuAlreadyCompleted: number;
  weaponsFromStock: number;
  timeToOneWeaponDays: number;
  timeToNineWeaponsWeeks: number;
  currentLocation: string;
  verificationStatus: string;
  cylinderCount: string;
  source: string;
}

/**
 * Persian Gulf Strait Authority toll regime — Iran's revenue stream that
 * makes a "free and open Strait" framing structurally incompatible with
 * any Iranian-signed MOU.
 */
export interface StraitAuthorityTolls {
  perTransitFee: string;
  excludedVessels: string;
  permittedVessels: string;
  estimatedAnnualTolls: string;
  sourceNote: string;
}

/**
 * Polymarket binary-event probability — surfaced by Morgan Downey (X, May 24
 * 2026). Complements the qualitative War-Ending Triggers and quantitative
 * Physical Confirmation Gates: gates measure WHAT has happened, Polymarket
 * measures WHAT THE MARKET EXPECTS will happen by a discrete resolution date.
 */
export interface PolymarketProbability {
  /** Question text, e.g. "US blockade lifted by June 30, 2026". */
  question: string;
  /** ISO resolution date. */
  resolutionDate: string;
  /** Current % probability (0–100). */
  currentProbabilityPct: number;
  /** Prior reading (optional) for delta arrow. */
  priorProbabilityPct?: number;
  /** ISO date of prior reading. */
  priorAsOfDate?: string;
  /** Attribution string (e.g. "Polymarket via Morgan Downey, May 24 2026"). */
  source: string;
  /** Interpretation note (1–2 sentences). */
  interpretation: string;
}

export interface DiplomaticWatch {
  status: DiplomaticStatus;
  latestHeadline: string;
  latestDate: string;
  latestSource: string;
  jawboneCount: number;
  daysSinceFirstJawbone: number;
  firstJawboneDate: string;
  physicalConfirmationGates: PhysicalConfirmationGate[];
  interpretation: string;
  impactIfConfirmed: string;
  impactIfJawboneContinues: string;
  /** Townsend's three discrete war-ending events. */
  warEndingTriggers?: WarEndingTrigger[];
  /** Major jawbone announcements with outcome tracking (pattern history). */
  jawboneHistory?: JawboneEvent[];
  /** Active follow-on nuclear negotiation window (post-MOU). */
  mouCountdown?: NuclearMouCountdown;
  /** Iran 60% HEU stockpile fact block. */
  heuStockpile?: HeuStockpile;
  /** Persian Gulf Strait Authority toll regime detail. */
  straitAuthorityTolls?: StraitAuthorityTolls;
  /** Polymarket resolution-probability tiles (Downey May 24). */
  polymarketProbabilities?: PolymarketProbability[];
}

/**
 * JH/@CRUDEOIL231 phase framework (March 18 2026):
 *   Phase 0 — Pre-crisis baseline (inventories rebuilding)
 *   Phase 1 — Excess Cash Burn (commercial available > MOI cushion, drawing
 *             down fast — WE ARE HERE)
 *   Phase 2 — SPR Draws (commercial at MOI floor, SPR being pulled hard)
 *   Phase 3 — Desperate Bidding (SPR at operational floor, sidelined
 *             participants forced to bid, prices go vertical)
 */
export type InventoryPhase = 0 | 1 | 2 | 3;

export interface PhaseIndicator {
  phase: InventoryPhase;
  phaseName: string;
  phaseDescription: string;
  daysInPhase: number;
  transitionTrigger: string;
  weeksToNextPhase: number;
  priceImplication: string;
  /**
   * Optional contextual footnote (e.g. Morgan Downey 'weeks not months'
   * framing that makes the linear weeks-to-next-phase an UPPER bound).
   */
  morganDowneyContext?: string;
}

/**
 * HFI Research "Death By A Thousand Headlines" (May 22, 2026).
 *
 * Two dated milestones that determine when oil math forces price discovery:
 * (1) Mid-June 2026 — US crude exports get priced out (marginal barrel
 *     cushion exhausted; US has offset 25% of global crude export decline
 *     via record exports).
 * (2) Late July 2026 — US commercial crude hits operational minimum
 *     (~290 mb floor per JH MOI framework).
 *
 * HFI framing: "Jawbones are buying time, not changing fundamentals.
 * Pick your poison — re-escalation drives August scramble, or we go straight
 * to operational minimums."
 */
export interface CriticalPathMilestone {
  /** ISO date (YYYY-MM-DD). */
  date: string;
  /** Optional pre-computed days from today (otherwise derived at render time). */
  daysFromNow?: number;
  /** Headline label, e.g. "US crude exports priced out". */
  label: string;
  /** 2-3 sentence description of the mechanism / why this matters. */
  description: string;
  /** Source attribution (e.g. "HFI Research, May 22 2026"). */
  source: string;
  /** Visual priority: 1 = primary milestone, 2 = secondary. */
  tier: 1 | 2;
}

export interface CriticalPath {
  title: string;
  subtitle: string;
  /** "Death by a thousand headlines" thesis paragraph. */
  framing: string;
  milestones: CriticalPathMilestone[];
  attribution: string;
}

/**
 * Per-region demand y-o-y reality check (Goldman real-time / EIA).
 * Used by DemandDestructionReality to surface how little destruction has
 * actually occurred vs. what HFI estimates is required for balance.
 */
export interface RegionalDemand {
  region: string;
  totalMbd: number;
  /** Year-on-year change in mb/d (negative = destruction). */
  yoyChangeMbd: number;
  source: string;
}

export interface DemandDestructionReality {
  regions: RegionalDemand[];
  /** Sum of yoyChangeMbd across regions (negative = net destruction). */
  netGlobalChangeMbd: number;
  /** HFI estimate of demand destruction required to balance the supply shock. */
  requiredForBalanceMbd: number;
  /** (|netGlobalChangeMbd| / requiredForBalanceMbd) * 100. */
  progressPct: number;
  /** HFI commentary on the reality vs. requirement. */
  context: string;
  source: string;
}

/**
 * Crude export tracker entry. Complements the demand-destruction reality
 * check by showing supply collapse on the other side of the balance.
 */
export interface ExportTracker {
  metric: string;
  yoyChangeMbd: number;
  currentMbd?: number;
  note: string;
}

/**
 * US Commercial Crude Storage tracker (EIA / HFI).
 * The single inventory series HFI flags as the "Phase 3 trigger" — when
 * US commercial crude approaches operational minimum (~290 mb floor),
 * sidelined buyers are forced into desperate bidding.
 */
export interface USCommercialCrudeStorage {
  /** Latest EIA reading, mb. */
  currentMb: number;
  /** 5-year average for the same week, mb. */
  fiveYrAvgMb: number;
  /** 2026 peak reading, mb. */
  peak2026Mb: number;
  /** ISO date of 2026 peak. */
  peak2026Date: string;
  /** JH MOI floor estimate (midpoint of 280-300), mb. */
  operationalMinimumMb: number;
  /** Recent weekly commercial draw rate, mb. */
  weeklyDrawRateMb: number;
  /** Derived weeks-to-floor at current draw rate. */
  weeksToFloor: number;
  asOfDate: string;
  source: string;
}

export interface SignalData {
  insurance: InsuranceSignal;
  shipTransit: ShipTransitSignal;
  oilSpread: OilSpreadSignal;
  timeline: TimelineSignal;
  bufferMath: BufferMathSignal;
  buyerStress?: BuyerStressSignal;
  usProductStocks?: USProductStocksSignal;
  curveShape?: CurveShapeSignal;
  equityDisbelief?: EquityDisbeliefSignal;
  inventoryDraws?: InventoryDrawsSignal;
  paperMarket?: PaperMarketSignal;
  /**
   * Signal 15. Named `tankerEconomics` to avoid colliding with the legacy
   * `tankerRates: TankerRatesData` field on `ExtendedSignalData`.
   */
  tankerEconomics?: TankerRatesSignal;
  /** Signal 16 — Vol Skew / Options Market Expectations. */
  volSkew?: VolSkewSignal;
  /** Trump "final stages with Iran" surface — explicit diplomatic state. */
  diplomaticWatch?: DiplomaticWatch;
  /** JH/@CRUDEOIL231 inventory-phase indicator (Tier 1 card). */
  phaseIndicator?: PhaseIndicator;
  /** HFI "Death By A Thousand Headlines" — two dated milestones. */
  criticalPath?: CriticalPath;
  /**
   * Per-region demand y-o-y reality check.
   * Named `demandDestructionReality` to avoid colliding with the legacy
   * `demandDestruction: DemandDestructionData` field on `ExtendedSignalData`.
   */
  demandDestructionReality?: DemandDestructionReality;
  /** Global / US / OPEC+ crude export y-o-y tracker (HFI). */
  exportTrackers?: ExportTracker[];
  /** US commercial crude storage vs operational floor (EIA / HFI). */
  usCommercialCrudeStorage?: USCommercialCrudeStorage;
}

export interface StraitStatus {
  status: "open" | "restricted" | "closed";
  since: string;
  description: string;
  lastUpdated: string;
}

export interface CountryImpact {
  country: string;
  dependency: number; // % of oil imports via Hormuz
  severity: "critical" | "high" | "moderate" | "low";
  description: string;
}

export interface CrisisEvent {
  date: string;
  category: "diplomatic" | "military" | "economic";
  title: string;
  description: string;
}

export interface AlternativeRoute {
  route: string;
  addedDays: number;
  addedCost: string;
  description: string;
}

export interface GlobalImpactData {
  worldOilAtRiskPct: number;
  dailyCostBillions: number;
  worldLngAtRiskPct: number;
  dailyLngCostBillions: number;
  shippingRateIncreasePct: number;
  cpiImpactPct: number;
  sprReserveDays: number;
  alternativeRoutes: AlternativeRoute[];
  lastUpdated: string;
}

export interface RecoveryPhase {
  phase: string;
  durationMonths: string;
  description: string;
  status: "not-started" | "in-progress" | "complete";
}

export interface RecoveryClockData {
  crisisStartDate: string;
  estimatedNormalizationDate: string;
  totalMonths: number;
  phases: RecoveryPhase[];
  keyInsight: string;
  source: string;
  lastUpdated: string;
  physicalMarketNote?: PhysicalMarketNote;
  physicalMarketNotes?: PhysicalMarketNote[];
  /** Restart Flywheel — physical-process delays even after diplomatic resolution. */
  restartFlywheel?: RestartFlywheel;
}

/**
 * Restart Flywheel mechanics — even if diplomatic resolution arrives, the
 * physical restart cycle dictates the trade's minimum duration. Per Morgan
 * Downey (Macrovoices Ep. 533, May 21, 2026): tanker re-positioning, shut-in
 * well restart, refinery cycles, Qatar LNG repair, and risk-premium decay
 * each impose their own timelines.
 */
export interface RestartFlywheelStage {
  stage: number;
  mechanism: string;
  duration: string;
  detail: string;
}

/**
 * Implied outage-recovery trajectory derived from Polymarket-implied
 * normalization timing. Per Morgan Downey (X, May 24, 2026): from a current
 * 12 mb/d outage (production 105 → 93 mb/d), the implied path is ~5 mb/d
 * recovered by July and ~10 mb/d by December — leaving balance-of-2026 at
 * an average ~7 mb/d outage = ~1.5 Bn bbl additional inventory drawdown,
 * roughly the size of total global SPR.
 */
export interface OutageRecoveryPoint {
  /** ISO date for the projected point. */
  date: string;
  /** Display label (e.g. "Today", "July 2026"). */
  label: string;
  /** Remaining outage at this point (mb/d). */
  outageMbd: number;
  /** Cumulative recovered from peak outage (mb/d). */
  recoveredMbd: number;
  /** Source attribution. */
  source: string;
}

export interface OutageRecoveryCurve {
  title: string;
  /** Current outage (mb/d). */
  currentOutageMbd: number;
  /** Pre-crisis production (mb/d). */
  preCrisisProductionMbd: number;
  /** Current production (mb/d). */
  currentProductionMbd: number;
  /** Trajectory points (today + future). */
  trajectory: OutageRecoveryPoint[];
  /** Cumulative additional inventory draw across balance-of-2026 (Bn bbl). */
  cumulativeInventoryDrawBnBbl: number;
  /** Context note framing the inventory math. */
  inventoryContext: string;
  /** Attribution (e.g. "Morgan Downey (@morgan_downey), X post May 24, 2026"). */
  attribution: string;
}

export interface RestartFlywheel {
  title: string;
  subtitle: string;
  stages: RestartFlywheelStage[];
  conclusion: string;
  attribution: string;
  context: string;
  /** Polymarket-implied outage recovery curve (Downey May 24, 2026). */
  outageRecoveryCurve?: OutageRecoveryCurve;
}

export interface SPRCountryStatus {
  country: string;
  flag: string;
  released: boolean;
  reserveDays: number;
  releasedMb: number;
  totalMb: number;
  notes: string;
}

export interface SPRStatusData {
  countries: SPRCountryStatus[];
  chinaSignal: string;
  lastUpdated: string;
  physicalMarketNote?: PhysicalMarketNote;
  physicalMarketNotes?: PhysicalMarketNote[];
}

export interface DemandEvent {
  country: string;
  event: string;
  category: "rationing" | "force-majeure" | "production-cut" | "export-ban" | "substitution";
  date: string;
  impact: string;
}

export interface DemandDestructionData {
  events: DemandEvent[];
  estimatedDemandLossMbd: number;
  lastUpdated: string;
}

export interface InflationThresholdData {
  thresholdPrice: number;
  currentCPI: number;
  projectedCPILow: number;
  projectedCPIHigh: number;
  fedConstrained: boolean;
  recessionRisk: "low" | "moderate" | "high" | "critical";
  marchAvgOilPrice: number;
  transmissionChain: string[];
  notes: string;
  lastUpdated: string;
}

export interface TankerVessel {
  class: string;
  description: string;
  currentRate: number;
  baselineRate: number;
  peakRate: number;
  unit: string;
  route: string;
}

export interface TankerRatesData {
  vessels: TankerVessel[];
  source: string;
  lastUpdated: string;
  context: string;
}

export interface IranianAttackMonth {
  month: string;
  bahrain: number;
  saudi: number;
  kuwait: number;
  uae: number;
  total: number;
  partial?: boolean;
  note?: string;
}

export interface IranianAttacksData {
  months: IranianAttackMonth[];
  context: string;
  mosaicStrategyNote: string;
  headlines: string[];
  source: string;
  lastUpdated: string;
}

export interface CrackMarginData {
  current: number;
  peak: number;
  peakDate: string;
  baseline: number;
  history: HistoryPoint[];
}

export interface RefiningMarginsData {
  gasolineCrack: CrackMarginData;
  heatingOilCrack: CrackMarginData;
  sellSignalActive: boolean;
  toppingSignals: boolean;
  context: string;
  hfiThesis: string;
  sellTriggers: string[];
  source: string;
  lastUpdated: string;
}

export interface ExtendedSignalData extends SignalData {
  straitStatus: StraitStatus;
  globalImpact: GlobalImpactData;
  regionalImpact: CountryImpact[];
  crisisTimeline: CrisisEvent[];
  recoveryClock: RecoveryClockData;
  sprStatus: SPRStatusData;
  demandDestruction: DemandDestructionData;
  inflationThreshold: InflationThresholdData;
  tankerRates: TankerRatesData;
  iranianAttacks: IranianAttacksData;
  refiningMargins: RefiningMarginsData;
}

export interface MarketIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  description: string;
  live: boolean;
}

export interface MarketIndicesData {
  indices: MarketIndex[];
  timestamp: string;
}

export interface FuturesContract {
  symbol: string;        // e.g., "CL=F"
  name: string;          // e.g., "WTI Crude Oil"
  price: number;
  change: number;        // daily change in $
  changePercent: number;  // daily change in %
  explanation: string;   // short context for this contract
  live: boolean;
  history?: { date: string; close: number }[]; // daily closes since war start (2026-03-02)
}

export interface FuturesData {
  contracts: FuturesContract[];
  timestamp: string;
}

/**
 * Slim live-ticker payload. Independent of FuturesData so we can carry a wider
 * symbol set (energy + metals + softs) without history baggage. Polled by the
 * client every 60s; server-side cached at 30s via unstable_cache.
 */
export interface LiveTickerQuote {
  symbol: string;        // e.g. "CL=F"
  display: string;       // short label, e.g. "WTI"
  fullName: string;      // e.g. "WTI Crude Oil"
  price: number;
  change: number;
  changePercent: number;
  live: boolean;
}

export interface LiveTickerData {
  quotes: LiveTickerQuote[];
  timestamp: string;
}

export interface CrackSpreadData {
  gasolineCrack: number;    // RBOB price - CL price (per barrel, RBOB is per gallon * 42)
  heatingOilCrack: number;  // HO price - CL price (per barrel, HO is per gallon * 42)
  gasolineCrackChange: number;
  heatingOilCrackChange: number;
  timestamp: string;
}

export interface ForwardPoint {
  month: string;      // "May 26", "Jun 26", etc.
  ticker: string;     // "CLM26", "CLN26" — exchange contract symbol
  expiry: string;     // last trading day, ISO "YYYY-MM-DD"
  price: number;
  diffFromPrompt: number; // negative = backwardation
}

export interface WTIBrentSpreadData {
  wtiPrice: number;
  brentPrice: number;
  spread: number;          // Brent - WTI (positive = Brent premium)
  fairValue: number;       // ~$4-5 based on TD25 freight economics
  previousSpread: number;  // for change calc
  live: boolean;
  contractMonth?: string;  // e.g. "May 26" — same-maturity month used for both legs
  timestamp: string;
}

export interface ForwardCurveData {
  contract: string;   // "Brent Crude" or "WTI"
  symbol: string;     // "BZ=F"
  promptPrice: number;
  curve: ForwardPoint[];
  structure: "backwardation" | "contango" | "flat";
  liveMonths?: number;  // how many forward months have live Yahoo data (vs simulated)
  timestamp: string;
}
