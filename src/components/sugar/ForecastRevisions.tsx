"use client";

import type { ForecastRevisionEntry } from "@/lib/sugar-types";
import SugarCard from "./SugarCard";

interface Props {
  revisions: ForecastRevisionEntry[];
}

function directionTone(direction: string): { text: string; bg: string; label: string } {
  if (direction === "deficit flip") {
    return { text: "text-amber-200", bg: "bg-amber-500/15 ring-amber-500/40", label: "DEFICIT FLIP" };
  }
  if (direction === "tightening") {
    return { text: "text-emerald-200", bg: "bg-emerald-500/15 ring-emerald-500/40", label: "TIGHTENING" };
  }
  return { text: "text-white/70", bg: "bg-zinc-500/15 ring-zinc-500/40", label: direction.toUpperCase() };
}

export default function ForecastRevisions({ revisions }: Props) {
  return (
    <SugarCard
      title="Forecast Revisions"
      subtitle="Surplus narrative breaking in real time"
      badge={{ label: "Surplus → Deficit", tone: "amber" }}
      source="Czarnikow · Green Pool · StoneX"
      footnote="When three independent crops desks revise simultaneously, the prior consensus (2026/27 surplus) is dead. Green Pool flipped the sign — surplus to deficit in a single update."
    >
      <div className="overflow-x-auto -mx-2 px-2">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800/70 text-[10px] uppercase tracking-[0.16em] text-white/45">
              <th className="py-2 pr-3 font-semibold">Source</th>
              <th className="py-2 pr-3 font-semibold">Metric</th>
              <th className="py-2 pr-3 font-semibold">From → To</th>
              <th className="py-2 pl-3 font-semibold text-right">Direction</th>
            </tr>
          </thead>
          <tbody>
            {revisions.map((r) => {
              const tone = directionTone(r.direction);
              return (
                <tr key={r.source} className="border-b border-zinc-800/40 last:border-0">
                  <td className="py-3 pr-3 align-top">
                    <span className="font-semibold text-white">{r.source}</span>
                  </td>
                  <td className="py-3 pr-3 align-top text-white/75">{r.metric}</td>
                  <td className="py-3 pr-3 align-top tabular-nums text-white/75">
                    <span className="text-white/55">{r.from}</span>
                    <span className="mx-1.5 text-white/30">→</span>
                    <span className={tone.text}>{r.to}</span>
                  </td>
                  <td className="py-3 pl-3 align-top text-right">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ring-1 ${tone.bg} ${tone.text}`}
                    >
                      {tone.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </SugarCard>
  );
}
