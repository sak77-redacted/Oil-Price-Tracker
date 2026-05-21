"use client";

import type { KeyObservation } from "@/lib/commodities-types";

interface Props {
  observations: KeyObservation[];
}

export default function KeyObservations({ observations }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {observations.map((obs) => (
        <div
          key={obs.headline}
          className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-4"
        >
          <h4 className="text-sm font-bold text-amber-200">{obs.headline}</h4>
          <p className="mt-2 text-[13px] leading-relaxed text-white/70">
            {obs.body}
          </p>
        </div>
      ))}
    </div>
  );
}
