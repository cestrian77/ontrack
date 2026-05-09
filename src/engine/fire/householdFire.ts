import type { TaxYearPack } from "@/engine/constants/taxYears";
import { currentTaxYearPack } from "@/engine/constants/taxYears";
import type { FireMetrics, Projection, UserProfile } from "@/engine/types";
import { buildHouseholdSyntheticProfile } from "@/engine/household/syntheticProfile";
import { computeFire } from "./fire";

/**
 * Household FIRE: combined target income and rates from `buildHouseholdSyntheticProfile`,
 * timeline ages from primary DOB (matches merged projection X-axis).
 */
export function computeHouseholdFire(
  primary: UserProfile,
  partner: UserProfile,
  combinedProjection: Projection,
  pack: TaxYearPack = currentTaxYearPack(),
): FireMetrics {
  const synthetic = buildHouseholdSyntheticProfile(primary, partner);
  return computeFire(synthetic, combinedProjection, pack);
}
