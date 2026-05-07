/**
 * UK 2024/25 tax-year constants. Single source of truth (PRD §14).
 * All band thresholds in £/year; rates as decimals (0.20 = 20%).
 */

export const UK_TAX_YEAR = "2024/25";

export interface TaxBand {
  upperBound: number; // exclusive upper bound; Infinity for top band
  rate: number;
}

// PRD §5.3.1
export const ENGLAND_WALES_INCOME_BANDS: TaxBand[] = [
  { upperBound: 12_570, rate: 0 },
  { upperBound: 50_270, rate: 0.2 },
  { upperBound: 125_140, rate: 0.4 },
  { upperBound: Infinity, rate: 0.45 },
];

// PRD §5.3.2 (Scottish bands)
export const SCOTLAND_INCOME_BANDS: TaxBand[] = [
  { upperBound: 12_570, rate: 0 },
  { upperBound: 14_876, rate: 0.19 },
  { upperBound: 26_561, rate: 0.2 },
  { upperBound: 43_662, rate: 0.21 },
  { upperBound: 75_000, rate: 0.42 },
  { upperBound: 125_140, rate: 0.45 },
  { upperBound: Infinity, rate: 0.48 },
];

// PRD §5.3.3
export const NI_BANDS: TaxBand[] = [
  { upperBound: 12_570, rate: 0 },
  { upperBound: 50_270, rate: 0.08 },
  { upperBound: Infinity, rate: 0.02 },
];

export const PERSONAL_ALLOWANCE = 12_570;
export const PA_TAPER_START = 100_000;
export const PA_TAPER_END = 125_140;

export const BASIC_RATE_THRESHOLD_EW = 50_270;
export const HIGHER_RATE_THRESHOLD_EW = 125_140;

export const ISA_ANNUAL_ALLOWANCE = 20_000;
export const LISA_ANNUAL_ALLOWANCE = 4_000;
export const LISA_BONUS_RATE = 0.25;
export const LISA_MAX_AGE_CONTRIB = 50;
export const LISA_ACCESS_AGE = 60;

export const PENSION_ANNUAL_ALLOWANCE = 60_000;
export const MPAA = 10_000;
export const ADJUSTED_INCOME_TAPER_THRESHOLD = 260_000;
export const TAPERED_AA_FLOOR = 10_000;

export const CGT_ANNUAL_EXEMPT = 3_000;
export const CGT_BASIC_RATE = 0.18;
export const CGT_HIGHER_RATE = 0.24;

export const DIVIDEND_ALLOWANCE = 500;
export const PSA_BASIC = 1_000;
export const PSA_HIGHER = 500;

export const STATE_PENSION_WEEKLY_FULL = 221.2;
export const STATE_PENSION_ANNUAL_FULL = 11_502.4;

export const SPA_DEFAULT = 67;
export const NMPA_PRE_2028 = 55;
export const NMPA_FROM_2028 = 57;

export const HICBC_THRESHOLD = 60_000;

export const SDLT_BTL_SURCHARGE = 0.05; // updated Oct 2024

// PRD §5.2 default economic assumptions
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
