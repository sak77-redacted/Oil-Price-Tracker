"use client";

import type { SignalStatus, PhysicalMarketNote } from "@/lib/types";
import { isStale } from "@/lib/staleness";
import StatusBadge from "./StatusBadge";

interface SignalCardProps {
  title: string;
  subtitle?: string;
  status: SignalStatus;
  statusLabel: string;
  lastUpdated: string;
  source: string;
  children: React.ReactNode;
  physicalMarketNote?: PhysicalMarketNote;
  physicalMarketNotes?: PhysicalMarketNote[];
}

function formatNoteDate(iso: string): string {
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00Z" : ""));
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
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
  physicalMarketNote,
  physicalMarketNotes,
}: SignalCardProps) {
  // Build a unified, deduped list of notes — array first, then any singular note
  // not already in the array. Sort newest first.
  const notes: PhysicalMarketNote[] = (() => {
    const arr: PhysicalMarketNote[] = [];
    const seen = new Set<string>();
    const push = (n?: PhysicalMarketNote) => {
      if (!n) return;
      const k = `${n.date}|${n.attribution}|${n.quote.slice(0, 40)}`;
      if (seen.has(k)) return;
      seen.add(k);
      arr.push(n);
    };
    (physicalMarketNotes ?? []).forEach(push);
    push(physicalMarketNote);
    return arr.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  })();

  // Date-gate: notes older than STALE_AFTER_DAYS collapse into a single
  // <details> at the card bottom; fresh sweep notes still render inline.
  const freshNotes = notes.filter((n) => !isStale(n.date));
  const datedNotes = notes.filter((n) => isStale(n.date));

  const formatShortDate = (iso: string): string => {
    const d = new Date(iso + (iso.length === 10 ? "T00:00:00Z" : ""));
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  };
  // datedNotes is sorted newest-first: newest = [0], oldest = last.
  const datedRangeLabel =
    datedNotes.length > 0
      ? `${formatShortDate(datedNotes[datedNotes.length - 1].date)}–${formatShortDate(datedNotes[0].date)}`
      : "";

  const renderNote = (note: PhysicalMarketNote, idx: number) => (
    <blockquote
      key={`${note.date}-${idx}`}
      className="border-l-2 border-amber-500/40 pl-3 text-sm italic leading-relaxed text-[var(--text-primary)]"
    >
      <p>&ldquo;{note.quote}&rdquo;</p>
      <footer className="mt-2 not-italic text-[11px] text-[var(--text-secondary)]">
        <span className="font-semibold text-amber-300/80">
          {note.attribution}
        </span>
        <span className="mx-1.5 text-[var(--card-border)]">·</span>
        <span className="text-[var(--text-secondary)]">
          {formatNoteDate(note.date)}
        </span>
        {note.context && (
          <div className="mt-1 not-italic text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
            {note.context}
          </div>
        )}
      </footer>
    </blockquote>
  );

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

        {/* Physical market notes ≤30 days old (newest first) */}
        {freshNotes.length > 0 && (
          <div className="flex flex-col gap-3">{freshNotes.map(renderNote)}</div>
        )}

        {/* Dated commentary (>30 days old) — collapsed by default */}
        {datedNotes.length > 0 && (
          <details className="rounded-lg border border-[var(--card-border)] bg-black/20">
            <summary className="cursor-pointer list-none px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              Dated commentary ({datedNotes.length}) — {datedRangeLabel} ▾
            </summary>
            <div className="flex flex-col gap-3 px-3 pb-3 pt-1">
              {datedNotes.map(renderNote)}
            </div>
          </details>
        )}

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
