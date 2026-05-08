"use client";

import type {
  USProductStocksSignal as USProductStocksSignalType,
  SignalStatus,
} from "@/lib/types";
import { statusColor } from "@/lib/utils";
import SignalCard from "./SignalCard";

interface USProductStocksSignalProps {
  data: USProductStocksSignalType;
}

/**
 * Status logic per Trade with Conviction (Neil Crosby, May 8, 2026):
 *  - weeksToCritical ≤ 3 → RED   "Diesel breaks first"
 *  - weeksToCritical 4–6 → YELLOW "Approaching"
 *  - weeksToCritical > 6 → GREEN  "Buffered"
 */
function getStatus(weeksToCritical: number): SignalStatus {
  if (weeksToCritical <= 3) return "red";
  if (weeksToCritical <= 6) return "yellow";
  return "green";
}

function getStatusLabel(status: SignalStatus): string {
  if (status === "red") return "Diesel breaks first";
  if (status === "yellow") return "Approaching";
  return "Buffered";
}

export default function USProductStocksSignal({
  data,
}: USProductStocksSignalProps) {
  const status = getStatus(data.weeksToCritical);
  const statusLabel = getStatusLabel(status);
  const headlineColor =
    status === "red"
      ? "var(--color-signal-red)"
      : status === "yellow"
        ? "var(--color-signal-yellow)"
        : "var(--color-signal-green)";

  return (
    <SignalCard
      title="US Product Stocks Runway"
      subtitle="Diesel may be the first to break"
      status={status}
      statusLabel={statusLabel}
      lastUpdated={data.lastUpdated}
      source={data.source}
      physicalMarketNote={data.physicalMarketNote}
      physicalMarketNotes={data.physicalMarketNotes}
    >
      <div className="flex flex-col gap-4">
        {/* Hero metric: weeks-to-critical */}
        <div className="flex items-baseline gap-3">
          <div>
            <span
              className="text-5xl font-bold tracking-tight tabular-nums"
              style={{ color: headlineColor }}
            >
              ~{data.weeksToCritical}
            </span>
            <span className="ml-2 text-sm text-[var(--text-secondary)]">
              weeks
            </span>
          </div>
          <div className="flex flex-col text-xs text-[var(--text-secondary)]">
            <span>To PAD1 critical</span>
            <span className="font-semibold text-[var(--text-primary)]">
              ~{data.criticalDateLabel}
            </span>
          </div>
        </div>

        {/* Sub-stats grid: 3 chips */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Commercial draws
            </div>
            <div className="mt-1 text-lg font-bold tabular-nums text-[var(--text-primary)]">
              {data.commercialDrawsMbd.toFixed(1)} mb/d
            </div>
            <div className="text-[10px] text-[var(--text-secondary)]">
              April average
            </div>
          </div>

          <div className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              PAD1 status
            </div>
            <div className="mt-1 inline-flex rounded-full border border-red-500/30 bg-red-500/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-red-300">
              {data.pad1Status}
            </div>
            <div className="mt-1 text-[10px] text-[var(--text-secondary)]">
              East Coast diesel
            </div>
          </div>

          <div className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Japan Aug fixtures
            </div>
            <div className="mt-1 text-lg font-bold tabular-nums text-[var(--text-primary)]">
              {data.japanAugFixturesMb} mb US crude
            </div>
            <div className="text-[10px] text-[var(--text-secondary)]">
              vs {data.japanPreCrisisRange} pre-crisis
            </div>
          </div>
        </div>

        {/* Status-driven insight banner */}
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
              "Diesel is the binding constraint. PAD1 stocks are 2–3 draws from critical, US commercial draws running 1.4 mb/d, and Japan locked record US crude exports for August — runway is shrinking faster than the strait can reopen."}
            {status === "yellow" &&
              "Approaching the breakpoint. Draw pace and export commitments still erode buffer week-over-week; product pricing has to defend against further bleed to Europe."}
            {status === "green" &&
              "Buffered. Draws have moderated and export commitments eased — runway resets but the trend bears watching."}
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
