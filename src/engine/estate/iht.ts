import type { EstatePlanningPrefs } from "@/engine/types";
import {
  DEFAULT_IHT_NIL_RATE_BAND,
  DEFAULT_IHT_RESIDENCE_NIL_RATE_BAND,
} from "@/engine/constants/uk";

export const DEFAULT_ESTATE_PLANNING: EstatePlanningPrefs = {
  enabled: false,
  modelAtAge: 90,
  nilRateBand: DEFAULT_IHT_NIL_RATE_BAND,
  residenceNilRateBand: DEFAULT_IHT_RESIDENCE_NIL_RATE_BAND,
  primaryHomeToDirectDescendants: true,
  transferredNilRateToSpouse: false,
  charitableLegacyPct: 0,
};

export interface EstateForIht {
  /** Investable + property equity (real £). */
  netEstate: number;
  primaryResidenceValue: number;
}

export interface IhtEstimate {
  taxableEstate: number;
  ihtDue: number;
  effectiveRate: number;
  nilRateBandUsed: number;
  residenceNilRateBandUsed: number;
}

/**
 * Simplified UK IHT estimate (illustrative; not advice).
 * 40% on estate above available nil-rate bands; 36% if 10%+ to charity.
 */
export function estimateUkIht(
  estate: EstateForIht,
  prefs: EstatePlanningPrefs,
): IhtEstimate {
  const nrb = prefs.nilRateBand ?? DEFAULT_IHT_NIL_RATE_BAND;
  const rnrb = prefs.residenceNilRateBand ?? DEFAULT_IHT_RESIDENCE_NIL_RATE_BAND;
  const bandMultiplier = prefs.transferredNilRateToSpouse ? 2 : 1;
  const totalNrb = nrb * bandMultiplier;
  const residenceBand =
    prefs.primaryHomeToDirectDescendants
      ? Math.min(rnrb * bandMultiplier, estate.primaryResidenceValue)
      : 0;

  const threshold = totalNrb + residenceBand;
  const taxableEstate = Math.max(0, estate.netEstate - threshold);
  const charity = Math.max(0, Math.min(1, prefs.charitableLegacyPct ?? 0));
  const rate = charity >= 0.1 ? 0.36 : 0.4;
  const ihtDue = taxableEstate * rate;
  const effectiveRate = estate.netEstate > 0 ? ihtDue / estate.netEstate : 0;

  return {
    taxableEstate,
    ihtDue,
    effectiveRate,
    nilRateBandUsed: totalNrb,
    residenceNilRateBandUsed: residenceBand,
  };
}
