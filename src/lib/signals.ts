import { readFileSync } from "fs";
import path from "path";
import type { ExtendedSignalData } from "./types";
import defaultSignals from "@/data/signals.json";

function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>,
): T {
  const result = { ...target };
  for (const key of Object.keys(source) as (keyof T)[]) {
    const srcVal = source[key];
    const tgtVal = target[key];
    if (
      srcVal &&
      typeof srcVal === "object" &&
      !Array.isArray(srcVal) &&
      tgtVal &&
      typeof tgtVal === "object" &&
      !Array.isArray(tgtVal)
    ) {
      (result as Record<string, unknown>)[key as string] = deepMerge(
        tgtVal as Record<string, unknown>,
        srcVal as Record<string, unknown>,
      );
    } else if (srcVal !== undefined) {
      (result as Record<string, unknown>)[key as string] = srcVal;
    }
  }
  return result;
}

export function getSignalData(): ExtendedSignalData {
  let override: Record<string, unknown> = {};

  try {
    const overridePath = path.join(
      process.cwd(),
      "src/data/signals-override.json",
    );
    const raw = readFileSync(overridePath, "utf-8");
    const parsed = JSON.parse(raw);
    // Strip metadata fields before merging
    const { _updatedAt: _, _updatedBy: __, ...rest } = parsed;
    override = rest;
  } catch {
    // No override file — use defaults only
  }

  if (Object.keys(override).length > 0) {
    return deepMerge(
      defaultSignals as unknown as Record<string, unknown>,
      override,
    ) as unknown as ExtendedSignalData;
  }

  return defaultSignals as ExtendedSignalData;
}
