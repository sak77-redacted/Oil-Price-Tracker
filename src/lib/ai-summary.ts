import { readFileSync } from "fs";
import path from "path";

export interface AISummaryData {
  summary: string;
  generatedAt: string;
  model: string;
  signalSnapshot: {
    insuranceCurrent: number;
    shipTransitCount: number;
    brentPrice: number;
    straitStatus: string;
    recessionRisk: string;
  };
}

/**
 * Load the cached AI summary from disk.
 * Returns null if no summary has been generated yet.
 */
export function getAISummary(): AISummaryData | null {
  try {
    const filePath = path.join(process.cwd(), "src/data/ai-summary.json");
    const raw = readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as AISummaryData;
  } catch {
    return null;
  }
}
