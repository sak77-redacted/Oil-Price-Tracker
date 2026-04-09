"use client";

import type { TankerRatesData } from "@/lib/types";

interface TankerRatesProps {
  data: TankerRatesData;
}

function formatRate(rate: number): string {
  return `$${rate.toLocaleString("en-US")}`;
}

function getMultiplierColor(multiplier: number): string {
  if (multiplier >= 2.5) return "#ef4444";
  if (multiplier >= 1.8) return "#eab308";
  return "#22c55e";
}

export default function TankerRates({ data }: TankerRatesProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card)]">
      {/* Header */}
      <div className="border-b border-[var(--card-border)] px-5 py-3">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">
          Tanker Rates
        </h2>
        <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
          Crude carrier TCE earnings — the shipping cost of the crisis
        </p>
      </div>

      {/* Vessel cards — 3 columns desktop, stacked mobile */}
      <div className="grid grid-cols-1 gap-px bg-[var(--card-border)] sm:grid-cols-3">
        {data.vessels.map((vessel) => {
          const multiplier = vessel.currentRate / vessel.baselineRate;
          const multiplierColor = getMultiplierColor(multiplier);
          // Bar percentages relative to peak
          const currentPct = Math.min(
            (vessel.currentRate / vessel.peakRate) * 100,
            100
          );
          const baselinePct = (vessel.baselineRate / vessel.peakRate) * 100;

          return (
            <div key={vessel.class} className="bg-[var(--card)] px-5 py-5">
              {/* Class name + multiplier badge */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-[var(--text-primary)]">
                    {vessel.class}
                  </span>
                </div>
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-bold"
                  style={{
                    color: multiplierColor,
                    backgroundColor: `${multiplierColor}20`,
                  }}
                >
                  {multiplier.toFixed(1)}x
                </span>
              </div>

              {/* Description */}
              <div className="mt-0.5 text-[11px] text-[var(--text-secondary)]">
                {vessel.description}
              </div>

              {/* Current rate */}
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tabular-nums text-[var(--text-primary)]">
                  {formatRate(vessel.currentRate)}
                </span>
                <span className="text-xs text-[var(--text-secondary)]">
                  /day
                </span>
              </div>

              {/* Visual bar: baseline → current → peak */}
              <div className="mt-3">
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-[var(--background)]">
                  {/* Current rate bar */}
                  <div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      width: `${currentPct}%`,
                      backgroundColor: multiplierColor,
                      opacity: 0.7,
                    }}
                  />
                  {/* Baseline marker */}
                  <div
                    className="absolute inset-y-0 w-0.5 bg-[var(--text-secondary)]"
                    style={{ left: `${baselinePct}%` }}
                    title={`Baseline: ${formatRate(vessel.baselineRate)}/day`}
                  />
                </div>
                <div className="mt-1 flex justify-between text-[9px] text-[var(--text-secondary)]">
                  <span>
                    Baseline {formatRate(vessel.baselineRate)}
                  </span>
                  <span>
                    Peak {formatRate(vessel.peakRate)}
                  </span>
                </div>
              </div>

              {/* Route */}
              <div className="mt-2 text-[10px] text-[var(--text-secondary)]">
                {vessel.route}
              </div>
            </div>
          );
        })}
      </div>

      {/* Context paragraph */}
      <div className="border-t border-[var(--card-border)] px-5 py-3">
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          <span className="font-semibold text-amber-400">Insight:</span>{" "}
          {data.context}
        </p>
      </div>

      {/* Source */}
      <div className="border-t border-[var(--card-border)] px-5 py-2">
        <p className="text-[10px] text-[var(--text-secondary)]">
          Source: {data.source}
        </p>
      </div>
    </div>
  );
}
