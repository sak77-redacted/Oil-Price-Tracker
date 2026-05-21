"use client";

import type {
  PaperMarketSignal as PaperMarketSignalType,
  SignalStatus,
} from "@/lib/types";
import { statusColor } from "@/lib/utils";
import SignalCard from "./SignalCard";
import SparkChart from "./SparkChart";

interface PaperMarketSignalProps {
  data: PaperMarketSignalType;
}

/**
 * Status logic per OIES Q1–Q2 2026 paper market review / JH synthesis:
 *   ratio = currentBrentOI / baselineBrentOI
 *   ratio < retrenchmentThreshold (0.75) → RED    "Forced retrenchment"
 *   0.75 ≤ ratio < 0.90                  → YELLOW "Conviction draining"
 *   ratio ≥ 0.90                         → GREEN  "Paper market intact"
 */
function getStatus(ratio: number, threshold: number): SignalStatus {
  if (ratio < threshold) return "red";
  if (ratio < 0.9) return "yellow";
  return "green";
}

function getStatusLabel(status: SignalStatus): string {
  if (status === "red") return "Forced retrenchment";
  if (status === "yellow") return "Conviction draining";
  return "Paper market intact";
}

function fmtContracts(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return n.toLocaleString();
}

function fmtSignedContracts(n: number): string {
  const sign = n >= 0 ? "+" : "−";
  return `${sign}${fmtContracts(Math.abs(n))}`;
}

