"use client";

import type { SignalStatus } from "@/lib/types";
import StatusBadge from "./StatusBadge";

interface SignalCardProps {
  title: string;
  subtitle?: string;
  status: SignalStatus;
  statusLabel: string;
  lastUpdated: string;
  source: string;
  children: React.ReactNode;
}

function formatTimestamp(isoDate: string): string {
  const date = new Date(isoDate);
  const now = Date.now();
  const diffMs = now - date.getTime();

  // Format absolute time
  const abs = date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  });

  // Relative suffix
  if (diffMs < 0) return abs;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return `${abs} (just now)`;
  if (minutes < 60) return `${abs} (${minutes}m ago)`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${abs} (${hours}h ago)`;
  const days = Math.floor(hours / 24);
  return `${abs} (${days}d ago)`;
}

export default function SignalCard({
  title,
  subtitle,
  status,
  statusLabel,
  lastUpdated,
  source,
  children,
}: SignalCardProps) {
  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6 transition-colors hover:border-[var(--accent)]">
      <div className="flex flex-col gap-4">
        {/* Header: title + status badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              {title}
            </h3>
            {subtitle && (
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {subtitle}
              </p>
            )}
          </div>
          <StatusBadge status={status} label={statusLabel} />
        </div>

        {/* Main content */}
        <div>{children}</div>

        {/* Footer: source + last updated */}
        <div className="flex items-center justify-between border-t border-[var(--card-border)] pt-3">
          <span className="text-xs text-[var(--text-secondary)]">{source}</span>
          <span className="text-xs text-[var(--text-secondary)]">
            {formatTimestamp(lastUpdated)}
          </span>
        </div>
      </div>
    </div>
  );
}
