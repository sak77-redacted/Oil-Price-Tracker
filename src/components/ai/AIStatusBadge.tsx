import type { AISignalStatus } from "@/lib/ai-bubble-types";

interface AIStatusBadgeProps {
  status: AISignalStatus;
  /** Optional override for the pill text (e.g. "PRESSURE RISING"). */
  label?: string;
}

const DEFAULT_LABELS: Record<AISignalStatus, string> = {
  accelerating: "Accelerating",
  decelerating: "Decelerating",
  broken: "Broken",
  watch: "Watch",
};

const STYLES: Record<
  AISignalStatus,
  { bg: string; text: string; dot: string; pulse: boolean }
> = {
  accelerating: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    dot: "bg-emerald-500",
    pulse: false,
  },
  watch: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    dot: "bg-amber-500",
    pulse: false,
  },
  decelerating: {
    bg: "bg-red-500/10",
    text: "text-red-400",
    dot: "bg-red-500",
    pulse: true,
  },
  broken: {
    bg: "bg-red-800/30",
    text: "text-red-300",
    dot: "bg-red-600",
    pulse: true,
  },
};

export default function AIStatusBadge({ status, label }: AIStatusBadgeProps) {
  const s = STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 ${s.bg} ${s.text} whitespace-nowrap text-xs font-medium uppercase tracking-wider`}
    >
      <span className="relative flex h-2 w-2">
        {s.pulse && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full ${s.dot} opacity-75`}
          />
        )}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${s.dot}`} />
      </span>
      {label ?? DEFAULT_LABELS[status]}
    </span>
  );
}
