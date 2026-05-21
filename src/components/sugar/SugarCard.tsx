"use client";

import type { ReactNode } from "react";

interface SugarCardProps {
  title: string;
  subtitle?: string;
  badge?: { label: string; tone?: "emerald" | "amber" | "zinc" | "red" };
  source?: string;
  footnote?: string;
  children: ReactNode;
}

const toneStyle = {
  emerald: "bg-emerald-500/15 text-emerald-200 ring-emerald-500/40",
  amber:   "bg-amber-500/15 text-amber-200 ring-amber-500/40",
  zinc:    "bg-zinc-500/15 text-zinc-200 ring-zinc-500/40",
  red:     "bg-red-500/15 text-red-200 ring-red-500/40",
};

export default function SugarCard({
  title,
  subtitle,
  badge,
  source,
  footnote,
  children,
}: SugarCardProps) {
  const tone = badge ? toneStyle[badge.tone ?? "zinc"] : "";

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6 transition-colors hover:border-emerald-500/40">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
          {subtitle && (
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{subtitle}</p>
          )}
        </div>
        {badge && (
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ring-1 ${tone}`}
          >
            {badge.label}
          </span>
        )}
      </div>

      <div>{children}</div>

      {(source || footnote) && (
        <div className="flex flex-col gap-2 border-t border-[var(--card-border)] pt-3">
          {footnote && (
            <p className="text-[11px] leading-relaxed text-[var(--text-secondary)]">
              {footnote}
            </p>
          )}
          {source && (
            <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--text-secondary)]">
              {source}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
