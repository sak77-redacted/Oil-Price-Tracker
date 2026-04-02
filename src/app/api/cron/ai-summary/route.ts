import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export const dynamic = "force-dynamic";

/**
 * Cron-triggered cache bust for AI summary.
 * Runs daily at 9am AEDT (22:00 UTC) via Vercel Cron.
 * Invalidates the cached summary so the next page visit triggers regeneration.
 */
export async function GET(request: Request) {
  // Verify auth — accepts Bearer token (Vercel Cron) or ?secret= query param (manual)
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

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 },
    );
  }

  // Bust the cache — next page visit will regenerate the summary
  revalidateTag("ai-summary", { expire: 0 });

  return NextResponse.json({
    status: "ok",
    message: "AI summary cache invalidated. Next page visit will regenerate.",
    invalidatedAt: new Date().toISOString(),
  });
}
