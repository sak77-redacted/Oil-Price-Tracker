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

/**
 * Scrape hormuzstraitmonitor.com for latest signal data.
 * Cached for 24h via unstable_cache. Cron job busts cache daily.
 */
const getScrapedOverrides = unstable_cache(
  async (): Promise<Record<string, unknown>> => {
    try {
      const response = await fetch("https://hormuzstraitmonitor.com", {
        headers: {
          "User-Agent":
            "HormuzSignalTracker/1.0 (private research dashboard)",
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) return {};

      const html = await response.text();
      const results: Record<string, unknown> = {};

      // Parse insurance premium
      const insuranceMatch = html.match(
        /[Ww]ar\s*risk\s*premium[^]*?(\d+\.?\d*)\s*%/i,
      );
      if (insuranceMatch) {
        const premium = parseFloat(insuranceMatch[1]);
        if (premium > 0 && premium < 50) {
          results.insurance = {
            current: premium,
            lastUpdated: new Date().toISOString(),
          };
        }
      }

      // Parse ship transit count
      const shipsMatch =
        html.match(/(\d+)\s*(?:ships?\s*transiting|transiting)/i) ||
        html.match(/transits?\s*\(?24h\)?[^]*?(\d+)\s*ships?/i) ||
        html.match(/(\d+)\s*(?:daily\s*)?transits?/i);
      if (shipsMatch) {
        const count = parseInt(shipsMatch[1], 10);
        if (count >= 0 && count < 200) {
          results.shipTransit = {
            dailyCount: count,
            lastUpdated: new Date().toISOString(),
          };
        }
      }

      // Parse Brent crude price if present
      const brentMatch =
        html.match(
          /Brent\s*(?:Crude)?\s*(?:Oil)?\s*\$\s*(\d+\.?\d*)/i,
        ) || html.match(/\$\s*(\d+\.?\d*)[^]*?Brent/i);
      if (brentMatch) {
        const price = parseFloat(brentMatch[1]);
        if (price > 30 && price < 300) {
          results.oilSpread = {
            brent: price,
            lastUpdated: new Date().toISOString(),
          };
        }
      }

      // Parse strait status
      const statusMatch = html.match(
        /strait\s*(?:is\s*)?(?:currently\s*)?(open|closed|restricted|blocked)/i,
      );
      if (statusMatch) {
        results.straitStatus = {
          status: statusMatch[1].toLowerCase(),
          lastUpdated: new Date().toISOString(),
        };
      }

      return results;
    } catch {
      // Scraping failed — return empty, fall back to static defaults
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
