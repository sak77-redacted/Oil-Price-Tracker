"use client";

import type {
  ExecutedPosition as ExecutedPositionData,
  SugarThesis,
} from "@/lib/sugar-types";

interface SugarVerdictProps {
  thesis: SugarThesis;
  executedPositions?: ExecutedPositionData[];
}

const convictionStyle: Record<string, { ring: string; text: string; bg: string }> = {
  high:     { ring: "ring-emerald-500/50",  text: "text-emerald-200", bg: "bg-emerald-500/15" },
  moderate: { ring: "ring-amber-500/50",    text: "text-amber-200",   bg: "bg-amber-500/15"   },
  low:      { ring: "ring-zinc-500/50",     text: "text-zinc-200",    bg: "bg-zinc-500/15"    },
};

const directionStyle: Record<string, { label: string; arrow: string; text: string }> = {
  long:      { label: "LONG",      arrow: "▲", text: "text-emerald-300" },
  short:     { label: "SHORT",     arrow: "▼", text: "text-red-300" },
  sidelined: { label: "SIDELINED", arrow: "◆", text: "text-yellow-300" },
};

function daysSinceExecution(executionDate: string): number {
  const start = new Date(executionDate).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
}

export default function SugarVerdict({ thesis, executedPositions }: SugarVerdictProps) {
  const conviction = convictionStyle[thesis.conviction] ?? convictionStyle.moderate;
  const direction = directionStyle[thesis.direction] ?? directionStyle.sidelined;

  const legs = (executedPositions ?? []).filter((p) => p.executed === true);
  const isExecuted = legs.length > 0;

  // Aggregate across legs: total basis, total as-of MV, total unrealized P&L $ and %.
  const totalBasis = legs.reduce((sum, p) => sum + p.costBasisDollars, 0);
  const totalMarketValue = legs.reduce((sum, p) => sum + p.asOfMarketValueDollars, 0);
  const totalPnL = legs.reduce((sum, p) => sum + p.asOfUnrealizedPnLDollars, 0);
  const pnlPct = totalBasis > 0 ? (totalPnL / totalBasis) * 100 : 0;
  const positionLossTone = pnlPct < 0;

  // Day counter = days since the EARLIEST non-null execution date.
  const earliestExecutionDate = legs
    .map((p) => p.executionDate)
    .filter((d): d is string => typeof d === "string" && d.length > 0)
    .sort()[0];
  const day = earliestExecutionDate ? daysSinceExecution(earliestExecutionDate) : 0;

  return (
    <section
      aria-label="Sugar trade verdict"
      className="rounded-xl border border-emerald-500/40 p-6 sm:p-8"
      style={{
        backgroundImage:
          "linear-gradient(135deg, rgba(34, 197, 94, 0.18) 0%, rgba(22, 101, 52, 0.08) 50%, rgba(18, 18, 26, 0.95) 100%)",
      }}
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`text-2xl font-extrabold tabular-nums ${direction.text}`}>
            {direction.arrow}
          </span>
          <span className={`text-xl sm:text-2xl font-extrabold uppercase tracking-[0.18em] ${direction.text}`}>
            Sugar {direction.label}
          </span>
          <span className="text-white/30">·</span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ring-1 ${conviction.bg} ${conviction.text} ${conviction.ring}`}
          >
            {thesis.conviction} · {thesis.convictionPct}%
          </span>
          <span className="text-white/30">·</span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/55">
            El Niño + Hormuz Compound
          </span>
        </div>

        <h2 className="text-lg sm:text-xl font-semibold leading-snug text-white">
          {thesis.headline}
        </h2>
        <p className="max-w-4xl text-sm sm:text-base leading-relaxed text-white/70">
          {thesis.summary}
        </p>

        {isExecuted && (
          <div>
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ring-1 ${
                positionLossTone
                  ? "bg-red-500/10 text-red-200 ring-red-500/40"
                  : "bg-emerald-500/15 text-emerald-200 ring-emerald-500/40"
              }`}
            >
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]" />
              Position Live · {legs.length} leg{legs.length === 1 ? "" : "s"} ·{" "}
              <span className="tabular-nums">
                {totalPnL >= 0 ? "+" : "-"}$
                {Math.abs(totalPnL).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>{" "}
              <span className="tabular-nums">
                ({pnlPct >= 0 ? "+" : ""}
                {pnlPct.toFixed(1)}%)
              </span>{" "}
              · Day {day}
            </span>
            <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-white/45 tabular-nums">
              Basis $
              {totalBasis.toLocaleString(undefined, { maximumFractionDigits: 0 })} → MV $
              {totalMarketValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} across{" "}
              {legs.length} leg{legs.length === 1 ? "" : "s"}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
