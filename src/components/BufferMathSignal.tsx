"use client";

import type { BufferMathSignal as BufferMathSignalType } from "@/lib/types";
import { getBufferMathStatus, statusColor } from "@/lib/utils";
import SignalCard from "./SignalCard";
import SparkChart from "./SparkChart";

interface BufferMathSignalProps {
  data: BufferMathSignalType;
}

export default function BufferMathSignal({ data }: BufferMathSignalProps) {
  const status = getBufferMathStatus(
    data.oecdCommercialDaysCover,
    data.projectedShortfall6moMb,
    data.oecdSPRRemainingMb,
  );

  const statusLabel =
    status === "red"
      ? "Buffer Failing"
      : status === "yellow"
        ? "Buffer Stressed"
        : "Buffer Adequate";

  const sparkData = data.history.map((point) => ({
    date: point.date,
    value: point.daysCover,
  }));

  const sprPct = Math.min(
    100,
    Math.max(0, (data.oecdSPRRemainingMb / data.oecdSPRTotalCapacityMb) * 100),
  );

  const reservesCoverShortfall =
    data.oecdSPRRemainingMb >= data.projectedShortfall6moMb;

  const burnDownLabel =
    data.burnDownDays > 0
      ? `${data.burnDownDays} days`
      : "Not depleting";

  const daysAboveFloor = data.oecdCommercialDaysCover - data.operationalFloor;

  return (
    <SignalCard
      title="Inventory Buffer & Supply Math"
      subtitle="OECD days-of-cover + strategic reserves vs cumulative shortfall"
      status={status}
      statusLabel={statusLabel}
      lastUpdated={data.lastUpdated}
      source={data.source}
    >
      <div className="flex flex-col gap-4">
        {/* Big number — days of cover */}
        <div>
          <div className="flex items-baseline gap-2">
            <span
              className="text-5xl font-bold tracking-tight tabular-nums"
              style={{ color: statusColor(status) }}
            >
              {data.oecdCommercialDaysCover}
            </span>
            <span className="text-lg text-[var(--text-secondary)]">
              days cover
            </span>
          </div>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {daysAboveFloor > 0
              ? `Just ${daysAboveFloor} day${daysAboveFloor === 1 ? "" : "s"} above the ${data.operationalFloor}-day operational floor`
              : `At or below the ${data.operationalFloor}-day operational floor`}
          </p>
        </div>

        {/* SPR remaining vs capacity */}
        <div className="rounded-lg bg-[var(--background)] px-4 py-3">
          <div className="flex items-baseline justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
              OECD SPR Remaining (US + JP + EU)
            </p>
            <p className="text-sm font-semibold tabular-nums text-[var(--text-primary)]">
              {data.oecdSPRRemainingMb} / {data.oecdSPRTotalCapacityMb} Mb
            </p>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--card-border)]">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${sprPct}%`,
                backgroundColor: statusColor(status),
              }}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-[var(--text-secondary)]">
            China&apos;s ~1.4B barrels excluded — not part of the Western buffer
          </p>
        </div>

        {/* Cumulative + projected shortfall */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-[var(--background)] px-3 py-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-secondary)]">
              Missing to date
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--text-primary)]">
              {data.cumulativeMissingMb}
              <span className="ml-1 text-sm font-normal text-[var(--text-secondary)]">
                Mb
              </span>
            </p>
            <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
              At {data.dailyMissingMbd} mb/d shortfall
            </p>
          </div>
          <div className="rounded-lg bg-[var(--background)] px-3 py-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-secondary)]">
              6-mo projected
            </p>
            <p
              className="mt-1 text-2xl font-bold tabular-nums"
              style={{
                color: reservesCoverShortfall
                  ? "var(--text-primary)"
                  : statusColor(status),
              }}
            >
              {data.projectedShortfall6moMb}
              <span className="ml-1 text-sm font-normal text-[var(--text-secondary)]">
                Mb
              </span>
            </p>
            <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
              {reservesCoverShortfall
                ? "Reserves can absorb"
                : "Exceeds available reserves"}
            </p>
          </div>
        </div>

        {/* Burn-down countdown */}
        <div className="flex items-center justify-between rounded-lg border-l-2 border-red-500 bg-red-500/5 px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-[var(--text-secondary)]">
              SPR burn-down at current rate
            </p>
            <p
              className="mt-0.5 text-xl font-bold tabular-nums"
              style={{ color: statusColor(status) }}
            >
              {burnDownLabel}
            </p>
          </div>
          <span className="text-xs text-[var(--text-secondary)]">
            {data.oecdSPRRemainingMb} Mb &divide; {data.dailyMissingMbd} mb/d
          </span>
        </div>

        {/* Caveat note */}
        <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-4 py-3">
          <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
            When days-of-cover crosses {data.operationalFloor}, refiners physically can&apos;t operate.
            Below that line, price suppression via SPR releases ends abruptly.
          </p>
        </div>

        {/* SparkChart — days of cover with floor as threshold */}
        <SparkChart
          data={sparkData}
          threshold={data.operationalFloor}
          color="var(--danger)"
          height={80}
        />
      </div>
    </SignalCard>
  );
}
