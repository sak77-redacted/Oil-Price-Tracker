"use client";

import type { RecoveryClockData } from "@/lib/types";
import RestartFlywheel from "./RestartFlywheel";

interface RecoveryClockProps {
  data: RecoveryClockData;
}

function daysSince(dateStr: string): number {
  const start = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - start.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function formatMonth(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

const statusConfig = {
  complete: {
    dotBg: "bg-green-400",
    dotRing: "ring-green-400/20",
    textColor: "text-green-400",
    borderColor: "border-green-400/30",
    label: "Complete",
  },
  "in-progress": {
    dotBg: "bg-amber-400",
    dotRing: "ring-amber-400/20",
    textColor: "text-amber-400",
    borderColor: "border-amber-400/30",
    label: "In Progress",
  },
  "not-started": {
    dotBg: "bg-[var(--text-secondary)]",
    dotRing: "ring-[var(--text-secondary)]/20",
    textColor: "text-[var(--text-secondary)]",
    borderColor: "border-[var(--card-border)]",
    label: "Not Started",
  },
} as const;

function StatBox({
  value,
  label,
  sublabel,
}: {
  value: string;
  label: string;
  sublabel?: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-lg bg-[var(--background)] px-4 py-3">
      <span className="text-xl font-bold tabular-nums text-[var(--text-primary)]">
        {value}
      </span>
      <span className="mt-1 text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
        {label}
      </span>
      {sublabel && (
        <span className="text-[10px] text-[var(--text-secondary)]">
          {sublabel}
        </span>
      )}
    </div>
  );
}

export default function RecoveryClock({ data }: RecoveryClockProps) {
  const crisisDays = daysSince(data.crisisStartDate);

  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5">
      {/* Header */}
      <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
        Recovery Clock
      </h2>
      <p className="mt-1 mb-5 text-sm text-[var(--text-secondary)]">
        Even if the strait reopens today — how long until normal?
      </p>

      {/* Top row: 3 stat boxes */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <StatBox value={`${crisisDays}`} label="Day of Crisis" />
        <StatBox
          value={`${data.totalMonths}`}
          label="Months to Normal"
          sublabel="from today"
        />
        <StatBox
          value={formatMonth(data.estimatedNormalizationDate)}
          label="Earliest Normal"
        />
      </div>

      {/* Phase timeline */}
      <div className="relative mb-6">
        {data.phases.map((phase, index) => {
          const config = statusConfig[phase.status];
          const isLast = index === data.phases.length - 1;
          const isInProgress = phase.status === "in-progress";

          return (
            <div key={phase.phase} className="relative flex gap-4">
              {/* Vertical spine + dot */}
              <div className="flex flex-col items-center">
                <div className="relative z-10 flex h-5 w-5 shrink-0 items-center justify-center">
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${config.dotBg} ring-4 ${config.dotRing} ${
                      isInProgress ? "animate-pulse" : ""
                    }`}
                  />
                </div>
                {!isLast && (
                  <div className="w-0.5 grow bg-[var(--card-border)]" />
                )}
              </div>

              {/* Phase content */}
              <div
                className={`min-w-0 flex-1 ${isLast ? "pb-0" : "pb-5"} ${
                  isInProgress
                    ? "rounded-lg border-l-2 border-amber-400/40 pl-3"
                    : ""
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h3
                    className={`text-sm font-semibold ${
                      phase.status === "not-started"
                        ? "text-[var(--text-secondary)]"
                        : "text-[var(--text-primary)]"
                    }`}
                  >
                    {phase.phase}
                  </h3>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase leading-none tracking-wider ${config.borderColor} ${config.textColor}`}
                  >
                    {phase.durationMonths}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {phase.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Key insight callout */}
      <div className="mb-4 rounded-lg border border-amber-400/20 bg-amber-400/5 px-4 py-3">
        <p className="text-sm leading-relaxed text-amber-200/90 italic">
          &ldquo;{data.keyInsight}&rdquo;
        </p>
        <p className="mt-1 text-[11px] text-amber-400/60">
          — {data.source}
        </p>
      </div>

      {/* Physical-market notes (Morgan Downey + any others) */}
      {(() => {
        const notes = [
          ...(data.physicalMarketNotes ?? []),
          ...(data.physicalMarketNote ? [data.physicalMarketNote] : []),
        ];
        if (notes.length === 0) return null;
        return (
          <div className="mb-4 space-y-3">
            {notes.map((n, i) => (
              <blockquote
                key={`${n.date}-${i}`}
                className="border-l-2 border-amber-500/40 pl-3"
              >
                <p className="text-[12px] italic leading-relaxed text-white/80">
                  &ldquo;{n.quote}&rdquo;
                </p>
                <footer className="mt-1 text-[10px] not-italic text-white/55">
                  <span className="font-semibold text-amber-300/80">
                    {n.attribution}
                  </span>
                  <span className="mx-1.5 text-white/25">·</span>
                  <span>{n.date}</span>
                  {n.context && (
                    <span className="ml-1.5 text-white/45">— {n.context}</span>
                  )}
                </footer>
              </blockquote>
            ))}
          </div>
        );
      })()}

      {/* Restart Flywheel — Morgan Downey */}
      {data.restartFlywheel && <RestartFlywheel data={data.restartFlywheel} />}

      {/* Source + last updated */}
      <p className="mt-4 text-[11px] text-[var(--text-secondary)]">
        Source: {data.source} · Updated{" "}
        {new Date(data.lastUpdated).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </p>
    </div>
  );
}
