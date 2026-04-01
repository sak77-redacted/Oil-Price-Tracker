"use client";

interface TradeExpressionProps {
  oilPrice: number;
}

interface Trade {
  name: string;
  instrument: string;
  thesis: string;
}

const TRADES: Trade[] = [
  {
    name: "Long crude",
    instrument: "BZ futures / BNO ETF",
    thesis:
      "Direct exposure \u2014 if Hormuz escalates, oil reprices to $130+",
  },
  {
    name: "Long cracks",
    instrument: "Buy RB/HO, sell CL",
    thesis:
      "Crack spreads widen as European product supply cliff hits",
  },
  {
    name: "Calendar spread",
    instrument: "Long prompt BZ, short BZ 3-mo",
    thesis:
      "Market is wrong on resolution timeline (Sparta contrarian view)",
  },
  {
    name: "Brent vs WTI",
    instrument: "Long BZ, short CL",
    thesis:
      "Brent has direct Hormuz exposure; WTI is US domestic \u2014 spread widens",
  },
];

export default function TradeExpression({ oilPrice }: TradeExpressionProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card)]">
      {/* Header */}
      <div className="border-b border-[var(--card-border)] px-5 py-3">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">
          Trade Expression
        </h2>
        <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
          How to position based on current signals
        </p>
      </div>

      {/* Macro logic chain */}
      <div className="border-b border-[var(--card-border)] px-5 py-4">
        <div className="mb-1.5 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
          Hedge: Oil as BTC Insurance
        </div>
        <div className="flex flex-wrap items-center gap-1 text-sm text-[var(--text-primary)]">
          <span className="rounded bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-red-400 border border-red-500/30">
            Oil &#8593;
          </span>
          <span className="text-[var(--text-secondary)]">&rarr;</span>
          <span className="rounded bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/30">
            Inflation &#8593;
          </span>
          <span className="text-[var(--text-secondary)]">&rarr;</span>
          <span className="rounded bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/30">
            Rate cuts delayed
          </span>
          <span className="text-[var(--text-secondary)]">&rarr;</span>
          <span className="rounded bg-blue-500/15 px-2 py-0.5 text-xs font-semibold text-blue-400 border border-blue-500/30">
            Risk assets &#8595; (inc BTC)
          </span>
        </div>
        <p className="mt-2 text-xs text-[var(--text-secondary)] leading-relaxed">
          Long oil = negatively correlated hedge for crypto exposure.
          Brent at{" "}
          <span className="font-semibold text-[var(--text-primary)]">
            ${oilPrice.toFixed(0)}
          </span>{" "}
          &mdash; crisis premium already priced, but tail risk remains.
        </p>
      </div>

      {/* Trade table */}
      <div className="overflow-x-auto">
        {/* Desktop table */}
        <table className="hidden w-full sm:table">
          <thead>
            <tr className="border-b border-[var(--card-border)]">
              <th className="px-5 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                Trade
              </th>
              <th className="px-5 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                Instrument
              </th>
              <th className="px-5 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                Thesis
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--card-border)]">
            {TRADES.map((trade, i) => (
              <tr
                key={trade.name}
                style={{
                  backgroundColor:
                    i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
                }}
              >
                <td className="whitespace-nowrap px-5 py-3 text-sm font-semibold text-[var(--text-primary)]">
                  {trade.name}
                </td>
                <td className="whitespace-nowrap px-5 py-3">
                  <span className="rounded bg-[var(--background)] px-2 py-0.5 font-mono text-xs text-[var(--text-secondary)]">
                    {trade.instrument}
                  </span>
                </td>
                <td className="px-5 py-3 text-sm text-[var(--text-secondary)]">
                  {trade.thesis}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Mobile cards */}
        <div className="divide-y divide-[var(--card-border)] sm:hidden">
          {TRADES.map((trade, i) => (
            <div
              key={trade.name}
              className="px-5 py-3"
              style={{
                backgroundColor:
                  i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  {trade.name}
                </span>
                <span className="rounded bg-[var(--background)] px-2 py-0.5 font-mono text-[10px] text-[var(--text-secondary)]">
                  {trade.instrument}
                </span>
              </div>
              <p className="mt-1 text-xs text-[var(--text-secondary)] leading-relaxed">
                {trade.thesis}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-[var(--card-border)] px-5 py-3">
        <p className="text-[11px] text-[var(--text-secondary)]/60 leading-relaxed">
          This is not financial advice. These are signal-based frameworks for
          understanding directional risk.
        </p>
      </div>
    </div>
  );
}
