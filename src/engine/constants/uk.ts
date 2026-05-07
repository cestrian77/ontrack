/**
 * Active UK tax-year constants. This module is a thin facade over
 * `taxYears/` that re-exports the pack for the current UK tax year (resolved
 * by today's date). Each historical year is a frozen pack in `taxYears/`.
 *
 * The auto-check workflow `.github/workflows/tax-year-check.yml` opens a
 * reminder issue every April if a pack for the new tax year is missing.
 */

import { currentTaxYearPack } from "./taxYears";

export type { TaxBand, TaxYearPack } from "./taxYears";
export {
  TAX_YEAR_PACKS,
  currentTaxYearPack,
  resolveTaxYearPack,
  taxYearPackByLabel,
  taxYearLabelForDate,
  isCurrentTaxYearRegistered,
} from "./taxYears";

const PACK = currentTaxYearPack();

export const UK_TAX_YEAR = PACK.label;

export const ENGLAND_WALES_INCOME_BANDS = PACK.englandWalesIncomeBands;
export const SCOTLAND_INCOME_BANDS = PACK.scotlandIncomeBands;
export const NI_BANDS = PACK.niBands;

export const PERSONAL_ALLOWANCE = PACK.personalAllowance;
export const PA_TAPER_START = PACK.paTaperStart;
export const PA_TAPER_END = PACK.paTaperEnd;
export const BASIC_RATE_THRESHOLD_EW = PACK.basicRateThresholdEW;
export const HIGHER_RATE_THRESHOLD_EW = PACK.higherRateThresholdEW;

export const ISA_ANNUAL_ALLOWANCE = PACK.isaAnnualAllowance;
export const LISA_ANNUAL_ALLOWANCE = PACK.lisaAnnualAllowance;
export const LISA_BONUS_RATE = PACK.lisaBonusRate;
export const LISA_MAX_AGE_CONTRIB = PACK.lisaMaxAgeContrib;
export const LISA_ACCESS_AGE = PACK.lisaAccessAge;

export const PENSION_ANNUAL_ALLOWANCE = PACK.pensionAnnualAllowance;
export const MPAA = PACK.mpaa;
export const ADJUSTED_INCOME_TAPER_THRESHOLD = PACK.adjustedIncomeTaperThreshold;
export const TAPERED_AA_FLOOR = PACK.taperedAaFloor;

export const CGT_ANNUAL_EXEMPT = PACK.cgtAnnualExempt;
export const CGT_BASIC_RATE = PACK.cgtBasicRate;
export const CGT_HIGHER_RATE = PACK.cgtHigherRate;

export const DIVIDEND_ALLOWANCE = PACK.dividendAllowance;
export const DIVIDEND_ORDINARY_RATE = PACK.dividendOrdinaryRate;
export const DIVIDEND_UPPER_RATE = PACK.dividendUpperRate;
export const DIVIDEND_ADDITIONAL_RATE = PACK.dividendAdditionalRate;
export const PSA_BASIC = PACK.psaBasic;
export const PSA_HIGHER = PACK.psaHigher;

export const STATE_PENSION_WEEKLY_FULL = PACK.statePensionWeeklyFull;
export const STATE_PENSION_ANNUAL_FULL = PACK.statePensionAnnualFull;

export const SPA_DEFAULT = PACK.spaDefault;
export const NMPA_PRE_2028 = PACK.nmpaPre2028;
export const NMPA_FROM_2028 = PACK.nmpaFrom2028;

export const HICBC_THRESHOLD = PACK.hicbcThreshold;
export const HICBC_UPPER_BOUND = PACK.hicbcUpperBound;
export const SDLT_BTL_SURCHARGE = PACK.sdltBtlSurcharge;

// PRD §5.2 default economic assumptions — independent of tax year.
export const DEFAULT_CPI = 0.025;
export const DEFAULT_EQUITY_GROWTH_NOMINAL = 0.05;
export const DEFAULT_CASH_RATE = 0.035;
export const DEFAULT_PROPERTY_APPRECIATION = 0.03;
export const DEFAULT_RENTAL_GROWTH = 0.025;
export const DEFAULT_SP_TRIPLE_LOCK = 0.025;
export const DEFAULT_SALARY_GROWTH = 0.025;

export const DEFAULT_SWR = 0.035;
export const DEFAULT_LEAN_PCT = 0.7;
export const DEFAULT_FAT_PCT = 1.5;

// GIA simplified CGT drag (PRD §5.6)
export const DEFAULT_GIA_CGT_DRAG = 0.005;

// BTL defaults (PRD §4 Section F)
export const DEFAULT_BTL_VOID_RATE = 0.05;
export const DEFAULT_BTL_AGENT_FEE = 0.1;
export const DEFAULT_BTL_INSURANCE = 1_000;
export const DEFAULT_BTL_MAINTENANCE_PCT = 0.01;
export const DEFAULT_BTL_INTEREST_RELIEF = 0.2; // Section 24 basic-rate credit

// Mortgage overpayment cap (PRD §5.8.3)
export const DEFAULT_OVERPAYMENT_CAP = 0.1;
