"use client";

import type { TimelineSignal as TimelineSignalType, TimelineEvent } from "@/lib/types";
import { getDaysUntil, getTimelineStatus } from "@/lib/utils";
import SignalCard from "./SignalCard";

interface TimelineSignalProps {
  data: TimelineSignalType;
}

function formatEventDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00Z");
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function getCountdownLabel(days: number): string {
  if (days === 0) return "TODAY";
  if (days === 1) return "in 1 day";
  if (days < 0) return `${Math.abs(days)}d ago`;
  return `in ${days} days`;
}

function getEventDotColor(event: TimelineEvent): string {
  if (event.status === "extended") return "bg-green-500";
  if (event.status === "expired") return "bg-red-500";
  // active status — color based on proximity
  const days = getDaysUntil(event.date);
  if (days <= 0) return "bg-red-500";
  if (days <= 7) return "bg-yellow-500";
  return "bg-yellow-500";
}

function getEventDotPulse(event: TimelineEvent): boolean {
  if (event.status === "expired" || event.status === "extended") return false;
  const days = getDaysUntil(event.date);
  return days <= 7;
}

function getEventBadge(
  event: TimelineEvent
): { label: string; className: string } | null {
  if (event.status === "expired") {
    return {
      label: "EXPIRED",
      className: "bg-red-500/15 text-red-400",
    };
  }
  if (event.status === "extended") {
    return {
      label: "EXTENDED",
      className: "bg-green-500/15 text-green-400",
    };
  }
  const days = getDaysUntil(event.date);
  if (days === 0) {
    return {
      label: "TODAY",
      className: "bg-red-500/15 text-red-400",
    };
  }
  if (days < 0) {
    return {
      label: "ACTIVE",
      className: "bg-yellow-500/15 text-yellow-400",
    };
  }
  return null;
}

export default function TimelineSignal({ data }: TimelineSignalProps) {
  // Sort events by date (earliest first)
  const sortedEvents = [...data.events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Find nearest future event for status calculation
  const futureEvents = sortedEvents.filter((e) => getDaysUntil(e.date) >= 0);
  const nearestFutureEvent = futureEvents[0];
  const daysUntilNearest = nearestFutureEvent
    ? getDaysUntil(nearestFutureEvent.date)
    : 999;

  const status = getTimelineStatus(daysUntilNearest);
  const statusLabel =
    status === "red"
      ? "Imminent"
      : status === "yellow"
        ? "Approaching"
        : "Distant";

  // Count events expiring within 7 days for critical warning
  const urgentEvents = sortedEvents.filter((e) => {
    const days = getDaysUntil(e.date);
    return days >= 0 && days <= 7 && e.status === "active";
  });
  const showWarning = urgentEvents.length > 0 && daysUntilNearest <= 7;

  return (
    <SignalCard
      title="Mid-April Supply Cliff"
      subtitle="Emergency measures expiring — countdown to disruption"
      status={status}
      statusLabel={statusLabel}
      lastUpdated={data.lastUpdated}
      source="BCA Research, IEA, industry reports"
    >
      <div className="flex flex-col gap-5">
        {/* Supply gap hero stat */}
        <div className="rounded-lg bg-[var(--background)] px-4 py-4">
          <div className="flex items-baseline gap-3 flex-wrap">
            <div>
              <span className="text-sm text-[var(--text-secondary)]">
                Current gap:
              </span>
              <span className="ml-2 text-3xl font-bold text-[var(--text-primary)]">
                {data.currentGapMbd} mb/d
              </span>
            </div>
            <span className="text-2xl text-[var(--text-secondary)]">&rarr;</span>
            <div>
              <span className="text-sm text-[var(--text-secondary)]">
                Projected:
              </span>
              <span
                className="ml-2 text-3xl font-bold"
                style={{ color: "var(--danger)" }}
              >
                {data.projectedGapMbd} mb/d
              </span>
            </div>
          </div>
          <p className="mt-2 text-xs text-[var(--text-secondary)]">
            Largest crude disruption ever if realized
          </p>
        </div>

        {/* Critical warning banner */}
        {showWarning && (
          <div
            className="flex items-center gap-2 rounded-lg px-4 py-3"
            style={{
              background: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.25)",
            }}
          >
            <span className="text-lg" role="img" aria-label="warning">
              &#9888;
            </span>
            <span
              className="text-sm font-medium"
              style={{ color: "var(--danger)" }}
            >
              Multiple emergency measures expire within {daysUntilNearest}{" "}
              {daysUntilNearest === 1 ? "day" : "days"}
            </span>
          </div>
        )}

        {/* Event timeline */}
        <div className="relative">
          {sortedEvents.map((event, index) => {
            const days = getDaysUntil(event.date);
            const isLast = index === sortedEvents.length - 1;
            const isPast =
              event.status === "expired" || (days < 0 && event.status !== "extended");
            const dotColor = getEventDotColor(event);
            const hasPulse = getEventDotPulse(event);
            const badge = getEventBadge(event);

            return (
              <div
                key={event.id}
                className="relative flex gap-4 pb-6"
                style={{ opacity: isPast ? 0.5 : 1 }}
              >
                {/* Timeline connector */}
                <div className="flex flex-col items-center">
                  {/* Dot */}
                  <div className="relative flex h-4 w-4 shrink-0 items-center justify-center">
                    {hasPulse && (
                      <span
                        className={`absolute inline-flex h-full w-full animate-ping rounded-full ${dotColor} opacity-50`}
                      />
                    )}
                    <span
                      className={`relative inline-flex h-3 w-3 rounded-full ${dotColor}`}
                    />
                  </div>
                  {/* Vertical line */}
                  {!isLast && (
                    <div
                      className="w-px grow"
                      style={{
                        background: "var(--card-border)",
                        minHeight: "2rem",
                      }}
                    />
                  )}
                </div>

                {/* Event content */}
                <div className="min-w-0 flex-1 -mt-0.5 pb-1">
                  {/* Event name + badge */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-[var(--text-primary)]">
                      {event.event}
                    </span>
                    {badge && (
                      <span
                        className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    )}
                  </div>

                  {/* Date + countdown */}
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs text-[var(--text-secondary)]">
                      {formatEventDate(event.date)}
                    </span>
                    <span className="text-xs text-[var(--text-secondary)]">
                      &mdash;
                    </span>
                    <span
                      className="text-xs font-semibold"
                      style={{
                        color:
                          days <= 0
                            ? "var(--danger)"
                            : days <= 7
                              ? "var(--warning)"
                              : "var(--text-secondary)",
                      }}
                    >
                      {getCountdownLabel(days)}
                    </span>
                  </div>

                  {/* Impact description */}
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    {event.impact}
                  </p>

                  {/* Supply gap contribution badge */}
                  <span
                    className="mt-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
                    style={{
                      background: "rgba(239, 68, 68, 0.1)",
                      color: "var(--danger)",
                    }}
                  >
                    +{event.supplyGapMbd} mb/d
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SignalCard>
  );
}
