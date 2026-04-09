"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";
import type { CrackSpreadData, RefiningMarginsData } from "@/lib/types";

interface CrackSpreadsProps {
  data: CrackSpreadData;
  marginsData?: RefiningMarginsData;
}

function formatChange(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}$${Math.abs(value).toFixed(2)}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-3 py-2 text-xs shadow-lg">
      <div className="mb-1 font-semibold text-[var(--text-primary)]">{label}</div>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-[var(--text-secondary)]">{entry.name}:</span>
          <span className="font-medium text-[var(--text-primary)]">${entry.value.toFixed(1)}/bbl</span>
        </div>
      ))}
    </div>
  );
}

export default function CrackSpreads({ data, marginsData }: CrackSpreadsProps) {
  const gasChangeColor =
    data.gasolineCrackChange >= 0 ? "#22c55e" : "#ef4444";
  const hoChangeColor =
    data.heatingOilCrackChange >= 0 ? "#22c55e" : "#ef4444";
  const gasArrow = data.gasolineCrackChange >= 0 ? "\u25B2" : "\u25BC";
  const hoArrow = data.heatingOilCrackChange >= 0 ? "\u25B2" : "\u25BC";

  // Build combined chart data from margins history
  const chartData = marginsData
    ? marginsData.gasolineCrack.history.map((g, i) => ({
        date: formatDate(g.date),
        gasoline: g.value,
        heatingOil: marginsData.heatingOilCrack.history[i]?.value ?? 0,
      }))
    : [];

  const gasBaseline = marginsData?.gasolineCrack.baseline ?? 15;
  const hoBaseline = marginsData?.heatingOilCrack.baseline ?? 25;

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card)]">
      {/* Header */}
      <div className="border-b border-[var(--card-border)] px-5 py-3">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">
          Refining Margins (Crack Spreads)
        </h2>
        <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
          How the crude crisis flows through to pump prices — watch for reversion to pre-crisis levels
        </p>
      </div>

      {/* Two-column crack cards */}
      <div className="grid grid-cols-1 gap-px bg-[var(--card-border)] sm:grid-cols-2">
        {/* Gasoline Crack */}
        <div className="bg-[var(--card)] px-5 py-5">
          <div className="mb-1 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
            Gasoline Crack (RB-CL)
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold tabular-nums text-[var(--text-primary)]">
              ${data.gasolineCrack.toFixed(2)}
            </span>
            <span className="text-sm font-medium text-[var(--text-secondary)]">
              /bbl
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span
              className="text-sm font-semibold tabular-nums"
              style={{ color: gasChangeColor }}
            >
              {gasArrow} {formatChange(data.gasolineCrackChange)} today
            </span>
          </div>
          <div className="mt-2 text-xs text-[var(--text-secondary)]">
            Pre-crisis baseline: <span className="font-semibold text-[var(--text-primary)]">~${gasBaseline}/bbl</span>
          </div>
        </div>

        {/* Heating Oil Crack */}
        <div className="bg-[var(--card)] px-5 py-5">
          <div className="mb-1 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
            Heating Oil Crack (HO-CL)
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold tabular-nums text-[var(--text-primary)]">
              ${data.heatingOilCrack.toFixed(2)}
            </span>
            <span className="text-sm font-medium text-[var(--text-secondary)]">
              /bbl
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span
              className="text-sm font-semibold tabular-nums"
              style={{ color: hoChangeColor }}
            >
              {hoArrow} {formatChange(data.heatingOilCrackChange)} today
            </span>
          </div>
          <div className="mt-2 text-xs text-[var(--text-secondary)]">
            Pre-crisis baseline: <span className="font-semibold text-[var(--text-primary)]">~${hoBaseline}/bbl</span>
          </div>
        </div>
      </div>

      {/* Trend chart — both cracks since pre-crisis */}
      {chartData.length > 0 && (
        <div className="border-t border-[var(--card-border)] px-5 py-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Margin Trend — Jan 2026 to Present
            </div>
            <div className="flex items-center gap-3 text-[10px] text-[var(--text-secondary)]">
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-[#f97316]" /> Gasoline
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-[#3b82f6]" /> Heating Oil
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-1 w-3 border-t border-dashed border-[#888]" /> Baseline
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
              <defs>
                <linearGradient id="gasGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="hoGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "#888" }}
                tickLine={false}
                axisLine={{ stroke: "#333" }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#888" }}
                tickLine={false}
                axisLine={false}
                width={35}
                tickFormatter={(v: number) => `$${v}`}
              />
              <Tooltip content={<CustomTooltip />} />
              {/* Pre-crisis baselines */}
              <ReferenceLine
                y={gasBaseline}
                stroke="#f97316"
                strokeDasharray="4 3"
                strokeOpacity={0.4}
                strokeWidth={1}
              />
              <ReferenceLine
                y={hoBaseline}
                stroke="#3b82f6"
                strokeDasharray="4 3"
                strokeOpacity={0.4}
                strokeWidth={1}
              />
              {/* Crisis start marker */}
              <ReferenceLine
                x="Mar 2"
                stroke="#ef4444"
                strokeDasharray="3 3"
                strokeOpacity={0.5}
                strokeWidth={1}
                label={{ value: "Strait closed", position: "top", fontSize: 9, fill: "#ef4444" }}
              />
              <Area
                type="monotone"
                dataKey="gasoline"
                name="Gasoline"
                stroke="#f97316"
                strokeWidth={2}
                fill="url(#gasGrad)"
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="heatingOil"
                name="Heating Oil"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#hoGrad)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-2 text-[11px] text-[var(--text-secondary)] leading-relaxed">
            Dashed lines = pre-crisis baseline. When margins revert toward those levels, refiners are struggling to pass through crude costs — the demand destruction signal HFI Research watches for.
          </div>
        </div>
      )}

      {/* HFI Research thesis */}
      {marginsData && (
        <div className="border-t border-[var(--card-border)] px-5 py-3">
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-1">
              Exit Signal Framework — HFI Research
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {marginsData.hfiThesis}
            </p>
            <div className="mt-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                Sell Triggers to Watch
              </div>
              <ul className="space-y-1">
                {marginsData.sellTriggers.map((trigger, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-[var(--text-secondary)]">
                    <span className="mt-0.5 shrink-0 text-amber-400">&#x25CB;</span>
                    {trigger}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-2 text-[10px] text-[var(--text-secondary)]">
            Source: {marginsData.source}
          </p>
        </div>
      )}
    </div>
  );
}
