/**
 * Shared staleness utilities.
 *
 * A daily automated sweep refreshes some signals.json blocks; others froze
 * during the May 2026 build-out. Anything whose embedded date is older than
 * STALE_AFTER_DAYS is treated as stale and demoted / badged accordingly.
 */

export const STALE_AFTER_DAYS = 30;

const DAY_MS = 86_400_000;

/** Parse an ISO date ("2026-05-21" or full timestamp) to epoch ms, NaN if invalid. */
function toTime(dateStr: string): number {
  const normalized =
    dateStr.length === 10 ? `${dateStr}T00:00:00Z` : dateStr;
  return new Date(normalized).getTime();
}

/**
 * True when the given date is more than STALE_AFTER_DAYS in the past.
 * Unparseable dates are treated as NOT stale (fail open — keep visible).
 */
export function isStale(dateStr: string, now: Date = new Date()): boolean {
  const t = toTime(dateStr);
  if (isNaN(t)) return false;
  return now.getTime() - t > STALE_AFTER_DAYS * DAY_MS;
}

/**
 * Human label for a stale date:
 *   - "frozen May 21"        — data more than ~2 months old (build-out layers)
 *   - "carried forward Jul 14" — data moderately old, still carried by the sweep
 */
export function staleLabel(dateStr: string, now: Date = new Date()): string {
  const t = toTime(dateStr);
  if (isNaN(t)) return "dated";
  const d = new Date(t);
  const formatted = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  const ageDays = (now.getTime() - t) / DAY_MS;
  const verb = ageDays > 60 ? "frozen" : "carried forward";
  return `${verb} ${formatted}`;
}
