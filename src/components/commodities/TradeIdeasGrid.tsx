"use client";

import Link from "next/link";

import type { TradeIdea } from "@/lib/commodities-types";

interface Props {
  ideas: TradeIdea[];
}

const CONVICTION_STYLE: Record<
  TradeIdea["conviction"],
  { bg: string; text: string }
> = {
  "High Conviction": { bg: "bg-red-500/20", text: "text-red-200" },
  "Moderate Conviction": { bg: "bg-amber-500/20", text: "text-amber-200" },
  Speculative: { bg: "bg-indigo-500/20", text: "text-indigo-200" },
};

const TIER_BORDER: Record<1 | 2 | 3, string> = {
  1: "border-l-4 border-red-500/70",
  2: "border-l-4 border-amber-500/70",
  3: "border-l-4 border-lime-500/70",
};

export default function TradeIdeasGrid({ ideas }: Props) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {ideas.map((idea) => {
        const conv = CONVICTION_STYLE[idea.conviction];
        return (
          <div
            key={idea.ticker}
            className={`flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-5 transition-colors hover:border-amber-500/40 ${TIER_BORDER[idea.tier]}`}
          >
            <div className="flex items-start justify-between gap-3">
              <h4 className="text-base font-bold leading-snug text-white">
                {idea.name}
              </h4>
              <span className="shrink-0 rounded bg-zinc-900 px-2 py-0.5 font-mono text-xs font-bold text-white">
                {idea.ticker}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span
                className={`rounded-full px-2 py-0.5 font-bold uppercase tracking-[0.14em] ${conv.bg} ${conv.text}`}
              >
                {idea.conviction}
              </span>
              <span className="text-white/55">
                Contract: <span className="text-white">{idea.contract}</span>
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300">
                  Why
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-white/75">
                  {idea.why}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300">
                  Expression
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-white/75">
                  {idea.expression}
                </p>
              </div>

              {idea.sizingNote && (
                <div className="rounded-md border border-zinc-800 bg-zinc-900/40 p-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
                    Sizing note
                  </p>
                  <p className="mt-1 text-[11px] italic leading-relaxed text-white/65">
                    {idea.sizingNote}
                  </p>
                </div>
              )}

              {idea.crossLinkHref && (
                <Link
                  href={idea.crossLinkHref}
                  className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 transition-colors hover:text-emerald-200"
                >
                  <span aria-hidden>←</span>
                  {idea.crossLinkLabel ?? "View full thesis"}
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
