"use client";

import type { ExtendedSignalData, FuturesData, CrackSpreadData, ForwardCurveData, WTIBrentSpreadData } from "@/lib/types";
import type { AISummaryData } from "@/lib/ai-summary";
import VerdictBanner from "./VerdictBanner";
import CriticalDeadlines from "./CriticalDeadlines";
import FuturesDesk from "./FuturesDesk";
import CrackSpreads from "./CrackSpreads";
import ForwardCurve from "./ForwardCurve";
import TradeExpression from "./TradeExpression";
import InsuranceSignal from "./InsuranceSignal";
import ShipTransitSignal from "./ShipTransitSignal";
import OilSpreadSignal from "./OilSpreadSignal";
import StraitStatus from "./StraitStatus";
import VesselMapWrapper from "./VesselMapWrapper";
import GlobalSupplyDisruption from "./GlobalSupplyDisruption";
import CrisisTimeline from "./CrisisTimeline";
import RecoveryClock from "./RecoveryClock";
import SPRStatusBoard from "./SPRStatusBoard";
import DemandDestruction from "./DemandDestruction";
import InflationThreshold from "./InflationThreshold";
import AISummary from "./AISummary";

interface DashboardProps {
  data: ExtendedSignalData;
  futuresData?: FuturesData;
  crackData?: CrackSpreadData;
  forwardData?: ForwardCurveData;
  wtiBrentData?: WTIBrentSpreadData;
  aiSummary?: AISummaryData | null;
}

