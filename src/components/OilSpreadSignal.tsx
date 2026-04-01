"use client";

import type { OilSpreadSignal as OilSpreadSignalType } from "@/lib/types";
import { getSpreadStatus, statusColor, formatCurrency } from "@/lib/utils";
import SignalCard from "./SignalCard";
import SparkChart from "./SparkChart";

interface OilSpreadSignalProps {
  data: OilSpreadSignalType;
}

export default function OilSpreadSignal({ data }: OilSpreadSignalProps) {
  const status = getSpreadStatus(data.spread);

  const statusLabel =
    status === "red"
      ? "Severe Disconnect"
      : status === "yellow"
        ? "Diverging"
        : "Converging";

  const spreadData = data.history.map((point) => ({
    date: point.date,
    value: point.dubai - point.brent,
  }));

  return (
    <SignalCard
      title="Paper vs Physical Spread"
      subtitle="Brent crude vs Dubai physical — the real price"
      status={status}
      statusLabel={statusLabel}
      lastUpdated={data.lastUpdated}
      source={`${data.brentSource} / ${data.dubaiSource}`}
    >
      <div className="flex flex-col gap-4">
        {/* Dual price display */}
        <div className="grid grid-cols-2 gap-3">
          {/* Brent (Paper) */}
          <div className="rounded-lg bg-[var(--background)] px-4 py-4">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
              Brent (Paper)
            </p>
            <p className="mt-1 text-3xl font-bold text-[var(--text-primary)]">
              {formatCurrency(data.brent)}
            </p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              What headlines report
            </p>
          </div>

          {/* Dubai Physical */}
          <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-4">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--accent)]">
              Dubai Physical
            </p>
            <p className="mt-1 text-3xl font-bold text-[var(--text-primary)]">
              {formatCurrency(data.dubai)}
            </p>
            <p className="mt-1 text-xs text-blue-400/70">
              What Asia actually pays
            </p>
          </div>
        </div>

        {/* Spread highlight */}
        <div className="flex items-center justify-center gap-3 rounded-lg bg-[var(--background)] px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--text-secondary)]">
              {formatCurrency(data.brent)}
            </span>
            <svg
              width="32"
              height="12"
              viewBox="0 0 32 12"
              fill="none"
              className="shrink-0"
            >
              <line
                x1="0"
                y1="6"
                x2="28"
                y2="6"
                stroke={statusColor(status)}
                strokeWidth="2"
                strokeDasharray="3 2"
              />
              <polygon
                points="28,2 32,6 28,10"
                fill={statusColor(status)}
              />
            </svg>
            <span className="text-sm text-[var(--text-secondary)]">
              {formatCurrency(data.dubai)}
            </span>
          </div>
          <span
            className="text-2xl font-bold"
            style={{ color: statusColor(status) }}
          >
            {formatCurrency(data.spread)} spread
          </span>
        </div>

        {/* Jawboning note */}
        <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-4 py-3">
          <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
            The gap exists because political jawboning pushes paper prices down.
            Refiners buying real cargo get no discount.
          </p>
        </div>

        {/* Key insight callout */}
        <div className="rounded-lg border-l-2 border-yellow-500 bg-yellow-500/5 px-4 py-3">
          <p className="text-sm font-medium leading-relaxed text-[var(--text-primary)]">
            If you&apos;re looking at Brent to assess India&apos;s oil bill,
            you&apos;re looking at the wrong number.
          </p>
        </div>

        {/* SparkChart — spread over time */}
        <SparkChart
          data={spreadData}
          threshold={8}
          color="var(--warning)"
          height={80}
        />
      </div>
    </SignalCard>
  );
}
