"use client";

import type { SignalData } from "@/lib/types";
import { computeVerdict, type VerdictDirection } from "@/lib/verdict";
import { getDaysUntil } from "@/lib/utils";

interface VerdictBannerProps {
  data: SignalData;
  liveBrentPrice?: number;
  wtiPrice?: number;
}

const directionConfig: Record<
  VerdictDirection,
  {
    icon: string;
    borderColor: string;
    iconColor: string;
    bgGradient: string;
    labelColor: string;
    severityBg: string;
    severityText: string;
    subtextColor: string;
  }
> = {
  higher: {
    icon: "\u25B2",
    borderColor: "border-red-500/40",
    iconColor: "text-red-300",
    bgGradient: "linear-gradient(135deg, rgba(220, 38, 38, 0.25) 0%, rgba(153, 27, 27, 0.15) 50%, rgba(18, 18, 26, 0.95) 100%)",
    labelColor: "text-red-300",
    severityBg: "bg-red-500/25",
    severityText: "text-red-300",
    subtextColor: "text-red-200/70",
  },
  lower: {
    icon: "\u25BC",
    borderColor: "border-green-500/40",
    iconColor: "text-green-300",
    bgGradient: "linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(22, 101, 52, 0.1) 50%, rgba(18, 18, 26, 0.95) 100%)",
    labelColor: "text-green-300",
    severityBg: "bg-green-500/25",
    severityText: "text-green-300",
    subtextColor: "text-green-200/70",
  },
  uncertain: {
    icon: "\u25C6",
    borderColor: "border-yellow-500/40",
    iconColor: "text-yellow-300",
    bgGradient: "linear-gradient(135deg, rgba(234, 179, 8, 0.2) 0%, rgba(161, 98, 7, 0.1) 50%, rgba(18, 18, 26, 0.95) 100%)",
    labelColor: "text-yellow-300",
    severityBg: "bg-yellow-500/25",
    severityText: "text-yellow-300",
    subtextColor: "text-yellow-200/70",
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

export default function VerdictBanner({ data, liveBrentPrice, wtiPrice }: VerdictBannerProps) {
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

  // WTI projected impact based on crisis score
  const wtiImpact = wtiPrice != null ? (() => {
    const gap = data.timeline.currentGapMbd;
    if (gap >= 5 && verdict.crisisCount >= 3) {
      const low = Math.round(wtiPrice + 15);
      const high = Math.round(wtiPrice + 38);
      return { current: wtiPrice, low, high };
    }
    if (gap >= 5) {
      const low = Math.round(wtiPrice + 10);
      const high = Math.round(wtiPrice + 25);
      return { current: wtiPrice, low, high };
    }
    if (gap >= 3) {
      const low = Math.round(wtiPrice - 5);
      const high = Math.round(wtiPrice + 10);
      return { current: wtiPrice, low, high };
    }
    return null;
  })() : null;

  return (
    <div
      className={`w-full rounded-xl border ${config.borderColor} p-5 sm:p-6`}
      style={{ background: config.bgGradient }}
    >
        <div className="flex flex-col gap-3">
          {/* Row 1: Direction label + severity + signal count */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className={`text-2xl ${config.iconColor}`}>
              {config.icon}
            </span>
            <span
              className={`text-lg font-extrabold tracking-wide sm:text-xl ${config.labelColor}`}
            >
              {verdict.directionLabel}
            </span>
            <span
              className={`inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${config.severityBg} ${config.severityText} border ${config.borderColor}`}
            >
              {verdict.severity}
            </span>
            <span className={`text-sm font-semibold ${config.labelColor}`}>
              {verdict.crisisCount}/{verdict.signalCount} signals crisis
            </span>
          </div>

          {/* Row 2: WTI price + projected impact */}
          {wtiImpact && (
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 pl-9">
              <span className="text-sm text-[var(--text-secondary)]">
                WTI Crude <span className="text-lg font-bold tabular-nums text-white">${wtiImpact.current.toFixed(2)}</span>
              </span>
              <span className={`text-sm font-bold ${config.labelColor}`}>
                {config.icon} Projected: ${wtiImpact.low}&ndash;${wtiImpact.high}
              </span>
              <span className={`text-xs ${config.subtextColor}`}>
                (+{Math.round(((wtiImpact.low - wtiImpact.current) / wtiImpact.current) * 100)}% to +{Math.round(((wtiImpact.high - wtiImpact.current) / wtiImpact.current) * 100)}%)
              </span>
            </div>
          )}

          {/* Row 3: Supply gap + Next cliff */}
          <div className={`flex flex-wrap items-center gap-x-2.5 gap-y-1 pl-9 text-xs sm:text-sm ${config.subtextColor}`}>
            <span>{supplyGapText}</span>
            {nextCliff && (
              <>
                <span>&middot;</span>
                <span>
                  Next cliff: <span className="font-bold text-white">{formatCliffDate(nextCliff)}</span>
                </span>
              </>
            )}
          </div>
        </div>
    </div>
  );
}
