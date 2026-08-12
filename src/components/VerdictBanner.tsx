"use client";

import type { DiplomaticStatus, JawboneEvent, SignalData, WarEndingTrigger } from "@/lib/types";
import { computeVerdict, getDirectionalBias, type VerdictDirection } from "@/lib/verdict";
import { getDaysUntil } from "@/lib/utils";

const TRIGGER_ICON: Record<WarEndingTrigger["status"], string> = {
  "not occurred": "⊘",
  rumored: "◐",
  occurred: "●",
};

const TRIGGER_ICON_COLOR: Record<WarEndingTrigger["status"], string> = {
  "not occurred": "text-white/40",
  rumored: "text-amber-300",
  occurred: "text-emerald-300",
};

const TRIGGER_STATUS_BADGE: Record<WarEndingTrigger["status"], string> = {
  "not occurred": "bg-white/10 text-white/55",
  rumored: "bg-amber-500/20 text-amber-300",
  occurred: "bg-emerald-500/20 text-emerald-300",
};

const TRIGGER_STATUS_LABEL: Record<WarEndingTrigger["status"], string> = {
  "not occurred": "Not occurred",
  rumored: "Rumored",
  occurred: "Occurred",
};

/** Plain-language ladder labels for the diplomatic status enum (enum values stay untouched in data/types). */
const DIPLOMATIC_STATUS_LABEL: Record<DiplomaticStatus, string> = {
  NONE: "No talks",
  JAWBONE_ONLY: "Talk only — no terms",
  SPECIFIC_TERMS_LEAKED: "Draft deal on the table",
  PHYSICAL_CONFIRMATION: "Shipping data confirming",
  CONFIRMED: "Deal done",
};

const DIPLOMATIC_STATUS_PILL: Record<DiplomaticStatus, string> = {
  NONE: "bg-white/10 text-white/60",
  JAWBONE_ONLY: "bg-white/10 text-white/70",
  SPECIFIC_TERMS_LEAKED: "bg-amber-500/20 text-amber-300",
  PHYSICAL_CONFIRMATION: "bg-orange-500/20 text-orange-300",
  CONFIRMED: "bg-emerald-500/20 text-emerald-300",
};

const JAWBONE_OUTCOME_BADGE: Record<JawboneEvent["outcome"], string> = {
  unfulfilled: "bg-red-500/20 text-red-300 border-red-500/40",
  partial: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  pending: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  fulfilled: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
};

function formatLongDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function formatShortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** Defensively extract the first sentence of sweep-written prose (≤160 chars, ellipsis if truncated). */
function firstSentence(text: string, maxLen = 160): string {
  const idx = text.indexOf(". ");
  let s = idx > 0 ? text.slice(0, idx + 1) : text;
  if (s.length > maxLen) s = `${s.slice(0, maxLen - 1).trimEnd()}…`;
  return s;
}

