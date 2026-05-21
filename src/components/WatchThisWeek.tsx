"use client";

import type { SignalData, RefineryTurnaround, TimelineEvent } from "@/lib/types";

type Tier = 1 | 2 | 3;

interface CatalystRow {
  date: string;        // ISO YYYY-MM-DD
  daysUntil: number;   // negative = in progress / past, positive = upcoming
  title: string;
  why: string;
  tier: Tier;
  /** Optional display tag, e.g. "In progress" */
  tag?: string;
}

interface WatchThisWeekProps {
  data: SignalData;
  /** Reference date — defaults to today. Tests can override. */
  referenceDate?: Date;
}

const WINDOW_DAYS = 14;

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysBetween(from: Date, to: Date): number {
  const ms = startOfDay(to).getTime() - startOfDay(from).getTime();
  return Math.round(ms / 86400000);
}

function classifyTimelineEvent(event: TimelineEvent): Tier {
  const text = `${event.event} ${event.impact}`.toLowerCase();
  // Tier 1 — direct supply / SPR / WAF / blockade / strait events
  if (
    text.includes("spr") ||
    text.includes("waf") ||
    text.includes("strait") ||
    text.includes("blockade") ||
    text.includes("waiver") ||
    text.includes("force majeure") ||
    text.includes("cliff")
  ) {
    return 1;
  }
  // Tier 2 — refinery / fixture / attack events
  if (
    text.includes("refin") ||
    text.includes("fixture") ||
    text.includes("attack") ||
    text.includes("missile") ||
    text.includes("drone")
  ) {
    return 2;
  }
  return 3;
}

function refineryRowsFromTurnarounds(
  turnarounds: RefineryTurnaround[] | undefined,
  ref: Date,
): CatalystRow[] {
  if (!turnarounds) return [];
  const rows: CatalystRow[] = [];
  for (const t of turnarounds) {
    const start = new Date(`${t.startDate}T00:00:00Z`);
    const endMs = start.getTime() + t.durationDays * 86400000;
    const end = new Date(endMs);
    const startDays = daysBetween(ref, start);
    const endDays = daysBetween(ref, end);

    // Skip turnarounds that already ended
    if (endDays < 0 && t.durationDays > 0) continue;

    // Pick the next relevant date: start if upcoming, end if in progress
    if (startDays >= 0 && startDays <= WINDOW_DAYS) {
      rows.push({
        date: t.startDate,
        daysUntil: startDays,
        title: `${t.refiner} turnaround begins`,
        why: `${t.capacityNote} offline ${t.durationDays}d — operational supply pressure layered on Hormuz crisis.`,
        tier: 2,
      });
    } else if (startDays < 0 && endDays >= 0 && endDays <= WINDOW_DAYS) {
      const endIso = end.toISOString().slice(0, 10);
      rows.push({
        date: endIso,
        daysUntil: endDays,
        title: `${t.refiner} restart`,
        why: `${t.capacityNote} returns online — incremental product supply if completed on schedule.`,
        tier: 2,
        tag: "Restart",
      });
    } else if (startDays < 0 && t.durationDays > 0 && endDays > WINDOW_DAYS) {
      // Already in progress, restart is beyond 14d window — surface as "in progress" with original startDate
      rows.push({
        date: t.startDate,
        daysUntil: startDays,
        title: `${t.refiner} turnaround in progress`,
        why: `${t.capacityNote} offline through day ${endDays} — ${t.notes}`,
        tier: 2,
        tag: "In progress",
      });
    }
  }
  return rows;
}

function timelineRowsFromEvents(events: TimelineEvent[], ref: Date): CatalystRow[] {
  const rows: CatalystRow[] = [];
  for (const e of events) {
    const d = new Date(`${e.date}T00:00:00Z`);
    const days = daysBetween(ref, d);
    if (days < 0 || days > WINDOW_DAYS) continue;
    rows.push({
      date: e.date,
      daysUntil: days,
      title: e.event,
      why: e.impact,
      tier: classifyTimelineEvent(e),
    });
  }
  return rows;
}

