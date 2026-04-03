"use client";

import type { ExtendedSignalData, FuturesData, CrackSpreadData, ForwardCurveData, WTIBrentSpreadData, MarketIndicesData } from "@/lib/types";
import type { AISummaryData } from "@/lib/ai-summary";
import { getInsuranceStatus, getShipStatus, getSpreadStatus, statusColor } from "@/lib/utils";
import VerdictBanner from "./VerdictBanner";
import CriticalDeadlines from "./CriticalDeadlines";
import FuturesDesk from "./FuturesDesk";
import CrackSpreads from "./CrackSpreads";
import ForwardCurve from "./ForwardCurve";
import TradeExpression from "./TradeExpression";
import StraitStatus from "./StraitStatus";
import VesselMapWrapper from "./VesselMapWrapper";
import GlobalSupplyDisruption from "./GlobalSupplyDisruption";
import CrisisTimeline from "./CrisisTimeline";
import RecoveryClock from "./RecoveryClock";
import SPRStatusBoard from "./SPRStatusBoard";
import DemandDestruction from "./DemandDestruction";
import InflationThreshold from "./InflationThreshold";
import MarketPulse from "./MarketPulse";
import AISummary from "./AISummary";

interface DashboardProps {
  data: ExtendedSignalData;
  futuresData?: FuturesData;
  crackData?: CrackSpreadData;
  forwardData?: ForwardCurveData;
  wtiBrentData?: WTIBrentSpreadData;
  marketData?: MarketIndicesData;
  aiSummary?: AISummaryData | null;
}

export default function Dashboard({ data, futuresData, crackData, forwardData, wtiBrentData, marketData, aiSummary }: DashboardProps) {
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

  // Compute statuses for compact Early Warning Signals strip
  const insuranceStatus = getInsuranceStatus(data.insurance.current);
  const shipStatus = getShipStatus(data.shipTransit.dailyCount);
  const spreadForDisplay = liveBrent != null ? oilSpreadData.spread : data.oilSpread.spread;
  const spreadStatus = getSpreadStatus(spreadForDisplay);

  const insuranceLabel =
    insuranceStatus === "red" ? "Extreme Risk" : insuranceStatus === "yellow" ? "Elevated" : "Normalizing";
  const shipLabel =
    data.shipTransit.dailyCount === 0
      ? "Effectively Closed"
      : shipStatus === "red"
        ? "Severely Disrupted"
        : shipStatus === "yellow"
          ? "Below Normal"
          : "Normal Flow";
  const spreadLabel =
    spreadStatus === "red" ? "Severe Disconnect" : spreadStatus === "yellow" ? "Widening" : "Normal Range";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* 1. Verdict Banner */}
      <VerdictBanner data={data} liveBrentPrice={liveBrent} />

      {/* 2. Early Warning Signals — compact horizontal strip */}
      <section className="mt-6">
        <h2 className="mb-1 text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">
          Early Warning Signals
        </h2>
        <p className="mb-3 text-xs text-[var(--text-secondary)]">
          These are priced by people with real money on the line — insurance premiums, ship counts, and physical crude spreads don&apos;t lie. Everything else is noise.
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {/* Insurance Premium */}
          <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-4 py-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Insurance Premium
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span
                className="inline-block h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: statusColor(insuranceStatus) }}
              />
              <span className="text-xl font-bold tabular-nums" style={{ color: statusColor(insuranceStatus) }}>
                {data.insurance.current.toFixed(1)}% hull value
              </span>
            </div>
            <div className="mt-0.5 text-xs text-[var(--text-secondary)]">{insuranceLabel}</div>
          </div>

          {/* Strait Transits */}
          <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-4 py-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Strait Transits
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span
                className="inline-block h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: statusColor(shipStatus) }}
              />
              <span className="text-xl font-bold tabular-nums" style={{ color: statusColor(shipStatus) }}>
                {data.shipTransit.dailyCount} ships/day
              </span>
            </div>
            <div className="mt-0.5 text-xs text-[var(--text-secondary)]">{shipLabel}</div>
          </div>

          {/* Paper vs Physical */}
          <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Paper vs Physical
              </span>
              {liveBrent != null && (
                <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/30">
                  Live
                </span>
              )}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span
                className="inline-block h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: statusColor(spreadStatus) }}
              />
              <span className="text-xl font-bold tabular-nums" style={{ color: statusColor(spreadStatus) }}>
                ${spreadForDisplay.toFixed(0)} spread
              </span>
            </div>
            <div className="mt-0.5 text-xs text-[var(--text-secondary)]">{spreadLabel}</div>
          </div>
        </div>
      </section>

      {/* 3. Critical Deadlines */}
      <div className="mt-6">
        <CriticalDeadlines data={data.timeline} />
      </div>

      {/* 4. Energy Futures Desk */}
      {futuresData && <FuturesDesk data={futuresData} signalData={data} />}

      {/* 4b. Market Pulse */}
      {marketData && <MarketPulse data={marketData} />}

      {/* 5. Crack Spreads */}
      {crackData && (
        <section className="mt-6">
          <CrackSpreads data={crackData} />
        </section>
      )}

      {/* 6. Forward Curve Structure */}
      {forwardData && (
        <section className="mt-6">
          <ForwardCurve data={forwardData} />
        </section>
      )}

      {/* 7. Trade Expression */}
      <section className="mt-8">
        <TradeExpression oilPrice={forwardData?.promptPrice ?? 105} />
      </section>

      {/* 8. WTI-Brent Spread */}
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

      {/* 9. Inflation Threshold */}
      <InflationThreshold
        data={data.inflationThreshold}
        currentOilPrice={forwardData?.promptPrice}
      />

      {/* 10. Recovery Clock */}
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

      {/* 11. SPR Status Board */}
      <SPRStatusBoard data={data.sprStatus} />

      {/* 12. Demand Destruction */}
      <DemandDestruction data={data.demandDestruction} />

      {/* 13. Strait Status */}
      <div className="mt-8">
        <StraitStatus data={data.straitStatus} />
      </div>

      {/* 14. Vessel Traffic Map */}
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

      {/* 15. Global Supply Disruption */}
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

      {/* 16. Crisis Timeline */}
      <section className="mt-8">
        <CrisisTimeline data={data.crisisTimeline} />
      </section>

      {/* 17. AI Daily Briefing */}
      {aiSummary && <AISummary data={aiSummary} />}
    </div>
  );
}
