import type { FuturesContract, FuturesData } from "./types";

interface ContractConfig {
  symbol: string;
  name: string;
  explanation: string;
  fallbackPrice: number;
}

const CONTRACTS: ContractConfig[] = [
  {
    symbol: "CL=F",
    name: "WTI Crude Oil",
    explanation:
      "The US oil benchmark. Front-month WTI futures \u2014 what American refiners pay.",
    fallbackPrice: 108,
  },
  {
    symbol: "BZ=F",
    name: "Brent Crude",
    explanation:
      "The global oil benchmark. What most of the world prices crude against.",
    fallbackPrice: 112,
  },
  {
    symbol: "RB=F",
    name: "RBOB Gasoline",
    explanation:
      "Gasoline futures. Tracks US pump prices \u2014 direct consumer impact signal.",
    fallbackPrice: 3.25,
  },
  {
    symbol: "HO=F",
    name: "Heating Oil",
    explanation:
      "Heating oil / diesel proxy. Drives freight and logistics costs worldwide.",
    fallbackPrice: 3.8,
  },
  {
    symbol: "NG=F",
    name: "Natural Gas",
    explanation:
      "Henry Hub natural gas. Less directly Hormuz-impacted, but watch for LNG substitution effects.",
    fallbackPrice: 4.5,
  },
  {
    symbol: "GC=F",
    name: "Gold",
    explanation:
      "Gold \u2014 the fear trade. Rising gold + rising oil = markets pricing sustained crisis.",
    fallbackPrice: 2950,
  },
];

/**
 * Fetch a single contract from Yahoo Finance chart API.
 * Uses the same proven pattern as oil-api.ts.
 */
async function fetchContract(
  config: ContractConfig,
): Promise<FuturesContract> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(config.symbol)}?interval=1d&range=2d`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; HormuzTracker/1.0)",
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return buildFallback(config);
    }

    const data = await response.json();
    const meta = data?.chart?.result?.[0]?.meta;
    const price =
      meta?.regularMarketPrice ?? meta?.previousClose;

    if (typeof price !== "number" || price <= 0) {
      return buildFallback(config);
    }

    const previousClose: number | undefined = meta?.chartPreviousClose ?? meta?.previousClose;
    let change = 0;
    let changePercent = 0;

    if (typeof previousClose === "number" && previousClose > 0) {
      change = price - previousClose;
      changePercent = (change / previousClose) * 100;
    }

    return {
      symbol: config.symbol,
      name: config.name,
      price: Math.round(price * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      explanation: config.explanation,
      live: true,
    };
  } catch {
    return buildFallback(config);
  }
}

function buildFallback(config: ContractConfig): FuturesContract {
  return {
    symbol: config.symbol,
    name: config.name,
    price: config.fallbackPrice,
    change: 0,
    changePercent: 0,
    explanation: config.explanation,
    live: false,
  };
}

/**
 * Fetch all commodity futures contracts in parallel.
 * Never throws -- always returns valid FuturesData.
 */
export async function fetchFuturesData(): Promise<FuturesData> {
  const results = await Promise.allSettled(
    CONTRACTS.map((config) => fetchContract(config)),
  );

  const contracts: FuturesContract[] = results.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    }
    return buildFallback(CONTRACTS[index]);
  });

  return {
    contracts,
    timestamp: new Date().toISOString(),
  };
}
