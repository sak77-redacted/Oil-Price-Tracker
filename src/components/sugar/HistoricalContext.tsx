"use client";

import type { HistoricalContextEntry } from "@/lib/sugar-types";
import SugarCard from "./SugarCard";

interface Props {
  rows: HistoricalContextEntry[];
}

function rowTone(row: HistoricalContextEntry): string {
  if (row.current) return "bg-emerald-500/10 text-emerald-100";
  if (row.highlight) return "bg-amber-500/8 text-amber-100";
  return "";
}

export default function HistoricalContext({ rows }: Props) {
  return (
    <SugarCard
      title="20-Year Historical Context"
      subtitle="Range 9¢–36¢ · Median ~16¢ · Today 15¢"
      badge={{ label: "Multi-year low", tone: "emerald" }}
      source="ICE futures · USDA · NCDEX"
      footnote="Every prior El Niño-driven spike (2010-11, 2016-17, 2023) saw sugar reprice from sub-15¢ to 24–36¢ in 12–18 months. Today's setup is the same — but options pricing $50 tail at 0.05 delta."
    >
      <div className="overflow-x-auto -mx-2 px-2">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800/70 text-[10px] uppercase tracking-[0.16em] text-white/45">
              <th className="py-2 pr-3 font-semibold">Year / Period</th>
              <th className="py-2 pr-3 font-semibold">Event</th>
              <th className="py-2 pr-3 font-semibold text-right">Price (¢/lb)</th>
              <th className="py-2 pl-3 font-semibold text-right">Contract ($)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={`${r.year}-${r.event}`}
                className={`border-b border-zinc-800/40 last:border-0 ${rowTone(r)}`}
              >
                <td className="py-2.5 pr-3 align-top">
                  <span className={`font-semibold ${r.current ? "text-emerald-200" : "text-white"}`}>
                    {r.year}
                  </span>
                  {r.current && (
                    <span className="ml-2 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-emerald-200">
                      Today
                    </span>
                  )}
                </td>
                <td className="py-2.5 pr-3 align-top text-white/75">{r.event}</td>
                <td className="py-2.5 pr-3 align-top text-right tabular-nums">
                  {r.priceCents}¢
                </td>
                <td className="py-2.5 pl-3 align-top text-right tabular-nums text-white/65">
                  ${r.contractDollars.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SugarCard>
  );
}
