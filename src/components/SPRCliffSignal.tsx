"use client";

import { useEffect, useState } from "react";

// Source: Oil 101 Ch. 26 (M. Downey), IEA Emergency Response Reviews,
// JOGMEC, KNOC, ISPRL, industry estimates for China non-IEA reserves.
const OUTAGE_START_ISO = "2026-03-15";   // day Gulf outage reached 12 Mbpd
const SHIPPING_LAG_DAYS = 20;            // Persian Gulf → importer ports
const EX_US_RESERVES_MBBL = 1325;        // pre-crisis ex-US strategic reserves
const GULF_OUTAGE_MBPD = 12;             // sustained shut-in rate

interface Importer {
  name: string;
  hormuzShare: number;        // 0–1, Hormuz share of crude imports
  preCrisisCoverDays: number; // total SPR ÷ total daily net imports
  note: string;
}

const IMPORTERS: Importer[] = [
  { name: "India",        hormuzShare: 0.60,  preCrisisCoverDays: 40,  note: "ISPRL: Visakhapatnam, Mangalore, Padur" },
  { name: "South Korea",  hormuzShare: 0.70,  preCrisisCoverDays: 90,  note: "Peninsula — no pipeline alternative" },
  { name: "Japan",        hormuzShare: 0.80,  preCrisisCoverDays: 140, note: "Island nation — no pipeline alternative" },
  { name: "China",        hormuzShare: 0.40,  preCrisisCoverDays: 85,  note: "ESPO pipeline + Brazil/W. Africa diversification" },
  { name: "Europe (EU)",  hormuzShare: 0.175, preCrisisCoverDays: 90,  note: "Qatar LNG ~100% Hormuz-dependent" },
  { name: "United States", hormuzShare: 0.05, preCrisisCoverDays: 80,  note: "Net petroleum exporter — effectively immune" },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function addDaysFromOutage(days: number): Date {
  const d = new Date(OUTAGE_START_ISO + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + Math.round(days));
  return d;
}

function formatLongDate(d: Date): string {
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

export default function SPRCliffSignal() {
  // Defer all "now"-dependent rendering until after mount to avoid SSR
  // hydration mismatch — the countdown and elapsed-days values otherwise
  // differ between server and client by a few seconds.
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const globalRunDryDays = EX_US_RESERVES_MBBL / GULF_OUTAGE_MBPD - SHIPPING_LAG_DAYS;
  const runDryDate = addDaysFromOutage(globalRunDryDays);

  const totalSeconds = now
    ? Math.max(0, Math.floor((runDryDate.getTime() - now.getTime()) / 1000))
    : 0;
  const days  = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const mins  = Math.floor((totalSeconds % 3600) / 60);
  const secs  = totalSeconds % 60;

  const elapsedDays = now
    ? Math.floor((now.getTime() - new Date(OUTAGE_START_ISO + "T00:00:00Z").getTime()) / 86_400_000)
    : 0;

  const importerRows = IMPORTERS.map((i) => {
    const totalDays = i.preCrisisCoverDays / i.hormuzShare;
    const remaining = Math.max(0, totalDays - elapsedDays);
    return {
      ...i,
      totalDays,
      remaining,
      runDryDate: addDaysFromOutage(totalDays),
    };
  }).sort((a, b) => a.remaining - b.remaining);

  const maxBar = Math.max(...importerRows.map((r) => r.totalDays));

  function rowColor(remaining: number): string {
    if (remaining < 30) return "#ef4444";
    if (remaining < 90) return "#eab308";
    return "#22c55e";
  }

  return (
    <section className="overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card)]">
      {/* Header */}
      <div className="border-b border-[var(--card-border)] px-5 py-3">
        <div className="flex items-baseline gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
            Signal 7
          </span>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            Net-Importer SPR Cliff
          </h2>
        </div>
        <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
          When does Asia run dry?
        </p>
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-2">
        {/* Global countdown */}
        <div className="rounded-lg border border-[var(--card-border)] bg-black/30 p-5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Global ex-US strategic reserves exhausted in
          </div>
          <div className="mt-2 grid grid-cols-4 gap-2 text-center">
            {[
              { v: days, l: "days" },
              { v: hours, l: "hours" },
              { v: mins, l: "mins" },
              { v: secs, l: "secs" },
            ].map(({ v, l }) => (
              <div
                key={l}
                className="rounded border border-[var(--card-border)] bg-black/40 py-2"
              >
                <div className="text-2xl font-bold tabular-nums text-[var(--accent)]">
                  {now ? String(v).padStart(2, "0") : "··"}
                </div>
                <div className="text-[9px] uppercase tracking-wider text-[var(--text-secondary)]">
                  {l}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-[var(--text-secondary)]">
            Run-dry date:{" "}
            <span className="font-semibold text-[var(--text-primary)]">
              {formatLongDate(runDryDate)}
            </span>
          </div>
          <div className="mt-3 space-y-1 border-t border-[var(--card-border)] pt-3 font-mono text-[11px] text-[var(--text-secondary)]">
            <div>
              Pre-crisis ex-US reserves:{" "}
              <span className="text-[var(--text-primary)]">
                {EX_US_RESERVES_MBBL.toLocaleString()} M bbl
              </span>
            </div>
            <div>
              Gulf outage rate:{" "}
              <span className="text-[var(--text-primary)]">
                {GULF_OUTAGE_MBPD} Mbpd
              </span>
            </div>
            <div>
              Shipping lag:{" "}
              <span className="text-[var(--text-primary)]">
                {SHIPPING_LAG_DAYS} days
              </span>
            </div>
            <div className="pt-1">
              {EX_US_RESERVES_MBBL.toLocaleString()} ÷ {GULF_OUTAGE_MBPD} −{" "}
              {SHIPPING_LAG_DAYS} ={" "}
              <span className="font-semibold text-[var(--accent)]">
                {Math.round(globalRunDryDays)} days from Mar 15
              </span>
            </div>
          </div>
        </div>

        {/* Per-importer bars */}
        <div className="rounded-lg border border-[var(--card-border)] bg-black/30 p-5">
          <div className="flex items-baseline justify-between gap-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            <span>Importer days of cover</span>
            <span className="normal-case tracking-normal">
              Today: day {now ? elapsedDays : "··"} of crisis
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {importerRows.map((row) => {
              const pct = Math.max(2, (row.remaining / maxBar) * 100);
              const color = rowColor(row.remaining);
              return (
                <div
                  key={row.name}
                  className="grid grid-cols-12 items-center gap-2 text-[11px]"
                >
                  <div className="col-span-3 truncate font-medium text-[var(--text-primary)]">
                    {row.name}
                  </div>
                  <div className="col-span-5 h-3 overflow-hidden rounded bg-black/50">
                    <div
                      className="h-full rounded transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: color,
                        opacity: 0.85,
                      }}
                    />
                  </div>
                  <div className="col-span-4 flex items-baseline justify-end gap-1.5 tabular-nums">
                    <span className="font-bold" style={{ color }}>
                      {row.remaining < 1000 ? row.remaining.toFixed(0) : "∞"}d
                    </span>
                    <span className="text-[9px] text-[var(--text-secondary)]">
                      → {MONTHS[row.runDryDate.getUTCMonth()]}{" "}
                      {row.runDryDate.getUTCDate()}{" "}
                      {row.runDryDate.getUTCFullYear() !== 2026
                        ? `'${String(row.runDryDate.getUTCFullYear()).slice(-2)}`
                        : ""}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 border-t border-[var(--card-border)] pt-3 text-[11px] leading-snug text-[var(--text-secondary)]">
            <span className="font-semibold text-amber-400">
              India is the binding constraint
            </span>{" "}
            — 60% of crude imports transit Hormuz against only 40 days of pre-crisis SPR cover. ISPRL strategic reserves at Visakhapatnam, Mangalore, and Padur drain first regardless of when global reserves nominally run out.
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--card-border)] px-5 py-3 text-[10px] leading-relaxed text-[var(--text-secondary)]">
        <span className="font-semibold">Methodology:</span> days remaining = (pre-crisis SPR cover ÷ Hormuz import share) − days since outage onset (Mar 15, 2026). Pre-crisis cover and Hormuz share per Oil 101 Ch. 26 Table 26-3. Sources: Oil 101 (M. Downey), IEA Emergency Response Reviews, JOGMEC, KNOC, ISPRL, industry estimates.
      </div>
    </section>
  );
}
