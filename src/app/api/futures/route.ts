import { NextResponse } from "next/server";
import { fetchFuturesData } from "@/lib/futures-api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await fetchFuturesData();

    return NextResponse.json(data, {
      headers: {
        "Cache-Control":
          "public, s-maxage=900, stale-while-revalidate=1800",
      },
    });
  } catch {
    // fetchFuturesData should never throw, but just in case
    return NextResponse.json(
      {
        contracts: [],
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
