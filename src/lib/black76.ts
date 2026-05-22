/**
 * Black-76 futures option pricing model.
 *
 * Why Black-76 not Black-Scholes: sugar options (SB) are options on
 * futures contracts, not on spot. Black-76 uses the discounted forward
 * price; same shape as BS but appropriate for commodity futures options.
 *
 * References:
 * - Black, F. (1976). "The pricing of commodity contracts."
 * - Hull, J. "Options, Futures, and Other Derivatives" — Ch 18.
 */

/**
 * Standard normal CDF — Abramowitz & Stegun 7.1.26 approximation.
 * Max error ~7.5e-8.
 */
export function normCdf(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x) / Math.sqrt(2);
  const t = 1.0 / (1.0 + p * ax);
  const y =
    1.0 -
    (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax);
  return 0.5 * (1.0 + sign * y);
}

export interface Black76Inputs {
  F: number;       // forward / futures price (same units as strike)
  K: number;       // strike
  T: number;       // years to expiry
  r: number;       // risk-free rate (annualized, continuous)
  sigma: number;   // implied volatility (annualized)
}

export interface Black76Output {
  price: number;       // call price
  d1: number;
  d2: number;
  Nd1: number;         // delta (forward) ≈ N(d1) discounted
  intrinsic: number;
  timeValue: number;
}

/**
 * Black-76 call option price.
 * Handles edge cases: T <= 0 returns intrinsic; sigma <= 0 returns
 * discounted intrinsic.
 */
export function black76Call(inputs: Black76Inputs): Black76Output {
  const { F, K, T, r, sigma } = inputs;

  if (T <= 0) {
    const intrinsic = Math.max(0, F - K);
    return {
      price: intrinsic,
      d1: 0,
      d2: 0,
      Nd1: F > K ? 1 : 0,
      intrinsic,
      timeValue: 0,
    };
  }

  if (sigma <= 0) {
    const price = Math.max(0, (F - K) * Math.exp(-r * T));
    return {
      price,
      d1: 0,
      d2: 0,
      Nd1: F > K ? 1 : 0,
      intrinsic: Math.max(0, F - K),
      timeValue: 0,
    };
  }

  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(F / K) + ((sigma * sigma) / 2) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;
  const Nd1 = normCdf(d1);
  const Nd2 = normCdf(d2);
  const discount = Math.exp(-r * T);
  const price = discount * (F * Nd1 - K * Nd2);
  const intrinsic = Math.max(0, F - K);
  const timeValue = Math.max(0, price - intrinsic);

  return { price, d1, d2, Nd1, intrinsic, timeValue };
}

/**
 * Years between two ISO date strings (or Date objects).
 * Uses 365-day year.
 */
export function yearsBetween(from: string | Date, to: string | Date): number {
  const fromMs = typeof from === "string" ? Date.parse(from) : from.getTime();
  const toMs = typeof to === "string" ? Date.parse(to) : to.getTime();
  const days = (toMs - fromMs) / (1000 * 60 * 60 * 24);
  return days / 365;
}

/**
 * Days between two ISO date strings (integer floor).
 */
export function daysBetween(from: string | Date, to: string | Date): number {
  const fromMs = typeof from === "string" ? Date.parse(from) : from.getTime();
  const toMs = typeof to === "string" ? Date.parse(to) : to.getTime();
  return Math.floor((toMs - fromMs) / (1000 * 60 * 60 * 24));
}
