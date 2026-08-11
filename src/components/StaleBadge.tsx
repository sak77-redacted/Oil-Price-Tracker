import { staleLabel } from "@/lib/staleness";

interface StaleBadgeProps {
  /** ISO date the underlying data last refreshed (e.g. "2026-05-21"). */
  date: string;
  className?: string;
}

/**
 * Small amber-muted pill flagging data that is no longer refreshed by the
 * daily sweep, e.g. "⏸ frozen May 21" / "⏸ carried forward Jul 14".
 * Unobtrusive — matches the existing uppercase 10px tracking chip style.
 */
export default function StaleBadge({ date, className = "" }: StaleBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border border-amber-500/25 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300/70 ${className}`}
    >
      <span aria-hidden>⏸</span> {staleLabel(date)}
    </span>
  );
}
