import type { AIBubbleMeta, AIBubbleVerdict, CapexSignalData } from "@/lib/ai-bubble-types";

interface AIVerdictBannerProps {
  verdict: AIBubbleVerdict;
  meta: AIBubbleMeta;
  capex: CapexSignalData;
}

interface CountChip {
  label: string;
  count: number;
  classes: string;
  dot: string;
}

export default function AIVerdictBanner({ verdict, meta, capex }: AIVerdictBannerProps) {
  const chips: CountChip[] = [
    {
      label: "Accelerating",
      count: verdict.signalsAccelerating,
      classes: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
      dot: "bg-emerald-400",
    },
    {
      label: "Watch",
      count: verdict.signalsWatch,
      classes: "border-amber-500/40 bg-amber-500/10 text-amber-300",
      dot: "bg-amber-400",
    },
    {
      label: "Decelerating",
      count: verdict.signalsDecelerating,
      classes: "border-red-500/40 bg-red-500/10 text-red-300",
      dot: "bg-red-400",
    },
    {
      label: "Broken",
      count: verdict.signalsBroken,
      classes: "border-red-800/50 bg-red-900/20 text-red-300/80",
      dot: "bg-red-700",
    },
  ];

  return (
    <section
      aria-label="AI bubble verdict"
      className="rounded-xl border border-amber-500/40 p-6 sm:p-8"
      style={{
        backgroundImage:
          "linear-gradient(135deg, rgba(245, 158, 11, 0.14) 0%, rgba(120, 53, 15, 0.10) 50%, rgba(18, 18, 26, 0.95) 100%)",
      }}
    >
      <div className="flex flex-col gap-5">
        {/* Framing label */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--accent)]">
            The 2006 Question
          </span>
          <span className="text-xs text-white/45">{meta.videoSource}</span>
        </div>

        {/* Big status line */}
        <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
          {verdict.status}
        </h2>

        {/* The 2006 parallel one-liner */}
        <p className="max-w-3xl text-sm italic leading-relaxed text-amber-200/90 sm:text-base">
          House prices didn&apos;t crash in 2006 — they rose 8% instead of 15%. That was enough.
        </p>

        <p className="max-w-3xl text-sm leading-relaxed text-white/70">
          {verdict.compositeNote}
        </p>

        {/* Signal count chips */}
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span
              key={chip.label}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider ${chip.classes}`}
            >
              <span className={`h-2 w-2 rounded-full ${chip.dot}`} />
              <span className="tabular-nums">{chip.count}</span> {chip.label}
            </span>
          ))}
        </div>

        {/* Kill-trigger callout */}
        <div className="flex flex-col gap-2 rounded-lg border border-white/15 bg-black/30 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/55">
              The endgame signal — the one event that would mark the top
            </div>
            <div className="mt-1 text-sm font-semibold text-white/90">
              {capex.killTrigger.description}
            </div>
            {capex.killTrigger.explainer && (
              <p className="mt-1.5 max-w-2xl text-[12px] leading-relaxed text-white/55">
                {capex.killTrigger.explainer}
              </p>
            )}
          </div>
          <span
            className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${
              capex.killTrigger.fired
                ? "border-red-500/50 bg-red-500/15 text-red-300"
                : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${capex.killTrigger.fired ? "animate-ping bg-red-500" : "bg-emerald-400"}`}
            />
            {capex.killTrigger.fired ? "It happened" : "Hasn't happened yet"}
          </span>
        </div>

        <p className="text-[11px] uppercase tracking-wider text-white/40">
          {meta.crisisFrame} · Last sweep {meta.lastSweep}
        </p>
      </div>
    </section>
  );
}
