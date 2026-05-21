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

export default function SugarPage() {
  const data = sugarData as unknown as SugarData;

  return (
    <main className="flex min-h-full flex-col">
      <Nav />
      <div className="mx-auto max-w-7xl w-full px-4 pt-4 sm:px-6 lg:px-8">
        <p className="text-[10px] text-center text-[var(--text-secondary)]">
          Not financial advice. For informational purposes only. Do your own research before making investment decisions.
        </p>
      </div>
      <SugarPageContent data={data} />
      <Footer />
    </main>
  );
}
