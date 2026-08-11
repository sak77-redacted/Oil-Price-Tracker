import type { TreasuryStackSignalData } from "@/lib/ai-bubble-types";
import AISignalCard from "./AISignalCard";

interface TreasuryStackSignalProps {
  signal: TreasuryStackSignalData;
}

export default function TreasuryStackSignal({ signal }: TreasuryStackSignalProps) {
  const tiles: { label: string; value: string; sub: string }[] = [
    {
      label: "National debt",
      value: `$${signal.nationalDebtT}T`,
      sub: "and climbing",
    },
    {
      label: "12-mo deficit",
      value: `$${signal.deficit12moT}T`,
      sub: "new borrowing per year",
    },
    {
      label: "Rollover by end-2027",
      value: `$${signal.rolloverByEnd2027T}T`,
      sub: "must be refinanced at today's rates",
    },
    {
      label: "Annual interest",
      value: `$${signal.annualInterestT}T`,
      sub: signal.interestVsDefense,
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
      {/* 4 stat tiles */}
      <div className="grid grid-cols-2 gap-3">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-lg border border-white/10 bg-black/30 p-3.5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-white/45">
              {tile.label}
            </div>
            <div className="mt-1.5 text-2xl font-extrabold tabular-nums text-white sm:text-3xl">
              {tile.value}
            </div>
            <div className="mt-1 text-[11px] leading-snug text-white/55">{tile.sub}</div>
          </div>
        ))}
      </div>

      {/* 2008 vs next time */}
      <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300/90">
          2008 vs next time
        </div>
        <p className="mt-1 text-[13px] leading-relaxed text-white/80">{signal.watch}</p>
      </div>
    </AISignalCard>
  );
}
