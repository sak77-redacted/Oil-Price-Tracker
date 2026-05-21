"use client";

import type { RestartFlywheel as RestartFlywheelData } from "@/lib/types";

interface RestartFlywheelProps {
  data: RestartFlywheelData;
}

/**
 * Restart Flywheel — physical-process restart mechanics that bound the trade
 * even if diplomatic resolution arrives. Per Morgan Downey (Macrovoices Ep.
 * 533, May 21, 2026): tanker re-positioning + shut-in well restart + refinery
 * cycles + Qatar LNG repair + risk-premium decay each impose their own
 * minimum durations. Renders as a 5-row mechanics table inside RecoveryClock.
 */
export default function RestartFlywheel({ data }: RestartFlywheelProps) {
  return (
    <div className="mt-6 rounded-lg border border-amber-500/30 bg-black/30 p-4">
      {/* Header */}
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-amber-500/15 pb-2">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300/90">
          {data.title}
        </h3>
        <span className="text-[10px] italic text-amber-200/55">
          {data.subtitle}
        </span>
      </div>

      {/* Mechanics table */}
      <div className="mt-3 overflow-hidden rounded border border-white/10">
        <div className="grid grid-cols-[auto_1fr_auto] gap-x-3 gap-y-0 bg-black/20 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-white/55">
          <span>Stage</span>
          <span>Mechanism</span>
          <span className="text-right">Duration</span>
        </div>
        {data.stages.map((s, i) => {
          const isLast = i === data.stages.length - 1;
          // Highlight the long-tail stages (LNG, risk premium) in amber
          const isLongTail = /year/i.test(s.duration);
          return (
            <div
              key={s.stage}
              className={`grid grid-cols-[auto_1fr_auto] items-baseline gap-x-3 px-3 py-2.5 text-[11px] ${
                isLast ? "" : "border-b border-white/5"
              }`}
            >
              <span className="font-bold tabular-nums text-white/45">
                {s.stage}
              </span>
              <span className="text-white/85">
                <span className="block font-semibold text-white">
                  {s.mechanism}
                </span>
                <span className="mt-0.5 block text-[10px] leading-relaxed text-white/55">
                  {s.detail}
                </span>
              </span>
              <span
                className={`text-right text-[11px] font-bold tabular-nums ${
                  isLongTail ? "text-amber-300" : "text-white/85"
                }`}
              >
                {s.duration}
              </span>
            </div>
          );
        })}
      </div>

      {/* Bottom conclusion callout */}
      <div className="mt-3 rounded border border-amber-500/40 bg-amber-500/10 px-3 py-2.5">
        <p className="text-[11px] font-medium leading-relaxed text-amber-200/95">
          <span className="font-bold uppercase tracking-wider text-amber-300">
            Conclusion:
          </span>{" "}
          {data.conclusion}
        </p>
      </div>

      <p className="mt-2 text-[10px] italic text-white/45">
        — {data.attribution} · {data.context}
      </p>
    </div>
  );
}
