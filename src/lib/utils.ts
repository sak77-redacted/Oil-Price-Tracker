import type { SignalStatus } from "./types";

export function getInsuranceStatus(rate: number): SignalStatus {
  if (rate >= 2) return "red";
  if (rate >= 1) return "yellow";
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

export function getBufferMathStatus(
  daysCover: number,
  projectedShortfall: number,
  sprAvailable: number,
): SignalStatus {
  if (daysCover < 24 || projectedShortfall > sprAvailable) return "red";
  if (daysCover < 30 || projectedShortfall > sprAvailable * 0.7) return "yellow";
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

export function getRefiningStatus(
  gasolineCrack: number,
  heatingOilCrack: number,
  gasPeak: number,
  hoPeak: number,
  gasBaseline: number = 15,
  hoBaseline: number = 25,
): SignalStatus {
  // Reverted to pre-crisis baseline = sell signal
  if (gasolineCrack <= gasBaseline * 1.2 || heatingOilCrack <= hoBaseline * 1.2) return "red";

  // How far margins have come back from peak toward baseline
  const gasRange = gasPeak - gasBaseline;
  const hoRange = hoPeak - hoBaseline;
  const gasReversion = gasRange > 0 ? (gasPeak - gasolineCrack) / gasRange : 0;
  const hoReversion = hoRange > 0 ? (hoPeak - heatingOilCrack) / hoRange : 0;

  // More than 50% reversion toward baseline = sell signal
  if (gasReversion > 0.5 && hoReversion > 0.5) return "red";

  // More than 25% reversion = topping
  if (gasReversion > 0.25 || hoReversion > 0.25) return "yellow";

  return "green";
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
