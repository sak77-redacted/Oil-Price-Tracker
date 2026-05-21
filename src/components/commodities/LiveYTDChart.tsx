"use client";

import { useState } from "react";

import type { CommodityRow, CommoditySector } from "@/lib/commodities-types";
import SugarCard from "@/components/sugar/SugarCard";

interface Props {
  rows: CommodityRow[];
}

const SECTOR_COLORS: Record<CommoditySector, string> = {
  Energy: "bg-amber-600",
  "Precious Metals": "bg-yellow-300",
  "Industrial Metals": "bg-yellow-500",
  Grains: "bg-lime-600",
  Softs: "bg-orange-700",
  Livestock: "bg-pink-500",
};

const SECTOR_RING: Record<CommoditySector, string> = {
  Energy: "ring-amber-500/60",
  "Precious Metals": "ring-yellow-400/60",
  "Industrial Metals": "ring-yellow-400/40",
  Grains: "ring-lime-500/60",
  Softs: "ring-orange-500/60",
  Livestock: "ring-pink-500/60",
};

function formatPrice(price: number, unit: string): string {
  const decimals = price >= 100 ? 2 : price >= 10 ? 2 : 3;
  return `${price.toFixed(decimals)} ${unit}`;
}

export default function LiveYTDChart({ rows }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);

  // Sort by YTD desc (most positive first → most negative last)
  const sorted = [...rows].sort((a, b) => b.ytdPct - a.ytdPct);
  const absMax = Math.max(...sorted.map((r) => Math.abs(r.ytdPct)), 10);

  // Use as-of date from first live row (or first row)
  const asOfRow = sorted.find((r) => r.live) ?? sorted[0];
  const asOf = asOfRow
    ? new Date(asOfRow.lastUpdated).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  return (
    <SugarCard
      title="Live YTD Performance — Commodity Complex"
      subtitle="Sorted by year-to-date return · Color-coded by sector · Hover for live price"
      source={`Yahoo Finance · As of ${asOf}`}
      footnote="Energy leads on Hormuz disruption. Refined products outperform crude — logistics, not just barrels. Softs at the bottom (cocoa -30%, coffee -22%) are positioned AGAINST the El Niño thesis — that's the asymmetric setup."
    >
      <div className="flex flex-col gap-1.5">
        {sorted.map((row) => {
          const isPositive = row.ytdPct >= 0;
          const widthPct = (Math.abs(row.ytdPct) / absMax) * 50;
          const barColor = SECTOR_COLORS[row.sector];
          const isHovered = hovered === row.symbol;

          return (
            <div
              key={row.symbol}
              className="group relative flex items-center gap-2 text-xs sm:gap-3 sm:text-sm"
              onMouseEnter={() => setHovered(row.symbol)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(row.symbol)}
              onBlur={() => setHovered(null)}
              tabIndex={0}
            >
              <div className="w-24 shrink-0 sm:w-32">
                <div className="truncate font-semibold text-white">
                  {row.name}
                </div>
                <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/40">
                  {row.symbol}
                </div>
              </div>

              <div className="relative h-6 flex-1">
                {/* center zero line */}
                <div
                  className="absolute left-1/2 top-0 h-full w-px bg-zinc-700"
                  aria-hidden
                />
                {/* bar */}
                <div
                  className={`absolute top-1 h-4 rounded-sm ${barColor} ${isHovered ? `ring-2 ${SECTOR_RING[row.sector]}` : ""} ${!row.live ? "opacity-60" : ""}`}
                  style={
                    isPositive
                      ? { left: "50%", width: `${widthPct}%` }
                      : { right: "50%", width: `${widthPct}%` }
                  }
                />
              </div>

              <div
                className={`w-14 shrink-0 text-right text-sm font-bold tabular-nums sm:w-16 ${
                  isPositive ? "text-emerald-300" : "text-red-300"
                }`}
              >
                {isPositive ? "+" : ""}
                {row.ytdPct.toFixed(1)}%
              </div>

              {/* Hover tooltip */}
              {isHovered && (
                <div className="pointer-events-none absolute right-16 top-full z-20 mt-1 w-64 rounded-md border border-zinc-700 bg-zinc-950/95 p-3 text-[11px] shadow-lg backdrop-blur sm:right-20">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="font-bold text-white">{row.name}</span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-amber-200">
                      {row.sector}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-white/70">
                    <span>Current</span>
                    <span className="font-mono tabular-nums text-white">
                      {formatPrice(row.currentPrice, row.priceUnit)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-white/70">
                    <span>Year start</span>
                    <span className="font-mono tabular-nums text-white/60">
                      {formatPrice(row.yearStartPrice, row.priceUnit)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-white/70">
                    <span>5-day Δ</span>
                    <span
                      className={`font-mono tabular-nums ${
                        row.fiveDayChangePct >= 0 ? "text-emerald-300" : "text-red-300"
                      }`}
                    >
                      {row.fiveDayChangePct >= 0 ? "+" : ""}
                      {row.fiveDayChangePct.toFixed(2)}%
                    </span>
                  </div>
                  {!row.live && (
                    <div className="mt-2 border-t border-zinc-800 pt-1 text-[10px] text-amber-300/80">
                      Fallback value (Yahoo unavailable)
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sector legend */}
      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 border-t border-zinc-800 pt-4 text-[11px] text-white/60">
        {(
          [
            "Energy",
            "Precious Metals",
            "Industrial Metals",
            "Grains",
            "Softs",
            "Livestock",
          ] as CommoditySector[]
        ).map((sector) => (
          <div key={sector} className="flex items-center gap-1.5">
            <span
              className={`h-3 w-3 rounded-sm ${SECTOR_COLORS[sector]}`}
              aria-hidden
            />
            <span>{sector}</span>
          </div>
        ))}
      </div>
    </SugarCard>
  );
}
