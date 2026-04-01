"use client";

import type { InflationThresholdData } from "@/lib/types";

interface InflationThresholdProps {
  data: InflationThresholdData;
  currentOilPrice?: number;
}

const riskColors: Record<InflationThresholdData["recessionRisk"], string> = {
  low: "var(--success)",
  moderate: "var(--warning)",
  high: "#f59e0b",
  critical: "var(--danger)",
};

const riskLabels: Record<InflationThresholdData["recessionRisk"], string> = {
  low: "Low",
  moderate: "Moderate",
  high: "High",
  critical: "Critical",
};

function StatCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col rounded-lg border border-[var(--card-border)] bg-[var(--background)] p-4">
      <span className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
        {title}
      </span>
      {children}
    </div>
  );
}

function ChainStep({
  text,
  index,
  total,
}: {
  text: string;
  index: number;
  total: number;
}) {
  // Gradient from amber to red across the chain steps
  const progress = total > 1 ? index / (total - 1) : 0;
  // Interpolate from amber (#f59e0b) to red (#ef4444)
  const r = Math.round(245 + (239 - 245) * progress);
  const g = Math.round(158 + (68 - 158) * progress);
  const b = Math.round(11 + (68 - 11) * progress);
  const borderColor = `rgb(${r}, ${g}, ${b})`;
  const bgColor = `rgba(${r}, ${g}, ${b}, 0.08)`;

  return (
    <div className="flex items-center">
      <div
        className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border px-3 py-2.5"
        style={{ borderColor, backgroundColor: bgColor }}
      >
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
          style={{ backgroundColor: borderColor }}
        >
          {index + 1}
        </span>
        <span className="text-xs font-medium leading-snug text-[var(--text-primary)]">
          {text}
        </span>
      </div>
      {index < total - 1 && (
        <>
          {/* Horizontal arrow for desktop */}
          <span className="hidden shrink-0 px-1 text-sm text-[var(--text-secondary)] md:inline">
            →
          </span>
          {/* Vertical arrow for mobile — shown between rows */}
          <span className="inline shrink-0 text-sm text-[var(--text-secondary)] md:hidden" />
        </>
      )}
    </div>
  );
}

function MobileArrow() {
  return (
    <div className="flex justify-center py-0.5 md:hidden">
      <span className="text-sm text-[var(--text-secondary)]">↓</span>
    </div>
  );
}

export default function InflationThreshold({
  data,
  currentOilPrice,
}: InflationThresholdProps) {
  const oilPrice = currentOilPrice ?? data.marchAvgOilPrice;
  const aboveThreshold = oilPrice >= data.thresholdPrice;
  const oilColor = aboveThreshold ? "var(--danger)" : "var(--success)";
  const riskColor = riskColors[data.recessionRisk];

  return (
    <section className="mt-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">
          Inflation Threshold
        </h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Oil → CPI → Fed → Recession: the macro transmission chain
        </p>
      </div>

      <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5">
        {/* Top row: 3 stat boxes */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Oil Price */}
          <StatCard title="Oil Price">
            <span
              className="text-2xl font-bold tabular-nums"
              style={{ color: oilColor }}
            >
              ${oilPrice.toFixed(0)}
            </span>
            <span
              className="mt-1 text-xs"
              style={{
                color: aboveThreshold ? "var(--danger)" : "var(--text-secondary)",
              }}
            >
              {aboveThreshold ? "⚠ " : ""}Danger zone: &gt;${data.thresholdPrice}
            </span>
            {currentOilPrice && currentOilPrice !== data.marchAvgOilPrice && (
              <span className="mt-0.5 text-[10px] text-[var(--text-secondary)]">
                Mar avg: ${data.marchAvgOilPrice}
              </span>
            )}
          </StatCard>

          {/* Projected CPI */}
          <StatCard title="Projected CPI">
            <span className="text-2xl font-bold tabular-nums text-[#f59e0b]">
              {data.projectedCPILow}% – {data.projectedCPIHigh}%
            </span>
            <span className="mt-1 text-xs text-[var(--text-secondary)]">
              Pre-crisis: {data.currentCPI}%
            </span>
          </StatCard>

          {/* Recession Risk */}
          <StatCard title="Recession Risk">
            <div className="flex items-center gap-2">
              <span
                className="text-2xl font-bold"
                style={{ color: riskColor }}
              >
                {riskLabels[data.recessionRisk]}
              </span>
            </div>
            {data.fedConstrained && (
              <span className="mt-1.5 inline-flex w-fit items-center gap-1 rounded-full border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--danger)]">
                Fed Constrained
              </span>
            )}
          </StatCard>
        </div>

        {/* Transmission Chain */}
        <div className="mb-6">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Transmission Chain
          </h3>

          {/* Desktop: horizontal flow */}
          <div className="hidden md:flex md:items-center md:gap-0">
            {data.transmissionChain.map((step, i) => (
              <ChainStep
                key={i}
                text={step}
                index={i}
                total={data.transmissionChain.length}
              />
            ))}
          </div>

          {/* Mobile: vertical flow */}
          <div className="flex flex-col md:hidden">
            {data.transmissionChain.map((step, i) => (
              <div key={i}>
                <ChainStep
                  text={step}
                  index={i}
                  total={data.transmissionChain.length}
                />
                {i < data.transmissionChain.length - 1 && <MobileArrow />}
              </div>
            ))}
          </div>
        </div>

        {/* Quote callout */}
        <div className="rounded-lg border border-[var(--danger)]/20 bg-[var(--danger)]/5 px-4 py-3">
          <p className="text-sm italic leading-relaxed text-[var(--text-secondary)]">
            &ldquo;{data.notes}&rdquo;
          </p>
          <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--danger)]/70">
            — MB Commodity Corner
          </p>
        </div>

        {/* Last updated */}
        <p className="mt-4 text-[10px] text-[var(--text-secondary)]">
          Last updated: {data.lastUpdated}
        </p>
      </div>
    </section>
  );
}
