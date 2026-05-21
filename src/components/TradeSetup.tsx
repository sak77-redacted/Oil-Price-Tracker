"use client";

import type { SignalData } from "@/lib/types";
import {
  computeVerdict,
  computeTradeSetup,
  type TradeDirection,
  type ConvictionTier,
  type ExitTrigger,
  type InstrumentRecommendation,
} from "@/lib/verdict";

interface TradeSetupProps {
  data: SignalData;
  liveBrentPrice?: number;
}

// ─── Direction styling ────────────────────────────────────────────────────────
const directionConfig: Record<
  TradeDirection,
  {
    label: string;
    icon: string;
    borderColor: string;
    textColor: string;
    bgColor: string;
    badgeBg: string;
  }
> = {
  long: {
    label: "LONG",
    icon: "▲",
    borderColor: "border-red-500/40",
    textColor: "text-red-300",
    bgColor: "bg-red-500/10",
    badgeBg: "bg-red-500/25",
  },
  short: {
    label: "SHORT",
    icon: "▼",
    borderColor: "border-green-500/40",
    textColor: "text-green-300",
    bgColor: "bg-green-500/10",
    badgeBg: "bg-green-500/25",
  },
  sidelined: {
    label: "SIDELINED",
    icon: "◆",
    borderColor: "border-yellow-500/40",
    textColor: "text-yellow-300",
    bgColor: "bg-yellow-500/10",
    badgeBg: "bg-yellow-500/25",
  },
};

