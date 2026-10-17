import type { MonteCarloVolatilityPrefs } from "@/engine/types";

/** Product defaults — editable per asset class in settings. */
export const DEFAULT_MONTE_CARLO_VOLATILITY: MonteCarloVolatilityPrefs = {
  pension: { stdev: 0.14 },
  isa: { stdev: 0.15 },
  gia: { stdev: 0.15 },
  cash: { stdev: 0.02 },
};

export const DEFAULT_PLANNING_HORIZON_AGE = 100;
export const DEFAULT_MONTE_CARLO_TRIALS = 1000;
