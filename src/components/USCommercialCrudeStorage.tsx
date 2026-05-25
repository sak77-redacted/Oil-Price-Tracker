"use client";

import type { USCommercialCrudeStorage as USCommercialCrudeStorageType } from "@/lib/types";

interface USCommercialCrudeStorageProps {
  data: USCommercialCrudeStorageType;
}

function formatLongDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function USCommercialCrudeStorage({
  data,
}: USCommercialCrudeStorageProps) {
  // Geometry for the horizontal storage bar.
  // Bar range: 0 → peak2026Mb. Show three zones:
  //   [0, operationalMinimumMb]      — locked (gray)
  //   [operationalMinimumMb, currentMb] — drainable buffer (orange)
  //   [currentMb, peak2026Mb]         — already drawn down (dim red border, empty)
  const max = Math.max(data.peak2026Mb, data.currentMb, data.operationalMinimumMb);
  const pctLocked = Math.max(0, Math.min(100, (data.operationalMinimumMb / max) * 100));
  const pctBuffer = Math.max(
    0,
    Math.min(100 - pctLocked, ((data.currentMb - data.operationalMinimumMb) / max) * 100),
  );
  const pctDrained = Math.max(0, 100 - pctLocked - pctBuffer);

  const drainableBuffer = Math.max(0, data.currentMb - data.operationalMinimumMb);

  return (
    <section className="overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card)]">
      {/* Header */}
      <div className="border-b border-[var(--card-border)] px-5 py-3">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
            US Commercial Crude Storage
          </span>
          <span className="text-[10px] italic text-[var(--text-secondary)]">
            · EIA weekly · HFI MOI floor
          </span>
        </div>
        <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
          The last place to draw. When this hits ops min, no marginal barrel is left for the global market.
        </p>
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-2">
        {/* Hero column */}
        <div className="rounded-lg border border-[var(--card-border)] bg-black/30 p-5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Current US commercial crude
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-4xl font-bold tabular-nums text-white">
              {data.currentMb}
            </span>
            <span className="text-sm font-medium text-[var(--text-secondary)]">mb</span>
          </div>
          <div className="mt-1 text-[11px] text-[var(--text-secondary)]">
            as of {formatLongDate(data.asOfDate)}
          </div>

          {/* Sub-stats grid */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded border border-white/10 bg-black/30 px-3 py-2">
              <div className="text-[9px] uppercase tracking-wider text-white/45">
                5-yr avg
              </div>
              <div className="mt-0.5 text-base font-bold tabular-nums text-white/80">
                {data.fiveYrAvgMb} mb
              </div>
            </div>
            <div className="rounded border border-white/10 bg-black/30 px-3 py-2">
              <div className="text-[9px] uppercase tracking-wider text-white/45">
                2026 peak
              </div>
              <div className="mt-0.5 text-base font-bold tabular-nums text-white/80">
                {data.peak2026Mb} mb
              </div>
              <div className="mt-0.5 text-[9px] italic text-white/40">
                {formatLongDate(data.peak2026Date)}
              </div>
            </div>
            <div className="rounded border border-red-500/30 bg-red-500/5 px-3 py-2">
              <div className="text-[9px] uppercase tracking-wider text-red-300/80">
                Operational min
              </div>
              <div className="mt-0.5 text-base font-bold tabular-nums text-red-300">
                {data.operationalMinimumMb} mb
              </div>
              <div className="mt-0.5 text-[9px] italic text-white/40">
                JH MOI floor
              </div>
            </div>
            <div className="rounded border border-amber-500/30 bg-amber-500/5 px-3 py-2">
              <div className="text-[9px] uppercase tracking-wider text-amber-300/80">
                Weekly draw
              </div>
              <div className="mt-0.5 text-base font-bold tabular-nums text-amber-300">
                −{data.weeklyDrawRateMb.toFixed(1)} mb
              </div>
              <div className="mt-0.5 text-[9px] italic text-white/40">
                EIA latest
              </div>
            </div>
          </div>
        </div>

        {/* Visualization + weeks-to-floor column */}
        <div className="rounded-lg border border-[var(--card-border)] bg-black/30 p-5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Storage position vs operational minimum
          </div>

          {/* Stacked horizontal bar */}
          <div className="mt-3 flex h-4 w-full overflow-hidden rounded bg-zinc-900">
            <div
              className="h-full bg-zinc-700"
              style={{ width: `${pctLocked}%` }}
              title={`Operational minimum ${data.operationalMinimumMb} mb — physically locked`}
            />
            <div
              className="h-full bg-orange-500/70"
              style={{ width: `${pctBuffer}%` }}
              title={`Drainable buffer ${drainableBuffer} mb`}
            />
            <div
              className="h-full bg-red-500/10"
              style={{ width: `${pctDrained}%` }}
              title={`Already drawn from 2026 peak ${data.peak2026Mb} mb`}
            />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
            <span>
              <span className="inline-block h-2 w-2 rounded-sm bg-zinc-700 align-middle" />{" "}
              Locked
            </span>
            <span className="text-orange-300/80">
              <span className="inline-block h-2 w-2 rounded-sm bg-orange-500/70 align-middle" />{" "}
              Drainable {drainableBuffer} mb
            </span>
            <span className="text-red-300/60">
              <span className="inline-block h-2 w-2 rounded-sm border border-red-500/30 align-middle" />{" "}
              Drawn from peak
            </span>
          </div>

          {/* Weeks-to-floor hero */}
          <div className="mt-5 rounded border border-red-500/30 bg-red-500/5 px-4 py-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-red-300/80">
              Weeks to operational floor
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-4xl font-bold tabular-nums text-red-300">
                ~{data.weeksToFloor}
              </span>
              <span className="text-sm font-medium text-red-200/70">weeks</span>
            </div>
            <div className="mt-1 text-[11px] text-red-200/60">
              at current −{data.weeklyDrawRateMb.toFixed(1)} mb/wk draw rate
            </div>
          </div>

          <p className="mt-4 text-[11px] italic leading-relaxed text-[var(--text-secondary)]">
            <span className="font-semibold not-italic text-white/80">
              Why US is the last to draw:
            </span>{" "}
            structural mismatch between shale ultra-light sweet and the heavy/medium sour barrels Asian + European refineries need. When US commercial hits ops min, no marginal barrel is left for the global market — sidelined buyers are forced into desperate bidding.
          </p>
        </div>
      </div>

      <div className="border-t border-[var(--card-border)] px-5 py-3 text-[10px] leading-relaxed text-[var(--text-secondary)]">
        <span className="font-semibold">Sources:</span> {data.source}.
      </div>
    </section>
  );
}
