"use client";

import { useState } from "react";
import type { ExtendedSignalData, FuturesData, CrackSpreadData, ForwardCurveData, WTIBrentSpreadData, MarketIndicesData } from "@/lib/types";
import type { HyperliquidData } from "@/lib/futures-api";
import type { AISummaryData } from "@/lib/ai-summary";
import { getInsuranceStatus, getShipStatus, getSpreadStatus, statusColor } from "@/lib/utils";
import type { SignalStatus } from "@/lib/types";

// Recharts needs raw hex colors — CSS variables don't work in SVG
function chartColor(status: SignalStatus): string {
  switch (status) {
    case "red": return "#ef4444";
    case "yellow": return "#eab308";
    case "green": return "#22c55e";
  }
}
import MiniTrendChart from "./MiniTrendChart";
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
import HyperliquidPerps from "./HyperliquidPerps";
import FuturesExpiry from "./FuturesExpiry";

interface DashboardProps {
  data: ExtendedSignalData;
  futuresData?: FuturesData;
  crackData?: CrackSpreadData;
  forwardData?: ForwardCurveData;
  wtiBrentData?: WTIBrentSpreadData;
  marketData?: MarketIndicesData;
  aiSummary?: AISummaryData | null;
  hyperliquidData?: HyperliquidData;
}

