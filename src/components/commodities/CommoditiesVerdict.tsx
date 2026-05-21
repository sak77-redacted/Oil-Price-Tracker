"use client";

interface Props {
  headline: string;
  subtitle: string;
  asOfDate: string;
  liveCount: number;
  totalCount: number;
}

export default function CommoditiesVerdict({
  headline,
  subtitle,
  asOfDate,
  liveCount,
  totalCount,
}: Props) {
  const allLive = liveCount === totalCount;
  const asOf = new Date(asOfDate).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  return (
    <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-zinc-950 via-zinc-950 to-amber-950/30 p-6 sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-amber-300">
            Macro View
          </p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            {headline}
          </h2>
          <p className="mt-2 text-sm text-white/70 sm:text-base">{subtitle}</p>
        </div>
        <div className="flex flex-col items-start gap-1 rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 sm:items-end">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">
            Data freshness
          </span>
          <span
            className={`text-xs font-semibold ${allLive ? "text-emerald-300" : "text-amber-200"}`}
          >
            {liveCount}/{totalCount} live
          </span>
          <span className="text-[10px] text-white/40">{asOf}</span>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Energy" hint="Hormuz premium" />
        <Stat label="Metals" hint="Safe haven bid" />
        <Stat label="Grains" hint="Fertilizer transmission" />
        <Stat label="Softs" hint="Mispriced vs El Niño" />
      </div>
    </div>
  );
}

function Stat({ label, hint }: { label: string; hint: string }) {
  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-950/40 px-3 py-2">
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-200">
        {label}
      </div>
      <div className="text-[11px] text-white/55">{hint}</div>
    </div>
  );
}
