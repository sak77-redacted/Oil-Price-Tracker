import type { SignalData } from "./types";
import {
  getInsuranceStatus,
  getShipStatus,
  getSpreadStatus,
  getTimelineStatus,
  getBufferMathStatus,
  getDaysUntil,
} from "./utils";

export type VerdictDirection = "higher" | "lower" | "uncertain";
export type VerdictSeverity = "severe" | "elevated" | "moderate" | "low";

/**
 * Per Kpler analysis (cited by JH/@CRUDEOIL231, May 7 2026), even an Iranian-
 * controlled "reopening" of the Strait of Hormuz is structurally capped at
 * roughly 40–50% of pre-crisis Gulf export capacity due to:
 *   1. New transit permit process (delays, uncertainty)
 *   2. Insurance/compliance issues from Iranian territorial-waters routing
 *   3. IRGC transit fees (US-sanctioned entity)
 *   4. Complex routing vs standard IMO traffic-separation scheme
 *
 * Therefore the bear scenario for crude prices has a structural floor — even
 * if Tehran formally reopens flows, the pricing impact is bounded, not binary.
 */
export const REOPENING_CAPACITY_FLOOR = 0.5; // 50% of pre-crisis capacity

export interface MagnitudeBand {
  brentLow: number;
  brentHigh: number;
  dubaiLow: number;
  dubaiHigh: number;
  description: string;
}

export interface ReopeningScenario {
  statusQuo: MagnitudeBand;
  iranianControlled: MagnitudeBand;
  source: string;
}

export interface Verdict {
  direction: VerdictDirection;
  directionLabel: string;
  severity: VerdictSeverity;
  duration: string;
  magnitude: string;
  composite: number;
  crisisCount: number;
  signalCount: number;
  reopeningScenario: ReopeningScenario;
}

const WEIGHTS = {
  insurance: 0.3,
  shipCount: 0.2,
  spread: 0.2,
  timeline: 0.15,
  bufferMath: 0.15,
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

function scoreBufferMath(
  daysCover: number,
  projectedShortfall: number,
  sprAvailable: number,
): number {
  // Days-of-cover: <24 deeply negative, 30 → 0, >40 strongly positive
  const coverScore = Math.tanh((daysCover - 30) / 6);
  // Reserve coverage: ratio of available SPR to projected 6mo shortfall
  // ratio < 1 means reserves can't cover the gap → negative pressure
  const ratio = projectedShortfall > 0 ? sprAvailable / projectedShortfall : 1;
  const coverageScore = Math.tanh((ratio - 1) * 1.5);
  // Combine: average, but weight cover slightly more (acute vs structural)
  return coverScore * 0.6 + coverageScore * 0.4;
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

function computeMagnitudeBand(
  currentGapMbd: number,
  brent: number,
  dubai: number
): MagnitudeBand {
  if (currentGapMbd >= 8) {
    return {
      brentLow: Math.round(brent + 20),
      brentHigh: Math.round(brent + 40),
      dubaiLow: Math.round(dubai + 20),
      dubaiHigh: Math.round(dubai + 40),
      description: "if April cliff hits",
    };
  }
  if (currentGapMbd >= 5) {
    return {
      brentLow: Math.round(brent + 10),
      brentHigh: Math.round(brent + 25),
      dubaiLow: Math.round(dubai + 10),
      dubaiHigh: Math.round(dubai + 25),
      description: "if disruption persists",
    };
  }
  if (currentGapMbd >= 3) {
    return {
      brentLow: Math.round(brent - 5),
      brentHigh: Math.round(brent + 10),
      dubaiLow: Math.round(dubai - 5),
      dubaiHigh: Math.round(dubai + 10),
      description: "range",
    };
  }
  return {
    brentLow: Math.round(brent - 15),
    brentHigh: Math.round(brent - 5),
    dubaiLow: Math.round(dubai - 15),
    dubaiHigh: Math.round(dubai - 5),
    description: "pullback range",
  };
}

function bandToString(band: MagnitudeBand): string {
  if (band.description === "range" || band.description === "pullback range") {
    return `Brent $${band.brentLow}-${band.brentHigh} · Dubai $${band.dubaiLow}-${band.dubaiHigh} ${band.description}`;
  }
  return `Brent $${band.brentLow}-${band.brentHigh} · Dubai Physical $${band.dubaiLow}-${band.dubaiHigh} ${band.description}`;
}

/**
 * Compute the Iranian-controlled-reopening magnitude band by scaling the
 * status-quo move *toward Brent/Dubai spot* by REOPENING_CAPACITY_FLOOR.
 *
 * In other words: the bull-for-crude move under reopening is half of the
 * status-quo move, because reopened flows are capped at ~50% of capacity.
 * This keeps the bear case bounded — reopening is not a binary "back to
 * normal" event for crude prices.
 */
function computeReopeningBand(
  statusQuo: MagnitudeBand,
  brent: number,
  dubai: number
): MagnitudeBand {
  const scale = REOPENING_CAPACITY_FLOOR;
  return {
    brentLow: Math.round(brent + (statusQuo.brentLow - brent) * scale),
    brentHigh: Math.round(brent + (statusQuo.brentHigh - brent) * scale),
    dubaiLow: Math.round(dubai + (statusQuo.dubaiLow - dubai) * scale),
    dubaiHigh: Math.round(dubai + (statusQuo.dubaiHigh - dubai) * scale),
    description: "Iranian-controlled reopening (≤50% capacity)",
  };
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
    getBufferMathStatus(
      data.bufferMath.oecdCommercialDaysCover,
      data.bufferMath.projectedShortfall6moMb,
      data.bufferMath.oecdSPRRemainingMb,
    ),
  ];
  return statuses.filter((s) => s === "red").length;
}

export function computeVerdict(data: SignalData): Verdict {
  const daysUntilEvent = getNearestFutureEventDays(data);

  const insuranceScore = scoreInsurance(data.insurance.current);
  const shipScore = scoreShipCount(data.shipTransit.dailyCount);
  const spreadScore = scoreSpread(data.oilSpread.spread);
  const timelineScore = scoreTimeline(daysUntilEvent);
  const bufferScore = scoreBufferMath(
    data.bufferMath.oecdCommercialDaysCover,
    data.bufferMath.projectedShortfall6moMb,
    data.bufferMath.oecdSPRRemainingMb,
  );

  const composite =
    WEIGHTS.insurance * insuranceScore +
    WEIGHTS.shipCount * shipScore +
    WEIGHTS.spread * spreadScore +
    WEIGHTS.timeline * timelineScore +
    WEIGHTS.bufferMath * bufferScore;

  const signalCount = 5;
  const crisisCount = countCrisisSignals(data, daysUntilEvent);
  const direction = computeDirection(composite);

  const statusQuoBand = computeMagnitudeBand(
    data.timeline.currentGapMbd,
    data.oilSpread.brent,
    data.oilSpread.dubai,
  );
  const reopeningBand = computeReopeningBand(
    statusQuoBand,
    data.oilSpread.brent,
    data.oilSpread.dubai,
  );

  return {
    direction,
    directionLabel: computeDirectionLabel(direction, crisisCount),
    severity: compositeSeverity(composite),
    duration: computeDuration(crisisCount, signalCount, daysUntilEvent),
    magnitude: bandToString(statusQuoBand),
    composite,
    crisisCount,
    signalCount,
    reopeningScenario: {
      statusQuo: statusQuoBand,
      iranianControlled: reopeningBand,
      source: "Kpler analysis via JH/@CRUDEOIL231 (May 7, 2026) — reopening capacity capped ~40–50% of pre-crisis Gulf exports",
    },
  };
}
