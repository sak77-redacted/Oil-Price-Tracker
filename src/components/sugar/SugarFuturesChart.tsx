"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
} from "recharts";

import type { SugarFuturesHistory } from "@/lib/sugar-types";

interface Props {
  history: SugarFuturesHistory | null;
  strikePriceCents: number;
  entryPriceCents?: number;
  entryDate?: string;
  positionLabel?: string;
}

interface ChartPoint {
  date: string;
  close: number;
  dateLabel: string;
}

interface TooltipPayloadEntry {
  value: number;
  payload: ChartPoint;
}

function formatDateShort(iso: string): string {
  // YYYY-MM-DD → "DD MMM"
  const d = new Date(iso + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return iso;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]}`;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0];
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 shadow-lg">
      <p className="text-[10px] uppercase tracking-wider text-white/55">
        {entry.payload.dateLabel}
      </p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-white">
        {entry.value.toFixed(2)}
        <span className="ml-1 text-[10px] font-normal text-white/50">¢/lb</span>
      </p>
    </div>
  );
}

export default function SugarFuturesChart({
  history,
  strikePriceCents,
  entryPriceCents,
  entryDate,
  positionLabel,
}: Props) {
  const chartData: ChartPoint[] = useMemo(() => {
    if (!history) return [];
    return history.series.map((p) => ({
      date: p.date,
      close: p.close,
      dateLabel: formatDateShort(p.date),
    }));
  }, [history]);

  const lastClose = chartData.length > 0 ? chartData[chartData.length - 1].close : null;
  const firstDate = chartData.length > 0 ? chartData[0].dateLabel : "";
  const lastDate = chartData.length > 0 ? chartData[chartData.length - 1].dateLabel : "";

  // Y-axis bounds: include data extremes + entry + strike, then pad ±2¢.
  const yBounds = useMemo(() => {
    if (chartData.length === 0) return { min: 0, max: 1 };
    const closes = chartData.map((p) => p.close);
    const extras: number[] = [strikePriceCents];
    if (typeof entryPriceCents === "number") extras.push(entryPriceCents);
    const min = Math.min(...closes, ...extras);
    const max = Math.max(...closes, ...extras);
    return { min: Math.floor(min - 2), max: Math.ceil(max + 2) };
  }, [chartData, strikePriceCents, entryPriceCents]);

  // Gap to strike commentary
  const gapText = useMemo(() => {
    if (typeof entryPriceCents !== "number" || entryPriceCents <= 0) return null;
    const gap = strikePriceCents - entryPriceCents;
    const pct = (gap / entryPriceCents) * 100;
    const sign = gap >= 0 ? "+" : "";
    return `${sign}${gap.toFixed(1)}¢ (${sign}${pct.toFixed(1)}% above entry)`;
  }, [strikePriceCents, entryPriceCents]);

  const entryDateLabel = entryDate ? formatDateShort(entryDate) : null;
  const hasEntry = typeof entryPriceCents === "number" && entryPriceCents > 0;
  const showFallback = !history || chartData.length < 10;

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-5 sm:p-6">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white">
            Sugar #11 Futures
          </h3>
          <p className="mt-0.5 text-[11px] text-white/55">
            {history ? `${history.contractLabel} · ${firstDate} → ${lastDate}` : "6-month history"}
            {positionLabel ? ` · underlying of ${positionLabel}` : ""}
          </p>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">
            Last close
          </div>
          <div className="text-lg font-bold tabular-nums text-white">
            {lastClose !== null ? `${lastClose.toFixed(2)}¢` : "—"}
          </div>
        </div>
      </div>

      {/* Chart */}
      {showFallback ? (
        <div className="flex h-[280px] items-center justify-center rounded-lg border border-dashed border-zinc-800 bg-zinc-900/40 px-6 text-center">
          <p className="text-sm text-white/55">
            Sugar futures history unavailable — Yahoo Finance fetch failed. Falling back to spot reading only.
          </p>
        </div>
      ) : (
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 8, right: 64, bottom: 8, left: 8 }}
            >
              <CartesianGrid stroke="#3f3f46" strokeDasharray="2 4" vertical={false} />
              <XAxis
                dataKey="dateLabel"
                tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 10 }}
                axisLine={{ stroke: "#3f3f46" }}
                tickLine={{ stroke: "#3f3f46" }}
                minTickGap={32}
              />
              <YAxis
                domain={[yBounds.min, yBounds.max]}
                tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 10 }}
                axisLine={{ stroke: "#3f3f46" }}
                tickLine={{ stroke: "#3f3f46" }}
                tickFormatter={(v: number) => `${v.toFixed(0)}¢`}
                width={40}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: "rgba(255,255,255,0.2)", strokeWidth: 1 }}
              />

              {/* Gap area between entry and strike (subtle amber tint) */}
              {hasEntry && entryPriceCents !== undefined && strikePriceCents > entryPriceCents && (
                <ReferenceArea
                  y1={entryPriceCents}
                  y2={strikePriceCents}
                  fill="#f59e0b"
                  fillOpacity={0.06}
                  stroke="none"
                  ifOverflow="extendDomain"
                />
              )}

              {/* Strike line — amber dashed */}
              <ReferenceLine
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

              {/* Entry line — emerald dashed */}
              {hasEntry && entryPriceCents !== undefined && (
                <ReferenceLine
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

              {/* Futures close line — white/zinc */}
              <Line
                type="monotone"
                dataKey="close"
                stroke="#e4e4e7"
                strokeWidth={1.75}
                dot={false}
                activeDot={{ r: 3.5, fill: "#e4e4e7", stroke: "#0a0a0a", strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </LineChart>
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
            </>
          ) : (
            <>
              Strike {strikePriceCents.toFixed(strikePriceCents % 1 === 0 ? 0 : 1)}¢ · Yahoo Finance daily close · 15-min ISR
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