const convictionConfig: Record<ConvictionTier, { label: string; color: string }> = {
  high: { label: "HIGH", color: "text-emerald-300 bg-emerald-500/20 border-emerald-500/30" },
  moderate: { label: "MODERATE", color: "text-amber-300 bg-amber-500/20 border-amber-500/30" },
  low: { label: "LOW", color: "text-zinc-300 bg-zinc-500/20 border-zinc-500/30" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtNum(n: number, decimals = 2): string {
  if (Math.abs(n) >= 1000) return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  return n.toFixed(decimals);
}

function fmtSigned(n: number, suffix = "%"): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}${suffix}`;
}

function triggerStatusStyles(status: ExitTrigger["status"]) {
  switch (status) {
    case "fired":
      return {
        bar: "bg-red-500",
        dot: "bg-red-400",
        text: "text-red-300",
        label: "FIRED",
      };
    case "warning":
      return {
        bar: "bg-amber-500",
        dot: "bg-amber-400",
        text: "text-amber-300",
        label: "WARNING",
      };
    case "intact":
    default:
      return {
        bar: "bg-emerald-500",
        dot: "bg-emerald-400",
        text: "text-emerald-300",
        label: "INTACT",
      };
  }
}

function instrumentStyles(priority: InstrumentRecommendation["priority"]) {
  switch (priority) {
    case "primary":
      return {
        border: "border-emerald-500/40",
        bg: "bg-emerald-500/5",
        label: "PRIMARY",
        labelColor: "text-emerald-300",
      };
    case "secondary":
      return {
        border: "border-amber-500/40",
        bg: "bg-amber-500/5",
        label: "SECONDARY",
        labelColor: "text-amber-300",
      };
    case "avoid":
      return {
        border: "border-red-500/40",
        bg: "bg-red-500/5",
        label: "AVOID",
        labelColor: "text-red-300",
      };
  }
}

function thesisHealthStyles(color: "green" | "amber" | "red") {
  switch (color) {
    case "green":
      return {
        border: "border-emerald-500/40",
        bg: "bg-emerald-500/10",
        text: "text-emerald-300",
        scoreColor: "text-emerald-300",
      };
    case "amber":
      return {
        border: "border-amber-500/40",
        bg: "bg-amber-500/10",
        text: "text-amber-300",
        scoreColor: "text-amber-300",
      };
    case "red":
      return {
        border: "border-red-500/40",
        bg: "bg-red-500/10",
        text: "text-red-300",
        scoreColor: "text-red-300",
      };
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function TradeSetup({ data, liveBrentPrice }: TradeSetupProps) {
  // Mirror VerdictBanner's live-Brent merge so the trade ticket prices off
  // the same spot the verdict uses.
  const setupData: SignalData =
    liveBrentPrice != null
      ? {
          ...data,
          oilSpread: {
            ...data.oilSpread,
            brent: liveBrentPrice,
            dubai: liveBrentPrice + (data.oilSpread.dubai - data.oilSpread.brent),
            spread: data.oilSpread.dubai - data.oilSpread.brent,
          },
        }
      : data;

  const verdict = computeVerdict(setupData);
  const setup = computeTradeSetup(setupData, verdict);

  const dirCfg = directionConfig[setup.direction];
  const convCfg = convictionConfig[setup.conviction];
  const healthCfg = thesisHealthStyles(setup.thesisHealth.color);

  const spot = setup.entryZone.currentSpot;

  return (
    <div
      className={`mt-6 w-full rounded-xl border ${dirCfg.borderColor} bg-zinc-950/60 p-5 sm:p-6`}
    >
      {/* ─── Header ─── */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--accent)]">
          Trade Setup
        </span>
        <span className="text-xs text-white/45">/ derived from verdict + regime signals</span>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border ${dirCfg.borderColor} ${dirCfg.badgeBg} px-3 py-1 text-xs font-bold tracking-wider ${dirCfg.textColor}`}
          >
            <span>{dirCfg.icon}</span>
            <span>{dirCfg.label}</span>
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold tracking-wider ${convCfg.color}`}
          >
            <span>{convCfg.label}</span>
            <span className="tabular-nums">{setup.convictionPct}%</span>
          </span>
          <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold text-white/75">
            {setup.sizingGuide}
          </span>
        </div>
      </div>

      {/* ─── Entry + Take Profit row ─── */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Entry Zone tile */}
        <div className="rounded-lg border border-white/10 bg-black/30 p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white/55">
              Entry Zone
            </span>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider ${
                setup.entryZone.inZone ? "text-emerald-300" : "text-white/45"
              }`}
            >
              {setup.entryZone.inZone ? "● In zone" : "○ Out of zone"}
            </span>
          </div>
          {setup.direction === "sidelined" ? (
            <div className="mt-2">
              <div className="text-lg font-bold tabular-nums text-white">—</div>
              <div className="mt-1 text-[11px] text-white/65">{setup.entryZone.action}</div>
            </div>
          ) : (
            <>
              <div className="mt-2 text-lg font-bold tabular-nums text-white">
                ${fmtNum(setup.entryZone.zoneLow)}&ndash;${fmtNum(setup.entryZone.zoneHigh)}
              </div>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-2 text-[11px]">
                <span className="text-white/55">Spot</span>
                <span className="font-bold tabular-nums text-white">${fmtNum(spot)}</span>
                <span className="text-white/30">·</span>
                <span className={dirCfg.textColor}>{setup.entryZone.action}</span>
              </div>
            </>
          )}
        </div>

        {/* Take Profits tile */}
        <div className="rounded-lg border border-white/10 bg-black/30 p-4">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-white/55">
            Take Profit Levels
          </div>
          {setup.takeProfits.length === 0 ? (
            <div className="mt-2 text-sm text-white/55">
              No directional targets — wait for regime break
            </div>
          ) : (
            <div className="mt-2 grid grid-cols-2 gap-3">
              {setup.takeProfits.map((tp) => (
                <div key={tp.label} className="rounded-md border border-white/10 bg-black/30 px-3 py-2">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-white/55">
                    {tp.label}
                  </div>
                  <div className="mt-0.5 text-base font-bold tabular-nums text-white">
                    ${fmtNum(tp.level)}
                  </div>
                  <div className={`mt-0.5 text-[10px] font-semibold tabular-nums ${dirCfg.textColor}`}>
                    {fmtSigned(tp.pctFromSpot)} from spot
                  </div>
                  <div className="mt-1 text-[10px] leading-snug text-white/55">{tp.rationale}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Instrument recommendations ─── */}
      <div className="mt-4">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/55">
          Instrument Selection
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {setup.instruments.map((inst, idx) => {
            const styles = instrumentStyles(inst.priority);
            return (
              <div
                key={`${inst.priority}-${idx}`}
                className={`rounded-lg border ${styles.border} ${styles.bg} p-3`}
              >
                <div
                  className={`text-[10px] font-bold uppercase tracking-wider ${styles.labelColor}`}
                >
                  {styles.label}
                </div>
                <div className="mt-1 text-sm font-semibold text-white">{inst.name}</div>
                <div className="mt-1 text-[11px] leading-relaxed text-white/65">
                  {inst.rationale}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Exit Triggers ─── */}
      <div className="mt-5">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/80">
            Exit Triggers <span className="text-white/45">— when to take the trade off</span>
          </div>
          <div className="text-[10px] text-white/45">
            Progress bars show distance to firing
          </div>
        </div>
        <div className="overflow-hidden rounded-lg border border-white/10">
          <table className="w-full border-collapse text-xs">
            <thead className="bg-black/40 text-[10px] uppercase tracking-wider text-white/55">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Signal</th>
                <th className="px-3 py-2 text-right font-semibold">Current</th>
                <th className="px-3 py-2 text-right font-semibold">Trigger</th>
                <th className="px-3 py-2 text-left font-semibold">Progress to fire</th>
                <th className="px-3 py-2 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {setup.exitTriggers.map((t, idx) => {
                const styles = triggerStatusStyles(t.status);
                const arrow = t.direction === "below" ? "↓" : "↑";
                return (
                  <tr
                    key={`${t.signalName}-${idx}`}
                    className="border-t border-white/5 align-middle"
                  >
                    <td className="px-3 py-2.5">
                      <div className="text-[12px] font-semibold text-white">{t.signalName}</div>
                      <div className="mt-0.5 text-[10px] leading-snug text-white/50">
                        {t.rationale}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <span className="font-bold tabular-nums text-white">
                        {typeof t.current === "number"
                          ? fmtNum(t.current, t.unit === "$/d" ? 0 : 1)
                          : t.current}
                      </span>
                      {t.unit && (
                        <span className="ml-0.5 text-[10px] text-white/45">{t.unit}</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <span className="text-[10px] text-white/45 mr-1">{arrow}</span>
                      <span className="font-bold tabular-nums text-white/75">
                        {typeof t.trigger === "number"
                          ? fmtNum(t.trigger, t.unit === "$/d" ? 0 : 1)
                          : t.trigger}
                      </span>
                      {t.unit && (
                        <span className="ml-0.5 text-[10px] text-white/45">{t.unit}</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-full max-w-[140px] overflow-hidden rounded-full bg-white/10">
                          <div
                            className={`h-full ${styles.bar} transition-all`}
                            style={{ width: `${t.pctToTrigger}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-semibold tabular-nums text-white/65">
                          {t.pctToTrigger}%
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className={`inline-block h-1.5 w-1.5 rounded-full ${styles.dot}`}
                        />
                        <span className={`text-[10px] font-bold tracking-wider ${styles.text}`}>
                          {styles.label}
                        </span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Thesis Health Score ─── */}
      <div
        className={`mt-5 flex flex-col items-stretch gap-3 rounded-lg border ${healthCfg.border} ${healthCfg.bg} p-4 sm:flex-row sm:items-center sm:justify-between`}
      >
        <div className="flex items-center gap-4">
          <div className={`text-4xl font-extrabold tabular-nums ${healthCfg.scoreColor}`}>
            {setup.thesisHealth.scorePct}%
          </div>
          <div>
            <div className={`text-sm font-bold tracking-wider ${healthCfg.text}`}>
              {setup.thesisHealth.label}
            </div>
            <div className="mt-0.5 text-[10px] text-white/55">
              Thesis Health Score · average distance of exit triggers from firing
            </div>
          </div>
        </div>
        <div className="text-[10px] leading-relaxed text-white/55 sm:max-w-xs sm:text-right">
          Score falls toward 0% as the trade thesis breaks down. Below 40% means at least one
          trigger has fired — review the exit.
        </div>
      </div>
    </div>
  );
}
