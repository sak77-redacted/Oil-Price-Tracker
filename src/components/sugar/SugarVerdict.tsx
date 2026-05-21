"use client";

import type { SugarThesis } from "@/lib/sugar-types";

interface SugarVerdictProps {
  thesis: SugarThesis;
}

const convictionStyle: Record<string, { ring: string; text: string; bg: string }> = {
  high:     { ring: "ring-emerald-500/50",  text: "text-emerald-200", bg: "bg-emerald-500/15" },
  moderate: { ring: "ring-amber-500/50",    text: "text-amber-200",   bg: "bg-amber-500/15"   },
  low:      { ring: "ring-zinc-500/50",     text: "text-zinc-200",    bg: "bg-zinc-500/15"    },
};

const directionStyle: Record<string, { label: string; arrow: string; text: string }> = {
  long:      { label: "LONG",      arrow: "▲", text: "text-emerald-300" },
  short:     { label: "SHORT",     arrow: "▼", text: "text-red-300" },
  sidelined: { label: "SIDELINED", arrow: "◆", text: "text-yellow-300" },
};

export default function SugarVerdict({ thesis }: SugarVerdictProps) {
  const conviction = convictionStyle[thesis.conviction] ?? convictionStyle.moderate;
  const direction = directionStyle[thesis.direction] ?? directionStyle.sidelined;

  return (
    <section
      aria-label="Sugar trade verdict"
      className="rounded-xl border border-emerald-500/40 p-6 sm:p-8"
      style={{
        backgroundImage:
          "linear-gradient(135deg, rgba(34, 197, 94, 0.18) 0%, rgba(22, 101, 52, 0.08) 50%, rgba(18, 18, 26, 0.95) 100%)",
      }}
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`text-2xl font-extrabold tabular-nums ${direction.text}`}>
            {direction.arrow}
          </span>
          <span className={`text-xl sm:text-2xl font-extrabold uppercase tracking-[0.18em] ${direction.text}`}>
            Sugar {direction.label}
          </span>
          <span className="text-white/30">·</span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ring-1 ${conviction.bg} ${conviction.text} ${conviction.ring}`}
          >
            {thesis.conviction} · {thesis.convictionPct}%
          </span>
          <span className="text-white/30">·</span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/55">
            El Niño + Hormuz Compound
          </span>
        </div>

        <h2 className="text-lg sm:text-xl font-semibold leading-snug text-white">
          {thesis.headline}
        </h2>
        <p className="max-w-4xl text-sm sm:text-base leading-relaxed text-white/70">
          {thesis.summary}
        </p>
      </div>
    </section>
  );
}
