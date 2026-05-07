import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

const gbpFmt = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

const gbpFmt2 = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 2,
});

export function gbp(n: number, decimals: 0 | 2 = 0): string {
  if (!Number.isFinite(n)) return "—";
  return decimals === 2 ? gbpFmt2.format(n) : gbpFmt.format(n);
}

export function pct(n: number, decimals = 1): string {
  return `${(n * 100).toFixed(decimals)}%`;
}

export function nominalise(
  realValue: number,
  cpi: number,
  yearsAhead: number,
): number {
  return realValue * Math.pow(1 + cpi, yearsAhead);
}
