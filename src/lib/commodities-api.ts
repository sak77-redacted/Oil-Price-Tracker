import type {
  CommodityComplexData,
  CommodityRow,
  CommoditySector,
  SectorSummary,
} from "./commodities-types";

interface CommodityConfig {
  symbol: string;
  name: string;
  sector: CommoditySector;
  priceUnit: string;
  contractSize: number;
  /** Fallback YTD% (from May 12, 2026 source HTML) if Yahoo fails. */
  fallbackYtdPct: number;
  /** Best-guess fallback current price for May 2026 levels. */
  fallbackCurrentPrice: number;
}

/**
 * 17-contract commodity complex. Yahoo Finance front-month futures symbols.
 * Fallback YTD% values mirror the May 12, 2026 source snapshot so the page
 * still renders meaningful data if Yahoo is unavailable.
 */
const COMMODITY_COMPLEX: CommodityConfig[] = [
  // Energy
  { symbol: "RB=F", name: "RBOB Gasoline", sector: "Energy", priceUnit: "$/gal", contractSize: 42000, fallbackYtdPct: 42, fallbackCurrentPrice: 2.95 },
  { symbol: "HO=F", name: "Heating Oil", sector: "Energy", priceUnit: "$/gal", contractSize: 42000, fallbackYtdPct: 38, fallbackCurrentPrice: 3.45 },
  { symbol: "CL=F", name: "WTI Crude", sector: "Energy", priceUnit: "$/bbl", contractSize: 1000, fallbackYtdPct: 36, fallbackCurrentPrice: 95 },
  { symbol: "BZ=F", name: "Brent Crude", sector: "Energy", priceUnit: "$/bbl", contractSize: 1000, fallbackYtdPct: 32, fallbackCurrentPrice: 100 },
  { symbol: "NG=F", name: "Natural Gas", sector: "Energy", priceUnit: "$/MMBtu", contractSize: 10000, fallbackYtdPct: 28, fallbackCurrentPrice: 4.6 },
  // Precious Metals
  { symbol: "SI=F", name: "Silver", sector: "Precious Metals", priceUnit: "$/oz", contractSize: 5000, fallbackYtdPct: 22, fallbackCurrentPrice: 32 },
  { symbol: "GC=F", name: "Gold", sector: "Precious Metals", priceUnit: "$/oz", contractSize: 100, fallbackYtdPct: 19, fallbackCurrentPrice: 3200 },
  { symbol: "PL=F", name: "Platinum", sector: "Precious Metals", priceUnit: "$/oz", contractSize: 50, fallbackYtdPct: 5, fallbackCurrentPrice: 1020 },
  // Industrial Metals
  { symbol: "HG=F", name: "Copper", sector: "Industrial Metals", priceUnit: "$/lb", contractSize: 25000, fallbackYtdPct: 8, fallbackCurrentPrice: 4.45 },
  // Grains
  { symbol: "ZC=F", name: "Corn", sector: "Grains", priceUnit: "¢/bu", contractSize: 5000, fallbackYtdPct: 17, fallbackCurrentPrice: 530 },
  { symbol: "ZS=F", name: "Soybeans", sector: "Grains", priceUnit: "¢/bu", contractSize: 5000, fallbackYtdPct: 13, fallbackCurrentPrice: 1180 },
  { symbol: "ZW=F", name: "Wheat", sector: "Grains", priceUnit: "¢/bu", contractSize: 5000, fallbackYtdPct: 9, fallbackCurrentPrice: 620 },
  // Softs
  { symbol: "SB=F", name: "Sugar", sector: "Softs", priceUnit: "¢/lb", contractSize: 112000, fallbackYtdPct: -7, fallbackCurrentPrice: 15 },
  { symbol: "CT=F", name: "Cotton", sector: "Softs", priceUnit: "¢/lb", contractSize: 50000, fallbackYtdPct: -3, fallbackCurrentPrice: 68 },
  { symbol: "KC=F", name: "Coffee", sector: "Softs", priceUnit: "¢/lb", contractSize: 37500, fallbackYtdPct: -22, fallbackCurrentPrice: 280 },
  { symbol: "CC=F", name: "Cocoa", sector: "Softs", priceUnit: "$/MT", contractSize: 10, fallbackYtdPct: -30, fallbackCurrentPrice: 5500 },
  // Livestock
  { symbol: "LE=F", name: "Live Cattle", sector: "Livestock", priceUnit: "¢/lb", contractSize: 40000, fallbackYtdPct: 2, fallbackCurrentPrice: 192 },
];

