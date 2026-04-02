import { unstable_cache } from "next/cache";
import Anthropic from "@anthropic-ai/sdk";
import { getSignalData } from "./signals";

export interface AISummaryData {
  summary: string;
  generatedAt: string;
  model: string;
  signalSnapshot: {
    insuranceCurrent: number;
    shipTransitCount: number;
    brentPrice: number;
    straitStatus: string;
    recessionRisk: string;
  };
}

/**
 * Generate and cache the AI summary.
 * Uses Next.js unstable_cache with 24h revalidation.
 * The cron job busts this cache via revalidateTag('ai-summary').
 */
export const getAISummary = unstable_cache(
  async (): Promise<AISummaryData | null> => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return null;

    try {
      const signalData = await getSignalData();
      const context = buildContext(signalData);
      const headlines = await fetchNewsHeadlines();

      const client = new Anthropic({ apiKey });

      const message = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: `You are a senior geopolitical risk analyst writing a daily briefing for investors and business leaders with exposure to the UAE. Write a concise, factual analysis of the current Iran–US war and its specific impact on the UAE.

CURRENT SIGNAL DATA:
${context}

${headlines ? `RECENT NEWS HEADLINES (grouped by category):\n${headlines}\n` : ""}

REQUIREMENTS:
- Open with the most significant breaking news events from the last 24 hours — what happened, who said what, what moved markets
- Dedicate a paragraph to analyzing which specific news events moved oil prices (and in which direction — up or down), citing the headlines above where relevant
- Explain how these developments connect to UAE impact: trade, energy, logistics, business environment, real estate, tourism, aviation
- Include: current military situation, diplomatic developments, economic impact, outlook
- Tone: professional, analytical, no sensationalism
- Length: 4-5 paragraphs, ~400 words
- End with a 1-sentence "Bottom line" assessment
- Do NOT use markdown formatting, headers, or bullet points — write in flowing prose paragraphs
- Include today's date (${new Date().toISOString().split("T")[0]}) at the start

Write the briefing now.`,
          },
        ],
      });

      const summary =
        message.content[0].type === "text" ? message.content[0].text : "";

      return {
        summary,
        generatedAt: new Date().toISOString(),
        model: "claude-haiku-4-5-20251001",
        signalSnapshot: {
          insuranceCurrent: signalData.insurance.current,
          shipTransitCount: signalData.shipTransit.dailyCount,
          brentPrice: signalData.oilSpread.brent,
          straitStatus: signalData.straitStatus.status,
          recessionRisk: signalData.inflationThreshold.recessionRisk,
        },
      };
    } catch (error) {
      console.error("AI summary generation failed:", error);
      return null;
    }
  },
  ["ai-summary"],
  { revalidate: 86400, tags: ["ai-summary"] },
);

function buildContext(
  data: Awaited<ReturnType<typeof getSignalData>>,
): string {
  return `- Strait Status: ${data.straitStatus.status} since ${data.straitStatus.since}. ${data.straitStatus.description}
- Insurance Premium: ${data.insurance.current}% hull value (baseline: ${data.insurance.baseline}%, threshold: ${data.insurance.threshold}%)
- Ship Transits: ${data.shipTransit.dailyCount}/day (baseline: ${data.shipTransit.baseline}, ${Math.round((1 - data.shipTransit.dailyCount / data.shipTransit.baseline) * 100)}% collapse)
- Brent Crude: $${data.oilSpread.brent}, Dubai Physical: $${data.oilSpread.dubai}, Spread: $${data.oilSpread.spread}
- Supply Gap: ${data.timeline.currentGapMbd} mb/d current, ${data.timeline.projectedGapMbd} mb/d projected
- SPR Status: ${data.sprStatus.countries.map((c) => `${c.country}: ${c.released ? `released ${c.releasedMb}M bbl` : "HOLDING"}`).join("; ")}
- Demand Destruction: ${data.demandDestruction.estimatedDemandLossMbd} mb/d estimated
- Inflation: CPI projected ${data.inflationThreshold.projectedCPILow}-${data.inflationThreshold.projectedCPIHigh}%, recession risk: ${data.inflationThreshold.recessionRisk}
- Recovery Timeline: ${data.recoveryClock.totalMonths} months to normalize, earliest ${data.recoveryClock.estimatedNormalizationDate}
- Recent Crisis Events: ${data.crisisTimeline.slice(0, 3).map((e) => `${e.date}: ${e.title}`).join("; ")}
- Regional: UAE dependency on Hormuz: ~30% of oil exports. East-West pipeline (Habshan-Fujairah) operational but vulnerable to drone attacks. Dubai logistics hub disrupted. JAFZA trade volumes down.`;
}

interface NewsFeedConfig {
  query: string;
  label: string;
}

const NEWS_FEEDS: NewsFeedConfig[] = [
  { query: "Trump+Iran+oil+war", label: "US/IRAN POLICY" },
  { query: "oil+price+crude+today", label: "OIL MARKETS" },
  { query: "UAE+economy+war+impact", label: "UAE IMPACT" },
  { query: "Hormuz+strait+shipping", label: "STRAIT/SHIPPING" },
  { query: "OPEC+oil+supply+production", label: "OPEC/SUPPLY" },
  { query: "Iran+sanctions+nuclear", label: "IRAN GEOPOLITICS" },
];

async function fetchSingleFeed(
  feed: NewsFeedConfig,
): Promise<{ label: string; titles: string[] }> {
  try {
    const response = await fetch(
      `https://news.google.com/rss/search?q=${feed.query}&hl=en&gl=US&ceid=US:en`,
      {
        signal: AbortSignal.timeout(5000),
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; HormuzTracker/1.0)",
        },
      },
    );

    if (!response.ok) return { label: feed.label, titles: [] };

    const xml = await response.text();
    const titles: string[] = [];
    const titleRegex =
      /<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/g;
    let match;
    while ((match = titleRegex.exec(xml)) !== null && titles.length < 5) {
      const title = match[1] || match[2];
      if (title && title !== "Google News" && title.length > 10) {
        titles.push(title);
      }
    }

    return { label: feed.label, titles };
  } catch {
    return { label: feed.label, titles: [] };
  }
}

function isDuplicate(title: string, existing: string[]): boolean {
  const normalized = title.toLowerCase();
  return existing.some((t) => {
    const existingNorm = t.toLowerCase();
    return (
      normalized.includes(existingNorm.slice(0, 40)) ||
      existingNorm.includes(normalized.slice(0, 40))
    );
  });
}

async function fetchNewsHeadlines(): Promise<string> {
  try {
    const results = await Promise.allSettled(
      NEWS_FEEDS.map((feed) => fetchSingleFeed(feed)),
    );

    const allTitles: string[] = [];
    const sections: string[] = [];

    for (const result of results) {
      if (result.status !== "fulfilled") continue;
      const { label, titles } = result.value;
      if (titles.length === 0) continue;

      const dedupedTitles = titles.filter(
        (t) => !isDuplicate(t, allTitles),
      );
      if (dedupedTitles.length === 0) continue;

      allTitles.push(...dedupedTitles);
      const numbered = dedupedTitles
        .map((t, i) => `  ${i + 1}. ${t}`)
        .join("\n");
      sections.push(`${label}:\n${numbered}`);

      if (allTitles.length >= 15) break;
    }

    return sections.join("\n\n");
  } catch {
    return "";
  }
}
