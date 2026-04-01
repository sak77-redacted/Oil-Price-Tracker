"use client";

import type { CrackSpreadData } from "@/lib/types";

interface CrackSpreadsProps {
  data: CrackSpreadData;
}

function formatChange(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}$${Math.abs(value).toFixed(2)}`;
}

export default function CrackSpreads({ data }: CrackSpreadsProps) {
  const gasChangeColor =
    data.gasolineCrackChange >= 0 ? "#22c55e" : "#ef4444";
  const hoChangeColor =
    data.heatingOilCrackChange >= 0 ? "#22c55e" : "#ef4444";
  const gasArrow = data.gasolineCrackChange >= 0 ? "\u25B2" : "\u25BC";
  const hoArrow = data.heatingOilCrackChange >= 0 ? "\u25B2" : "\u25BC";

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card)]">
      {/* Header */}
      <div className="border-b border-[var(--card-border)] px-5 py-3">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">
          Refining Margins (Crack Spreads)
        </h2>
        <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
          How the crude crisis flows through to pump prices
        </p>
      </div>

      {/* Two-column crack cards */}
      <div className="grid grid-cols-1 gap-px bg-[var(--card-border)] sm:grid-cols-2">
        {/* Gasoline Crack */}
        <div className="bg-[var(--card)] px-5 py-5">
          <div className="mb-1 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
            Gasoline Crack
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold tabular-nums text-[var(--text-primary)]">
              ${data.gasolineCrack.toFixed(2)}
            </span>
            <span className="text-sm font-medium text-[var(--text-secondary)]">
              /bbl
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span
              className="text-sm font-semibold tabular-nums"
              style={{ color: gasChangeColor }}
            >
              {gasArrow} {formatChange(data.gasolineCrackChange)} today
            </span>
          </div>
          <div className="mt-3 space-y-1 text-xs text-[var(--text-secondary)] leading-relaxed">
            <p>Crude &rarr; gasoline margin</p>
            <p>
              Higher = refiners profit from crisis
            </p>
          </div>
        </div>

        {/* Heating Oil Crack */}
        <div className="bg-[var(--card)] px-5 py-5">
          <div className="mb-1 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
            Heating Oil Crack
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold tabular-nums text-[var(--text-primary)]">
              ${data.heatingOilCrack.toFixed(2)}
            </span>
            <span className="text-sm font-medium text-[var(--text-secondary)]">
              /bbl
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span
              className="text-sm font-semibold tabular-nums"
              style={{ color: hoChangeColor }}
            >
              {hoArrow} {formatChange(data.heatingOilCrackChange)} today
            </span>
          </div>
          <div className="mt-3 space-y-1 text-xs text-[var(--text-secondary)] leading-relaxed">
            <p>Crude &rarr; diesel margin</p>
            <p>
              European diesel cliff approaching catastrophic
            </p>
          </div>
        </div>
      </div>

      {/* Insight callout */}
      <div className="border-t border-[var(--card-border)] px-5 py-3">
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          <span className="font-semibold text-amber-400">Insight:</span>{" "}
          When crack spreads spike, pump prices follow within days. European
          jet fuel: last Middle Eastern cargo arriving this week.
        </p>
      </div>
    </div>
  );
}
