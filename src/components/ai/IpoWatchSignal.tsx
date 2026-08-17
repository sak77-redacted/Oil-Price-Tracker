import type { IpoWatchCompany, IpoWatchSignalData } from "@/lib/ai-bubble-types";
import AISignalCard from "./AISignalCard";

interface IpoWatchSignalProps {
  signal: IpoWatchSignalData;
}

function formatFilingDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatValuation(b: number): string {
  return b >= 1000 ? `$${b / 1000}T` : `$${b}B`;
}

function targetRange(company: IpoWatchCompany): string {
  const { targetValuationLowB: lo, targetValuationHighB: hi } = company;
  if (lo === hi) return `up to ${formatValuation(hi)}`;
  return `${formatValuation(lo)} – ${formatValuation(hi)}+`;
}

function CompanyCard({ company }: { company: IpoWatchCompany }) {
  return (
    <div className="flex flex-col rounded-lg border border-white/10 bg-black/30 p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-bold text-white">{company.name}</span>
        <span className="text-[11px] text-[var(--text-secondary)]">
          Filed {formatFilingDate(company.confidentialFiling)}
        </span>
      </div>

      {/* Expected window — prominent */}
      <div className="mt-2 rounded-md border border-amber-500/30 bg-amber-500/5 px-2.5 py-1.5">
        <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-amber-300/80">
          Expected Window
        </div>
        <div className="text-sm font-extrabold text-amber-200">{company.expectedWindow}</div>
        <p className="mt-0.5 text-[11px] leading-snug text-amber-200/70">
          {company.expectedWindowNote}
        </p>
      </div>

      {/* Exchange / underwriters / raise */}
      <dl className="mt-2.5 flex flex-col gap-1 text-[12px]">
        <div className="flex justify-between gap-2">
          <dt className="text-white/50">Exchange</dt>
          <dd className="text-right text-white/85">{company.exchange ?? "TBD"}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="shrink-0 text-white/50">Underwriters</dt>
          <dd className="text-right text-white/85">{company.underwriters.join(", ")}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-white/50">Raise target</dt>
          <dd className="text-right text-white/85">
            {company.raiseTargetB !== null ? `$${company.raiseTargetB}B+` : "TBD"}
          </dd>
        </div>
      </dl>

      {/* Last private vs target range */}
      <div className="mt-2.5 grid grid-cols-2 gap-2">
        <div className="rounded-md bg-zinc-900/60 px-2.5 py-1.5">
          <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/45">
            Last private
          </div>
          <div className="text-sm font-bold tabular-nums text-white">
            {formatValuation(company.lastPrivateValuationB)}
          </div>
        </div>
        <div className="rounded-md bg-zinc-900/60 px-2.5 py-1.5">
          <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/45">
            IPO target
          </div>
          <div className="text-sm font-bold tabular-nums text-white">{targetRange(company)}</div>
        </div>
      </div>

      <p className="mt-2.5 text-[11px] italic leading-relaxed text-white/60">
        {company.valuationNote}
      </p>
    </div>
  );
}

