"use client";

import type {
  EquityDisbeliefSignal as EquityDisbeliefSignalType,
  SignalStatus,
} from "@/lib/types";
import { statusColor } from "@/lib/utils";
import SignalCard from "./SignalCard";
import SparkChart from "./SparkChart";

interface EquityDisbeliefSignalProps {
  data: EquityDisbeliefSignalType;
}

/**
 * Status logic per Jeff Currie (Carlyle, May 16, 2026):
 *  - fcfYieldGapBps_at105 > 800 → RED    "Forced rotation pending"
 *  - 500–800                    → YELLOW "Stretched"
 *  - < 500                      → GREEN  "Reasonable"
 */
function getStatus(gapBps: number): SignalStatus {
  if (gapBps > 800) return "red";
  if (gapBps >= 500) return "yellow";
  return "green";
}

function getStatusLabel(status: SignalStatus): string {
  if (status === "red") return "Forced rotation pending";
  if (status === "yellow") return "Stretched";
  return "Reasonable";
}

export default function EquityDisbeliefSignal({
  data,
}: EquityDisbeliefSignalProps) {
  const status = getStatus(data.fcfYieldGapBps_at105);
  const statusLabel = getStatusLabel(status);
  const headlineColor =
    status === "red"
      ? "var(--color-signal-red)"
      : status === "yellow"
        ? "var(--color-signal-yellow)"
        : "var(--color-signal-green)";

  const chartData = data.history.map((h) => ({
    date: h.date,
    value: h.fcfYieldGapBps,
  }));
  const chartHex =
    status === "red" ? "#ef4444" : status === "yellow" ? "#eab308" : "#22c55e";

  const muni = data.munificent7;
  const mag = data.magnificent7;

  return (
    <SignalCard
      title="Signal 12 · Energy Equity Disbelief Gauge"
      subtitle="Market belief: capital is pricing the opposite of physical reality"
      status={status}
      statusLabel={statusLabel}
      lastUpdated={data.lastUpdated}
      source={data.source}
      physicalMarketNote={data.physicalMarketNote}
      physicalMarketNotes={data.physicalMarketNotes}
    >
      <div className="flex flex-col gap-4">
        {/* Hero metric: FCF yield gap */}
        <div className="flex items-baseline gap-3">
          <div>
            <span
              className="text-5xl font-bold tracking-tight tabular-nums"
              style={{ color: headlineColor }}
            >
              {data.fcfYieldGapBps_at105.toLocaleString()}
            </span>
            <span className="ml-2 text-sm text-[var(--text-secondary)]">
              bps FCF yield gap
            </span>
          </div>
          <div className="flex flex-col text-xs text-[var(--text-secondary)]">
            <span>Energy {data.energyFCFYield_at105.toFixed(1)}% vs S&amp;P 500 {data.sp500FCFYield.toFixed(1)}% (at $105 Brent)</span>
            <span>
              At consensus: {data.fcfYieldGapBps_atConsensus.toLocaleString()} bps · threshold {data.fcfYieldGapThresholdBps} bps
            </span>
          </div>
        </div>

        {/* Three-column sub-stat */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Energy weight (S&amp;P 500)
            </div>
            <div className="mt-1 text-lg font-bold tabular-nums text-[var(--text-primary)]">
              {data.energyPctOfSP500.toFixed(1)}%
            </div>
            <div className="text-[10px] text-[var(--text-secondary)]">
              vs {data.energyPctOfSP500_preHormuz.toFixed(1)}% pre-Hormuz · {data.energyPctOfSP500_GFCLow.toFixed(1)}% GFC low
            </div>
          </div>

          <div className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Implied long-run Brent
            </div>
            <div className="mt-1 text-lg font-bold tabular-nums text-[var(--text-primary)]">
              ${data.impliedLongRunBrent}/bbl
            </div>
            <div className="text-[10px] text-[var(--text-secondary)]">
              vs strip ${data.strip36m} / spot ${data.spotBrent}
            </div>
          </div>

          <div className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Munificent vs Magnificent FCF
            </div>
            <div className="mt-1 text-lg font-bold tabular-nums text-[var(--text-primary)]">
              {muni.fcfYield_at105?.toFixed(1) ?? "—"}% vs {mag.fcfYield?.toFixed(1) ?? "—"}%
            </div>
            <div className="text-[10px] text-[var(--text-secondary)]">
              Old economy yields 10x new
            </div>
          </div>
        </div>

        {/* Comparison strip — Munificent vs Magnificent */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {/* Munificent 7 */}
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2">
            <div className="flex items-baseline justify-between">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                {muni.label}
              </div>
              <div className="text-[10px] text-[var(--text-secondary)]">
                P/E {muni.pe.toFixed(1)}
              </div>
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
              {muni.constituents.map((c) => (
                <span
                  key={c}
                  className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300"
                >
                  {c}
                </span>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <div className="text-[10px] text-[var(--text-secondary)]">FCF @ $105</div>
                <div className="font-bold tabular-nums text-[var(--text-primary)]">
                  {muni.fcfYield_at105?.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[var(--text-secondary)]">FCF @ consensus</div>
                <div className="font-bold tabular-nums text-[var(--text-primary)]">
                  {muni.fcfYield_atConsensus?.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          {/* Magnificent 7 */}
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2">
            <div className="flex items-baseline justify-between">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                {mag.label}
              </div>
              <div className="text-[10px] text-[var(--text-secondary)]">
                P/E {mag.pe.toFixed(1)}
              </div>
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
              {mag.constituents.map((c) => (
                <span
                  key={c}
                  className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300"
                >
                  {c}
                </span>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <div className="text-[10px] text-[var(--text-secondary)]">FCF yield</div>
                <div className="font-bold tabular-nums text-[var(--text-primary)]">
                  {mag.fcfYield?.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[var(--text-secondary)]">2026 capex</div>
                <div className="font-bold tabular-nums text-[var(--text-primary)]">
                  ${mag.capex2026Bn}bn
                </div>
              </div>
            </div>
            {mag.amazonPrimaryEnergyMbpd != null && (
              <div className="mt-1 text-[10px] italic text-[var(--text-secondary)]">
                Amazon alone bidding {mag.amazonPrimaryEnergyMbpd.toFixed(1)} mb/d-equivalent primary energy
              </div>
            )}
          </div>
        </div>

        {/* Sparkline */}
        <div>
          <div className="mb-1 flex items-baseline justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              FCF yield gap (bps) — history
            </span>
            <span className="text-[10px] text-[var(--text-secondary)]">
              Threshold: {data.fcfYieldGapThresholdBps} bps
            </span>
          </div>
          <SparkChart
            data={chartData}
            threshold={data.fcfYieldGapThresholdBps}
            color={chartHex}
            height={80}
          />
        </div>

        {/* Status insight */}
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
            Energy at {data.energyPctOfSP500.toFixed(1)}% of S&amp;P 500, {data.fcfYieldGapBps_at105.toLocaleString()}bps FCF yield gap.
            Market is pricing oil at ${data.impliedLongRunBrent} long-run while strip is ${data.strip36m}. If physical reality wins,
            ~${data.rotationPotentialTn} trillion rotation from tech to molecules is forced — the Revenge of the Old Economy.
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
