import type { StackLayer } from "@/lib/ai-bubble-types";

interface StackDiagramProps {
  stack: StackLayer[];
}

/**
 * The three-borrower stack: 2/28 subprime borrower → OpenAI → US Treasury.
 * Three stacked cards with connecting arrows. The layer that broke in 2006
 * is styled red ("BROKE 2006"); the still-standing layers read "HOLDING".
 */
export default function StackDiagram({ stack }: StackDiagramProps) {
  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          The Three-Borrower Stack
        </h3>
        <span className="text-[10px] uppercase tracking-wider text-white/45">
          Same machine, bigger collateral
        </span>
      </div>
      <p className="mb-5 text-sm text-[var(--text-secondary)]">
        Each borrower posts a belief as collateral. Each belief requires a rate of
        acceleration to stay valid. The bottom layer already broke once.
      </p>

      <div className="flex flex-col items-stretch">
        {stack.map((layer, i) => {
          const broke = layer.broke !== null;
          return (
            <div key={layer.borrower} className="flex flex-col items-center">
              <div
                className={`w-full rounded-lg border p-4 sm:p-5 ${
                  broke
                    ? "border-red-500/50 bg-red-950/30"
                    : "border-zinc-700/80 bg-zinc-900/50"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <span className="text-sm font-bold text-white sm:text-base">
                    {layer.borrower}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      broke
                        ? "border-red-500/50 bg-red-500/15 text-red-300"
                        : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${broke ? "bg-red-500" : "bg-emerald-400"}`}
                    />
                    {broke ? "BROKE 2006" : "HOLDING"}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-white/45">
                      Collateral
                    </div>
                    <div className="mt-1 text-[13px] leading-snug text-white/85">
                      {layer.collateral}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-white/45">
                      Requires
                    </div>
                    <div className="mt-1 text-[13px] leading-snug text-white/85">
                      {layer.requirement}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-white/45">
                      What broke
                    </div>
                    <div
                      className={`mt-1 text-[13px] font-semibold leading-snug ${
                        broke ? "text-red-300" : "text-white/50"
                      }`}
                    >
                      {layer.broke ?? "— still holding —"}
                    </div>
                  </div>
                </div>
              </div>

              {i < stack.length - 1 && (
                <div className="flex flex-col items-center py-1.5 text-white/35" aria-hidden>
                  <span className="text-[10px] uppercase tracking-[0.2em]">same structure</span>
                  <span className="text-lg leading-none">↓</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-5 border-t border-[var(--card-border)] pt-3 text-[11px] italic leading-relaxed text-white/55">
        The 2/28 borrower needed 15%/yr appreciation to refinance before the rate reset.
        OpenAI needs each round priced 1.7–1.9x the last to keep compute commitments credible.
        The Treasury needs the world to keep believing America owns the future of growth.
        None of these breaks when the number falls — each breaks when it stops accelerating.
      </p>
    </div>
  );
}
