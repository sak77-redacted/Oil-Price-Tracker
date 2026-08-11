import type { AINote, AISignalStatus } from "@/lib/ai-bubble-types";
import AIStatusBadge from "./AIStatusBadge";

interface AISignalCardProps {
  title: string;
  /** The one-line "what to watch" question. */
  question: string;
  status: AISignalStatus;
  statusLabel?: string;
  source: string;
  lastUpdated: string;
  notes?: AINote[];
  children: React.ReactNode;
}

function formatDate(iso: string): string {
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00Z" : ""));
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * SignalCard-equivalent shell for the AI Bubble page — same dark card,
 * hover accent border, header + status pill + notes + source footer,
 * but typed against the speed-status vocabulary instead of red/yellow/green.
 */
export default function AISignalCard({
  title,
  question,
  status,
  statusLabel,
  source,
  lastUpdated,
  notes,
  children,
}: AISignalCardProps) {
  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6 transition-colors hover:border-[var(--accent)]">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
            <p className="mt-1 text-sm italic text-[var(--text-secondary)]">
              &ldquo;{question}&rdquo;
            </p>
          </div>
          <AIStatusBadge status={status} label={statusLabel} />
        </div>

        <div>{children}</div>

        {notes && notes.length > 0 && (
          <div className="flex flex-col gap-3">
            {notes.map((note, idx) => (
              <blockquote
                key={`${note.date}-${idx}`}
                className="border-l-2 border-amber-500/40 pl-3 text-sm italic leading-relaxed text-[var(--text-primary)]"
              >
                <p>&ldquo;{note.text}&rdquo;</p>
                <footer className="mt-2 not-italic text-[11px] text-[var(--text-secondary)]">
                  <span className="font-semibold text-amber-300/80">{note.attribution}</span>
                  <span className="mx-1.5 text-[var(--card-border)]">·</span>
                  <span>{formatDate(note.date)}</span>
                </footer>
              </blockquote>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-[var(--card-border)] pt-3">
          <span className="text-xs text-[var(--text-secondary)]">{source}</span>
          <span className="shrink-0 text-xs text-[var(--text-secondary)]">
            {formatDate(lastUpdated)}
          </span>
        </div>
      </div>
    </div>
  );
}
