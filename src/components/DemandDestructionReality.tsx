"use client";

import type {
  DemandDestructionReality as DemandDestructionRealityType,
  ExportTracker,
} from "@/lib/types";

interface DemandDestructionRealityProps {
  data: DemandDestructionRealityType;
  exports?: ExportTracker[];
}

function formatChange(mbd: number): string {
  if (mbd === 0) return "0.0";
  const sign = mbd > 0 ? "+" : "−";
  return `${sign}${Math.abs(mbd).toFixed(1)}`;
}

function changeColor(mbd: number): string {
  if (mbd > 0) return "text-red-300"; // demand UP = bad for balance
  if (mbd < 0) return "text-emerald-300"; // demand DOWN = progress toward balance
  return "text-white/70";
}

function exportChangeColor(mbd: number): string {
  // For exports: positive = supply UP (cushion); negative = supply collapse
  if (mbd > 0) return "text-emerald-300";
  if (mbd < 0) return "text-red-300";
  return "text-white/70";
}

export default function DemandDestructionReality({
  data,
  exports,
}: DemandDestructionRealityProps) {
  // Clamp progress for visual rendering — but show literal value in the number.
  const pct = Math.max(0, Math.min(100, data.progressPct));

  return (
    <section className="overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card)]">
      {/* Header */}
      <div className="border-b border-[var(--card-border)] px-5 py-3">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
            Demand Destruction Reality Check
          </span>
          <span className="text-[10px] italic text-[var(--text-secondary)]">
            · Goldman real-time · EIA
          </span>
        </div>
        <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
          At COVID peak, global demand fell ~20 mb/d. We&apos;ve barely moved.
        </p>
      </div>

      {/* Regional table */}
      <div className="px-5 py-5">
        <div className="overflow-hidden rounded-lg border border-[var(--card-border)]">
          <table className="w-full text-left text-[12px]">
            <thead className="bg-black/30 text-[10px] uppercase tracking-wider text-white/55">
              <tr>
                <th className="px-3 py-2 font-semibold">Region</th>
                <th className="px-3 py-2 text-right font-semibold">Total (mb/d)</th>
                <th className="px-3 py-2 text-right font-semibold">Y-o-Y</th>
                <th className="px-3 py-2 font-semibold">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)]">
              {data.regions.map((r) => (
                <tr key={r.region} className="bg-black/10">
                  <td className="px-3 py-2 font-semibold text-white/90">
                    {r.region}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-white/80">
                    {r.totalMbd.toFixed(2)}
                  </td>
                  <td
                    className={`px-3 py-2 text-right font-bold tabular-nums ${changeColor(r.yoyChangeMbd)}`}
                  >
                    {formatChange(r.yoyChangeMbd)} mb/d
                  </td>
                  <td className="px-3 py-2 text-[10.5px] italic text-white/45">
                    {r.source}
                  </td>
                </tr>
              ))}
              <tr className="bg-black/40 font-semibold">
                <td className="px-3 py-2.5 text-[11px] uppercase tracking-wider text-white/70">
                  Net global change
                </td>
                <td className="px-3 py-2.5" />
                <td
                  className={`px-3 py-2.5 text-right text-base font-extrabold tabular-nums ${changeColor(data.netGlobalChangeMbd)}`}
                >
                  {formatChange(data.netGlobalChangeMbd)} mb/d
                </td>
                <td className="px-3 py-2.5 text-[10px] italic text-white/45">
                  Sum of regions above
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Progress bar — required vs achieved */}
        <div className="mt-5 rounded-lg border border-red-500/30 bg-red-500/5 p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-red-300/80">
                Progress toward balance
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tabular-nums text-red-300">
                  {data.progressPct}%
                </span>
                <span className="text-xs text-red-200/65">
                  of required demand destruction
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-white/55">
                Required for balance
              </div>
              <div className="mt-1 text-lg font-bold tabular-nums text-white/85">
                ~{data.requiredForBalanceMbd} mb/d
              </div>
              <div className="text-[10px] italic text-white/40">
                HFI estimate
              </div>
            </div>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-900">
            <div
              className="h-full rounded-full bg-red-500/70"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-3 rounded border border-white/10 bg-black/30 px-3 py-2 text-[11.5px] italic leading-relaxed text-white/70">
            {data.context}
          </p>
        </div>

        {/* Export trackers — supply collapse */}
        {exports && exports.length > 0 && (
          <div className="mt-5 rounded-lg border border-[var(--card-border)] bg-black/20 p-4">
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/80">
                Crude Export Trackers · Y-o-Y
              </span>
              <span className="text-[10px] italic text-white/45">
                The supply side of the gap
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {exports.map((e) => (
                <div
                  key={e.metric}
                  className="rounded border border-white/10 bg-black/30 px-3 py-2.5"
                >
                  <div className="text-[10px] uppercase tracking-wider text-white/55">
                    {e.metric}
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span
                      className={`text-xl font-bold tabular-nums ${exportChangeColor(e.yoyChangeMbd)}`}
                    >
                      {formatChange(e.yoyChangeMbd)}
                    </span>
                    <span className="text-[10px] text-white/55">mb/d</span>
                    {e.currentMbd != null && (
                      <span className="ml-auto text-[10px] tabular-nums text-white/55">
                        @ {e.currentMbd.toFixed(2)} mb/d
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-[10.5px] italic leading-snug text-white/55">
                    {e.note}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-[var(--card-border)] px-5 py-3 text-[10px] leading-relaxed text-[var(--text-secondary)]">
        <span className="font-semibold">Sources:</span> {data.source}.
      </div>
    </section>
  );
}
