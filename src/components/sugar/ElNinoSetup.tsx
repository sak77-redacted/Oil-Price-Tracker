"use client";

import type { ElNinoSetupData } from "@/lib/sugar-types";
import SugarCard from "./SugarCard";

interface Props {
  data: ElNinoSetupData;
}

export default function ElNinoSetup({ data }: Props) {
  return (
    <SugarCard
      title="El Niño Setup"
      subtitle="Atmospheric coupling engaging — model consensus locked"
      badge={{ label: `${data.probability}% probability`, tone: "emerald" }}
      source="CCSR / IRI plume · NOAA"
      footnote="Atmospheric coupling engaging — when NOAA's strong-event probability runs at 2-in-3, sugar's three biggest producers (Brazil, India, Thailand) carry simultaneous yield risk."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-zinc-800/70 bg-zinc-900/40 p-3">
          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">
            Hero — El Niño Probability
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tabular-nums text-emerald-300">
              {data.probability}%
            </span>
            <span className="text-xs text-white/55">{data.probabilityWindow}</span>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-1">
          <SubStat
            label="Persistence"
            value={`${data.persistencePct}%`}
            context={data.persistenceWindow}
          />
          <SubStat
            label="Strong-event odds"
            value={data.strongEventOdds}
            context={data.strongEventWindow}
          />
        </div>

        <SubStat
          label="Niño 3.4 SST"
          value={`+${data.nino34Anomaly.toFixed(1)}°C`}
          context="Anomaly vs climatology"
        />
        <SubStat
          label="SOI Index"
          value={data.soiIndex.toFixed(1)}
          context={data.soiNote}
        />
      </div>
    </SugarCard>
  );
}

function SubStat({ label, value, context }: { label: string; value: string; context?: string }) {
  return (
    <div className="rounded-lg border border-zinc-800/70 bg-zinc-900/40 p-3">
      <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-xl font-bold tabular-nums text-white">{value}</span>
      </div>
      {context && <div className="mt-1 text-[11px] text-white/55">{context}</div>}
    </div>
  );
}
