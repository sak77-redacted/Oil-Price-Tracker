import type { FuturesContract, FuturesData, CrackSpreadData, ForwardCurveData, ForwardPoint } from "./types";

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

/**
 * Fetch a single price from Yahoo Finance by symbol.
 * Returns { price, previousClose } or falls back to a default.
 */
async function fetchSinglePrice(
  symbol: string,
  fallback: number = 0,
): Promise<{ price: number; previousClose: number }> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2d`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; HormuzTracker/1.0)",
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return { price: fallback, previousClose: fallback };
    }

    const data = await response.json();
    const meta = data?.chart?.result?.[0]?.meta;
    const price = meta?.regularMarketPrice ?? meta?.previousClose;
    const previousClose: number =
      meta?.chartPreviousClose ?? meta?.previousClose ?? fallback;

    if (typeof price !== "number" || price <= 0) {
      return { price: fallback, previousClose: fallback };
    }

    return {
      price: Math.round(price * 100) / 100,
      previousClose: Math.round(previousClose * 100) / 100,
    };
  } catch {
    return { price: fallback, previousClose: fallback };
  }
}

/**
 * Calculate crack spreads from CL, RB, and HO futures.
 * Gasoline crack = (RBOB $/gal * 42) - WTI $/bbl
 * Heating oil crack = (HO $/gal * 42) - WTI $/bbl
 * Never throws -- always returns valid CrackSpreadData.
 */
export async function fetchCrackSpreads(): Promise<CrackSpreadData> {
  const FALLBACK_CL = 108;
  const FALLBACK_RB = 3.25;
  const FALLBACK_HO = 3.8;

  try {
    const [cl, rb, ho] = await Promise.all([
      fetchSinglePrice("CL=F", FALLBACK_CL),
      fetchSinglePrice("RB=F", FALLBACK_RB),
      fetchSinglePrice("HO=F", FALLBACK_HO),
    ]);

    const gasolineCrack = Math.round((rb.price * 42 - cl.price) * 100) / 100;
    const heatingOilCrack = Math.round((ho.price * 42 - cl.price) * 100) / 100;

    // Calculate previous day cracks for change
    const prevGasolineCrack =
      Math.round((rb.previousClose * 42 - cl.previousClose) * 100) / 100;
    const prevHeatingOilCrack =
      Math.round((ho.previousClose * 42 - cl.previousClose) * 100) / 100;

    return {
      gasolineCrack,
      heatingOilCrack,
      gasolineCrackChange:
        Math.round((gasolineCrack - prevGasolineCrack) * 100) / 100,
      heatingOilCrackChange:
        Math.round((heatingOilCrack - prevHeatingOilCrack) * 100) / 100,
      timestamp: new Date().toISOString(),
    };
  } catch {
    // Fallback crack spreads based on typical crisis-era values
    return {
      gasolineCrack: 28.5,
      heatingOilCrack: 51.6,
      gasolineCrackChange: 0,
      heatingOilCrackChange: 0,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Fetch forward curve for Brent crude.
 * Uses current prompt price + simulated forward structure based on market-implied
 * backwardation from Sparta research. Yahoo forward month tickers are unreliable
 * on free tier, so we model the curve from the prompt price.
 * Never throws -- always returns valid ForwardCurveData.
 */
export async function fetchForwardCurve(): Promise<ForwardCurveData> {
  const FALLBACK_BRENT = 112;

  try {
    const prompt = await fetchSinglePrice("BZ=F", FALLBACK_BRENT);

    // Simulate forward curve based on current market structure
    // Sparta research: prompt at crisis premium, forwards pricing resolution
    // April is elevated, May-Sep progressively lower (backwardation)
    const months = [
      "Apr 26",
      "May 26",
      "Jun 26",
      "Jul 26",
      "Aug 26",
      "Sep 26",
      "Oct 26",
      "Nov 26",
      "Dec 26",
    ];
    const discounts = [0, -3.5, -8.2, -12.5, -15.8, -18.0, -19.5, -20.2, -20.8];

    const curve: ForwardPoint[] = months.map((month, i) => ({
      month,
      price: Math.round((prompt.price + discounts[i]) * 100) / 100,
      diffFromPrompt: discounts[i],
    }));

    const lastDiscount = discounts[discounts.length - 1];
    const structure: ForwardCurveData["structure"] =
      lastDiscount < -5
        ? "backwardation"
        : lastDiscount > 5
          ? "contango"
          : "flat";

    return {
      contract: "Brent Crude",
      symbol: "BZ=F",
      promptPrice: prompt.price,
      curve,
      structure,
      timestamp: new Date().toISOString(),
    };
  } catch {
    // Full fallback
    const fallbackPrice = FALLBACK_BRENT;
    const months = [
      "Apr 26",
      "May 26",
      "Jun 26",
      "Jul 26",
      "Aug 26",
      "Sep 26",
      "Oct 26",
      "Nov 26",
      "Dec 26",
    ];
    const discounts = [0, -3.5, -8.2, -12.5, -15.8, -18.0, -19.5, -20.2, -20.8];

    return {
      contract: "Brent Crude",
      symbol: "BZ=F",
      promptPrice: fallbackPrice,
      curve: months.map((month, i) => ({
        month,
        price: Math.round((fallbackPrice + discounts[i]) * 100) / 100,
        diffFromPrompt: discounts[i],
      })),
      structure: "backwardation",
      timestamp: new Date().toISOString(),
    };
  }
}
