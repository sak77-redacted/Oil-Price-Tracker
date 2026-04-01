"use client";

import type { CrisisEvent } from "@/lib/types";

interface CrisisTimelineProps {
  data: CrisisEvent[];
}

const categoryConfig = {
  diplomatic: {
    dotColor: "bg-amber-400",
    borderColor: "border-amber-400/50",
    textColor: "text-amber-400",
    label: "DIPLOMATIC",
  },
  military: {
    dotColor: "bg-red-400",
    borderColor: "border-red-400/50",
    textColor: "text-red-400",
    label: "MILITARY",
  },
  economic: {
    dotColor: "bg-blue-400",
    borderColor: "border-blue-400/50",
    textColor: "text-blue-400",
    label: "ECONOMIC",
  },
} as const;

function formatEventDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function CrisisTimeline({ data }: CrisisTimelineProps) {
  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6">
      <h2 className="mb-5 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
        Crisis Timeline
      </h2>

      <div className="relative">
        {data.map((event, index) => {
          const config = categoryConfig[event.category];
          const isLast = index === data.length - 1;

          return (
            <div key={`${event.date}-${index}`} className="relative flex gap-4">
              {/* Timeline spine + dot */}
              <div className="flex flex-col items-center">
                <div
                  className={`z-10 h-2.5 w-2.5 shrink-0 rounded-full ${config.dotColor}`}
                />
                {!isLast && (
                  <div className="w-0.5 grow bg-[var(--card-border)]" />
                )}
              </div>

              {/* Event content */}
              <div className={`min-w-0 ${isLast ? "pb-0" : "pb-6"}`}>
                {/* Date + category badge */}
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs text-[var(--text-secondary)]">
                    {formatEventDate(event.date)}
                  </span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase leading-none tracking-wider ${config.borderColor} ${config.textColor}`}
                  >
                    {config.label}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-base font-semibold text-[var(--text-primary)]">
                  {event.title}
                </h3>

                {/* Description */}
                <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {event.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
