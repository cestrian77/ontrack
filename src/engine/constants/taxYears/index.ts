import { TAX_YEAR_2024_25 } from "./2024-25";
import { TAX_YEAR_2025_26 } from "./2025-26";
import { TAX_YEAR_2026_27 } from "./2026-27";
import { TAX_YEAR_2027_28 } from "./2027-28";
import type { TaxYearPack } from "./types";

export type { TaxBand, TaxYearPack } from "./types";

/**
 * Registry of all known tax-year packs, ordered chronologically.
 * To add a new tax year: create `YYYY-YY.ts`, import it, and append here.
 */
export const TAX_YEAR_PACKS: TaxYearPack[] = [
  TAX_YEAR_2024_25,
  TAX_YEAR_2025_26,
  TAX_YEAR_2026_27,
  TAX_YEAR_2027_28,
];

/** UK tax-year pack for a projection calendar year (rules from 6 Apr that year). */
export function resolveTaxYearPackForCalendarYear(calendarYear: number): TaxYearPack {
  return resolveTaxYearPack(`${calendarYear}-04-06`);
}

/** Next chronologically registered pack after `pack`, if any. */
export function nextRegisteredTaxYearPack(pack: TaxYearPack): TaxYearPack | null {
  const i = TAX_YEAR_PACKS.findIndex((p) => p.label === pack.label);
  if (i < 0 || i >= TAX_YEAR_PACKS.length - 1) return null;
  return TAX_YEAR_PACKS[i + 1];
}

/** Returns the UK tax-year label (e.g. "2026/27") for a given date. */
export function taxYearLabelForDate(date: Date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1; // 1-12
  const d = date.getUTCDate();
  const startYear = m > 4 || (m === 4 && d >= 6) ? y : y - 1;
  const endYY = String((startYear + 1) % 100).padStart(2, "0");
  return `${startYear}/${endYY}`;
}

/**
 * Resolves the tax-year pack active on a given date.
 * Falls back to the most recent registered pack if no pack matches
 * (i.e. the codebase is out of date — the auto-check workflow will fire
 * a reminder issue but the engine still returns sensible numbers).
 */
export function resolveTaxYearPack(date: Date | string = new Date()): TaxYearPack {
  const d = typeof date === "string" ? new Date(date) : date;
  const t = d.getTime();
  for (const pack of TAX_YEAR_PACKS) {
    const start = new Date(pack.startsOn).getTime();
    const end = new Date(pack.endsOn).getTime();
    if (t >= start && t < end) return pack;
  }
  return TAX_YEAR_PACKS[TAX_YEAR_PACKS.length - 1];
}

/** Convenience: pack active right now. */
export function currentTaxYearPack(): TaxYearPack {
  return resolveTaxYearPack(new Date());
}

/** Look up a pack by label (e.g. "2024/25"). Throws if unknown. */
export function taxYearPackByLabel(label: string): TaxYearPack {
  const p = TAX_YEAR_PACKS.find((x) => x.label === label);
  if (!p) throw new Error(`Unknown UK tax year: ${label}`);
  return p;
}

/**
 * Returns true iff a registered pack covers today's date. Used by the CI
 * "tax-year-check" workflow to remind us to add the new pack each April.
 */
export function isCurrentTaxYearRegistered(date: Date = new Date()): boolean {
  const label = taxYearLabelForDate(date);
  return TAX_YEAR_PACKS.some((p) => p.label === label);
}