export default function IpoWatchSignal({ signal }: IpoWatchSignalProps) {
  const listedCount = signal.companies.filter((c) => c.postIpo !== null).length;
  const anyListed = listedCount > 0;

  return (
    <AISignalCard
      title={signal.name}
      question={signal.question}
      status={signal.status}
      source={signal.source}
      lastUpdated={signal.lastUpdated}
      notes={signal.notes}
    >
      {/* Hero */}
      <div className="flex items-baseline gap-3">
        <span className="text-4xl font-extrabold tabular-nums text-white">
          {listedCount} of {signal.companies.length}
        </span>
        <span className="text-sm text-[var(--text-secondary)]">
          listed — Anthropic&apos;s expected window is ≈6 weeks out
        </span>
      </div>

      {/* Company cards — Anthropic first (nearer window) */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {signal.companies.map((company) => (
          <CompanyCard key={company.name} company={company} />
        ))}
      </div>

      {/* Post-IPO scorecard */}
      <div className="mt-3 rounded-lg border border-white/10 bg-black/30 p-3">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
          Post-IPO Scorecard
        </div>
        {anyListed ? (
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {signal.companies.map((company) =>
              company.postIpo ? (
                <div key={company.name} className="rounded-md bg-zinc-900/60 p-2.5">
                  <div className="text-[11px] font-bold text-white">{company.name}</div>
                  <dl className="mt-1.5 flex flex-col gap-1 text-[12px]">
                    <div className="flex justify-between gap-2">
                      <dt className="text-white/50">Offer valuation</dt>
                      <dd className="tabular-nums text-white/85">
                        {formatValuation(company.postIpo.offerValuationB)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-white/50">First-day close vs offer</dt>
                      <dd className="tabular-nums text-white/85">
                        {company.postIpo.firstDayClosePctVsOffer > 0 ? "+" : ""}
                        {company.postIpo.firstDayClosePctVsOffer}%
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-white/50">Day 30 vs offer</dt>
                      <dd className="tabular-nums text-white/85">
                        {company.postIpo.day30PctVsOffer > 0 ? "+" : ""}
                        {company.postIpo.day30PctVsOffer}%
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-white/50">Current vs offer</dt>
                      <dd className="tabular-nums text-white/85">
                        {company.postIpo.currentPctVsOffer > 0 ? "+" : ""}
                        {company.postIpo.currentPctVsOffer}%
                      </dd>
                    </div>
                  </dl>
                </div>
              ) : (
                <div
                  key={company.name}
                  className="flex items-center rounded-md border border-dashed border-white/15 bg-zinc-900/40 p-2.5 text-[12px] text-white/45"
                >
                  {company.name}: not yet listed
                </div>
              )
            )}
          </div>
        ) : (
          <p className="mt-1.5 text-[12px] leading-relaxed text-white/45">
            <span className="font-bold uppercase tracking-wider text-white/60">
              Not yet listed
            </span>{" "}
            — tracking begins at pricing. Watching: offer vs last private round, first-day close,
            30-day vs offer.
          </p>
        )}
      </div>

      {/* Thresholds — same vocabulary as StepUpLadder's legend, stacked for long text */}
      <div className="mt-4">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-white/45">
          Pricing thresholds
        </div>
        <div className="mt-2 flex flex-col gap-1.5">
          <div className="flex items-start gap-2 rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-1.5 text-[11px] leading-snug text-emerald-300">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
            <span>
              <span className="font-bold uppercase tracking-wider">Intact:</span>{" "}
              {signal.thresholds.intact}
            </span>
          </div>
          <div className="flex items-start gap-2 rounded border border-amber-500/40 bg-amber-500/10 px-2 py-1.5 text-[11px] leading-snug text-amber-300">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
            <span>
              <span className="font-bold uppercase tracking-wider">Warning:</span>{" "}
              {signal.thresholds.warning}
            </span>
          </div>
          <div className="flex items-start gap-2 rounded border border-red-500/50 bg-red-500/10 px-2 py-1.5 text-[11px] leading-snug text-red-300">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
            <span>
              <span className="font-bold uppercase tracking-wider">Broken:</span>{" "}
              {signal.thresholds.broken}
            </span>
          </div>
        </div>
      </div>

      {/* Events */}
      <div className="mt-4">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
          Filing Timeline
        </div>
        <ul className="mt-2 flex flex-col gap-1.5">
          {signal.events.map((event) => (
            <li
              key={event.date}
              className="flex items-start gap-2.5 text-[13px] leading-relaxed text-white/80"
            >
              <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400/80" />
              <span>
                <span className="font-semibold tabular-nums text-white/60">
                  {formatFilingDate(event.date)}
                </span>{" "}
                — {event.text}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Interpretation */}
      <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/5 p-3">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-red-300/90">
          Why It Matters
        </div>
        <p className="mt-1 text-[13px] leading-relaxed text-red-200/85">{signal.interpretation}</p>
      </div>
    </AISignalCard>
  );
}
