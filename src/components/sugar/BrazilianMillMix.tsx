"use client";

import type { BrazilianMillMixData } from "@/lib/sugar-types";
import SugarCard from "./SugarCard";

interface Props {
  data: BrazilianMillMixData;
}

export default function BrazilianMillMix({ data }: Props) {
  const sugarPct = data.brazilCenterSouthSugarMixPct;
  const ethanolPct = 100 - sugarPct;
  // Higher sugar share = more sugar to market (bearish near-term), but mix flips fast at ethanol parity.

  return (
    <SugarCard
      title="Brazilian Mill Mix + India Supply"
      subtitle="Mix sits at sugar-ethanol parity — mills pivot fast if energy prices stay elevated"
      badge={{ label: `${sugarPct.toFixed(2)}% sugar`, tone: "emerald" }}
      source="CONAB · UNICA · ISMA"
      footnote="Mills run profit-max — every 1% mix shift to ethanol removes ~450 kt sugar. If Brent stays above $90, the mix flips to ethanol-favored and removes 5–7 MMT from global S&D."
    >
      <div className="flex flex-col gap-4">
        {/* Mix gauge */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">
            Brazil Center-South Mix · {data.brazilCenterSouthOutputMMT} MMT 2025/26
          </div>
          <div className="mt-2 flex h-7 w-full overflow-hidden rounded-lg ring-1 ring-zinc-800">
            <div
              className="flex items-center justify-center bg-emerald-500/40 text-[11px] font-bold text-emerald-50 tabular-nums"
              style={{ width: `${sugarPct}%` }}
            >
              {sugarPct.toFixed(1)}% sugar
            </div>
            <div
              className="flex items-center justify-center bg-amber-500/30 text-[11px] font-bold text-amber-50 tabular-nums"
              style={{ width: `${ethanolPct}%` }}
            >
              {ethanolPct.toFixed(1)}% ethanol
            </div>
          </div>
          <div className="mt-2 text-[11px] italic text-white/55">{data.brazilOutputNote}</div>
        </div>

        {/* India sub-stats */}
        <div className="grid gap-3 sm:grid-cols-3">
          <SubStat label="India Output" value={`${data.indiaOutputMMT} MMT`} context={`+${data.indiaOutputYoYPct}% YoY`} />
          <SubStat
            label="Ethanol Diversion"
            value={`${data.indiaEthanolDiversionFromMMT} → ${data.indiaEthanolDiversionToMMT}`}
            context="MMT — diversion cut"
          />
          <SubStat label="Net Effect" value="+supply" context="Bearish near-term, fragile if El Niño fires" />
        </div>
      </div>
    </SugarCard>
  );
}

function SubStat({ label, value, context }: { label: string; value: string; context?: string }) {
  return (
    <div className="rounded-lg border border-zinc-800/70 bg-zinc-900/40 p-3">
      <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">{label}</div>
      <div className="mt-1 text-lg font-bold tabular-nums text-white">{value}</div>
      {context && <div className="mt-1 text-[11px] text-white/55">{context}</div>}
    </div>
  );
}