export default function PaperMarketSignal({ data }: PaperMarketSignalProps) {
  const ratio =
    data.brentOI.baselineContracts > 0
      ? data.brentOI.currentContracts / data.brentOI.baselineContracts
      : 1;
  const status = getStatus(ratio, data.retrenchmentThreshold);
  const statusLabel = getStatusLabel(status);
  const headlineColor =
    status === "red"
      ? "var(--color-signal-red)"
      : status === "yellow"
        ? "var(--color-signal-yellow)"
        : "var(--color-signal-green)";

  const chartData = data.history.map((h) => ({
    date: h.date,
    value: h.brentOI / 1_000_000, // millions of contracts
  }));
  const baselineMm = data.brentOI.baselineContracts / 1_000_000;
  const chartHex =
    status === "red" ? "#ef4444" : status === "yellow" ? "#eab308" : "#22c55e";

  const mmDelta = data.mmNetLong.current - data.mmNetLong.pre;
  const mmDeltaPct =
    data.mmNetLong.pre > 0 ? (mmDelta / data.mmNetLong.pre) * 100 : 0;

  return (
    <SignalCard
      title="Signal 14 · Paper Market Conviction"
      subtitle="Why physical tightness isn't showing up in spot — open interest cratered when it should have spiked"
      status={status}
      statusLabel={statusLabel}
      lastUpdated={data.lastUpdated}
      source={data.source}
      physicalMarketNote={data.physicalMarketNote}
      physicalMarketNotes={data.physicalMarketNotes}
    >
      <div className="flex flex-col gap-4">
        {/* Hero metric: Brent OI delta vs baseline */}
        <div className="flex items-baseline gap-3">
          <div>
            <span
              className="text-5xl font-bold tracking-tight tabular-nums"
              style={{ color: headlineColor }}
            >
              {data.brentOI.percentChange.toFixed(1)}%
            </span>
            <span className="ml-2 text-sm text-[var(--text-secondary)]">
              Brent OI vs Jan baseline
            </span>
          </div>
          <div className="flex flex-col text-xs text-[var(--text-secondary)]">
            <span>
              {fmtContracts(data.brentOI.currentContracts)} contracts vs{" "}
              {fmtContracts(data.brentOI.baselineContracts)} on{" "}
              {data.brentOI.baselineDate}
            </span>
            <span className="font-semibold text-[var(--text-primary)]">
              In every prior scare, OI spiked. This time it cratered.
            </span>
          </div>
        </div>

        {/* Three-column sub-stat */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Brent MM net long collapse
            </div>
            <div className="mt-1 text-lg font-bold tabular-nums text-red-300">
              {fmtContracts(data.mmNetLong.pre)} → {fmtContracts(data.mmNetLong.current)}
            </div>
            <div className="text-[10px] text-[var(--text-secondary)]">
              {mmDeltaPct.toFixed(0)}% forced retrenchment (VaR + ICE margin
              doubling)
            </div>
          </div>

          <div className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              0DTE share of WTI options
            </div>
            <div className="mt-1 text-lg font-bold tabular-nums text-[var(--text-primary)]">
              {data.optionsShares[0]?.pre}% → {data.optionsShares[0]?.current}%
            </div>
            <div className="text-[10px] text-[var(--text-secondary)]">
              Defined-risk migration — no overnight margin calls
            </div>
          </div>

          <div className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Weekly WTI options ADV
            </div>
            <div className="mt-1 text-lg font-bold tabular-nums text-[var(--text-primary)]">
              ~{data.optionsShares[2]?.current}k/day
            </div>
            <div className="text-[10px] text-[var(--text-secondary)]">
              +50% YoY · flow exited futures for weeklies
            </div>
          </div>
        </div>

        {/* Anomaly insight banner — always shown above positioning strip */}
        <div className="rounded-lg border-l-2 border-amber-500 bg-amber-500/10 px-4 py-3">
          <p className="text-sm font-medium leading-relaxed text-amber-200">
            Geopolitical scares usually SPIKE open interest as hedgers and
            speculators pile in. This one cratered. That&rsquo;s the
            deleveraging tell — and why physical signals lead price by weeks,
            not days.
          </p>
        </div>

        {/* Two-card positioning strip — Brent (deleveraging) vs WTI (mega-trader floor) */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {/* Brent — forced out */}
          <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2">
            <div className="flex items-baseline justify-between">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-red-300">
                Brent · Deleveraging
              </div>
              <div className="text-[10px] text-[var(--text-secondary)]">
                ICE Futures Europe
              </div>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-base font-bold tabular-nums text-[var(--text-primary)]">
                {fmtContracts(data.brentOI.currentContracts)}
              </span>
              <span className="text-[10px] text-[var(--text-secondary)]">
                OI ({data.brentOI.percentChange.toFixed(1)}% vs baseline)
              </span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <div className="text-[10px] text-[var(--text-secondary)]">
                  MM net long
                </div>
                <div className="font-bold tabular-nums text-[var(--text-primary)]">
                  {fmtContracts(data.mmNetLong.current)}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[var(--text-secondary)]">
                  Δ from pre-crisis
                </div>
                <div className="font-bold tabular-nums text-red-300">
                  {fmtSignedContracts(mmDelta)}
                </div>
              </div>
            </div>
            <p className="mt-2 text-[11px] italic leading-snug text-[var(--text-secondary)]">
              {data.mmNetLong.note}
            </p>
          </div>

          {/* WTI — pinned by mega-traders */}
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2">
            <div className="flex items-baseline justify-between">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                WTI · Mega-trader floor
              </div>
              <div className="text-[10px] text-[var(--text-secondary)]">
                CME (SPAN capital edge)
              </div>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-base font-bold tabular-nums text-[var(--text-primary)]">
                {fmtContracts(data.wtiOI.currentContracts)}
              </span>
              <span className="text-[10px] text-[var(--text-secondary)]">
                OI ({data.wtiOI.percentChange >= 0 ? "+" : ""}
                {data.wtiOI.percentChange.toFixed(1)}% vs baseline)
              </span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <div className="text-[10px] text-[var(--text-secondary)]">
                  Swap dealer short
                </div>
                <div className="font-bold tabular-nums text-[var(--text-primary)]">
                  {fmtContracts(data.swapDealerShort.current)}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[var(--text-secondary)]">
                  Δ from pre-crisis
                </div>
                <div className="font-bold tabular-nums text-amber-300">
                  +{fmtContracts(data.swapDealerShort.current - data.swapDealerShort.pre)}
                </div>
              </div>
            </div>
            <p className="mt-2 text-[11px] italic leading-snug text-[var(--text-secondary)]">
              {data.wtiOI.note}
            </p>
          </div>
        </div>

        {/* Options-share migration table */}
        <div className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2">
          <div className="mb-1 flex items-baseline justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Options-share migration · pre-crisis → current
            </span>
            <span className="text-[10px] italic text-[var(--text-secondary)]">
              Risk migrated from futures to defined-risk options
            </span>
          </div>
          <table className="w-full border-separate border-spacing-0 text-[11px]">
            <thead>
              <tr>
                <th className="py-1 pr-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  Bucket
                </th>
                <th className="px-2 py-1 text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  Pre-crisis
                </th>
                <th className="px-2 py-1 text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  Current
                </th>
                <th className="px-2 py-1 text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  Δ
                </th>
              </tr>
            </thead>
            <tbody>
              {data.optionsShares.map((row) => {
                const delta = row.current - row.pre;
                const unit = row.unit;
                return (
                  <tr
                    key={row.bucket}
                    className="border-t border-[var(--card-border)]/40"
                  >
                    <td className="py-1.5 pr-2 text-[11px] text-[var(--text-primary)]">
                      {row.bucket}
                    </td>
                    <td className="px-2 py-1 text-center text-[11px] tabular-nums text-[var(--text-secondary)]">
                      {row.pre}
                      {unit}
                    </td>
                    <td className="px-2 py-1 text-center text-[11px] tabular-nums font-bold text-[var(--text-primary)]">
                      {row.current}
                      {unit}
                    </td>
                    <td className="px-2 py-1 text-center text-[11px] tabular-nums">
                      <span className="inline-block rounded border border-amber-500/30 bg-amber-500/15 px-1.5 py-0.5 font-semibold text-amber-300">
                        +{delta}
                        {unit}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-2 text-[11px] italic leading-snug text-[var(--text-secondary)]">
            {data.advOiRatioStatus}
          </p>
        </div>

        {/* Brent OI sparkline */}
        <div>
          <div className="mb-1 flex items-baseline justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Brent OI (M contracts) — history
            </span>
            <span className="text-[10px] text-[var(--text-secondary)]">
              Baseline: {baselineMm.toFixed(1)}M ·{" "}
              {data.brentOI.baselineDate}
            </span>
          </div>
          <SparkChart
            data={chartData}
            threshold={baselineMm * data.retrenchmentThreshold}
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
            {status === "red" &&
              "Brent OI has cratered past the 25% retrenchment threshold — conviction money has been forced out. The marginal price-setter is now a 0DTE option seller exiting by 4pm. This is why physical tightness (Signals 1, 2, 7, 8, 10, 13) is leading spot by weeks: the paper market that should arbitrage them is empty. Until OI rebuilds, expect divergence to widen — and any catalyst that pulls structural money back will repriced fast."}
            {status === "yellow" &&
              "Open interest is draining but the retrenchment regime is not yet confirmed. Watch for further VaR-driven exits or a rebuild — either way, paper conviction is the missing variable."}
            {status === "green" &&
              "Open interest broadly intact. Paper market is transmitting physical signals to spot — divergence between fundamentals and price should be smaller."}
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
