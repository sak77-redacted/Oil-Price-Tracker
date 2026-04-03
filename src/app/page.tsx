import { getSignalData } from "@/lib/signals";
import { fetchFuturesData, fetchCrackSpreads, fetchForwardCurve, fetchWTIBrentSpread, fetchMarketIndices } from "@/lib/futures-api";
import { getAISummary } from "@/lib/ai-summary";

import Dashboard from "@/components/Dashboard";
import Footer from "@/components/Footer";

// Revalidate every 15 minutes so futures prices stay fresh
export const revalidate = 900;

export default async function Home() {
  const [signalData, futuresData, crackData, forwardData, wtiBrentData, marketData, aiSummary] = await Promise.all([
    getSignalData(),
    fetchFuturesData(),
    fetchCrackSpreads(),
    fetchForwardCurve(),
    fetchWTIBrentSpread(),
    fetchMarketIndices(),
    getAISummary(),
  ]);

  return (
    <main className="flex min-h-full flex-col">
      <header className="px-4 pt-10 pb-2 text-center sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Hormuz Signal Tracker
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
          The Strait of Hormuz carries 20% of the world&apos;s oil supply. It is now effectively closed.
          This tracker monitors the only signals that matter — priced by people with real money at risk — and translates them into actionable trade intelligence.
        </p>
        <p className="mt-3 text-xs text-[var(--text-secondary)]">
          Signal framework by{" "}
          <a href="https://x.com/nakul_sarda" target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--accent)] hover:underline">Nakul Sarda</a>{" "}
          (@nakul_sarda)
        </p>
      </header>
      <Dashboard data={signalData} futuresData={futuresData} crackData={crackData} forwardData={forwardData} wtiBrentData={wtiBrentData} marketData={marketData} aiSummary={aiSummary} />
      <Footer />
    </main>
  );
}
