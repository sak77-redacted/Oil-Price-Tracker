import type { Metadata } from "next";

import thesisData from "@/data/commodities-thesis.json";
import { fetchCommodityComplex } from "@/lib/commodities-api";
import type { CommoditiesThesisData } from "@/lib/commodities-types";

import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import CommoditiesPageContent from "@/components/commodities/CommoditiesPageContent";

export const revalidate = 900;

export const metadata: Metadata = {
  title:
    "Commodity Complex — Macro View · Live YTD + Compound Crisis Thesis",
  description:
    "Live commodity futures prices and YTD performance across Energy, Metals, Grains, Softs, Livestock. Compound El Niño + Hormuz crisis thesis with ranked trade ideas.",
  openGraph: {
    title: "Commodity Complex — Live YTD + Compound Crisis Thesis",
    description:
      "Live YTD across 17 front-month commodity futures. El Niño + Hormuz compound crisis. Ranked trade ideas: Sugar / Cocoa / Coffee / KC Wheat.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Commodity Complex — Live YTD + Compound Crisis",
    description:
      "17 futures · live YTD · El Niño + Hormuz dispersion · ranked trade ideas.",
  },
};

export default async function CommoditiesPage() {
  const complexData = await fetchCommodityComplex();
  const thesis = thesisData as unknown as CommoditiesThesisData;

  return (
    <main className="flex min-h-full flex-col">
      <Nav />
      <div className="mx-auto max-w-7xl w-full px-4 pt-4 sm:px-6 lg:px-8">
        <p className="text-[10px] text-center text-[var(--text-secondary)]">
          Not financial advice. For informational purposes only. Do your own research before making investment decisions.
        </p>
      </div>
      <CommoditiesPageContent complexData={complexData} thesisData={thesis} />
      <Footer />
    </main>
  );
}
