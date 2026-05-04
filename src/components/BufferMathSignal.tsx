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

  const burnDownLabel =
    data.burnDownDays > 0
      ? `${data.burnDownDays} days`
      : "Not depleting";

  const daysAboveFloor = data.oecdCommercialDaysCover - data.operationalFloor;

  const coveragePct = Math.floor(data.coverageRatio * 100);
  const sprBreakdownTotal =
    data.sprBreakdown.us + data.sprBreakdown.japan + data.sprBreakdown.europe;

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

        {/* Two-column missing barrels math */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-[var(--background)] px-3 py-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-secondary)]">
              Already missing
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--text-primary)]">
              {data.cumulativeMissingMb}
              <span className="ml-1 text-sm font-normal text-[var(--text-secondary)]">
                Mb
              </span>
            </p>
            <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
              Cumulative since war start at {data.dailyMissingMbd} mb/d
            </p>
          </div>
          <div className="rounded-lg bg-[var(--background)] px-3 py-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-secondary)]">
              Future missing (best case)
            </p>
            <p
              className="mt-1 text-2xl font-bold tabular-nums"
              style={{ color: statusColor(status) }}
            >
              {data.futureBestCaseMissingMb}
              <span className="ml-1 text-sm font-normal text-[var(--text-secondary)]">
                Mb
              </span>
            </p>
            <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
              Months 1-6 even if war ends tonight (Goldman recovery curve)
            </p>
          </div>
        </div>

        {/* Coverage ratio callout — the headline finding */}
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3">
          <div className="flex items-baseline justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Strategic-reserve coverage
            </p>
            <p
              className="text-3xl font-bold tabular-nums"
              style={{ color: statusColor(status) }}
            >
              {coveragePct}%
            </p>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--card-border)]">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${coveragePct}%`,
                backgroundColor: statusColor(status),
              }}
            />
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-[var(--text-secondary)]">
            <span className="font-mono text-[var(--text-primary)]">
              {data.futureBestCaseMissingMb} ÷ {data.oecdSPRTotalCapacityMb} ={" "}
              {coveragePct}%
            </span>
            {" — "}
            future shortfall consumes nearly all OECD strategic reserves. Zero
            margin if the war doesn&apos;t end tonight.
          </p>
        </div>

        {/* SPR breakdown */}
        <div className="rounded-lg bg-[var(--background)] px-4 py-3">
          <div className="flex items-baseline justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
              OECD SPR Breakdown
            </p>
            <p className="text-sm font-semibold tabular-nums text-[var(--text-primary)]">
              {data.oecdSPRRemainingMb} / {sprBreakdownTotal} Mb capacity
            </p>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <div className="text-center rounded bg-[var(--card)] px-2 py-2">
              <p className="text-[10px] text-[var(--text-secondary)]">US</p>
              <p className="text-base font-bold tabular-nums text-[var(--text-primary)]">
                {data.sprBreakdown.us}
              </p>
              <p className="text-[9px] text-[var(--text-secondary)]">Mb</p>
            </div>
            <div className="text-center rounded bg-[var(--card)] px-2 py-2">
              <p className="text-[10px] text-[var(--text-secondary)]">Japan</p>
              <p className="text-base font-bold tabular-nums text-[var(--text-primary)]">
                {data.sprBreakdown.japan}
              </p>
              <p className="text-[9px] text-[var(--text-secondary)]">Mb</p>
            </div>
            <div className="text-center rounded bg-[var(--card)] px-2 py-2">
              <p className="text-[10px] text-[var(--text-secondary)]">
                OECD Europe
              </p>
              <p className="text-base font-bold tabular-nums text-[var(--text-primary)]">
                {data.sprBreakdown.europe}
              </p>
              <p className="text-[9px] text-[var(--text-secondary)]">Mb</p>
            </div>
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
            China&apos;s ~1.4B barrels excluded — not part of the Western buffer.
            China hasn&apos;t tapped its SPR.
          </p>
        </div>

        {/* Burn-down + Martenson breakthrough window */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col justify-between rounded-lg border-l-2 border-red-500 bg-red-500/5 px-3 py-3">
            <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
              SPR burn-down
            </p>
            <p
              className="mt-0.5 text-xl font-bold tabular-nums"
              style={{ color: statusColor(status) }}
            >
              {burnDownLabel}
            </p>
            <p className="mt-0.5 text-[10px] text-[var(--text-secondary)]">
              {data.oecdSPRRemainingMb} Mb &divide; {data.dailyMissingMbd} mb/d
            </p>
          </div>
          <div className="flex flex-col justify-between rounded-lg border-l-2 border-amber-500 bg-amber-500/5 px-3 py-3">
            <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
              Breakthrough window
              <span className="ml-1 text-[9px] font-normal italic text-amber-400/80">
                Martenson est.
              </span>
            </p>
            <p className="mt-0.5 text-xl font-bold tabular-nums text-amber-400">
              {data.breakthroughWindowWeeks} weeks
            </p>
            <p className="mt-0.5 text-[10px] text-[var(--text-secondary)]">
              Until price-suppression mechanism breaks
            </p>
          </div>
        </div>

        {/* 2008 historical parallel callout */}
        <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-4 py-2.5">
          <p className="text-[11px] italic leading-relaxed text-[var(--text-secondary)]">
            <span className="font-bold not-italic text-[var(--text-primary)]">
              {data.historicalParallel.year} parallel:
            </span>{" "}
            {data.historicalParallel.insight}
          </p>
        </div>

        {/* Caveat note */}
        <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-4 py-3">
          <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
            When days-of-cover crosses {data.operationalFloor}, refiners
            physically can&apos;t operate. Below that line, price suppression
            via SPR releases ends abruptly.
          </p>
        </div>

        {/* Subsidized exports note */}
        <p className="text-[11px] leading-relaxed text-[var(--text-secondary)]">
          <span className="font-semibold text-[var(--text-primary)]">
            Subsidized exports:
          </span>{" "}
          US oil exports up +{data.subsidizedExportsMbd} mb/d since war start
          (record {data.recordExportsMbd} mb/d). Not from new production — from
          drawing down stockpiles. The buffer that absorbs price suppression{" "}
          <em>is</em> what&apos;s being exported.
        </p>

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
