import type { ConcentrationSignalData } from "@/lib/ai-bubble-types";
import AISignalCard from "./AISignalCard";

interface ConcentrationSignalProps {
  signal: ConcentrationSignalData;
}

export default function ConcentrationSignal({ signal }: ConcentrationSignalProps) {
  const top10 = signal.sp500Top10WeightPct;
  const rest = 100 - top10;

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
        <span className="text-4xl font-extrabold tabular-nums text-white">{top10}%</span>
        <span className="text-sm text-[var(--text-secondary)]">
          of the S&amp;P 500 sits in 10 companies
        </span>
      </div>

      {/* Weight bar: top 10 vs other 490 */}
      <div className="mt-5">
        <div className="flex h-7 w-full overflow-hidden rounded">
          <div
            className="flex items-center justify-center bg-gradient-to-r from-red-700/70 to-red-500/60"
            style={{ width: `${top10}%` }}
          >
            <span className="whitespace-nowrap text-[10px] font-bold uppercase tracking-wider text-white">
              Top 10
            </span>
          </div>
          <div
            className="flex items-center justify-center bg-zinc-800/70"
            style={{ width: `${rest}%` }}
          >
            <span className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider text-white/55">
              Other 490 companies
            </span>
          </div>
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] tabular-nums text-white/45">
          <span>{top10}% — one bet on one belief</span>
          <span>{rest}%</span>
        </div>
      </div>

      {/* Know what you own */}
      <div className="mt-4 rounded-lg border border-white/10 bg-black/30 p-3">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
          Know what you own
        </div>
        <p className="mt-1 text-[13px] leading-relaxed text-white/80">{signal.note}</p>
      </div>
    </AISignalCard>
  );
}
