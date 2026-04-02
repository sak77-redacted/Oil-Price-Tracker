import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { writeFileSync } from "fs";
import path from "path";
import { getSignalData } from "@/lib/signals";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Cron-triggered AI summary generation.
 * Runs daily at 9am AEDT (22:00 UTC) via Vercel Cron.
 * Generates a UAE-focused analysis of the Iran crisis using Claude.
 */
export async function GET(request: Request) {
  // Verify auth — accepts Bearer token (Vercel Cron) or ?secret= query param (manual trigger)
  const authHeader = request.headers.get("authorization");
  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get("secret");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    const authorized =
      authHeader === `Bearer ${cronSecret}` || querySecret === cronSecret;
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 },
    );
  }

  try {
    const signalData = getSignalData();

    // Build context from our signal data
    const context = buildContext(signalData);

    // Fetch recent news headlines for additional context
    const headlines = await fetchNewsHeadlines();

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: `You are a senior geopolitical risk analyst writing a daily briefing for investors and business leaders with exposure to the UAE. Write a concise, factual analysis of the current Iran–US war and its specific impact on the UAE.

CURRENT SIGNAL DATA:
${context}

${headlines ? `RECENT NEWS HEADLINES:\n${headlines}\n` : ""}

REQUIREMENTS:
- Focus specifically on UAE impact: trade, energy, logistics, business environment, real estate, tourism, aviation
- Include: current military situation, diplomatic developments, economic impact, outlook
- Tone: professional, analytical, no sensationalism
- Length: 3-4 paragraphs, ~300 words
- End with a 1-sentence "Bottom line" assessment
- Do NOT use markdown formatting, headers, or bullet points — write in flowing prose paragraphs
- Include today's date (${new Date().toISOString().split("T")[0]}) at the start

Write the briefing now.`,
        },
      ],
    });

    const summary =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Save to JSON file
    const summaryData = {
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

    const outputPath = path.join(
      process.cwd(),
      "src/data/ai-summary.json",
    );
    writeFileSync(outputPath, JSON.stringify(summaryData, null, 2));

    // Revalidate the home page
    revalidatePath("/");

    return NextResponse.json({
      status: "ok",
      generatedAt: summaryData.generatedAt,
      wordCount: summary.split(/\s+/).length,
    });
  } catch (error) {
    console.error("AI summary generation failed:", error);
    return NextResponse.json(
      { error: "Summary generation failed", details: String(error) },
      { status: 500 },
    );
  }
}

function buildContext(data: ReturnType<typeof getSignalData>): string {
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

async function fetchNewsHeadlines(): Promise<string> {
  try {
    // Fetch Google News RSS for Iran UAE related news
    const response = await fetch(
      "https://news.google.com/rss/search?q=Iran+UAE+war+oil+Hormuz&hl=en&gl=US&ceid=US:en",
      {
        signal: AbortSignal.timeout(5000),
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; HormuzTracker/1.0)",
        },
      },
    );

    if (!response.ok) return "";

    const xml = await response.text();
    // Extract titles from RSS XML
    const titles: string[] = [];
    const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/g;
    let match;
    while ((match = titleRegex.exec(xml)) !== null && titles.length < 8) {
      const title = match[1] || match[2];
      if (title && title !== "Google News" && title.length > 10) {
        titles.push(title);
      }
    }

    return titles.map((t, i) => `${i + 1}. ${t}`).join("\n");
  } catch {
    return "";
  }
}
