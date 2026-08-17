import type { SecuritizationSignalData } from "@/lib/ai-bubble-types";
import AISignalCard from "./AISignalCard";

interface SecuritizationSignalProps {
  signal: SecuritizationSignalData;
}

export default function SecuritizationSignal({ signal }: SecuritizationSignalProps) {
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
          ${signal.deal.sizeB}B
        </span>
        <span className="text-sm text-[var(--text-secondary)]">
          Nvidia + six asset managers — compute-financing push announced Aug 2026
        </span>
      </div>

      {/* Deal structure */}
      <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300/90">
          The Deal
        </div>
        <p className="mt-1 text-[13px] leading-relaxed text-white/85">{signal.deal.structure}</p>
        <p className="mt-2 text-[13px] leading-relaxed text-amber-200/80">{signal.deal.shift}</p>
      </div>

      {/* 2006 rhyme interpretation */}
      <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/5 p-3">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-red-300/90">
          The 2006 Rhyme
        </div>
        <p className="mt-1 text-[13px] leading-relaxed text-red-200/85">{signal.interpretation}</p>
      </div>

      {/* Meta note — the missing credit tape */}
      <div className="mt-3 rounded-lg border border-white/10 bg-black/30 p-3">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
          The Missing Credit Tape
        </div>
        <p className="mt-1 text-[13px] leading-relaxed text-white/80">{signal.metaNote}</p>
      </div>

      {/* Watch items */}
      <div className="mt-4">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
          Watching For
        </div>
        <ul className="mt-2 flex flex-col gap-1.5">
          {signal.watchItems.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-white/80">
              <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400/80" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </AISignalCard>
  );
}
