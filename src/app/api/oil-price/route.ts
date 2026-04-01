import { NextResponse } from "next/server";
import { fetchBrentPrice } from "@/lib/oil-api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await fetchBrentPrice();

    return NextResponse.json(
      {
        brent: result.price,
        source: result.source,
        live: result.live,
        timestamp: result.timestamp,
      },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=900, stale-while-revalidate=1800",
        },
      },
    );
  } catch {
    // fetchBrentPrice should never throw, but just in case
    return NextResponse.json(
      {
        brent: 112,
        source: "emergency fallback",
        live: false,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  }
}
