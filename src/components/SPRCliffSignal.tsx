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
  preCrisisCoverDays: number; // canonical days metric — see `frame` for what it measures
  /** Methodology label printed under the days number. e.g. "IEA · days of net imports". */
  frame: string;
  note: string;
  // Optional dual-display secondary days number (e.g. India SPR-only vs SPR+OMC commercial).
  // When present, the row prints "<primary>d / <secondary>d" but the bar still uses primary.
  secondaryDays?: number;
  secondaryLabel?: string;     // e.g., "total" — short suffix for the second number
  // Optional draw-rate override for net exporters whose SPR drawdown is
  // driven by policy / export support rather than Hormuz import shortage.
  // When present, days remaining = (SPR balance − operational floor) ÷ draw rate.
  // The operational floor reflects that SPR salt caverns can't be physically
  // drained to zero — pumping rates degrade as the level drops, and the DOE
  // treats ~100–150 Mbbl as the practical floor below which sustained
  // drawdown becomes infeasible.
  sprPreCrisisMbbl?: number;
  sprDrawMbpd?: number;
  sprDrawStartIso?: string;
  sprFloorMbbl?: number;
  // For importers where the canonical days number is a fixed reference (IEA stockholding,
  // EIA "days of imports", etc.) rather than a Hormuz-share burn-down. When `staticDays` is
  // set, the row shows that number directly without subtracting elapsed crisis days.
  staticDays?: number;
  // EU "well-buffered" override — keep the green-bar treatment without computing burn-down.
  forceWellBuffered?: boolean;
  wellBufferedLabel?: string;  // e.g., "108 Mt vs 90 Mt IEA obligation"
}

