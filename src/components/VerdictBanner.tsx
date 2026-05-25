"use client";

import type { JawboneEvent, SignalData, WarEndingTrigger } from "@/lib/types";
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

                {/* Sub-panel A — War-Ending Triggers (Townsend falsifiability framework) */}
                {data.diplomaticWatch.warEndingTriggers && data.diplomaticWatch.warEndingTriggers.length > 0 && (
                  <div className="mt-3 rounded border border-amber-500/25 bg-black/30 p-3">
                    <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300/90">
                        War-Ending Triggers
                      </span>
                      <span className="text-[10px] italic text-white/45">
                        per Erik Townsend, Macrovoices &middot; May 24, 2026
                      </span>
                    </div>
                    <p className="mb-2.5 text-[11px] leading-relaxed text-white/65">
                      The three discrete events that would actually end this war. Until one is in a signed text, every &ldquo;peace deal&rdquo; is a tactical pause dressed up as an ending.
                    </p>
                    <div className="space-y-2">
                      {data.diplomaticWatch.warEndingTriggers.map((t) => (
                        <div
                          key={t.id}
                          className="rounded border border-white/10 bg-black/20 px-2.5 py-2"
                        >
                          <div className="flex items-start gap-2">
                            <span className={`mt-0.5 text-base leading-none ${TRIGGER_ICON_COLOR[t.status]}`}>
                              {TRIGGER_ICON[t.status]}
                            </span>
                            <div className="flex-1">
                              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                                <span className="text-[11px] font-semibold text-white/90">
                                  {t.label}
                                </span>
                                <span
                                  className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${TRIGGER_STATUS_BADGE[t.status]}`}
                                >
                                  {t.status}
                                </span>
                              </div>
                              <p className="mt-1 text-[10.5px] leading-relaxed text-white/55">
                                {t.detail}
                              </p>
                              <p className="mt-1 text-[9px] italic text-white/35">
                                As of {t.asOfDate}
                                {t.source ? <> &middot; {t.source}</> : null}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Polymarket Resolution Probabilities — Downey May 24 */}
                {data.diplomaticWatch.polymarketProbabilities && data.diplomaticWatch.polymarketProbabilities.length > 0 && (
                  <div className="mt-3 rounded border border-indigo-500/30 bg-black/30 p-3">
                    <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-300/90">
                        Polymarket Resolution Probabilities
                      </span>
                      <span className="text-[10px] italic text-white/45">
                        per Morgan Downey (@morgan_downey) · May 24, 2026
                      </span>
                    </div>
                    <p className="mb-2.5 text-[11px] leading-relaxed text-white/65">
                      What the market EXPECTS will happen by a discrete resolution date — complements the qualitative War-Ending Triggers and the quantitative Physical Confirmation Gates below.
                    </p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {data.diplomaticWatch.polymarketProbabilities.map((p) => {
                        const pct = p.currentProbabilityPct;
                        const pctColor =
                          pct >= 70
                            ? "text-emerald-300"
                            : pct >= 40
                              ? "text-amber-300"
                              : "text-red-300";
                        const pctBorder =
                          pct >= 70
                            ? "border-emerald-500/30"
                            : pct >= 40
                              ? "border-amber-500/30"
                              : "border-red-500/30";
                        const delta =
                          p.priorProbabilityPct != null
                            ? pct - p.priorProbabilityPct
                            : null;
                        const deltaSign = delta != null && delta > 0 ? "+" : "";
                        const deltaArrow =
                          delta != null && delta > 0
                            ? "↑"
                            : delta != null && delta < 0
                              ? "↓"
                              : "";
                        return (
                          <div
                            key={p.question}
                            className={`rounded border ${pctBorder} bg-black/30 px-3 py-2.5`}
                          >
                            <p className="text-[11px] font-semibold leading-snug text-white/90">
                              {p.question}
                            </p>
                            <p className="mt-0.5 text-[9px] uppercase tracking-wider text-white/45">
                              Resolves {p.resolutionDate}
                            </p>
                            <div className="mt-2 flex items-baseline gap-2">
                              <span
                                className={`text-2xl font-extrabold tabular-nums ${pctColor}`}
                              >
                                {pct}%
                              </span>
                              {delta != null && p.priorProbabilityPct != null && (
                                <span className="text-[10px] text-white/55">
                                  was{" "}
                                  <span className="tabular-nums text-white/75">
                                    {p.priorProbabilityPct}%
                                  </span>
                                  {p.priorAsOfDate ? (
                                    <span className="text-white/40">
                                      {" "}
                                      ({p.priorAsOfDate})
                                    </span>
                                  ) : null}
                                  {" · "}
                                  <span className={`tabular-nums font-bold ${pctColor}`}>
                                    {deltaArrow}
                                    {deltaSign}
                                    {delta}pp
                                  </span>
                                </span>
                              )}
                            </div>
                            <p className="mt-2 text-[10.5px] italic leading-relaxed text-white/60">
                              {p.interpretation}
                            </p>
                            <p className="mt-1.5 text-[9px] italic text-white/35">
                              {p.source}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

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

                {/* Sub-panel B — Jawbone Pattern History */}
                {data.diplomaticWatch.jawboneHistory && data.diplomaticWatch.jawboneHistory.length > 0 && (
                  <div className="mt-3 rounded border border-white/10 bg-black/30 p-3">
                    <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/80">
                        Major Jawbone Events &mdash; Pattern Repeats
                      </span>
                      <span className="text-[10px] italic text-white/45">
                        Outcome tracking
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {data.diplomaticWatch.jawboneHistory.map((ev) => (
                        <div
                          key={ev.date}
                          className="rounded border border-white/10 bg-black/20 px-3 py-2.5"
                        >
                          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                            <span className="text-[11px] font-bold tabular-nums text-white">
                              {formatLongDate(ev.date)}
                            </span>
                            <span
                              className={`rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${JAWBONE_OUTCOME_BADGE[ev.outcome]}`}
                            >
                              {ev.outcome}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] font-medium leading-snug text-white/85">
                            {ev.headline}
                          </p>
                          <p className="mt-0.5 text-[9px] uppercase tracking-wider text-white/40">
                            {ev.source}
                          </p>
                          {ev.outcomeNote && (
                            <p className="mt-1.5 text-[10.5px] italic leading-relaxed text-white/60">
                              {ev.outcomeNote}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sub-panel C — Nuclear MOU Countdown */}
                {data.diplomaticWatch.mouCountdown && (() => {
                  const mou = data.diplomaticWatch.mouCountdown;
                  const today = new Date().toISOString().slice(0, 10);
                  const elapsed = Math.max(0, daysBetween(mou.mouSignedDate, today));
                  const remaining = Math.max(0, mou.negotiationWindowDays - elapsed);
                  const pct = Math.min(100, Math.max(0, (elapsed / mou.negotiationWindowDays) * 100));
                  return (
                    <div className="mt-3 rounded border border-white/10 bg-black/30 p-3">
                      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300/90">
                          {mou.negotiationWindowDays}-Day Nuclear Negotiation Window
                        </span>
                        <span className="text-[10px] italic text-white/45">
                          Started {mou.mouSignedDate} &middot; Deadline {mou.deadline}
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[11px] text-white/75">
                        <span>
                          Day <span className="font-bold tabular-nums text-white">{elapsed}</span> of {mou.negotiationWindowDays}
                        </span>
                        <span className="text-white/30">&middot;</span>
                        <span>
                          <span className="font-bold tabular-nums text-white">{remaining}</span> days remaining
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-amber-400/70"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="mt-2 text-[10.5px] leading-relaxed text-white/60">
                        <span className="font-semibold text-white/75">What expires:</span>{" "}
                        {mou.whatExpiresLabel}
                      </p>
                    </div>
                  );
                })()}

                {/* Sub-panel D — HEU Stockpile Fact Block */}
                {data.diplomaticWatch.heuStockpile && (() => {
                  const heu = data.diplomaticWatch.heuStockpile;
                  return (
                    <div className="mt-3 rounded border border-red-500/30 bg-black/30 p-3">
                      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-red-300/90">
                          Iran HEU Stockpile &mdash; The Central War Fact
                        </span>
                        <span className="text-[10px] italic text-white/45">
                          Per Townsend, May 24, 2026
                        </span>
                      </div>
                      {/* Four-stat hero row */}
                      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <div className="rounded border border-white/10 bg-black/20 px-2 py-2">
                          <div className="text-base font-bold tabular-nums text-white">
                            {heu.kg} kg
                          </div>
                          <div className="mt-0.5 text-[9px] uppercase tracking-wider text-white/50">
                            {heu.enrichmentPct}% enriched
                          </div>
                        </div>
                        <div className="rounded border border-white/10 bg-black/20 px-2 py-2">
                          <div className="text-base font-bold tabular-nums text-white">
                            ~{heu.swuAlreadyCompleted}%
                          </div>
                          <div className="mt-0.5 text-[9px] uppercase tracking-wider text-white/50">
                            SWU to weapons-grade
                          </div>
                          <div className="mt-0.5 text-[9px] italic text-white/40">
                            only ~{heu.swuToWeaponsGradePct}% remains
                          </div>
                        </div>
                        <div className="rounded border border-white/10 bg-black/20 px-2 py-2">
                          <div className="text-base font-bold tabular-nums text-white">
                            {heu.weaponsFromStock} weapons
                          </div>
                          <div className="mt-0.5 text-[9px] uppercase tracking-wider text-white/50">
                            from stock
                          </div>
                          <div className="mt-0.5 text-[9px] italic text-white/40">
                            ~{heu.timeToNineWeaponsWeeks} wks at Fordow
                          </div>
                        </div>
                        <div className="rounded border border-white/10 bg-black/20 px-2 py-2">
                          <div className="text-base font-bold tabular-nums text-white">
                            {heu.timeToOneWeaponDays} d
                          </div>
                          <div className="mt-0.5 text-[9px] uppercase tracking-wider text-white/50">
                            to 1 weapon
                          </div>
                        </div>
                      </div>
                      {/* Explanatory blocks */}
                      <div className="mt-3 space-y-1.5 text-[10.5px] leading-relaxed text-white/65">
                        <p>
                          <span className="font-semibold text-white/80">Location:</span>{" "}
                          {heu.currentLocation}
                        </p>
                        <p>
                          <span className="font-semibold text-white/80">Verification:</span>{" "}
                          {heu.verificationStatus}
                        </p>
                        <p>
                          <span className="font-semibold text-white/80">Physical form:</span>{" "}
                          {heu.cylinderCount}
                        </p>
                      </div>
                      <p className="mt-2.5 rounded border border-white/10 bg-black/20 px-2.5 py-2 text-[10.5px] italic leading-relaxed text-white/60">
                        <span className="font-semibold not-italic text-white/75">
                          Nuclear hedging note:
                        </span>{" "}
                        Iran has chosen the &ldquo;threshold state&rdquo; posture (like Japan).
                        Has material + centrifuges. Has not (per IC) authorized warhead
                        assembly. Both &ldquo;weeks from bomb&rdquo; and &ldquo;no active weapons
                        program 20yrs&rdquo; are true &mdash; capability &ne; weaponization.
                        The 60% material is the rung directly below weapons-grade; getting from
                        60% to 90% requires only ~{heu.swuToWeaponsGradePct}% of the work already done.
                      </p>
                      <p className="mt-2 text-[9px] italic text-white/35">
                        Source: {heu.source}
                      </p>
                    </div>
                  );
                })()}

                {/* Sub-panel E — Strait Authority Tolls */}
                {data.diplomaticWatch.straitAuthorityTolls && (() => {
                  const tolls = data.diplomaticWatch.straitAuthorityTolls;
                  return (
                    <div className="mt-3 rounded border border-amber-500/25 bg-black/30 p-3">
                      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300/90">
                          Persian Gulf Strait Authority &mdash; Why Iran Won&rsquo;t Walk Away
                        </span>
                        <span className="text-[10px] italic text-white/45">
                          Operational since early May 2026
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <div className="rounded border border-white/10 bg-black/20 px-2.5 py-2">
                          <div className="text-[9px] uppercase tracking-wider text-white/50">
                            Per transit fee
                          </div>
                          <div className="mt-0.5 text-sm font-bold tabular-nums text-white">
                            {tolls.perTransitFee}
                          </div>
                        </div>
                        <div className="rounded border border-white/10 bg-black/20 px-2.5 py-2">
                          <div className="text-[9px] uppercase tracking-wider text-white/50">
                            Estimated annual tolls
                          </div>
                          <div className="mt-0.5 text-sm font-bold tabular-nums text-white">
                            {tolls.estimatedAnnualTolls}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 space-y-1 text-[10.5px] leading-relaxed text-white/65">
                        <p>
                          <span className="font-semibold text-red-300/85">Banned outright:</span>{" "}
                          {tolls.excludedVessels}
                        </p>
                        <p>
                          <span className="font-semibold text-emerald-300/85">Permitted:</span>{" "}
                          {tolls.permittedVessels}
                        </p>
                      </div>
                      <p className="mt-2.5 rounded border border-white/10 bg-black/20 px-2.5 py-2 text-[10.5px] italic leading-relaxed text-white/60">
                        {tolls.sourceNote}
                      </p>
                    </div>
                  );
                })()}

                <p className="mt-2 text-[10px] italic leading-relaxed text-white/55">
                  <span className="font-semibold not-italic text-white/70">If jawbone continues:</span> {data.diplomaticWatch.impactIfJawboneContinues}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Morgan Downey stress test — newest-first when direction = higher */}
        {verdict.direction === "higher" && (
          <div className="mb-3 rounded-lg border-2 border-red-500/50 bg-red-500/5 p-3 sm:p-4">
            {/* May 24 — Peace doesn't crash to $70 */}
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300">
                {"⚠"} Peace Doesn&rsquo;t Crash to $70
              </span>
              <span className="text-[10px] text-amber-200/65">
                · Morgan Downey, May 24
              </span>
            </div>
            <p className="mt-2 text-[12px] font-medium italic leading-relaxed text-amber-200/95">
              &ldquo;Even with peace, the damage has been done. Over the next 6
              months a $150+ oil spike is still not just in play, it is highly
              likely. Don&rsquo;t expect a collapse to $70 over the next months.
              Longer term (2&ndash;3 years) $100+ crude is the new normal as
              Hormuz-avoiding pipelines will take 3&ndash;5 years to
              build.&rdquo;
            </p>
            <p className="mt-1.5 text-[10px] text-amber-200/55">
              Source: @morgan_downey, X post May 24, 2026
            </p>

            {/* Divider */}
            <div className="my-3 border-t border-red-500/20" />

            {/* May 21 — 30-day stress test */}
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
