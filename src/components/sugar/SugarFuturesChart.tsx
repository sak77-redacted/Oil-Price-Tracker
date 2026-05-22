"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
} from "recharts";

import type {
  SugarFuturesHistory,
  CatalystTimelineEntry,
  ExecutedPosition,
  CatalystTier,
} from "@/lib/sugar-types";

interface Props {
  history: SugarFuturesHistory | null;
  strikePriceCents: number;
  entryPriceCents?: number;
  entryDate?: string;
  positionLabel?: string;
  catalysts?: CatalystTimelineEntry[];
  executedPosition?: ExecutedPosition;
}

type TimeRange = "1M" | "3M" | "6M" | "1Y" | "YTD";

const TIME_RANGES: { id: TimeRange; label: string; days: number | "ytd" }[] = [
  { id: "1M", label: "1M", days: 22 },
  { id: "3M", label: "3M", days: 66 },
  { id: "6M", label: "6M", days: 132 },
  { id: "1Y", label: "1Y", days: 252 },
  { id: "YTD", label: "YTD", days: "ytd" },
];

interface ChartPoint {
  date: string;       // ISO YYYY-MM-DD (the canonical x-axis value)
  dateLabel: string;  // pretty short label
  close: number | null;
  volume: number | null;
  isFuture: boolean;
}

interface CatalystMarker {
  date: string;         // ISO YYYY-MM-DD start of range
  monthLabel: string;   // e.g. "Jun"
  event: string;
  tier: CatalystTier;
}

