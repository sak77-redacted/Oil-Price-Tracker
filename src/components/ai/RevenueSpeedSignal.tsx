import type { RevenueSpeedSignalData } from "@/lib/ai-bubble-types";
import AISignalCard from "./AISignalCard";

interface RevenueSpeedSignalProps {
  signal: RevenueSpeedSignalData;
}

export default function RevenueSpeedSignal({ signal }: RevenueSpeedSignalProps) {
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
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="text-4xl font-extrabold tabular-nums text-white">
          ${signal.openai.revenue2025B}B
        </span>
        <span className="inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-300">
          {signal.openai.yoyMultiple}x YoY
        </span>
        <span className="text-sm text-[var(--text-secondary)]">OpenAI 2025 revenue</span>
      </div>

      {/* Loss note */}
      <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/5 p-3">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-red-300/90">
          The other side of the ledger
        </div>
        <p className="mt-1 text-[13px] leading-relaxed text-red-200/85">
          {signal.openai.lossNote}.
        </p>
      </div>

      {/* Speed-is-the-collateral framing */}
      <div className="mt-3 rounded-lg border border-white/10 bg-black/30 p-3">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
          Why speed, not level
        </div>
        <p className="mt-1 text-[13px] leading-relaxed text-white/80">
          The $20B doesn&apos;t justify an $852B valuation — the <em>3x growth rate</em> does.
          The valuation step-ups, the backlogs, the capex — all of it is collateralized by
          the assumption that this number keeps tripling. The speed is the collateral.
          If growth downshifts from 3x to 2x, nothing &ldquo;fell&rdquo; — and everything breaks.
        </p>
      </div>
    </AISignalCard>
  );
}
