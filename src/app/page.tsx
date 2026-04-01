import { getSignalData } from "@/lib/signals";
import { fetchFuturesData, fetchCrackSpreads, fetchForwardCurve, fetchWTIBrentSpread } from "@/lib/futures-api";
import Dashboard from "@/components/Dashboard";
import Footer from "@/components/Footer";

export default async function Home() {
  const signalData = getSignalData();
  const [futuresData, crackData, forwardData, wtiBrentData] = await Promise.all([
    fetchFuturesData(),
    fetchCrackSpreads(),
    fetchForwardCurve(),
    fetchWTIBrentSpread(),
  ]);

  return (
    <main className="flex min-h-full flex-col">
      <header className="px-4 pt-12 pb-4 text-center sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl">
          Hormuz Signal Tracker
        </h1>
        <p className="mt-2 text-base text-[var(--text-secondary)]">
          4 signals. Zero noise.
        </p>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          Signal framework by{" "}
          <a
            href="https://x.com/nakul_sarda"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[var(--accent)] hover:underline"
          >
            Nakul Sarda
          </a>{" "}
          (@nakul_sarda)
        </p>
      </header>
      <Dashboard data={signalData} futuresData={futuresData} crackData={crackData} forwardData={forwardData} wtiBrentData={wtiBrentData} />
      <Footer />
    </main>
  );
}
