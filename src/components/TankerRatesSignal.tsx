"use client";

import type {
  TankerRatesSignal as TankerRatesSignalType,
  SignalStatus,
} from "@/lib/types";
import { statusColor } from "@/lib/utils";
import SignalCard from "./SignalCard";
import SparkChart from "./SparkChart";

interface TankerRatesSignalProps {
  data: TankerRatesSignalType;
}

/**
 * Derive status from VLCC TD3 multiple-over-baseline.
 *   red    >= 2.0×
 *   yellow >= 1.5×
 *   green  <  1.5×
 */
function deriveStatus(
  currentVlcc: number,
  baselineVlcc: number,
): SignalStatus {
  if (baselineVlcc <= 0) return "yellow";
  const multiple = currentVlcc / baselineVlcc;
  if (multiple >= 2.0) return "red";
  if (multiple >= 1.5) return "yellow";
  return "green";
}

function statusLabel(status: SignalStatus): string {
  if (status === "red") return "Crisis Freight";
  if (status === "yellow") return "Elevated";
  return "Normalizing";
}

function formatRate(rate: number): string {
  if (rate >= 1000) {
    return `$${Math.round(rate / 1000)}k`;
  }
  return `$${rate}`;
}

export default function TankerRatesSignal({ data }: TankerRatesSignalProps) {
  const vlcc = data.routes.find((r) => /vlcc/i.test(r.name)) ?? data.routes[0];
  const status =
    vlcc != null
      ? deriveStatus(vlcc.currentRate, vlcc.baselineRate)
      : data.status;

  const vlccSpark = data.history.map((p) => ({
    date: p.date,
    value: p.vlcc,
  }));
  const suezSpark = data.history.map((p) => ({
    date: p.date,
    value: p.suezmax,
  }));

  return (
    <SignalCard
      title={data.title}
      subtitle="VLCC TD3 day rates — the leading-indicator of arbitrage opening"
      status={status}
      statusLabel={statusLabel(status)}
      lastUpdated={data.lastUpdated}
      source={data.source}
      physicalMarketNote={data.physicalMarketNote}
      physicalMarketNotes={data.physicalMarketNotes}
    >
      <div className="flex flex-col gap-4">
        {/* Hero: $95k/day + % vs baseline */}
        <div>
          <span
            className="text-5xl font-bold tracking-tight tabular-nums"
            style={{ color: statusColor(status) }}
          >
            {formatRate(data.hero.rate)}
            <span className="ml-1 text-2xl font-semibold text-[var(--text-secondary)]">
              /day
            </span>
          </span>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {data.hero.route} ·{" "}
            <span
              className="font-semibold"
              style={{ color: statusColor(status) }}
            >
              +{data.hero.pctVsBaseline}%
            </span>{" "}
            vs pre-crisis baseline
          </p>
        </div>

        {/* Three-route sub-stat grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {data.routes.map((route) => {
            const routeStatus =
              route === vlcc
                ? status
                : deriveStatus(route.currentRate, route.baselineRate);
            return (
              <div
                key={route.name}
                className="rounded-lg bg-[var(--background)] px-3 py-3"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  {route.name}
                </p>
                <p className="mt-0.5 text-[10px] leading-tight text-[var(--text-secondary)]">
                  {route.description}
                </p>
                <p
                  className="mt-2 text-xl font-bold tabular-nums"
                  style={{ color: statusColor(routeStatus) }}
                >
                  {formatRate(route.currentRate)}/d
                </p>
                <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
                  Pre-crisis {formatRate(route.baselineRate)}/d ·{" "}
                  <span
                    className="font-medium"
                    style={{ color: statusColor(routeStatus) }}
                  >
                    +{route.pctChange}%
                  </span>
                </p>
                {route.worldscaleCurrent != null &&
                  route.worldscaleBaseline != null && (
                    <p className="mt-1 text-[10px] text-[var(--text-secondary)]">
                      WS{route.worldscaleCurrent} vs WS
                      {route.worldscaleBaseline} baseline
                    </p>
                  )}
              </div>
            );
          })}
        </div>

        {/* Dual sparklines — stacked because SparkChart is single-series */}
        <div className="flex flex-col gap-2">
          <div>
            <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
              <span>VLCC TD3 — $/day</span>
              <span>MEG → China</span>
            </div>
            <SparkChart
              data={vlccSpark}
              color="var(--danger)"
              height={70}
            />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
              <span>Suezmax — $/day</span>
              <span>MEG → Europe</span>
            </div>
            <SparkChart
              data={suezSpark}
              color="var(--accent)"
              height={70}
            />
          </div>
        </div>

        {/* Status-driven insight banner */}
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
          <p className="text-sm leading-relaxed text-[var(--text-primary)]">
            {data.insight}
          </p>
        </div>

        {/* Methodology footnote */}
        <p className="text-[11px] leading-relaxed text-[var(--text-secondary)]">
          {data.methodology}
        </p>
      </div>
    </SignalCard>
  );
}
