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
