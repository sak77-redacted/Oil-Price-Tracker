"use client";

interface AISummaryData {
  summary: string;
  generatedAt: string;
  model: string;
  signalSnapshot: {
    insuranceCurrent: number;
    shipTransitCount: number;
    brentPrice: number;
    straitStatus: string;
    recessionRisk: string;
  };
}

interface AISummaryProps {
  data: AISummaryData | null;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now.getTime() - then.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export default function AISummary({ data }: AISummaryProps) {
  if (!data) return null;

  const generatedDate = new Date(data.generatedAt);
  const formattedDate = generatedDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = generatedDate.toLocaleTimeString("en-AU", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Australia/Sydney",
    hour12: true,
  });

  return (
    <section className="mt-8">
      <div className="mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            AI Daily Briefing — UAE Impact
          </h2>
          <span className="rounded-full bg-purple-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-400 border border-purple-500/30">
            AI Generated
          </span>
        </div>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Daily analysis at 9:00 AM AEDT — Iran war impact on the UAE
        </p>
      </div>

      <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6">
        {/* Summary text */}
        <div className="prose prose-invert max-w-none">
          {data.summary.split("\n\n").map((paragraph, i) => (
            <p
              key={i}
              className="mb-4 text-sm leading-relaxed text-[var(--text-primary)] last:mb-0"
            >
              {paragraph}
            </p>
          ))}
        </div>

        {/* Signal snapshot at time of generation */}
        <div className="mt-5 flex flex-wrap gap-3 border-t border-[var(--card-border)] pt-4">
          <span className="rounded bg-[var(--background)] px-2 py-1 text-[10px] text-[var(--text-secondary)]">
            Brent ${data.signalSnapshot.brentPrice}
          </span>
          <span className="rounded bg-[var(--background)] px-2 py-1 text-[10px] text-[var(--text-secondary)]">
            Insurance {data.signalSnapshot.insuranceCurrent}%
          </span>
          <span className="rounded bg-[var(--background)] px-2 py-1 text-[10px] text-[var(--text-secondary)]">
            Ships {data.signalSnapshot.shipTransitCount}/day
          </span>
          <span className="rounded bg-[var(--background)] px-2 py-1 text-[10px] text-[var(--text-secondary)]">
            Strait {data.signalSnapshot.straitStatus}
          </span>
          <span className="rounded bg-[var(--background)] px-2 py-1 text-[10px] text-[var(--text-secondary)]">
            Recession risk: {data.signalSnapshot.recessionRisk}
          </span>
        </div>

        {/* Meta info */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] text-[var(--text-secondary)]">
          <span>
            Generated {formattedDate} at {formattedTime} AEDT · {timeAgo(data.generatedAt)}
          </span>
          <span>
            Powered by Claude (Haiku) · Updates daily at 9:00 AM AEDT
          </span>
        </div>
      </div>
    </section>
  );
}