// All numbers as of 2026-05-08. Frames per fact-check audit:
//  - SK / Japan / EU: IEA "days of net imports" (canonical comparable metric)
//  - India: dual display — SPR Phase-1 full (~9d) primary, +OMC commercial total (~74d) secondary
//  - US: days to 150 Mb operational floor at 1.4 Mbpd draw (~173d from EIA May 1 SPR = 392.7 Mb)
//  - China: EIA April 2026 "days of imports" (state + commercial)
const IMPORTERS: Importer[] = [
  // India — ISPRL Phase-1 caverns total 5.33 MMT (~36.9 Mbbl) ≈ 9.5 days of consumption when full,
  // ~6 days at the 64% fill reported March 2026. OMC commercial inventories add ~64 days.
  // We display "9d SPR / 74d total"; the bar uses the SPR-only number because OMC commercial
  // doesn't get rationed to refineries the same way.
  {
    name: "India",
    hormuzShare: 0.475,                  // 45–50% post-Russia pivot (PPAC/Vortexa Q1 2026)
    preCrisisCoverDays: 9,               // SPR Phase-1 full
    staticDays: 9,
    secondaryDays: 74,
    secondaryLabel: "total",
    frame: "SPR-only / +OMC commercial",
    note: "ISPRL Phase-1 (Visakhapatnam, Mangalore, Padur) — 5.33 MMT, ~36.9 Mbbl",
  },
  {
    name: "South Korea",
    hormuzShare: 0.70,
    preCrisisCoverDays: 200,
    staticDays: 200,
    frame: "IEA · days of net imports",
    note: "Peninsula — no pipeline alternative",
  },
  {
    name: "Japan",
    hormuzShare: 0.80,
    preCrisisCoverDays: 200,
    staticDays: 200,
    frame: "IEA · days of net imports",
    note: "Island nation — no pipeline alternative",
  },
  {
    name: "China",
    hormuzShare: 0.40,
    preCrisisCoverDays: 120,
    staticDays: 120,
    frame: "EIA · days of imports (state + commercial)",
    note: "Kpler 799 Mbbl / Vortexa 735 Mbbl, total ~1.4 Bbbl",
  },
  {
    name: "Europe (EU)",
    hormuzShare: 0.175,
    preCrisisCoverDays: 365,
    frame: "108 Mt vs 90 Mt IEA obligation",
    note: "EU Directive 2009/119 — Qatar LNG is the real bottleneck, not crude SPR",
    forceWellBuffered: true,
    wellBufferedLabel: "well-buffered",
  },
  // US: net petroleum exporter. SPR drawdown is driven by the IEA-committed
  // 172 Mbbl release (≈1.4 Mbpd over 120 days from Mar 11) plus ongoing
  // policy support for exports and price management — not Hormuz import
  // shortage. EIA weekly May 1 2026: SPR = 392.7 Mb (down ~17.5 Mb from 410.2 Mb mid-March
  // start of new tranche). Floor at 150 Mbbl reflects the DOE's practical minimum.
  // Days to floor at 1.4 Mbpd ≈ (392.7 − 150) ÷ 1.4 ≈ 173d.
  {
    name: "United States",
    hormuzShare: 0.05,
    preCrisisCoverDays: 173,
    frame: "days to 150 Mb floor @ 1.4 Mbpd",
    note: "Net petroleum exporter — SPR drawn for export support, not Hormuz cover",
    sprPreCrisisMbbl: 392.7,         // EIA weekly, May 1 2026
    sprDrawMbpd: 1.4,
    sprDrawStartIso: "2026-05-01",   // anchor model to EIA-authoritative date
    sprFloorMbbl: 150,
  },
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

  // 1-year cap: when an importer falls under the Hormuz-share model and the
  // ratio yields a multi-year horizon, label it "well-buffered" rather than
  // print a fake deadline. The cap doesn't apply to the draw-rate model —
  // those numbers (US SPR ÷ draw rate) are real countdowns.
  const HORIZON_DAYS = 365;
  const todayMs = now ? now.getTime() : 0;

  const importerRows = IMPORTERS.map((i) => {
    if (i.sprPreCrisisMbbl != null && i.sprDrawMbpd != null && i.sprDrawStartIso != null) {
      const drawStartMs = new Date(i.sprDrawStartIso + "T00:00:00Z").getTime();
      const floor = i.sprFloorMbbl ?? 0;
      const drawableTotal = Math.max(0, i.sprPreCrisisMbbl - floor);
      const totalDays = drawableTotal / i.sprDrawMbpd;
      const daysOfDraw = Math.max(0, (todayMs - drawStartMs) / 86_400_000);
      const balanceToday = Math.max(floor, i.sprPreCrisisMbbl - daysOfDraw * i.sprDrawMbpd);
      const drawableToday = Math.max(0, balanceToday - floor);
      const remaining = drawableToday / i.sprDrawMbpd;
      const runDryDate = new Date(drawStartMs + totalDays * 86_400_000);
      return { ...i, model: "drawRate" as const, totalDays, remaining, balanceToday, wellBuffered: false, runDryDate };
    }
    // Static-days frame (IEA / EIA reference numbers) — display the number directly.
    if (i.staticDays != null) {
      const totalDays = i.staticDays;
      const remaining = i.staticDays;
      const wellBuffered = i.forceWellBuffered === true;
      return {
        ...i,
        model: "static" as const,
        totalDays,
        remaining,
        balanceToday: undefined,
        wellBuffered,
        runDryDate: addDaysFromOutage(totalDays),
      };
    }
    if (i.forceWellBuffered) {
      return {
        ...i,
        model: "static" as const,
        totalDays: HORIZON_DAYS + 1,
        remaining: HORIZON_DAYS + 1,
        balanceToday: undefined,
        wellBuffered: true,
        runDryDate: addDaysFromOutage(HORIZON_DAYS + 1),
      };
    }
    const totalDays = i.preCrisisCoverDays / i.hormuzShare;
    const remaining = Math.max(0, totalDays - elapsedDays);
    const wellBuffered = remaining > HORIZON_DAYS;
    return {
      ...i,
      model: "hormuz" as const,
      totalDays,
      remaining,
      balanceToday: undefined,
      wellBuffered,
      runDryDate: addDaysFromOutage(totalDays),
    };
  }).sort((a, b) => a.remaining - b.remaining);

  function rowColor(remaining: number, wellBuffered: boolean): string {
    if (wellBuffered) return "#22c55e";
    if (remaining < 30) return "#ef4444";
    if (remaining < 90) return "#eab308";
    if (remaining < 240) return "#84cc16";
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
          <div className="mt-3 space-y-3">
            {importerRows.map((row) => {
              const pct = row.wellBuffered
                ? 100
                : Math.max(2, Math.min(100, (row.remaining / HORIZON_DAYS) * 100));
              const color = rowColor(row.remaining, row.wellBuffered);
              return (
                <div key={row.name} className="text-[11px]">
                  <div className="grid grid-cols-12 items-center gap-2">
                    <div className="col-span-3 truncate font-medium text-[var(--text-primary)]">
                      {row.name}
                      {row.model === "drawRate" && (
                        <div className="text-[9px] font-normal text-[var(--text-secondary)] opacity-80">
                          SPR draw {row.sprDrawMbpd?.toFixed(1)} Mbpd
                          {row.sprFloorMbbl != null && (
                            <> · floor {row.sprFloorMbbl} Mbbl</>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="col-span-5 h-3 overflow-hidden rounded bg-black/50">
                      <div
                        className="h-full rounded transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: color,
                          opacity: row.wellBuffered ? 0.5 : 0.85,
                        }}
                      />
                    </div>
                    <div className="col-span-4 flex items-baseline justify-end gap-1.5 tabular-nums">
                      {row.wellBuffered ? (
                        <span className="text-right text-[10px] font-medium uppercase tracking-wide text-emerald-400/80">
                          {row.wellBufferedLabel ?? "well-buffered"}
                        </span>
                      ) : (
                        <>
                          <span className="font-bold" style={{ color }}>
                            {now ? row.remaining.toFixed(0) : "···"}d
                          </span>
                          {row.secondaryDays != null && (
                            <span className="text-[10px] text-[var(--text-secondary)]">
                              / {row.secondaryDays}d
                              {row.secondaryLabel ? ` ${row.secondaryLabel}` : ""}
                            </span>
                          )}
                          {row.secondaryDays == null && (
                            <span className="text-[9px] text-[var(--text-secondary)]">
                              → {MONTHS[row.runDryDate.getUTCMonth()]}{" "}
                              {row.runDryDate.getUTCDate()}{" "}
                              {row.runDryDate.getUTCFullYear() !== 2026
                                ? `'${String(row.runDryDate.getUTCFullYear()).slice(-2)}`
                                : ""}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  {/* Frame / methodology label — small muted text under the bar */}
                  <div className="ml-[calc(25%+0.5rem)] mt-0.5 text-[9px] uppercase tracking-wider text-[var(--text-secondary)] opacity-70">
                    {row.frame}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 border-t border-[var(--card-border)] pt-3 text-[11px] leading-snug text-[var(--text-secondary)]">
            <span className="font-semibold text-amber-400">
              India is the binding constraint
            </span>{" "}
            — ~45–50% of crude imports transited the Strait of Hormuz pre-crisis (PPAC/Vortexa, Q1 2026), down from ~63% pre-Russia pivot. ISPRL Phase 1 caverns at Visakhapatnam, Mangalore, and Padur total just 5.33 MMT (~36.9 Mbbl) — about{" "}
            <span className="font-semibold text-[var(--text-primary)]">9.5 days of consumption when full</span>, and roughly{" "}
            <span className="font-semibold text-[var(--text-primary)]">6 days at the 64% fill reported in March 2026</span>. OMC commercial inventories add ~64 days, taking total national cover to ~74 days — still below the IEA 90-day standard, which India has no obligation to meet. Phase 2 expansion (Chandikhol + Padur II, +6.5 MMT) is not expected operational until ~2030.
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--card-border)] px-5 py-3 text-[10px] leading-relaxed text-[var(--text-secondary)]">
        <span className="font-semibold">Methodology — canonical metric: IEA &ldquo;days of net imports&rdquo;.</span>{" "}
        Frames are labelled per row because not every importer maps cleanly to one number.{" "}
        <span className="text-[var(--text-primary)]">South Korea, Japan, EU</span> use the IEA reference (SK ~200d, Japan ~200d net imports / ~254d consumption, EU 108 Mt vs the 90 Mt EU Directive 2009/119 obligation).{" "}
        <span className="text-[var(--text-primary)]">United States</span> uses <em>days to 150 Mb operational floor at 1.4 Mbpd draw</em>: SPR = 392.7 Mb on May 1 2026 (EIA weekly), so (392.7 − 150) ÷ 1.4 ≈ 173d. The 1.4 Mbpd rate matches the IEA-committed 172 Mbbl over 120 days; the floor reflects the DOE&apos;s practical minimum below which salt-cavern drawdown rates degrade.{" "}
        <span className="text-[var(--text-primary)]">China</span> uses EIA April 2026 &ldquo;days of imports&rdquo; — Kpler 799 Mb / Vortexa 735 Mb / total ~1.4 Bbbl across state + commercial.{" "}
        <span className="text-[var(--text-primary)]">India</span> shows two numbers: SPR Phase-1 full (~9d) is the binding constraint because OMC commercial inventories aren&apos;t rationed to refineries the same way; +OMC commercial total takes national cover to ~74d. The bar uses SPR-only.{" "}
        <span className="font-semibold text-[var(--text-primary)]">Source:</span>{" "}
        IEA Oil Information / Statista (SK, Japan); EIA Weekly Petroleum Status Report (US, May 1 2026); EIA April 2026 / Kpler / Vortexa (China); Eurostat &amp; EU Directive 2009/119 (EU); PPAC / Vortexa Q1 2026 (India Hormuz transit share); ISPRL official + Business Standard March 2026 (India 64% fill, 9.5 days); The Print (India Phase 2 ~2030).
      </div>
    </section>
  );
}