interface TooltipPayloadEntry {
  value: number;
  dataKey: string;
  payload: ChartPoint;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDateShort(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

/** Parse a catalystTimeline `date` string like "Jun-Sep 2026" or "Oct 2026-Jan 2027" into the ISO start date. */
function parseCatalystStart(s: string): { iso: string; monthIdx: number; year: number } | null {
  // Capture first month token + first year that appears.
  const monthRe = /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i;
  const yearRe = /(20\d{2})/;
  const mm = monthRe.exec(s);
  const yy = yearRe.exec(s);
  if (!mm || !yy) return null;
  const monthIdx = MONTHS.findIndex(
    (m) => m.toLowerCase() === mm[1].toLowerCase(),
  );
  const year = parseInt(yy[1], 10);
  if (monthIdx < 0 || !Number.isFinite(year)) return null;
  const mStr = String(monthIdx + 1).padStart(2, "0");
  return { iso: `${year}-${mStr}-01`, monthIdx, year };
}

function shortenEventName(event: string): string {
  // Compact label for vertical text on the chart.
  const lower = event.toLowerCase();
  if (lower.includes("indian monsoon")) return "Monsoon";
  if (lower.includes("abares")) return "ABARES";
  if (lower.includes("centre-south") || lower.includes("center-south")) return "Brazil C-S cane";
  if (lower.includes("coffee flowering")) return "BR coffee";
  if (lower.includes("cocoa")) return "WAF cocoa";
  if (lower.includes("el niño") || lower.includes("el nino")) return "El Niño peak";
  // Generic shortening fallback
  return event.length > 18 ? event.slice(0, 17) + "…" : event;
}

function abbreviateVolume(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${Math.round(v / 1_000)}k`;
  return `${v}`;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload;
  if (!point) return null;
  const closeEntry = payload.find((p) => p.dataKey === "close");
  const volEntry = payload.find((p) => p.dataKey === "volume");
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 shadow-lg">
      <p className="text-[10px] uppercase tracking-wider text-white/55">
        {point.dateLabel}
      </p>
      {closeEntry && typeof closeEntry.value === "number" && (
        <p className="mt-0.5 text-sm font-semibold tabular-nums text-white">
          {closeEntry.value.toFixed(2)}
          <span className="ml-1 text-[10px] font-normal text-white/50">¢/lb</span>
        </p>
      )}
      {volEntry && typeof volEntry.value === "number" && volEntry.value > 0 && (
        <p className="mt-0.5 text-[10px] tabular-nums text-white/55">
          Vol {abbreviateVolume(volEntry.value)}
        </p>
      )}
    </div>
  );
}

export default function SugarFuturesChart({
  history,
  strikePriceCents,
  entryPriceCents,
  entryDate,
  positionLabel,
  catalysts,
  executedPosition,
}: Props) {
  const [range, setRange] = useState<TimeRange>("6M");

  // Breakeven (cents/lb): strike (dollars/lb × 100) + averagePrice (already in cents/lb)
  const breakevenCents = useMemo(() => {
    if (!executedPosition) return null;
    const strikeCents = executedPosition.strike * 100;
    const premiumCents = executedPosition.averagePrice;
    if (!Number.isFinite(strikeCents) || !Number.isFinite(premiumCents)) return null;
    return strikeCents + premiumCents;
  }, [executedPosition]);

  // 1. Build full series (raw history → ChartPoints, all marked non-future)
  const fullSeries: ChartPoint[] = useMemo(() => {
    if (!history) return [];
    return history.series.map((p) => ({
      date: p.date,
      dateLabel: formatDateShort(p.date),
      close: p.close,
      volume: typeof p.volume === "number" ? p.volume : null,
      isFuture: false,
    }));
  }, [history]);

  // 2. Resolve catalyst markers — parse strings into ISO start dates
  const catalystMarkers: CatalystMarker[] = useMemo(() => {
    if (!catalysts || catalysts.length === 0) return [];
    const out: CatalystMarker[] = [];
    for (const c of catalysts) {
      const parsed = parseCatalystStart(c.date);
      if (!parsed) continue;
      out.push({
        date: parsed.iso,
        monthLabel: MONTHS[parsed.monthIdx],
        event: c.event,
        tier: c.tier,
      });
    }
    return out;
  }, [catalysts]);

  // 3. Slice series by selected time range (client-side)
  const slicedSeries: ChartPoint[] = useMemo(() => {
    if (fullSeries.length === 0) return [];
    const r = TIME_RANGES.find((x) => x.id === range);
    if (!r) return fullSeries;
    if (r.days === "ytd") {
      const now = new Date();
      const yearStart = `${now.getUTCFullYear()}-01-01`;
      return fullSeries.filter((p) => p.date >= yearStart);
    }
    const n = Math.min(r.days, fullSeries.length);
    return fullSeries.slice(fullSeries.length - n);
  }, [fullSeries, range]);

  const rangeIsTruncated = useMemo(() => {
    const r = TIME_RANGES.find((x) => x.id === range);
    if (!r || r.days === "ytd") return false;
    return fullSeries.length > 0 && fullSeries.length < r.days;
  }, [fullSeries, range]);

  // 4. Visible catalyst markers — only Tier 1 + 2; only those at/after first visible date.
  const visibleCatalysts: CatalystMarker[] = useMemo(() => {
    if (catalystMarkers.length === 0 || slicedSeries.length === 0) return [];
    const firstDate = slicedSeries[0].date;
    return catalystMarkers
      .filter((c) => c.tier === 1 || c.tier === 2)
      .filter((c) => c.date >= firstDate);
  }, [catalystMarkers, slicedSeries]);

  // 5. Pad future region so x-axis includes all catalyst dates.
  const paddedSeries: ChartPoint[] = useMemo(() => {
    if (slicedSeries.length === 0) return [];
    if (visibleCatalysts.length === 0) return slicedSeries;
    const lastReal = slicedSeries[slicedSeries.length - 1];
    const lastReal_ts = Date.parse(lastReal.date + "T00:00:00Z");
    const maxCatalyst = visibleCatalysts.reduce(
      (acc, c) => (c.date > acc ? c.date : acc),
      lastReal.date,
    );
    if (maxCatalyst <= lastReal.date) return slicedSeries;
    // Cap padding at Dec 31 of catalyst year.
    const catalystYear = parseInt(maxCatalyst.slice(0, 4), 10);
    const cap = `${catalystYear}-12-31`;
    const targetISO = maxCatalyst > cap ? cap : maxCatalyst;
    const targetTs = Date.parse(targetISO + "T00:00:00Z");
    // Add weekly placeholders (smaller axis, fewer ticks).
    const out: ChartPoint[] = [...slicedSeries];
    const step = 7 * 86400 * 1000;
    for (let ts = lastReal_ts + step; ts <= targetTs; ts += step) {
      const iso = new Date(ts).toISOString().slice(0, 10);
      out.push({
        date: iso,
        dateLabel: formatDateShort(iso),
        close: null,
        volume: null,
        isFuture: true,
      });
    }
    // Always include the exact catalyst dates so markers land on a real x value.
    for (const c of visibleCatalysts) {
      if (!out.some((p) => p.date === c.date)) {
        out.push({
          date: c.date,
          dateLabel: formatDateShort(c.date),
          close: null,
          volume: null,
          isFuture: true,
        });
      }
    }
    out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    return out;
  }, [slicedSeries, visibleCatalysts]);

  const lastClose = useMemo(() => {
    for (let i = slicedSeries.length - 1; i >= 0; i--) {
      const v = slicedSeries[i].close;
      if (typeof v === "number") return v;
    }
    return null;
  }, [slicedSeries]);

  const firstDateLabel = paddedSeries.length > 0 ? paddedSeries[0].dateLabel : "";
  const lastRealLabel = slicedSeries.length > 0 ? slicedSeries[slicedSeries.length - 1].dateLabel : "";

  // Y-axis bounds: data extremes + entry + strike + breakeven, padded ±2¢.
  const yBounds = useMemo(() => {
    if (slicedSeries.length === 0) return { min: 0, max: 1 };
    const closes = slicedSeries
      .map((p) => p.close)
      .filter((v): v is number => typeof v === "number");
    const extras: number[] = [strikePriceCents];
    if (typeof entryPriceCents === "number") extras.push(entryPriceCents);
    if (typeof breakevenCents === "number") extras.push(breakevenCents);
    const min = Math.min(...closes, ...extras);
    const max = Math.max(...closes, ...extras);
    return { min: Math.floor(min - 2), max: Math.ceil(max + 2) };
  }, [slicedSeries, strikePriceCents, entryPriceCents, breakevenCents]);

  // Volume axis bounds — 0 to max × 1.5.
  const volBounds = useMemo(() => {
    const vols = slicedSeries
      .map((p) => p.volume)
      .filter((v): v is number => typeof v === "number" && v > 0);
    if (vols.length === 0) return { min: 0, max: 1 };
    return { min: 0, max: Math.ceil(Math.max(...vols) * 1.5) };
  }, [slicedSeries]);

  const gapText = useMemo(() => {
    if (typeof entryPriceCents !== "number" || entryPriceCents <= 0) return null;
    const gap = strikePriceCents - entryPriceCents;
    const pct = (gap / entryPriceCents) * 100;
    const sign = gap >= 0 ? "+" : "";
    return `${sign}${gap.toFixed(1)}¢ (${sign}${pct.toFixed(1)}% above entry)`;
  }, [strikePriceCents, entryPriceCents]);

  const entryDateLabel = entryDate ? formatDateShort(entryDate) : null;
  const hasEntry = typeof entryPriceCents === "number" && entryPriceCents > 0;
  const showFallback = !history || slicedSeries.length < 5;

  const tierStyle = (tier: CatalystTier): { stroke: string; fill: string } => {
    if (tier === 1) return { stroke: "#ef4444", fill: "#fca5a5" };       // red
    if (tier === 2) return { stroke: "#f59e0b", fill: "#fbbf24" };       // amber
    return { stroke: "#71717a", fill: "#a1a1aa" };                       // zinc
  };

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-5 sm:p-6">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white">
            Sugar #11 Futures
          </h3>
          <p className="mt-0.5 text-[11px] text-white/55">
            {history ? `${history.contractLabel} · ${firstDateLabel} → ${lastRealLabel}` : "history unavailable"}
            {positionLabel ? ` · underlying of ${positionLabel}` : ""}
          </p>
        </div>

        {/* Range toggle pills */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-0.5 rounded-md border border-zinc-800 bg-zinc-900/60 p-0.5">
            {TIME_RANGES.map((r) => {
              const active = r.id === range;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRange(r.id)}
                  className={
                    "rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider transition-colors " +
                    (active
                      ? "bg-amber-500/20 text-amber-200"
                      : "text-white/55 hover:bg-zinc-800/70 hover:text-white/85")
                  }
                >
                  {r.label}
                </button>
              );
            })}
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Last close</div>
            <div className="text-lg font-bold tabular-nums text-white">
              {lastClose !== null ? `${lastClose.toFixed(2)}¢` : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      {showFallback ? (
        <div className="flex h-[320px] items-center justify-center rounded-lg border border-dashed border-zinc-800 bg-zinc-900/40 px-6 text-center">
          <p className="text-sm text-white/55">
            Sugar futures history unavailable — Yahoo Finance fetch failed. Falling back to spot reading only.
          </p>
        </div>
      ) : (
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={paddedSeries}
              margin={{ top: 24, right: 72, bottom: 8, left: 8 }}
            >
              <CartesianGrid stroke="#3f3f46" strokeDasharray="2 4" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 10 }}
                axisLine={{ stroke: "#3f3f46" }}
                tickLine={{ stroke: "#3f3f46" }}
                minTickGap={32}
                tickFormatter={(iso: string) => formatDateShort(iso)}
              />
              <YAxis
                yAxisId="price"
                domain={[yBounds.min, yBounds.max]}
                tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 10 }}
                axisLine={{ stroke: "#3f3f46" }}
                tickLine={{ stroke: "#3f3f46" }}
                tickFormatter={(v: number) => `${v.toFixed(0)}¢`}
                width={40}
              />
              <YAxis
                yAxisId="volume"
                orientation="right"
                domain={[volBounds.min, volBounds.max]}
                tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 9 }}
                axisLine={{ stroke: "#3f3f46" }}
                tickLine={{ stroke: "#3f3f46" }}
                tickFormatter={(v: number) => abbreviateVolume(v)}
                width={44}
                label={{
                  value: "Vol",
                  position: "insideTopRight",
                  offset: 8,
                  fill: "rgba(255,255,255,0.35)",
                  fontSize: 9,
                }}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: "rgba(255,255,255,0.2)", strokeWidth: 1 }}
              />

              {/* Gap area between entry and strike (subtle amber tint) */}
              {hasEntry && entryPriceCents !== undefined && strikePriceCents > entryPriceCents && (
                <ReferenceArea
                  yAxisId="price"
                  y1={entryPriceCents}
                  y2={strikePriceCents}
                  fill="#f59e0b"
                  fillOpacity={0.06}
                  stroke="none"
                  ifOverflow="extendDomain"
                />
              )}

              {/* Volume bars — muted zinc on right axis */}
              <Bar
                yAxisId="volume"
                dataKey="volume"
                fill="#3f3f46"
                fillOpacity={0.4}
                isAnimationActive={false}
                maxBarSize={6}
              />

              {/* Strike line — amber dashed */}
              <ReferenceLine
                yAxisId="price"
                y={strikePriceCents}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                ifOverflow="extendDomain"
                label={{
                  value: `Strike ${strikePriceCents.toFixed(strikePriceCents % 1 === 0 ? 0 : 1)}¢`,
                  position: "right",
                  fill: "#fbbf24",
                  fontSize: 10,
                  fontWeight: 600,
                }}
              />

              {/* Breakeven line — red dashed */}
              {typeof breakevenCents === "number" && (
                <ReferenceLine
                  yAxisId="price"
                  y={breakevenCents}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  ifOverflow="extendDomain"
                  label={{
                    value: `Breakeven ${breakevenCents.toFixed(breakevenCents % 1 === 0 ? 0 : 1)}¢`,
                    position: "right",
                    fill: "#fca5a5",
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                />
              )}

              {/* Entry line — emerald dashed */}
              {hasEntry && entryPriceCents !== undefined && (
                <ReferenceLine
                  yAxisId="price"
                  y={entryPriceCents}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  ifOverflow="extendDomain"
                  label={{
                    value: `Entry ${entryPriceCents.toFixed(1)}¢${entryDateLabel ? ` · ${entryDateLabel}` : ""}`,
                    position: "right",
                    fill: "#6ee7b7",
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                />
              )}

              {/* Vertical catalyst markers (Tier 1 + Tier 2 only) */}
              {visibleCatalysts.map((c) => {
                const style = tierStyle(c.tier);
                return (
                  <ReferenceLine
                    key={`cat-${c.date}-${c.event}`}
                    yAxisId="price"
                    x={c.date}
                    stroke={style.stroke}
                    strokeDasharray="3 3"
                    strokeWidth={1.25}
                    strokeOpacity={c.tier === 1 ? 0.9 : 0.7}
                    label={{
                      value: `${shortenEventName(c.event)} · ${c.monthLabel}`,
                      position: "insideTopLeft",
                      angle: -90,
                      offset: 6,
                      fill: style.fill,
                      fontSize: 9,
                      fontWeight: 600,
                    }}
                  />
                );
              })}

              {/* Futures close line — white/zinc */}
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="close"
                stroke="#e4e4e7"
                strokeWidth={1.75}
                dot={false}
                activeDot={{ r: 3.5, fill: "#e4e4e7", stroke: "#0a0a0a", strokeWidth: 2 }}
                isAnimationActive={false}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-white/55">
        <div>
          {hasEntry && gapText ? (
            <>
              <span className="font-semibold text-white/70">Gap to strike:</span>{" "}
              <span className="text-amber-300">{gapText}</span>
              {" · contract: "}
              <span className="text-white/70">SBH27 underlying of SBG7 option</span>
              {" · "}
              <span className="text-white/55">{range} showing{rangeIsTruncated ? " (max available)" : ""}</span>
            </>
          ) : (
            <>
              Strike {strikePriceCents.toFixed(strikePriceCents % 1 === 0 ? 0 : 1)}¢ · Yahoo Finance daily close · 15-min ISR ·{" "}
              <span className="text-white/55">{range} showing{rangeIsTruncated ? " (max available)" : ""}</span>
            </>
          )}
        </div>
        {!showFallback && history && (
          <div className="text-white/40 tabular-nums">{history.symbol}</div>
        )}
      </div>
    </section>
  );
}
