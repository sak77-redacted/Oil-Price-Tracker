import type { PolicyStage, PolicyWatchSignalData } from "@/lib/ai-bubble-types";
import AISignalCard from "./AISignalCard";

interface PolicyWatchProps {
  signal: PolicyWatchSignalData;
}

const STAGE_LABELS: Record<PolicyStage, string> = {
  NONE: "None",
  DEBATE: "Debate",
  DRAFT_LEGISLATION: "Draft Legislation",
  ENACTED: "Enacted",
};

export default function PolicyWatch({ signal }: PolicyWatchProps) {
  const currentIdx = signal.ladder.indexOf(signal.current);

  return (
    <AISignalCard
      title={signal.name}
      question={signal.question}
      status={signal.status}
      source={signal.source}
      lastUpdated={signal.lastUpdated}
      notes={signal.notes}
    >
      {/* Status ladder chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        {signal.ladder.map((stage, i) => {
          const isCurrent = stage === signal.current;
          const isPast = i < currentIdx;
          return (
            <span key={stage} className="flex items-center gap-1.5">
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                  isCurrent
                    ? "border-amber-500/60 bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/40"
                    : isPast
                      ? "border-zinc-600 bg-zinc-800/60 text-zinc-400"
                      : "border-zinc-800 bg-zinc-900/40 text-zinc-600"
                }`}
              >
                {STAGE_LABELS[stage]}
              </span>
              {i < signal.ladder.length - 1 && (
                <span aria-hidden className="text-xs text-white/25">
                  →
                </span>
              )}
            </span>
          );
        })}
      </div>

      {/* Headline */}
      <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300/90">
          Current
        </div>
        <p className="mt-1 text-sm font-semibold leading-snug text-white/90">{signal.headline}</p>
      </div>

      {/* Catfish interpretation */}
      <div className="mt-3 rounded-lg border border-white/10 bg-black/30 p-3">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
          The catfish effect, run backwards
        </div>
        <p className="mt-1 text-[13px] leading-relaxed text-white/80">{signal.interpretation}</p>
      </div>
    </AISignalCard>
  );
}
