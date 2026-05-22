"use client";

import type { SugarData, SugarFuturesHistory } from "@/lib/sugar-types";

import { SugarViewProvider } from "./ViewContext";
import PersonalViewToggle from "./PersonalViewToggle";
import SugarVerdict from "./SugarVerdict";
import SugarTodaysTape from "./SugarTodaysTape";
import SugarFuturesChart from "./SugarFuturesChart";
import CatalystTimeline from "./CatalystTimeline";
import ElNinoSetup from "./ElNinoSetup";
import HormuzTransmission from "./HormuzTransmission";
import ForecastRevisions from "./ForecastRevisions";
import BrazilianMillMix from "./BrazilianMillMix";
import SugarTradeSetup from "./SugarTradeSetup";
import HistoricalContext from "./HistoricalContext";
import TailScenario from "./TailScenario";
import YTDComparison from "./YTDComparison";
import PersonalView from "./PersonalView";

interface Props {
  data: SugarData;
  liveSugarSpot?: number | null;
  sugarFuturesHistory?: SugarFuturesHistory | null;
}

function SectionDivider({ label, description }: { label: string; description: string }) {
  return (
    <div className="mt-12 border-t border-zinc-800 pt-6">
      <div className="flex flex-col items-start gap-1">
        <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300">
          {label}
        </span>
        <span className="text-sm text-white/55">{description}</span>
      </div>
    </div>
  );
}

export default function SugarPageContent({
  data,
  liveSugarSpot = null,
  sugarFuturesHistory = null,
}: Props) {
  const positionLive = data.executedPosition?.executed === true;
  const executed = data.executedPosition;
  // strike in cents/lb (executedPosition.strike is in $/lb e.g. 0.18 → 18)
  const strikePriceCents = executed?.strike ? executed.strike * 100 : 18;
  const entryPriceCents = executed?.entryUnderlyingPriceCents;
  const entryDate = executed?.executionDate;
  const positionLabel = executed?.contractLabel;

  return (
    <SugarViewProvider>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="pt-6 pb-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="text-center sm:text-left">
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Sugar #11 — Compound Crisis Thesis
              </h1>
              <p className="mt-2 text-sm font-semibold uppercase tracking-[0.22em] text-emerald-300">
                El Niño 98% + Hormuz fertilizer transmission
              </p>
              <p className="mt-3 max-w-3xl text-base leading-relaxed text-white/65">
                Mar&apos;27 SBH7 call options. Triple-exposed agricultural commodity at a 5-year low,
                with forecasters revising 2026/27 from surplus to deficit in real time.
              </p>
            </div>
            <div className="flex shrink-0 justify-center sm:pt-2">
              <PersonalViewToggle positionLive={positionLive} />
            </div>
          </div>
        </header>

        <div className="mt-6 flex flex-col gap-4">
          {/* Tier 1 — Action */}
          <SugarVerdict thesis={data.thesis} executedPosition={data.executedPosition} />
          <SugarTodaysTape data={data.todaysTape} />
          <SugarFuturesChart
            history={sugarFuturesHistory}
            strikePriceCents={strikePriceCents}
            entryPriceCents={entryPriceCents}
            entryDate={entryDate}
            positionLabel={positionLabel}
            catalysts={data.catalystTimeline}
            executedPosition={data.executedPosition}
          />
          <CatalystTimeline events={data.catalystTimeline} />

          {/* Personal view (only when toggled) */}
          <PersonalView
            data={data.personalView}
            executedPosition={data.executedPosition}
            liveSugarSpot={liveSugarSpot}
          />

          {/* Tier 2 — Thesis */}
          <SectionDivider
            label="Thesis — Compound Catalyst"
            description="El Niño 98% + Hormuz fertilizer transmission. Surplus narrative breaking."
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <ElNinoSetup data={data.elNino} />
            <HormuzTransmission data={data.hormuzTransmission} />
            <ForecastRevisions revisions={data.forecastRevisions} />
            <BrazilianMillMix data={data.millMix} />
          </div>

          {/* Trade setup */}
          <SectionDivider
            label="Trade Setup"
            description="Mar'27 SBH7 call options · primary vs alternative · payoff table"
          />
          <SugarTradeSetup trade={data.trade} exitTriggers={data.exitTriggers} />

          {/* Tier 3 — Structural context (collapsible) */}
          <SectionDivider
            label="Structural Context"
            description="20-year price history, tail scenario, YTD dispersion (collapsible)"
          />
          <details className="group rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 transition-colors open:border-emerald-500/30">
            <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold uppercase tracking-[0.18em] text-white/70 hover:text-white">
              <span>Show structural context (3 cards)</span>
              <span className="text-emerald-300/80 transition-transform group-open:rotate-180" aria-hidden>
                ▾
              </span>
            </summary>
            <div className="mt-4 flex flex-col gap-4">
              <HistoricalContext rows={data.historicalContext} />
              <TailScenario data={data.tailScenario} />
              <YTDComparison rows={data.ytdPerformance} />
            </div>
          </details>
        </div>
      </div>
    </SugarViewProvider>
  );
}
