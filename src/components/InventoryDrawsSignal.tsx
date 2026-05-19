"use client";

import type {
  InventoryDrawsSignal as InventoryDrawsSignalType,
  SignalStatus,
  VisibleStocksMonthEntry,
} from "@/lib/types";
import { statusColor } from "@/lib/utils";
import SignalCard from "./SignalCard";

interface InventoryDrawsSignalProps {
  data: InventoryDrawsSignalType;
}

/**
 * Status logic per HFI Research (May 19, 2026) — Goldman Exhibit 10:
 *  - latestMonthDrawMbd > threshold * 1.5 (i.e. > 6.0)  → RED    "Point of no return"
 *  - latestMonthDrawMbd > threshold (i.e. > 4.0)        → YELLOW "Accelerating"
 *  - else                                                → GREEN  "Normalizing"
 */
function getStatus(latestMonthDrawMbd: number, threshold: number): SignalStatus {
  if (Math.abs(latestMonthDrawMbd) > threshold * 1.5) return "red";
  if (Math.abs(latestMonthDrawMbd) > threshold) return "yellow";
  return "green";
}

function getStatusLabel(status: SignalStatus): string {
  if (status === "red") return "Point of no return";
  if (status === "yellow") return "Accelerating";
  return "Normalizing";
}

/**
 * Color the visible-stocks cell based on the magnitude/direction of the draw.
 * Red: deep draw (< -1.0)
 * Yellow: moderate draw (-1.0 to -0.3)
 * Green/neutral: flat-to-positive (> -0.3)
 */
function cellClass(value: number): string {
  if (value < -1.0) {
    return "bg-red-500/15 text-red-300 border-red-500/30";
  }
  if (value < -0.3) {
    return "bg-amber-500/15 text-amber-300 border-amber-500/30";
  }
  return "bg-emerald-500/10 text-emerald-300/90 border-emerald-500/20";
}

