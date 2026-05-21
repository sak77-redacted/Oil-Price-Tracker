"use client";

import type {
  CommodityRow,
  ExposureLevel,
  ExposureRow,
  PricedInState,
} from "@/lib/commodities-types";
import SugarCard from "@/components/sugar/SugarCard";

interface Props {
  rows: ExposureRow[];
  liveCommodities: CommodityRow[];
}

const RISK_COLOR: Record<ExposureLevel, string> = {
  "Very High": "text-red-300 font-bold",
  High: "text-red-300 font-semibold",
  Moderate: "text-amber-200",
  "Mixed (US neutral)": "text-amber-200",
  "Negative (ARG benefits)": "text-emerald-300",
};

const PRICED_IN_COLOR: Record<PricedInState, string> = {
  "No — opposite direction": "text-red-300 font-bold",
  No: "text-red-300 font-semibold",
  Partially: "text-amber-200",
  "Yes — running": "text-emerald-300/70",
  "Mostly priced": "text-emerald-300/70",
};

export default function ExposureMappingTable({ rows, liveCommodities }: Props) {
  // Build symbol → live YTD% map
  const livePctBySymbol = new Map<string, number>();
  for (const row of liveCommodities) {
    livePctBySymbol.set(row.symbol, row.ytdPct);
  }

  return (
    <SugarCard
      title="Compound Exposure Mapping"
      subtitle="Crops ranked by combined El Niño weather risk AND fertilizer cost transmission, vs. how much is already priced in"
      badge={{ label: "8 crops", tone: "zinc" }}
      footnote="Priority-1 rows (Cocoa / Coffee / Sugar) are the asymmetric setup — high El Niño risk + market positioned the WRONG direction. YTD values for live-tracked symbols pull from Yahoo; Rice / Palm Oil show the static May 12 labels."
    >
      <div className="-mx-2 overflow-x-auto">
        <table className="w-full text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-left text-[10px] uppercase tracking-[0.14em] text-white/55">
              <th className="px-2 py-2">Crop</th>
              <th className="px-2 py-2">El Niño Risk</th>
              <th className="px-2 py-2 hidden sm:table-cell">Fertilizer Risk</th>
              <th className="px-2 py-2 text-right">YTD 2026</th>
              <th className="px-2 py-2 hidden md:table-cell">Priced In?</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const liveYtd =
                row.symbol !== undefined
                  ? livePctBySymbol.get(row.symbol)
                  : undefined;
              const ytdDisplay =
                liveYtd !== undefined
                  ? `${liveYtd >= 0 ? "+" : ""}${liveYtd.toFixed(1)}%`
                  : row.ytdLabel;
              const ytdColor =
                liveYtd !== undefined
                  ? liveYtd >= 0
                    ? "text-emerald-300"
                    : "text-red-300"
                  : row.ytdLabel.startsWith("-")
                    ? "text-red-300"
                    : row.ytdLabel.startsWith("+")
                      ? "text-emerald-300"
                      : "text-white/60";
              const priorityClass =
                row.priority === 1
                  ? "border-l-4 border-amber-500/70 bg-amber-950/20"
                  : row.priority === 2
                    ? "border-l-2 border-amber-700/40"
                    : "";

              return (
                <tr
                  key={row.crop}
                  className={`border-b border-zinc-900/60 transition-colors hover:bg-zinc-900/40 ${priorityClass}`}
                >
                  <td className="px-2 py-2 font-semibold text-white">
                    {row.crop}
                    {row.priority === 1 && (
                      <span className="ml-2 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-amber-200">
                        Priority
                      </span>
                    )}
                    <div className="text-[10px] text-white/40 sm:hidden">
                      Fert: {row.fertilizerRisk}
                    </div>
                  </td>
                  <td className={`px-2 py-2 ${RISK_COLOR[row.elNinoRisk]}`}>
                    {row.elNinoRisk}
                  </td>
                  <td
                    className={`hidden px-2 py-2 sm:table-cell ${RISK_COLOR[row.fertilizerRisk]}`}
                  >
                    {row.fertilizerRisk}
                  </td>
                  <td
                    className={`px-2 py-2 text-right font-mono font-bold tabular-nums ${ytdColor}`}
                  >
                    {ytdDisplay}
                    {liveYtd !== undefined && (
                      <span
                        className="ml-1 text-[9px] text-emerald-400/60"
                        title="Live from Yahoo"
                      >
                        ●
                      </span>
                    )}
                  </td>
                  <td
                    className={`hidden px-2 py-2 md:table-cell ${PRICED_IN_COLOR[row.pricedIn]}`}
                  >
                    {row.pricedIn}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile: priced-in repeat row */}
      <div className="mt-3 grid gap-1 text-[11px] md:hidden">
        <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">
          Priced-in summary
        </p>
        {rows.map((row) => (
          <div key={row.crop} className="flex items-center justify-between gap-2">
            <span className="text-white/70">{row.crop}</span>
            <span className={PRICED_IN_COLOR[row.pricedIn]}>{row.pricedIn}</span>
          </div>
        ))}
      </div>
    </SugarCard>
  );
}
