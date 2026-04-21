import type { FuturesContract, FuturesData, CrackSpreadData, ForwardCurveData, ForwardPoint, WTIBrentSpreadData, MarketIndex, MarketIndicesData } from "./types";

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
    fallbackPrice: 87,
  },
  {
    symbol: "BZ=F",
    name: "Brent Crude",
    explanation:
      "The global oil benchmark. What most of the world prices crude against.",
    fallbackPrice: 91,
  },
  {
    symbol: "RB=F",
    name: "RBOB Gasoline",
    explanation:
      "Gasoline futures. Tracks US pump prices \u2014 direct consumer impact signal.",
    fallbackPrice: 3.05,
  },
  {
    symbol: "HO=F",
    name: "Heating Oil",
    explanation:
      "Heating oil / diesel proxy. Drives freight and logistics costs worldwide.",
    fallbackPrice: 3.50,
  },
  {
    symbol: "NG=F",
    name: "Natural Gas",
    explanation:
      "Henry Hub natural gas. Less directly Hormuz-impacted, but watch for LNG substitution effects.",
    fallbackPrice: 4.5,
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
  const FALLBACK_CL = 87;
  const FALLBACK_RB = 3.05;
  const FALLBACK_HO = 3.50;

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
 * Tries to fetch real forward month prices from Yahoo Finance using individual
 * month contract tickers (e.g. BZK26.NYM for May 2026). Falls back to simulated
 * offsets from the prompt price for any month where Yahoo doesn't return data.
 * Never throws -- always returns valid ForwardCurveData.
 */
export async function fetchForwardCurve(): Promise<ForwardCurveData> {
  const FALLBACK_BRENT = 91;
  const MONTH_CODES = ["F", "G", "H", "J", "K", "M", "N", "Q", "U", "V", "X", "Z"];
  const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const FALLBACK_DISCOUNTS = [0, -3.5, -8.2, -12.5, -15.8, -18.0, -19.5, -20.2, -20.8];

  try {
    // Use the same delivery month logic as WTI-Brent spread (getCurrentDeliveryMonth)
    const now = new Date();
    const day = now.getDate();
    const currentMonth = now.getMonth();

    // Starting month index (0-indexed) — same as getCurrentDeliveryMonth logic
    let startMonthIdx = day < 20 ? currentMonth + 1 : currentMonth + 2;
    let startYear = now.getFullYear();
    if (startMonthIdx >= 12) {
      startMonthIdx -= 12;
      startYear++;
    }

    // Build 9 consecutive month tickers starting from the delivery month
    const months: { ticker: string; label: string }[] = [];
    for (let i = 0; i < 9; i++) {
      const m = (startMonthIdx + i) % 12;
      const y = startYear + Math.floor((startMonthIdx + i) / 12);
      const code = MONTH_CODES[m];
      const yearSuffix = String(y).slice(-2);
      months.push({
        ticker: `BZ${code}${yearSuffix}.NYM`,
        label: `${MONTH_NAMES[m]} ${yearSuffix}`,
      });
    }

    // Fetch all months in parallel
    const results = await Promise.allSettled(
      months.map((m) => fetchSinglePrice(m.ticker, 0)),
    );

    // Build curve from results
    const curve: ForwardPoint[] = [];
    let promptPrice = 0;
    let liveCount = 0;

    results.forEach((result, i) => {
      let price: number;

      if (result.status === "fulfilled" && result.value.price > 0) {
        const yahooPrice = result.value.price;
        // Simple absolute sanity check — reject obviously garbage data
        if (yahooPrice > 30 && yahooPrice < 300) {
          price = yahooPrice;
          liveCount++;
        } else {
          price = 0; // will use fallback below
        }
      } else {
        price = 0;
      }

      // If no valid price, use fallback offset from prompt (or absolute fallback)
      if (price === 0) {
        if (promptPrice > 0) {
          const discount = FALLBACK_DISCOUNTS[i] ?? FALLBACK_DISCOUNTS[FALLBACK_DISCOUNTS.length - 1];
          price = Math.round((promptPrice + discount) * 100) / 100;
        } else {
          const discount = FALLBACK_DISCOUNTS[i] ?? FALLBACK_DISCOUNTS[FALLBACK_DISCOUNTS.length - 1];
          price = Math.round((FALLBACK_BRENT + discount) * 100) / 100;
        }
      }

      // First month is the prompt
      if (i === 0) {
        promptPrice = price;
      }

      curve.push({
        month: months[i].label,
        price,
        diffFromPrompt: i === 0 ? 0 : Math.round((price - promptPrice) * 100) / 100,
      });
    });

    if (promptPrice === 0) promptPrice = FALLBACK_BRENT;

    const lastPoint = curve[curve.length - 1];
    const lastDiff = lastPoint.diffFromPrompt;
    const structure: ForwardCurveData["structure"] =
      lastDiff < -5 ? "backwardation" : lastDiff > 5 ? "contango" : "flat";

    return {
      contract: "Brent Crude",
      symbol: months[0].ticker,
      promptPrice,
      curve,
      structure,
      liveMonths: liveCount,
      timestamp: new Date().toISOString(),
    };
  } catch {
    // Full fallback
    const now = new Date();
    const monthNames: string[] = [];
    for (let i = 0; i < 9; i++) {
      const m = (now.getMonth() + 1 + i) % 12;
      const y = now.getFullYear() + Math.floor((now.getMonth() + 1 + i) / 12);
      monthNames.push(`${MONTH_NAMES[m]} ${String(y).slice(-2)}`);
    }

    return {
      contract: "Brent Crude",
      symbol: "BZ=F",
      promptPrice: FALLBACK_BRENT,
      curve: monthNames.map((month, i) => ({
        month,
        price: Math.round((FALLBACK_BRENT + FALLBACK_DISCOUNTS[i]) * 100) / 100,
        diffFromPrompt: FALLBACK_DISCOUNTS[i],
      })),
      structure: "backwardation",
      timestamp: new Date().toISOString(),
    };
  }
}

const FUTURES_MONTH_CODES = ['F', 'G', 'H', 'J', 'K', 'M', 'N', 'Q', 'U', 'V', 'X', 'Z'];
const FUTURES_MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Determine the current WTI front-month delivery month.
 * WTI (CL) front month rolls around the 20th of the prior month.
 * E.g., on April 5, CL=F is the May contract. After ~April 20, it rolls to June.
 */
function getCurrentDeliveryMonth(): { code: string; year: string; label: string } {
  const now = new Date();
  const day = now.getDate();
  const month = now.getMonth(); // 0-indexed

  // Before ~20th: front month = next month. After ~20th: front month = month+2
  let deliveryMonth = day < 20 ? month + 1 : month + 2;
  let deliveryYear = now.getFullYear();

  if (deliveryMonth >= 12) {
    deliveryMonth -= 12;
    deliveryYear++;
  }

  return {
    code: FUTURES_MONTH_CODES[deliveryMonth],
    year: String(deliveryYear).slice(-2),
    label: `${FUTURES_MONTH_NAMES[deliveryMonth]} ${String(deliveryYear).slice(-2)}`,
  };
}

/**
 * Fetch WTI-Brent spread using same-maturity contracts.
 * Jun Goh (Sparta): spread collapsed from $15 to $1.50. Fair value is $4-5
 * based on TD25 freight economics (cost to ship WTI to Europe).
 * When spread < fair value, WTI is overvalued relative to Brent (or Brent
 * is not carrying the Hormuz premium it should).
 *
 * IMPORTANT: CL=F and BZ=F can reference DIFFERENT delivery months during
 * roll periods (e.g. WTI May vs Brent June). In steep backwardation this
 * creates a phantom negative spread. We now dynamically determine the WTI
 * front month and fetch the matching Brent contract for the SAME month.
 * Never throws -- always returns valid WTIBrentSpreadData.
 */
export async function fetchWTIBrentSpread(): Promise<WTIBrentSpreadData> {
  const FALLBACK_CL = 87;
  const FALLBACK_BZ = 91;
  const FAIR_VALUE = 4.5; // TD25 freight economics

  try {
    const month = getCurrentDeliveryMonth();
    const wtiSymbol = `CL${month.code}${month.year}.NYM`;
    const brentSymbol = `BZ${month.code}${month.year}.NYM`;

    const [cl, bz] = await Promise.all([
      fetchSinglePrice(wtiSymbol, FALLBACK_CL),
      fetchSinglePrice(brentSymbol, FALLBACK_BZ),
    ]);

    // If specific month tickers fail, both will return fallback — detect this
    const live = cl.price !== FALLBACK_CL || bz.price !== FALLBACK_BZ;

    const spread = Math.round((bz.price - cl.price) * 100) / 100;
    const previousSpread =
      Math.round((bz.previousClose - cl.previousClose) * 100) / 100;

    return {
      wtiPrice: cl.price,
      brentPrice: bz.price,
      spread,
      fairValue: FAIR_VALUE,
      previousSpread,
      live,
      contractMonth: month.label,
      timestamp: new Date().toISOString(),
    };
  } catch {
    return {
      wtiPrice: FALLBACK_CL,
      brentPrice: FALLBACK_BZ,
      spread: FALLBACK_BZ - FALLBACK_CL,
      fairValue: FAIR_VALUE,
      previousSpread: FALLBACK_BZ - FALLBACK_CL,
      live: false,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Market indices config for cross-asset context.
 */
interface IndexConfig {
  symbol: string;
  name: string;
  description: string;
  fallbackPrice: number;
}

const MARKET_INDICES: IndexConfig[] = [
  {
    symbol: "GC=F",
    name: "Gold",
    description:
      "Safe haven \u2014 rising gold + rising oil = markets pricing sustained crisis",
    fallbackPrice: 2950,
  },
  {
    symbol: "BTC=F",
    name: "Bitcoin Futures",
    description:
      "Risk appetite barometer \u2014 crypto sells off in crisis, or rallies as inflation hedge",
    fallbackPrice: 84000,
  },
  {
    symbol: "ES=F",
    name: "S&P 500 Futures",
    description:
      "Broad US equity market \u2014 war premium drags on equities",
    fallbackPrice: 5200,
  },
  {
    symbol: "^VIX",
    name: "VIX",
    description:
      "Fear index \u2014 spikes when oil shocks threaten recession",
    fallbackPrice: 22,
  },
  {
    symbol: "NQ=F",
    name: "NASDAQ Futures",
    description:
      "Tech-heavy index \u2014 most sensitive to rate expectations from oil-driven inflation",
    fallbackPrice: 16000,
  },
];

/**
 * Fetch market indices (BTC, S&P 500, VIX, NASDAQ) for cross-asset context.
 * Never throws -- always returns valid MarketIndicesData with fallbacks.
 */
export async function fetchMarketIndices(): Promise<MarketIndicesData> {
  const results = await Promise.allSettled(
    MARKET_INDICES.map(async (config): Promise<MarketIndex> => {
      try {
        const { price, previousClose } = await fetchSinglePrice(
          config.symbol,
          config.fallbackPrice,
        );

        let change = 0;
        let changePercent = 0;

        if (previousClose > 0) {
          change = Math.round((price - previousClose) * 100) / 100;
          changePercent =
            Math.round(((price - previousClose) / previousClose) * 10000) / 100;
        }

        const live = price !== config.fallbackPrice;

        return {
          symbol: config.symbol,
          name: config.name,
          price,
          change,
          changePercent,
          description: config.description,
          live,
        };
      } catch {
        return {
          symbol: config.symbol,
          name: config.name,
          price: config.fallbackPrice,
          change: 0,
          changePercent: 0,
          description: config.description,
          live: false,
        };
      }
    }),
  );

  const indices: MarketIndex[] = results.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    }
    return {
      symbol: MARKET_INDICES[index].symbol,
      name: MARKET_INDICES[index].name,
      price: MARKET_INDICES[index].fallbackPrice,
      change: 0,
      changePercent: 0,
      description: MARKET_INDICES[index].description,
      live: false,
    };
  });

  return {
    indices,
    timestamp: new Date().toISOString(),
  };
}

export interface HyperliquidPerpData {
  name: string;
  displayName: string;
  markPx: number;
  oraclePx: number;
  funding: number;       // hourly funding rate as decimal
  fundingAnnualized: number; // annualized for display
  openInterest: number;  // in USD
  volume24h: number;     // in USD
  prevDayPx: number;
  change24h: number;     // percentage
  premium: number;       // mark vs oracle premium
  timestamp: string;
}

export interface HyperliquidData {
  perps: HyperliquidPerpData[];
  timestamp: string;
  live: boolean;
}

/**
 * Fetch oil perpetual futures from Hyperliquid (xyz dex).
 * Free API, no auth. Trades 24/7 — useful when CME is closed on weekends/holidays.
 * Never throws — returns empty data on failure.
 */
export async function fetchHyperliquidPerps(): Promise<HyperliquidData> {
  const OIL_ASSETS = [
    { name: "xyz:CL", displayName: "WTI Crude Perp" },
    { name: "xyz:BRENTOIL", displayName: "Brent Crude Perp" },
  ];

  try {
    const response = await fetch("https://api.hyperliquid.xyz/info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "metaAndAssetCtxs", dex: "xyz" }),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return { perps: [], timestamp: new Date().toISOString(), live: false };
    }

    const data = await response.json();
    const universe = data[0]?.universe ?? [];
    const ctxs = data[1] ?? [];

    const perps: HyperliquidPerpData[] = [];

    for (const target of OIL_ASSETS) {
      const idx = universe.findIndex((a: { name: string }) => a.name === target.name);
      if (idx === -1 || !ctxs[idx]) continue;

      const ctx = ctxs[idx];
      const markPx = parseFloat(ctx.markPx);
      const oraclePx = parseFloat(ctx.oraclePx);
      const prevDayPx = parseFloat(ctx.prevDayPx);
      const funding = parseFloat(ctx.funding);
      const openInterest = parseFloat(ctx.openInterest);
      const volume24h = parseFloat(ctx.dayNtlVlm);
      const premium = parseFloat(ctx.premium);
      const change24h = prevDayPx > 0 ? ((markPx - prevDayPx) / prevDayPx) * 100 : 0;

      perps.push({
        name: target.name,
        displayName: target.displayName,
        markPx: Math.round(markPx * 100) / 100,
        oraclePx: Math.round(oraclePx * 100) / 100,
        funding,
        fundingAnnualized: funding * 24 * 365 * 100, // to percentage
        openInterest: Math.round(openInterest),
        volume24h: Math.round(volume24h),
        prevDayPx: Math.round(prevDayPx * 100) / 100,
        change24h: Math.round(change24h * 100) / 100,
        premium,
        timestamp: new Date().toISOString(),
      });
    }

    return {
      perps,
      timestamp: new Date().toISOString(),
      live: perps.length > 0,
    };
  } catch {
    return { perps: [], timestamp: new Date().toISOString(), live: false };
  }
}
