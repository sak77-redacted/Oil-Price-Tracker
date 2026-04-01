"use client";

import type { SignalStatus } from "@/lib/types";

interface StatusBadgeProps {
  status: SignalStatus;
  label: string;
}

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const styles: Record<
    SignalStatus,
    { bg: string; text: string; dot: string; pulse: boolean }
  > = {
    red: {
      bg: "bg-red-500/10",
      text: "text-red-400",
      dot: "bg-red-500",
      pulse: true,
    },
    yellow: {
      bg: "bg-yellow-500/10",
      text: "text-yellow-400",
      dot: "bg-yellow-500",
      pulse: false,
    },
    green: {
      bg: "bg-green-500/10",
      text: "text-green-400",
      dot: "bg-green-500",
      pulse: false,
    },
  };

  const s = styles[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 ${s.bg} ${s.text} text-xs font-medium uppercase tracking-wider`}
    >
      <span className="relative flex h-2 w-2">
        {s.pulse && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full ${s.dot} opacity-75`}
          />
        )}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${s.dot}`} />
      </span>
      {label}
    </span>
  );
}
