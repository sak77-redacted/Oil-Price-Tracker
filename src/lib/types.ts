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

export interface SignalData {
  insurance: InsuranceSignal;
  shipTransit: ShipTransitSignal;
  oilSpread: OilSpreadSignal;
  timeline: TimelineSignal;
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

export interface ExtendedSignalData extends SignalData {
  straitStatus: StraitStatus;
  globalImpact: GlobalImpactData;
  regionalImpact: CountryImpact[];
  crisisTimeline: CrisisEvent[];
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
