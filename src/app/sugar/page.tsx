import type { Metadata } from "next";

import sugarData from "@/data/sugar.json";
import type { SugarData } from "@/lib/sugar-types";

import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SugarPageContent from "@/components/sugar/SugarPageContent";

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

export default async function SugarPage() {
  const data = sugarData as unknown as SugarData;
  const liveSugarSpot = await fetchSugarSpot();

  return (
    <main className="flex min-h-full flex-col">
      <Nav />
      <div className="mx-auto max-w-7xl w-full px-4 pt-4 sm:px-6 lg:px-8">
        <p className="text-[10px] text-center text-[var(--text-secondary)]">
          Not financial advice. For informational purposes only. Do your own research before making investment decisions.
        </p>
      </div>
      <SugarPageContent data={data} liveSugarSpot={liveSugarSpot} />
      <Footer />
    </main>
  );
}
