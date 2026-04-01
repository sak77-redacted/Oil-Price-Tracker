import type { SignalStatus } from "./types";

export function getInsuranceStatus(rate: number): SignalStatus {
  if (rate >= 5) return "red";
  if (rate >= 2) return "yellow";
  return "green";
}

export function getShipStatus(count: number): SignalStatus {
  if (count < 20) return "red";
  if (count < 40) return "yellow";
  return "green";
}

export function getSpreadStatus(spread: number): SignalStatus {
  if (spread > 8) return "red";
  if (spread > 3) return "yellow";
  return "green";
}

export function getTimelineStatus(daysUntilCliff: number): SignalStatus {
  if (daysUntilCliff <= 7) return "red";
  if (daysUntilCliff <= 21) return "yellow";
  return "green";
}

export function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr + "T00:00:00Z");
  const now = new Date();
  const today = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  );
  const diffMs = target.getTime() - today.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function formatCurrency(value: number): string {
  return `$${value}`;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function statusColor(status: SignalStatus): string {
  switch (status) {
    case "red":
      return "var(--color-signal-red)";
    case "yellow":
      return "var(--color-signal-yellow)";
    case "green":
      return "var(--color-signal-green)";
  }
}
