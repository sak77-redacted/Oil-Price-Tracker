"use client";

import type { TimelineSignal, RefineryTurnaround } from "@/lib/types";
import { getDaysUntil } from "@/lib/utils";

interface CriticalDeadlinesProps {
  data: TimelineSignal;
}

function formatEventDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00Z");
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function formatTurnaroundDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00Z");
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function turnaroundEnd(t: RefineryTurnaround): string {
  if (t.durationDays <= 0) return "indefinite";
  const start = new Date(t.startDate + "T00:00:00Z");
  start.setUTCDate(start.getUTCDate() + t.durationDays);
  return start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function getDaysColor(days: number): string {
  if (days < 7) return "var(--danger)";
  if (days < 21) return "var(--warning)";
  return "var(--success)";
}

function getUrgencyBadge(
  days: number
): { label: string; className: string } | null {
  if (days <= 0)
    return {
      label: "NOW",
      className: "bg-red-500/20 text-red-400",
    };
  if (days < 7)
    return {
      label: "URGENT",
      className: "bg-red-500/15 text-red-400",
    };
  if (days < 14)
    return {
      label: "CRITICAL",
      className: "bg-amber-500/15 text-amber-400",
    };
  return null;
}

export default function CriticalDeadlines({ data }: CriticalDeadlinesProps) {
  // Sort events by date (nearest first), only include future/today events
  const futureEvents = [...data.events]
    .filter((e) => e.status === "active" && getDaysUntil(e.date) >= 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculate key stats
  const nextEventDays =
    futureEvents.length > 0 ? getDaysUntil(futureEvents[0].date) : 999;

  // Determine if any event is within 7 days for red border treatment
  const hasUrgentEvent = nextEventDays < 7;

  return (
    <div
      className={`rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-5 py-4 ${
        hasUrgentEvent ? "border-l-4 border-l-red-500" : ""
      }`}
      style={
        hasUrgentEvent
          ? { background: "linear-gradient(135deg, rgba(239,68,68,0.04) 0%, var(--card) 40%)" }
          : undefined
      }
    >
      {/* Header with inline stats */}
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
          <span className="text-[var(--accent)]">Signal 5</span> — Critical Deadlines
        </h2>
        <span className="text-xs text-[var(--text-secondary)]">
          Next event in{" "}
          <span className="font-bold tabular-nums" style={{ color: getDaysColor(nextEventDays) }}>
            {nextEventDays}
          </span>{" "}
          {nextEventDays === 1 ? "day" : "days"} | Supply gap:{" "}
          <span className="font-bold tabular-nums text-red-400">{data.currentGapMbd}</span>
          &rarr;
          <span className="font-bold tabular-nums text-red-400">{data.projectedGapMbd}</span> mb/d
        </span>
      </div>

      {/* Compact event chips */}
      <div className="flex flex-wrap gap-2">
        {futureEvents.map((event) => {
          const days = getDaysUntil(event.date);
          const badge = getUrgencyBadge(days);
          const isUrgent = days < 7;
          const isCritical = days >= 7 && days < 14;

          const chipClass = isUrgent
            ? "bg-red-500/15 text-red-400 border border-red-500/30"
            : isCritical
              ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
              : "bg-[var(--background)] text-[var(--text-secondary)] border border-[var(--card-border)]";

          return (
            <span
              key={event.id}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 ${chipClass}`}
            >
              <span className="text-xs font-medium">
                {formatEventDate(event.date)} &mdash; {event.event}
              </span>
              <span className="text-[10px] tabular-nums opacity-80">
                ({days === 0 ? "today" : `${days}d`})
              </span>
              {badge && (
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {badge.label}
                </span>
              )}
            </span>
          );
        })}
      </div>

      {/* Planned Refinery Turnarounds sub-panel */}
      {data.refineryTurnarounds && data.refineryTurnarounds.length > 0 && (
        <div className="mt-4 rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-4 py-3">
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300/90">
              Planned Refinery Turnarounds
            </span>
            <span className="text-[10px] text-[var(--text-secondary)]">
              Operational supply pressure layered onto the crisis
            </span>
          </div>
          <div className="flex flex-col divide-y divide-[var(--card-border)]">
            {data.refineryTurnarounds.map((t) => (
              <div
                key={t.id}
                className="grid grid-cols-1 gap-1 py-2 sm:grid-cols-12 sm:gap-3"
              >
                <div className="sm:col-span-3">
                  <div className="text-xs font-semibold text-[var(--text-primary)]">
                    {t.refiner}
                  </div>
                </div>
                <div className="sm:col-span-4">
                  <div className="text-xs tabular-nums text-[var(--text-secondary)]">
                    {t.capacityNote}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <div className="text-xs tabular-nums text-[var(--text-secondary)]">
                    {t.durationDays > 0 ? (
                      <>
                        {formatTurnaroundDate(t.startDate)}{" "}
                        <span className="text-[var(--card-border)]">→</span>{" "}
                        {turnaroundEnd(t)}
                      </>
                    ) : (
                      <>Already shut</>
                    )}
                  </div>
                  <div className="text-[10px] text-[var(--text-secondary)]">
                    {t.durationDays > 0
                      ? `${t.durationDays} days`
                      : "indefinite"}
                  </div>
                </div>
                <div className="sm:col-span-3">
                  <div className="text-[11px] italic leading-snug text-[var(--text-secondary)]">
                    {t.notes}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {data.refineryTurnaroundsNote && (
            <div className="mt-2 border-t border-[var(--card-border)] pt-2 text-[11px] italic leading-relaxed text-[var(--text-secondary)]">
              {data.refineryTurnaroundsNote}
            </div>
          )}
          {data.refineryTurnaroundsSource && (
            <div className="mt-1 text-[10px] text-[var(--text-secondary)]">
              Source: {data.refineryTurnaroundsSource}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
