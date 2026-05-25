"use client";

import { useState } from "react";
import type { ExtendedSignalData, FuturesData, CrackSpreadData, ForwardCurveData, WTIBrentSpreadData, MarketIndicesData, SignalData } from "@/lib/types";
import type { HyperliquidData } from "@/lib/futures-api";
import type { AISummaryData } from "@/lib/ai-summary";

import VerdictBanner from "./VerdictBanner";
import TradeSetup from "./TradeSetup";
import PhaseIndicator from "./PhaseIndicator";
import CriticalPath from "./CriticalPath";
import TodaysTape from "./TodaysTape";
import WatchThisWeek from "./WatchThisWeek";

// Tier 2 — regime signals
import InsuranceSignal from "./InsuranceSignal";
import OilSpreadSignal from "./OilSpreadSignal";
import CurveShapeSignal from "./CurveShapeSignal";
import PaperMarketSignal from "./PaperMarketSignal";
import BuyerStressSignal from "./BuyerStressSignal";
import ShipTransitSignal from "./ShipTransitSignal";
import TankerRatesSignal from "./TankerRatesSignal";
import VolSkewSignal from "./VolSkewSignal";

// Tier 3 — structural context
import SPRCliffSignal from "./SPRCliffSignal";
import SupplyBalanceSignal from "./SupplyBalanceSignal";
import InventoryDrawsSignal from "./InventoryDrawsSignal";
import USProductStocksSignal from "./USProductStocksSignal";
import USCommercialCrudeStorage from "./USCommercialCrudeStorage";
import DemandDestructionReality from "./DemandDestructionReality";
import EquityDisbeliefSignal from "./EquityDisbeliefSignal";
import CriticalDeadlines from "./CriticalDeadlines";
import RecoveryClock from "./RecoveryClock";

// Trade execution & deep context (preserved below tiers)
import FuturesDesk from "./FuturesDesk";
import CrackSpreads from "./CrackSpreads";
import ForwardCurve from "./ForwardCurve";
import TradeExpression from "./TradeExpression";
import StraitStatus from "./StraitStatus";
import VesselMapWrapper from "./VesselMapWrapper";
import GlobalSupplyDisruption from "./GlobalSupplyDisruption";
import CrisisTimeline from "./CrisisTimeline";
import SPRStatusBoard from "./SPRStatusBoard";
import DemandDestruction from "./DemandDestruction";
import InflationThreshold from "./InflationThreshold";
import MarketPulse from "./MarketPulse";
import AISummary from "./AISummary";
import HyperliquidPerps from "./HyperliquidPerps";
import FuturesExpiry from "./FuturesExpiry";
import TankerRates from "./TankerRates";
import IranianAttacks from "./IranianAttacks";

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

/**
 * Section divider — editorial-style hierarchy used between tiers.
 * Bold uppercase label, horizontal rule, and one-line tier description.
 */
function TierDivider({ label, description }: { label: string; description: string }) {
  return (
    <div className="mt-12 border-t border-zinc-800 pt-6">
      <div className="flex flex-col items-start gap-1">
        <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--accent)]">
          {label}
        </span>
        <span className="text-sm text-white/55">{description}</span>
      </div>
    </div>
  );
}

