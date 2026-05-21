"use client";

import type { CommoditySector, SectorSummary } from "@/lib/commodities-types";

interface Props {
  sectors: SectorSummary[];
}

const SECTOR_ACCENT: Record<CommoditySector, string> = {
  Energy: "border-amber-500/50 bg-amber-950/20",
  "Precious Metals": "border-yellow-400/40 bg-yellow-950/20",
  "Industrial Metals": "border-yellow-500/30 bg-zinc-900/40",
  Grains: "border-lime-500/40 bg-lime-950/20",
  Softs: "border-orange-600/40 bg-orange-950/20",
  Livestock: "border-pink-500/40 bg-pink-950/20",
};

const SECTOR_LABEL_COLOR: Record<CommoditySector, string> = {
  Energy: "text-amber-300",
  "Precious Metals": "text-yellow-200",
  "Industrial Metals": "text-yellow-300",
  Grains: "text-lime-300",
  Softs: "text-orange-300",
  Livestock: "text-pink-300",
};

export default function SectorSummaryGrid({ sectors }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {sectors.map((s) => {
        const isPositive = s.avgYtdPct >= 0;
        return (
          <div
            key={s.sector}
            className={`flex flex-col gap-2 rounded-lg border ${SECTOR_ACCENT[s.sector]} p-3`}
          >
            <div
              className={`text-[10px] font-bold uppercase tracking-[0.18em] ${SECTOR_LABEL_COLOR[s.sector]}`}
            >
              {s.sector}
            </div>
            <div
              className={`text-2xl font-extrabold tabular-nums ${
                isPositive ? "text-emerald-300" : "text-red-300"
              }`}
            >
              {isPositive ? "+" : ""}
              {s.avgYtdPct.toFixed(1)}%
            </div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-white/40">
              {s.constituentCount} contract{s.constituentCount === 1 ? "" : "s"}
            </div>
            <p className="text-[11px] italic leading-snug text-white/65">
              {s.driver}
            </p>
          </div>
        );
      })}
    </div>
  );
}
