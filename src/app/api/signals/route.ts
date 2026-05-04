import { NextResponse } from "next/server";
import signals from "@/data/signals.json";

export const runtime = "edge";
export const revalidate = 60;

export async function GET() {
  return NextResponse.json(signals, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
