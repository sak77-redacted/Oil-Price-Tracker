"use client";

import type { BuyerStressSignal as BuyerStressSignalType, SignalStatus } from "@/lib/types";
import { statusColor } from "@/lib/utils";
import SignalCard from "./SignalCard";

interface BuyerStressSignalProps {
  data: BuyerStressSignalType;
}

/**
 * Status logic per JH/@CRUDEOIL231 thesis (May 7, 2026):
 *  - 3-2-1 crack ≥ $50 AND WAF stalled AND buyer = wait-and-see
 *      → YELLOW: hope-driven lull, temporary
 *  - 3-2-1 crack < $40 OR WAF accelerating
 *      → RED: capitulation imminent / forced bidding
 *  - 3-2-1 crack < $30 AND demand destruction visible
 *      → GREEN: demand actually breaking
 */
function getBuyerStressStatus(d: BuyerStressSignalType): SignalStatus {
  if (d.crackSpread321 < 30 && d.demandDestructionVisible) return "green";
  if (d.crackSpread321 < d.crackSpreadThreshold || d.wafProgrammeStatus === "accelerating") return "red";
  if (
    d.crackSpread321 >= 50 &&
    d.wafProgrammeStatus === "stalled" &&
    d.buyerBehavior === "wait-and-see"
  ) {
    return "yellow";
  }
  // Mixed / transitioning state — treat as yellow.
  return "yellow";
}

function getStatusLabel(status: SignalStatus, d: BuyerStressSignalType): string {
  if (status === "green") return "Demand actually breaking";
  if (status === "red") return d.wafProgrammeStatus === "accelerating" ? "Forced bidding" : "Capitulation imminent";
  return "Hope-driven lull";
}

function getWafStatusStyle(s: BuyerStressSignalType["wafProgrammeStatus"]) {
  switch (s) {
    case "stalled":
      return { color: "text-yellow-300", bg: "bg-yellow-500/15", border: "border-yellow-500/30", label: "STALLED" };
    case "accelerating":
      return { color: "text-red-300", bg: "bg-red-500/15", border: "border-red-500/30", label: "ACCELERATING" };
    case "normal":
      return { color: "text-green-300", bg: "bg-green-500/15", border: "border-green-500/30", label: "NORMAL" };
  }
}

function getBuyerBehaviorStyle(b: BuyerStressSignalType["buyerBehavior"]) {
  switch (b) {
    case "wait-and-see":
      return { color: "text-yellow-300", bg: "bg-yellow-500/15", border: "border-yellow-500/30", label: "Wait-and-see" };
    case "capitulation-begins":
      return { color: "text-orange-300", bg: "bg-orange-500/15", border: "border-orange-500/30", label: "Capitulation begins" };
    case "forced-bidding":
      return { color: "text-red-300", bg: "bg-red-500/15", border: "border-red-500/30", label: "Forced bidding" };
  }
}

function daysSince(iso: string): number {
  const start = new Date(iso + "T00:00:00Z").getTime();
  const today = Date.now();
  const diffMs = today - start;
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export default function BuyerStressSignal({ data }: BuyerStressSignalProps) {
  const status = getBuyerStressStatus(data);
  const statusLabel = getStatusLabel(status, data);
  const wafStyle = getWafStatusStyle(data.wafProgrammeStatus);
  const buyerStyle = getBuyerBehaviorStyle(data.buyerBehavior);
  const crisisDay = daysSince(data.crisisStartDate);

  // Crack spread color
  const crackColor =
    data.crackSpread321 < data.crackSpreadThreshold
      ? "var(--color-signal-red)"
      : data.crackSpread321 >= 50
        ? "var(--color-signal-yellow)"
        : "var(--color-signal-green)";

  return (
    <SignalCard
      title="Physical Buyer Stress"
      subtitle="Asian refineries are buying time, not barrels"
      status={status}
      statusLabel={statusLabel}
      lastUpdated={data.lastUpdated}
      source={data.source}
    >
      <div className="flex flex-col gap-4">
        {/* Big number: crack spread */}
        <div className="flex items-baseline gap-3">
          <div>
            <span
              className="text-5xl font-bold tracking-tight tabular-nums"
              style={{ color: crackColor }}
            >
              ${data.crackSpread321.toFixed(0)}
            </span>
            <span className="ml-2 text-sm text-[var(--text-secondary)]">
              /bbl
            </span>
          </div>
          <div className="flex flex-col text-xs text-[var(--text-secondary)]">
            <span>WTI 3-2-1 crack</span>
            <span>Threshold: &lt; ${data.crackSpreadThreshold}/bbl = capitulation</span>
          </div>
        </div>

        {/* Sub-stats grid */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {/* WAF programme */}
          <div className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              WAF May Programme
            </div>
            <div
              className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider border ${wafStyle.bg} ${wafStyle.color} ${wafStyle.border}`}
            >
              {wafStyle.label}
            </div>
          </div>

          {/* Buyer behavior */}
          <div className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Buyer Behavior
            </div>
            <div
              className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold border ${buyerStyle.bg} ${buyerStyle.color} ${buyerStyle.border}`}
            >
              {buyerStyle.label}
            </div>
          </div>

          {/* Days of crisis */}
          <div className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Days Since Crisis Began
            </div>
            <div className="mt-1 text-lg font-bold tabular-nums text-[var(--text-primary)]">
              Day {crisisDay}
            </div>
            <div className="text-[10px] text-[var(--text-secondary)]">
              from {data.crisisStartDate}
            </div>
          </div>
        </div>

        {/* WAF description */}
        <div className="rounded-lg border-l-2 border-amber-500/40 bg-amber-500/5 px-4 py-3">
          <p className="text-xs leading-relaxed text-[var(--text-primary)]">
            {data.wafProgrammeDescription}
          </p>
        </div>

        {/* Buyer behavior description */}
        <div className="rounded-lg bg-[var(--background)] px-4 py-3">
          <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
            <span className="font-semibold text-[var(--text-primary)]">Why this matters: </span>
            {data.buyerBehaviorDescription}
          </p>
        </div>

        {/* Status-driven insight */}
        <div
          className="rounded-lg border-l-2 px-4 py-3"
          style={{
            borderColor: statusColor(status),
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
            style={{ color: statusColor(status) }}
          >
            {status === "yellow" &&
              "Hope-driven lull, temporary. When facts don't change, buyers are forced back to aggressive bidding."}
            {status === "red" &&
              "Capitulation underway. WAF bidding spikes mean the lull is over — Asian buyers are forced to chase cargoes."}
            {status === "green" &&
              "Demand actually breaking. 3-2-1 cracks collapsing below $30 with visible refinery shutdowns — the bear signal."}
          </p>
        </div>

        {/* Methodology footnote */}
        <div className="border-t border-[var(--card-border)] pt-3 text-[11px] italic leading-relaxed text-[var(--text-secondary)]">
          {data.methodology}
        </div>
      </div>
    </SignalCard>
  );
}
