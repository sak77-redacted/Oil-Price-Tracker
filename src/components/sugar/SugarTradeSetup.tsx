"use client";

import type { SugarTradeData, ExitTriggerEntry } from "@/lib/sugar-types";

interface Props {
  trade: SugarTradeData;
  exitTriggers: ExitTriggerEntry[];
}

export default function SugarTradeSetup({ trade, exitTriggers }: Props) {
  const { primary, alternative, payoffTable, managementRules } = trade;

  return (
    <section className="rounded-xl border border-emerald-500/40 bg-zinc-950/60 p-6 sm:p-8">
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-bold uppercase tracking-[0.16em] text-white">
          Sugar Trade Setup
        </h3>
        <span className="text-[11px] uppercase tracking-[0.18em] text-emerald-300/80">
          Feb&apos;27 SBG7 18&cent; Calls &middot; Live Position
        </span>
      </div>

      {/* Primary + Alternative side-by-side */}
      <div className="grid gap-4 lg:grid-cols-2">
        <TradeColumn
          variant="primary"
          title="Executed Position"
          contract={primary.contract}
          rows={[
            { label: "Strike", value: `${primary.strike}¢` },
            { label: "Quantity", value: primary.qtyRange },
            { label: "Premium / call", value: `$${primary.premiumPerCall.toLocaleString()}` },
            { label: "Total cost", value: primary.totalCostRange },
            { label: "Breakeven", value: `${primary.breakeven}¢` },
            { label: "Cost / $1 payoff", value: `$${primary.costPer1DollarPayoff.toFixed(2)}` },
          ]}
        />
        <TradeColumn
          variant="alternative"
          title="Original Plan (reference)"
          contract={alternative.contract}
          rows={[
            { label: "Strike", value: `${alternative.strike}¢` },
            { label: "Quantity", value: `${alternative.qty} contract${alternative.qty === 1 ? "" : "s"}` },
            { label: "Premium / call", value: `$${alternative.premiumPerCall.toLocaleString()}` },
            { label: "Total cost", value: `$${alternative.totalCost.toLocaleString()}` },
            { label: "Breakeven", value: `${alternative.breakeven}¢` },
            { label: "Cost / $1 payoff", value: `$${alternative.costPer1DollarPayoff.toFixed(2)}` },
          ]}
        />
      </div>

      {/* Payoff table */}
      <div className="mt-6">
        <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
          Payoff Table — 18¢ Call × 2 @ $1,977 Cost Basis
        </div>
        <div className="overflow-x-auto -mx-2 px-2">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800/70 text-[10px] uppercase tracking-[0.16em] text-white/45">
                <th className="py-2 pr-3 font-semibold">Expiry Scenario</th>
                <th className="py-2 pr-3 font-semibold text-right">Intrinsic ($)</th>
                <th className="py-2 pr-3 font-semibold text-right">P&L ($)</th>
                <th className="py-2 pl-3 font-semibold text-right">Multiple</th>
              </tr>
            </thead>
            <tbody>
              {payoffTable.map((row) => {
                const isLoss = row.pnl < 0;
                const tone = row.highlight
                  ? "bg-emerald-500/10 text-emerald-100"
                  : isLoss
                    ? "text-red-300"
                    : "";
                return (
                  <tr
                    key={`${row.expiry}-${row.multiple}`}
                    className={`border-b border-zinc-800/40 last:border-0 ${tone}`}
                  >
                    <td className="py-2.5 pr-3 align-top font-semibold">
                      {row.label ?? `${row.expiry}¢`}
                    </td>
                    <td className="py-2.5 pr-3 align-top text-right tabular-nums text-white/75">
                      ${row.intrinsic.toLocaleString()}
                    </td>
                    <td className="py-2.5 pr-3 align-top text-right tabular-nums">
                      {row.pnl > 0 ? "+" : ""}
                      ${row.pnl.toLocaleString()}
                    </td>
                    <td className="py-2.5 pl-3 align-top text-right tabular-nums font-bold">
                      {row.multiple}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Management rules */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-zinc-800/70 bg-zinc-900/40 p-4">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300/80">
            Management Rules
          </div>
          <ul className="space-y-2 text-sm text-white/80">
            {managementRules.map((rule, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-emerald-400" aria-hidden />
                <span className="leading-snug">{rule}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-zinc-800/70 bg-zinc-900/40 p-4">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300/80">
            Exit Triggers
          </div>
          <div className="space-y-3">
            {exitTriggers.map((t) => (
              <div key={t.name} className="border-l-2 border-amber-500/30 pl-3">
                <div className="text-sm font-semibold text-white">{t.name}</div>
                <div className="mt-0.5 text-[12px] leading-snug text-white/60">{t.rationale}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

interface TradeColumnProps {
  variant: "primary" | "alternative";
  title: string;
  contract: string;
  rows: { label: string; value: string }[];
}

function TradeColumn({ variant, title, contract, rows }: TradeColumnProps) {
  const accent =
    variant === "primary"
      ? "border-emerald-500/40 bg-emerald-500/5"
      : "border-zinc-700/60 bg-zinc-900/40";
  const titleColor = variant === "primary" ? "text-emerald-200" : "text-white/80";

  return (
    <div className={`rounded-lg border p-4 ${accent}`}>
      <div className={`text-[10px] font-bold uppercase tracking-[0.2em] ${titleColor}`}>
        {title}
      </div>
      <div className="mt-1 text-base font-semibold text-white">{contract}</div>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {rows.map((r) => (
          <div key={r.label} className="contents">
            <dt className="text-[11px] uppercase tracking-[0.14em] text-white/45">{r.label}</dt>
            <dd className="text-right font-semibold tabular-nums text-white">{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
