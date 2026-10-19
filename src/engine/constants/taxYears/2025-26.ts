import type { TaxYearPack } from "./types";

/**
 * UK tax year 2025/26 (6 Apr 2025 – 5 Apr 2026).
 *
 * Sources:
 * - HMRC "Rates and thresholds for employers 2025 to 2026"
 * - Scottish Income Tax 2025/26 factsheet (gov.scot) — starter and basic rate
 *   bands widened; higher/advanced/top rates and thresholds frozen
 * - DWP "Benefit and pension rates 2025 to 2026" — new State Pension £230.25/wk
 *   (4.1% triple-lock uprating from £221.20)
 * - Personal Allowance, basic-rate limit, higher-rate threshold, NI rates,
 *   ISA, LISA, Pension AA, MPAA, CGT, dividend tax, PSA all frozen
 * - SDLT additional dwelling surcharge remains 5% (raised 31 Oct 2024)
 */
export const TAX_YEAR_2025_26: TaxYearPack = {
  label: "2025/26",
  startsOn: "2025-04-06",
  endsOn: "2026-04-06",

  englandWalesIncomeBands: [
    { upperBound: 12_570, rate: 0 },
    { upperBound: 50_270, rate: 0.2 },
    { upperBound: 125_140, rate: 0.4 },
    { upperBound: Infinity, rate: 0.45 },
  ],
  scotlandIncomeBands: [
    { upperBound: 12_570, rate: 0 },
    { upperBound: 15_397, rate: 0.19 },
    { upperBound: 27_491, rate: 0.2 },
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
    { upperBound: 15_397, rate: 0.19 },
    { upperBound: 27_491, rate: 0.2 },
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
  dividendOrdinaryRate: 0.0875,
  dividendUpperRate: 0.3375,
  dividendAdditionalRate: 0.3935,
  psaBasic: 1_000,
  psaHigher: 500,

  statePensionWeeklyFull: 230.25,
  statePensionAnnualFull: 11_973,

  spaDefault: 67,
  nmpaPre2028: 55,
  nmpaFrom2028: 57,

  hicbcThreshold: 60_000,
  hicbcUpperBound: 80_000,
  sdltBtlSurcharge: 0.05,
};
