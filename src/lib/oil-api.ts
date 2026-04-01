import { readFile } from "fs/promises";
import { join } from "path";

export interface OilPriceResult {
  price: number;
  source: string;
  live: boolean;
  timestamp: string;
}

const DEFAULT_BRENT_PRICE = 112;

/**
 * Read Brent price from signals.json fallback.
 * Returns the hardcoded default if signals.json doesn't exist or is malformed.
 */
async function getFallbackPrice(): Promise<OilPriceResult> {
  try {
    const filePath = join(process.cwd(), "src", "data", "signals.json");
    const raw = await readFile(filePath, "utf-8");
    const data = JSON.parse(raw);
    const brent = data?.oilSpread?.brent;
    if (typeof brent === "number" && brent > 0) {
      return {
        price: brent,
        source: "signals.json (static)",
        live: false,
        timestamp: new Date().toISOString(),
      };
    }
  } catch {
    // signals.json doesn't exist or is malformed — use hardcoded default
  }

  return {
    price: DEFAULT_BRENT_PRICE,
    source: "hardcoded default",
    live: false,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Attempt to fetch Brent crude price from Yahoo Finance's chart API.
 * Uses the BZ=F (Brent Crude Futures) ticker.
 */
async function fetchFromYahooFinance(): Promise<OilPriceResult | null> {
  try {
    const url =
      "https://query1.finance.yahoo.com/v8/finance/chart/BZ=F?interval=1d&range=1d";
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; HormuzTracker/1.0)",
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const price =
      data?.chart?.result?.[0]?.meta?.regularMarketPrice ??
      data?.chart?.result?.[0]?.meta?.previousClose;

    if (typeof price === "number" && price > 0) {
      return {
        price: Math.round(price * 100) / 100,
        source: "Yahoo Finance (BZ=F)",
        live: true,
        timestamp: new Date().toISOString(),
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Attempt to fetch Brent crude price from the Oil Price API.
 * Requires OIL_API_KEY environment variable. Skipped if not set.
 */
async function fetchFromOilPriceApi(): Promise<OilPriceResult | null> {
  const apiKey = process.env.OIL_API_KEY;
  if (!apiKey) return null;

  try {
    const url = "https://api.oilpriceapi.com/v1/prices/latest";
    const response = await fetch(url, {
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const price = data?.data?.price;

    if (typeof price === "number" && price > 0) {
      return {
        price: Math.round(price * 100) / 100,
        source: "OilPriceAPI",
        live: true,
        timestamp: new Date().toISOString(),
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch Brent crude oil price.
 *
 * Tries live sources in order, falls back to static data.
 * Never throws -- always returns a valid OilPriceResult.
 */
export async function fetchBrentPrice(): Promise<OilPriceResult> {
  // Try live sources in priority order
  const liveResult =
    (await fetchFromYahooFinance()) ?? (await fetchFromOilPriceApi());

  if (liveResult) return liveResult;

  // All live sources failed — return static fallback
  return getFallbackPrice();
}
