"use client";

import type { ShipTransitSignal as ShipTransitSignalType } from "@/lib/types";
import { getShipStatus } from "@/lib/utils";
import SignalCard from "./SignalCard";
import SparkChart from "./SparkChart";

interface ShipTransitSignalProps {
  data: ShipTransitSignalType;
}

function getStatusLabel(count: number): string {
  if (count < 20) return "Effectively Closed";
  if (count < 40) return "Trickle";
  return "Trade Resuming";
}

export default function ShipTransitSignal({ data }: ShipTransitSignalProps) {
  const collapsePercent = Math.round(
    (1 - data.dailyCount / data.baseline) * 100
  );
  const outbound = data.dailyCount - data.returnLegs;

  const sparkData = data.history.map((h) => ({
    date: h.date,
    value: h.count,
  }));

  return (
    <SignalCard
      title="Strait Transit Count"
      subtitle="Daily vessel crossings via AIS tracking"
      status={getShipStatus(data.dailyCount)}
      statusLabel={getStatusLabel(data.dailyCount)}
      lastUpdated={data.lastUpdated}
      source={data.source}
    >
      <div className="flex flex-col gap-4">
        {/* Big number: daily transit count */}
        <div>
          <span className="text-5xl font-bold tracking-tight text-[var(--text-primary)]">
            {data.dailyCount}
          </span>
          <span className="ml-2 text-sm text-[var(--text-secondary)]">
            ships/day
          </span>
        </div>

        {/* Collapse stat */}
        <p className="text-sm font-medium text-[var(--danger)]">
          ↓ {collapsePercent}% from baseline
        </p>

        {/* Return legs breakdown */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-[var(--background)] px-4 py-3">
            <p className="text-xs text-[var(--text-secondary)]">Outbound</p>
            <p className="mt-1 text-xl font-semibold text-[var(--text-primary)]">
              {outbound}
            </p>
          </div>
          <div className="rounded-lg bg-[var(--background)] px-4 py-3">
            <p className="text-xs text-[var(--text-secondary)]">Return legs</p>
            <p className="mt-1 text-xl font-semibold text-[var(--text-primary)]">
              {data.returnLegs}
            </p>
            <p className="mt-1 text-[10px] leading-tight text-[var(--text-secondary)]">
              Return legs are the leading indicator
            </p>
          </div>
        </div>

        {/* Threshold note */}
        <p className="text-xs text-[var(--text-secondary)]">
          Recovery signal: 30-40 ships/day = trade resuming
        </p>

        {/* SparkChart */}
        <SparkChart data={sparkData} threshold={35} color="var(--accent)" />

        {/* Dark fleet caveat */}
        <div className="flex gap-2 rounded-lg bg-[#1a1a2e] px-3 py-2.5">
          <span className="mt-0.5 shrink-0 text-sm text-[var(--text-secondary)]">
            ℹ
          </span>
          <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
            {data.darkFleetNote}
          </p>
        </div>
      </div>
    </SignalCard>
  );
}
