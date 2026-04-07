"use client";

/**
 * CL Futures Expiry Calendar
 *
 * CME Rule: CL trading terminates on the 3rd business day prior to the 25th
 * calendar day of the month preceding the delivery month. If the 25th is a
 * non-business day, trading terminates 3 business days before the last
 * business day on or before the 25th.
 */

const MONTH_CODES: Record<number, string> = {
  1: "F", 2: "G", 3: "H", 4: "J", 5: "K", 6: "M",
  7: "N", 8: "Q", 9: "U", 10: "V", 11: "X", 12: "Z",
};

const MONTH_NAMES = [
  "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// US federal holidays that fall on weekdays (fixed + observed for 2026-2027)
// Only need months around CL expiry calculations
function getUSHolidays(year: number): Set<string> {
  const holidays = new Set<string>();
  const add = (m: number, d: number) => {
    holidays.add(`${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  };

  // New Year's Day
  add(1, 1);
  // MLK Day — 3rd Monday of January
  add(1, nthWeekday(year, 1, 1, 3));
  // Presidents Day — 3rd Monday of February
  add(2, nthWeekday(year, 2, 1, 3));
  // Good Friday — CME closes for Good Friday (not a federal holiday but CME observes it)
  const easter = computeEaster(year);
  const goodFriday = new Date(easter);
  goodFriday.setDate(goodFriday.getDate() - 2);
  add(goodFriday.getMonth() + 1, goodFriday.getDate());
  // Memorial Day — last Monday of May
  add(5, lastWeekday(year, 5, 1));
  // Juneteenth — June 19 (observed)
  addObserved(holidays, year, 6, 19);
  // Independence Day — July 4 (observed)
  addObserved(holidays, year, 7, 4);
  // Labor Day — 1st Monday of September
  add(9, nthWeekday(year, 9, 1, 1));
  // Thanksgiving — 4th Thursday of November
  add(11, nthWeekday(year, 11, 4, 4));
  // Christmas — December 25 (observed)
  addObserved(holidays, year, 12, 25);

  return holidays;
}

function addObserved(holidays: Set<string>, year: number, month: number, day: number) {
  const d = new Date(year, month - 1, day);
  const dow = d.getDay();
  let obsDay = day;
  if (dow === 0) obsDay = day + 1; // Sunday → Monday
  if (dow === 6) obsDay = day - 1; // Saturday → Friday
  holidays.add(`${year}-${String(month).padStart(2, "0")}-${String(obsDay).padStart(2, "0")}`);
}

function nthWeekday(year: number, month: number, targetDow: number, n: number): number {
  // targetDow: 0=Sun, 1=Mon, ..., 4=Thu
  let count = 0;
  for (let d = 1; d <= 31; d++) {
    const dt = new Date(year, month - 1, d);
    if (dt.getMonth() !== month - 1) break;
    if (dt.getDay() === targetDow) {
      count++;
      if (count === n) return d;
    }
  }
  return 1;
}

function lastWeekday(year: number, month: number, targetDow: number): number {
  const lastDay = new Date(year, month, 0).getDate();
  for (let d = lastDay; d >= 1; d--) {
    if (new Date(year, month - 1, d).getDay() === targetDow) return d;
  }
  return 1;
}

function computeEaster(year: number): Date {
  // Anonymous Gregorian algorithm
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isBusinessDay(d: Date, holidays: Set<string>): boolean {
  const dow = d.getDay();
  if (dow === 0 || dow === 6) return false;
  if (holidays.has(dateKey(d))) return false;
  return true;
}

function subtractBusinessDays(d: Date, n: number, holidays: Set<string>): Date {
  const result = new Date(d);
  let remaining = n;
  while (remaining > 0) {
    result.setDate(result.getDate() - 1);
    if (isBusinessDay(result, holidays)) remaining--;
  }
  return result;
}

interface CLContract {
  code: string;       // e.g. "CLK6"
  deliveryMonth: number;
  deliveryYear: number;
  deliveryLabel: string; // e.g. "May 26"
  expiryDate: Date;
  daysUntil: number;
}

function computeCLExpiry(deliveryMonth: number, deliveryYear: number): Date {
  // The preceding month
  let precMonth = deliveryMonth - 1;
  let precYear = deliveryYear;
  if (precMonth === 0) {
    precMonth = 12;
    precYear = deliveryYear - 1;
  }

  const holidays = getUSHolidays(precYear);

  // Find the 25th of the preceding month
  const day25 = new Date(precYear, precMonth - 1, 25);

  // If 25th is not a business day, use the last business day on or before the 25th
  let referenceDate: Date;
  if (isBusinessDay(day25, holidays)) {
    referenceDate = day25;
  } else {
    referenceDate = new Date(day25);
    while (!isBusinessDay(referenceDate, holidays)) {
      referenceDate.setDate(referenceDate.getDate() - 1);
    }
  }

  // Go back 3 business days from the reference date
  return subtractBusinessDays(referenceDate, 3, holidays);
}

function getUpcomingContracts(count: number): CLContract[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const contracts: CLContract[] = [];

  // Start from current month, look ahead up to 18 months
  let m = now.getMonth() + 1; // 1-indexed
  let y = now.getFullYear();

  for (let i = 0; i < 18 && contracts.length < count; i++) {
    const expiry = computeCLExpiry(m, y);
    const diffMs = expiry.getTime() - today.getTime();
    const daysUntil = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    // Only include contracts that haven't expired yet
    if (daysUntil >= 0) {
      const yearSuffix = String(y).slice(-1);
      const code = `CL${MONTH_CODES[m]}${yearSuffix}`;
      contracts.push({
        code,
        deliveryMonth: m,
        deliveryYear: y,
        deliveryLabel: `${MONTH_NAMES[m]} ${String(y).slice(-2)}`,
        expiryDate: expiry,
        daysUntil,
      });
    }

    m++;
    if (m > 12) { m = 1; y++; }
  }

  return contracts;
}

function expiryColor(days: number): string {
  if (days < 7) return "var(--danger)";
  if (days < 14) return "var(--warning)";
  return "var(--success)";
}

function expiryBgClass(days: number): string {
  if (days < 7) return "bg-red-500/15 border-red-500/30";
  if (days < 14) return "bg-amber-500/15 border-amber-500/30";
  return "bg-[var(--background)] border-[var(--card-border)]";
}

function formatExpiryDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function FuturesExpiry() {
  const contracts = getUpcomingContracts(4);

  if (contracts.length === 0) return null;

  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-5 py-4">
      {/* Header */}
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
          CL Futures Expiry Calendar
        </h3>
        <span className="text-[10px] text-[var(--text-secondary)]">
          Front month{" "}
          <span className="font-bold" style={{ color: expiryColor(contracts[0].daysUntil) }}>
            {contracts[0].code}
          </span>{" "}
          expires in{" "}
          <span className="font-bold tabular-nums" style={{ color: expiryColor(contracts[0].daysUntil) }}>
            {contracts[0].daysUntil}
          </span>{" "}
          {contracts[0].daysUntil === 1 ? "day" : "days"}
        </span>
      </div>

      {/* Contract chips */}
      <div className="flex flex-wrap gap-2">
        {contracts.map((c, i) => (
          <span
            key={c.code}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 ${expiryBgClass(c.daysUntil)}`}
          >
            {i === 0 && (
              <span className="rounded bg-[var(--accent)]/20 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--accent)]">
                Front
              </span>
            )}
            <span className="text-xs font-bold tabular-nums" style={{ color: expiryColor(c.daysUntil) }}>
              {c.code}
            </span>
            <span className="text-[11px] text-[var(--text-secondary)]">
              {c.deliveryLabel}
            </span>
            <span className="text-[10px] text-[var(--text-secondary)]">
              {formatExpiryDate(c.expiryDate)}
            </span>
            <span
              className="text-[10px] font-semibold tabular-nums"
              style={{ color: expiryColor(c.daysUntil) }}
            >
              {c.daysUntil}d
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
