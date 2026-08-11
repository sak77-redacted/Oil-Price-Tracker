"use client";

import type { InventoryPhase, PhaseIndicator as PhaseIndicatorType } from "@/lib/types";

interface PhaseIndicatorProps {
  data: PhaseIndicatorType;
}

interface PhaseSegment {
  phase: InventoryPhase;
  label: string;
  shortLabel: string;
}

const PHASE_SEGMENTS: PhaseSegment[] = [
  { phase: 0, label: "0 · Pre-Crisis", shortLabel: "Pre-Crisis" },
  { phase: 1, label: "1 · Excess Cash Burn", shortLabel: "Excess Cash Burn" },
  { phase: 2, label: "2 · SPR Draws", shortLabel: "SPR Draws" },
  { phase: 3, label: "3 · Desperate Bidding", shortLabel: "Desperate Bidding" },
];

/**
 * Segment color logic: current phase is highlighted (saturated + ring +
 * pulse). Phases below current are dim/neutral (already passed-through but
 * not the active marker). Phases above current are dim with the eventual
 * destination palette (warning → red).
 */
function segmentClasses(segment: PhaseSegment, currentPhase: InventoryPhase): string {
  const isCurrent = segment.phase === currentPhase;
  const isPast = segment.phase < currentPhase;

  // Color palette per phase
  let baseColor: string;
  if (segment.phase === 0) baseColor = "bg-zinc-700";
  else if (segment.phase === 1) baseColor = "bg-amber-500";
  else if (segment.phase === 2) baseColor = "bg-red-600";
  else baseColor = "bg-red-800";

  if (isCurrent) {
    return `${baseColor} ring-1 ring-white/40 shadow-[0_0_18px_-2px_rgba(239,68,68,0.55)] animate-pulse`;
  }
  if (isPast) {
    return `${baseColor} opacity-40`;
  }
  // Future
  return `${baseColor} opacity-25`;
}

export default function PhaseIndicator({ data }: PhaseIndicatorProps) {
  const current = data.phase;
  // Suppress implausible countdowns (e.g. "118.9 weeks") — only show the
  // weeks-to-next-phase chip when the estimate is plausible (≤ 1 year).
  const showWeeksToNextPhase =
    data.weeksToNextPhase > 0 && data.weeksToNextPhase <= 52;

  return (
    <div className="mt-6 w-full rounded-xl border border-amber-500/30 bg-zinc-950/60 p-5 sm:p-6">
      {/* ─── Header ─── */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--accent)]">
          Inventory Phase Indicator
        </span>
        <span className="text-xs text-white/45">/ where in the cycle we are</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-300/90">
            Framework · JH/@CRUDEOIL231
          </span>
        </div>
      </div>

      {/* ─── Hero row ─── */}
      <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-2">
        <span className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          PHASE {current}
          <span className="ml-2 text-amber-300">— {data.phaseName}</span>
        </span>
        <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold tabular-nums text-white/80">
          Day {data.daysInPhase}
        </span>
      </div>

      {/* ─── 4-segment progress bar ─── */}
      <div className="mt-5">
        <div className="flex gap-[2px]">
          {PHASE_SEGMENTS.map((seg) => (
            <div
              key={seg.phase}
              className={`h-3 flex-1 rounded-sm transition-all ${segmentClasses(seg, current)}`}
              aria-label={seg.label}
            />
          ))}
        </div>
        <div className="mt-2 flex gap-[2px]">
          {PHASE_SEGMENTS.map((seg) => {
            const isCurrent = seg.phase === current;
            return (
              <div
                key={seg.phase}
                className={`flex-1 text-center text-[10px] uppercase tracking-wider ${
                  isCurrent ? "font-bold text-amber-300" : "text-white/45"
                }`}
              >
                {seg.label}
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Phase description ─── */}
      <p className="mt-5 text-sm italic leading-relaxed text-white/80">
        {data.phaseDescription}
      </p>

      {/* ─── Transition tile row ─── */}
      <div className={`mt-4 grid grid-cols-1 gap-3 ${showWeeksToNextPhase ? "sm:grid-cols-2" : ""}`}>
        <div className="rounded-lg border border-white/10 bg-black/30 p-4">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-white/55">
            Transition Trigger
          </div>
          <div className="mt-2 text-[12px] leading-snug text-white/85">
            {data.transitionTrigger}
          </div>
        </div>
        {showWeeksToNextPhase && (
          <div className="rounded-lg border border-white/10 bg-black/30 p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-white/55">
              Est. weeks to next phase
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold tabular-nums text-white">
                {data.weeksToNextPhase}
              </span>
              <span className="text-xs text-white/55">weeks</span>
            </div>
            <div className="mt-1 text-[11px] text-white/55">
              Phase {current} &rarr; Phase {Math.min(3, current + 1) as InventoryPhase}
            </div>
          </div>
        )}
      </div>

      {/* ─── Price implication footer ─── */}
      <p className="mt-4 text-[11px] italic leading-relaxed text-white/55">
        {data.priceImplication}
      </p>

      {/* ─── Morgan Downey 'weeks not months' context ─── */}
      {data.morganDowneyContext && (
        <p className="mt-2 text-[11px] italic leading-relaxed text-amber-200/70">
          {data.morganDowneyContext}
        </p>
      )}

      <p className="mt-3 border-t border-white/5 pt-3 text-[10px] uppercase tracking-wider text-white/35">
        Framework: JH/@CRUDEOIL231, March 18 2026
      </p>
    </div>
  );
}
