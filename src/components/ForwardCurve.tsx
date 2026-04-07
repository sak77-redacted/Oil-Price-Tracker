"use client";

import type { ForwardCurveData } from "@/lib/types";

interface ForwardCurveProps {
  data: ForwardCurveData;
}

function getStructureLabel(
  structure: ForwardCurveData["structure"],
): { label: string; color: string } {
  switch (structure) {
    case "backwardation":
      return { label: "STEEP BACKWARDATION", color: "#ef4444" };
    case "contango":
      return { label: "CONTANGO", color: "#22c55e" };
    case "flat":
      return { label: "FLAT", color: "#eab308" };
  }
}

export default function ForwardCurve({ data }: ForwardCurveProps) {
  const { label, color } = getStructureLabel(data.structure);

  const lastPoint = data.curve[data.curve.length - 1];
  const totalDiff = Math.abs(
    Math.round((data.promptPrice - lastPoint.price) * 100) / 100,
  );

  // For bar heights: normalize prices so prompt = 100% and lowest = some minimum
  const prices = data.curve.map((p) => p.price);
  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);
  const priceRange = maxPrice - minPrice || 1;

  // Bar height as percentage: min bar is 30%, max is 100%
  function barHeight(price: number): number {
    return 30 + ((price - minPrice) / priceRange) * 70;
  }

  // Bar color: prompt month is red/amber, progressively greener as they drop
  function barColor(index: number): string {
    if (index === 0) return data.structure === "backwardation" ? "#ef4444" : "#22c55e";
    const ratio = index / (data.curve.length - 1);
    if (data.structure === "backwardation") {
      // Red to green
      const r = Math.round(239 - ratio * 205);
      const g = Math.round(68 + ratio * 129);
      const b = Math.round(68 - ratio * 4);
      return `rgb(${r},${g},${b})`;
    }
    // Contango: green to red
    const r = Math.round(34 + ratio * 205);
    const g = Math.round(197 - ratio * 129);
    const b = Math.round(94 - ratio * 30);
    return `rgb(${r},${g},${b})`;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card)]">
      {/* Header */}
      <div className="border-b border-[var(--card-border)] px-5 py-3">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">
          Forward Curve Structure
        </h2>
        <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
          Is the market betting on crisis resolution?
        </p>
      </div>

      {/* Structure label + summary */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
            Structure:
          </span>
          <span
            className="text-sm font-bold uppercase tracking-wide"
            style={{ color }}
          >
            {label}
          </span>
        </div>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Prompt{" "}
          <span className="font-semibold text-[var(--text-primary)]">
            ${data.promptPrice.toFixed(0)}
          </span>{" "}
          vs {lastPoint.month}{" "}
          <span className="font-semibold text-[var(--text-primary)]">
            ${lastPoint.price.toFixed(0)}
          </span>{" "}
          &mdash; market pricing{" "}
          <span className="font-semibold" style={{ color }}>
            ${totalDiff}
          </span>{" "}
          of crisis premium
        </p>
      </div>

      {/* Bar chart */}
      <div className="px-5 pb-4">
        <div className="flex items-end gap-1 sm:gap-2" style={{ height: 160 }}>
          {data.curve.map((point, i) => (
            <div
              key={point.month}
              className="flex flex-1 flex-col items-center justify-end"
              style={{ height: "100%" }}
            >
              {/* Price label above bar */}
              <span className="mb-1 text-[10px] font-semibold tabular-nums text-[var(--text-primary)] sm:text-xs">
                ${point.price.toFixed(0)}
              </span>
              {/* Bar */}
              <div
                className="w-full rounded-t"
                style={{
                  height: `${barHeight(point.price)}%`,
                  backgroundColor: barColor(i),
                  minWidth: 16,
                  opacity: 0.85,
                }}
              />
              {/* Month label below bar */}
              <span className="mt-1.5 text-[9px] text-[var(--text-secondary)] sm:text-[10px]">
                {point.month.split(" ")[0]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Contrarian insight + data source note */}
      <div className="border-t border-[var(--card-border)] px-5 py-3 space-y-2">
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          <span className="font-semibold text-amber-400">Contrarian signal:</span>{" "}
          Forward curve prices resolution by Q3. Sparta research disagrees
          &mdash; European product supply cliff suggests crisis duration is
          being underpriced.
        </p>
        {data.liveMonths != null && (
          <p className="text-[10px] text-[var(--text-secondary)] opacity-70">
            {data.liveMonths > 0
              ? `${data.liveMonths}/8 forward months from live Yahoo Finance data, rest simulated from prompt price.`
              : "Forward months simulated from prompt price (live contract data unavailable)."}
          </p>
        )}
      </div>
    </div>
  );
}