function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(`${fromIso}T00:00:00Z`).getTime();
  const to = new Date(`${toIso}T00:00:00Z`).getTime();
  if (isNaN(from) || isNaN(to)) return 0;
  return Math.round((to - from) / (1000 * 60 * 60 * 24));
}

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
        {/* Peace-Deal Reality Check — plain-English diplomatic tracker, calibrated to physical gates, not rhetoric */}
        {data.diplomaticWatch && (() => {
          const dw = data.diplomaticWatch;
          const gatesMet = dw.physicalConfirmationGates.filter((g) => g.status === "met").length;
          const todayIso = new Date().toISOString().slice(0, 10);
          const liveMarkets = (dw.polymarketProbabilities ?? []).filter(
            (p) => daysBetween(todayIso, p.resolutionDate) > 0
          );
          const mou = dw.mouCountdown;
          const mouDaysPastDeadline = mou ? daysBetween(mou.deadline, todayIso) : 0;
          return (
          <div className={`mb-3 rounded-lg border ${
            dw.status === "JAWBONE_ONLY"
              ? "border-white/15 bg-white/[0.03]"
              : dw.status === "SPECIFIC_TERMS_LEAKED"
              ? "border-amber-500/40 bg-amber-500/5"
              : dw.status === "PHYSICAL_CONFIRMATION"
              ? "border-orange-500/50 bg-orange-500/10"
              : dw.status === "CONFIRMED"
              ? "border-green-500/50 bg-green-500/10"
              : "border-white/10 bg-white/[0.02]"
          } p-3 sm:p-4`}>
            {/* 1 — Header: plain title + status pill + latest date */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/80">
                Peace-Deal Reality Check
              </span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${DIPLOMATIC_STATUS_PILL[dw.status]}`}>
                {DIPLOMATIC_STATUS_LABEL[dw.status]}
              </span>
              <span className="ml-auto text-[10px] text-white/50">
                {dw.latestDate}
              </span>
            </div>

            {/* 2 — Logic line */}
            <p className="mt-2 text-[11px] leading-relaxed text-white/60">
              Officials have called a deal &ldquo;close&rdquo;{" "}
              <span className="font-bold tabular-nums text-white/85">{dw.jawboneCount}</span> times in{" "}
              <span className="font-bold tabular-nums text-white/85">{dw.daysSinceFirstJawbone}</span> days &mdash;{" "}
              <span className="font-bold tabular-nums text-white/85">{gatesMet}</span> confirmed by physical
              shipping data. Words don&rsquo;t reprice oil; ships, insurance and freight do.
            </p>

            {/* 3 — Latest, one line only (full headline lives in the details toggle) */}
            <p className="mt-1.5 text-[11px] leading-relaxed text-white/75">
              <span className="font-semibold text-white/90">Latest ({dw.latestDate}):</span>{" "}
              {firstSentence(dw.latestHeadline)}
            </p>

            {/* 4 — The gates: the actionable core */}
            <div className="mt-3 rounded-xl border border-white/15 bg-black/30 p-3">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/80">
                Five numbers that can&rsquo;t lie
              </div>
              <p className="mt-1 mb-2 text-[10.5px] leading-relaxed text-white/55">
                A deal is only real when these flip. Rhetoric can&rsquo;t move them &mdash; only actual ships,
                insurers and cargoes can.
              </p>
              <div className="space-y-1">
                {dw.physicalConfirmationGates.map((gate) => (
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
            </div>

            {/* Betting markets — only rendered while a market's resolution date is still in the future */}
            {liveMarkets.length > 0 && (
              <div className="mt-3 rounded-xl border border-white/15 bg-black/30 p-3">
                <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/80">
                  What betting markets expect
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {liveMarkets.map((p) => (
                    <div key={p.question} className="rounded border border-white/10 bg-black/20 px-2.5 py-2">
                      <p className="text-[11px] font-medium leading-snug text-white/85">{p.question}</p>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-lg font-extrabold tabular-nums text-white">
                          {p.currentProbabilityPct}%
                        </span>
                        <span className="text-[9px] uppercase tracking-wider text-white/45">
                          resolves {p.resolutionDate}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5 — War-ending checklist (details per row; no per-row date italics) */}
            {dw.warEndingTriggers && dw.warEndingTriggers.length > 0 && (
              <div className="mt-3 rounded-xl border border-white/15 bg-black/30 p-3">
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/80">
                  Three events that would actually end the war
                </div>
                <p className="mt-1 mb-1 text-[10.5px] leading-relaxed text-white/55">
                  Until one of these verifiably happens, any announced &ldquo;peace deal&rdquo; is a pause with a
                  press release.
                </p>
                <div>
                  {dw.warEndingTriggers.map((t) => (
                    <details key={t.id} className="border-b border-white/5 last:border-b-0">
                      <summary className="flex cursor-pointer list-none items-center gap-2 py-1.5 [&::-webkit-details-marker]:hidden">
                        <span className={`text-sm leading-none ${TRIGGER_ICON_COLOR[t.status]}`}>
                          {TRIGGER_ICON[t.status]}
                        </span>
                        <span className="flex-1 text-[11px] font-medium text-white/85">{t.label}</span>
                        <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${TRIGGER_STATUS_BADGE[t.status]}`}>
                          {TRIGGER_STATUS_LABEL[t.status]}
                        </span>
                      </summary>
                      <p className="pb-1.5 pl-6 text-[10.5px] leading-relaxed text-white/55">
                        {t.detail}
                        {t.source ? <> &middot; {t.source}</> : null}
                      </p>
                    </details>
                  ))}
                </div>
                <p className="mt-1.5 text-[9px] text-white/40">
                  Framework: Erik Townsend, Macrovoices &middot; checked by daily sweep
                </p>
              </div>
            )}

            {/* 6 — Deadline fact: expired window rendered as a fact, not a live countdown */}
            {mou && (mouDaysPastDeadline > 0 ? (
              <p className="mt-3 text-[11px] leading-relaxed text-amber-300/90">
                &#9201; The {mou.negotiationWindowDays}-day negotiation window signed {formatShortDate(mou.mouSignedDate)} expired {formatShortDate(mou.deadline)} &mdash; talks are now{" "}
                <span className="font-bold tabular-nums">{mouDaysPastDeadline}</span> days past their own deadline.
              </p>
            ) : (
              <p className="mt-3 text-[11px] leading-relaxed text-white/70">
                &#9201; <span className="font-bold tabular-nums text-white">{Math.abs(mouDaysPastDeadline)}</span> days
                left in the {mou.negotiationWindowDays}-day negotiation window signed {formatShortDate(mou.mouSignedDate)} (deadline {formatShortDate(mou.deadline)}).
              </p>
            ))}

            {/* 7 — Full intel note: sweep-written prose + reference blocks */}
            <details className="mt-3">
              <summary className="cursor-pointer list-none text-[10px] font-bold uppercase tracking-[0.18em] text-white/60 hover:text-white/80 [&::-webkit-details-marker]:hidden">
                Full intel note &#9662;
              </summary>
              <div className="mt-2 space-y-3">
                <p className="text-[11px] leading-relaxed text-white/75">
                  <span className="font-semibold text-white/90">Full headline:</span>{" "}
                  &ldquo;{dw.latestHeadline}&rdquo; &mdash; {dw.latestSource}
                </p>

                <p className="text-[11px] italic leading-relaxed text-white/65">
                  {dw.interpretation}
                </p>

                <p className="text-[10.5px] leading-relaxed text-white/60">
                  <span className="font-semibold text-white/75">If the deal goes through:</span>{" "}
                  {dw.impactIfConfirmed}
                </p>
                <p className="text-[10.5px] leading-relaxed text-white/60">
                  <span className="font-semibold text-white/75">If the talking continues without a deal:</span>{" "}
                  {dw.impactIfJawboneContinues}
                </p>

                {dw.jawboneHistory && dw.jawboneHistory.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">
                      Every &ldquo;deal close&rdquo; claim so far
                    </p>
                    <div className="space-y-1.5">
                      {dw.jawboneHistory.map((ev) => (
                        <div key={ev.date} className="rounded border border-white/10 bg-black/20 px-2.5 py-1.5">
                          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                            <span className="text-[10.5px] font-bold tabular-nums text-white/85">
                              {formatLongDate(ev.date)}
                            </span>
                            <span className={`rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${JAWBONE_OUTCOME_BADGE[ev.outcome]}`}>
                              {ev.outcome}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[10.5px] leading-snug text-white/75">{ev.headline}</p>
                          {ev.outcomeNote && (
                            <p className="mt-0.5 text-[10px] italic leading-relaxed text-white/50">
                              {ev.outcomeNote}
                            </p>
                          )}
                          <p className="mt-0.5 text-[9px] uppercase tracking-wider text-white/35">{ev.source}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {dw.heuStockpile && (
                  <div className="rounded border border-white/10 bg-black/20 px-2.5 py-2 text-[10.5px] leading-relaxed text-white/60">
                    <p className="font-semibold text-white/80">
                      Iran&rsquo;s enriched-uranium stockpile &mdash; the fact underneath the war
                    </p>
                    <p className="mt-1">
                      {dw.heuStockpile.kg} kg enriched to {dw.heuStockpile.enrichmentPct}% &mdash; roughly{" "}
                      {dw.heuStockpile.weaponsFromStock} weapons&rsquo; worth of material, with only ~{dw.heuStockpile.swuToWeaponsGradePct}% of the
                      enrichment work remaining and an estimated {dw.heuStockpile.timeToOneWeaponDays} days to a
                      first weapon ({dw.heuStockpile.timeToNineWeaponsWeeks} weeks to all nine).
                    </p>
                    <p className="mt-1">
                      <span className="font-semibold text-white/75">Where it is:</span> {dw.heuStockpile.currentLocation}
                    </p>
                    <p className="mt-1">
                      <span className="font-semibold text-white/75">Verification:</span> {dw.heuStockpile.verificationStatus}
                    </p>
                    <p className="mt-1">
                      <span className="font-semibold text-white/75">Physical form:</span> {dw.heuStockpile.cylinderCount}
                    </p>
                    <p className="mt-1 text-[9px] italic text-white/35">Source: {dw.heuStockpile.source}</p>
                  </div>
                )}

                {dw.straitAuthorityTolls && (
                  <div className="rounded border border-white/10 bg-black/20 px-2.5 py-2 text-[10.5px] leading-relaxed text-white/60">
                    <p className="font-semibold text-white/80">
                      Iran&rsquo;s toll booth on the Strait &mdash; why it won&rsquo;t walk away
                    </p>
                    <p className="mt-1">
                      Fee: {dw.straitAuthorityTolls.perTransitFee} &middot; Estimated take:{" "}
                      {dw.straitAuthorityTolls.estimatedAnnualTolls}
                    </p>
                    <p className="mt-1">
                      <span className="font-semibold text-red-300/85">Banned:</span> {dw.straitAuthorityTolls.excludedVessels}
                    </p>
                    <p className="mt-1">
                      <span className="font-semibold text-emerald-300/85">Permitted:</span> {dw.straitAuthorityTolls.permittedVessels}
                    </p>
                    <p className="mt-1 text-[9px] italic text-white/35">{dw.straitAuthorityTolls.sourceNote}</p>
                  </div>
                )}
              </div>
            </details>
          </div>
          );
        })()}

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

        </div>
    </div>
  );
}
