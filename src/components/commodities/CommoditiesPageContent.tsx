"use client";

import type {
  CommoditiesThesisData,
  CommodityComplexData,
} from "@/lib/commodities-types";

import CommoditiesVerdict from "./CommoditiesVerdict";
import LiveYTDChart from "./LiveYTDChart";
import SectorSummaryGrid from "./SectorSummaryGrid";
import LivePricesTable from "./LivePricesTable";
import KeyObservations from "./KeyObservations";
import CompoundThesisCard from "./CompoundThesisCard";
import ExposureMappingTable from "./ExposureMappingTable";
import TradeIdeasGrid from "./TradeIdeasGrid";
import TimingWindowsTimeline from "./TimingWindowsTimeline";
import DispersionCallout from "./DispersionCallout";
import RiskFactorsList from "./RiskFactorsList";
import OilBookConnectionCard from "./OilBookConnectionCard";

interface Props {
  complexData: CommodityComplexData;
  thesisData: CommoditiesThesisData;
}

function SectionDivider({
  label,
  description,
}: {
  label: string;
  description: string;
}) {
  return (
    <div className="mt-12 border-t border-zinc-800 pt-6">
      <div className="flex flex-col items-start gap-1">
        <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-300">
          {label}
        </span>
        <span className="text-sm text-white/55">{description}</span>
      </div>
    </div>
  );
}

export default function CommoditiesPageContent({
  complexData,
  thesisData,
}: Props) {
  const liveCount = complexData.commodities.filter((c) => c.live).length;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <header className="pt-6 pb-2">
        <div className="text-center sm:text-left">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Commodity Complex
          </h1>
          <p className="mt-2 text-sm font-semibold uppercase tracking-[0.22em] text-amber-300">
            Live YTD + Compound Crisis Thesis
          </p>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-white/65">
            17 front-month futures across Energy, Metals, Grains, Softs, and
            Livestock. Live YTD from Yahoo Finance. The dispersion between
            sectors is the trade.
          </p>
        </div>
      </header>

      <div className="mt-6 flex flex-col gap-4">
        <CommoditiesVerdict
          headline={thesisData.verdictHeadline}
          subtitle={thesisData.verdictSubtitle}
          asOfDate={complexData.asOfDate}
          liveCount={liveCount}
          totalCount={complexData.commodities.length}
        />

        <SectionDivider
          label="Live YTD Performance"
          description="Sorted by year-to-date return · Hover any bar for live price + 5-day change"
        />
        <LiveYTDChart rows={complexData.commodities} />
        <SectorSummaryGrid sectors={complexData.sectors} />

        <SectionDivider
          label="Thesis — Compound Crisis Regime"
          description="El Niño 98% + Hormuz fertilizer transmission · Why the softs are the asymmetric setup"
        />
        <CompoundThesisCard thesis={thesisData.compoundThesis} />
        <ExposureMappingTable
          rows={thesisData.exposureMapping}
          liveCommodities={complexData.commodities}
        />
        <DispersionCallout text={thesisData.dispersionCallout} />

        <SectionDivider
          label="Trade Ideas — Ranked by Risk-Adjusted Opportunity"
          description="Sugar (core) · Cocoa (convex satellite) · Coffee (opportunistic) · KC Wheat (compound winner)"
        />
        <TradeIdeasGrid ideas={thesisData.tradeIdeas} />

        <SectionDivider
          label="Timing Windows"
          description="Catalyst calendar · Indian monsoon → Brazilian C-S → El Niño peak"
        />
        <TimingWindowsTimeline windows={thesisData.timingWindows} />

        <SectionDivider
          label="Structural Context"
          description="Observations, full live prices table, risk factors, oil-book connection (collapsible)"
        />
        <details className="group rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 transition-colors open:border-amber-500/30">
          <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold uppercase tracking-[0.18em] text-white/70 hover:text-white">
            <span>Show structural context (4 sections)</span>
            <span
              className="text-amber-300/80 transition-transform group-open:rotate-180"
              aria-hidden
            >
              ▾
            </span>
          </summary>
          <div className="mt-4 flex flex-col gap-4">
            <KeyObservations observations={thesisData.keyObservations} />
            <LivePricesTable rows={complexData.commodities} />
            <RiskFactorsList factors={thesisData.riskFactors} />
            <OilBookConnectionCard text={thesisData.oilBookConnection} />
          </div>
        </details>
      </div>
    </div>
  );
}
