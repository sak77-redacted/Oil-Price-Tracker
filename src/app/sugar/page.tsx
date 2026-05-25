import type { Metadata } from "next";

import sugarData from "@/data/sugar.json";
import type { SugarData, SugarFuturesHistory, SugarFuturesHistoryPoint } from "@/lib/sugar-types";

import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import LivePriceTicker from "@/components/LivePriceTicker";
import SugarPageContent from "@/components/sugar/SugarPageContent";

// Revalidate every 60s so server-rendered futures stay fresh between client polls.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Sugar #11 — El Niño + Hormuz Compound Thesis",
  description:
    "Mar'27 SBH7 call options trade thesis: 98% El Niño probability + Hormuz fertilizer/shipping transmission. Triple-exposed agricultural commodity at multi-year low.",
  openGraph: {
    title: "Sugar #11 — El Niño + Hormuz Compound Thesis",
    description:
      "Mar'27 SBH7 call options trade thesis: 98% El Niño probability + Hormuz fertilizer/shipping transmission. Triple-exposed agricultural commodity at multi-year low.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sugar #11 — El Niño + Hormuz Compound Thesis",
    description:
      "Mar'27 SBH7 call options · El Niño 98% + Hormuz fertilizer/shipping transmission. Multi-year low.",
  },
};

/**
 * Fetch live Sugar #11 (SB=F) front-month futures spot from Yahoo Finance.
 * Yahoo returns the price in cents-per-pound (e.g. 15 = 15¢/lb = $0.15).
 * Returns null on any failure — caller handles graceful absence.
 */
async function fetchSugarSpot(): Promise<number | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/SB%3DF?interval=1d&range=2d`;
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; HormuzTracker/1.0)" },
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 900 },
    });
    if (!response.ok) return null;
    const data = await response.json();
    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
    return typeof price === "number" && price > 0 ? price : null;
  } catch {
    return null;
  }
}

/**
 * Fetch sugar futures daily-close history from Yahoo Finance. Tries the SBH27
 * (Mar'27) contract first — the underlying of the user's Feb'27 option —
 * then falls back to the continuous SB=F front-month series. Returns null on
 * total failure so the caller can render a graceful empty state.
 */
async function fetchSugarFuturesHistory(): Promise<SugarFuturesHistory | null> {
  const candidates: { symbol: string; label: string }[] = [
    { symbol: "SBH27.NYB", label: "SBH27 (Mar'27)" },
    { symbol: "SBH27.NYM", label: "SBH27 (Mar'27)" },
    { symbol: "SB%3DF", label: "SB=F (continuous)" },
  ];

  for (const { symbol, label } of candidates) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1y`;
      const response = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; HormuzTracker/1.0)" },
        signal: AbortSignal.timeout(5000),
        next: { revalidate: 900 },
      });
      if (!response.ok) continue;
      const data = await response.json();
      const result = data?.chart?.result?.[0];
      const timestamps: number[] = result?.timestamp ?? [];
      const closes: (number | null)[] = result?.indicators?.quote?.[0]?.close ?? [];
      const volumes: (number | null)[] = result?.indicators?.quote?.[0]?.volume ?? [];
      if (timestamps.length === 0 || closes.length === 0) continue;

      const series: SugarFuturesHistoryPoint[] = timestamps
        .map((t, i): SugarFuturesHistoryPoint | null => {
          const c = closes[i];
          if (typeof c !== "number" || !Number.isFinite(c) || c <= 0) return null;
          const v = volumes[i];
          const volume = typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.round(v) : undefined;
          return {
            date: new Date(t * 1000).toISOString().slice(0, 10),
            close: Math.round(c * 100) / 100,
            ...(volume !== undefined ? { volume } : {}),
          };
        })
        .filter((p): p is SugarFuturesHistoryPoint => p !== null);

      if (series.length < 10) continue;
      return { contractLabel: label, symbol, series };
    } catch {
      continue;
    }
  }
  return null;
}

export default async function SugarPage() {
  const data = sugarData as unknown as SugarData;
  const [liveSugarSpot, sugarFuturesHistory] = await Promise.all([
    fetchSugarSpot(),
    fetchSugarFuturesHistory(),
  ]);

  return (
    <main className="flex min-h-full flex-col">
      <Nav />
      <LivePriceTicker />
      <div className="mx-auto max-w-7xl w-full px-4 pt-4 sm:px-6 lg:px-8">
        <p className="text-[10px] text-center text-[var(--text-secondary)]">
          Not financial advice. For informational purposes only. Do your own research before making investment decisions.
        </p>
      </div>
      <SugarPageContent
        data={data}
        liveSugarSpot={liveSugarSpot}
        sugarFuturesHistory={sugarFuturesHistory}
      />
      <Footer />
    </main>
  );
}
