/**
 * AI Bubble Tracker — type definitions.
 *
 * Kept separate from the oil tracker's types.ts (same pattern as
 * sugar-types.ts) so the two domains stay decoupled.
 *
 * Core framing (Jay Martin, "The 2006 Question", Aug 2026): the AI
 * capex/circular-financing structure fails not when the numbers fall,
 * but when they stop ACCELERATING. Every signal here tracks speed,
 * not level.
 */

/** Speed-of-signal status. NB: for chinaShare, "decelerating" means
 *  pressure is building AGAINST US share — red = pressure rising. */
export type AISignalStatus = "accelerating" | "decelerating" | "broken" | "watch";

export type PolicyStage = "NONE" | "DEBATE" | "DRAFT_LEGISLATION" | "ENACTED";

export interface AIHistoryPoint {
  date: string; // ISO date or YYYY-MM
  value: number;
  label?: string;
}

export interface AINote {
  date: string;
  text: string;
  attribution: string;
}

/** Fields every signal block shares. */
export interface AISignalBase {
  id: string;
  name: string;
  /** The one-line "what to watch". */
  question: string;
  status: AISignalStatus;
  history: AIHistoryPoint[];
  source: string;
  lastUpdated: string;
  notes?: AINote[];
}

/* ─── meta / verdict / stack ─── */

export interface AIBubbleMeta {
  title: string;
  thesis: string;
  videoSource: string;
  lastSweep: string;
  crisisFrame: string;
}

export interface AIBubbleVerdict {
  status: string;
  compositeNote: string;
  signalsAccelerating: number;
  signalsDecelerating: number;
  signalsWatch: number;
  signalsBroken: number;
}

export interface StackLayer {
  borrower: string;
  collateral: string;
  requirement: string;
  /** What broke, if it broke. null = still holding. */
  broke: string | null;
}

/* ─── Signal 1: Step-Up Ladder ─── */

export interface FundingRound {
  date: string;
  valuationB: number;
  /** Step-up multiple vs the prior round. Absent on the first round. */
  multiple?: number;
  raiseB?: number;
  note?: string;
}

export interface StepUpLadderSignal extends AISignalBase {
  rounds: FundingRound[];
  nextExpected: {
    event: string;
    valuationB: number;
    impliedMultiple: number;
    note: string;
  };
  thresholds: { intact: string; warning: string; broken: string };
}

/* ─── Signal 2: Backlog ─── */

export interface BacklogPlatform {
  name: string;
  backlogB?: number;
  yoyGrowthPct?: number;
}

export interface BacklogSignalData extends AISignalBase {
  platforms: BacklogPlatform[];
  totalB: number;
  concentration: { note: string };
  trigger: string;
}

/* ─── Signal 3: Capex ─── */

export interface CapexYear {
  year: number;
  capexB: number;
  planned?: boolean;
}

export interface CapexSignalData extends AISignalBase {
  annual: CapexYear[];
  keyFact: string;
  killTrigger: { description: string; explainer?: string; fired: boolean };
}

/* ─── Signal 4: China Share ─── */

export interface ChinaShareEvent {
  date: string;
  text: string;
}

export interface ChinaShareSignalData extends AISignalBase {
  openRouter: {
    usSharePct: { current: number; yearAgo: number };
    topProvider: string;
  };
  events: ChinaShareEvent[];
  mechanism: string;
}

/* ─── Signal 5: Revenue Speed ─── */

export interface RevenueSpeedSignalData extends AISignalBase {
  openai: {
    revenue2025B: number;
    yoyMultiple: number;
    lossNote: string;
  };
}

/* ─── Signal 6: Policy Watch ─── */

export interface PolicyWatchSignalData extends AISignalBase {
  ladder: PolicyStage[];
  current: PolicyStage;
  headline: string;
  interpretation: string;
}

/* ─── Signal 7: Concentration ─── */

export interface ConcentrationSignalData extends AISignalBase {
  sp500Top10WeightPct: number;
  note: string;
}

/* ─── Signal 8: Treasury Stack ─── */

export interface TreasuryStackSignalData extends AISignalBase {
  nationalDebtT: number;
  deficit12moT: number;
  rolloverByEnd2027T: number;
  annualInterestT: number;
  interestVsDefense: string;
  watch: string;
}

/* ─── Signal 9: Compute Securitization Watch ─── */

export interface SecuritizationSignalData extends AISignalBase {
  deal: {
    announced: string;
    sizeB: number;
    structure: string;
    shift: string;
  };
  interpretation: string;
  /** Why remittance data would be the first real credit tape for AI. */
  metaNote: string;
  watchItems: string[];
}

/* ─── Signal 10: IPO Watch ─── */

/** Post-IPO performance slots — null until the company actually lists;
 *  populated by the weekly sweep at pricing. */
export interface IpoPostIpoData {
  offerValuationB: number;
  firstDayClosePctVsOffer: number;
  day30PctVsOffer: number;
  currentPctVsOffer: number;
}

export interface IpoWatchCompany {
  name: string;
  confidentialFiling: string;
  expectedWindow: string;
  expectedWindowNote: string;
  exchange: string | null;
  underwriters: string[];
  raiseTargetB: number | null;
  lastPrivateValuationB: number;
  targetValuationLowB: number;
  targetValuationHighB: number;
  valuationNote: string;
  postIpo: IpoPostIpoData | null;
}

export interface IpoWatchEvent {
  date: string;
  text: string;
}

export interface IpoWatchSignalData extends AISignalBase {
  companies: IpoWatchCompany[];
  /** Doc string for the sweep: which fields to fill once each company lists. */
  postIpoFields: string;
  thresholds: { intact: string; warning: string; broken: string };
  interpretation: string;
  events: IpoWatchEvent[];
}

/* ─── Weekly brief ─── */

export interface WeeklyBriefChange {
  signalId: string;
  text: string;
}

export interface WeeklyBriefData {
  date: string;
  headline: string;
  changes: WeeklyBriefChange[];
  nextSweep: string;
}

/* ─── Top-level ─── */

export interface AIBubbleSignals {
  stepUpLadder: StepUpLadderSignal;
  backlog: BacklogSignalData;
  capex: CapexSignalData;
  chinaShare: ChinaShareSignalData;
  revenueSpeed: RevenueSpeedSignalData;
  policyWatch: PolicyWatchSignalData;
  concentration: ConcentrationSignalData;
  treasuryStack: TreasuryStackSignalData;
  securitization: SecuritizationSignalData;
  ipoWatch: IpoWatchSignalData;
}

export interface AIBubbleData {
  meta: AIBubbleMeta;
  verdict: AIBubbleVerdict;
  stack: StackLayer[];
  signals: AIBubbleSignals;
  weeklyBrief: WeeklyBriefData;
}
