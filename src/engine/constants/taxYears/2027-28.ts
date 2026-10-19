import type { TaxYearPack } from "./types";

/**
 * UK tax year 2027/28 (6 Apr 2027 – 5 Apr 2028).
 *
 * Sources:
 * - Property income rates 22% / 42% / 47% and Section 24 credit at 22% from 6 Apr 2027
 *   https://www.gov.uk/government/publications/income-tax-changes-to-tax-rates-for-property-savings-and-dividend-income/income-tax-changes-to-tax-rates-for-property-savings-and-dividend-income
 * - Income tax / NI / ISA / pension thresholds: frozen as 2026/27 (Budget 2025 OOTLAR)
 * - Scottish property rates: +2pp on Scottish income tax band rates (devolved; confirm when published)
 * - PA / relief ordering for property vs other income is not modelled in BTL cashflow yet
 */
export const TAX_YEAR_2027_28: TaxYearPack = {
  label: "2027/28",
  startsOn: "2027-04-06",
  endsOn: "2028-04-06",

  englandWalesIncomeBands: [
    { upperBound: 12_570, rate: 0 },
    { upperBound: 50_270, rate: 0.2 },
    { upperBound: 125_140, rate: 0.4 },
    { upperBound: Infinity, rate: 0.45 },
  ],
  scotlandIncomeBands: [
    { upperBound: 12_570, rate: 0 },
    { upperBound: 16_537, rate: 0.19 },
    { upperBound: 29_526, rate: 0.2 },
    { upperBound: 43_662, rate: 0.21 },
    { upperBound: 75_000, rate: 0.42 },
    { upperBound: 125_140, rate: 0.45 },
    { upperBound: Infinity, rate: 0.48 },
  ],
  englandWalesPropertyIncomeBands: [
    { upperBound: 12_570, rate: 0 },
    { upperBound: 50_270, rate: 0.22 },
    { upperBound: 125_140, rate: 0.42 },
    { upperBound: Infinity, rate: 0.47 },
  ],
  scotlandPropertyIncomeBands: [
    { upperBound: 12_570, rate: 0 },
    { upperBound: 16_537, rate: 0.21 },
    { upperBound: 29_526, rate: 0.22 },
    { upperBound: 43_662, rate: 0.23 },
    { upperBound: 75_000, rate: 0.44 },
    { upperBound: 125_140, rate: 0.47 },
    { upperBound: Infinity, rate: 0.5 },
  ],
  btlSection24CreditRate: 0.22,
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
  lisaMaxAgeOpen: 40,
  lisaAccessAge: 60,

  pensionAnnualAllowance: 60_000,
  mpaa: 10_000,
  adjustedIncomeTaperThreshold: 260_000,
  taperedAaFloor: 10_000,

  cgtAnnualExempt: 3_000,
  cgtBasicRate: 0.18,
  cgtHigherRate: 0.24,

  dividendAllowance: 500,
  dividendOrdinaryRate: 0.1075,
  dividendUpperRate: 0.3575,
  dividendAdditionalRate: 0.3935,
  psaBasic: 1_000,
  psaHigher: 500,

  statePensionWeeklyFull: 241.3,
  statePensionAnnualFull: 12_547.6,

  spaDefault: 67,
  nmpaPre2028: 55,
  nmpaFrom2028: 57,

  hicbcThreshold: 60_000,
  hicbcUpperBound: 80_000,
  sdltBtlSurcharge: 0.05,
};
