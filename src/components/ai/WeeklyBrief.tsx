import type { WeeklyBriefData } from "@/lib/ai-bubble-types";

interface WeeklyBriefProps {
  brief: WeeklyBriefData;
}

function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * "This Week" card — renders the weeklyBrief block, which is designed to be
 * overwritten by an automated weekly sweep. Styled after WatchThisWeek.
 */
export default function WeeklyBrief({ brief }: WeeklyBriefProps) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-white">This Week</h3>
        <span className="text-[10px] uppercase tracking-wider text-white/45">
          Sweep of {formatDate(brief.date)} · cadence: {brief.nextSweep}
        </span>
      </div>

      <p className="text-sm font-semibold text-white/90">{brief.headline}</p>

      {brief.changes.length === 0 ? (
        <p className="mt-2 text-sm italic text-white/55">
          No changes logged yet — first weekly sweep pending.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-zinc-800/70">
          {brief.changes.map((change, i) => (
            <li key={`${change.signalId}-${i}`} className="flex items-start gap-3 py-2.5">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/45">
                  {change.signalId}
                </span>
                <p className="text-sm leading-relaxed text-white/80">{change.text}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
