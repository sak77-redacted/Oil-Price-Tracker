"use client";

import type { ExtendedSignalData, FuturesData } from "@/lib/types";
import VerdictBanner from "./VerdictBanner";
import CriticalDeadlines from "./CriticalDeadlines";
import FuturesDesk from "./FuturesDesk";
import InsuranceSignal from "./InsuranceSignal";
import ShipTransitSignal from "./ShipTransitSignal";
import OilSpreadSignal from "./OilSpreadSignal";
import StraitStatus from "./StraitStatus";
import VesselMapWrapper from "./VesselMapWrapper";
import GlobalSupplyDisruption from "./GlobalSupplyDisruption";
import CrisisTimeline from "./CrisisTimeline";

interface DashboardProps {
  data: ExtendedSignalData;
  futuresData?: FuturesData;
}

export default function Dashboard({ data, futuresData }: DashboardProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* 1. Verdict Banner — compact direction call */}
      <VerdictBanner data={data} />

      {/* 2. Critical Deadlines — "when does the cliff hit?" */}
      <div className="mt-6">
        <CriticalDeadlines data={data.timeline} />
      </div>

      {/* 3. Energy Futures Desk — actionable price exposure */}
      {futuresData && <FuturesDesk data={futuresData} signalData={data} />}

      {/* 4. Early Warning Signals — ranked by indicator quality */}
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
            <OilSpreadSignal data={data.oilSpread} />
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
    </div>
  );
}
