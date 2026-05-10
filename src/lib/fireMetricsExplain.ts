/** Tooltip / inline help: FIRE ring, header, dashboard stats */
export const FIRE_PROGRESS_TOOLTIP =
  "FIRE progress is your FIRE pot today divided by your effective FIRE number. By default the pot is all investable wealth (pensions, ISAs, GIA, cash) excluding property equity. You can change which balances count and net off State Pension, DB income, or BTL profit under Settings → FIRE calculation.";

export const NET_WORTH_TOTAL_TOOLTIP =
  "Total net worth is investable assets plus primary and buy-to-let property equity.";

export const FIRE_NUMBER_TOOLTIP =
  "Classic headline: target retirement income ÷ safe withdrawal rate. The dashboard can also show an effective FIRE number that nets off selected passive income (see FIRE page). Progress always uses the effective figure and your chosen FIRE pot.";

export const FIRE_AGE_TOOLTIP =
  "First projected age at which your FIRE pot reaches your effective FIRE number. Uses the same pot definition as FIRE progress.";

/** PDF: rendered under Dashboard summary */
export const REPORT_DASHBOARD_FOOTNOTES = [
  "Net worth today and at retirement are total net worth (investable balances plus primary and buy-to-let property equity).",
  "FIRE progress and FIRE age use your FIRE pot and effective FIRE number (Settings → FIRE calculation). Classic FIRE number is target income ÷ SWR before passive offsets.",
] as const;

/** PDF: rendered under Scenarios comparison when FIRE fields appear */
export const REPORT_SCENARIO_FIRE_FOOTNOTES = [
  "FIRE age and effective FIRE number use the same FIRE pot and income-offset rules as the dashboard (from the profile used for each scenario).",
] as const;

/** PDF: FIRE detail section (matches FIRE page metrics) */
export const REPORT_FIRE_DETAIL_FOOTNOTES = [
  "FIRE progress and FIRE age use your FIRE pot and effective FIRE number (Settings → FIRE calculation). Classic FIRE number is target income ÷ SWR before passive offsets.",
  "Lean/Fat/Coast/Barista targets use effective numbers where applicable; Coast FIRE is only shown when pensions are included in your FIRE pot.",
] as const;