const SECTOR_DRIVERS: Record<CommoditySector, string> = {
  Energy: "Hormuz disruption, supply premium, refined product squeeze",
  "Precious Metals": "Geopolitical safe haven, real rate compression, CB buying",
  "Industrial Metals":
    "Energy-cost pass-through vs. China demand wobble",
  Grains: "Fertilizer input shock (urea +50%), 2026 acreage uncertainty",
  Softs:
    "Cocoa/coffee unwinding 2024-25 supply shock as harvests improve",
  Livestock: "Range-bound; feed costs partly offsetting tight supply",
};

function buildFallback(config: CommodityConfig): CommodityRow {
  const yearStartPrice =
    config.fallbackCurrentPrice / (1 + config.fallbackYtdPct / 100);
  return {
    symbol: config.symbol,
    name: config.name,
    sector: config.sector,
    priceUnit: config.priceUnit,
    currentPrice: Math.round(config.fallbackCurrentPrice * 100) / 100,
    yearStartPrice: Math.round(yearStartPrice * 100) / 100,
    ytdPct: Math.round(config.fallbackYtdPct * 100) / 100,
    fiveDayChangePct: 0,
    lastUpdated: new Date().toISOString(),
    live: false,
  };
}

async function fetchCommodityYTD(
  config: CommodityConfig,
): Promise<CommodityRow> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(config.symbol)}?interval=1d&range=ytd`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; HormuzTracker/1.0)",
      },
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 900 },
    });

    if (!response.ok) return buildFallback(config);

    const data = await response.json();
    const result = data?.chart?.result?.[0];
    const closes: (number | null)[] = result?.indicators?.quote?.[0]?.close ?? [];
    const meta = result?.meta;

    const validCloses = closes.filter(
      (c): c is number => typeof c === "number" && c > 0,
    );

    if (validCloses.length < 2) return buildFallback(config);

    const yearStartPrice = validCloses[0];
    const metaPrice: unknown = meta?.regularMarketPrice;
    const currentPrice =
      typeof metaPrice === "number" && metaPrice > 0
        ? metaPrice
        : validCloses[validCloses.length - 1];

    if (yearStartPrice <= 0 || currentPrice <= 0) return buildFallback(config);

    const ytdPct = ((currentPrice - yearStartPrice) / yearStartPrice) * 100;

    const fiveDayAgo =
      validCloses.length >= 6
        ? validCloses[validCloses.length - 6]
        : yearStartPrice;
    const fiveDayChangePct =
      fiveDayAgo > 0 ? ((currentPrice - fiveDayAgo) / fiveDayAgo) * 100 : 0;

    return {
      symbol: config.symbol,
      name: config.name,
      sector: config.sector,
      priceUnit: config.priceUnit,
      currentPrice: Math.round(currentPrice * 100) / 100,
      yearStartPrice: Math.round(yearStartPrice * 100) / 100,
      ytdPct: Math.round(ytdPct * 100) / 100,
      fiveDayChangePct: Math.round(fiveDayChangePct * 100) / 100,
      lastUpdated: new Date().toISOString(),
      live: true,
    };
  } catch {
    return buildFallback(config);
  }
}

function buildSectorSummaries(commodities: CommodityRow[]): SectorSummary[] {
  const grouped = new Map<CommoditySector, CommodityRow[]>();
  for (const row of commodities) {
    const list = grouped.get(row.sector) ?? [];
    list.push(row);
    grouped.set(row.sector, list);
  }

  const SECTOR_ORDER: CommoditySector[] = [
    "Energy",
    "Precious Metals",
    "Grains",
    "Industrial Metals",
    "Livestock",
    "Softs",
  ];

  const summaries: SectorSummary[] = [];
  for (const sector of SECTOR_ORDER) {
    const rows = grouped.get(sector);
    if (!rows || rows.length === 0) continue;
    const avgYtdPct =
      rows.reduce((sum, r) => sum + r.ytdPct, 0) / rows.length;
    summaries.push({
      sector,
      avgYtdPct: Math.round(avgYtdPct * 100) / 100,
      constituentCount: rows.length,
      driver: SECTOR_DRIVERS[sector],
    });
  }
  return summaries;
}

/**
 * Fetch live YTD data for all 17 commodities in parallel and group by sector.
 * Always resolves with valid data — falls back to May 12 snapshot for any
 * symbol Yahoo can't return.
 */
export async function fetchCommodityComplex(): Promise<CommodityComplexData> {
  const results = await Promise.allSettled(
    COMMODITY_COMPLEX.map((config) => fetchCommodityYTD(config)),
  );

  const commodities: CommodityRow[] = results.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    }
    return buildFallback(COMMODITY_COMPLEX[index]);
  });

  return {
    commodities,
    sectors: buildSectorSummaries(commodities),
    asOfDate: new Date().toISOString(),
  };
}
