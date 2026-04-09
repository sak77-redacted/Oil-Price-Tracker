"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import type { IranianAttacksData } from "@/lib/types";

interface IranianAttacksProps {
  data: IranianAttacksData;
}

const COLORS = {
  saudi: "#f97316",
  bahrain: "#06b6d4",
  kuwait: "#22c55e",
  uae: "#3b82f6",
};

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((sum, entry) => sum + entry.value, 0);
  return (
    <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-3 py-2 text-xs shadow-lg">
      <div className="mb-1.5 font-semibold text-[var(--text-primary)]">{label} — {total} total</div>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-[var(--text-secondary)]">{entry.name}:</span>
          <span className="font-medium text-[var(--text-primary)]">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function IranianAttacks({ data }: IranianAttacksProps) {
  const latestMonth = data.months[data.months.length - 1];
  const peakMonth = data.months.reduce((max, m) => m.total > max.total ? m : max, data.months[0]);

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card)]">
      {/* Header */}
      <div className="border-b border-[var(--card-border)] px-5 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              Iranian Attacks on Gulf States
            </h2>
            <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
              Drones and missiles by target country — direct threat to Hormuz shipping
            </p>
          </div>
          {latestMonth.partial && (
            <span className="rounded-full bg-red-500/20 px-2.5 py-1 text-xs font-bold text-red-400 border border-red-500/30">
              Apr surging
            </span>
          )}
        </div>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-3 gap-px border-b border-[var(--card-border)] bg-[var(--card-border)]">
        <div className="bg-[var(--card)] px-4 py-3 text-center">
          <span className="block text-xl font-bold tabular-nums text-red-400">
            {latestMonth.total}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
            Apr (through 9th)
          </span>
        </div>
        <div className="bg-[var(--card)] px-4 py-3 text-center">
          <span className="block text-xl font-bold tabular-nums text-[var(--text-primary)]">
            {peakMonth.total}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
            Peak ({peakMonth.month})
          </span>
        </div>
        <div className="bg-[var(--card)] px-4 py-3 text-center">
          <span className="block text-xl font-bold tabular-nums text-amber-400">
            14 mo
          </span>
          <span className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
            Duration
          </span>
        </div>
      </div>

      {/* Stacked bar chart */}
      <div className="px-5 py-4">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.months} margin={{ top: 5, right: 0, bottom: 0, left: -10 }}>
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: "#888" }}
              tickLine={false}
              axisLine={{ stroke: "#333" }}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#888" }}
              tickLine={false}
              axisLine={false}
              width={35}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            />
            <Bar dataKey="saudi" name="Saudi Arabia" stackId="attacks" fill={COLORS.saudi} radius={[0, 0, 0, 0]} />
            <Bar dataKey="bahrain" name="Bahrain" stackId="attacks" fill={COLORS.bahrain} />
            <Bar dataKey="kuwait" name="Kuwait" stackId="attacks" fill={COLORS.kuwait} />
            <Bar dataKey="uae" name="UAE" stackId="attacks" fill={COLORS.uae} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Mosaic Strategy callout */}
      <div className="mx-5 mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-1">Mosaic Strategy</div>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          {data.mosaicStrategyNote}
        </p>
      </div>

      {/* Headlines */}
      {data.headlines.length > 0 && (
        <div className="border-t border-[var(--card-border)] px-5 py-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Related Headlines</div>
          <ul className="space-y-1">
            {data.headlines.map((headline, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-[var(--text-secondary)]">
                <span className="mt-0.5 shrink-0 text-red-400">&#x2022;</span>
                {headline}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Context + Source */}
      <div className="border-t border-[var(--card-border)] px-5 py-3">
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          <span className="font-semibold text-red-400">Insight:</span>{" "}
          {data.context}
        </p>
      </div>
      <div className="border-t border-[var(--card-border)] px-5 py-2">
        <p className="text-[10px] text-[var(--text-secondary)]">
          Source: {data.source}
        </p>
      </div>
    </div>
  );
}
