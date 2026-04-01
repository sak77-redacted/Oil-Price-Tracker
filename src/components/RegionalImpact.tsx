"use client";

import type { CountryImpact } from "@/lib/types";

interface RegionalImpactProps {
  data: CountryImpact[];
}

const severityConfig = {
  critical: {
    border: "border-l-red-500",
    bg: "bg-red-500/5",
    badgeBg: "bg-red-500/15",
    badgeText: "text-red-400",
    valueText: "text-red-400",
  },
  high: {
    border: "border-l-amber-500",
    bg: "bg-amber-500/5",
    badgeBg: "bg-amber-500/15",
    badgeText: "text-amber-400",
    valueText: "text-amber-400",
  },
  moderate: {
    border: "border-l-yellow-500",
    bg: "bg-yellow-500/5",
    badgeBg: "bg-yellow-500/15",
    badgeText: "text-yellow-400",
    valueText: "text-yellow-400",
  },
  low: {
    border: "border-l-green-500",
    bg: "bg-green-500/5",
    badgeBg: "bg-green-500/15",
    badgeText: "text-green-400",
    valueText: "text-green-400",
  },
} as const;

export default function RegionalImpact({ data }: RegionalImpactProps) {
  return (
    <section className="mt-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">
          Regional Impact Heatmap
        </h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Oil dependency via Strait of Hormuz by country
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {data.map((country) => {
          const config = severityConfig[country.severity];
          const isCritical = country.severity === "critical";

          return (
            <div
              key={country.country}
              className={`rounded-xl border border-[var(--card-border)] ${config.bg} ${config.border} border-l-4 p-5 ${
                isCritical ? "md:col-span-2" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className={`text-lg font-bold ${config.valueText}`}>
                      {country.country}
                    </h3>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${config.badgeBg} ${config.badgeText}`}
                    >
                      {country.severity}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    {country.description}
                  </p>
                </div>

                <div className="flex-shrink-0 text-right">
                  <span
                    className={`text-2xl font-bold tabular-nums ${config.valueText}`}
                  >
                    {country.dependency}%
                  </span>
                  <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
                    via Hormuz
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
