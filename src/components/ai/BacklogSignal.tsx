import type { BacklogSignalData } from "@/lib/ai-bubble-types";
import AISignalCard from "./AISignalCard";

interface BacklogSignalProps {
  signal: BacklogSignalData;
}

export default function BacklogSignal({ signal }: BacklogSignalProps) {
  const labeled = signal.platforms.filter((p) => p.backlogB !== undefined);
  const unlabeled = signal.platforms.filter((p) => p.backlogB === undefined);
  const labeledTotal = labeled.reduce((sum, p) => sum + (p.backlogB ?? 0), 0);
  const remainderB = Math.max(0, signal.totalB - labeledTotal);
  const maxBar = Math.max(...labeled.map((p) => p.backlogB ?? 0), remainderB);

  const bars: { name: string; valueB: number; yoy?: number; estimated?: boolean }[] = [
    ...labeled.map((p) => ({ name: p.name, valueB: p.backlogB ?? 0, yoy: p.yoyGrowthPct })),
    {
      name: `${unlabeled.map((p) => p.name).join(" + ")} (remainder)`,
      valueB: remainderB,
      estimated: true,
    },
  ];

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
          ${(signal.totalB / 1000).toFixed(1)}T
        </span>
        <span className="text-sm text-[var(--text-secondary)]">
          promised cloud/compute backlog across four platforms
        </span>
      </div>

      {/* Per-platform bars */}
      <div className="mt-5 flex flex-col gap-2.5">
        {bars.map((bar) => (
          <div key={bar.name} className="flex items-center gap-3">
            <span className="w-40 shrink-0 truncate text-xs font-semibold text-white/70">
              {bar.name}
            </span>
            <div className="h-6 min-w-0 flex-1 overflow-hidden rounded bg-zinc-900/60">
              <div
                className={`h-full rounded ${
                  bar.estimated
                    ? "border border-dashed border-zinc-600 bg-zinc-700/40"
                    : "bg-gradient-to-r from-blue-600/60 to-blue-400/50"
                }`}
                style={{ width: `${Math.max(4, (bar.valueB / maxBar) * 100)}%` }}
              />
            </div>
            <span className="w-24 shrink-0 text-right text-xs font-bold tabular-nums text-white/85">
              ${bar.valueB}B
              {bar.yoy !== undefined && (
                <span className="ml-1.5 font-semibold text-emerald-300">+{bar.yoy}%</span>
              )}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[10px] uppercase tracking-wider text-white/40">
        Oracle +363% YoY · Google/Amazon not broken out — shown as remainder of $2.1T
      </p>

      {/* Concentration warning strip */}
      <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/5 p-3">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-red-300/90">
          Concentration
        </div>
        <p className="mt-1 text-[13px] leading-relaxed text-red-200/85">
          {signal.concentration.note}
        </p>
      </div>

      {/* Trigger */}
      <p className="mt-3 text-[11px] italic leading-relaxed text-white/55">
        Trigger: {signal.trigger}
      </p>
    </AISignalCard>
  );
}
