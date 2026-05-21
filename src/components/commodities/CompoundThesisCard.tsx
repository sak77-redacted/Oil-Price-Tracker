"use client";

import type { CompoundThesis } from "@/lib/commodities-types";
import SugarCard from "@/components/sugar/SugarCard";

interface Props {
  thesis: CompoundThesis;
}

export default function CompoundThesisCard({ thesis }: Props) {
  return (
    <SugarCard
      title="Compound Catalyst Thesis — El Niño + Hormuz"
      subtitle="Why the softs at the bottom of the chart may be the most asymmetric long opportunity"
      badge={{ label: "Compound", tone: "amber" }}
      source="CCSR/IRI plume · NOAA · climate.gov"
    >
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {thesis.stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col gap-1 rounded-md border-l-2 border-amber-500/60 bg-zinc-950/40 p-3"
            >
              <div className="text-2xl font-extrabold text-white">
                {stat.value}
              </div>
              <div className="text-[10px] leading-snug text-white/55">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-md border-l-4 border-amber-500 bg-amber-950/30 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300">
            Core thesis
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-white/80">
            {thesis.coreThesis}
          </p>
        </div>
      </div>
    </SugarCard>
  );
}
