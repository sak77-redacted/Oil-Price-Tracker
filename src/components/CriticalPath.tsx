"use client";

import type { CriticalPath as CriticalPathType, CriticalPathMilestone } from "@/lib/types";

interface CriticalPathProps {
  data: CriticalPathType;
}

const MS_PER_DAY = 86_400_000;

function daysUntil(iso: string): number {
  const target = new Date(`${iso}T00:00:00Z`).getTime();
  if (Number.isNaN(target)) return 0;
  // Snap "today" to UTC midnight so the count matches a date-only comparison.
  const now = new Date();
  const todayUtc = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  return Math.round((target - todayUtc) / MS_PER_DAY);
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

/**
 * Milestone card. The "next" milestone (the one closest to today, not yet
 * passed) gets a pulsing amber glow to flag it as the leading edge.
 */
function MilestoneCard({
  milestone,
  isNext,
}: {
  milestone: CriticalPathMilestone;
  isNext: boolean;
}) {
  const days = milestone.daysFromNow ?? daysUntil(milestone.date);
  const dayLabel =
    days < 0
      ? `${Math.abs(days)} days ago`
      : days === 0
        ? "today"
        : days === 1
          ? "tomorrow"
          : `~${days} days from today`;

  return (
    <div
      className={
        isNext
          ? "relative rounded-lg border border-amber-400/60 bg-amber-500/10 p-4 shadow-[0_0_18px_-4px_rgba(251,191,36,0.55)] animate-[pulse_3s_ease-in-out_infinite] sm:p-5"
          : "rounded-lg border border-amber-500/30 bg-black/30 p-4 sm:p-5"
      }
    >
      {isNext && (
        <span className="absolute right-3 top-3 rounded-full bg-amber-500/30 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-200">
          Next
        </span>
      )}
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300/90">
          {formatLongDate(milestone.date)}
        </span>
        <span className="text-[10px] italic text-white/45">·</span>
        <span className="text-[10px] tabular-nums text-white/70">
          {dayLabel}
        </span>
      </div>
      <h4 className="mt-2 text-base font-bold leading-snug text-white sm:text-lg">
        {milestone.label}
      </h4>
      <p className="mt-2 text-[12px] leading-relaxed text-white/70">
        {milestone.description}
      </p>
      <p className="mt-3 border-t border-white/5 pt-2 text-[10px] italic text-white/45">
        {milestone.source}
      </p>
    </div>
  );
}

export default function CriticalPath({ data }: CriticalPathProps) {
  // Sort milestones chronologically; identify the next future milestone.
  const sorted = [...data.milestones].sort(
    (a, b) =>
      new Date(`${a.date}T00:00:00Z`).getTime() -
      new Date(`${b.date}T00:00:00Z`).getTime(),
  );
  const nextIndex = sorted.findIndex((m) => daysUntil(m.date) >= 0);

  return (
    <section className="mt-6 w-full rounded-xl border border-amber-400/50 bg-zinc-950/70 p-5 shadow-[0_0_28px_-12px_rgba(251,191,36,0.5)] sm:p-6">
      {/* ─── Header ─── */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-300">
          HFI Critical Path
        </span>
        <span className="text-xs text-white/45">/ when the thesis plays out</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-300/90">
            Death by a thousand headlines
          </span>
        </div>
      </div>

      <h3 className="mt-3 text-lg font-extrabold leading-tight text-white sm:text-xl">
        {data.title}
      </h3>
      <p className="mt-1 text-sm text-white/65">{data.subtitle}</p>

      {/* ─── Framing paragraph ─── */}
      <p className="mt-4 rounded border-l-2 border-amber-500/40 bg-black/30 px-4 py-3 text-[12.5px] italic leading-relaxed text-amber-100/90">
        {data.framing}
      </p>

      {/* ─── Milestone cards ─── */}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {sorted.map((m, idx) => (
          <MilestoneCard
            key={`${m.date}-${m.label}`}
            milestone={m}
            isNext={idx === nextIndex}
          />
        ))}
      </div>

      <p className="mt-4 border-t border-white/5 pt-3 text-[10px] uppercase tracking-wider text-white/35">
        {data.attribution}
      </p>
    </section>
  );
}