function fmtCell(value: number): string {
  if (value === 0) return "0.0";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}`;
}

interface MiniTableRowProps {
  label: string;
  values: (entry: VisibleStocksMonthEntry) => number;
  entries: VisibleStocksMonthEntry[];
  avg: number;
  indent?: boolean;
  emphasize?: boolean;
}

function MiniTableRow({
  label,
  values,
  entries,
  avg,
  indent,
  emphasize,
}: MiniTableRowProps) {
  return (
    <tr
      className={
        emphasize
          ? "border-t border-[var(--card-border)] font-semibold"
          : "border-t border-[var(--card-border)]/40"
      }
    >
      <td
        className={`whitespace-nowrap py-1.5 pr-2 text-[11px] ${
          indent ? "pl-3 text-[var(--text-secondary)]" : "text-[var(--text-primary)]"
        }`}
      >
        {indent ? "— " : ""}
        {label}
      </td>
      {entries.map((e) => {
        const v = values(e);
        return (
          <td
            key={`${label}-${e.monthIso}`}
            className={`whitespace-nowrap px-2 py-1 text-center text-[11px] tabular-nums ${
              emphasize ? "" : "text-[var(--text-primary)]"
            }`}
          >
            <span
              className={`inline-block min-w-[2.7rem] rounded border px-1.5 py-0.5 ${cellClass(
                v,
              )} ${emphasize ? "font-bold" : ""}`}
            >
              {fmtCell(v)}
            </span>
            {e.partial && emphasize && (
              <span className="ml-1 align-middle text-[8px] uppercase tracking-wider text-amber-400/70">
                p
              </span>
            )}
          </td>
        );
      })}
      <td className="whitespace-nowrap py-1 pl-2 text-center text-[11px] tabular-nums">
        <span
          className={`inline-block min-w-[2.7rem] rounded border px-1.5 py-0.5 ${cellClass(
            avg,
          )} ${emphasize ? "font-bold" : ""}`}
        >
          {fmtCell(avg)}
        </span>
      </td>
    </tr>
  );
}

export default function InventoryDrawsSignal({
  data,
}: InventoryDrawsSignalProps) {
  const status = getStatus(data.latestMonthDrawMbd, data.threshold);
  const statusLabel = getStatusLabel(status);
  const headlineColor =
    status === "red"
      ? "var(--color-signal-red)"
      : status === "yellow"
        ? "var(--color-signal-yellow)"
        : "var(--color-signal-green)";

  const entries = data.monthlyEntries;
  const n = entries.length;
  const avg = <K extends keyof VisibleStocksMonthEntry>(key: K): number => {
    const sum = entries.reduce(
      (acc, e) => acc + (typeof e[key] === "number" ? (e[key] as number) : 0),
      0,
    );
    return n > 0 ? sum / n : 0;
  };

  return (
    <SignalCard
      title="Signal 13 · Visible Inventory Draws"
      subtitle="Goldman Exhibit 10 — global visible stocks have averaged -4.4 mb/d since Mar 1; May accelerating to -7.5"
      status={status}
      statusLabel={statusLabel}
      lastUpdated={data.lastUpdated}
      source={data.source}
      physicalMarketNote={data.physicalMarketNote}
      physicalMarketNotes={data.physicalMarketNotes}
    >
      <div className="flex flex-col gap-4">
        {/* Hero metric: latest-month draw */}
        <div className="flex items-baseline gap-3">
          <div>
            <span
              className="text-5xl font-bold tracking-tight tabular-nums"
              style={{ color: headlineColor }}
            >
              -{Math.abs(data.latestMonthDrawMbd).toFixed(1)}
            </span>
            <span className="ml-2 text-sm text-[var(--text-secondary)]">
              mb/d
            </span>
          </div>
          <div className="flex flex-col text-xs text-[var(--text-secondary)]">
            <span>{data.latestMonthLabel} draw rate (accelerating)</span>
            <span className="font-semibold text-[var(--text-primary)]">
              vs -{data.averageDrawMbd.toFixed(1)} mb/d period average since Mar 1
            </span>
          </div>
        </div>

        {/* Sub-stats: 3 chips */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Period avg since Mar 1
            </div>
            <div className="mt-1 text-lg font-bold tabular-nums text-[var(--text-primary)]">
              -{data.averageDrawMbd.toFixed(1)} mb/d
            </div>
            <div className="text-[10px] text-[var(--text-secondary)]">
              Global visible stocks
            </div>
          </div>

          <div className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              MoM acceleration
            </div>
            <div className="mt-1 text-lg font-bold tabular-nums text-red-300">
              -{data.accelerationMbd.toFixed(1)} mb/d
            </div>
            <div className="text-[10px] text-[var(--text-secondary)]">
              May vs April
            </div>
          </div>

          <div className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Tank-bottom risk
            </div>
            <div className="mt-1 inline-flex rounded-full border border-red-500/30 bg-red-500/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-red-300">
              Pre-June if pace holds
            </div>
            <div className="mt-1 text-[10px] text-[var(--text-secondary)]">
              JPM Fig 1: 5-yr low breached
            </div>
          </div>
        </div>

        {/* Implied Flow Decomposition strip */}
        <div className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] p-3">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Implied flow · {data.impliedFlow.asOfLabel}
            </span>
            <span className="text-[10px] text-[var(--text-secondary)]">
              Net = shut-in + demand loss − SPR releases
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {data.impliedFlow.components.map((c, idx) => {
              const isDrain = c.direction === "drain";
              const sign = isDrain ? "+" : "−";
              const color = isDrain
                ? "border-red-500/30 bg-red-500/10 text-red-300"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
              return (
                <div key={c.label} className="flex items-center gap-2">
                  <div
                    className={`flex items-baseline gap-2 rounded-md border px-2.5 py-1.5 ${color}`}
                  >
                    <span className="text-sm font-bold tabular-nums">
                      {sign}
                      {c.valueMbd.toFixed(1)}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider opacity-90">
                      {c.label}
                    </span>
                  </div>
                  {idx < data.impliedFlow.components.length - 1 && (
                    <span className="text-[var(--text-secondary)]">·</span>
                  )}
                </div>
              );
            })}
            <span className="text-[var(--text-secondary)]">=</span>
            <div
              className="rounded-md border border-red-500/40 bg-red-500/15 px-2.5 py-1.5"
              style={{ borderColor: statusColor("red") }}
            >
              <span className="text-sm font-bold tabular-nums text-red-300">
                -{data.impliedFlow.netDrawMbd.toFixed(1)} mb/d
              </span>
              <span className="ml-2 text-[10px] uppercase tracking-wider text-red-200/80">
                net draw
              </span>
            </div>
          </div>
        </div>

        {/* Goldman dataset mini-table */}
        <div className="overflow-x-auto rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2">
          <div className="mb-1 flex items-baseline justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Goldman visible-stocks dataset — mb/d MoM
            </span>
            <span className="text-[10px] italic text-[var(--text-secondary)]">
              <span className="text-amber-400/70">p</span> = partial month (May)
            </span>
          </div>
          <table className="w-full border-separate border-spacing-0 text-[11px]">
            <thead>
              <tr>
                <th className="py-1 pr-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  Stock category
                </th>
                {entries.map((e) => (
                  <th
                    key={`hdr-${e.monthIso}`}
                    className="px-2 py-1 text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]"
                  >
                    {e.month}
                    {e.partial && (
                      <span className="ml-1 align-middle text-[8px] text-amber-400/70">
                        p
                      </span>
                    )}
                  </th>
                ))}
                <th className="pl-2 py-1 text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  Avg
                </th>
              </tr>
            </thead>
            <tbody>
              <MiniTableRow
                label="Global Visible Stocks"
                values={(e) => e.globalVisibleStocks}
                entries={entries}
                avg={avg("globalVisibleStocks")}
                emphasize
              />
              <MiniTableRow
                label="Landed Crude"
                values={(e) => e.landedCrude}
                entries={entries}
                avg={avg("landedCrude")}
              />
              <MiniTableRow
                label="OECD"
                values={(e) => e.oecdLandedCrude}
                entries={entries}
                avg={avg("oecdLandedCrude")}
                indent
              />
              <MiniTableRow
                label="China"
                values={(e) => e.chinaLandedCrude}
                entries={entries}
                avg={avg("chinaLandedCrude")}
                indent
              />
              <MiniTableRow
                label="Non-OECD Ex-China"
                values={(e) => e.nonOecdExChinaLandedCrude}
                entries={entries}
                avg={avg("nonOecdExChinaLandedCrude")}
                indent
              />
              <MiniTableRow
                label="Landed Products"
                values={(e) => e.landedProducts}
                entries={entries}
                avg={avg("landedProducts")}
              />
              <MiniTableRow
                label="OECD NGL"
                values={(e) => e.oecdNgl}
                entries={entries}
                avg={avg("oecdNgl")}
                indent
              />
              <MiniTableRow
                label="OECD Refined Products"
                values={(e) => e.oecdRefinedProducts}
                entries={entries}
                avg={avg("oecdRefinedProducts")}
                indent
              />
              <MiniTableRow
                label="Non-OECD Total Products"
                values={(e) => e.nonOecdProducts}
                entries={entries}
                avg={avg("nonOecdProducts")}
                indent
              />
              <MiniTableRow
                label="Oil on Water"
                values={(e) => e.oilOnWater}
                entries={entries}
                avg={avg("oilOnWater")}
              />
              <MiniTableRow
                label="Floating Crude"
                values={(e) => e.floatingCrude}
                entries={entries}
                avg={avg("floatingCrude")}
                indent
              />
              <MiniTableRow
                label="Floating Products"
                values={(e) => e.floatingProducts}
                entries={entries}
                avg={avg("floatingProducts")}
                indent
              />
              <MiniTableRow
                label="Crude in Transit"
                values={(e) => e.crudeInTransit}
                entries={entries}
                avg={avg("crudeInTransit")}
                indent
              />
              <MiniTableRow
                label="Products in Transit"
                values={(e) => e.productsInTransit}
                entries={entries}
                avg={avg("productsInTransit")}
                indent
              />
            </tbody>
          </table>
        </div>

        {/* Status-driven insight banner */}
        <div
          className="rounded-lg border-l-2 px-4 py-3"
          style={{
            borderColor: statusColor(status),
            background:
              status === "red"
                ? "rgba(239, 68, 68, 0.08)"
                : status === "yellow"
                  ? "rgba(234, 179, 8, 0.08)"
                  : "rgba(34, 197, 94, 0.08)",
          }}
        >
          <p
            className="text-sm font-medium leading-relaxed"
            style={{ color: statusColor(status) }}
          >
            {status === "red" &&
              "May visible draws accelerated to -7.5 mb/d — 70% faster than the period average since March. JPM's own tank-bottom thesis assumes a June 1 reopening to avoid 5-year-low breach. HFI's counter: ballast tankers are now en route to US drainage; production restart cannot return barrels to the Persian Gulf before August regardless of when the strait reopens. Every day past the breaking point lowers the probability of any diplomatic resolution."}
            {status === "yellow" &&
              "Draws are accelerating relative to baseline. Visible-stocks data is still trending lower — buffer depletion is the leading edge."}
            {status === "green" &&
              "Draws have moderated below period average — buffer pressure easing as supply or demand normalizes."}
          </p>
        </div>

        {/* Methodology footnote */}
        <div className="border-t border-[var(--card-border)] pt-3 text-[11px] italic leading-relaxed text-[var(--text-secondary)]">
          {data.methodology}
        </div>
      </div>
    </SignalCard>
  );
}
