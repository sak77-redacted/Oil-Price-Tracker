import type { StepUpLadderSignal } from "@/lib/ai-bubble-types";
import AIStatusBadge from "./AIStatusBadge";

interface StepUpLadderProps {
  signal: StepUpLadderSignal;
}

function multipleTone(multiple: number): { text: string; chip: string } {
  if (multiple >= 1.6) {
    return {
      text: "text-emerald-300",
      chip: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    };
  }
  if (multiple >= 1.3) {
    return {
      text: "text-amber-300",
      chip: "border-amber-500/40 bg-amber-500/10 text-amber-300",
    };
  }
  return {
    text: "text-red-300",
    chip: "border-red-500/50 bg-red-500/10 text-red-300",
  };
}

function formatRoundDate(ym: string): string {
  const d = new Date(`${ym}-01T00:00:00Z`);
  if (isNaN(d.getTime())) return ym;
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}

/**
 * THE hero signal: OpenAI's valuation ladder. Each rung shows the round
 * valuation and the step-up multiple vs the prior round, colored against
 * the intact / warning / broken thresholds. The projected IPO rung is
 * ghosted + dashed with warning treatment.
 */
export default function StepUpLadder({ signal }: StepUpLadderProps) {
  const maxValuation = signal.nextExpected.valuationB;

  return (
    <section className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6 transition-colors hover:border-[var(--accent)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--accent)]">
            Hero Signal · The Collateral Itself
          </div>
          <h3 className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{signal.name}</h3>
          <p className="mt-1 text-sm italic text-[var(--text-secondary)]">
            &ldquo;{signal.question}&rdquo;
          </p>
        </div>
        <AIStatusBadge status={signal.status} />
      </div>

      {/* Ladder */}
      <div className="mt-6 flex flex-col gap-2.5">
        {signal.rounds.map((round) => {
          const tone = round.multiple !== undefined ? multipleTone(round.multiple) : null;
          const widthPct = Math.max(8, (round.valuationB / maxValuation) * 100);
          return (
            <div key={round.date} className="flex items-center gap-3">
              <span className="w-16 shrink-0 text-[11px] font-semibold tabular-nums text-white/55">
                {formatRoundDate(round.date)}
              </span>
              <div className="relative h-9 min-w-0 flex-1 overflow-hidden rounded-md bg-zinc-900/60">
                <div
                  className="flex h-full items-center rounded-md bg-gradient-to-r from-blue-600/50 to-blue-400/40 px-3"
                  style={{ width: `${widthPct}%` }}
                >
                  <span className="whitespace-nowrap text-xs font-bold tabular-nums text-white">
                    ${round.valuationB}B
                  </span>
                </div>
              </div>
              <span className="w-20 shrink-0 text-right">
                {tone && round.multiple !== undefined ? (
                  <span
                    className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-bold tabular-nums ${tone.chip}`}
                  >
                    {round.multiple.toFixed(2)}x
                  </span>
                ) : (
                  <span className="text-[10px] uppercase tracking-wider text-white/35">base</span>
                )}
              </span>
            </div>
          );
        })}

        {/* Projected IPO rung — ghosted / dashed / warning */}
        <div className="flex items-center gap-3 opacity-90">
          <span className="w-16 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-amber-300/80">
            {signal.nextExpected.event}
          </span>
          <div className="relative h-9 min-w-0 flex-1 overflow-hidden rounded-md">
            <div
              className="flex h-full items-center rounded-md border-2 border-dashed border-amber-500/50 bg-amber-500/5 px-3"
              style={{ width: "100%" }}
            >
              <span className="whitespace-nowrap text-xs font-bold tabular-nums text-amber-200/90">
                ${signal.nextExpected.valuationB}B
                <span className="ml-2 font-semibold uppercase tracking-wider text-amber-300/60">
                  projected
                </span>
              </span>
            </div>
          </div>
          <span className="w-20 shrink-0 text-right">
            <span className="inline-flex items-center rounded border border-dashed border-red-500/60 bg-red-500/10 px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-red-300">
              {signal.nextExpected.impliedMultiple.toFixed(2)}x
            </span>
          </span>
        </div>
      </div>

      {/* Projected rung warning */}
      <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
        <p className="text-[13px] leading-relaxed text-amber-200/90">
          <span className="font-bold uppercase tracking-wider">Warning:</span>{" "}
          {signal.nextExpected.note}.
        </p>
      </div>

      {/* Threshold legend */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/45">
          Step-up thresholds
        </span>
        <span className="inline-flex items-center gap-1.5 rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> {signal.thresholds.intact} intact
        </span>
        <span className="inline-flex items-center gap-1.5 rounded border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> {signal.thresholds.warning} warning
        </span>
        <span className="inline-flex items-center gap-1.5 rounded border border-red-500/50 bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-red-300">
          <span className="h-1.5 w-1.5 rounded-full bg-red-400" /> {signal.thresholds.broken} broken
        </span>
      </div>

      {signal.notes && signal.notes.length > 0 && (
        <blockquote className="mt-4 border-l-2 border-amber-500/40 pl-3 text-sm italic leading-relaxed text-[var(--text-primary)]">
          <p>&ldquo;{signal.notes[0].text}&rdquo;</p>
          <footer className="mt-2 not-italic text-[11px] text-[var(--text-secondary)]">
            <span className="font-semibold text-amber-300/80">{signal.notes[0].attribution}</span>
          </footer>
        </blockquote>
      )}

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--card-border)] pt-3">
        <span className="text-xs text-[var(--text-secondary)]">{signal.source}</span>
        <span className="shrink-0 text-xs text-[var(--text-secondary)]">{signal.lastUpdated}</span>
      </div>
    </section>
  );
}
