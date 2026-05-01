export type SignalStatus = "red" | "yellow" | "green";

export interface HistoryPoint {
  date: string;
  value: number;
}

export interface InsuranceSignal {
  current: number;
  baseline: number;
  threshold: number;
  unit: string;
  history: HistoryPoint[];
  lastUpdated: string;
  source: string;
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
}

export interface OilSpreadSignal {
  brent: number;
  dubai: number;
  spread: number;
  history: { date: string; brent: number; dubai: number }[];
  lastUpdated: string;
  brentSource: string;
  dubaiSource: string;
}

export interface TimelineEvent {
  id: string;
  event: string;
  date: string;
  status: "active" | "expired" | "extended";
  impact: string;
  supplyGapMbd: number;
}

export interface TimelineSignal {
  events: TimelineEvent[];
  currentGapMbd: number;
  projectedGapMbd: number;
  lastUpdated: string;
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
  history: { date: string; daysCover: number; sprMb: number }[];
  lastUpdated: string;
  source: string;
}

export interface SignalData {
  insurance: InsuranceSignal;
  shipTransit: ShipTransitSignal;
  oilSpread: OilSpreadSignal;
  timeline: TimelineSignal;
  bufferMath: BufferMathSignal;
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
