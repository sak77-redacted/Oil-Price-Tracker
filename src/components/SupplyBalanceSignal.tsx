"use client";

import { useEffect, useState } from "react";
import type { InventoryDecomposition, PhysicalMarketNote } from "@/lib/types";
import { isStale } from "@/lib/staleness";

interface SupplyBalanceSignalProps {
  physicalMarketNote?: PhysicalMarketNote;
  physicalMarketNotes?: PhysicalMarketNote[];
  usInventoryDecomp?: InventoryDecomposition;
  globalInventoryDecomp?: InventoryDecomposition;
}

/**
 * Renders one column of the JH MOI decomposition: stacked horizontal bar
 * (gray locked MOI portion + red drainable available portion) + stat lines.
 */
function InventoryDecompColumn({ decomp }: { decomp: InventoryDecomposition }) {
  const moiPct = Math.max(0, Math.min(100, (decomp.moiFloorMb / decomp.totalMb) * 100));
  const availPct = Math.max(0, 100 - moiPct);
  const { linefillMb, tankBottomsMb, workingStockMb } = decomp.moiComponents;

  return (
    <div className="rounded-lg border border-[var(--card-border)] bg-black/30 p-4">
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-primary)]">
          {decomp.region}
        </span>
        <span className="text-[10px] text-[var(--text-secondary)]">
          {decomp.totalMb.toLocaleString("en-US")} mb total
        </span>
      </div>

      {/* Stacked horizontal bar: MOI (locked, gray) + Available (drainable, red) */}
      <div className="mt-3 flex h-3 w-full overflow-hidden rounded bg-zinc-900">
        <div
          className="h-full bg-zinc-700"
          style={{ width: `${moiPct}%` }}
          title={`MOI floor ${decomp.moiFloorMb} mb (${moiPct.toFixed(0)}%) — physically locked`}
        />
        <div
          className="h-full bg-red-500/60"
          style={{ width: `${availPct}%` }}
          title={`Available buffer ${decomp.availableBufferMb} mb (${availPct.toFixed(0)}%) — drainable`}
        />
      </div>
      <div className="mt-1 flex items-baseline justify-between text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
        <span>MOI {moiPct.toFixed(0)}% locked</span>
        <span className="text-red-300/80">Available {availPct.toFixed(0)}%</span>
      </div>

      {/* Stat lines */}
      <div className="mt-3 space-y-1 font-mono text-[11px]">
        <div className="flex justify-between text-[var(--text-secondary)]">
          <span>Total</span>
          <span className="tabular-nums text-[var(--text-primary)]">
            {decomp.totalMb.toLocaleString("en-US")} mb
          </span>
        </div>
        <div className="flex justify-between text-[var(--text-secondary)]">
          <span>MOI floor</span>
          <span className="tabular-nums text-zinc-300">
            {decomp.moiFloorMb.toLocaleString("en-US")} mb
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--text-secondary)]">Available buffer</span>
          <span className="font-bold tabular-nums text-red-400">
            {decomp.availableBufferMb.toLocaleString("en-US")} mb
          </span>
        </div>
        <div className="flex justify-between text-[var(--text-secondary)]">
          <span>Weekly burn</span>
          <span className="tabular-nums text-amber-300">
            −{decomp.weeklyBurnMb.toFixed(1)} mb &rarr;{" "}
            <span className="text-[var(--text-primary)]">
              {decomp.weeksToMOI.toFixed(1)} wks to MOI
            </span>
          </span>
        </div>
      </div>

      {/* MOI components mini-row */}
      <div className="mt-3 border-t border-[var(--card-border)] pt-2 text-[10px] leading-relaxed text-[var(--text-secondary)]">
        <span className="font-semibold text-zinc-400">MOI =</span>{" "}
        Linefill {linefillMb} mb · Tank bottoms {tankBottomsMb} mb · Working stock {workingStockMb} mb
      </div>
    </div>
  );
}

