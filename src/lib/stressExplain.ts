import type { MonteCarloVolatilityPrefs } from "@/engine/types";
import {
  DEFAULT_MONTE_CARLO_SEED,
  DEFAULT_MONTE_CARLO_VOLATILITY,
} from "@/engine/montecarlo/defaults";

export const STRESS_VOLATILITY_INTRO =
  "Volatility (σ) is how much each year’s investment return can swing above or below your growth rates in Settings. It is not your expected return — pension, ISA, GIA, and cash growth % stay on the Global assumptions page. Property and rent follow your profile and do not vary here. Inflation wobbles slightly with the cash shock (about half the cash σ around your CPI).";

export const STRESS_VOLATILITY_ASSET_HINTS: Record<
  keyof MonteCarloVolatilityPrefs,
  { label: string; hint: string; example: string }
> = {
  pension: {
    label: "Pension volatility (σ)",
    hint:
      "Typical year-to-year spread around your pension growth %. Default 0.14 (14%) suits diversified equity-heavy pensions; try 0.08–0.12 for conservative mixes.",
    example: "0.14",
  },
  isa: {
    label: "ISA volatility (σ)",
    hint:
      "Spread around your S&S ISA growth %. Often similar to pension; default 0.15 (15%). Cash ISA rates use the cash σ instead.",
    example: "0.15",
  },
  gia: {
    label: "GIA volatility (σ)",
    hint: "Spread around your GIA growth %. Default 0.15 (15%).",
    example: "0.15",
  },
  cash: {
    label: "Cash volatility (σ)",
    hint:
      "Small moves in savings/cash ISA returns. Default 0.02 (2%). Also nudges inflation variability in Monte Carlo paths.",
    example: "0.02",
  },
};

export function formatVolatilityDefaults(): string {
  const d = DEFAULT_MONTE_CARLO_VOLATILITY;
  return `pension ${d.pension.stdev}, ISA ${d.isa.stdev}, GIA ${d.gia.stdev}, cash ${d.cash.stdev}`;
}

export const STRESS_SUCCESS_RATE_HINT =
  "Share of simulated paths where retirement spending is met every year from when you retire until your plan-to age, without meaningful unmet spending (over £1). Optional essential-only mode uses flexible spending on your profile.";

export const STRESS_TERMINAL_WEALTH_HINT =
  "Investable wealth at your plan-to age: pension, ISAs, LISA, GIA, and cash — excluding home and BTL equity. Shown in today’s pounds (real terms), same as the dashboard.";

export const STRESS_PERCENTILE_HINT =
  "P10, P50, and P90 are outcomes across all trials: 10% of paths ended with less than P10, half ended below P50 (median), and 10% ended above P90.";

export const STRESS_TRIALS_HINT =
  "Number of random return paths. More trials smooth the success rate; 1,000 is a practical default.";

export const STRESS_MONTE_CARLO_SEED_HINT =
  "A seed fixes the pseudo-random return paths so Monte Carlo results repeat: same plan, volatility, trials, and seed → same success rate and percentiles. Leave empty to use the built-in default (" +
  DEFAULT_MONTE_CARLO_SEED +
  "). Change the seed (e.g. 1, 2, 99) to see how sensitive your plan is to luck; change trials or volatility to compare fairly. Historical backtest ignores the seed.";

export const STRESS_SETTINGS_DEFAULTS_INTRO =
  "Defaults for the Stress test page. You can still override trials on that page; the seed always comes from here.";

export const STRESS_PLAN_AGE_HINT =
  "Last age included when checking whether spending is funded and when measuring terminal wealth.";
