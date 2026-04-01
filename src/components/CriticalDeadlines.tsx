"use client";

import type { TimelineSignal } from "@/lib/types";
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

  // Find the supply cliff event (the one with the largest supply gap contribution)
  const supplyCliffEvent = [...futureEvents].sort(
    (a, b) => b.supplyGapMbd - a.supplyGapMbd
  )[0];
  const supplyCliffDays = supplyCliffEvent
    ? getDaysUntil(supplyCliffEvent.date)
    : 999;

  // Determine if any event is within 7 days for red border treatment
  const hasUrgentEvent = nextEventDays < 7;

  return (
    <div
      className={`rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6 ${
        hasUrgentEvent ? "border-l-4 border-l-red-500" : ""
      }`}
      style={
        hasUrgentEvent
          ? { background: "linear-gradient(135deg, rgba(239,68,68,0.04) 0%, var(--card) 40%)" }
          : undefined
      }
    >
      {/* Header */}
      <h2 className="mb-5 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
        Critical Deadlines
      </h2>

      {/* Top stat boxes */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        {/* Next Event */}
        <div className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] p-4 text-center">
          <span
            className="text-3xl font-bold tabular-nums"
            style={{ color: getDaysColor(nextEventDays) }}
          >
            {nextEventDays}
          </span>
          <span
            className="ml-1 text-sm font-medium"
            style={{ color: getDaysColor(nextEventDays) }}
          >
            {nextEventDays === 1 ? "day" : "days"}
          </span>
          <p className="mt-1 text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
            Next Event
          </p>
        </div>

        {/* Supply Cliff */}
        <div className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] p-4 text-center">
          <span
            className="text-3xl font-bold tabular-nums"
            style={{ color: getDaysColor(supplyCliffDays) }}
          >
            {supplyCliffDays}
          </span>
          <span
            className="ml-1 text-sm font-medium"
            style={{ color: getDaysColor(supplyCliffDays) }}
          >
            {supplyCliffDays === 1 ? "day" : "days"}
          </span>
          <p className="mt-1 text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
            Supply Cliff
          </p>
        </div>

        {/* Projected Gap */}
        <div className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] p-4 text-center">
          <span className="text-2xl font-bold tabular-nums text-red-400">
            {data.currentGapMbd}
          </span>
          <span className="mx-1 text-sm text-[var(--text-secondary)]">
            &rarr;
          </span>
          <span className="text-2xl font-bold tabular-nums text-red-400">
            {data.projectedGapMbd}
          </span>
          <span className="ml-1 text-xs text-[var(--text-secondary)]">
            mb/d
          </span>
          <p className="mt-1 text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
            Projected Gap
          </p>
        </div>
      </div>

      {/* Event list */}
      <div className="flex flex-col gap-3">
        {futureEvents.map((event) => {
          const days = getDaysUntil(event.date);
          const badge = getUrgencyBadge(days);
          const isUrgent = days < 7;
          const isWarning = days >= 7 && days < 21;

          return (
            <div
              key={event.id}
              className="flex items-start justify-between gap-3"
            >
              {/* Left: icon + event details */}
              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                <span className="mt-0.5 shrink-0 text-sm" role="img" aria-label="event icon">
                  {isUrgent ? "\u26A1" : "\uD83D\uDD34"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-sm leading-tight ${
                        isUrgent
                          ? "font-bold text-red-400"
                          : isWarning
                            ? "font-semibold text-amber-400"
                            : "font-medium text-[var(--text-secondary)]"
                      }`}
                    >
                      {formatEventDate(event.date)} &mdash; {event.event}
                    </span>
                    <span
                      className="text-xs tabular-nums"
                      style={{ color: getDaysColor(days) }}
                    >
                      ({days === 0 ? "today" : `${days}d`})
                    </span>
                    {event.supplyGapMbd > 0 && (
                      <span
                        className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                        style={{
                          background: "rgba(239, 68, 68, 0.1)",
                          color: "var(--danger)",
                        }}
                      >
                        +{event.supplyGapMbd} mb/d
                      </span>
                    )}
                  </div>
                  <p
                    className={`mt-0.5 text-xs ${
                      isUrgent
                        ? "text-red-400/70"
                        : "text-[var(--text-secondary)]"
                    }`}
                  >
                    {event.impact}
                  </p>
                </div>
              </div>

              {/* Right: urgency badge */}
              {badge && (
                <span
                  className={`shrink-0 inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badge.className}`}
                >
                  {badge.label}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
