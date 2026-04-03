"use client";

import type { MarketIndicesData } from "@/lib/types";

interface MarketPulseProps {
  data: MarketIndicesData;
}

function formatPrice(symbol: string, price: number): string {
  // VIX: no $ sign, 2 decimals
  if (symbol === "VX=F") {
    return price.toFixed(2);
  }
  // S&P 500: $ with commas, 2 decimals
  if (symbol === "ES=F") {
    return "$" + price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  // BTC and NASDAQ: $ with commas, no decimals
  return "$" + Math.round(price).toLocaleString("en-US");
}

function formatChange(symbol: string, change: number): string {
  const sign = change >= 0 ? "+" : "";
  if (symbol === "VX=F") {
    return sign + change.toFixed(2);
  }
  if (symbol === "ES=F") {
    return sign + "$" + Math.abs(change).toFixed(2);
  }
  return sign + "$" + Math.abs(Math.round(change)).toLocaleString("en-US");
}

export default function MarketPulse({ data }: MarketPulseProps) {
  return (
    <section className="mt-6">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
        Market Pulse
      </h2>
      <p className="mt-1 mb-3 text-xs text-[var(--text-secondary)]">
        Cross-asset context &mdash; how the crisis is rippling through broader markets
      </p>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {data.indices.map((index) => {
          const isPositive = index.change >= 0;
          const changeColor = isPositive ? "text-emerald-400" : "text-red-400";

          return (
            <div
              key={index.symbol}
              className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-[var(--text-secondary)]">
                  {index.symbol}
                </span>
                {!index.live && (
                  <span className="rounded bg-amber-500/20 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-400 border border-amber-500/30">
                    Cached
                  </span>
                )}
              </div>
              <div className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                {index.name}
              </div>
              <div className="mt-1 text-2xl font-bold tabular-nums text-[var(--text-primary)]">
                {formatPrice(index.symbol, index.price)}
              </div>
              <div className={`mt-0.5 text-xs font-medium tabular-nums ${changeColor}`}>
                {formatChange(index.symbol, index.change)} ({isPositive ? "+" : ""}{index.changePercent.toFixed(2)}%)
              </div>
              <div className="mt-1 text-[11px] text-[var(--text-secondary)] leading-tight">
                {index.description}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
