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
  if (rate >= 5) return -1;
  if (rate >= 2) return 0;
  return 1;
}

function scoreShipCount(count: number): number {
  if (count < 20) return -1;
  if (count < 40) return 0;
  return 1;
}

function scoreSpread(gap: number): number {
  if (gap > 8) return -1;
  if (gap > 3) return 0;
  return 1;
}

function scoreTimeline(daysUntil: number): number {
  if (daysUntil <= 7) return -1;
  if (daysUntil <= 21) return 0;
  return 1;
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

function computeDirectionLabel(direction: VerdictDirection): string {
  switch (direction) {
    case "higher":
      return "OIL LIKELY TRENDING HIGHER";
    case "lower":
      return "OIL LIKELY TRENDING LOWER";
    case "uncertain":
      return "OIL DIRECTION UNCERTAIN";
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
    directionLabel: computeDirectionLabel(direction),
    severity: computeSeverity(crisisCount),
    duration: computeDuration(crisisCount, signalCount, daysUntilEvent),
    magnitude: computeMagnitude(data.timeline.currentGapMbd, data.oilSpread.brent, data.oilSpread.dubai),
    composite,
    crisisCount,
    signalCount,
  };
}
