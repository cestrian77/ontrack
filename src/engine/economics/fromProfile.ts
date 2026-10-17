import type { UserProfile } from "@/engine/types";
import type { EconomicScenario, EconomicYear } from "./types";

export function economicYearFromProfile(
  profile: UserProfile,
  calendarYear: number,
): EconomicYear {
  return {
    year: calendarYear,
    inflation: profile.cpi,
    pensionReturn: profile.pensionGrowth,
    isaReturn: profile.isaGrowth,
    giaReturn: profile.giaGrowth,
    cashReturn: profile.cashRate,
    cashIsaReturn: profile.cashIsaRate,
    rentalGrowth: profile.rentalGrowth,
    spTripleLockGrowth: profile.spTripleLockGrowth,
  };
}

/** Constant economics matching legacy `runProjection` (one row per projection year index). */
export function economicScenarioFromProfile(
  profile: UserProfile,
  startYear: number,
  yearCount: number,
): EconomicScenario {
  const template = economicYearFromProfile(profile, startYear);
  const years: EconomicYear[] = [];
  for (let i = 0; i < yearCount; i++) {
    years.push({ ...template, year: startYear + i });
  }
  return { id: "constant-from-profile", years };
}

export function resolveEconomicYear(
  scenario: EconomicScenario,
  yearIndex: number,
  fallback: EconomicYear,
): EconomicYear {
  if (yearIndex < scenario.years.length) return scenario.years[yearIndex];
  if (scenario.years.length === 0) return fallback;
  const last = scenario.years[scenario.years.length - 1];
  return { ...last, year: fallback.year };
}
