"use client";

import { useMemo } from "react";

import type { ExecutedPosition as ExecutedPositionData } from "@/lib/sugar-types";
import { black76Call, impliedVolBlack76Call, yearsBetween, daysBetween as preciseDaysBetween } from "@/lib/black76";
import SugarCard from "./SugarCard";

interface Props {
  data: ExecutedPositionData;
  liveSugarSpot: number | null; // Yahoo SB=F in cents/lb, or null if fetch failed
}

// SB futures: standard contract size 112,000 lb. Premium quotes in ¢/lb,
// strike stored in $/lb (0.18 = 18¢). Yahoo SB=F price is in cents/lb.

// Risk-free rate for Black-76 model (annualized, continuous).
// 4.5% is a reasonable proxy for 1y US Treasury yield in 2026.
const RISK_FREE_RATE = 0.045;

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

  // Live Black-76 model estimate. Computed only when liveSugarSpot is
  // available. Frozen IV from broker snapshot; refresh broker weekly to
  // recalibrate. SB=F (continuous front-month) is a small approximation
  // vs the actual SBH27 underlying of SBG7.
  const modelEstimate = useMemo(() => {
    if (liveSugarSpot === null) return null;
    const nowIso = new Date().toISOString();
    const F = liveSugarSpot / 100;            // ¢/lb → $/lb
    const K = data.strike;                    // already $/lb (0.18)
    const T = yearsBetween(nowIso, data.expiryDate);
    const r = RISK_FREE_RATE;

    // Broker reports a "displayed IV" that's typically the 30-day ATM IV
    // of the underlying — NOT the option-specific IV (which includes the
    // vol smile/skew for OTM strikes). Back-solve σ from the broker
    // snapshot MV so the model is calibrated to actual market price.
    // Uses liveSugarSpot as proxy for snapshot spot (small bias acceptable
    // for snapshots within ~1 day).
    const brokerIv = data.greeks.impliedVolPct / 100;
    const snapshotPricePerLb =
      data.asOfMarketValueDollars / (data.contractSizeLbs * data.qty);
    const T_atSnapshot = yearsBetween(data.asOfDate, data.expiryDate);
    const calibratedSigma =
      impliedVolBlack76Call({
        F,
        K,
        T: T_atSnapshot,
        r,
        marketPrice: snapshotPricePerLb,
      }) ?? brokerIv;

    const sigma = calibratedSigma;
    const bs = black76Call({ F, K, T, r, sigma });
    const modelPricePerLb = bs.price;                                     // $/lb
    const modelPricePerContract = modelPricePerLb * data.contractSizeLbs; // $
    const modelMarketValue = modelPricePerContract * data.qty;            // $
    const modelUnrealizedPnL = modelMarketValue - data.costBasisDollars;
    const modelPnLPctOfCostBasis =
      data.costBasisDollars > 0
        ? (modelUnrealizedPnL / data.costBasisDollars) * 100
        : 0;

    const driftSinceSnapshot = modelUnrealizedPnL - data.asOfUnrealizedPnLDollars;
    const ivStalenessDays = Math.max(0, preciseDaysBetween(data.asOfDate, nowIso));

    return {
      F,
      T,
      sigma,
      brokerIv,
      calibratedSigma,
      modelPricePerLb,
      modelMarketValue,
      modelUnrealizedPnL,
      modelPnLPctOfCostBasis,
      driftSinceSnapshot,
      ivStalenessDays,
      computedAtIso: nowIso,
    };
  }, [
    liveSugarSpot,
    data.strike,
    data.expiryDate,
    data.greeks.impliedVolPct,
    data.contractSizeLbs,
    data.qty,
    data.costBasisDollars,
    data.asOfUnrealizedPnLDollars,
    data.asOfDate,
  ]);

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

  // Payoff table — computed from this leg's strike, qty, and cost basis.
  const strikeLabelCents = strikeCents.toFixed(strikeCents % 1 === 0 ? 0 : 1);
  const payoffScenarios: { cents: number; label: string; highlight?: boolean }[] = [
    { cents: 22, label: "22¢" },
    { cents: 28, label: "28¢ (BASE)", highlight: true },
    { cents: 36, label: "36¢ (BULL)", highlight: true },
    { cents: 50, label: "50¢ (TAIL)" },
  ];
  const payoffRows: {
    label: string;
    intrinsicPerContract: number;
    totalIntrinsic: number;
    pnl: number;
    multiple: string;
    highlight?: boolean;
  }[] = [
    {
      label: `≤${strikeLabelCents}¢ (OTM)`,
      intrinsicPerContract: 0,
      totalIntrinsic: 0,
      pnl: -data.costBasisDollars,
      multiple: "-100% (max loss)",
    },
    ...payoffScenarios
      .filter((s) => s.cents > strikeCents)
      .map((s) => {
        const intrinsicPerContract = ((s.cents - strikeCents) / 100) * data.contractSizeLbs;
        const totalIntrinsic = intrinsicPerContract * data.qty;
        const pnl = totalIntrinsic - data.costBasisDollars;
        const mult = data.costBasisDollars > 0 ? pnl / data.costBasisDollars : 0;
        return {
          label: s.label,
          intrinsicPerContract,
          totalIntrinsic,
          pnl,
          multiple: `~${mult >= 10 ? Math.round(mult).toString() : mult.toFixed(1)}x`,
          highlight: s.highlight,
        };
      }),
  ];

  return (
    <SugarCard
      title={`Executed Position — ${data.contractLabel} ×${data.qty}`}
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
              Sugar #11 · {data.qty} × {data.contractLabel}
              {data.qty === 1 ? "" : "s"}
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
            <span className="inline-flex items-center rounded-full bg-zinc-800/70 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70 ring-1 ring-zinc-700">
              {data.pctOfPortfolio.toFixed(2)}% of portfolio
            </span>
          </div>
        </div>

        {/* Hero P&L row — broker snapshot vs live model side-by-side */}
        <div className={`grid gap-3 ${modelEstimate !== null ? "lg:grid-cols-2" : ""}`}>
          {/* Broker snapshot — frozen */}
          <div className="rounded-lg border border-zinc-800/70 bg-zinc-950/70 p-4">
            <div className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">
                Broker Snapshot
              </span>
              <span className="text-[10px] uppercase tracking-[0.14em] text-white/40">
                frozen · {formatTimeShort(data.asOfDate)} {formatDateShort(data.asOfDate)}
              </span>
            </div>
            <div className={`text-2xl font-extrabold tabular-nums ${pnlColor}`}>
              {data.asOfUnrealizedPnLDollars >= 0 ? "+" : ""}
              {formatCurrency(data.asOfUnrealizedPnLDollars)}
            </div>
            <div className={`mt-0.5 text-sm font-semibold tabular-nums ${pnlColor}/90`}>
              {formatPct(pnlPctOfBasis)} of cost basis
            </div>
            <div className="mt-1.5 text-[11px] text-white/45">
              MV {formatCurrencyWhole(data.asOfMarketValueDollars)} · exact, updates on
              refresh
            </div>
          </div>

          {/* Live model — moves with SB=F */}
          {modelEstimate !== null && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4">
              <div className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300/90">
                  Live Model (Black-76)
                </span>
                <span className="text-[10px] uppercase tracking-[0.14em] text-white/40">
                  SB=F live · σ {(modelEstimate.calibratedSigma * 100).toFixed(1)}%
                </span>
              </div>
              <div
                className={`text-2xl font-extrabold tabular-nums ${modelEstimate.modelUnrealizedPnL >= 0 ? "text-emerald-300" : "text-red-300"}`}
              >
                {modelEstimate.modelUnrealizedPnL >= 0 ? "+" : ""}
                {formatCurrency(modelEstimate.modelUnrealizedPnL)}
              </div>
              <div
                className={`mt-0.5 text-sm font-semibold tabular-nums ${modelEstimate.modelUnrealizedPnL >= 0 ? "text-emerald-300/90" : "text-red-300/90"}`}
              >
                {formatPct(modelEstimate.modelPnLPctOfCostBasis)} of cost basis
              </div>
              <div className="mt-1.5 text-[11px] text-white/55">
                MV {formatCurrencyWhole(modelEstimate.modelMarketValue)} · Δ since
                snapshot{" "}
                <span
                  className={`font-semibold tabular-nums ${modelEstimate.driftSinceSnapshot >= 0 ? "text-emerald-300" : "text-red-300"}`}
                >
                  {modelEstimate.driftSinceSnapshot >= 0 ? "+" : ""}
                  {formatCurrency(modelEstimate.driftSinceSnapshot)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Position details — 2 columns */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-zinc-800/70 bg-zinc-950/70 p-4">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
              Position Details
            </div>
            <DetailRow
              label="Executed"
              value={data.executionDate ? formatDateShort(data.executionDate) : "Aug 2026"}
            />
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
            {typeof data.profitProbabilityPct === "number" && (
              <GreekChip
                label="P(profit)"
                value={`${data.profitProbabilityPct.toFixed(0)}%`}
              />
            )}
            <GreekChip label="OI" value={data.openInterest.toLocaleString()} />
          </div>
        </div>

        {/* Live model estimate — Black-76 */}
        {modelEstimate !== null && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4">
            <div className="mb-3 flex flex-wrap items-baseline gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300/90">
                Live Model Estimate (Black-76)
              </span>
              <span className="text-[10px] uppercase tracking-[0.14em] text-white/40">
                SB=F · refreshes every 15 min · σ calibrated{" "}
                {(modelEstimate.calibratedSigma * 100).toFixed(1)}%
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <ModelStat
                label="Live SB=F (proxy)"
                value={`${liveSugarSpot!.toFixed(2)}¢/lb`}
                sub="forward, continuous"
              />
              <ModelStat
                label="Model Option Price"
                value={`$${modelEstimate.modelPricePerLb.toFixed(4)}/lb`}
                sub={`${(modelEstimate.modelPricePerLb * 100).toFixed(3)}¢/lb premium`}
              />
              <ModelStat
                label="Model Market Value"
                value={formatCurrency(modelEstimate.modelMarketValue)}
                sub={`${data.qty} contract${data.qty === 1 ? "" : "s"} × 112,000 lbs`}
              />
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-zinc-800/70 bg-zinc-950/70 p-3">
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
                  Model P&amp;L (vs cost basis {formatCurrencyWhole(data.costBasisDollars)})
                </div>
                <div
                  className={`mt-1 text-xl font-extrabold tabular-nums ${modelEstimate.modelUnrealizedPnL >= 0 ? "text-emerald-300" : "text-red-300"}`}
                >
                  {modelEstimate.modelUnrealizedPnL >= 0 ? "+" : ""}
                  {formatCurrency(modelEstimate.modelUnrealizedPnL)}
                </div>
                <div
                  className={`mt-0.5 text-xs font-semibold tabular-nums ${modelEstimate.modelUnrealizedPnL >= 0 ? "text-emerald-300/80" : "text-red-300/80"}`}
                >
                  {formatPct(modelEstimate.modelPnLPctOfCostBasis)} of cost basis
                </div>
              </div>
              <div className="rounded-md border border-zinc-800/70 bg-zinc-950/70 p-3">
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
                  Drift since broker snapshot
                </div>
                <div
                  className={`mt-1 text-xl font-extrabold tabular-nums ${modelEstimate.driftSinceSnapshot >= 0 ? "text-emerald-300" : "text-red-300"}`}
                >
                  {modelEstimate.driftSinceSnapshot >= 0 ? "+" : ""}
                  {formatCurrency(modelEstimate.driftSinceSnapshot)}
                </div>
                <div className="mt-0.5 text-xs text-white/55">
                  {formatTimeShort(data.asOfDate)} {formatDateShort(data.asOfDate)} ·{" "}
                  <span className="font-semibold text-white/75">
                    σ calibrated {(modelEstimate.calibratedSigma * 100).toFixed(1)}% (
                    {modelEstimate.ivStalenessDays === 0
                      ? "fresh today"
                      : `${modelEstimate.ivStalenessDays} day${modelEstimate.ivStalenessDays === 1 ? "" : "s"} old`}
                    )
                  </span>
                </div>
              </div>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-white/50">
              <span className="font-semibold text-white/70">Methodology:</span>{" "}
              Black-76 futures option price using live SB=F as forward proxy.
              σ is <em className="not-italic font-semibold text-amber-300/85">back-solved
              from the broker snapshot MV</em>{" "}
              ({(modelEstimate.calibratedSigma * 100).toFixed(1)}%) — this
              captures the vol smile/skew that the broker&apos;s displayed
              ATM IV ({(modelEstimate.brokerIv * 100).toFixed(1)}%) does not
              include. r={(RISK_FREE_RATE * 100).toFixed(1)}%. Underlying SBG7
              is technically on SBH27 — using continuous SB=F is a small
              approximation. Refresh broker snapshot to recalibrate σ as the
              skew evolves.
            </p>
          </div>
        )}

        {/* Three-view comparison */}
        {modelEstimate !== null && liveSugarSpot !== null && (
          <div>
            <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
              Three Views of the Position
            </div>
            <div className="overflow-x-auto rounded-lg border border-zinc-800/70">
              <table className="min-w-full text-sm">
                <thead className="bg-zinc-950/70">
                  <tr className="text-left text-[10px] uppercase tracking-[0.14em] text-white/50">
                    <th className="px-3 py-2 font-semibold"> </th>
                    <th className="px-3 py-2 text-right font-semibold">Broker Snapshot</th>
                    <th className="px-3 py-2 text-right font-semibold">Model Estimate</th>
                    <th className="px-3 py-2 text-right font-semibold">Intrinsic Floor</th>
                  </tr>
                </thead>
                <tbody className="text-white/80">
                  <ComparisonRow
                    label="P&L"
                    broker={`${data.asOfUnrealizedPnLDollars >= 0 ? "+" : ""}${formatCurrency(data.asOfUnrealizedPnLDollars)}`}
                    brokerTone={data.asOfUnrealizedPnLDollars >= 0 ? "good" : "bad"}
                    model={`${modelEstimate.modelUnrealizedPnL >= 0 ? "+" : ""}${formatCurrency(modelEstimate.modelUnrealizedPnL)}`}
                    modelTone={modelEstimate.modelUnrealizedPnL >= 0 ? "good" : "bad"}
                    floor={(() => {
                      const itmCents = liveSugarSpot - data.strike * 100;
                      const intrinsicDollars = itmCents > 0
                        ? (itmCents / 100) * data.contractSizeLbs * data.qty
                        : 0;
                      const pnl = intrinsicDollars - data.costBasisDollars;
                      return `${pnl >= 0 ? "+" : ""}${formatCurrency(pnl)}`;
                    })()}
                    floorTone={(() => {
                      const itmCents = liveSugarSpot - data.strike * 100;
                      const intrinsicDollars = itmCents > 0
                        ? (itmCents / 100) * data.contractSizeLbs * data.qty
                        : 0;
                      return intrinsicDollars - data.costBasisDollars >= 0 ? "good" : "bad";
                    })()}
                  />
                  <ComparisonRow
                    label="Market Value"
                    broker={formatCurrencyWhole(data.asOfMarketValueDollars)}
                    model={formatCurrencyWhole(modelEstimate.modelMarketValue)}
                    floor={(() => {
                      const itmCents = liveSugarSpot - data.strike * 100;
                      const intrinsicDollars = itmCents > 0
                        ? (itmCents / 100) * data.contractSizeLbs * data.qty
                        : 0;
                      return formatCurrencyWhole(intrinsicDollars);
                    })()}
                  />
                  <ComparisonRow
                    label="Source"
                    broker={`${formatTimeShort(data.asOfDate)} ${formatDateShort(data.asOfDate)}`}
                    model="Black-76 (live)"
                    floor="Spot intrinsic only"
                    muted
                  />
                  <ComparisonRow
                    label="Confidence"
                    broker="Exact"
                    model="Model approx"
                    floor="Lower bound"
                    muted
                  />
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Live intrinsic floor */}
        {liveBlock}

        {/* Payoff table — this leg's strike × qty */}
        <div>
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
            Payoff at Expiry · {strikeLabelCents}¢ Strike × {data.qty} Contract{data.qty === 1 ? "" : "s"} · vs ${data.costBasisDollars.toLocaleString()} Cost
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

function ModelStat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-md border border-zinc-800/70 bg-zinc-950/70 p-3">
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
        {label}
      </div>
      <div className="mt-1 text-lg font-extrabold tabular-nums text-white">
        {value}
      </div>
      {sub ? <div className="mt-0.5 text-[11px] text-white/50">{sub}</div> : null}
    </div>
  );
}

function ComparisonRow({
  label,
  broker,
  model,
  floor,
  brokerTone,
  modelTone,
  floorTone,
  muted,
}: {
  label: string;
  broker: string;
  model: string;
  floor: string;
  brokerTone?: "good" | "bad";
  modelTone?: "good" | "bad";
  floorTone?: "good" | "bad";
  muted?: boolean;
}) {
  const toneClass = (tone?: "good" | "bad") =>
    tone === "good"
      ? "text-emerald-300 font-semibold"
      : tone === "bad"
        ? "text-red-300 font-semibold"
        : muted
          ? "text-white/60"
          : "text-white/85 font-semibold";
  return (
    <tr className="border-t border-zinc-800/70">
      <td className="px-3 py-2 text-[11px] uppercase tracking-[0.12em] text-white/45">
        {label}
      </td>
      <td className={`px-3 py-2 text-right tabular-nums ${toneClass(brokerTone)}`}>
        {broker}
      </td>
      <td className={`px-3 py-2 text-right tabular-nums ${toneClass(modelTone)}`}>
        {model}
      </td>
      <td className={`px-3 py-2 text-right tabular-nums ${toneClass(floorTone)}`}>
        {floor}
      </td>
    </tr>
  );
}
