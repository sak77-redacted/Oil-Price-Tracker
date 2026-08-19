"use client";

import type {
  ExecutedPosition as ExecutedPositionData,
  PersonalViewData,
} from "@/lib/sugar-types";
import { useSugarView } from "./ViewContext";
import ExecutedPosition from "./ExecutedPosition";

interface Props {
  data: PersonalViewData;
  executedPositions?: ExecutedPositionData[];
  liveSugarSpot: number | null;
}

export default function PersonalView({
  data,
  executedPositions,
  liveSugarSpot,
}: Props) {
  const { mode } = useSugarView();
  if (mode !== "personal") return null;

  const executedLegs = (executedPositions ?? []).filter((p) => p.executed === true);
  const isExecuted = executedLegs.length > 0;

  return (
    <div className="flex flex-col gap-4">
      {executedLegs.map((leg) => (
        <ExecutedPosition
          key={`${leg.contractLabel}-${leg.strike}`}
          data={leg}
          liveSugarSpot={liveSugarSpot}
        />
      ))}

      <section
        aria-label="Personal trade info"
        className="rounded-xl border border-emerald-500/50 p-6 sm:p-7"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 95, 70, 0.06) 50%, rgba(18, 18, 26, 0.95) 100%)",
        }}
      >
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <div className="flex flex-wrap items-baseline gap-2">
            <h3 className="text-sm font-bold uppercase tracking-[0.22em] text-emerald-200">
              {isExecuted ? "Original Trade Plan" : "Personal · Execution Notes"}
            </h3>
            {isExecuted && (
              <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-200 ring-1 ring-emerald-500/40">
                Executed →
              </span>
            )}
          </div>
          <span className="text-[10px] uppercase tracking-[0.16em] text-emerald-300/60">
            Not visible in Thesis view
          </span>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <KVCard label="Execution target" value={data.executionTarget} />
          <KVCard label="Alternative" value={data.alternativeExecution} />
          <KVCard
            label="Max risk"
            value={`$${data.maxRiskDollars.toLocaleString()}`}
            accent="amber"
          />
          <KVCard label="Execution timing" value={data.executionTiming} />
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-zinc-800/70 bg-zinc-950/70 p-4">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300/80">
              Execution Notes
            </div>
            <ul className="space-y-1.5 text-sm text-white/80">
              {data.executionNotes.map((note, i) => (
                <li key={i} className="flex gap-2">
                  <span
                    className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-emerald-400"
                    aria-hidden
                  />
                  <span className="leading-snug">{note}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-zinc-800/70 bg-zinc-950/70 p-4">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300/80">
              Sizing Logic
            </div>
            <p className="text-sm leading-relaxed text-white/80">
              {data.sizingLogic}
            </p>
          </div>
        </div>

        {data.qtyExecuted != null && (
          <div className="mt-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-200">
              Qty executed
            </span>
            <span className="ml-3 text-base font-bold tabular-nums text-emerald-100">
              {data.qtyExecuted}
            </span>
          </div>
        )}
      </section>
    </div>
  );
}

function KVCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "amber" | "emerald";
}) {
  const tone =
    accent === "amber"
      ? "text-amber-200"
      : accent === "emerald"
        ? "text-emerald-200"
        : "text-white";
  return (
    <div className="rounded-lg border border-zinc-800/70 bg-zinc-950/70 p-4">
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
        {label}
      </div>
      <div className={`mt-1 text-base font-semibold tabular-nums ${tone}`}>
        {value}
      </div>
    </div>
  );
}
