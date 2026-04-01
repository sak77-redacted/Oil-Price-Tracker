"use client";

import type { GlobalImpactData, CountryImpact } from "@/lib/types";

interface GlobalSupplyDisruptionProps {
  globalData: GlobalImpactData;
  regionalData: CountryImpact[];
}

const severityColors: Record<CountryImpact["severity"], string> = {
  critical: "bg-red-400",
  high: "bg-amber-400",
  moderate: "bg-yellow-400",
  low: "bg-green-400",
};

const severityTextColors: Record<CountryImpact["severity"], string> = {
  critical: "text-red-400",
  high: "text-amber-400",
  moderate: "text-yellow-400",
  low: "text-green-400",
};

export default function GlobalSupplyDisruption({
  globalData,
  regionalData,
}: GlobalSupplyDisruptionProps) {
  // Sort regional data by dependency descending
  const sortedRegional = [...regionalData].sort(
    (a, b) => b.dependency - a.dependency
  );

  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6">
      {/* Header */}
      <h2 className="mb-5 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
        Global Supply Disruption
      </h2>

      {/* Section 1 — Macro stats */}
      <div className="grid grid-cols-2 gap-3">
        {/* Oil at risk */}
        <div className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] p-4">
          <span className="text-2xl font-bold text-red-400">
            {globalData.worldOilAtRiskPct}%
          </span>
          <span className="ml-1 text-sm font-medium text-red-400/70">
            world oil
          </span>
          <p className="mt-0.5 text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
            At Risk
          </p>
          <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
            ${globalData.dailyCostBillions}B daily cost
          </p>
        </div>

        {/* LNG at risk */}
        <div className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] p-4">
          <span className="text-2xl font-bold text-red-400">
            {globalData.worldLngAtRiskPct}%
          </span>
          <span className="ml-1 text-sm font-medium text-red-400/70">
            world LNG
          </span>
          <p className="mt-0.5 text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
            At Risk
          </p>
          <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
            ${globalData.dailyLngCostBillions}B daily cost
          </p>
        </div>
      </div>

      {/* Inline stats row */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span>
          <span className="font-semibold text-red-400">
            Shipping +{globalData.shippingRateIncreasePct}%
          </span>
        </span>
        <span className="text-[var(--card-border)]">&middot;</span>
        <span>
          <span className="font-semibold text-amber-400">
            CPI +{globalData.cpiImpactPct}%
          </span>
        </span>
        <span className="text-[var(--card-border)]">&middot;</span>
        <span>
          <span className="font-semibold text-amber-400">
            SPR reserve {globalData.sprReserveDays} days
          </span>
        </span>
      </div>

      {/* Divider */}
      <div className="border-t border-[var(--card-border)] my-4" />

      {/* Section 2 — Regional Exposure */}
      <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
        Regional Exposure
      </h3>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {sortedRegional.map((country) => (
          <div
            key={country.country}
            className="flex items-center gap-2 rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2.5"
          >
            {/* Severity dot */}
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${severityColors[country.severity]}`}
            />
            {/* Country name */}
            <span className="text-sm font-medium text-[var(--text-primary)] truncate">
              {country.country}
            </span>
            {/* Percentage */}
            <span
              className={`ml-auto shrink-0 text-sm font-bold tabular-nums ${severityTextColors[country.severity]}`}
            >
              {country.dependency}%
            </span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-[var(--card-border)] my-4" />

      {/* Section 3 — Alternative Routes */}
      <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
        Alternative Routes
      </h3>

      <div className="flex flex-col gap-3">
        {globalData.alternativeRoutes.map((route) => (
          <div key={route.route}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                {route.route}
              </span>
              <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[11px] font-bold text-amber-400">
                +{route.addedDays} days
              </span>
              <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-[11px] font-bold text-red-400">
                {route.addedCost}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
              {route.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
