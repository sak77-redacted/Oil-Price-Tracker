"use client";

import Link from "next/link";
import type { HormuzTransmissionData } from "@/lib/sugar-types";
import SugarCard from "./SugarCard";

interface Props {
  data: HormuzTransmissionData;
}

export default function HormuzTransmission({ data }: Props) {
  return (
    <SugarCard
      title="Hormuz → Fertilizer Transmission"
      subtitle="Concentrated impact: nitrogen + sulfur. Not fertilizer broadly."
      badge={{ label: "Urea +50% / Sulfur +50%", tone: "amber" }}
      source="IFA · ICIS · Saudi Customs"
      footnote="Hormuz raises Brazilian/Indian cane growers' input bill via nitrogen + sulfur — not potash. Saudi phosphate (top-4 exporter) routes via Hormuz too. Cane is moderately N-intensive; mill margins squeeze before yields drop."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-200/80">
            Hero — Input Cost Shock
          </div>
          <div className="mt-1 grid grid-cols-2 gap-2 tabular-nums">
            <div>
              <div className="text-2xl font-extrabold text-amber-200">+{data.ureaPriceMovePct}%</div>
              <div className="text-[10px] uppercase tracking-wider text-white/45">Urea</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-amber-200">+{data.ammoniaPriceMovePct}%</div>
              <div className="text-[10px] uppercase tracking-wider text-white/45">Ammonia</div>
            </div>
          </div>
        </div>

        <SubStat label="Urea via Hormuz" value={`${data.ureaPctViaHormuz}%`} />
        <SubStat label="Sulfur via Hormuz" value={`${data.sulfurPctViaHormuz}%`} />
        <SubStat label="Saudi Phosphate" value={`Top-${data.saudiPhosphateRank}`} context="Global exporter" />

        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 sm:col-span-2">
          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-200/80">
            Potash
          </div>
          <div className="mt-1 text-sm font-semibold text-emerald-200">
            {data.potashStatus}
          </div>
        </div>

        <div className="rounded-lg border border-zinc-800/70 bg-zinc-900/40 p-3 sm:col-span-2">
          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">
            Cane Nitrogen Intensity
          </div>
          <div className="mt-1 text-sm text-white/80">
            {data.caneNitrogenIntensity}
          </div>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45 hover:text-emerald-300 sm:col-span-2"
        >
          <span aria-hidden>←</span>
          See Hormuz Signal Tracker
        </Link>
      </div>
    </SugarCard>
  );
}

function SubStat({ label, value, context }: { label: string; value: string; context?: string }) {
  return (
    <div className="rounded-lg border border-zinc-800/70 bg-zinc-900/40 p-3">
      <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">
        {label}
      </div>
      <div className="mt-1 text-xl font-bold tabular-nums text-white">{value}</div>
      {context && <div className="mt-1 text-[11px] text-white/55">{context}</div>}
    </div>
  );
}
