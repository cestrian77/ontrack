/**
 * Per-tax-year UK fiscal constants. Each pack is a frozen snapshot of the
 * thresholds, allowances and rates for a single UK tax year (6 Apr → 5 Apr).
 *
 * Sources are cited in each pack file. Update by adding a new pack and
 * registering it in `taxYears/index.ts` — never mutate an existing pack.
 */

export interface TaxBand {
  /** Exclusive upper bound; Infinity for top band. */
  upperBound: number;
  /** Marginal rate as a decimal (0.20 = 20%). */
  rate: number;
}

export interface TaxYearPack {
  /** Display label, e.g. "2026/27". */
  label: string;
  /** Inclusive start (UK tax year begins 6 April). */
  startsOn: string; // YYYY-MM-DD
  /** Exclusive end (next tax year start, 6 April + 1 year). */
  endsOn: string; // YYYY-MM-DD

  // --- Income tax ---
  englandWalesIncomeBands: TaxBand[];
  scotlandIncomeBands: TaxBand[];
  personalAllowance: number;
  paTaperStart: number;
  paTaperEnd: number;
  basicRateThresholdEW: number;
  higherRateThresholdEW: number;

  // --- National Insurance (employee Class 1, annualised) ---
  niBands: TaxBand[];

  // --- Wrappers ---
  isaAnnualAllowance: number;
  lisaAnnualAllowance: number;
  lisaBonusRate: number;
  lisaMaxAgeContrib: number;
  lisaAccessAge: number;

  // --- Pensions ---
  pensionAnnualAllowance: number;
  mpaa: number;
  adjustedIncomeTaperThreshold: number;
  taperedAaFloor: number;

  // --- CGT ---
  cgtAnnualExempt: number;
  cgtBasicRate: number;
  cgtHigherRate: number;

  // --- Savings & dividends ---
  dividendAllowance: number;
  dividendOrdinaryRate: number;
  dividendUpperRate: number;
  dividendAdditionalRate: number;
  psaBasic: number;
  psaHigher: number;

  // --- State pension (full new state pension) ---
  statePensionWeeklyFull: number;
  statePensionAnnualFull: number;

  // --- Pension access ages ---
  spaDefault: number;
  nmpaPre2028: number;
  nmpaFrom2028: number;

  // --- Other ---
  hicbcThreshold: number;
  hicbcUpperBound: number;
  sdltBtlSurcharge: number;
}
