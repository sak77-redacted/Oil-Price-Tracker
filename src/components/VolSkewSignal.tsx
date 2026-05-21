"use client";

import type {
  VolSkewSignal as VolSkewSignalType,
  SignalStatus,
} from "@/lib/types";
import { statusColor } from "@/lib/utils";
import SignalCard from "./SignalCard";
import SparkChart from "./SparkChart";

interface VolSkewSignalProps {
  data: VolSkewSignalType;
}

/**
 * Status logic per spec:
 *   red    — |risk reversal| > 5 AND ATM IV > 45% (strong directional conviction
 *            in a stressed market)
 *   yellow — ATM IV > 35% but risk reversal within ±5 (stress without direction)
 *   green  — ATM IV < 35% (normalizing)
 */
function deriveStatus(rr: number, frontAtmIv: number): SignalStatus {
  if (Math.abs(rr) > 5 && frontAtmIv > 45) return "red";
  if (frontAtmIv > 35) return "yellow";
  return "green";
}

function statusLabel(status: SignalStatus): string {
  if (status === "red") return "Directional Conviction";
  if (status === "yellow") return "Stressed · Mixed Direction";
  return "Normalizing";
}

function fmtSigned(n: number, digits = 0): string {
  if (n > 0) return `+${n.toFixed(digits)}`;
  if (n < 0) return `−${Math.abs(n).toFixed(digits)}`;
  return n.toFixed(digits);
}

function heroLabel(rr: number): string {
  if (Math.abs(rr) < 1) return "BALANCED";
  return rr > 0 ? "CALLS BID" : "PUTS BID";
}

function leanText(rr: number): string {
  if (Math.abs(rr) < 1) return "options market direction-neutral";
  return rr > 0 ? "↑ HIGHER" : "↓ LOWER";
}