export default function Dashboard({ data, futuresData, crackData, forwardData, wtiBrentData, marketData, aiSummary, hyperliquidData }: DashboardProps) {
  // Wire live prices from Yahoo Finance
  const bzContract = futuresData?.contracts.find((c) => c.symbol === "BZ=F");
  const clContract = futuresData?.contracts.find((c) => c.symbol === "CL=F");
  const liveBrent = bzContract?.price;
  const liveWti = clContract?.price;

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

  // Collapsible section state
  const [timelineOpen, setTimelineOpen] = useState(true);
  const [tradeOpen, setTradeOpen] = useState(true);
  const [contextOpen, setContextOpen] = useState(false);

  // Change-from-yesterday deltas
  const prevInsurance = data.insurance.history.length >= 2
    ? data.insurance.history[data.insurance.history.length - 2].value
    : null;
  const insuranceDelta = prevInsurance != null ? data.insurance.current - prevInsurance : null;

  const prevShips = data.shipTransit.history.length >= 2
    ? data.shipTransit.history[data.shipTransit.history.length - 2].count
    : null;
  const shipsDelta = prevShips != null ? data.shipTransit.dailyCount - prevShips : null;

  const prevSpread = data.oilSpread.history.length >= 2
    ? data.oilSpread.history[data.oilSpread.history.length - 2].dubai - data.oilSpread.history[data.oilSpread.history.length - 2].brent
    : null;
  const spreadDelta = prevSpread != null ? spreadForDisplay - prevSpread : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* 1. Verdict Banner */}
      <VerdictBanner data={data} liveBrentPrice={liveBrent} wtiPrice={liveWti} />

      {/* Data freshness bar */}
      <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-[var(--text-secondary)]">
        <span>Data as of {new Date(Math.max(
          new Date(data.insurance.lastUpdated).getTime(),
          new Date(data.shipTransit.lastUpdated).getTime(),
          new Date(data.oilSpread.lastUpdated).getTime(),
          futuresData?.timestamp ? new Date(futuresData.timestamp).getTime() : 0
        )).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}</span>
        <span className="text-[var(--card-border)]">|</span>
        <span>Futures refresh every 15 min</span>
      </div>

      {/* ─── SECTION A: THE SIGNAL ─── */}
      {/* Verdict + Early Warning Signals */}
      <section>
        {/* Verdict Banner */}
        {/* (already rendered above) */}

        {/* Early Warning Signal strip */}
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
          {/* Insurance Premium */}
          <div className="flex flex-col rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-4 py-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              <span className="text-[var(--accent)]">Signal 1</span> — Insurance Premium
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span
                className="inline-block h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: statusColor(insuranceStatus) }}
              />
              <span className="text-xl font-bold tabular-nums" style={{ color: statusColor(insuranceStatus) }}>
                {data.insurance.current.toFixed(1)}% hull value
              </span>
              {insuranceDelta != null && insuranceDelta !== 0 && (
                <span className={`text-xs font-semibold ${insuranceDelta > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {insuranceDelta > 0 ? '+' : ''}{insuranceDelta.toFixed(1)}pp
                </span>
              )}
            </div>
            <div className="mt-0.5 text-xs text-[var(--text-secondary)]">{insuranceLabel}</div>
            <div className="mt-1.5 text-[11px] leading-snug text-[var(--text-secondary)] italic">
              Lloyd&apos;s underwriters price real risk — when premiums spike, smart money sees danger
            </div>
            <div className="flex-1" />
            <div className="mt-2">
              <MiniTrendChart
                data={data.insurance.history.map(h => ({ date: h.date, value: h.value }))}
                color={chartColor(insuranceStatus)}
                thresholdValue={2.0}
              />
              <div className="mt-1 flex justify-between text-[9px] text-[var(--text-secondary)]">
                <span>30d ago</span>
                <span>Today</span>
              </div>
            </div>
          </div>

          {/* Strait Transits */}
          <div className="flex flex-col rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-4 py-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              <span className="text-[var(--accent)]">Signal 2</span> — Strait Transits
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span
                className="inline-block h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: statusColor(shipStatus) }}
              />
              <span className="text-xl font-bold tabular-nums" style={{ color: statusColor(shipStatus) }}>
                {data.shipTransit.dailyCount} ships/day
              </span>
              {shipsDelta != null && shipsDelta !== 0 && (
                <span className={`text-xs font-semibold ${shipsDelta > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {shipsDelta > 0 ? '+' : ''}{shipsDelta}
                </span>
              )}
            </div>
            <div className="mt-0.5 text-xs text-[var(--text-secondary)]">{shipLabel}</div>
            <div className="mt-1.5 text-[11px] leading-snug text-[var(--text-secondary)] italic">
              AIS ship counts are physical proof — vessels either transit or they don&apos;t
            </div>
            <div className="flex-1" />
            <div className="mt-2">
              <MiniTrendChart
                data={data.shipTransit.history.map(h => ({ date: h.date, value: h.count }))}
                color={chartColor(shipStatus)}
                thresholdValue={35}
              />
              <div className="mt-1 flex justify-between text-[9px] text-[var(--text-secondary)]">
                <span>30d ago</span>
                <span>Today</span>
              </div>
            </div>
          </div>

          {/* Paper vs Physical */}
          <div className="flex flex-col rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                <span className="text-[var(--accent)]">Signal 3</span> — Paper vs Physical
              </span>
              {liveBrent != null && (
                <>
                  <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/30">
                    Brent Live
                  </span>
                  <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-400 border border-amber-500/30">
                    Dubai Est.
                  </span>
                </>
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
              {spreadDelta != null && Math.abs(spreadDelta) >= 0.5 && (
                <span className={`text-xs font-semibold ${spreadDelta > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {spreadDelta > 0 ? '+' : ''}${spreadDelta.toFixed(0)}
                </span>
              )}
            </div>
            <div className="mt-0.5 text-xs text-[var(--text-secondary)]">{spreadLabel}</div>
            <div className="mt-1.5 text-[11px] leading-snug text-[var(--text-secondary)]">
              Brent ${oilSpreadData.brent.toFixed(0)} vs Dubai Physical ${oilSpreadData.dubai.toFixed(0)} — Asia pays the physical price, not the paper headline. Political jawboning compresses Brent but refiners get no discount.
            </div>
            <div className="mt-1.5 text-[11px] leading-snug text-[var(--text-secondary)] italic">
              Refiners pay physical prices, not paper — this gap reveals the real cost
            </div>
            <div className="flex-1" />
            <div className="mt-2">
              <MiniTrendChart
                data={data.oilSpread.history.map(h => ({ date: h.date, value: h.dubai - h.brent }))}
                color={chartColor(spreadStatus)}
                thresholdValue={8}
              />
              <div className="mt-1 flex justify-between text-[9px] text-[var(--text-secondary)]">
                <span>30d ago</span>
                <span>Today</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION B: THE TIMELINE ─── */}
      <div className="mt-10 mb-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-[var(--card-border)]" />
        <button
          onClick={() => setTimelineOpen(!timelineOpen)}
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
            What Happens Next
          </span>
          <svg className={`w-3 h-3 text-[var(--accent)] transition-transform ${timelineOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div className="h-px flex-1 bg-[var(--card-border)]" />
      </div>

      {timelineOpen && (
        <div>
          <CriticalDeadlines data={data.timeline} />
        </div>
      )}

      {/* ─── SECTION C: THE TRADE ─── */}
      <div className="mt-10 mb-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-[var(--card-border)]" />
        <button
          onClick={() => setTradeOpen(!tradeOpen)}
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
              Actionable Intelligence
            </span>
            <span className="mt-0.5 text-xs text-[var(--text-secondary)]">Live futures prices with signal-based impact projections — where the signals meet the market</span>
          </div>
          <svg className={`w-3 h-3 text-[var(--accent)] transition-transform ${tradeOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div className="h-px flex-1 bg-[var(--card-border)]" />
      </div>

      {tradeOpen && (
        <div>
          {/* Energy Futures Desk */}
          {futuresData && <FuturesDesk data={futuresData} signalData={data} />}

          {/* CL Futures Expiry Calendar */}
          <section className="mt-6">
            <FuturesExpiry />
          </section>

          {/* Hyperliquid Oil Perps — 24/7 pricing when CME is closed */}
          {hyperliquidData && (
            <section className="mt-6">
              <HyperliquidPerps data={hyperliquidData} />
            </section>
          )}

          {/* Market Pulse */}
          {marketData && <MarketPulse data={marketData} />}

          {/* Crack Spreads */}
          {crackData && (
            <section className="mt-6">
              <CrackSpreads data={crackData} />
            </section>
          )}

          {/* Forward Curve Structure */}
          {forwardData && (
            <section className="mt-6">
              <ForwardCurve data={forwardData} />
            </section>
          )}

          {/* Trade Expression */}
          <section className="mt-8">
            <TradeExpression oilPrice={forwardData?.promptPrice ?? 105} />
          </section>

          {/* WTI-Brent Spread */}
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
                    <span className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">WTI{wtiBrentData.contractMonth ? ` ${wtiBrentData.contractMonth}` : ' (CL)'}</span>
                  </div>
                  <div className="rounded-lg bg-[var(--background)] p-3 text-center">
                    <span className="block text-xl font-bold tabular-nums text-[var(--text-primary)]">
                      ${wtiBrentData.brentPrice.toFixed(2)}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">Brent{wtiBrentData.contractMonth ? ` ${wtiBrentData.contractMonth}` : ' (BZ)'}</span>
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
        </div>
      )}

      {/* ─── SECTION D: THE CONTEXT ─── */}
      <div className="mt-10 mb-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-[var(--card-border)]" />
        <button
          onClick={() => setContextOpen(!contextOpen)}
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
              Deep Context
            </span>
            <span className="mt-0.5 text-xs text-[var(--text-secondary)]">Macro transmission, recovery timeline, strategic reserves, and supply analysis</span>
          </div>
          <svg className={`w-3 h-3 text-[var(--accent)] transition-transform ${contextOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div className="h-px flex-1 bg-[var(--card-border)]" />
      </div>

      {contextOpen && (
        <div>
          {/* Inflation Threshold */}
          <InflationThreshold
            data={data.inflationThreshold}
            currentOilPrice={forwardData?.promptPrice}
          />

          {/* Recovery Clock */}
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

          {/* SPR Status Board */}
          <SPRStatusBoard data={data.sprStatus} />

          {/* Demand Destruction */}
          <DemandDestruction data={data.demandDestruction} />

          {/* Strait Status */}
          <div className="mt-8">
            <StraitStatus data={data.straitStatus} />
          </div>

          {/* Vessel Traffic Map */}
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

          {/* Global Supply Disruption */}
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

          {/* Crisis Timeline */}
          <section className="mt-8">
            <CrisisTimeline data={data.crisisTimeline} />
          </section>

          {/* AI Daily Briefing */}
          {aiSummary && <AISummary data={aiSummary} />}
        </div>
      )}
    </div>
  );
}
