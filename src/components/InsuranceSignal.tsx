"use client";

import type { InsuranceSignal as InsuranceSignalType } from "@/lib/types";
import { getInsuranceStatus, statusColor } from "@/lib/utils";
import SignalCard from "./SignalCard";
import SparkChart from "./SparkChart";

interface InsuranceSignalProps {
  data: InsuranceSignalType;
}

export default function InsuranceSignal({ data }: InsuranceSignalProps) {
  const status = getInsuranceStatus(data.current);
  const multiplier = Math.round(data.current / data.baseline);
  const insuranceCost = (data.current * 100_000_000) / 100;
  const formattedCost = insuranceCost.toLocaleString("en-US");

  const statusLabel =
    status === "red"
      ? "Crisis Pricing"
      : status === "yellow"
        ? "Elevated Risk"
        : "Normalizing";

  const sparkData = data.history.map((point) => ({
    date: point.date,
    value: point.value,
  }));

  return (
    <SignalCard
      title="Ship Insurance Premiums"
      subtitle="Lloyd's war risk premium — % of hull value"
      status={status}
      statusLabel={statusLabel}
      lastUpdated={data.lastUpdated}
      source={data.source}
    >
      <div className="flex flex-col gap-4">
        {/* Big number */}
        <div>
          <span
            className="text-5xl font-bold tracking-tight"
            style={{ color: statusColor(status) }}
          >
            {data.current.toFixed(1)}%
          </span>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            of hull value
          </p>
        </div>

        {/* Context line */}
        <p className="text-sm text-[var(--text-secondary)]">
          Pre-war: {data.baseline}% | Threshold: below {data.threshold}% = safer
        </p>

        {/* Cost example */}
        <div className="rounded-lg bg-[var(--background)] px-4 py-3">
          <p className="text-sm text-[var(--text-secondary)]">
            A <span className="text-[var(--text-primary)] font-medium">$100M tanker</span> costs{" "}
            <span className="text-[var(--text-primary)] font-medium">${formattedCost}</span> to
            insure per transit
          </p>
        </div>

        {/* Change indicator */}
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-semibold"
            style={{ color: statusColor(status) }}
          >
            {multiplier}x pre-war levels
          </span>
          <span className="text-xs text-[var(--text-secondary)]">
            (baseline {data.baseline}%)
          </span>
        </div>

        {/* SparkChart */}
        <SparkChart
          data={sparkData}
          threshold={data.threshold}
          color="var(--danger)"
          height={80}
        />
      </div>
    </SignalCard>
  );
}