export default function VolSkewSignal({ data }: VolSkewSignalProps) {
  const rr = data.hero.riskReversalVolPts;
  const front = data.atmIv.front;
  const threeMonth = data.atmIv.threeMonth;
  const sixMonth = data.atmIv.sixMonth;
  const status = deriveStatus(rr, front.current);
  const heroColor = statusColor(status);

  const ivSpark = data.history.map((p) => ({
    date: p.date,
    value: p.atmIv,
  }));
  const rrSpark = data.history.map((p) => ({
    date: p.date,
    value: p.riskReversal,
  }));

  const ivDelta = front.current - front.baseline;
  const ovxDelta = data.ovx.current - data.ovx.baseline;

  // Front-month implied ~daily Brent $ move from ATM IV (rough 1-σ daily).
  // Used as an illustrative band — assumes ~$107 spot Brent and 252 trading days.
  // sigma_daily = IV / sqrt(252); range shown as ~0.8–1.0× of that × spot.
  const dailyMoveLow = Math.round((front.current / 100) * 107 / Math.sqrt(252) * 0.85);
  const dailyMoveHigh = Math.round((front.current / 100) * 107 / Math.sqrt(252) * 1.15);

  return (
    <SignalCard
      title="Signal 16 · Vol Skew · Options Market Expectations"
      subtitle="What options money EXPECTS — risk reversal, ATM IV, term structure"
      status={status}
      statusLabel={statusLabel(status)}
      lastUpdated={data.lastUpdated}
      source={data.source}
      physicalMarketNote={data.physicalMarketNote}
      physicalMarketNotes={data.physicalMarketNotes}
    >
      <div className="flex flex-col gap-4">
        {/* Hero: risk reversal in vol pts + directional label */}
        <div>
          <span
            className="text-5xl font-bold tracking-tight tabular-nums"
            style={{ color: heroColor }}
          >
            {fmtSigned(rr, 0)}
            <span className="ml-1 text-2xl font-semibold text-[var(--text-secondary)]">
              vol pts
            </span>
          </span>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wider" style={{ color: heroColor }}>
            {heroLabel(rr)}
            <span className="ml-2 text-[10px] font-normal normal-case text-[var(--text-secondary)]">
              — {data.riskReversalSnapshot.interpretation}
            </span>
          </p>
        </div>

        {/* Three sub-stat chips */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-[var(--background)] px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Front ATM IV
            </p>
            <p
              className="mt-2 text-xl font-bold tabular-nums"
              style={{ color: heroColor }}
            >
              {front.current}%
            </p>
            <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
              Baseline {front.baseline}% ·{" "}
              <span className="font-medium" style={{ color: heroColor }}>
                {fmtSigned(ivDelta, 0)} pts
              </span>
            </p>
          </div>

          <div className="rounded-lg bg-[var(--background)] px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              3M ATM IV
            </p>
            <p className="mt-2 text-xl font-bold tabular-nums text-[var(--text-primary)]">
              {threeMonth.current}%
            </p>
            <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
              Baseline {threeMonth.baseline}% · {fmtSigned(threeMonth.current - threeMonth.baseline, 0)} pts
            </p>
          </div>

          <div className="rounded-lg bg-[var(--background)] px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              OVX
            </p>
            <p className="mt-2 text-xl font-bold tabular-nums text-[var(--text-primary)]">
              {data.ovx.current}
            </p>
            <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
              Baseline {data.ovx.baseline} ·{" "}
              <span className="font-medium" style={{ color: heroColor }}>
                {fmtSigned(ovxDelta, 0)}
              </span>
            </p>
          </div>
        </div>

        {/* Direction interpretation banner */}
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
          <p className="text-sm leading-relaxed text-[var(--text-primary)]">
            Options market leaning{" "}
            <span className="font-bold" style={{ color: heroColor }}>
              {leanText(rr)}
            </span>
            . 25-delta calls trading{" "}
            <span className="font-semibold">{fmtSigned(rr, 0)} vol points</span>{" "}
            {rr >= 0 ? "over" : "under"} equivalent puts. Front-month ATM IV at{" "}
            <span className="font-semibold">
              {(front.current / Math.max(front.baseline, 1)).toFixed(1)}×
            </span>{" "}
            baseline = market pricing ~${dailyMoveLow}–${dailyMoveHigh} daily
            Brent moves.
          </p>
        </div>

        {/* Term-structure mini display */}
        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Vol Term Structure
            </span>
            <span className="text-[10px] italic text-[var(--text-secondary)]">
              Front &gt; 3M &gt; 6M = backwardation in vol = front-end stressed
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-red-300">
                Front (30d)
              </p>
              <p className="mt-1 text-lg font-bold tabular-nums text-[var(--text-primary)]">
                {front.current}%
              </p>
            </div>
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                3-Month
              </p>
              <p className="mt-1 text-lg font-bold tabular-nums text-[var(--text-primary)]">
                {threeMonth.current}%
              </p>
            </div>
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                6-Month
              </p>
              <p className="mt-1 text-lg font-bold tabular-nums text-[var(--text-primary)]">
                {sixMonth.current}%
              </p>
            </div>
          </div>
        </div>

        {/* 25-delta skew breakdown */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              25-delta call skew
            </div>
            <div className="mt-1 text-base font-bold tabular-nums text-emerald-300">
              {fmtSigned(data.callSkew25d, 0)} vol pts
            </div>
          </div>
          <div className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              25-delta put skew
            </div>
            <div className="mt-1 text-base font-bold tabular-nums text-red-300">
              {fmtSigned(data.putSkew25d, 0)} vol pts
            </div>
          </div>
        </div>

        {/* Dual stacked sparklines — ATM IV + Risk Reversal */}
        <div className="flex flex-col gap-2">
          <div>
            <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
              <span>Front ATM IV (%) — history</span>
              <span>{data.history[0]?.atmIv}% → {data.history[data.history.length - 1]?.atmIv}%</span>
            </div>
            <SparkChart data={ivSpark} color="var(--danger)" height={70} />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
              <span>25-delta Risk Reversal (vol pts) — history</span>
              <span>
                {fmtSigned(data.history[0]?.riskReversal ?? 0, 1)} →{" "}
                {fmtSigned(data.history[data.history.length - 1]?.riskReversal ?? 0, 1)}
              </span>
            </div>
            <SparkChart data={rrSpark} color="var(--accent)" height={70} />
          </div>
        </div>

        {/* Status-driven insight */}
        <div
          className="rounded-lg border-l-2 px-4 py-3"
          style={{
            borderColor: heroColor,
            background:
              status === "red"
                ? "rgba(239, 68, 68, 0.08)"
                : status === "yellow"
                  ? "rgba(234, 179, 8, 0.08)"
                  : "rgba(34, 197, 94, 0.08)",
          }}
        >
          <p
            className="text-sm font-medium leading-relaxed"
            style={{ color: heroColor }}
          >
            {data.insight}
          </p>
        </div>

        {/* Methodology footer */}
        <div className="border-t border-[var(--card-border)] pt-3 text-[11px] italic leading-relaxed text-[var(--text-secondary)]">
          {data.methodology}
        </div>
      </div>
    </SignalCard>
  );
}
