import type { EconomicScenario, EconomicYear } from "@/engine/economics/types";
import { economicYearFromProfile } from "@/engine/economics/fromProfile";
import type { MonteCarloVolatilityPrefs, UserProfile } from "@/engine/types";
import { normalRandom } from "./rng";

function clampReturn(r: number): number {
  return Math.max(-0.95, Math.min(1.5, r));
}

/**
 * Sample one stochastic path. Property/BTL appreciation stays deterministic (profile fields).
 * Equity-like buckets share independent normal shocks on nominal returns.
 */
export function generateStochasticScenario(
  profile: UserProfile,
  startYear: number,
  yearCount: number,
  vol: MonteCarloVolatilityPrefs,
  rng: () => number,
): EconomicScenario {
  const base = economicYearFromProfile(profile, startYear);
  const years: EconomicYear[] = [];
  for (let i = 0; i < yearCount; i++) {
    const zP = normalRandom(rng);
    const zI = normalRandom(rng);
    const zG = normalRandom(rng);
    const zC = normalRandom(rng);
    years.push({
      year: startYear + i,
      inflation: clampReturn(base.inflation + zC * vol.cash.stdev * 0.5),
      pensionReturn: clampReturn(base.pensionReturn + zP * vol.pension.stdev),
      isaReturn: clampReturn(base.isaReturn + zI * vol.isa.stdev),
      giaReturn: clampReturn(base.giaReturn + zG * vol.gia.stdev),
      cashReturn: clampReturn(base.cashReturn + zC * vol.cash.stdev),
      cashIsaReturn: clampReturn(base.cashIsaReturn + zC * vol.cash.stdev),
      rentalGrowth: base.rentalGrowth,
      spTripleLockGrowth: base.spTripleLockGrowth,
    });
  }
  return { id: "stochastic-path", years };
}
