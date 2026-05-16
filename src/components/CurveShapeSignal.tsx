"use client";

import type {
  CurveShapeSignal as CurveShapeSignalType,
  SignalStatus,
} from "@/lib/types";
import { statusColor } from "@/lib/utils";
import SignalCard from "./SignalCard";
import SparkChart from "./SparkChart";

interface CurveShapeSignalProps {
  data: CurveShapeSignalType;
}

/**
 * Status logic per Jeff Currie (Carlyle, May 16, 2026):
 *  - % backwardation > 25 → RED   "Crisis priced in spot only"
 *  - % backwardation 15–25 → YELLOW "Partial pricing"
 *  - % backwardation < 15  → GREEN  "Normal curve"
 */
function getStatus(pct: number): SignalStatus {
  if (pct > 25) return "red";
  if (pct >= 15) return "yellow";
  return "green";
}

function getStatusLabel(status: SignalStatus): string {
  if (status === "red") return "Crisis priced in spot only";
  if (status === "yellow") return "Partial pricing";
  return "Normal curve";
}

export default function CurveShapeSignal({ data }: CurveShapeSignalProps) {
  const status = getStatus(data.percentBackwardation);
  const statusLabel = getStatusLabel(status);
  const headlineColor =
    status === "red"
      ? "var(--color-signal-red)"
      : status === "yellow"
        ? "var(--color-signal-yellow)"
        : "var(--color-signal-green)";

  // Chart-friendly history (% backwardation series)
  const chartData = data.history.map((h) => ({
    date: h.date,
    value: h.percentBackwardation,
  }));

  // Recharts needs a raw hex for SVG strokes
  const chartHex =
    status === "red" ? "#ef4444" : status === "yellow" ? "#eab308" : "#22c55e";

  return (
    <SignalCard
      title="Signal 11 · Curve Shape / % Backwardation"
      subtitle="Market belief: how much of the supply shock is priced in"
      status={status}
      statusLabel={statusLabel}
      lastUpdated={data.lastUpdated}
      source={data.source}
      physicalMarketNote={data.physicalMarketNote}
      physicalMarketNotes={data.physicalMarketNotes}
    >
      <div className="flex flex-col gap-4">
        {/* Hero metric */}
        <div className="flex items-baseline gap-3">
          <div>
            <span
              className="text-5xl font-bold tracking-tight tabular-nums"
              style={{ color: headlineColor }}
            >
              {data.percentBackwardation.toFixed(1)}
            </span>
            <span className="ml-2 text-sm text-[var(--text-secondary)]">
              % backwardation
            </span>
          </div>
          <div className="flex flex-col text-xs text-[var(--text-secondary)]">
            <span>
              ${data.absoluteBackwardation.toFixed(0)}/bbl spot − 36mo
            </span>
            <span>
              ATH: {data.atHigh.percentBackwardation.toFixed(1)}% on{" "}
              {data.atHigh.date}
            </span>
          </div>
        </div>

        {/* Three-column sub-stat grid */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Spot Brent
            </div>
            <div className="mt-1 text-lg font-bold tabular-nums text-[var(--text-primary)]">
              ${data.spotBrent.toFixed(0)}/bbl
            </div>
            <div className="text-[10px] text-[var(--text-secondary)]">
              BZ=F prompt
            </div>
          </div>

          <div className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              24-month forward
            </div>
            <div className="mt-1 text-lg font-bold tabular-nums text-[var(--text-primary)]">
              ${data.brent24m.toFixed(0)}/bbl
            </div>
            <div className="text-[10px] text-[var(--text-secondary)]">
              ICE Brent long-dated
            </div>
          </div>

          <div className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              36-month forward
            </div>
            <div className="mt-1 text-lg font-bold tabular-nums text-[var(--text-primary)]">
              ${data.brent36m.toFixed(0)}/bbl
            </div>
            <div className="text-[10px] text-[var(--text-secondary)]">
              The anchor
            </div>
          </div>
        </div>

        {/* Historical parallels strip */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {data.historicalParallels.map((p) => (
            <div
              key={p.label}
              className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2"
            >
              <div className="flex items-baseline justify-between">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  {p.label}
                </div>
                <div className="text-[10px] text-[var(--text-secondary)]">
                  {p.date}
                </div>
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-base font-bold tabular-nums text-[var(--text-primary)]">
                  {p.percentBackwardation.toFixed(1)}%
                </span>
                <span className="text-[10px] text-[var(--text-secondary)]">
                  spot ${p.spotBrent.toFixed(0)} / 36mo ${p.brent36m.toFixed(0)}
                </span>
              </div>
              <p className="mt-1 text-[11px] italic leading-snug text-[var(--text-secondary)]">
                {p.insight}
              </p>
            </div>
          ))}
        </div>

        {/* Sparkline */}
        <div>
          <div className="mb-1 flex items-baseline justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              % Backwardation — history
            </span>
            <span className="text-[10px] text-[var(--text-secondary)]">
              Threshold: {data.threshold}%
            </span>
          </div>
          <SparkChart
            data={chartData}
            threshold={data.threshold}
            color={chartHex}
            height={80}
          />
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
            % backwardation comparable to Russia-Ukraine peak, but spot is ~$22
            lower because the back end sits $11 below where it was then. The
            curve implies normalization within ~{data.impliedNormalizationYears}{" "}
            years — that the supply math may not support.
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
