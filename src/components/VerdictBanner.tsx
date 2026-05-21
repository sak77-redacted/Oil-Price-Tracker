"use client";

import type { SignalData } from "@/lib/types";
import { computeVerdict, getDirectionalBias, type VerdictDirection } from "@/lib/verdict";
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
  const bias = getDirectionalBias(verdict.composite);
  const biasArrow = bias.direction === "higher" ? "↑" : bias.direction === "lower" ? "↓" : "◆";
  const biasLabel = bias.direction === "higher" ? "HIGHER" : bias.direction === "lower" ? "LOWER" : "UNCERTAIN";

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
        {/* Diplomatic Jawbone Tracking — calibrated to physical confirmation gates, not rhetoric */}
        {data.diplomaticWatch && (
          <div className={`mb-3 rounded-lg border ${
            data.diplomaticWatch.status === "JAWBONE_ONLY"
              ? "border-white/15 bg-white/[0.03]"
              : data.diplomaticWatch.status === "SPECIFIC_TERMS_LEAKED"
              ? "border-amber-500/40 bg-amber-500/5"
              : data.diplomaticWatch.status === "PHYSICAL_CONFIRMATION"
              ? "border-orange-500/50 bg-orange-500/10"
              : data.diplomaticWatch.status === "CONFIRMED"
              ? "border-green-500/50 bg-green-500/10"
              : "border-white/10 bg-white/[0.02]"
          } p-3 sm:p-4`}>
            <div className="flex items-start gap-3">
              <span className="text-xl text-white/60">
                {data.diplomaticWatch.status === "JAWBONE_ONLY" ? "\u{1F4AC}" : "⚠"}
              </span>
              <div className="flex-1">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/80">
                    Diplomatic Jawbone Tracking &middot; {data.diplomaticWatch.status.replace(/_/g, " ")}
                  </span>
                  <span className="text-[10px] text-white/50">
                    {data.diplomaticWatch.latestDate}
                  </span>
                </div>

                {/* Jawbone counter */}
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
                  <span className="text-white/70">
                    <span className="font-bold tabular-nums text-white">{data.diplomaticWatch.jawboneCount}</span> statements
                  </span>
                  <span className="text-white/40">&middot;</span>
                  <span className="text-white/70">
                    <span className="font-bold tabular-nums text-white">{data.diplomaticWatch.daysSinceFirstJawbone}</span> days since first
                  </span>
                  <span className="text-white/40">&middot;</span>
                  <span className="text-white/70">
                    <span className="font-bold tabular-nums text-white">0</span> physical confirmations
                  </span>
                </div>

                <p className="mt-2 text-[11px] leading-relaxed text-white/75">
                  <span className="font-semibold text-white/90">Latest:</span> &ldquo;{data.diplomaticWatch.latestHeadline}&rdquo; &mdash; {data.diplomaticWatch.latestSource}
                </p>

                <p className="mt-2 text-[11px] leading-relaxed italic text-white/65">
                  {data.diplomaticWatch.interpretation}
                </p>

                {/* Physical Confirmation Gates mini-table */}
                <div className="mt-3 rounded border border-white/10 bg-black/30 p-2.5">
                  <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">
                    Physical Confirmation Gates
                  </div>
                  <div className="space-y-1">
                    {data.diplomaticWatch.physicalConfirmationGates.map((gate) => (
                      <div key={gate.label} className="flex items-baseline justify-between gap-2 border-b border-white/5 pb-1 text-[11px] last:border-b-0 last:pb-0">
                        <span className="text-white/65">{gate.label}</span>
                        <span className="flex items-center gap-2">
                          <span className="tabular-nums text-white/75">{gate.currentValue}</span>
                          <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                            gate.status === "met"
                              ? "bg-green-500/20 text-green-300"
                              : gate.status === "approaching"
                              ? "bg-amber-500/20 text-amber-300"
                              : "bg-white/10 text-white/55"
                          }`}>
                            {gate.status}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-[10px] italic text-white/45">
                    Status escalates only when gates flip from &lsquo;not met&rsquo; &rarr; &lsquo;approaching&rsquo; &rarr; &lsquo;met&rsquo;. Rhetoric alone does not escalate.
                  </div>
                </div>

                <p className="mt-2 text-[10px] italic leading-relaxed text-white/55">
                  <span className="font-semibold not-italic text-white/70">If jawbone continues:</span> {data.diplomaticWatch.impactIfJawboneContinues}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Morgan Downey 30-Day Stress Test — only shown when direction = higher */}
        {verdict.direction === "higher" && (
          <div className="mb-3 rounded-lg border-2 border-red-500/50 bg-red-500/5 p-3 sm:p-4">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300">
                {"⏱"} 30-Day Stress Test
              </span>
              <span className="text-[10px] text-amber-200/65">
                · Morgan Downey, May 21
              </span>
            </div>
            <p className="mt-2 text-[12px] font-medium italic leading-relaxed text-amber-200/95">
              &ldquo;&gt;50% probability of $150–200 oil within 30 days at current
              pace. Even if peace declared today, $150+ within 2 months
              (restart flywheel). Working-capital efficiency cushion (~1Bn bbl
              over 5 years) has been spent into this crisis.&rdquo;
            </p>
            <p className="mt-1.5 text-[10px] text-amber-200/55">
              Source: Macrovoices Ep. 533
            </p>
          </div>
        )}

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
              {liveBrentPrice != null && (
                <span className="text-sm text-[var(--text-secondary)]">
                  Brent <span className="text-lg font-bold tabular-nums text-white">${liveBrentPrice.toFixed(2)}</span>
                </span>
              )}
              <span className={`text-sm font-bold ${config.labelColor}`}>
                {config.icon} Projected: ${wtiImpact.low}&ndash;${wtiImpact.high}
              </span>
              <span className={`text-xs ${config.subtextColor}`}>
                (+{Math.round(((wtiImpact.low - wtiImpact.current) / wtiImpact.current) * 100)}% to +{Math.round(((wtiImpact.high - wtiImpact.current) / wtiImpact.current) * 100)}%)
              </span>
            </div>
          )}

          {/* 5-day directional bias — sharpens the call for the actionability tier */}
          <div className={`flex flex-wrap items-baseline gap-x-2 gap-y-1 pl-9 text-sm font-semibold ${config.labelColor}`}>
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">Bias</span>
            <span>{biasArrow} {biasLabel}</span>
            <span className="text-xs font-normal text-white/55">over next {bias.horizonDays} trading days</span>
            <span className="text-white/30">·</span>
            <span className={`tabular-nums ${config.labelColor}`}>{bias.confidencePct}% confidence</span>
          </div>

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

          {/* Reopening Scenario Sensitivity — Kpler/JH thesis */}
          <div className="mt-2 rounded-lg border border-white/10 bg-black/30 p-3 sm:p-4">
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/80">
                Reopening Scenario Sensitivity
              </span>
              <span className="text-[10px] text-white/50">
                Even the bear case has a floor — reopening is not binary
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {/* Status quo */}
              <div className="rounded-md border border-red-500/25 bg-red-500/5 p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-red-300/90">
                  Status quo · Strait closed
                </div>
                <div className="mt-1 text-sm font-bold tabular-nums text-white">
                  Brent ${verdict.reopeningScenario.statusQuo.brentLow}–{verdict.reopeningScenario.statusQuo.brentHigh}
                </div>
                <div className="mt-0.5 text-[11px] tabular-nums text-white/70">
                  Dubai Physical ${verdict.reopeningScenario.statusQuo.dubaiLow}–{verdict.reopeningScenario.statusQuo.dubaiHigh}
                </div>
                <div className="mt-1.5 text-[10px] text-white/50">
                  Current trajectory
                </div>
              </div>

              {/* Iranian-controlled reopening */}
              <div className="rounded-md border border-amber-500/25 bg-amber-500/5 p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-300/90">
                  Iranian-controlled reopening · 40–50% capacity
                </div>
                <div className="mt-1 text-sm font-bold tabular-nums text-white">
                  Brent ${verdict.reopeningScenario.iranianControlled.brentLow}–{verdict.reopeningScenario.iranianControlled.brentHigh}
                </div>
                <div className="mt-0.5 text-[11px] tabular-nums text-white/70">
                  Dubai Physical ${verdict.reopeningScenario.iranianControlled.dubaiLow}–{verdict.reopeningScenario.iranianControlled.dubaiHigh}
                </div>
                <div className="mt-1.5 text-[10px] text-white/50">
                  Bull case has a floor — not a binary
                </div>
              </div>
            </div>

            {/* Sellside Consensus vs HFI — May 19, 2026 */}
            <div className="mt-3 rounded-md border border-white/10 bg-black/40 p-3">
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/80">
                  Sellside Consensus vs HFI
                </span>
                <span className="text-[10px] italic text-white/50">
                  Reopening scenario debate · May 19, 2026
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="rounded border border-white/10 bg-black/20 px-3 py-2">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-white/55">
                    Sellside consensus
                  </div>
                  <div className="mt-0.5 text-[10px] text-white/45">
                    JPM, Goldman, Morgan Stanley
                  </div>
                  <p className="mt-1.5 text-[11px] italic leading-relaxed text-white/55">
                    &ldquo;Strait reopens June 1, Brent ~$100 through year-end. JPM Fig 1: 2026 inventories plunge from ~8,400 Mb in Feb to ~7,700 Mb by June — base case requires reopening to avoid tank-bottom.&rdquo;
                  </p>
                </div>
                <div className="rounded border border-amber-500/30 bg-amber-500/5 px-3 py-2">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-300/90">
                    HFI position
                  </div>
                  <div className="mt-0.5 text-[10px] text-amber-200/60">
                    HFI Research, May 19, 2026
                  </div>
                  <p className="mt-1.5 text-[11px] font-medium leading-relaxed text-amber-200/90">
                    &ldquo;Point of no return crossed. Logistical constraints push restart to August at earliest — ballast tankers redirected to US drainage cannot return to the Persian Gulf in time. Anchoring biases lower probability of diplomatic resolution daily.&rdquo;
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-2 text-[10px] leading-relaxed text-white/60">
              <span className="font-semibold text-white/75">Why capped:</span>{" "}
              new transit-permit process, insurance/compliance frictions in Iranian territorial waters, IRGC transit fees (US-sanctioned), and complex routing vs. standard IMO traffic separation.
            </div>
            <div className="mt-2 rounded border border-white/10 bg-black/20 px-3 py-2 text-[10px] italic leading-relaxed text-white/65">
              <span className="font-semibold not-italic text-white/80">
                Why even 40–50% capacity is optimistic:
              </span>{" "}
              Asian refineries are designed for low-TAN low-metals Middle East crude. Canadian (TAN 1.86) and Latin American heavy alternatives can&apos;t be processed without blending against scarce low-TAN feedstock — every 550 kb TMX cargo needs ~6 mb of low-TAN blend. Available barrels ≠ runnable barrels.{" "}
              <span className="not-italic text-white/50">
                Source: June Goh, Trade with Conviction (May 8, 2026).
              </span>
            </div>
            <div className="mt-1 text-[10px] italic text-white/45">
              Source: {verdict.reopeningScenario.source}
            </div>
            <blockquote className="mt-2 border-l-2 border-amber-500/40 pl-3 text-[11px] italic leading-relaxed text-white/75">
              <p>
                &ldquo;Even should a deal be reached tonight, the physical reality check is still ahead. We&apos;ve been saying we&apos;re missing 15 million barrels per day — it&apos;s just taking longer to filter through to the entire physical market.&rdquo;
              </p>
              <footer className="mt-1 not-italic text-[10px] text-white/55">
                <span className="font-semibold text-amber-300/80">
                  Neil Crosby
                </span>
                <span className="mx-1.5 text-white/25">·</span>
                <span>May 8, 2026</span>
              </footer>
            </blockquote>
          </div>
        </div>
    </div>
  );
}
