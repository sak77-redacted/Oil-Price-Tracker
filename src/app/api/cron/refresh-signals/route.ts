import { NextRequest, NextResponse } from "next/server";
import { writeFile, readFile } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";

const OVERRIDE_PATH = path.join(
  process.cwd(),
  "src/data/signals-override.json",
);

export async function GET(request: NextRequest) {
  // Verify this is called by Vercel Cron or with admin secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const adminSecret = process.env.ADMIN_SECRET;

  const isVercelCron = cronSecret && authHeader === `Bearer ${cronSecret}`;
  const isAdmin =
    adminSecret &&
    request.nextUrl.searchParams.get("secret") === adminSecret;

  if (!isVercelCron && !isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, unknown> = {};
  const errors: string[] = [];

  // 1. Scrape hormuzstraitmonitor.com for key signals
  try {
    const response = await fetch("https://hormuzstraitmonitor.com", {
      headers: {
        "User-Agent":
          "HormuzSignalTracker/1.0 (private research dashboard)",
      },
      next: { revalidate: 0 },
    });

    if (response.ok) {
      const html = await response.text();

      // Parse insurance premium
      // Look for patterns like "War risk premium" followed by a percentage
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
      // Look for patterns like "ships transiting" or "transits (24h)" with a number
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

      // Parse "since" date for duration tracking
      const durationMatch = html.match(
        /[Ss]ince\s+((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d+,?\s*\d{4})/i,
      );
      if (durationMatch) {
        results._scraped = {
          source: "hormuzstraitmonitor.com",
          timestamp: new Date().toISOString(),
          durationSince: durationMatch[1],
        };
      }
    } else {
      errors.push(
        `hormuzstraitmonitor.com returned ${response.status}`,
      );
    }
  } catch (err) {
    errors.push(
      `Failed to scrape hormuzstraitmonitor.com: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  // 2. If we got any data, merge it into the override file
  if (Object.keys(results).length > 0) {
    try {
      let existing: Record<string, unknown> = {};
      try {
        const raw = await readFile(OVERRIDE_PATH, "utf-8");
        existing = JSON.parse(raw);
      } catch {
        // No existing override file
      }

      // Deep merge new results into existing overrides
      const merged = deepMerge(existing, results);
      merged._updatedAt = new Date().toISOString();
      merged._updatedBy = "cron-refresh";
      merged._lastScrape = {
        timestamp: new Date().toISOString(),
        fieldsUpdated: Object.keys(results).filter(
          (k) => !k.startsWith("_"),
        ),
        errors: errors.length > 0 ? errors : undefined,
      };

      await writeFile(OVERRIDE_PATH, JSON.stringify(merged, null, 2));

      // Revalidate home page to pick up new data
      revalidatePath("/");
    } catch (writeErr) {
      errors.push(
        `Failed to write override: ${writeErr instanceof Error ? writeErr.message : String(writeErr)}`,
      );
    }
  }

  return NextResponse.json({
    ok: errors.length === 0,
    updated: Object.keys(results).filter((k) => !k.startsWith("_")),
    errors: errors.length > 0 ? errors : undefined,
    timestamp: new Date().toISOString(),
  });
}

function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === "object" &&
      !Array.isArray(target[key])
    ) {
      result[key] = deepMerge(
        target[key] as Record<string, unknown>,
        source[key] as Record<string, unknown>,
      );
    } else {
      result[key] = source[key];
    }
  }
  return result;
}
