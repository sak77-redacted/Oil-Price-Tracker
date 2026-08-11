import type { Metadata } from "next";

import { getSignalData } from "@/lib/signals";
import { fetchFuturesData, fetchCrackSpreads, fetchForwardCurve, fetchWTIBrentSpread, fetchMarketIndices, fetchHyperliquidPerps } from "@/lib/futures-api";
import { getAISummary } from "@/lib/ai-summary";

import Dashboard from "@/components/Dashboard";
import Footer from "@/components/Footer";
import Nav from "@/components/Nav";
import LivePriceTicker from "@/components/LivePriceTicker";

// Revalidate every 60s so server-rendered futures stay fresh between client polls.
// Live ticker polls /api/ticker every 60s on the client (server-cached at 30s).
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Hormuz Signal Tracker — Oil",
  description:
    "6 signals. Zero noise. Track the Strait of Hormuz crisis.",
  openGraph: {
    title: "Hormuz Signal Tracker — Oil",
    description:
      "6 signals. Zero noise. Track the Strait of Hormuz crisis.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hormuz Signal Tracker — Oil",
    description:
      "6 signals. Zero noise. Track the Strait of Hormuz crisis.",
  },
};

export default async function OilPage() {
  const [signalData, futuresData, crackData, forwardData, wtiBrentData, marketData, aiSummary, hyperliquidData] = await Promise.all([
    getSignalData(),
    fetchFuturesData(),
    fetchCrackSpreads(),
    fetchForwardCurve(),
    fetchWTIBrentSpread(),
    fetchMarketIndices(),
    getAISummary(),
    fetchHyperliquidPerps(),
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
      <header className="px-4 pt-6 pb-2 text-center sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Hormuz Signal Tracker
        </h1>
        <p className="mx-auto mt-2 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
          Direction. Duration. Magnitude.
        </p>
        <p className="mx-auto mt-3 max-w-3xl text-base sm:text-lg leading-relaxed text-[var(--text-secondary)]">
          The Strait of Hormuz carries 20% of the world&apos;s oil supply. It is now effectively closed.
          This tracker monitors the only signals that matter — priced by people with real money at risk — and translates them into actionable trade intelligence.
        </p>
      </header>
      <Dashboard data={signalData} futuresData={futuresData} crackData={crackData} forwardData={forwardData} wtiBrentData={wtiBrentData} marketData={marketData} aiSummary={aiSummary} hyperliquidData={hyperliquidData} />
      <Footer />
    </main>
  );
}
