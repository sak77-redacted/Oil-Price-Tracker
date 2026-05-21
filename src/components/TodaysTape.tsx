"use client";

import type { SignalData } from "@/lib/types";

interface TodaysTapeProps {
  data: SignalData;
  liveBrentPrice?: number;
}

interface Tile {
  label: string;
  value: string;
  delta: number | null;
  /** Direction of bullish-for-oil interpretation:
   *  "up" — a higher value is bullish for crude → red delta when value rose
   *  "down" — a lower value is bullish for crude → red delta when value fell
   *  Used to color the delta arrow consistently with risk-on-crude framing.
   */
  bullishWhen: "up" | "down";
  deltaSuffix: string;
}

function formatDelta(delta: number, suffix: string): string {
  const sign = delta > 0 ? "+" : "";
  // Tight number formatting — 1 decimal if |d|<10, else integer
  const abs = Math.abs(delta);
  const formatted = abs < 10 ? delta.toFixed(1) : Math.round(delta).toString();
  return `${sign}${formatted}${suffix}`;
}

function deltaColor(delta: number, bullishWhen: "up" | "down"): string {
  if (delta === 0) return "text-white/40";
  const isBullishForOil =
    (bullishWhen === "up" && delta > 0) || (bullishWhen === "down" && delta < 0);
  return isBullishForOil ? "text-red-400" : "text-green-400";
}

function arrow(delta: number): string {
  if (delta === 0) return "·";
  return delta > 0 ? "▲" : "▼";
}

export default function TodaysTape({ data, liveBrentPrice }: TodaysTapeProps) {
  // Resolve live-vs-static Brent and derived Dubai. Dubai premium is preserved
  // from the data file when live Brent is available (same logic as Dashboard).
  const brent = liveBrentPrice ?? data.oilSpread.brent;
  const dubaiPremium = data.oilSpread.dubai - data.oilSpread.brent;
  const dubai = liveBrentPrice != null ? liveBrentPrice + dubaiPremium : data.oilSpread.dubai;
  const spread = dubai - brent;

  // Prior values for delta-vs-yesterday from history arrays.
  // If live Brent is present, current ≠ last history point → use [-1] as prev.
  // Else current = data.oilSpread.brent (which already equals [-1]) → use [-2].
  const oilHist = data.oilSpread.history;
  const priorIdx = liveBrentPrice != null ? oilHist.length - 1 : oilHist.length - 2;
  const prevBrent = priorIdx >= 0 ? oilHist[priorIdx].brent : null;
  const prevDubai = priorIdx >= 0 ? oilHist[priorIdx].dubai : null;
  const prevSpread = prevBrent != null && prevDubai != null ? prevDubai - prevBrent : null;

  const brentDelta = prevBrent != null ? brent - prevBrent : null;
  const dubaiDelta = prevDubai != null ? dubai - prevDubai : null;
  const spreadDelta = prevSpread != null ? spread - prevSpread : null;

  // Backwardation — optional signal
  const backwardation = data.curveShape?.percentBackwardation ?? null;
  const backwardationHist = data.curveShape?.history ?? [];
  const prevBackwardation = backwardationHist.length >= 2
    ? backwardationHist[backwardationHist.length - 2].percentBackwardation
    : null;
  const backwardationDelta =
    backwardation != null && prevBackwardation != null
      ? backwardation - prevBackwardation
      : null;

  // 0DTE share — pulled from paperMarket.optionsShares (bucket name contains "0DTE")
  const zeroDTEEntry = data.paperMarket?.optionsShares.find((o) =>
    o.bucket.toLowerCase().includes("0dte"),
  );
  const zeroDTECurrent = zeroDTEEntry?.current ?? null;
  // Delta vs pre-crisis baseline (no daily history available for options shares)
  const zeroDTEDelta =
    zeroDTEEntry != null ? zeroDTEEntry.current - zeroDTEEntry.pre : null;

  // Insurance — % hull
  const insurance = data.insurance.current;
  const insuranceHist = data.insurance.history;
  const prevInsurance = insuranceHist.length >= 2 ? insuranceHist[insuranceHist.length - 2].value : null;
  const insuranceDelta = prevInsurance != null ? insurance - prevInsurance : null;

  const tiles: Tile[] = [
    {
      label: "Brent",
      value: `$${brent.toFixed(2)}`,
      delta: brentDelta,
      bullishWhen: "up",
      deltaSuffix: "",
    },
    {
      label: "Dubai Physical",
      value: `$${dubai.toFixed(2)}`,
      delta: dubaiDelta,
      bullishWhen: "up",
      deltaSuffix: "",
    },
    {
      label: "Spread",
      value: `$${spread.toFixed(1)}`,
      delta: spreadDelta,
      bullishWhen: "up",
      deltaSuffix: "",
    },
    {
      label: "% Backwardation",
      value: backwardation != null ? `${backwardation.toFixed(1)}%` : "—",
      delta: backwardationDelta,
      bullishWhen: "up",
      deltaSuffix: "pp",
    },
    {
      label: "0DTE Share",
      value: zeroDTECurrent != null ? `${zeroDTECurrent}%` : "—",
      delta: zeroDTEDelta,
      // High 0DTE share = paper-market deleveraging = spot suppression = bearish-spot
      // (i.e. higher 0DTE is the opposite of physical bullishness)
      bullishWhen: "down",
      deltaSuffix: "pp vs pre",
    },
    {
      label: "Insurance",
      value: `${insurance.toFixed(1)}%`,
      delta: insuranceDelta,
      bullishWhen: "up",
      deltaSuffix: "pp",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      {tiles.map((tile) => (
        <div
          key={tile.label}
          className="rounded-lg border border-zinc-800/60 bg-zinc-950/80 p-4"
        >
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
            {tile.label}
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-xl font-bold tabular-nums text-white sm:text-2xl">
              {tile.value}
            </span>
          </div>
          {tile.delta != null && (
            <div className={`mt-1 text-[11px] font-semibold tabular-nums ${deltaColor(tile.delta, tile.bullishWhen)}`}>
              {arrow(tile.delta)} {formatDelta(tile.delta, tile.deltaSuffix)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
