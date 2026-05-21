"use client";

import { useState } from "react";

import type { CommodityRow } from "@/lib/commodities-types";
import SugarCard from "@/components/sugar/SugarCard";

interface Props {
  rows: CommodityRow[];
}

type SortKey = "name" | "sector" | "currentPrice" | "ytdPct" | "fiveDayChangePct";
type SortDir = "asc" | "desc";

function formatPrice(price: number, unit: string): string {
  const decimals = price >= 100 ? 2 : 3;
  return `${price.toFixed(decimals)} ${unit}`;
}

export default function LivePricesTable({ rows }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("ytdPct");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir(key === "name" || key === "sector" ? "asc" : "desc");
    }
  }

  const sorted = [...rows].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    }
    const aStr = String(aVal);
    const bStr = String(bVal);
    return sortDir === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
  });

  const arrow = (k: SortKey) =>
    sortKey === k ? (sortDir === "desc" ? " ▼" : " ▲") : "";

  return (
    <SugarCard
      title="Live Prices Table"
      subtitle="All 17 contracts · Click headers to sort"
      source="Yahoo Finance front-month futures"
    >
      <div className="-mx-2 overflow-x-auto">
        <table className="w-full text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-left text-[10px] uppercase tracking-[0.14em] text-white/55">
              <Th onClick={() => toggleSort("name")}>Commodity{arrow("name")}</Th>
              <Th onClick={() => toggleSort("sector")} className="hidden sm:table-cell">
                Sector{arrow("sector")}
              </Th>
              <Th onClick={() => toggleSort("currentPrice")} className="text-right">
                Price{arrow("currentPrice")}
              </Th>
              <Th onClick={() => toggleSort("ytdPct")} className="text-right">
                YTD{arrow("ytdPct")}
              </Th>
              <Th onClick={() => toggleSort("fiveDayChangePct")} className="hidden text-right sm:table-cell">
                5d{arrow("fiveDayChangePct")}
              </Th>
              <th className="hidden px-2 py-2 text-right font-mono text-[10px] uppercase tracking-[0.14em] text-white/40 md:table-cell">
                Symbol
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => {
              const ytdPositive = row.ytdPct >= 0;
              const fivePositive = row.fiveDayChangePct >= 0;
              return (
                <tr
                  key={row.symbol}
                  className="border-b border-zinc-900/60 transition-colors hover:bg-zinc-900/40"
                >
                  <td className="px-2 py-2">
                    <div className="font-semibold text-white">{row.name}</div>
                    <div className="text-[10px] text-white/40 sm:hidden">
                      {row.sector}
                    </div>
                  </td>
                  <td className="hidden px-2 py-2 text-white/60 sm:table-cell">
                    {row.sector}
                  </td>
                  <td className="px-2 py-2 text-right font-mono tabular-nums text-white">
                    {formatPrice(row.currentPrice, row.priceUnit)}
                  </td>
                  <td
                    className={`px-2 py-2 text-right font-mono font-bold tabular-nums ${
                      ytdPositive ? "text-emerald-300" : "text-red-300"
                    }`}
                  >
                    {ytdPositive ? "+" : ""}
                    {row.ytdPct.toFixed(1)}%
                  </td>
                  <td
                    className={`hidden px-2 py-2 text-right font-mono tabular-nums sm:table-cell ${
                      fivePositive ? "text-emerald-300/80" : "text-red-300/80"
                    }`}
                  >
                    {fivePositive ? "+" : ""}
                    {row.fiveDayChangePct.toFixed(2)}%
                  </td>
                  <td className="hidden px-2 py-2 text-right font-mono text-[10px] text-white/35 md:table-cell">
                    {row.symbol}
                    {!row.live && (
                      <span
                        className="ml-1 text-amber-300/70"
                        title="Fallback value"
                      >
                        ◯
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </SugarCard>
  );
}

function Th({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <th
      onClick={onClick}
      className={`cursor-pointer select-none px-2 py-2 font-semibold transition-colors hover:text-white ${className}`}
    >
      {children}
    </th>
  );
}
