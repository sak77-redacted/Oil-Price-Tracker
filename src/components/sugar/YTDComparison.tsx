"use client";

import type { YTDPerformanceEntry } from "@/lib/sugar-types";
import SugarCard from "./SugarCard";

interface Props {
  rows: YTDPerformanceEntry[];
}

export default function YTDComparison({ rows }: Props) {
  // Compute symmetric max for shared horizontal scale (-30 .. +30)
  const absMax = Math.max(...rows.map((r) => Math.abs(r.ytd)), 10);

  return (
    <SugarCard
      title="YTD Performance — Softs vs Grains"
      subtitle="Dispersion opportunity — softs moved AGAINST the El Niño thesis"
      badge={{ label: "Sugar -7%", tone: "emerald" }}
      source="Bloomberg / ICE / CME · 2026 YTD"
      footnote="Grains priced ~10pp of El Niño risk; softs (sugar, coffee, cocoa) priced -10 to -30. The mispricing is the trade — softs need to revert AND El Niño needs to fire. Sugar at the cleanest entry of the bunch."
    >
      <div className="flex flex-col gap-2">
        {rows.map((r) => {
          const isPositive = r.ytd > 0;
          const widthPct = (Math.abs(r.ytd) / absMax) * 50; // each side gets 50%
          const tone =
            r.highlight
              ? "bg-emerald-400/70 ring-1 ring-emerald-300/40"
              : isPositive
                ? "bg-zinc-500/40"
                : "bg-red-500/40";
          return (
            <div key={r.commodity} className="flex items-center gap-3 text-sm">
              <div className="w-24 shrink-0">
                <div className={`font-semibold ${r.highlight ? "text-emerald-200" : "text-white"}`}>
                  {r.commodity}
                </div>
                <div className="text-[10px] uppercase tracking-[0.14em] text-white/35">
                  {r.sector}
                </div>
              </div>
              <div className="relative h-5 flex-1">
                {/* center line */}
                <div className="absolute left-1/2 top-0 h-full w-px bg-zinc-700" aria-hidden />
                {/* bar */}
                <div
                  className={`absolute top-0.5 h-4 rounded-sm ${tone}`}
                  style={
                    isPositive
                      ? { left: "50%", width: `${widthPct}%` }
                      : { right: "50%", width: `${widthPct}%` }
                  }
                />
              </div>
              <div
                className={`w-14 shrink-0 text-right text-sm font-bold tabular-nums ${
                  r.highlight
                    ? "text-emerald-200"
                    : isPositive
                      ? "text-white/70"
                      : "text-red-300"
                }`}
              >
                {r.ytd > 0 ? "+" : ""}
                {r.ytd}%
              </div>
            </div>
          );
        })}
      </div>
    </SugarCard>
  );
}
