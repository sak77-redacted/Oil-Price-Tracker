"use client";

import { useEffect, useState } from "react";
import { useLiveTicker } from "@/lib/use-live-ticker";
import type { LiveTickerQuote } from "@/lib/types";

/**
 * Format a tile price. Compresses 5-digit prices (Gold/Coffee) to integer,
 * keeps 2 decimals for everything else. Always tabular-nums.
 */
function formatPrice(quote: LiveTickerQuote): string {
  const p = quote.price;
  if (p >= 1000) return p.toFixed(0);
  if (p >= 100) return p.toFixed(2);
  return p.toFixed(2);
}

function formatChangePercent(pct: number): string {
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

function changeColor(pct: number): string {
  if (pct === 0) return "text-white/40";
  return pct > 0 ? "text-red-400" : "text-green-400";
}

/**
 * Human-readable "Ns ago" formatter. Cap at 5m — beyond that show "stale".
 */
function timeSince(now: Date, then: Date | null): string {
  if (then == null) return "loading…";
  const seconds = Math.max(0, Math.floor((now.getTime() - then.getTime()) / 1000));
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 300) return `${Math.floor(seconds / 60)}m ago`;
  return "stale";
}

/**
 * Slim horizontal ticker bar mounted directly below <Nav />. Polls /api/ticker
 * every 60s via useLiveTicker; the route is server-cached at 30s so Yahoo is
 * protected from request flooding.
 *
 * Layout: scrollable horizontal strip on mobile (~6 tiles visible) → full
 * row on desktop. Each tile shows display symbol, price (tabular-nums), and
 * Δ% from prior session close colored red (up = bullish for that commodity)
 * or green (down). Far right: "Last update: 12s ago" + a pulsing green LIVE
 * dot when polling is active, gray when paused (tab hidden).
 */
export default function LivePriceTicker(): React.ReactElement {
  const { data, lastUpdate, isPolling } = useLiveTicker(60_000);

  // Tick a once-per-second clock so the "Ns ago" label refreshes between fetches.
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const quotes = data?.quotes ?? [];

  return (
    <div
      className="sticky top-[52px] z-30 w-full border-b border-zinc-800/80 bg-zinc-950/95 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/80"
      aria-label="Live commodity price ticker"
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-2 py-2 sm:px-4 lg:px-6">
        <div className="flex flex-1 items-center gap-2 overflow-x-auto scrollbar-hidden">
          {quotes.length === 0 ? (
            <div className="flex items-center gap-3 px-1 py-1 text-[11px] text-white/40">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-500" />
              Loading live prices…
            </div>
          ) : (
            quotes.map((q) => (
              <div
                key={q.symbol}
                className="flex shrink-0 items-baseline gap-2 rounded-md border border-zinc-800/60 bg-black/40 px-2.5 py-1"
                title={`${q.fullName} (${q.symbol})`}
              >
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">
                  {q.display}
                </span>
                <span className="text-[13px] font-semibold tabular-nums text-white">
                  {formatPrice(q)}
                </span>
                <span
                  className={`text-[10px] font-semibold tabular-nums ${changeColor(q.changePercent)}`}
                >
                  {formatChangePercent(q.changePercent)}
                </span>
              </div>
            ))
          )}
        </div>
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <span className="text-[10px] text-white/45 tabular-nums">
            {timeSince(now, lastUpdate)}
          </span>
          <span className="flex items-center gap-1">
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${
                isPolling ? "animate-pulse bg-emerald-400" : "bg-zinc-600"
              }`}
              aria-hidden
            />
            <span
              className={`text-[10px] font-bold uppercase tracking-[0.16em] ${
                isPolling ? "text-emerald-400" : "text-zinc-500"
              }`}
            >
              {isPolling ? "Live" : "Paused"}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
