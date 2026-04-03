"use client";

import type { SignalData } from "@/lib/types";
import { computeVerdict, type VerdictDirection } from "@/lib/verdict";
import { getDaysUntil } from "@/lib/utils";

interface VerdictBannerProps {
  data: SignalData;
  liveBrentPrice?: number;
}

const directionConfig: Record<
  VerdictDirection,
  {
    icon: string;
    borderColor: string;
    iconColor: string;
    accentBg: string;
    labelColor: string;
    severityBg: string;
    severityText: string;
  }
> = {
  higher: {
    icon: "\u25B2",
    borderColor: "border-l-red-500",
    iconColor: "text-red-400",
    accentBg: "bg-red-500/5",
    labelColor: "text-red-400",
    severityBg: "bg-red-500/15",
    severityText: "text-red-400",
  },
  lower: {
    icon: "\u25BC",
    borderColor: "border-l-green-500",
    iconColor: "text-green-400",
    accentBg: "bg-green-500/5",
    labelColor: "text-green-400",
    severityBg: "bg-green-500/15",
    severityText: "text-green-400",
  },
  uncertain: {
    icon: "\u25C6",
    borderColor: "border-l-yellow-500",
    iconColor: "text-yellow-400",
    accentBg: "bg-yellow-500/5",
    labelColor: "text-yellow-400",
    severityBg: "bg-yellow-500/15",
    severityText: "text-yellow-400",
  },
};

function getNextCliff(data: SignalData): { label: string; days: number } | null {
  let nearest: { label: string; days: number } | null = null;
  for (const event of data.timeline.events) {
    const days = getDaysUntil(event.date);
    if (days >= 0 && (nearest === null || days < nearest.days)) {
      nearest = { label: event.event, days };
    }
  }
  return nearest;
}

function formatCliffDate(event: { label: string; days: number }): string {
  if (event.days === 0) return "Today";
  if (event.days === 1) return "Tomorrow";
  return `${event.days}d`;
}

export default function VerdictBanner({ data, liveBrentPrice }: VerdictBannerProps) {
  // If live Brent price is available, compute verdict with live spread data
  const verdictData: SignalData = liveBrentPrice != null
    ? {
        ...data,
        oilSpread: {
          ...data.oilSpread,
          brent: liveBrentPrice,
          dubai: liveBrentPrice + (data.oilSpread.dubai - data.oilSpread.brent),
          spread: data.oilSpread.dubai - data.oilSpread.brent, // premium stays constant
        },
      }
    : data;
  const verdict = computeVerdict(verdictData);
  const config = directionConfig[verdict.direction];
  const nextCliff = getNextCliff(data);

  const supplyGapText =
    verdict.crisisCount >= 3
      ? `Supply gap: ${data.timeline.currentGapMbd} \u2192 ${data.timeline.projectedGapMbd} mb/d if cliff hits`
      : `Supply gap: ${data.timeline.currentGapMbd} mb/d, narrowing`;

  return (
    <div
      className={`w-full rounded-xl border border-[var(--card-border)] ${config.borderColor} border-l-4 ${config.accentBg} bg-[var(--card)] p-4 sm:p-5`}
    >
      <div className="flex flex-col gap-1.5">
        {/* Row 1: Direction + Severity + Signal count */}
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span className={`text-lg ${config.iconColor}`}>
            {config.icon}
          </span>
          <span
            className={`text-sm font-bold tracking-wide sm:text-base ${config.labelColor}`}
          >
            {verdict.directionLabel}
          </span>
          <span className="text-[var(--text-secondary)]">&middot;</span>
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${config.severityBg} ${config.severityText}`}
          >
            {verdict.severity}
          </span>
          <span className="text-[var(--text-secondary)]">&middot;</span>
          <span className="text-sm text-[var(--text-secondary)]">
            <span className="font-semibold text-[var(--text-primary)]">
              {verdict.crisisCount}/{verdict.signalCount}
            </span>{" "}
            signals crisis
          </span>
        </div>

        {/* Row 2: Supply gap + Next cliff */}
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 pl-7 text-xs text-[var(--text-secondary)] sm:text-sm">
          <span>{supplyGapText}</span>
          {nextCliff && (
            <>
              <span>&middot;</span>
              <span>
                Next cliff: <span className="font-medium text-[var(--text-primary)]">{formatCliffDate(nextCliff)}</span>
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
