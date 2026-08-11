import type { CapexSignalData } from "@/lib/ai-bubble-types";
import AISignalCard from "./AISignalCard";

interface CapexSignalProps {
  signal: CapexSignalData;
}

export default function CapexSignal({ signal }: CapexSignalProps) {
  const maxCapex = Math.max(...signal.annual.map((y) => y.capexB));

  return (
    <AISignalCard
      title={signal.name}
      question={signal.question}
      status={signal.status}
      source={signal.source}
      lastUpdated={signal.lastUpdated}
      notes={signal.notes}
    >
      {/* 4-bar year chart */}
      <div className="flex h-40 items-end gap-3 sm:gap-4">
        {signal.annual.map((y) => {
          const heightPct = (y.capexB / maxCapex) * 100;
          return (
            <div key={y.year} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
              <span
                className={`text-xs font-bold tabular-nums ${y.planned ? "text-amber-300" : "text-white/85"}`}
              >
                ${y.capexB}B
              </span>
              <div className="flex w-full flex-1 items-end">
                <div
                  className={`w-full rounded-t ${y.planned ? "border border-b-0 border-dashed border-amber-500/60" : "bg-gradient-to-t from-blue-700/60 to-blue-400/50"}`}
                  style={{
                    height: `${heightPct}%`,
                    ...(y.planned
                      ? {
                          backgroundImage:
                            "repeating-linear-gradient(45deg, rgba(245,158,11,0.25) 0, rgba(245,158,11,0.25) 4px, transparent 4px, transparent 9px)",
                        }
                      : {}),
                  }}
                />
              </div>
              <span className="text-[11px] font-semibold tabular-nums text-white/55">
                {y.year}
                {y.planned && (
                  <span className="ml-1 text-[9px] uppercase tracking-wider text-amber-300/80">
                    planned
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>

      {/* Key fact */}
      <div className="mt-4 rounded-lg border border-white/10 bg-black/30 p-3">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
          Debt-funded
        </div>
        <p className="mt-1 text-[13px] leading-relaxed text-white/80">{signal.keyFact}</p>
      </div>

      {/* Kill trigger tile */}
      <div className="mt-3 rounded-lg border border-red-500/40 bg-red-950/20 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-red-300">
            The Tell
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              signal.killTrigger.fired
                ? "border-red-500/60 bg-red-500/20 text-red-300"
                : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${signal.killTrigger.fired ? "bg-red-500" : "bg-emerald-400"}`}
            />
            {signal.killTrigger.fired ? "FIRED" : "NOT FIRED"}
          </span>
        </div>
        <p className="mt-2 text-sm font-semibold leading-snug text-white/90">
          First capex cut that the market rewards.
        </p>
        <p className="mt-1 text-[12px] leading-relaxed text-white/60">
          {signal.killTrigger.description}. The day the market rewards a company for leaving
          the race is the day the race is over.
        </p>
      </div>
    </AISignalCard>
  );
}
