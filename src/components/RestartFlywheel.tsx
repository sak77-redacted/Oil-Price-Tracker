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

      {/* Implied Outage Recovery Curve — Downey May 24 / Polymarket */}
      {data.outageRecoveryCurve && (() => {
        const curve = data.outageRecoveryCurve;
        const peak = curve.currentOutageMbd;
        return (
          <div className="mt-4 rounded border border-amber-500/30 bg-black/40 p-3">
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300/90">
                {curve.title}
              </span>
              <span className="text-[10px] italic text-amber-200/55">
                Production {curve.preCrisisProductionMbd} → {curve.currentProductionMbd} mb/d
              </span>
            </div>

            {/* Trajectory bars */}
            <div className="space-y-1.5">
              {curve.trajectory.map((p) => {
                const outagePct = Math.min(100, (p.outageMbd / peak) * 100);
                const recoveredPct = Math.min(100, (p.recoveredMbd / peak) * 100);
                const isToday = p.label.toLowerCase() === "today";
                return (
                  <div
                    key={p.date}
                    className="grid grid-cols-[110px_auto_1fr_auto] items-center gap-x-2.5 text-[11px]"
                  >
                    <span
                      className={`font-semibold ${
                        isToday ? "text-amber-200" : "text-white/80"
                      }`}
                    >
                      {p.label}
                    </span>
                    <span
                      className={`tabular-nums ${
                        isToday ? "text-amber-200" : "text-white/75"
                      }`}
                    >
                      {p.outageMbd} mb/d outage
                    </span>
                    {/* Stacked bar: outage (amber/red) | recovered (emerald) */}
                    <div className="flex h-2 w-full overflow-hidden rounded-sm bg-white/5">
                      <div
                        className={`h-full ${
                          isToday ? "bg-red-500/70" : "bg-amber-400/70"
                        }`}
                        style={{ width: `${outagePct}%` }}
                      />
                      <div
                        className="h-full bg-emerald-500/60"
                        style={{ width: `${recoveredPct}%` }}
                      />
                    </div>
                    <span className="tabular-nums text-[10px] text-emerald-300/80">
                      {p.recoveredMbd > 0 ? `+${p.recoveredMbd} recov.` : "—"}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Inventory math callout */}
            <div className="mt-3 rounded border border-amber-500/40 bg-amber-500/10 px-3 py-2.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                  Cumulative inventory draw · balance of 2026
                </span>
                <span className="text-base font-bold tabular-nums text-amber-200">
                  {curve.cumulativeInventoryDrawBnBbl} Bn bbl
                </span>
              </div>
              <p className="mt-1.5 text-[10.5px] italic leading-relaxed text-amber-200/85">
                {curve.inventoryContext}
              </p>
            </div>

            <p className="mt-2 text-[10px] italic text-white/45">
              — {curve.attribution}
            </p>
          </div>
        );
      })()}
    </div>
  );
}