function wafProgrammeRow(data: SignalData, ref: Date): CatalystRow | null {
  if (!data.buyerStress) return null;
  // WAF June programme typically bids in the first week of June.
  // Pick June 1 of the reference year as the canonical watch date.
  const year = ref.getFullYear();
  const month = ref.getMonth(); // 0-indexed
  // If we're in May or earlier, next WAF programme = June 1 same year.
  // If we're in June+, next WAF programme = month+1 the first.
  const targetYear = year;
  const targetMonth = month >= 5 ? month + 1 : 5; // 5 = June
  const wafDate = new Date(targetYear, targetMonth, 1);
  const days = daysBetween(ref, wafDate);
  if (days < 0 || days > WINDOW_DAYS) return null;

  const status = data.buyerStress.wafProgrammeStatus;
  const statusLabel =
    status === "stalled" ? "(currently stalled)" :
    status === "accelerating" ? "(accelerating)" :
    "(normal)";

  return {
    date: wafDate.toISOString().slice(0, 10),
    daysUntil: days,
    title: `WAF programme bidding window opens ${statusLabel}`,
    why: "Leading indicator: when Asian buyers return to West African cargoes, the buyer-stress lull is breaking — physical demand re-engages.",
    tier: 1,
    tag: "Leading indicator",
  };
}

const tierStyle: Record<Tier, { dot: string; label: string; chip: string }> = {
  1: {
    dot: "bg-red-400",
    label: "Tier 1",
    chip: "border-red-500/40 bg-red-500/10 text-red-300",
  },
  2: {
    dot: "bg-amber-400",
    label: "Tier 2",
    chip: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  },
  3: {
    dot: "bg-zinc-500",
    label: "Tier 3",
    chip: "border-zinc-700 bg-zinc-800/40 text-zinc-300",
  },
};

function formatDateChip(iso: string, daysUntil: number): string {
  if (daysUntil === 0) return "Today";
  if (daysUntil === 1) return "Tomorrow";
  if (daysUntil < 0) return `${Math.abs(daysUntil)}d ago`;
  const d = new Date(`${iso}T00:00:00Z`);
  const monthDay = d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  return `${monthDay} · in ${daysUntil}d`;
}

export default function WatchThisWeek({ data, referenceDate }: WatchThisWeekProps) {
  const ref = startOfDay(referenceDate ?? new Date());

  const all: CatalystRow[] = [
    ...timelineRowsFromEvents(data.timeline.events, ref),
    ...refineryRowsFromTurnarounds(data.timeline.refineryTurnarounds, ref),
  ];
  const wafRow = wafProgrammeRow(data, ref);
  if (wafRow) all.push(wafRow);

  // Sort by date ascending, then tier ascending (highest tier wins for ties)
  all.sort((a, b) => {
    if (a.daysUntil !== b.daysUntil) return a.daysUntil - b.daysUntil;
    return a.tier - b.tier;
  });

  const top3 = all.slice(0, 3);
  const shortfall = top3.length < 3;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-white">
          Watch This Week
        </h3>
        <span className="text-[10px] uppercase tracking-wider text-white/45">
          Top 3 dated catalysts · next {WINDOW_DAYS}d
        </span>
      </div>

      {top3.length === 0 ? (
        <p className="text-sm text-white/55">
          No further catalysts in the {WINDOW_DAYS}-day window — watch the regime signals for regime-shift surprise.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-800/70">
          {top3.map((row, i) => {
            const style = tierStyle[row.tier];
            return (
              <li key={`${row.date}-${i}`} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:gap-4">
                <div className="flex shrink-0 items-center gap-2 sm:w-44">
                  <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                  <span className="text-xs font-semibold tabular-nums text-white/85">
                    {formatDateChip(row.date, row.daysUntil)}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-sm font-semibold text-white">{row.title}</span>
                    <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${style.chip}`}>
                      {style.label}
                    </span>
                    {row.tag && (
                      <span className="rounded border border-zinc-700 bg-zinc-800/40 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-300">
                        {row.tag}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-white/60">{row.why}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {shortfall && top3.length > 0 && (
        <p className="mt-3 text-[11px] italic text-white/45">
          No further catalysts in the {WINDOW_DAYS}-day window.
        </p>
      )}
    </div>
  );
}
