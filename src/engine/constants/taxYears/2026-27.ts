import type { TaxYearPack } from "./types";

/**
 * UK tax year 2026/27 (6 Apr 2026 – 5 Apr 2027).
 *
 * Sources:
 * - HMRC Annex A: rates and allowances (Budget 2025 OOTLAR, gov.uk)
 *   https://www.gov.uk/government/publications/budget-2025-overview-of-tax-legislation-and-rates-ootlar/annex-a-rates-and-allowances
 * - Scottish Budget 2026/27 — Starter rate band raised to £16,537; Basic rate
 *   band edge raised to £29,526; higher/advanced/top thresholds frozen
 *   https://www.gov.scot/publications/scottish-income-tax-technical-factsheet/
 * - DWP State Pension uprating Apr 2026: full new state pension £241.30/wk
 *   (£12,547.60/yr) — 4.8% triple-lock increase
 * - Income tax bands, PA, NI rates and UEL, ISA, LISA, Pension AA, MPAA, CGT,
 *   PSA, HICBC all frozen (Income Tax thresholds frozen until 2028; ISA/LISA
 *   frozen until 2031)
 * - Dividend tax rates increased from 6 Apr 2026: ordinary 8.75% → 10.75%,
 *   upper 33.75% → 35.75%, additional 39.35% (unchanged)
 * - Dividend allowance unchanged at £500
 */
export const TAX_YEAR_2026_27: TaxYearPack = {
  label: "2026/27",
  startsOn: "2026-04-06",
  endsOn: "2027-04-06",

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
    { upperBound: 50_270, rate: 0.2 },
    { upperBound: 125_140, rate: 0.4 },
    { upperBound: Infinity, rate: 0.45 },
  ],
  scotlandPropertyIncomeBands: [
    { upperBound: 12_570, rate: 0 },
    { upperBound: 16_537, rate: 0.19 },
    { upperBound: 29_526, rate: 0.2 },
    { upperBound: 43_662, rate: 0.21 },
    { upperBound: 75_000, rate: 0.42 },
    { upperBound: 125_140, rate: 0.45 },
    { upperBound: Infinity, rate: 0.48 },
  ],
  btlSection24CreditRate: 0.2,
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
