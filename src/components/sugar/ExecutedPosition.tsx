"use client";

import type { ExecutedPosition as ExecutedPositionData } from "@/lib/sugar-types";
import SugarCard from "./SugarCard";

interface Props {
  data: ExecutedPositionData;
  liveSugarSpot: number | null; // Yahoo SB=F in cents/lb, or null if fetch failed
}

// SB futures: standard contract size 112,000 lb. Premium quotes in ¢/lb,
// strike stored in $/lb (0.18 = 18¢). Yahoo SB=F price is in cents/lb.

function formatCurrency(n: number): string {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  return `${sign}$${abs.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function formatCurrencyWhole(n: number): string {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  return `${sign}$${abs.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function formatPct(n: number): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

function formatDateShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function formatTimeShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase();
}

function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(fromIso).getTime();
  const to = new Date(toIso).getTime();
  return Math.max(0, Math.round((to - from) / (1000 * 60 * 60 * 24)));
}

export default function ExecutedPosition({ data, liveSugarSpot }: Props) {
  const isLoss = data.asOfUnrealizedPnLDollars < 0;
  const pnlColor = isLoss ? "text-red-400" : "text-emerald-400";
  const pnlPctOfBasis =
    data.costBasisDollars > 0
      ? (data.asOfUnrealizedPnLDollars / data.costBasisDollars) * 100
      : 0;

  const todayIso = new Date().toISOString().slice(0, 10);
  const daysToExpiry = daysBetween(todayIso, data.expiryDate);

  // Intrinsic floor (live) — Yahoo gives cents/lb; strike in $/lb.
  const strikeCents = data.strike * 100;
  const liveSpotCents = liveSugarSpot; // already cents/lb
  let liveBlock: React.ReactNode = null;
  if (liveSpotCents !== null) {
    const itm = liveSpotCents - strikeCents;
    if (itm <= 0) {
      // OTM
      const timeValueDollars = data.asOfMarketValueDollars; // entire MV is theta-bound
      liveBlock = (
        <div className="rounded-lg border border-zinc-800/70 bg-zinc-950/70 p-4">
          <div className="mb-2 flex flex-wrap items-baseline gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300/80">
              Live Intrinsic Floor
            </span>
            <span className="text-[10px] uppercase tracking-[0.14em] text-white/40">
              SB=F · refreshes every 15 min
            </span>
          </div>
          <p className="text-sm leading-relaxed text-white/80">
            Live SB=F spot:{" "}
            <span className="font-semibold tabular-nums text-white">
              {liveSpotCents.toFixed(2)}¢
            </span>{" "}
            · Below strike (
            <span className="font-semibold tabular-nums">{strikeCents.toFixed(0)}¢</span>
            ) →{" "}
            <span className="font-semibold text-amber-200">Intrinsic value $0</span>
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-white/70">
            Time value remaining:{" "}
            <span className="font-semibold tabular-nums text-white">
              {formatCurrency(timeValueDollars)}
            </span>{" "}
            <span className="text-white/50">
              (entire market value is theta-bound)
            </span>
          </p>
        </div>
      );
    } else {
      // ITM
      const intrinsicPerContractDollars = (itm / 100) * data.contractSizeLbs;
      const totalIntrinsic = intrinsicPerContractDollars * data.qty;
      const timeValueDollars = Math.max(
        0,
        data.asOfMarketValueDollars - totalIntrinsic,
      );
      const pnlIfExpiredToday = totalIntrinsic - data.costBasisDollars;
      liveBlock = (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-4">
          <div className="mb-2 flex flex-wrap items-baseline gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300/80">
              Live Intrinsic Floor
            </span>
            <span className="text-[10px] uppercase tracking-[0.14em] text-white/40">
              SB=F · refreshes every 15 min
            </span>
          </div>
          <p className="text-sm leading-relaxed text-white/80">
            Live SB=F spot:{" "}
            <span className="font-semibold tabular-nums text-white">
              {liveSpotCents.toFixed(2)}¢
            </span>{" "}
            · ITM by{" "}
            <span className="font-semibold tabular-nums text-emerald-200">
              {itm.toFixed(2)}¢
            </span>{" "}
            → Intrinsic value{" "}
            <span className="font-semibold tabular-nums text-emerald-200">
              {formatCurrencyWhole(totalIntrinsic)}
            </span>
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-white/70">
            Time value remaining:{" "}
            <span className="font-semibold tabular-nums text-white">
              {formatCurrencyWhole(timeValueDollars)}
            </span>{" "}
            · P&amp;L if expired today:{" "}
            <span
              className={`font-semibold tabular-nums ${pnlIfExpiredToday >= 0 ? "text-emerald-300" : "text-red-300"}`}
            >
              {pnlIfExpiredToday >= 0 ? "+" : ""}
              {formatCurrencyWhole(pnlIfExpiredToday)}
            </span>
          </p>
        </div>
      );
    }
  }

  // Updated payoff table — for 18¢ strike, 2 contracts, $1,977 cost basis.
  const payoffRows: {
    label: string;
    intrinsicPerContract: number;
    totalIntrinsic: number;
    pnl: number;
    multiple: string;
    highlight?: boolean;
  }[] = [
    {
      label: "≤18¢ (OTM)",
      intrinsicPerContract: 0,
      totalIntrinsic: 0,
      pnl: -data.costBasisDollars,
      multiple: "-100% (max loss)",
    },
    {
      label: "22¢",
      intrinsicPerContract: 4480,
      totalIntrinsic: 8960,
      pnl: 6983,
      multiple: "~3.5x",
    },
    {
      label: "28¢ (BASE)",
      intrinsicPerContract: 11200,
      totalIntrinsic: 22400,
      pnl: 20423,
      multiple: "~10x",
      highlight: true,
    },
    {
      label: "36¢ (BULL)",
      intrinsicPerContract: 20160,
      totalIntrinsic: 40320,
      pnl: 38343,
      multiple: "~19x",
      highlight: true,
    },
    {
      label: "50¢ (TAIL)",
      intrinsicPerContract: 35840,
      totalIntrinsic: 71680,
      pnl: 69703,
      multiple: "~35x",
    },
  ];

  return (
    <SugarCard
      title="Executed Position — Live"
      badge={{ label: "Position Live", tone: "emerald" }}
      footnote={`Snapshot P&L from broker (${formatTimeShort(data.asOfDate)} ${formatDateShort(data.asOfDate)}). Live SB=F spot refreshes every 15 minutes via ISR. Greeks captured at entry — re-pull from broker for current values.`}
      source="Broker snapshot · Yahoo Finance SB=F · CME Sugar #11 specs"
    >
      <div className="flex flex-col gap-5">
        {/* Header — status + as-of */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-bold text-emerald-300">
              ✓
            </span>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">
              Position Live
            </span>
            <span className="text-white/30">·</span>
            <span className="text-sm text-white/70">
              Sugar #11 · {data.qty} × {data.contractLabel}s
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] uppercase tracking-[0.14em] text-white/45">
              As of {formatTimeShort(data.asOfDate)} ·{" "}
              {formatDateShort(data.asOfDate)}
            </span>
            <span className="inline-flex items-center rounded-full bg-zinc-800/70 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70 ring-1 ring-zinc-700">
              {daysToExpiry} days to expiry
            </span>
          </div>
        </div>

        {/* Hero P&L row */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-zinc-800/70 bg-zinc-950/70 p-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
              Unrealized P&amp;L
            </div>
            <div className={`mt-1 text-2xl font-extrabold tabular-nums ${pnlColor}`}>
              {data.asOfUnrealizedPnLDollars >= 0 ? "+" : ""}
              {formatCurrency(data.asOfUnrealizedPnLDollars)}
            </div>
          </div>
          <div className="rounded-lg border border-zinc-800/70 bg-zinc-950/70 p-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
              % of Cost Basis
            </div>
            <div className={`mt-1 text-2xl font-extrabold tabular-nums ${pnlColor}`}>
              {formatPct(pnlPctOfBasis)}
            </div>
          </div>
          <div className="rounded-lg border border-zinc-800/70 bg-zinc-950/70 p-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
              % of Portfolio
            </div>
            <div className="mt-1 text-2xl font-extrabold tabular-nums text-white">
              {data.pctOfPortfolio.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Position details — 2 columns */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-zinc-800/70 bg-zinc-950/70 p-4">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
              Position Details
            </div>
            <DetailRow label="Cost Basis" value={formatCurrencyWhole(data.costBasisDollars)} />
            <DetailRow label="Market Value" value={formatCurrencyWhole(data.asOfMarketValueDollars)} />
            <DetailRow
              label="Realized P&L"
              value={formatCurrencyWhole(data.asOfRealizedPnLDollars)}
            />
            <DetailRow
              label="Qty × Size"
              value={`${data.qty} × ${data.contractSizeLbs.toLocaleString()} lbs`}
            />
          </div>
          <div className="rounded-lg border border-zinc-800/70 bg-zinc-950/70 p-4">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
              Contract Spec
            </div>
            <DetailRow
              label="Avg Price"
              value={`${data.averagePrice.toFixed(2)}¢/lb`}
            />
            <DetailRow
              label="Strike"
              value={`${(data.strike * 100).toFixed(0)}¢ ($${data.strike.toFixed(2)})`}
            />
            <DetailRow
              label="Breakeven"
              value={`${(data.breakeven * 100).toFixed(0)}¢ ($${data.breakeven.toFixed(2)})`}
            />
            <DetailRow
              label="Contract"
              value={`SBG7 (${formatDateShort(data.expiryDate)})`}
            />
          </div>
        </div>

        {/* Greeks strip */}
        <div>
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
            Greeks (at entry · IV {data.greeks.impliedVolPct.toFixed(1)}%)
          </div>
          <div className="flex flex-wrap gap-2">
            <GreekChip label="Δ" value={data.greeks.delta.toFixed(3)} />
            <GreekChip label="Γ" value={data.greeks.gamma.toFixed(3)} />
            <GreekChip
              label="Θ"
              value={data.greeks.theta === 0 ? "~0" : data.greeks.theta.toFixed(3)}
            />
            <GreekChip
              label="ν"
              value={data.greeks.vega === 0 ? "~0" : data.greeks.vega.toFixed(3)}
            />
            <GreekChip label="IV" value={`${data.greeks.impliedVolPct.toFixed(1)}%`} />
            <GreekChip
              label="P(profit)"
              value={`${data.profitProbabilityPct.toFixed(0)}%`}
            />
            <GreekChip label="OI" value={data.openInterest.toLocaleString()} />
          </div>
        </div>

        {/* Live intrinsic floor */}
        {liveBlock}

        {/* Updated payoff table — 18¢ strike, 2 contracts */}
        <div>
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
            Payoff at Expiry · 18¢ Strike × 2 Contracts · vs ${data.costBasisDollars.toLocaleString()} Cost
          </div>
          <div className="overflow-x-auto rounded-lg border border-zinc-800/70">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-950/70">
                <tr className="text-left text-[10px] uppercase tracking-[0.14em] text-white/50">
                  <th className="px-3 py-2 font-semibold">Sugar at Expiry</th>
                  <th className="px-3 py-2 text-right font-semibold">Intrinsic / Contract</th>
                  <th className="px-3 py-2 text-right font-semibold">Total Intrinsic</th>
                  <th className="px-3 py-2 text-right font-semibold">P&amp;L</th>
                  <th className="px-3 py-2 text-right font-semibold">Multiple</th>
                </tr>
              </thead>
              <tbody>
                {payoffRows.map((row) => (
                  <tr
                    key={row.label}
                    className={`border-t border-zinc-800/70 ${row.highlight ? "bg-emerald-500/5" : ""}`}
                  >
                    <td className={`px-3 py-2 ${row.highlight ? "font-semibold text-emerald-200" : "text-white/80"}`}>
                      {row.label}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-white/80">
                      {formatCurrencyWhole(row.intrinsicPerContract)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-white/80">
                      {formatCurrencyWhole(row.totalIntrinsic)}
                    </td>
                    <td
                      className={`px-3 py-2 text-right tabular-nums font-semibold ${row.pnl >= 0 ? "text-emerald-300" : "text-red-300"}`}
                    >
                      {row.pnl >= 0 ? "+" : ""}
                      {formatCurrencyWhole(row.pnl)}
                    </td>
                    <td
                      className={`px-3 py-2 text-right font-semibold ${row.highlight ? "text-emerald-300" : "text-white/70"}`}
                    >
                      {row.multiple}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notes */}
        <div className="rounded-lg border border-zinc-800/70 bg-zinc-950/70 p-4">
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300/80">
            Execution Notes
          </div>
          <p className="text-sm italic leading-relaxed text-white/75">{data.notes}</p>
        </div>
      </div>
    </SugarCard>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-zinc-800/40 py-1.5 last:border-b-0">
      <span className="text-xs text-white/55">{label}:</span>
      <span className="text-sm font-semibold tabular-nums text-white">{value}</span>
    </div>
  );
}

function GreekChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5 rounded-full bg-zinc-900/80 px-3 py-1 text-xs ring-1 ring-zinc-700/70">
      <span className="font-bold text-white/55">{label}</span>
      <span className="font-semibold tabular-nums text-white">{value}</span>
    </span>
  );
}
