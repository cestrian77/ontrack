/** Tooltip / inline help: FIRE ring, header, dashboard stats */
export const FIRE_PROGRESS_TOOLTIP =
  "FIRE progress is investable wealth today divided by your FIRE number. Investable wealth is pensions, ISAs, GIA, and cash. It excludes primary home and buy-to-let equity, which are still included in total net worth.";

export const NET_WORTH_TOTAL_TOOLTIP =
  "Total net worth is investable assets plus primary and buy-to-let property equity.";

export const FIRE_NUMBER_TOOLTIP =
  "Target retirement income divided by your safe withdrawal rate. FIRE progress compares investable wealth to this figure, not total net worth.";

export const FIRE_AGE_TOOLTIP =
  "First projected age at which investable wealth reaches your FIRE number. Uses the same investable definition as FIRE progress.";

/** PDF: rendered under Dashboard summary */
export const REPORT_DASHBOARD_FOOTNOTES = [
  "Net worth today and at retirement are total net worth (investable balances plus primary and buy-to-let property equity).",
  "FIRE number, FIRE progress, and FIRE age are based on investable wealth only (pensions, ISAs, GIA, cash), excluding property equity.",
] as const;

/** PDF: rendered under Scenarios comparison when FIRE fields appear */
export const REPORT_SCENARIO_FIRE_FOOTNOTES = [
  "FIRE age and FIRE number in each scenario use the same investable-wealth definitions as the dashboard summary.",
] as const;
