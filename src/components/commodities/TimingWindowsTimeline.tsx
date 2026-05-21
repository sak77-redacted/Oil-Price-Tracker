"use client";

import type { TimingWindow } from "@/lib/commodities-types";
import SugarCard from "@/components/sugar/SugarCard";

interface Props {
  windows: TimingWindow[];
}

const TIER_DOT: Record<1 | 2 | 3, string> = {
  1: "bg-red-500",
  2: "bg-amber-500",
  3: "bg-lime-500",
};

const TIER_LABEL: Record<1 | 2 | 3, string> = {
  1: "High impact",
  2: "Medium impact",
  3: "Lower impact",
};

export default function TimingWindowsTimeline({ windows }: Props) {
  return (
    <SugarCard
      title="Timing Windows — When Impacts Hit the Tape"
      subtitle="Catalyst calendar for the El Niño + Hormuz compound thesis"
      source="NOAA · ABARES · CONAB · climate.gov"
    >
      <div className="relative flex flex-col gap-4">
        {/* Vertical line */}
        <div
          className="absolute left-3 top-2 bottom-2 w-px bg-zinc-800"
          aria-hidden
        />

        {windows.map((w) => (
          <div key={w.event} className="relative flex gap-4 pl-10">
            {/* Dot */}
            <div
              className={`absolute left-1 top-1.5 h-4 w-4 rounded-full ${TIER_DOT[w.tier]} ring-2 ring-zinc-950`}
              aria-hidden
            />
            <div className="flex-1">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300">
                  {w.dateRange}
                </span>
                <span
                  className={`text-[9px] uppercase tracking-[0.16em] text-white/40`}
                  title={TIER_LABEL[w.tier]}
                >
                  T{w.tier} · {TIER_LABEL[w.tier]}
                </span>
              </div>
              <h4 className="mt-1 text-sm font-bold text-white">{w.event}</h4>
              <p className="mt-1 text-[12px] leading-relaxed text-white/70">
                {w.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </SugarCard>
  );
}
