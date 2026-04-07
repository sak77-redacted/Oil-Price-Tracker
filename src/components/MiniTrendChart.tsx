"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  ReferenceLine,
  YAxis,
} from "recharts";

interface MiniTrendChartProps {
  data: { date: string; value: number }[];
  color: string;
  thresholdValue?: number;
  height?: number;
}

export default function MiniTrendChart({
  data,
  color,
  thresholdValue,
  height = 60,
}: MiniTrendChartProps) {
  if (!data || data.length === 0) return null;

  const gradientId = `mini-trend-${color.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <YAxis domain={["dataMin", "dataMax"]} hide />
        {thresholdValue != null && (
          <ReferenceLine
            y={thresholdValue}
            stroke={color}
            strokeDasharray="4 3"
            strokeOpacity={0.5}
            strokeWidth={1}
          />
        )}
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#${gradientId})`}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
