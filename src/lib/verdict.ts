import type { SignalData } from "./types";
import {
  getInsuranceStatus,
  getShipStatus,
  getSpreadStatus,
  getTimelineStatus,
  getDaysUntil,
} from "./utils";

export type VerdictDirection = "higher" | "lower" | "uncertain";
export type VerdictSeverity = "severe" | "elevated" | "moderate" | "low";

export interface Verdict {
  direction: VerdictDirection;
  directionLabel: string;
  severity: VerdictSeverity;
  duration: string;
  magnitude: string;
  composite: number;
  crisisCount: number;
  signalCount: number;
}

const WEIGHTS = {
  insurance: 0.35,
  shipCount: 0.25,
  spread: 0.2,
  timeline: 0.2,
} as const;

function scoreInsurance(rate: number): number {
  // Continuous scoring: 0.25% baseline → ~+0.83, 1% → 0, 2%+ → deep negative, 5.8% → ~-0.98
  return -Math.tanh((rate - 1.0) / 0.8);
}

function scoreShipCount(count: number): number {
  // Continuous scoring: 6 ships → ~-0.76, 35 → 0, 100 → ~+0.96
  return Math.tanh((count - 35) / 25);
}

function scoreSpread(gap: number): number {
  // Continuous scoring: $1 → ~+0.93, $5 → 0, $16 → ~-0.98
  return -Math.tanh((gap - 5) / 3);
}

function scoreTimeline(daysUntil: number): number {
  // Continuous scoring: 3 days → ~-0.80, 14 → 0, 60 → ~+1.0
  return Math.tanh((daysUntil - 14) / 10);
}

function getNearestFutureEventDays(data: SignalData): number {
  const futureDays = data.timeline.events
    .map((e) => getDaysUntil(e.date))
    .filter((d) => d >= 0);

  if (futureDays.length === 0) {
    // All events in the past — return a large number (no imminent catalyst)
    return 999;
  }

  return Math.min(...futureDays);
}

function computeDirection(composite: number): VerdictDirection {
  if (composite < -0.3) return "higher";
  if (composite > 0.3) return "lower";
  return "uncertain";
}

function computeDirectionLabel(direction: VerdictDirection, crisisCount: number): string {
  switch (direction) {
    case "higher":
      return crisisCount >= 4 ? "OIL PRICES LIKELY GOING HIGHER" : crisisCount >= 3 ? "OIL LIKELY TRENDING HIGHER" : "OIL LIKELY TRENDING HIGHER";
    case "lower":
      return "OIL PRICES EASING — CRISIS RECEDING";
    case "uncertain":
      return "OIL DIRECTION UNCLEAR — MIXED SIGNALS";
  }
}

function computeDuration(
  crisisCount: number,
  signalCount: number,
  daysUntilEvent: number
): string {
  const allRed = crisisCount === signalCount;
  const mostImproving = crisisCount <= 1;

  if (allRed && daysUntilEvent < 14) {
    return "Weeks to months";
  }
  if (mostImproving) {
    return "Days to weeks";
  }
  return "1-3 weeks if diplomacy progresses";
}

function computeMagnitude(
  currentGapMbd: number,
  brent: number,
  dubai: number
): string {
  if (currentGapMbd >= 8) {
    const bLow = Math.round(brent + 20);
    const bHigh = Math.round(brent + 40);
    const dLow = Math.round(dubai + 20);
    const dHigh = Math.round(dubai + 40);
    return `Brent $${bLow}-${bHigh} · Dubai Physical $${dLow}-${dHigh} if April cliff hits`;
  }
  if (currentGapMbd >= 5) {
    const bLow = Math.round(brent + 10);
    const bHigh = Math.round(brent + 25);
    const dLow = Math.round(dubai + 10);
    const dHigh = Math.round(dubai + 25);
    return `Brent $${bLow}-${bHigh} · Dubai Physical $${dLow}-${dHigh} if disruption persists`;
  }
  if (currentGapMbd >= 3) {
    return `Brent $${Math.round(brent - 5)}-${Math.round(brent + 10)} · Dubai $${Math.round(dubai - 5)}-${Math.round(dubai + 10)} range`;
  }
  return `Brent could pull back to ~$${Math.round(brent - 15)} · Dubai to ~$${Math.round(dubai - 15)}`;
}

function computeSeverity(crisisCount: number): VerdictSeverity {
  if (crisisCount >= 3) return "severe";
  if (crisisCount >= 2) return "elevated";
  if (crisisCount >= 1) return "moderate";
  return "low";
}

function compositeSeverity(composite: number): VerdictSeverity {
  if (composite <= -0.7) return "severe";
  if (composite <= -0.3) return "elevated";
  if (composite <= 0.3) return "moderate";
  return "low";
}

function countCrisisSignals(data: SignalData, daysUntilEvent: number): number {
  const statuses = [
    getInsuranceStatus(data.insurance.current),
    getShipStatus(data.shipTransit.dailyCount),
    getSpreadStatus(data.oilSpread.spread),
    getTimelineStatus(daysUntilEvent),
  ];
  return statuses.filter((s) => s === "red").length;
}

export function computeVerdict(data: SignalData): Verdict {
  const daysUntilEvent = getNearestFutureEventDays(data);

  const insuranceScore = scoreInsurance(data.insurance.current);
  const shipScore = scoreShipCount(data.shipTransit.dailyCount);
  const spreadScore = scoreSpread(data.oilSpread.spread);
  const timelineScore = scoreTimeline(daysUntilEvent);

  const composite =
    WEIGHTS.insurance * insuranceScore +
    WEIGHTS.shipCount * shipScore +
    WEIGHTS.spread * spreadScore +
    WEIGHTS.timeline * timelineScore;

  const signalCount = 4;
  const crisisCount = countCrisisSignals(data, daysUntilEvent);
  const direction = computeDirection(composite);

  return {
    direction,
    directionLabel: computeDirectionLabel(direction, crisisCount),
    severity: compositeSeverity(composite),
    duration: computeDuration(crisisCount, signalCount, daysUntilEvent),
    magnitude: computeMagnitude(data.timeline.currentGapMbd, data.oilSpread.brent, data.oilSpread.dubai),
    composite,
    crisisCount,
    signalCount,
  };
}
