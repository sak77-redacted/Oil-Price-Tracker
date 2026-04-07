"use client";

import type { HyperliquidData } from "@/lib/futures-api";

function formatUSD(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export default function HyperliquidPerps({ data }: { data: HyperliquidData }) {
  if (!data.live || data.perps.length === 0) return null;

  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Hyperliquid Oil Perps
          </h3>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            24/7 perpetual futures — trades when CME is closed (weekends, holidays)
          </p>
        </div>
        <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-purple-400 border border-purple-500/30">
          24/7
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {data.perps.map((perp) => (
          <div
            key={perp.name}
            className="rounded-lg bg-[var(--background)] p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">
                {perp.displayName}
              </span>
              <span className="font-mono text-[10px] text-[var(--text-secondary)]">
                {perp.name}
              </span>
            </div>

            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-2xl font-bold tabular-nums text-[var(--text-primary)]">
                ${perp.markPx.toFixed(2)}
              </span>
              <span
                className={`text-sm font-semibold tabular-nums ${
                  perp.change24h >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {perp.change24h >= 0 ? "+" : ""}
                {perp.change24h.toFixed(2)}%
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
                  Oracle
                </span>
                <span className="text-sm font-medium tabular-nums text-[var(--text-primary)]">
                  ${perp.oraclePx.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
                  Funding (1h)
                </span>
                <span
                  className={`text-sm font-medium tabular-nums ${
                    perp.funding >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {perp.funding >= 0 ? "+" : ""}
                  {(perp.funding * 100).toFixed(4)}%
                </span>
              </div>
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
                  Open Interest
                </span>
                <span className="text-sm font-medium tabular-nums text-[var(--text-primary)]">
                  {formatUSD(perp.openInterest)}
                </span>
              </div>
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
                  24h Volume
                </span>
                <span className="text-sm font-medium tabular-nums text-[var(--text-primary)]">
                  {formatUSD(perp.volume24h)}
                </span>
              </div>
            </div>

            <div className="mt-2 text-[10px] text-[var(--text-secondary)]">
              Annualized funding: {perp.fundingAnnualized >= 0 ? "+" : ""}{perp.fundingAnnualized.toFixed(1)}% · Premium: {(perp.premium * 100).toFixed(3)}%
            </div>
          </div>
        ))}
      </div>

      <p className="mt-3 text-[10px] text-[var(--text-secondary)]">
        Perps settle in USDC on Hyperliquid L1. Positive funding = longs pay shorts (bullish positioning).
        When CME is closed, Hyperliquid prices are the only live oil price signal available.
      </p>
    </div>
  );
}