export default function Dashboard({ data, futuresData, crackData, forwardData, wtiBrentData, aiSummary }: DashboardProps) {
  // Wire live Brent price from Yahoo Finance into the Oil Spread signal
  const bzContract = futuresData?.contracts.find((c) => c.symbol === "BZ=F");
  const liveBrent = bzContract?.price;

  // Build merged oil spread data: live Brent + derived Dubai (static premium preserved)
  const oilSpreadData = (() => {
    if (liveBrent == null) return data.oilSpread;
    const dubaiPremium = data.oilSpread.dubai - data.oilSpread.brent;
    const liveDubai = liveBrent + dubaiPremium;
    const liveSpread = liveDubai - liveBrent;
    return {
      ...data.oilSpread,
      brent: liveBrent,
      dubai: liveDubai,
      spread: liveSpread,
      lastUpdated: futuresData?.timestamp ?? data.oilSpread.lastUpdated,
      brentSource: "Yahoo Finance (live)",
    };
  })();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* 1. Verdict Banner — compact direction call */}
      <VerdictBanner data={data} liveBrentPrice={liveBrent} />

      {/* 2. Critical Deadlines — "when does the cliff hit?" */}
      <div className="mt-6">
        <CriticalDeadlines data={data.timeline} />
      </div>

      {/* 3. Energy Futures Desk — actionable price exposure */}
      {futuresData && <FuturesDesk data={futuresData} signalData={data} />}

      {/* 3a. Crack Spreads — refining margins */}
      {crackData && (
        <section className="mt-6">
          <CrackSpreads data={crackData} />
        </section>
      )}

      {/* 3b. Forward Curve Structure */}
      {forwardData && (
        <section className="mt-6">
          <ForwardCurve data={forwardData} />
        </section>
      )}

      {/* 3c. Trade Expression — how to position */}
      <section className="mt-8">
        <TradeExpression oilPrice={forwardData?.promptPrice ?? 105} />
      </section>

      {/* 3d. WTI-Brent Spread — Hormuz-specific dislocation */}
      {wtiBrentData && (
        <section className="mt-6">
          <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              WTI-Brent Spread
            </h3>
            <p className="mt-1 mb-4 text-sm text-[var(--text-secondary)]">
              Collapsed from $15 to ${wtiBrentData.spread.toFixed(2)} — fair value is ~${wtiBrentData.fairValue} (TD25 freight economics)
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-lg bg-[var(--background)] p-3 text-center">
                <span className="block text-xl font-bold tabular-nums text-[var(--text-primary)]">
                  ${wtiBrentData.wtiPrice.toFixed(2)}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">WTI (CL)</span>
              </div>
              <div className="rounded-lg bg-[var(--background)] p-3 text-center">
                <span className="block text-xl font-bold tabular-nums text-[var(--text-primary)]">
                  ${wtiBrentData.brentPrice.toFixed(2)}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">Brent (BZ)</span>
              </div>
              <div className="rounded-lg bg-[var(--background)] p-3 text-center">
                <span className={`block text-xl font-bold tabular-nums ${wtiBrentData.spread < wtiBrentData.fairValue ? 'text-amber-400' : 'text-[var(--text-primary)]'}`}>
                  ${wtiBrentData.spread.toFixed(2)}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">Spread</span>
              </div>
              <div className="rounded-lg bg-[var(--background)] p-3 text-center">
                <span className="block text-xl font-bold tabular-nums text-[var(--text-secondary)]">
                  ${wtiBrentData.fairValue.toFixed(1)}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">Fair Value</span>
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-[var(--text-secondary)]">
              WTI flowing to new destinations (Greece for first time in 4 years). When spread &lt; fair value,
              WTI is overvalued relative to Brent — or Brent is not carrying the Hormuz premium it should.
              Your MCL (WTI) position benefits from convergence, but Hormuz-specific alpha is in Brent.
            </p>
            {!wtiBrentData.live && (
              <p className="mt-2 text-[10px] text-amber-400">Using fallback prices — market may be closed</p>
            )}
          </div>
        </section>
      )}

      {/* 4. Inflation Threshold — macro transmission chain */}
      <InflationThreshold
        data={data.inflationThreshold}
        currentOilPrice={forwardData?.promptPrice}
      />

      {/* 4a. Recovery Clock — how long until normal? */}
      <section className="mt-8">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            Crisis Recovery Timeline
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            From Sparta Commodities & Palmer Energy — Asia needs 4-5 months to normalize even after reopening
          </p>
        </div>
        <RecoveryClock data={data.recoveryClock} />
      </section>

      {/* 4b. SPR Status Board — who's released, who's holding */}
      <SPRStatusBoard data={data.sprStatus} />

      {/* 4c. Demand Destruction — the counter-signal */}
      <DemandDestruction data={data.demandDestruction} />

      {/* 5. Early Warning Signals — ranked by indicator quality */}
      <section className="mt-8">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            Early Warning Signals
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Leading indicators ranked by predictive value — insurance premiums move first
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Leading indicator — most weight */}
          <div className="relative">
            <span className="absolute -top-2 left-3 z-10 rounded bg-red-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-400 border border-red-500/30">
              Leading Indicator
            </span>
            <InsuranceSignal data={data.insurance} />
          </div>
          {/* Confirmation signal */}
          <div className="relative">
            <span className="absolute -top-2 left-3 z-10 rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400 border border-amber-500/30">
              Confirmation
            </span>
            <ShipTransitSignal data={data.shipTransit} />
          </div>
          {/* Market repricing signal */}
          <div className="relative">
            <span className="absolute -top-2 left-3 z-10 rounded bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-400 border border-blue-500/30">
              Market Repricing
            </span>
            <OilSpreadSignal data={oilSpreadData} />
          </div>
        </div>
      </section>

      {/* 5. Strait Status — compact context */}
      <div className="mt-8">
        <StraitStatus data={data.straitStatus} />
      </div>

      {/* 6. Vessel Traffic Map */}
      <section className="mt-8">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            Strait of Hormuz — Vessel Map
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            AIS positions vs normal traffic volume. Ghost markers show where ships should be.
          </p>
        </div>
        <VesselMapWrapper
          crisisCount={data.shipTransit.dailyCount}
          normalCount={data.shipTransit.baseline}
        />
      </section>

      {/* 7. Global Supply Disruption — consolidated macro + regional + routes */}
      <section className="mt-8">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            Global Supply Disruption
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Macro impact, regional exposure, and alternative routing costs
          </p>
        </div>
        <GlobalSupplyDisruption
          globalData={data.globalImpact}
          regionalData={data.regionalImpact}
        />
      </section>

      {/* 8. Crisis Timeline — historical context */}
      <section className="mt-8">
        <CrisisTimeline data={data.crisisTimeline} />
      </section>

      {/* 9. AI Daily Briefing — UAE impact analysis */}
      {aiSummary && <AISummary data={aiSummary} />}
    </div>
  );
}
