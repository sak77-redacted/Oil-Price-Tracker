"use client";

import type { FuturesData, FuturesContract, SignalData } from "@/lib/types";
import { computeVerdict } from "@/lib/verdict";

interface FuturesDeskProps {
  data: FuturesData;
  signalData: SignalData;
}

function formatPrice(contract: FuturesContract): string {
  if (contract.symbol === "GC=F") {
    return `$${contract.price.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
  return `$${contract.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatChange(value: number, decimals: number = 2): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}`;
}

interface SignalImpact {
  range: string;
  direction: "up" | "down" | "flat";
  color: string;
  pctRange: string;
  rationale: string;
}

function computePctRange(
  price: number,
  lowPrice: number,
  highPrice: number,
  direction: "up" | "down" | "flat"
): string {
  const pctLow = Math.round(((lowPrice - price) / price) * 100);
  const pctHigh = Math.round(((highPrice - price) / price) * 100);
  if (direction === "up") {
    return `(+${Math.abs(pctLow)}% to +${Math.abs(pctHigh)}%)`;
  }
  if (direction === "down") {
    return `(-${Math.abs(pctHigh)}% to -${Math.abs(pctLow)}%)`;
  }
  // flat — show ± range using the larger absolute bound
  const absBound = Math.max(Math.abs(pctLow), Math.abs(pctHigh));
  return `(±${absBound}%)`;
}

function getRationale(sym: string, gap: number): string {
  if (gap >= 5) {
    // Crisis rationale
    switch (sym) {
      case "CL=F":
        return "Hormuz blockage cuts 20% of global supply — US benchmark reprices on fear + SPR depletion";
      case "BZ=F":
        return "Direct exposure — Brent is the physical barrel most affected by Hormuz transit disruption";
      case "RB=F":
        return "Crude feedstock spike passes through to gasoline — refinery margins compress";
      case "HO=F":
        return "Diesel/heating oil tracks crude with ~80% pass-through — freight costs amplify";
      case "NG=F":
        return "LNG substitution effect — if oil supply is disrupted, power generators switch to gas";
      case "GC=F":
        return "Safe haven bid — geopolitical crisis drives flight to gold, especially if USD weakens";
      default:
        return "";
    }
  }
  if (gap >= 3) {
    // Elevated rationale
    switch (sym) {
      case "CL=F":
        return "Moderate disruption risk — WTI could see pressure if situation escalates";
      case "BZ=F":
        return "Moderate disruption risk — Brent could see pressure if situation escalates";
      case "RB=F":
        return "Moderate disruption risk — gasoline could see pressure if situation escalates";
      case "HO=F":
        return "Moderate disruption risk — heating oil could see pressure if situation escalates";
      case "NG=F":
        return "Moderate disruption risk — gas could see mild pressure from substitution if situation escalates";
      case "GC=F":
        return "Moderate disruption risk — gold could see safe-haven flows if situation escalates";
      default:
        return "";
    }
  }
  // Easing rationale
  switch (sym) {
    case "CL=F":
      return "Easing transit conditions — WTI likely to pull back as risk premium unwinds";
    case "BZ=F":
      return "Easing transit conditions — Brent likely to pull back as risk premium unwinds";
    case "RB=F":
      return "Easing transit conditions — gasoline likely to pull back as risk premium unwinds";
    case "HO=F":
      return "Easing transit conditions — heating oil likely to pull back as risk premium unwinds";
    case "NG=F":
      return "Easing transit conditions — gas likely to ease as substitution demand fades";
    case "GC=F":
      return "Easing transit conditions — gold likely to ease as safe-haven bid unwinds";
    default:
      return "";
  }
}

// Estimate signal-based price impact per contract
function getSignalImpact(
  contract: FuturesContract,
  signalData: SignalData
): SignalImpact {
  const gap = signalData.timeline.currentGapMbd;
  const price = contract.price;
  const sym = contract.symbol;
  const rationale = getRationale(sym, gap);

  // Direct crude oil contracts — highest impact from Hormuz
  if (sym === "CL=F" || sym === "BZ=F") {
    if (gap >= 5) {
      const low = Math.round(price + 10);
      const high = Math.round(price + 25);
      return { range: `$${low}-${high}`, direction: "up", color: "#ef4444", pctRange: computePctRange(price, low, high, "up"), rationale };
    }
    if (gap >= 3) {
      const low = Math.round(price - 5);
      const high = Math.round(price + 10);
      return { range: `$${low}-${high}`, direction: "flat", color: "#eab308", pctRange: computePctRange(price, low, high, "flat"), rationale };
    }
    const low = Math.round(price - 15);
    const high = Math.round(price - 5);
    return { range: `$${low}-${high}`, direction: "down", color: "#22c55e", pctRange: computePctRange(price, low, high, "down"), rationale };
  }

  // Gasoline & Diesel — correlated to crude, pass-through with ~70-80% sensitivity
  if (sym === "RB=F" || sym === "HO=F") {
    if (gap >= 5) {
      const low = parseFloat((price + price * 0.08).toFixed(2));
      const high = parseFloat((price + price * 0.20).toFixed(2));
      return { range: `$${low.toFixed(2)}-${high.toFixed(2)}`, direction: "up", color: "#ef4444", pctRange: computePctRange(price, low, high, "up"), rationale };
    }
    if (gap >= 3) {
      const low = parseFloat((price - price * 0.03).toFixed(2));
      const high = parseFloat((price + price * 0.08).toFixed(2));
      return { range: `$${low.toFixed(2)}-${high.toFixed(2)}`, direction: "flat", color: "#eab308", pctRange: computePctRange(price, low, high, "flat"), rationale };
    }
    const low = parseFloat((price - price * 0.10).toFixed(2));
    const high = parseFloat((price - price * 0.03).toFixed(2));
    return { range: `$${low.toFixed(2)}-${high.toFixed(2)}`, direction: "down", color: "#22c55e", pctRange: computePctRange(price, low, high, "down"), rationale };
  }

  // Natural Gas — less direct Hormuz impact, but LNG substitution effects
  if (sym === "NG=F") {
    if (gap >= 5) {
      const low = parseFloat((price + price * 0.05).toFixed(2));
      const high = parseFloat((price + price * 0.15).toFixed(2));
      return { range: `$${low.toFixed(2)}-${high.toFixed(2)}`, direction: "up", color: "#eab308", pctRange: computePctRange(price, low, high, "up"), rationale };
    }
    const low = parseFloat((price - price * 0.05).toFixed(2));
    const high = parseFloat((price + price * 0.05).toFixed(2));
    return { range: `$${low.toFixed(2)}-${high.toFixed(2)}`, direction: "flat", color: "#eab308", pctRange: computePctRange(price, low, high, "flat"), rationale };
  }

  // Gold — fear trade, rises with crisis
  if (sym === "GC=F") {
    if (gap >= 5) {
      const low = Math.round(price + 50);
      const high = Math.round(price + 200);
      return { range: `$${low.toLocaleString()}-${high.toLocaleString()}`, direction: "up", color: "#eab308", pctRange: computePctRange(price, low, high, "up"), rationale };
    }
    const low = Math.round(price - 50);
    const high = Math.round(price + 50);
    return { range: `$${low.toLocaleString()}-${high.toLocaleString()}`, direction: "flat", color: "#eab308", pctRange: computePctRange(price, low, high, "flat"), rationale };
  }

  return { range: "—", direction: "flat", color: "#71717a", pctRange: "", rationale: "" };
}

function ContractRow({
  contract,
  isEven,
  impact,
}: {
  contract: FuturesContract;
  isEven: boolean;
  impact: SignalImpact;
}) {
  const changeColor = contract.change >= 0 ? "#22c55e" : "#ef4444";
  const isGold = contract.symbol === "GC=F";
  const impactArrow = impact.direction === "up" ? "▲" : impact.direction === "down" ? "▼" : "◆";

  return (
    <>
      {/* Desktop row */}
      <div
        className="hidden sm:grid sm:grid-cols-[80px_1fr_100px_120px_260px] sm:items-center sm:gap-4 sm:px-4 sm:py-3"
        style={{
          backgroundColor: isEven ? "rgba(255,255,255,0.02)" : "transparent",
        }}
      >
        <span className="inline-flex items-center rounded bg-[var(--background)] px-2 py-0.5 font-mono text-xs text-[var(--text-secondary)]">
          {contract.symbol}
        </span>

        <div className="min-w-0">
          <span className="font-semibold text-[var(--text-primary)]">
            {contract.name}
          </span>
          {!contract.live && (
            <span className="ml-2 rounded bg-[var(--warning)] px-1.5 py-0.5 text-[10px] font-medium text-black">
              DELAYED
            </span>
          )}
          <p className="mt-0.5 text-xs text-[var(--text-secondary)] leading-snug">
            {contract.explanation}
          </p>
        </div>

        <span className="text-right text-xl font-bold tabular-nums text-[var(--text-primary)]">
          {formatPrice(contract)}
        </span>

        <div className="text-right">
          <span
            className="text-sm font-semibold tabular-nums"
            style={{ color: changeColor }}
          >
            {formatChange(contract.change, isGold ? 0 : 2)}
          </span>
          <span
            className="ml-1.5 text-xs tabular-nums"
            style={{ color: changeColor }}
          >
            ({formatChange(contract.changePercent, 1)}%)
          </span>
        </div>

        {/* Signal Impact */}
        <div className="text-right">
          <div>
            <span className="text-xs" style={{ color: impact.color }}>
              {impactArrow}
            </span>
            <span
              className="ml-1 text-sm font-semibold tabular-nums"
              style={{ color: impact.color }}
            >
              {impact.range}
            </span>
            {impact.pctRange && (
              <span className="ml-1.5 text-xs" style={{ color: impact.color }}>
                {impact.pctRange}
              </span>
            )}
          </div>
          {impact.rationale && (
            <p className="text-[11px] text-[var(--text-secondary)] leading-tight mt-1">
              {impact.rationale}
            </p>
          )}
        </div>
      </div>

      {/* Mobile card */}
      <div
        className="flex flex-col gap-2 px-4 py-3 sm:hidden"
        style={{
          backgroundColor: isEven ? "rgba(255,255,255,0.02)" : "transparent",
        }}
      >
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded bg-[var(--background)] px-2 py-0.5 font-mono text-xs text-[var(--text-secondary)]">
            {contract.symbol}
          </span>
          <span className="font-semibold text-[var(--text-primary)]">
            {contract.name}
          </span>
          {!contract.live && (
            <span className="rounded bg-[var(--warning)] px-1.5 py-0.5 text-[10px] font-medium text-black">
              DELAYED
            </span>
          )}
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold tabular-nums text-[var(--text-primary)]">
            {formatPrice(contract)}
          </span>
          <div>
            <span
              className="text-sm font-semibold tabular-nums"
              style={{ color: changeColor }}
            >
              {formatChange(contract.change, isGold ? 0 : 2)}
            </span>
            <span
              className="ml-1.5 text-xs tabular-nums"
              style={{ color: changeColor }}
            >
              ({formatChange(contract.changePercent, 1)}%)
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[var(--text-secondary)] leading-snug flex-1">
              {contract.explanation}
            </p>
            <div className="ml-3 text-right shrink-0">
              <span className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">Impact </span>
              <span className="text-xs" style={{ color: impact.color }}>
                {impactArrow}
              </span>
              <span
                className="ml-1 text-sm font-semibold tabular-nums"
                style={{ color: impact.color }}
              >
                {impact.range}
              </span>
              {impact.pctRange && (
                <span className="ml-1 text-xs" style={{ color: impact.color }}>
                  {impact.pctRange}
                </span>
              )}
            </div>
          </div>
          {impact.rationale && (
            <p className="text-[11px] text-[var(--text-secondary)] leading-tight">
              {impact.rationale}
            </p>
          )}
        </div>
      </div>
    </>
  );
}

export default function FuturesDesk({ data, signalData }: FuturesDeskProps) {
  return (
    <section className="mt-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">
          Energy Futures Desk
        </h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Current prices &amp; projected signal impact based on Hormuz disruption severity
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card)]">
        {/* Desktop header */}
        <div className="hidden border-b border-[var(--card-border)] px-4 py-2 sm:grid sm:grid-cols-[80px_1fr_100px_120px_260px] sm:gap-4">
          <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
            Ticker
          </span>
          <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
            Contract
          </span>
          <span className="text-right text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
            Price
          </span>
          <span className="text-right text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
            Change
          </span>
          <span className="text-right text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
            Signal Impact
          </span>
        </div>

        <div className="divide-y divide-[var(--card-border)]">
          {data.contracts.map((contract, index) => (
            <ContractRow
              key={contract.symbol}
              contract={contract}
              isEven={index % 2 === 0}
              impact={getSignalImpact(contract, signalData)}
            />
          ))}
        </div>

        <div className="border-t border-[var(--card-border)] px-4 py-2 flex items-center justify-between">
          <p className="text-xs text-[var(--text-secondary)]">
            Prices via Yahoo Finance. Signal impact projections based on supply gap ({signalData.timeline.currentGapMbd} → {signalData.timeline.projectedGapMbd} mb/d).
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            Snapshot:{" "}
            {new Date(data.timestamp).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
              timeZoneName: "short",
            })}
          </p>
        </div>
      </div>
    </section>
  );
}
