"use client";

import type { CatalystTimelineEntry, CatalystTier } from "@/lib/sugar-types";

interface Props {
  events: CatalystTimelineEntry[];
}

const tierStyle: Record<CatalystTier, { dot: string; ring: string; label: string }> = {
  1: { dot: "bg-red-400",    ring: "ring-red-400/40",    label: "TIER 1" },
  2: { dot: "bg-amber-400",  ring: "ring-amber-400/40",  label: "TIER 2" },
  3: { dot: "bg-zinc-400",   ring: "ring-zinc-400/30",   label: "TIER 3" },
};

export default function CatalystTimeline({ events }: Props) {
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white">
          Catalyst Timeline
        </h3>
        <span className="text-[10px] uppercase tracking-[0.16em] text-white/45">
          Watch-this-week → multi-month
        </span>
      </div>

      {/* Horizontal scroll on mobile, grid on desktop */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((evt) => {
          const t = tierStyle[evt.tier];
          return (
            <div
              key={`${evt.date}-${evt.event}`}
              className="flex items-start gap-3 rounded-lg border border-zinc-800/70 bg-zinc-900/40 p-3"
            >
              <span
                className={`mt-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full ring-2 ${t.dot} ${t.ring}`}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
                  {evt.date}
                </div>
                <div className="mt-0.5 text-sm font-semibold leading-snug text-white">
                  {evt.event}
                </div>
                <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
                  {t.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