export default function Dashboard({
  data,
  futuresData,
  crackData,
  forwardData,
  wtiBrentData,
  marketData,
  aiSummary,
  hyperliquidData,
}: DashboardProps) {
  // Wire live prices from Yahoo Finance for the Verdict + Tape
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

  // Tape needs a SignalData with live oil spread baked in so backwardation /
  // 0DTE / insurance read from the same root, but Brent reads live.
  const tapeData: SignalData = liveBrent != null
    ? { ...data, oilSpread: oilSpreadData }
    : data;

  // Tier 3 collapsible state — closed by default per spec.
  const [structuralOpen, setStructuralOpen] = useState(false);
  // Trade-execution + deep-context sections — preserved from prior layout, collapsible.
  const [tradeOpen, setTradeOpen] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* ═════════════════════════════════════════════════════════════════
          TIER 1 — ACTION
          Always visible. First viewport. What to act on today.
          ═════════════════════════════════════════════════════════════════ */}
      <VerdictBanner data={data} liveBrentPrice={liveBrent} wtiPrice={liveWti} />

      {/* Trade Setup — derived trade ticket + exit triggers + thesis health */}
      <TradeSetup data={data} liveBrentPrice={liveBrent} />

      {/* Inventory Phase Indicator — JH/@CRUDEOIL231 framework */}
      {data.phaseIndicator && <PhaseIndicator data={data.phaseIndicator} />}

      {/* HFI Critical Path — two dated milestones (mid-June / late-July) */}
      {data.criticalPath && <CriticalPath data={data.criticalPath} />}

      <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-[var(--text-secondary)]">
        <span>
          Data as of{" "}
          {new Date(
            Math.max(
              new Date(data.insurance.lastUpdated).getTime(),
              new Date(data.shipTransit.lastUpdated).getTime(),
              new Date(data.oilSpread.lastUpdated).getTime(),
              futuresData?.timestamp ? new Date(futuresData.timestamp).getTime() : 0,
            ),
          ).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            timeZoneName: "short",
          })}
        </span>
        <span className="text-[var(--card-border)]">|</span>
        <span>Futures refresh every 15 min</span>
      </div>

      {/* Today's Tape — 6 live tiles */}
      <section className="mt-6">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/65">
            Today&apos;s Tape
          </h2>
          <span className="text-[10px] uppercase tracking-wider text-white/40">
            Live · delta vs prior session
          </span>
        </div>
        <TodaysTape data={tapeData} liveBrentPrice={liveBrent} />
      </section>

      {/* Watch This Week — top 3 dated catalysts */}
      <section className="mt-6">
        <WatchThisWeek data={data} />
      </section>

      {/* ═════════════════════════════════════════════════════════════════
          TIER 2 — REGIME
          The five-to-six signals that move the verdict.
          ═════════════════════════════════════════════════════════════════ */}
      <TierDivider
        label="Tier 2 — Regime"
        description="The five-to-six signals that move the verdict. Tick-horizon — these move daily."
      />

      <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <InsuranceSignal data={data.insurance} />
        <OilSpreadSignal data={oilSpreadData} />
        {data.curveShape && <CurveShapeSignal data={data.curveShape} />}
        {data.paperMarket && <PaperMarketSignal data={data.paperMarket} />}
        {data.buyerStress && <BuyerStressSignal data={data.buyerStress} />}
        <ShipTransitSignal data={data.shipTransit} />
        {data.tankerEconomics && (
          <TankerRatesSignal data={data.tankerEconomics} />
        )}
        {data.volSkew && <VolSkewSignal data={data.volSkew} />}
      </section>

      {/* ═════════════════════════════════════════════════════════════════
          TIER 3 — STRUCTURAL CONTEXT
          Slower-moving. Depth, history, and structural drivers.
          ═════════════════════════════════════════════════════════════════ */}
      <TierDivider
        label="Tier 3 — Structural Context"
        description="Depth, history, and structural drivers. Slower-moving — these move monthly."
      />

      <details
        className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/40"
        open={structuralOpen}
        onToggle={(e) => setStructuralOpen((e.target as HTMLDetailsElement).open)}
      >
        <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-4 text-sm font-semibold text-white/85 hover:bg-zinc-900/40">
          <span>Show 7 structural signals</span>
          <span className="text-xs text-white/45">
            {structuralOpen ? "Hide ▴" : "Show ▾"}
          </span>
        </summary>
        <div className="space-y-6 px-5 pb-6 pt-2">
          <SPRCliffSignal />
          <SupplyBalanceSignal
            physicalMarketNote={data.bufferMath.physicalMarketNote}
            physicalMarketNotes={data.bufferMath.physicalMarketNotes}
            usInventoryDecomp={data.bufferMath.usInventoryDecomp}
            globalInventoryDecomp={data.bufferMath.globalInventoryDecomp}
          />
          {data.inventoryDraws && <InventoryDrawsSignal data={data.inventoryDraws} />}
          {data.usProductStocks && <USProductStocksSignal data={data.usProductStocks} />}
          {data.usCommercialCrudeStorage && (
            <USCommercialCrudeStorage data={data.usCommercialCrudeStorage} />
          )}
          {data.demandDestructionReality && (
            <DemandDestructionReality
              data={data.demandDestructionReality}
              exports={data.exportTrackers}
            />
          )}
          {data.equityDisbelief && <EquityDisbeliefSignal data={data.equityDisbelief} />}
          <CriticalDeadlines data={data.timeline} />
          <div>
            <div className="mb-4">
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Crisis Recovery Timeline
              </h3>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                From Sparta Commodities & Palmer Energy — Asia needs 4-5 months to normalize even after reopening
              </p>
            </div>
            <RecoveryClock data={data.recoveryClock} />
          </div>
        </div>
      </details>

      {/* ═════════════════════════════════════════════════════════════════
          TRADE EXECUTION — futures, cracks, forward curve, hedges
          Preserved from prior layout. Collapsible.
          ═════════════════════════════════════════════════════════════════ */}
      <div className="mt-12 border-t border-zinc-800 pt-6">
        <button
          onClick={() => setTradeOpen(!tradeOpen)}
          className="flex w-full items-baseline justify-between text-left"
        >
          <div className="flex flex-col items-start gap-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--accent)]">
              Trade Execution
            </span>
            <span className="text-sm text-white/55">
              Live futures prices, cracks, forward curve, and trade expression.
            </span>
          </div>
          <span className="text-xs text-white/45">{tradeOpen ? "Hide ▴" : "Show ▾"}</span>
        </button>
      </div>

      {tradeOpen && (
        <div className="mt-4 space-y-6">
          {futuresData && <FuturesDesk data={futuresData} signalData={data} />}
          <FuturesExpiry />
          <TankerRates data={data.tankerRates} />
          {hyperliquidData && <HyperliquidPerps data={hyperliquidData} />}
          {marketData && <MarketPulse data={marketData} />}
          {crackData && <CrackSpreads data={crackData} marginsData={data.refiningMargins} />}
          {forwardData && <ForwardCurve data={forwardData} />}
          <TradeExpression oilPrice={forwardData?.promptPrice ?? 105} />
          {wtiBrentData && (
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
                  <span className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
                    WTI{wtiBrentData.contractMonth ? ` ${wtiBrentData.contractMonth}` : " (CL)"}
                  </span>
                </div>
                <div className="rounded-lg bg-[var(--background)] p-3 text-center">
                  <span className="block text-xl font-bold tabular-nums text-[var(--text-primary)]">
                    ${wtiBrentData.brentPrice.toFixed(2)}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
                    Brent{wtiBrentData.contractMonth ? ` ${wtiBrentData.contractMonth}` : " (BZ)"}
                  </span>
                </div>
                <div className="rounded-lg bg-[var(--background)] p-3 text-center">
                  <span
                    className={`block text-xl font-bold tabular-nums ${wtiBrentData.spread < wtiBrentData.fairValue ? "text-amber-400" : "text-[var(--text-primary)]"}`}
                  >
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
              {!wtiBrentData.live && (
                <p className="mt-2 text-[10px] text-amber-400">Using fallback prices — market may be closed</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════
          DEEP CONTEXT — macro transmission, vessels, geopolitics
          Preserved from prior layout. Collapsible.
          ═════════════════════════════════════════════════════════════════ */}
      <div className="mt-12 border-t border-zinc-800 pt-6">
        <button
          onClick={() => setContextOpen(!contextOpen)}
          className="flex w-full items-baseline justify-between text-left"
        >
          <div className="flex flex-col items-start gap-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--accent)]">
              Deep Context
            </span>
            <span className="text-sm text-white/55">
              Macro transmission, strategic reserves, vessel maps, regional geopolitics.
            </span>
          </div>
          <span className="text-xs text-white/45">{contextOpen ? "Hide ▴" : "Show ▾"}</span>
        </button>
      </div>

      {contextOpen && (
        <div className="mt-4 space-y-8">
          <InflationThreshold data={data.inflationThreshold} currentOilPrice={forwardData?.promptPrice} />
          <SPRStatusBoard data={data.sprStatus} />
          <DemandDestruction data={data.demandDestruction} />
          <StraitStatus data={data.straitStatus} />
          <section>
            <div className="mb-4">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">
                Strait of Hormuz — Vessel Map
              </h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                AIS positions vs normal traffic volume. Ghost markers show where ships should be.
              </p>
            </div>
            <VesselMapWrapper crisisCount={data.shipTransit.dailyCount} normalCount={data.shipTransit.baseline} />
          </section>
          <section>
            <div className="mb-4">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Global Supply Disruption</h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Macro impact, regional exposure, and alternative routing costs
              </p>
            </div>
            <GlobalSupplyDisruption globalData={data.globalImpact} regionalData={data.regionalImpact} />
          </section>
          <IranianAttacks data={data.iranianAttacks} />
          <CrisisTimeline data={data.crisisTimeline} />
          {aiSummary && <AISummary data={aiSummary} />}
        </div>
      )}
    </div>
  );
}
