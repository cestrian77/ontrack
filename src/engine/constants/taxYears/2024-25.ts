import type { TaxYearPack } from "./types";

/**
 * UK tax year 2024/25 (6 Apr 2024 – 5 Apr 2025).
 *
 * Sources:
 * - HMRC Income Tax rates and Personal Allowances (gov.uk)
 * - Scottish Budget 2024/25 (gov.scot)
 * - Pension Schemes rates (gov.uk)
 * - Capital Gains Tax rates 2024/25 (annual exempt £3,000 from Apr 2024)
 * - SDLT additional dwelling surcharge raised from 3% → 5% on 31 Oct 2024
 * - State Pension full new rate £221.20/wk (Apr 2024 uprating, +8.5%)
 */
export const TAX_YEAR_2024_25: TaxYearPack = {
  label: "2024/25",
  startsOn: "2024-04-06",
  endsOn: "2025-04-06",

  englandWalesIncomeBands: [
    { upperBound: 12_570, rate: 0 },
    { upperBound: 50_270, rate: 0.2 },
    { upperBound: 125_140, rate: 0.4 },
    { upperBound: Infinity, rate: 0.45 },
  ],
  scotlandIncomeBands: [
    { upperBound: 12_570, rate: 0 },
    { upperBound: 14_876, rate: 0.19 },
    { upperBound: 26_561, rate: 0.2 },
    { upperBound: 43_662, rate: 0.21 },
    { upperBound: 75_000, rate: 0.42 },
    { upperBound: 125_140, rate: 0.45 },
    { upperBound: Infinity, rate: 0.48 },
  ],
  personalAllowance: 12_570,
  paTaperStart: 100_000,
  paTaperEnd: 125_140,
  basicRateThresholdEW: 50_270,
  higherRateThresholdEW: 125_140,

  niBands: [
    { upperBound: 12_570, rate: 0 },
    { upperBound: 50_270, rate: 0.08 },
    { upperBound: Infinity, rate: 0.02 },
  ],

  isaAnnualAllowance: 20_000,
  lisaAnnualAllowance: 4_000,
  lisaBonusRate: 0.25,
  lisaMaxAgeContrib: 50,
  lisaAccessAge: 60,

  pensionAnnualAllowance: 60_000,
  mpaa: 10_000,
  adjustedIncomeTaperThreshold: 260_000,
  taperedAaFloor: 10_000,

  cgtAnnualExempt: 3_000,
  cgtBasicRate: 0.18,
  cgtHigherRate: 0.24,

  dividendAllowance: 500,
  dividendOrdinaryRate: 0.0875,
  dividendUpperRate: 0.3375,
  dividendAdditionalRate: 0.3935,
  psaBasic: 1_000,
  psaHigher: 500,

  statePensionWeeklyFull: 221.2,
  statePensionAnnualFull: 11_502.4,

  spaDefault: 67,
  nmpaPre2028: 55,
  nmpaFrom2028: 57,

  hicbcThreshold: 60_000,
  hicbcUpperBound: 80_000,
  sdltBtlSurcharge: 0.05,
};
