import type { ChinaShareSignalData } from "@/lib/ai-bubble-types";
import AISignalCard from "./AISignalCard";

interface ChinaShareSignalProps {
  signal: ChinaShareSignalData;
}

function formatEventDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

export default function ChinaShareSignal({ signal }: ChinaShareSignalProps) {
  const { current, yearAgo } = signal.openRouter.usSharePct;

  return (
    <AISignalCard
      title={signal.name}
      question={signal.question}
      status={signal.status}
      statusLabel="Pressure rising"
      source={signal.source}
      lastUpdated={signal.lastUpdated}
      notes={signal.notes}
    >
      {/* 70% → 30% share collapse visual */}
      <div className="flex flex-col gap-3">
        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white/45">
              US model share of OpenRouter usage — 1 year ago
            </span>
            <span className="text-sm font-bold tabular-nums text-white/70">{yearAgo}%</span>
          </div>
          <div className="mt-1 h-5 overflow-hidden rounded bg-zinc-900/60">
            <div
              className="h-full rounded bg-gradient-to-r from-blue-600/60 to-blue-400/50"
              style={{ width: `${yearAgo}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white/45">
              Today
            </span>
            <span className="text-lg font-extrabold tabular-nums text-red-300">{current}%</span>
          </div>
          <div className="mt-1 h-5 overflow-hidden rounded bg-zinc-900/60">
            <div
              className="h-full rounded bg-gradient-to-r from-red-700/70 to-red-500/60"
              style={{ width: `${current}%` }}
            />
          </div>
        </div>
        <p className="text-[11px] text-white/55">
          Top provider by usage: <span className="font-semibold text-red-300">{signal.openRouter.topProvider}</span>
        </p>
      </div>

      {/* Event timeline */}
      <div className="mt-4 flex flex-col gap-0">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
          Kimi K3 timeline
        </div>
        <ul className="mt-2 flex flex-col gap-2 border-l border-zinc-700/70 pl-3">
          {signal.events.map((ev) => (
            <li key={ev.date} className="relative">
              <span
                aria-hidden
                className="absolute -left-[17px] top-1.5 h-2 w-2 rounded-full bg-red-400"
              />
              <span className="text-[11px] font-semibold tabular-nums text-white/55">
                {formatEventDate(ev.date)}
              </span>
              <p className="text-[13px] leading-relaxed text-white/80">{ev.text}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* Mechanism */}
      <div className="mt-4 rounded-lg border border-white/10 bg-black/30 p-3">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
          Mechanism
        </div>
        <p className="mt-1 text-[13px] leading-relaxed text-white/80">{signal.mechanism}</p>
      </div>
    </AISignalCard>
  );
}
