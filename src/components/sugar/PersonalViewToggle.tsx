"use client";

import { useSugarView, type SugarViewMode } from "./ViewContext";

const OPTIONS: { value: SugarViewMode; label: string }[] = [
  { value: "thesis", label: "Thesis" },
  { value: "personal", label: "Personal" },
];

interface Props {
  positionLive?: boolean;
}

export default function PersonalViewToggle({ positionLive = false }: Props) {
  const { mode, setMode } = useSugarView();

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-950/80 p-1">
      <span className="px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
        View
      </span>
      {OPTIONS.map((opt) => {
        const active = mode === opt.value;
        const showDot = positionLive && opt.value === "personal";
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setMode(opt.value)}
            aria-pressed={active}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors ${
              active
                ? "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/40"
                : "text-white/55 hover:text-white"
            }`}
          >
            {showDot && (
              <span
                className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]"
                aria-label="Position live"
                title="Position live"
              />
            )}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
