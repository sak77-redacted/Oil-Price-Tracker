// Sugar #11 trade thesis types. Mirrors `src/data/sugar.json`.

export type TradeDirection = "long" | "short" | "sidelined";
export type ConvictionLevel = "high" | "moderate" | "low";
export type CatalystTier = 1 | 2 | 3;
export type ForecastDirection = "tightening" | "deficit flip" | "loosening";
export type ExitStatus = "monitoring" | "triggered" | "fired";

export interface SugarMetadata {
  title: string;
  subtitle: string;
  lastUpdated: string;       // ISO date
  tradeInitiated: string;    // ISO date
}

export interface SugarThesis {
  direction: TradeDirection;
  conviction: ConvictionLevel;
  convictionPct: number;
  headline: string;
  summary: string;
}

export interface SugarTodaysTape {
  spot: number;              // cents/lb
  fiveYrLow: number;
  twentyYrATH: number;
  twentyYrLow: number;
  rangePosition: number;     // 0–100, % through 20yr range
  marH7IV: number;           // %
  elNinoProbability: number; // %
  ytdPct: number;            // signed %
}

export interface ElNinoSetupData {
  probability: number;
  probabilityWindow: string;
  persistencePct: number;
  persistenceWindow: string;
  strongEventOdds: string;
  strongEventWindow: string;
  nino34Anomaly: number;     // °C
  soiIndex: number;
  soiNote: string;
}

export interface HormuzTransmissionData {
  ureaPctViaHormuz: number;
  sulfurPctViaHormuz: number;
  saudiPhosphateRank: number;
  ureaPriceMovePct: number;
  ammoniaPriceMovePct: number;
  potashStatus: string;
  caneNitrogenIntensity: string;
}

export interface ForecastRevisionEntry {
  source: string;
  metric: string;
  from: string;
  to: string;
  direction: ForecastDirection | string;
}

export interface BrazilianMillMixData {
  brazilCenterSouthSugarMixPct: number;
  brazilCenterSouthOutputMMT: number;
  brazilOutputNote: string;
  indiaOutputMMT: number;
  indiaOutputYoYPct: number;
  indiaEthanolDiversionFromMMT: number;
  indiaEthanolDiversionToMMT: number;
}

export interface HistoricalContextEntry {
  year: string;
  event: string;
  priceCents: number;
  contractDollars: number;
  highlight?: boolean;
  current?: boolean;
}

export interface CatalystTimelineEntry {
  date: string;
  event: string;
  tier: CatalystTier;
}

export interface TradePrimary {
  contract: string;
  strike: number;
  qtyRange: string;
  premiumPerCall: number;
  totalCostRange: string;
  breakeven: number;
  costPer1DollarPayoff: number;
}

export interface TradeAlternative {
  contract: string;
  strike: number;
  qty: number;
  premiumPerCall: number;
  totalCost: number;
  breakeven: number;
  costPer1DollarPayoff: number;
}

export interface PayoffRow {
  expiry: number;          // sugar ¢/lb
  label?: string;
  intrinsic: number;       // contract value $
  pnl: number;             // $
  multiple: string;
  highlight?: boolean;
}

export interface SugarTradeData {
  primary: TradePrimary;
  alternative: TradeAlternative;
  payoffTable: PayoffRow[];
  managementRules: string[];
}

export interface ExitTriggerEntry {
  name: string;
  rationale: string;
  status: ExitStatus | string;
}

export interface TailScenarioComponent {
  mechanism: string;
  mmtLost: string;
}

export interface TailScenarioData {
  title: string;
  components: TailScenarioComponent[];
  netDeficitMMT: string;
  context: string;
  inelasticDemandNote: string;
}

export interface YTDPerformanceEntry {
  commodity: string;
  ytd: number;
  sector: "Softs" | "Grains" | string;
  highlight?: boolean;
}

export interface PersonalViewData {
  qtyExecuted: number | null;
  executionTarget: string;
  alternativeExecution: string;
  maxRiskDollars: number;
  executionTiming: string;
  executionNotes: string[];
  sizingLogic: string;
}

export interface ExecutedPositionGreeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  impliedVolPct: number;
}

export interface ExecutedPosition {
  executed: boolean;
  executionDate: string | null;      // ISO date, or null when the exact fill date wasn't captured
  contractLabel: string;             // "SBG7 Feb'27 18¢ Call"
  qty: number;
  strike: number;                    // 0.18 (dollars per lb)
  expiryDate: string;                // ISO
  averagePrice: number;              // 0.88 (premium ¢/lb units shown in the broker)
  costBasisDollars: number;          // 1977
  asOfDate: string;                  // ISO timestamp of last broker snapshot
  asOfMarketValueDollars: number;    // 1913
  asOfUnrealizedPnLDollars: number;  // -63.85
  asOfRealizedPnLDollars: number;    // 0
  breakeven: number;                 // 0.19 (sugar price)
  greeks: ExecutedPositionGreeks;
  profitProbabilityPct?: number | null; // broker-reported; may be absent on some snapshots
  openInterest: number;
  pctOfPortfolio: number;
  contractSizeLbs: number;           // 112000
  notes: string;
  entryUnderlyingPriceCents?: number; // sugar futures price at trade entry (cents/lb)
}

export interface SugarFuturesHistoryPoint {
  date: string;    // YYYY-MM-DD
  close: number;   // cents/lb
  volume?: number; // daily volume (contracts traded)
}

export interface SugarFuturesHistory {
  contractLabel: string;
  symbol: string;
  series: SugarFuturesHistoryPoint[];
}

export interface SugarData {
  metadata: SugarMetadata;
  thesis: SugarThesis;
  todaysTape: SugarTodaysTape;
  elNino: ElNinoSetupData;
  hormuzTransmission: HormuzTransmissionData;
  forecastRevisions: ForecastRevisionEntry[];
  millMix: BrazilianMillMixData;
  historicalContext: HistoricalContextEntry[];
  catalystTimeline: CatalystTimelineEntry[];
  trade: SugarTradeData;
  exitTriggers: ExitTriggerEntry[];
  tailScenario: TailScenarioData;
  ytdPerformance: YTDPerformanceEntry[];
  personalView: PersonalViewData;
  executedPositions?: ExecutedPosition[];
}
