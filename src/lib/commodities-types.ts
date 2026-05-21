export type CommoditySector =
  | "Energy"
  | "Precious Metals"
  | "Industrial Metals"
  | "Grains"
  | "Softs"
  | "Livestock";

export interface CommodityRow {
  symbol: string;
  name: string;
  sector: CommoditySector;
  priceUnit: string;
  currentPrice: number;
  yearStartPrice: number;
  ytdPct: number;
  fiveDayChangePct: number;
  lastUpdated: string;
  live: boolean;
}

export interface SectorSummary {
  sector: CommoditySector;
  avgYtdPct: number;
  constituentCount: number;
  driver: string;
}

export interface CommodityComplexData {
  commodities: CommodityRow[];
  sectors: SectorSummary[];
  asOfDate: string;
}

export interface CompoundStat {
  label: string;
  value: string;
}

export interface CompoundThesis {
  stats: CompoundStat[];
  coreThesis: string;
}

export interface KeyObservation {
  headline: string;
  body: string;
}

export type ExposureLevel =
  | "Very High"
  | "High"
  | "Moderate"
  | "Mixed (US neutral)"
  | "Negative (ARG benefits)";

export type PricedInState =
  | "No — opposite direction"
  | "No"
  | "Partially"
  | "Yes — running"
  | "Mostly priced";

export interface ExposureRow {
  crop: string;
  symbol?: string;
  elNinoRisk: ExposureLevel;
  fertilizerRisk: ExposureLevel;
  ytdLabel: string;
  pricedIn: PricedInState;
  priority: 1 | 2 | 3;
}

export interface TradeIdea {
  name: string;
  conviction: "High Conviction" | "Speculative" | "Moderate Conviction";
  ticker: string;
  contract: string;
  why: string;
  expression: string;
  sizingNote?: string;
  tier: 1 | 2 | 3;
  crossLinkHref?: string;
  crossLinkLabel?: string;
}

export interface TimingWindow {
  dateRange: string;
  event: string;
  description: string;
  tier: 1 | 2 | 3;
}

export interface CommoditiesThesisData {
  sectorDrivers: Record<string, string>;
  keyObservations: KeyObservation[];
  compoundThesis: CompoundThesis;
  exposureMapping: ExposureRow[];
  tradeIdeas: TradeIdea[];
  timingWindows: TimingWindow[];
  riskFactors: string[];
  oilBookConnection: string;
  dispersionCallout: string;
  verdictHeadline: string;
  verdictSubtitle: string;
}
