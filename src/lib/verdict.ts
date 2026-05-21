import type { SignalData, DiplomaticStatus, InventoryPhase } from "./types";
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

export interface DirectionalBias {
  direction: VerdictDirection;
  confidencePct: number;
  horizonDays: number;
}

/**
 * 5-day directional bias derived from the composite signal score.
 * Confidence buckets follow |composite| magnitude:
 *   |c| > 0.6  → 70% (high conviction)
 *   0.4–0.6    → 55% (moderate)
 *   < 0.4      → 40% (low / uncertain regime)
 * Direction reuses the verdict's composite → direction mapping so the
 * bias line always tracks the headline call.
 */
export function getDirectionalBias(composite: number): DirectionalBias {
  const abs = Math.abs(composite);
  let confidencePct: number;
  if (abs > 0.6) confidencePct = 70;
  else if (abs >= 0.4) confidencePct = 55;
  else confidencePct = 40;

  return {
    direction: computeDirection(composite),
    confidencePct,
    horizonDays: 5,
  };
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

// ─────────────────────────────────────────────────────────────────────────────
// Task 22 — TradeSetup: turn the thesis read into a trade ticket + exit triggers
// ─────────────────────────────────────────────────────────────────────────────

export type TradeDirection = "long" | "short" | "sidelined";
export type ConvictionTier = "high" | "moderate" | "low";

export interface EntryZone {
  zoneLow: number;
  zoneHigh: number;
  currentSpot: number;
  inZone: boolean;
  action: string;
}

export interface TakeProfitLevel {
  level: number;
  label: string;
  pctFromSpot: number;
  rationale: string;
}

export interface InstrumentRecommendation {
  name: string;
  rationale: string;
  priority: "primary" | "secondary" | "avoid";
}

export interface ExitTrigger {
  signalName: string;
  /** Numeric for quantitative triggers; qualitative string for the diplomatic-status trigger. */
  current: number | string;
  /** Numeric trigger threshold; qualitative string for the diplomatic-status trigger. */
  trigger: number | string;
  unit: string;
  pctToTrigger: number;
  status: "intact" | "warning" | "fired";
  direction: "below" | "above";
  rationale: string;
}

export interface ThesisHealth {
  scorePct: number;
  label: string;
  color: "green" | "amber" | "red";
}

export interface TradeSetup {
  direction: TradeDirection;
  conviction: ConvictionTier;
  convictionPct: number;
  sizingGuide: string;
  entryZone: EntryZone;
  takeProfits: TakeProfitLevel[];
  instruments: InstrumentRecommendation[];
  exitTriggers: ExitTrigger[];
  thesisHealth: ThesisHealth;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function tradeDirectionFromVerdict(d: VerdictDirection): TradeDirection {
  if (d === "higher") return "long";
  if (d === "lower") return "short";
  return "sidelined";
}

function convictionFromComposite(composite: number): { tier: ConvictionTier; pct: number } {
  const abs = Math.abs(composite);
  if (abs > 0.6) {
    // map 0.6 → 70, 1.0 → 85
    const pct = Math.round(clamp(70 + ((abs - 0.6) / 0.4) * 15, 70, 85));
    return { tier: "high", pct };
  }
  if (abs >= 0.4) {
    // map 0.4 → 55, 0.6 → 70
    const pct = Math.round(clamp(55 + ((abs - 0.4) / 0.2) * 15, 55, 70));
    return { tier: "moderate", pct };
  }
  // map 0 → 40, 0.4 → 55
  const pct = Math.round(clamp(40 + (abs / 0.4) * 15, 40, 55));
  return { tier: "low", pct };
}

function sizingFor(tier: ConvictionTier): string {
  if (tier === "high") return "1.5–2% portfolio risk";
  if (tier === "moderate") return "0.75–1% portfolio risk";
  return "0.25–0.5% or sidelined";
}

function computeEntryZone(direction: TradeDirection, spot: number): EntryZone {
  if (direction === "sidelined") {
    return {
      zoneLow: spot,
      zoneHigh: spot,
      currentSpot: spot,
      inZone: false,
      action: "Wait for regime break — no clean entry",
    };
  }
  if (direction === "long") {
    const zoneLow = +(spot * 0.93).toFixed(2);
    const zoneHigh = +(spot * 0.97).toFixed(2);
    const inZone = spot <= zoneHigh;
    let action: string;
    if (spot <= zoneLow) action = "Buy now — spot at/below zone";
    else if (inZone) action = "Scale in — spot inside entry zone";
    else action = "Wait for pullback to zone";
    return { zoneLow, zoneHigh, currentSpot: spot, inZone, action };
  }
  // short
  const zoneLow = +(spot * 1.03).toFixed(2);
  const zoneHigh = +(spot * 1.07).toFixed(2);
  const inZone = spot >= zoneLow;
  let action: string;
  if (spot >= zoneHigh) action = "Sell now — spot at/above zone";
  else if (inZone) action = "Scale in — spot inside entry zone";
  else action = "Wait for rally to zone";
  return { zoneLow, zoneHigh, currentSpot: spot, inZone, action };
}

function computeTakeProfits(
  direction: TradeDirection,
  spot: number,
  band: MagnitudeBand,
): TakeProfitLevel[] {
  if (direction === "sidelined") return [];
  // For long: T1 = brentLow (closer to spot), T2 = brentHigh
  // For short: T1 = brentHigh (closer to spot below), T2 = brentLow
  // We always use the status-quo band — the bull-case target for longs,
  // the pullback band for shorts (already negative deltas in low/high).
  if (direction === "long") {
    const t1 = band.brentLow;
    const t2 = band.brentHigh;
    return [
      {
        level: t1,
        label: "T1 · Trim 50%",
        pctFromSpot: ((t1 - spot) / spot) * 100,
        rationale: "Lower bound of magnitude band — partial profit, raise stop",
      },
      {
        level: t2,
        label: "T2 · Full exit",
        pctFromSpot: ((t2 - spot) / spot) * 100,
        rationale: "Upper bound of magnitude band — thesis fully priced",
      },
    ];
  }
  // short: band returns negative deltas (pullback range). brentHigh is closer
  // to spot, brentLow is the deeper target.
  const t1 = band.brentHigh;
  const t2 = band.brentLow;
  return [
    {
      level: t1,
      label: "T1 · Cover 50%",
      pctFromSpot: ((t1 - spot) / spot) * 100,
      rationale: "Near bound of pullback range — partial profit, lower stop",
    },
    {
      level: t2,
      label: "T2 · Full cover",
      pctFromSpot: ((t2 - spot) / spot) * 100,
      rationale: "Deeper bound of pullback range — thesis fully priced",
    },
  ];
}

function computeInstruments(
  direction: TradeDirection,
  data: SignalData,
): InstrumentRecommendation[] {
  if (direction === "sidelined") {
    return [
      {
        name: "Long Brent strangles",
        rationale: "Defined risk both directions — paid if regime breaks either way",
        priority: "primary",
      },
      {
        name: "Cash / dry powder",
        rationale: "Preserve optionality — wait for signal alignment",
        priority: "secondary",
      },
      {
        name: "AVOID directional plays",
        rationale: "No edge in uncertain regime — wait for regime break",
        priority: "avoid",
      },
    ];
  }

  if (direction === "long") {
    const out: InstrumentRecommendation[] = [];
    const frontIv = data.volSkew?.atmIv?.front?.current ?? 0;
    const oiPct = data.paperMarket?.brentOI?.percentChange ?? 0;
    const backwardation = data.curveShape?.percentBackwardation ?? 0;

    if (frontIv > 40 && oiPct < -25) {
      out.push({
        name: "Long M7 Brent calls",
        rationale: "Defined risk, paper-deleveraging-safe — front IV elevated + Brent OI cratered",
        priority: "primary",
      });
    } else {
      // Default primary if conditions don't perfectly align
      out.push({
        name: "Long Brent call spreads",
        rationale: "Capped premium outlay — captures upside without IV crush risk",
        priority: "primary",
      });
    }

    if (backwardation > 20) {
      out.push({
        name: "Front-month Brent futures",
        rationale: "Positive roll yield from steep backwardation — paid to wait",
        priority: "secondary",
      });
    } else if (data.equityDisbelief) {
      out.push({
        name: "Energy basket (XLE / XOM / CVX / COP)",
        rationale: "Currie disbelief thesis — 1,000bp FCF gap must close via rotation or oil collapse",
        priority: "secondary",
      });
    } else {
      out.push({
        name: "Calendar spreads (long front / short deferred)",
        rationale: "Express backwardation thesis with defined max loss",
        priority: "secondary",
      });
    }

    out.push({
      name: "AVOID outright unhedged Brent futures",
      rationale: "Paper conviction collapsed (Signal 14) — no overnight flow support, gap risk both ways",
      priority: "avoid",
    });
    return out;
  }

  // short
  return [
    {
      name: "Brent put spreads",
      rationale: "Defined risk vs left-tail explosive moves — Hormuz escalation can gap +$20 overnight",
      priority: "primary",
    },
    {
      name: "Short energy ETF beta (XLE puts or inverse XOP)",
      rationale: "Equity-side expression of reopening thesis — Currie disbelief unwinds the other way",
      priority: "secondary",
    },
    {
      name: "AVOID outright Brent short futures",
      rationale: "Left-tail risk if Hormuz event escalates — unlimited loss profile against geopolitics",
      priority: "avoid",
    },
  ];
}

function buildExitTrigger(args: {
  signalName: string;
  current: number;
  trigger: number;
  unit: string;
  direction: "below" | "above";
  startValue: number; // value where progress = 0% (status fully intact)
  rationale: string;
}): ExitTrigger {
  const { signalName, current, trigger, unit, direction, startValue, rationale } = args;

  // Compute pctToTrigger (0 = far from firing, 100 = fired)
  let pctToTrigger: number;
  if (direction === "below") {
    if (current <= trigger) pctToTrigger = 100;
    else {
      const span = startValue - trigger;
      pctToTrigger = span <= 0 ? 0 : clamp(((startValue - current) / span) * 100, 0, 100);
    }
  } else {
    if (current >= trigger) pctToTrigger = 100;
    else {
      const span = trigger - startValue;
      pctToTrigger = span <= 0 ? 0 : clamp(((current - startValue) / span) * 100, 0, 100);
    }
  }

  let status: "intact" | "warning" | "fired";
  if (pctToTrigger >= 100) status = "fired";
  else if (pctToTrigger >= 70) status = "warning";
  else status = "intact";

  return {
    signalName,
    current,
    trigger,
    unit,
    pctToTrigger: Math.round(pctToTrigger),
    status,
    direction,
    rationale,
  };
}

/**
 * Phase regression exit trigger (per JH MOI/Phase framework).
 *   Phase 0 = thesis dead (fired, regression to pre-crisis baseline)
 *   Phase 1 = intact (current — Excess Cash Burn)
 *   Phase 2 = warning (thesis accelerating, not invalidating)
 *   Phase 3 = thesis confirmed (also intact — sidelined into bidding)
 * The trigger fires only when phase regresses to 0.
 */
function buildPhaseRegressionTrigger(phase: InventoryPhase): ExitTrigger {
  const pctToTrigger =
    phase === 0 ? 100 : phase === 1 ? 25 : phase === 2 ? 10 : 5;
  const status: ExitTrigger["status"] = pctToTrigger >= 100 ? "fired" : "intact";

  return {
    signalName: "Phase regression",
    current: phase,
    trigger: 0,
    unit: "phase",
    pctToTrigger,
    status,
    direction: "below",
    rationale:
      "Inventory phase regression to Phase 0 (pre-crisis baseline) = thesis dead. Phase 1+ holding = thesis intact and accelerating.",
  };
}

function computeExitTriggersLong(data: SignalData): ExitTrigger[] {
  const triggers: ExitTrigger[] = [];

  // 1. Insurance fading
  const insRate = data.insurance.current;
  triggers.push(
    buildExitTrigger({
      signalName: "Insurance premium",
      current: insRate,
      trigger: 2.0,
      unit: "%",
      direction: "below",
      startValue: 6.0,
      rationale: "Below 2% = war risk fading — primary bullish driver weakening",
    }),
  );

  // 2. VLCC TD3 collapsing
  const vlcc = data.tankerEconomics?.routes.find((r) => /vlcc/i.test(r.name));
  if (vlcc) {
    const startValue = vlcc.baselineRate * 3; // ~$90k at $30k baseline
    triggers.push(
      buildExitTrigger({
        signalName: "VLCC TD3 day rate",
        current: vlcc.currentRate,
        trigger: 60000,
        unit: "$/d",
        direction: "below",
        startValue,
        rationale: "Below $60k/d = freight pricing in reopening — physical premium fading",
      }),
    );
  }

  // 3. Risk reversal flipping bearish
  const rr = data.volSkew?.hero?.riskReversalVolPts;
  if (rr != null) {
    triggers.push(
      buildExitTrigger({
        signalName: "25Δ risk reversal",
        current: rr,
        trigger: 0,
        unit: "vol pts",
        direction: "below",
        startValue: 5,
        rationale: "Below zero = options market leans bearish — sentiment flip",
      }),
    );
  }

  // 4. Backwardation softening
  const back = data.curveShape?.percentBackwardation;
  if (back != null) {
    triggers.push(
      buildExitTrigger({
        signalName: "% Backwardation",
        current: back,
        trigger: 15,
        unit: "%",
        direction: "below",
        startValue: 30,
        rationale: "Below 15% = supply tightness regime ending — curve normalizing",
      }),
    );
  }

  // 5. Paper market OI recovering
  const oiCur = data.paperMarket?.brentOI?.currentContracts;
  const oiBase = data.paperMarket?.brentOI?.baselineContracts;
  if (oiCur != null && oiBase != null && oiBase > 0) {
    const pctOfBaseline = (oiCur / oiBase) * 100;
    // Start at current ratio rounded down to a sensible floor (e.g. 60%)
    const startValue = Math.min(pctOfBaseline, 60);
    triggers.push(
      buildExitTrigger({
        signalName: "Brent OI % of baseline",
        current: +pctOfBaseline.toFixed(1),
        trigger: 80,
        unit: "%",
        direction: "above",
        startValue,
        rationale: "Above 80% of baseline = paper conviction returning, suppression ending",
      }),
    );
  }

  // 6. Ship transit normalizing
  triggers.push(
    buildExitTrigger({
      signalName: "Hormuz ship transit",
      current: data.shipTransit.dailyCount,
      trigger: 50,
      unit: "ships/d",
      direction: "above",
      startValue: 10,
      rationale: "Above 50/day = physical traffic resuming — crisis fading",
    }),
  );

  // 7. Diplomatic resolution (qualitative — uses status ladder, not numeric).
  // Calibrated to PHYSICAL CONFIRMATION GATES, not rhetoric. JAWBONE_ONLY
  // weight intentionally low (10) — repeated unconfirmed statements per HFI
  // anchoring-bias framework extend crisis duration; they do not invalidate
  // the bullish thesis.
  if (data.diplomaticWatch) {
    const statusLadder: Record<DiplomaticStatus, number> = {
      NONE: 0,
      JAWBONE_ONLY: 10,
      SPECIFIC_TERMS_LEAKED: 35,
      PHYSICAL_CONFIRMATION: 75,
      CONFIRMED: 100,
    };
    const pctToTrigger = statusLadder[data.diplomaticWatch.status];
    let status: ExitTrigger["status"];
    if (pctToTrigger === 100) status = "fired";
    else if (pctToTrigger >= 75) status = "warning";
    else status = "intact";

    triggers.push({
      signalName: "Diplomatic resolution",
      current: data.diplomaticWatch.status.replace(/_/g, " "),
      trigger: "CONFIRMED",
      unit: "",
      pctToTrigger,
      status,
      direction: "above",
      rationale:
        "If diplomatic resolution confirmed via physical signals (not rhetoric), bullish thesis invalidated within 5–10 days. Jawbone-only statements do not invalidate — they extend crisis duration.",
    });
  }

  return triggers;
}

function computeExitTriggersShort(data: SignalData): ExitTrigger[] {
  // For shorts, triggers fire when conditions MOVE AWAY from reopening
  // (e.g. insurance spikes back up, VLCC rates surge, RR turns deeply bullish).
  const triggers: ExitTrigger[] = [];

  // 1. Insurance re-spiking
  triggers.push(
    buildExitTrigger({
      signalName: "Insurance premium",
      current: data.insurance.current,
      trigger: 4.0,
      unit: "%",
      direction: "above",
      startValue: 0.5,
      rationale: "Above 4% = war risk re-spiking — short thesis breaking",
    }),
  );

  // 2. VLCC TD3 re-surging
  const vlcc = data.tankerEconomics?.routes.find((r) => /vlcc/i.test(r.name));
  if (vlcc) {
    triggers.push(
      buildExitTrigger({
        signalName: "VLCC TD3 day rate",
        current: vlcc.currentRate,
        trigger: 100000,
        unit: "$/d",
        direction: "above",
        startValue: 30000,
        rationale: "Above $100k/d = freight pricing in re-escalation — cover the short",
      }),
    );
  }

  // 3. Risk reversal turning strongly bullish
  const rr = data.volSkew?.hero?.riskReversalVolPts;
  if (rr != null) {
    triggers.push(
      buildExitTrigger({
        signalName: "25Δ risk reversal",
        current: rr,
        trigger: 5,
        unit: "vol pts",
        direction: "above",
        startValue: -2,
        rationale: "Above +5 = options market piling into calls — sentiment flip against short",
      }),
    );
  }

  // 4. Backwardation re-steepening
  const back = data.curveShape?.percentBackwardation;
  if (back != null) {
    triggers.push(
      buildExitTrigger({
        signalName: "% Backwardation",
        current: back,
        trigger: 30,
        unit: "%",
        direction: "above",
        startValue: 10,
        rationale: "Above 30% = curve re-pricing acute supply stress — exit short",
      }),
    );
  }

  // 5. Ship transit collapsing further
  triggers.push(
    buildExitTrigger({
      signalName: "Hormuz ship transit",
      current: data.shipTransit.dailyCount,
      trigger: 5,
      unit: "ships/d",
      direction: "below",
      startValue: 30,
      rationale: "Below 5/day = physical traffic collapsing further — short exposed to gap risk",
    }),
  );

  // 6. Brent OI re-collapsing (deleveraging deepens, gap risk both ways)
  const oiCur = data.paperMarket?.brentOI?.currentContracts;
  const oiBase = data.paperMarket?.brentOI?.baselineContracts;
  if (oiCur != null && oiBase != null && oiBase > 0) {
    const pctOfBaseline = (oiCur / oiBase) * 100;
    triggers.push(
      buildExitTrigger({
        signalName: "Brent OI % of baseline",
        current: +pctOfBaseline.toFixed(1),
        trigger: 50,
        unit: "%",
        direction: "below",
        startValue: 80,
        rationale: "Below 50% of baseline = liquidity re-collapsing — gap risk neutral, cover short",
      }),
    );
  }

  return triggers;
}

function computeExitTriggersSidelined(data: SignalData): ExitTrigger[] {
  // Sidelined: monitor whether we're breaking OUT of the uncertain regime
  // in either direction. Fewer triggers, watching for regime breaks.
  const triggers: ExitTrigger[] = [];

  triggers.push(
    buildExitTrigger({
      signalName: "Insurance premium",
      current: data.insurance.current,
      trigger: 4.0,
      unit: "%",
      direction: "above",
      startValue: 0.5,
      rationale: "Above 4% = clear bullish regime forming — go long",
    }),
  );

  triggers.push(
    buildExitTrigger({
      signalName: "Insurance premium (lower break)",
      current: data.insurance.current,
      trigger: 1.0,
      unit: "%",
      direction: "below",
      startValue: 6.0,
      rationale: "Below 1% = clear bearish regime forming — go short",
    }),
  );

  const back = data.curveShape?.percentBackwardation;
  if (back != null) {
    triggers.push(
      buildExitTrigger({
        signalName: "% Backwardation",
        current: back,
        trigger: 25,
        unit: "%",
        direction: "above",
        startValue: 10,
        rationale: "Above 25% = curve re-pricing acute stress — long bias confirmed",
      }),
    );
  }

  triggers.push(
    buildExitTrigger({
      signalName: "Hormuz ship transit",
      current: data.shipTransit.dailyCount,
      trigger: 50,
      unit: "ships/d",
      direction: "above",
      startValue: 10,
      rationale: "Above 50/day = physical normalization confirmed — go short",
    }),
  );

  return triggers;
}

function computeThesisHealth(triggers: ExitTrigger[]): ThesisHealth {
  if (triggers.length === 0) {
    return { scorePct: 50, label: "INSUFFICIENT DATA", color: "amber" };
  }
  const avgIntact =
    triggers.reduce((sum, t) => sum + (100 - t.pctToTrigger), 0) / triggers.length;
  const scorePct = Math.round(clamp(avgIntact, 0, 100));
  let label: string;
  let color: "green" | "amber" | "red";
  if (scorePct >= 70) {
    label = "THESIS INTACT";
    color = "green";
  } else if (scorePct >= 40) {
    label = "THESIS DEGRADING — REVIEW EXIT";
    color = "amber";
  } else {
    label = "THESIS BROKEN — EXIT NOW";
    color = "red";
  }
  return { scorePct, label, color };
}

export function computeTradeSetup(data: SignalData, verdict: Verdict): TradeSetup {
  const direction = tradeDirectionFromVerdict(verdict.direction);
  const { tier, pct } = convictionFromComposite(verdict.composite);
  const spot = data.oilSpread.brent;
  const entryZone = computeEntryZone(direction, spot);
  const takeProfits = computeTakeProfits(direction, spot, verdict.reopeningScenario.statusQuo);
  const instruments = computeInstruments(direction, data);

  let exitTriggers: ExitTrigger[];
  if (direction === "long") exitTriggers = computeExitTriggersLong(data);
  else if (direction === "short") exitTriggers = computeExitTriggersShort(data);
  else exitTriggers = computeExitTriggersSidelined(data);

  // 8th trigger — JH MOI/Phase framework. Universal across directions: phase
  // regression to 0 invalidates the active thesis whichever side you're on.
  if (data.phaseIndicator) {
    exitTriggers.push(buildPhaseRegressionTrigger(data.phaseIndicator.phase));
  }

  const thesisHealth = computeThesisHealth(exitTriggers);

  return {
    direction,
    conviction: tier,
    convictionPct: pct,
    sizingGuide: sizingFor(tier),
    entryZone,
    takeProfits,
    instruments,
    exitTriggers,
    thesisHealth,
  };
}
