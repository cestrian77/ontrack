import type { TaxYearPack } from "@/engine/constants/taxYears";
import type { ProjectionYear, UserProfile } from "@/engine/types";

/** Minimum pension access age from 6 April 2028 (NMPA 57). */
export function statutoryNmpaForCalendarYear(
  calendarYear: number,
  pack: TaxYearPack,
): number {
  return calendarYear >= 2028 ? pack.nmpaFrom2028 : pack.nmpaPre2028;
}

/** User plan age vs statutory minimum for that calendar year. */
export function effectiveNmpaForCalendarYear(
  profile: UserProfile,
  calendarYear: number,
  pack: TaxYearPack,
): number {
  return Math.max(
    profile.pensionAccessAge,
    statutoryNmpaForCalendarYear(calendarYear, pack),
  );
}

/** Age at which pension drawdown may begin (first projection year that satisfies NMPA). */
export function firstPensionAccessAgeFromYears(
  profile: UserProfile,
  years: ProjectionYear[],
  packForYear: (calendarYear: number) => TaxYearPack,
): number {
  for (const y of years) {
    const pack = packForYear(y.year);
    const minAge = effectiveNmpaForCalendarYear(profile, y.year, pack);
    if (y.age >= minAge) return minAge;
  }
  const last = years[years.length - 1];
  if (!last) return profile.pensionAccessAge;
  return effectiveNmpaForCalendarYear(profile, last.year, packForYear(last.year));
}
