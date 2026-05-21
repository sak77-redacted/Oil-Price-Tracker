"use client";

import type { SugarTodaysTape as SugarTodaysTapeData } from "@/lib/sugar-types";

interface Props {
  data: SugarTodaysTapeData;
}

function tile(label: string, content: React.ReactNode, accent?: string) {
  return (
    <div key={label} className="rounded-lg border border-zinc-800/60 bg-zinc-950/80 p-4">
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
        {label}
      </div>
      <div className={`mt-1.5 ${accent ?? ""}`}>{content}</div>
    </div>
  );
}

export default function SugarTodaysTape({ data }: Props) {
  const { spot, fiveYrLow, twentyYrATH, twentyYrLow, rangePosition, marH7IV, elNinoProbability, ytdPct } = data;

  // Range bar position (0 = $0.09 low, 100 = $0.36 ATH)
  const clampedPct = Math.max(0, Math.min(100, rangePosition));

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      {tile(
        "Spot",
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold tabular-nums text-white">{spot.toFixed(1)}</span>
          <span className="text-[11px] font-semibold text-white/50">¢/lb</span>
        </div>,
      )}

      {tile(
        "20-yr Range",
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold tabular-nums text-emerald-200">{clampedPct}%</span>
          </div>
          <div className="mt-2 relative h-2 w-full rounded-full bg-zinc-800/80">
            <div
              className="absolute -top-0.5 h-3 w-0.5 rounded-full bg-emerald-300"
              style={{ left: `${clampedPct}%` }}
              aria-hidden
            />
          </div>
          <div className="mt-1 flex justify-between text-[9px] font-semibold text-white/40 tabular-nums">
            <span>{twentyYrLow}¢</span>
            <span>{twentyYrATH}¢</span>
          </div>
        </div>,
      )}

      {tile(
        "5-yr Low",
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold tabular-nums text-white">{fiveYrLow.toFixed(1)}¢</span>
        </div>,
      )}

      {tile(
        "El Niño Prob.",
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold tabular-nums text-emerald-300">{elNinoProbability}%</span>
          <span className="text-[10px] text-white/50">May–Jul</span>
        </div>,
      )}

      {tile(
        "Mar'27 IV",
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold tabular-nums text-white">{marH7IV}%</span>
        </div>,
      )}

      {tile(
        "YTD",
        <div>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-bold tabular-nums ${ytdPct < 0 ? "text-red-300" : "text-emerald-300"}`}>
              {ytdPct > 0 ? "+" : ""}
              {ytdPct}%
            </span>
          </div>
          {ytdPct < 0 && (
            <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300/70">
              Bullish for entry
            </div>
          )}
        </div>,
      )}
    </div>
  );
}