function formatNoteDate(iso: string): string {
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00Z" : ""));
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

// HFI Research / JPMorgan oil balance estimates, as of late April 2026.
// Shut-in is gross loss of Middle East exports (vs ~21 Mbpd pre-conflict).
// Bypass production (9.5 Mbpd via Petroline / ADCOP / Kirkuk-Ceyhan) is what
// still flows; net shortfall is the gap remaining after the IEA SPR release.
const SHUT_IN_MBPD = 11.5;
const SPR_RELEASE_MBPD = 3.0;
const NET_SHORTFALL_MBPD = 8.5;

// Inventory + demand destruction absorbing the gap (JPM, April).
const INV_DRAW_APR_MBPD = 7.1;
const INV_DRAW_MAR_MBPD = 4.0;
const DEMAND_DESTRUCTION_MBPD = 4.3;
const CUMULATIVE_INV_DRAW_MBBL = 330;

// IEA coordinated release: 400 Mbbl announced Mar 11, 120-day window.
const IEA_RELEASE_START_ISO = "2026-03-11";
const IEA_RELEASE_DAYS = 120;
const IEA_TOTAL_MBBL = 400;
const IEA_US_SHARE_MBBL = 172;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function addDays(iso: string, days: number): Date {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function formatLongDate(d: Date): string {
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

export default function SupplyBalanceSignal({
  physicalMarketNote,
  physicalMarketNotes,
  usInventoryDecomp,
  globalInventoryDecomp,
}: SupplyBalanceSignalProps = {}) {
  const [now, setNow] = useState<Date | null>(null);

  // Build merged note list (newest first), deduped.
  const notes: PhysicalMarketNote[] = (() => {
    const arr: PhysicalMarketNote[] = [];
    const seen = new Set<string>();
    const push = (n?: PhysicalMarketNote) => {
      if (!n) return;
      const k = `${n.date}|${n.attribution}|${n.quote.slice(0, 40)}`;
      if (seen.has(k)) return;
      seen.add(k);
      arr.push(n);
    };
    (physicalMarketNotes ?? []).forEach(push);
    push(physicalMarketNote);
    return arr.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  })();

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const runwayEnd = addDays(IEA_RELEASE_START_ISO, IEA_RELEASE_DAYS);
  const totalSeconds = now
    ? Math.max(0, Math.floor((runwayEnd.getTime() - now.getTime()) / 1000))
    : 0;
  const days  = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const mins  = Math.floor((totalSeconds % 3600) / 60);
  const secs  = totalSeconds % 60;

  const widenedGap = SHUT_IN_MBPD; // after SPR runs out, gross shut-in = net gap
  const absorbedTotal = INV_DRAW_APR_MBPD + DEMAND_DESTRUCTION_MBPD;

  return (
    <section className="overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card)]">
      {/* Header */}
      <div className="border-b border-[var(--card-border)] px-5 py-3">
        <div className="flex items-baseline gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
            Signal 8
          </span>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            Supply Balance
          </h2>
        </div>
        <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
          The arithmetic the broader market is ignoring.
        </p>
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-2">
        {/* Net shortfall math */}
        <div className="rounded-lg border border-[var(--card-border)] bg-black/30 p-5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Net supply shortfall
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-bold tabular-nums text-red-400">
              −{NET_SHORTFALL_MBPD.toFixed(1)}
            </span>
            <span className="text-sm font-medium text-[var(--text-secondary)]">
              Mbpd
            </span>
          </div>

          <div className="mt-4 space-y-1 font-mono text-[11px]">
            <div className="flex justify-between text-[var(--text-secondary)]">
              <span>Gulf gross shut-in</span>
              <span className="tabular-nums text-red-400">−{SHUT_IN_MBPD.toFixed(1)}</span>
            </div>
            <div className="flex justify-between text-[var(--text-secondary)]">
              <span>IEA SPR release</span>
              <span className="tabular-nums text-emerald-400">+{SPR_RELEASE_MBPD.toFixed(1)}</span>
            </div>
            <div className="my-1 h-px bg-[var(--card-border)]" />
            <div className="flex justify-between font-semibold text-[var(--text-primary)]">
              <span>Net shortfall</span>
              <span className="tabular-nums text-red-400">−{NET_SHORTFALL_MBPD.toFixed(1)}</span>
            </div>
          </div>

          <div className="mt-4 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Absorbed by (JPM, April)
          </div>
          <div className="mt-1 space-y-1 font-mono text-[11px]">
            <div className="flex justify-between text-[var(--text-secondary)]">
              <span>Inventory draw</span>
              <span className="tabular-nums text-amber-400">−{INV_DRAW_APR_MBPD.toFixed(1)}</span>
            </div>
            <div className="flex justify-between text-[var(--text-secondary)]">
              <span>Forced demand destruction</span>
              <span className="tabular-nums text-amber-400">−{DEMAND_DESTRUCTION_MBPD.toFixed(1)}</span>
            </div>
            <div className="my-1 h-px bg-[var(--card-border)]" />
            <div className="flex justify-between font-semibold text-[var(--text-primary)]">
              <span>Total absorbed</span>
              <span className="tabular-nums text-amber-400">−{absorbedTotal.toFixed(1)}</span>
            </div>
          </div>

          <div className="mt-4 border-t border-[var(--card-border)] pt-3 text-[11px] leading-snug text-[var(--text-secondary)]">
            Cumulative inventories drawn over March + April:{" "}
            <span className="font-semibold text-[var(--text-primary)]">
              ~{CUMULATIVE_INV_DRAW_MBBL} Mbbl
            </span>{" "}
            ({INV_DRAW_MAR_MBPD.toFixed(1)} Mbpd in March, {INV_DRAW_APR_MBPD.toFixed(1)} Mbpd in April).
            The buffer is finite. When it ends, demand destruction has to do all the work.
          </div>
        </div>

        {/* SPR runway countdown */}
        <div className="rounded-lg border border-[var(--card-border)] bg-black/30 p-5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            IEA SPR release runway exhausted in
          </div>
          <div className="mt-2 grid grid-cols-4 gap-2 text-center">
            {[
              { v: days, l: "days" },
              { v: hours, l: "hours" },
              { v: mins, l: "mins" },
              { v: secs, l: "secs" },
            ].map(({ v, l }) => (
              <div
                key={l}
                className="rounded border border-[var(--card-border)] bg-black/40 py-2"
              >
                <div className="text-2xl font-bold tabular-nums text-[var(--accent)]">
                  {now ? String(v).padStart(2, "0") : "··"}
                </div>
                <div className="text-[9px] uppercase tracking-wider text-[var(--text-secondary)]">
                  {l}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-[var(--text-secondary)]">
            Window ends:{" "}
            <span className="font-semibold text-[var(--text-primary)]">
              {formatLongDate(runwayEnd)}
            </span>
          </div>

          <div className="mt-3 space-y-1 border-t border-[var(--card-border)] pt-3 font-mono text-[11px] text-[var(--text-secondary)]">
            <div>
              IEA coordinated release:{" "}
              <span className="text-[var(--text-primary)]">
                {IEA_TOTAL_MBBL} Mbbl / {IEA_RELEASE_DAYS} days
              </span>
            </div>
            <div>
              Average rate:{" "}
              <span className="text-[var(--text-primary)]">
                ≈ {SPR_RELEASE_MBPD.toFixed(1)} Mbpd
              </span>
            </div>
            <div>
              US share:{" "}
              <span className="text-[var(--text-primary)]">
                {IEA_US_SHARE_MBBL} Mbbl ({Math.round((IEA_US_SHARE_MBBL / IEA_TOTAL_MBBL) * 100)}%)
              </span>
            </div>
          </div>

          <div className="mt-3 border-t border-[var(--card-border)] pt-3 text-[11px] leading-snug text-[var(--text-secondary)]">
            <span className="font-semibold text-amber-400">After the runway ends</span>{" "}
            the +{SPR_RELEASE_MBPD.toFixed(1)} Mbpd cushion vanishes — the net gap mechanically widens from{" "}
            <span className="font-semibold text-[var(--text-primary)]">{NET_SHORTFALL_MBPD.toFixed(1)} Mbpd</span> back to{" "}
            <span className="font-semibold text-red-400">{widenedGap.toFixed(1)} Mbpd</span>{" "}
            unless the strait reopens or demand destruction picks up the slack. Inventories will likely already be exhausted by then.
          </div>
        </div>
      </div>

      {/* ─── Inventory Decomposition (JH MOI Framework) ─── */}
      {(usInventoryDecomp || globalInventoryDecomp) && (
        <div className="border-t border-[var(--card-border)] px-5 py-5">
          <div className="mb-3 flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
              Inventory Decomposition · JH MOI Framework
            </span>
            <span className="text-xs text-[var(--text-secondary)]">
              Minimum Operating Inventory (linefill + tank bottoms + working stock) is physically locked. Only the available buffer can absorb shocks.
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {usInventoryDecomp && <InventoryDecompColumn decomp={usInventoryDecomp} />}
            {globalInventoryDecomp && <InventoryDecompColumn decomp={globalInventoryDecomp} />}
          </div>
          {/* Bennie K MOI callout — concrete global tank-bottoms number */}
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded border border-amber-500/30 bg-amber-500/5 px-3 py-2">
            <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-200">
              Bennie K MOI
            </span>
            <span className="text-[11px] font-semibold tabular-nums text-amber-200">
              2.8 Bn bbl
            </span>
            <span className="text-[10.5px] text-white/65">
              globally locked · 1.264 Bn linefill + 1.519 Bn tank bottoms ·
              China ~600 / US ~450 / Russia ~250 / Japan ~225 MMbbl
            </span>
          </div>

          <p className="mt-3 text-[11px] italic leading-snug text-[var(--text-secondary)]">
            Burn rate measured against AVAILABLE buffer, not total inventory. Per JH framework, only ~5–15% of headline inventory can actually absorb shocks.
          </p>
        </div>
      )}

      {/* Physical market notes — fresh inline, dated collapsed */}
      {notes.length > 0 && (() => {
        const freshNotes = notes.filter((n) => !isStale(n.date));
        const datedNotes = notes.filter((n) => isStale(n.date));
        const shortDate = (iso: string): string => {
          const d = new Date(iso + (iso.length === 10 ? "T00:00:00Z" : ""));
          if (isNaN(d.getTime())) return iso;
          return d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            timeZone: "UTC",
          });
        };
        // notes sorted newest-first: newest = [0], oldest = last.
        const datedRangeLabel =
          datedNotes.length > 0
            ? `${shortDate(datedNotes[datedNotes.length - 1].date)}–${shortDate(datedNotes[0].date)}`
            : "";
        const renderNote = (note: PhysicalMarketNote, idx: number) => (
          <blockquote
            key={`${note.date}-${idx}`}
            className="border-l-2 border-amber-500/40 pl-3 text-sm italic leading-relaxed text-[var(--text-primary)]"
          >
            <p>&ldquo;{note.quote}&rdquo;</p>
            <footer className="mt-2 not-italic text-[11px] text-[var(--text-secondary)]">
              <span className="font-semibold text-amber-300/80">
                {note.attribution}
              </span>
              <span className="mx-1.5 text-[var(--card-border)]">·</span>
              <span>{formatNoteDate(note.date)}</span>
              {note.context && (
                <div className="mt-1 text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
                  {note.context}
                </div>
              )}
            </footer>
          </blockquote>
        );
        return (
          <div className="flex flex-col gap-3 border-t border-[var(--card-border)] px-5 py-4">
            {freshNotes.map(renderNote)}
            {datedNotes.length > 0 && (
              <details className="rounded-lg border border-[var(--card-border)] bg-black/20">
                <summary className="cursor-pointer list-none px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                  Dated commentary ({datedNotes.length}) — {datedRangeLabel} ▾
                </summary>
                <div className="flex flex-col gap-3 px-3 pb-3 pt-1">
                  {datedNotes.map(renderNote)}
                </div>
              </details>
            )}
          </div>
        );
      })()}

      <div className="border-t border-[var(--card-border)] px-5 py-3 text-[10px] leading-relaxed text-[var(--text-secondary)]">
        <span className="font-semibold">Sources:</span> HFI Research (Jon Costello, May 6 2026); JPMorgan oil balance estimates (April 2026); IEA Mar 11 coordinated release announcement; Kpler / S&P Global tanker transit data. Numbers as quoted at publication and refresh weekly rather than live.
      </div>
    </section>
  );
}
