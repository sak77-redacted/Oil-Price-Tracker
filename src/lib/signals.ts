import type { ExtendedSignalData } from "./types";
import { unstable_cache } from "next/cache";
import defaultSignals from "@/data/signals.json";

function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>,
): T {
  const result = { ...target };
  for (const key of Object.keys(source) as (keyof T)[]) {
    const srcVal = source[key];
    const tgtVal = target[key];
    if (
      srcVal &&
      typeof srcVal === "object" &&
      !Array.isArray(srcVal) &&
      tgtVal &&
      typeof tgtVal === "object" &&
      !Array.isArray(tgtVal)
    ) {
      (result as Record<string, unknown>)[key as string] = deepMerge(
        tgtVal as Record<string, unknown>,
        srcVal as Record<string, unknown>,
      );
    } else if (srcVal !== undefined) {
      (result as Record<string, unknown>)[key as string] = srcVal;
    }
  }
  return result;
}

/* ------------------------------------------------------------------ */
/*  Scraping infrastructure                                           */
/* ------------------------------------------------------------------ */

interface ScrapedSignals {
  insurance?: { current: number; lastUpdated: string };
  shipTransit?: { dailyCount: number; lastUpdated: string };
  oilSpread?: { brent: number; lastUpdated: string };
  straitStatus?: { status: string; lastUpdated: string };
}

const FETCH_TIMEOUT = 5000;
const FETCH_HEADERS = {
  "User-Agent": "HormuzSignalTracker/1.0 (private research dashboard)",
};

/** Safely fetch a URL and return its text, or null on any failure. */
async function safeFetch(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: FETCH_HEADERS,
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Regex pattern banks                                               */
/* ------------------------------------------------------------------ */

const insurancePatterns: RegExp[] = [
  /[Ww]ar\s*risk\s*premium[^]*?(\d+\.?\d*)\s*%/i,
  /insurance\s*(?:premium|rate|cost)[^]*?(\d+\.?\d*)\s*%/i,
  /(\d+\.?\d*)\s*%\s*(?:of\s*)?hull\s*value/i,
  /war\s*risk[^]*?(\d+\.?\d*)\s*percent/i,
  /premium[^]*?(\d+\.?\d*)\s*%[^]*?hull/i,
];

const transitPatterns: RegExp[] = [
  /(\d+)\s*(?:ships?\s*transiting|transiting)/i,
  /transits?\s*\(?24h\)?[^]*?(\d+)\s*ships?/i,
  /(\d+)\s*(?:daily\s*)?transits?/i,
  /(\d+)\s*vessels?\s*(?:per\s*day|daily|through)/i,
  /daily\s*(?:average|count)[^]*?(\d+)/i,
];

const brentPatterns: RegExp[] = [
  /Brent\s*(?:Crude)?\s*(?:Oil)?\s*\$\s*(\d+\.?\d*)/i,
  /\$\s*(\d+\.?\d*)[^]*?Brent/i,
  /Brent[^]*?(\d+\.?\d*)\s*(?:USD|dollars?)/i,
];

const straitStatusPatterns: RegExp[] = [
  /strait\s*(?:is\s*)?(?:currently\s*)?(open|closed|restricted|blocked)/i,
];

/** Try each regex in order against `text`, return first valid match group 1. */
function firstMatch(text: string, patterns: RegExp[]): string | null {
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1]) return m[1];
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  Per-source scrapers                                               */
/* ------------------------------------------------------------------ */

/**
 * Source 1 (primary): hormuzstraitmonitor.com
 * Parses insurance, transits, brent, and strait status.
 */
async function scrapeHormuzMonitor(): Promise<ScrapedSignals> {
  const html = await safeFetch("https://hormuzstraitmonitor.com");
  if (!html) return {};

  const results: ScrapedSignals = {};
  const now = new Date().toISOString();

  // Insurance premium
  const insVal = firstMatch(html, insurancePatterns);
  if (insVal) {
    const premium = parseFloat(insVal);
    if (premium > 0 && premium < 50) {
      results.insurance = { current: premium, lastUpdated: now };
    }
  }

  // Ship transit count
  const transitVal = firstMatch(html, transitPatterns);
  if (transitVal) {
    const count = parseInt(transitVal, 10);
    if (count >= 0 && count < 200) {
      results.shipTransit = { dailyCount: count, lastUpdated: now };
    }
  }

  // Brent crude price (backup — Yahoo Finance is the primary source)
  const brentVal = firstMatch(html, brentPatterns);
  if (brentVal) {
    const price = parseFloat(brentVal);
    if (price > 30 && price < 300) {
      results.oilSpread = { brent: price, lastUpdated: now };
    }
  }

  // Strait status
  const statusVal = firstMatch(html, straitStatusPatterns);
  if (statusVal) {
    results.straitStatus = { status: statusVal.toLowerCase(), lastUpdated: now };
  }

  return results;
}

/**
 * Source 2: gCaptain — maritime news.
 * Scrapes tag pages for insurance premiums and ship transit data.
 */
