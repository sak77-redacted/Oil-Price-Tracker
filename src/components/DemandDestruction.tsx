"use client";

import type { DemandDestructionData, DemandEvent } from "@/lib/types";

interface DemandDestructionProps {
  data: DemandDestructionData;
}

const categoryConfig: Record<
  DemandEvent["category"],
  { bg: string; text: string; label: string }
> = {
  rationing: {
    bg: "bg-red-500/15",
    text: "text-red-400",
    label: "Rationing",
  },
  "force-majeure": {
    bg: "bg-amber-500/15",
    text: "text-amber-400",
    label: "Force Majeure",
  },
  "production-cut": {
    bg: "bg-yellow-500/15",
    text: "text-yellow-400",
    label: "Production Cut",
  },
  "export-ban": {
    bg: "bg-purple-500/15",
    text: "text-purple-400",
    label: "Export Ban",
  },
  substitution: {
    bg: "bg-blue-500/15",
    text: "text-blue-400",
    label: "Substitution",
  },
};

function formatEventDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function DemandDestruction({ data }: DemandDestructionProps) {
  return (
    <section className="mt-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">
          Demand Destruction Index
        </h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          The counter-signal &mdash; demand loss eventually caps price upside
        </p>
      </div>

      <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5">
        {/* Top stat: estimated demand loss */}
        <div className="mb-6 flex flex-col items-center rounded-lg bg-[var(--background)] py-4">
          <span className="text-3xl font-bold tabular-nums text-amber-400">
            {data.estimatedDemandLossMbd.toFixed(1)} mb/d
          </span>
          <span className="mt-1.5 text-xs uppercase tracking-wider text-[var(--text-secondary)]">
            Estimated Demand Destruction
          </span>
        </div>

        {/* Event list */}
        <div className="mb-5">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Active Events
          </h3>

          <div className="divide-y divide-[var(--card-border)]">
            {data.events.map((event, index) => {
              const config = categoryConfig[event.category];

              return (
                <div
                  key={`${event.country}-${event.category}-${index}`}
                  className={index === 0 ? "pb-4" : "py-4"}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      {/* Category badge */}
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase leading-none tracking-wider ${config.bg} ${config.text}`}
                      >
                        {config.label}
                      </span>
                      {/* Country */}
                      <span className="font-semibold text-[var(--text-primary)]">
                        {event.country}
                      </span>
                    </div>
                    {/* Date */}
                    <span className="text-xs text-[var(--text-secondary)]">
                      {formatEventDate(event.date)}
                    </span>
                  </div>

                  {/* Event description */}
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-primary)]">
                    {event.event}
                  </p>

                  {/* Impact */}
                  <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                    {event.impact}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Insight box */}
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <p className="text-sm leading-relaxed text-amber-200/80">
            Demand destruction is the market&apos;s natural circuit breaker. When
            consumption drops enough, it removes the price premium &mdash; but the
            structural damage to supply chains persists long after.
          </p>
        </div>

        {/* Last updated */}
        <p className="mt-4 text-right text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
          Updated {data.lastUpdated}
        </p>
      </div>
    </section>
  );
}
