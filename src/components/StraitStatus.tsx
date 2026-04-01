"use client";

import type { StraitStatus as StraitStatusType } from "@/lib/types";

interface StraitStatusProps {
  data: StraitStatusType;
}

const statusConfig: Record<
  StraitStatusType["status"],
  {
    label: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
  }
> = {
  open: {
    label: "OPEN",
    badgeBg: "bg-green-500/10",
    badgeText: "text-green-400",
    badgeBorder: "border-green-500/30",
  },
  restricted: {
    label: "RESTRICTED",
    badgeBg: "bg-amber-500/10",
    badgeText: "text-amber-400",
    badgeBorder: "border-amber-500/30",
  },
  closed: {
    label: "CLOSED",
    badgeBg: "bg-red-500/10",
    badgeText: "text-red-400",
    badgeBorder: "border-red-500/30",
  },
};

function computeDays(since: string): number {
  const diff = Date.now() - new Date(since).getTime();
  if (diff < 0) return 0;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function formatSinceDate(since: string): string {
  const date = new Date(since);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function StraitStatus({ data }: StraitStatusProps) {
  const days = computeDays(data.since);
  const config = statusConfig[data.status];

  return (
    <div className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-4 sm:p-5">
      <div className="flex flex-col gap-2">
        {/* Row 1: Status badge + duration */}
        <div className="flex flex-wrap items-center gap-2.5">
          <span
            className={`inline-block rounded-full border px-3 py-0.5 text-xs font-bold tracking-widest ${config.badgeBg} ${config.badgeText} ${config.badgeBorder}`}
          >
            {config.label}
          </span>
          <span className="text-sm text-[var(--text-secondary)]">
            <span className="font-semibold tabular-nums text-[var(--text-primary)]">
              {days}
            </span>{" "}
            days (since {formatSinceDate(data.since)})
          </span>
        </div>

        {/* Row 2: Description */}
        <p className="max-w-4xl text-sm leading-relaxed text-[var(--text-secondary)]">
          {data.description}
        </p>
      </div>
    </div>
  );
}
