import { NextRequest, NextResponse } from "next/server";
import { writeFile, readFile } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";

const OVERRIDE_PATH = path.join(
  process.cwd(),
  "src/data/signals-override.json",
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { secret, signals } = body;

    // Verify admin secret
    const adminSecret = process.env.ADMIN_SECRET;
    if (!adminSecret || secret !== adminSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!signals || typeof signals !== "object") {
      return NextResponse.json(
        { error: "Invalid signals data — expected { signals: { ... } }" },
        { status: 400 },
      );
    }

    // Read existing override if it exists
    let existing: Record<string, unknown> = {};
    try {
      const raw = await readFile(OVERRIDE_PATH, "utf-8");
      existing = JSON.parse(raw);
    } catch {
      // No existing override file — start fresh
    }

    // Deep merge new signals into existing override
    const merged = deepMerge(existing, signals);

    // Add metadata
    merged._updatedAt = new Date().toISOString();
    merged._updatedBy = "admin-api";

    // Write override file
    await writeFile(OVERRIDE_PATH, JSON.stringify(merged, null, 2));

    // Trigger revalidation so ISR picks up new data
    revalidatePath("/");

    return NextResponse.json({
      ok: true,
      message: "Signals updated successfully",
      updatedAt: merged._updatedAt,
      fields: Object.keys(signals),
    });
  } catch (error) {
    console.error("Failed to update signals:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret || secret !== adminSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const raw = await readFile(OVERRIDE_PATH, "utf-8");
    const data = JSON.parse(raw);
    return NextResponse.json({
      hasOverride: true,
      updatedAt: data._updatedAt,
      data,
    });
  } catch {
    return NextResponse.json({ hasOverride: false });
  }
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
