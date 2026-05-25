import { NextResponse } from "next/server";
import { fetchTickerData } from "@/lib/futures-api";

/**
 * Live ticker endpoint. Polled by the client every 60s from
 * <LivePriceTicker /> mounted in the layout slot.
 *
 * Yahoo protection: fetchTickerData is wrapped in unstable_cache at 30s,
 * so even with hundreds of concurrent clients only ONE upstream Yahoo
 * fan-out fires per 30s window. The HTTP Cache-Control below allows
 * Vercel edge to serve the same bytes to all clients during that window.
 */
export async function GET() {
  try {
    const data = await fetchTickerData();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch {
    return NextResponse.json(
      { quotes: [], timestamp: new Date().toISOString() },
      {
        headers: {
          "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
        },
      },
    );
  }
}