async function scrapeGCaptain(): Promise<ScrapedSignals> {
  const [insurancePage, transitPage] = await Promise.all([
    safeFetch("https://gcaptain.com/tag/war-risk-insurance/"),
    safeFetch("https://gcaptain.com/tag/strait-of-hormuz/"),
  ]);

  const results: ScrapedSignals = {};
  const now = new Date().toISOString();

  if (insurancePage) {
    const insVal = firstMatch(insurancePage, insurancePatterns);
    if (insVal) {
      const premium = parseFloat(insVal);
      if (premium > 0 && premium < 50) {
        results.insurance = { current: premium, lastUpdated: now };
      }
    }
  }

  if (transitPage) {
    const transitVal = firstMatch(transitPage, transitPatterns);
    if (transitVal) {
      const count = parseInt(transitVal, 10);
      if (count >= 0 && count < 200) {
        results.shipTransit = { dailyCount: count, lastUpdated: now };
      }
    }
  }

  return results;
}

/**
 * Source 3: Google News RSS — headline text mining.
 * Searches for recent headlines containing relevant signal numbers.
 */
async function scrapeGoogleNewsRSS(): Promise<ScrapedSignals> {
  const insuranceQuery = encodeURIComponent(
    '"war risk premium" Hormuz percent',
  );
  const transitQuery = encodeURIComponent(
    '"Hormuz" "ships" "transit" daily',
  );

  const [insuranceFeed, transitFeed] = await Promise.all([
    safeFetch(
      `https://news.google.com/rss/search?q=${insuranceQuery}&hl=en-US&gl=US&ceid=US:en`,
    ),
    safeFetch(
      `https://news.google.com/rss/search?q=${transitQuery}&hl=en-US&gl=US&ceid=US:en`,
    ),
  ]);

  const results: ScrapedSignals = {};
  const now = new Date().toISOString();

  if (insuranceFeed) {
    const insVal = firstMatch(insuranceFeed, insurancePatterns);
    if (insVal) {
      const premium = parseFloat(insVal);
      if (premium > 0 && premium < 50) {
        results.insurance = { current: premium, lastUpdated: now };
      }
    }
  }

  if (transitFeed) {
    const transitVal = firstMatch(transitFeed, transitPatterns);
    if (transitVal) {
      const count = parseInt(transitVal, 10);
      if (count >= 0 && count < 200) {
        results.shipTransit = { dailyCount: count, lastUpdated: now };
      }
    }
  }

  return results;
}

/* ------------------------------------------------------------------ */
/*  Merge scraped results with priority ordering                      */
/* ------------------------------------------------------------------ */

/**
 * Merge an array of ScrapedSignals objects, first non-undefined value wins.
 * `sources` should be ordered by priority (highest-priority first).
 */
function mergeScrapedResults(sources: ScrapedSignals[]): ScrapedSignals {
  const merged: ScrapedSignals = {};
  for (const src of sources) {
    if (!merged.insurance && src.insurance) merged.insurance = src.insurance;
    if (!merged.shipTransit && src.shipTransit)
      merged.shipTransit = src.shipTransit;
    if (!merged.oilSpread && src.oilSpread) merged.oilSpread = src.oilSpread;
    if (!merged.straitStatus && src.straitStatus)
      merged.straitStatus = src.straitStatus;
  }
  return merged;
}

/* ------------------------------------------------------------------ */
/*  Cached entry point                                                */
/* ------------------------------------------------------------------ */

/**
 * Scrape multiple sources for latest signal data.
 * Cached for 24h via unstable_cache. Cron job busts cache daily.
 *
 * Priority order:
 *  1. hormuzstraitmonitor.com (most specific)
 *  2. gCaptain tag pages (maritime news)
 *  3. Google News RSS (headline text mining)
 *
 * All sources are fetched in parallel. Each has a 5s timeout.
 * Any source that fails is silently ignored.
 */
const getScrapedOverrides = unstable_cache(
  async (): Promise<Record<string, unknown>> => {
    try {
      const settled = await Promise.allSettled([
        scrapeHormuzMonitor(),
        scrapeGCaptain(),
        scrapeGoogleNewsRSS(),
      ]);

      // Extract fulfilled values in priority order
      const sources: ScrapedSignals[] = settled
        .filter(
          (r): r is PromiseFulfilledResult<ScrapedSignals> =>
            r.status === "fulfilled",
        )
        .map((r) => r.value);

      const merged = mergeScrapedResults(sources);
      return merged as unknown as Record<string, unknown>;
    } catch {
      // Entire scraping pipeline failed — fall back to static defaults
      return {};
    }
  },
  ["signal-overrides"],
  { revalidate: 86400, tags: ["signal-overrides"] },
);

export async function getSignalData(): Promise<ExtendedSignalData> {
  const override = await getScrapedOverrides();

  if (Object.keys(override).length > 0) {
    return deepMerge(
      defaultSignals as unknown as Record<string, unknown>,
      override,
    ) as unknown as ExtendedSignalData;
  }

  return defaultSignals as ExtendedSignalData;
}
