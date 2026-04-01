"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  ReferenceLine,
  Tooltip,
} from "recharts";

interface SparkChartProps {
  data: { date: string; value: number }[];
  threshold?: number;
  color?: string;
  height?: number;
  showTooltip?: boolean;
}

interface TooltipPayloadEntry {
  value: number;
  payload: { date: string; value: number };
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const entry = payload[0];
  return (
    <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-3 py-2 shadow-lg">
      <p className="text-xs text-[var(--text-secondary)]">
        {entry.payload.date ?? label}
      </p>
      <p className="text-sm font-medium text-[var(--text-primary)]">
        {entry.value.toLocaleString()}
      </p>
    </div>
  );
}

export default function SparkChart({
  data,
  threshold,
  color = "var(--accent)",
  height = 80,
  showTooltip = true,
}: SparkChartProps) {
  const gradientId = `spark-gradient-${color.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>

        {showTooltip && (
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: "var(--card-border)", strokeWidth: 1 }}
          />
        )}

        {threshold !== undefined && (
          <ReferenceLine
            y={threshold}
            stroke="var(--danger)"
            strokeDasharray="4 4"
            strokeWidth={1}
            label={{
              value: `${threshold}`,
              position: "right",
              fill: "var(--danger)",
              fontSize: 10,
            }}
          />
        )}

        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={false}
          activeDot={{
            r: 3,
            fill: color,
            stroke: "var(--card)",
            strokeWidth: 2,
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
