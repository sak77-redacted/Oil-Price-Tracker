import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export const dynamic = "force-dynamic";

/**
 * Cron-triggered signal data refresh.
 * Runs daily at 6 AM UTC via Vercel Cron.
 * Invalidates the cached scraped data so the next page visit
 * triggers a fresh scrape of hormuzstraitmonitor.com.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get("secret");
  const cronSecret = process.env.CRON_SECRET;
  const adminSecret = process.env.ADMIN_SECRET;

  if (cronSecret || adminSecret) {
    const authorized =
      (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
      (cronSecret && querySecret === cronSecret) ||
      (adminSecret && querySecret === adminSecret);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Bust the signal data cache — next page visit will re-scrape
  revalidateTag("signal-overrides", { expire: 0 });

  // Also revalidate the page itself
  const { revalidatePath } = await import("next/cache");
  revalidatePath("/");

  return NextResponse.json({
    status: "ok",
    message: "Signal cache invalidated. Next page visit will scrape fresh data.",
    invalidatedAt: new Date().toISOString(),
  });
}
