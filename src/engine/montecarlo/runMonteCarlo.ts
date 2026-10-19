import type { TaxYearPack } from "@/engine/constants/taxYears";
import type { Projection, UserProfile } from "@/engine/types";
import { runProjection } from "@/engine/project/runProjection";
import { generateStochasticScenario } from "./generatePath";
import { mulberry32 } from "./rng";
import { evaluatePathSuccess, type SuccessEvaluationOptions } from "./success";
import type { MonteCarloVolatilityPrefs } from "@/engine/types";
import {
  DEFAULT_MONTE_CARLO_TRIALS,
  DEFAULT_MONTE_CARLO_VOLATILITY,
  DEFAULT_PLANNING_HORIZON_AGE,
} from "./defaults";

export interface MonteCarloConfig {
  trials: number;
  seed: number;
  volatility: MonteCarloVolatilityPrefs;
  planningHorizonAge: number;
  essentialOnly?: boolean;
  householdSpendingTarget?: number;
  asOfDate?: string;
  freezeTaxYearPack?: boolean;
}

export interface MonteCarloPathSummary {
  success: boolean;
  firstFailureAge: number | null;
  minFundedRatio: number;
  terminalWealth: number;
}

export interface MonteCarloResult {
  config: MonteCarloConfig;
  successRate: number;
  paths: MonteCarloPathSummary[];
  /** Terminal investable wealth percentiles (real £). */
  terminalWealthP10: number;
  terminalWealthP50: number;
  terminalWealthP90: number;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor(p * (sorted.length - 1)));
  return sorted[idx];
}

export function runMonteCarlo(
  profile: UserProfile,
  taxYearPack: TaxYearPack,
  config: Partial<MonteCarloConfig> = {},
  onProgress?: (done: number, total: number) => void,
): MonteCarloResult {
  const trials = config.trials ?? DEFAULT_MONTE_CARLO_TRIALS;
  const seed = config.seed ?? 42;
  const volatility = config.volatility ?? DEFAULT_MONTE_CARLO_VOLATILITY;
  const planningHorizonAge = config.planningHorizonAge ?? DEFAULT_PLANNING_HORIZON_AGE;
  const fullConfig: MonteCarloConfig = {
    trials,
    seed,
    volatility,
    planningHorizonAge,
    essentialOnly: config.essentialOnly,
    householdSpendingTarget: config.householdSpendingTarget,
    asOfDate: config.asOfDate,
  };

  const rng = mulberry32(seed);
  const paths: MonteCarloPathSummary[] = [];
  const asOf = config.asOfDate;
  const startYear = asOf
    ? new Date(`${asOf}T12:00:00Z`).getUTCFullYear()
    : new Date().getUTCFullYear();
  const freezeTaxYearPack = config.freezeTaxYearPack ?? false;
  const proj0 = runProjection(profile, {
    taxYearPack,
    freezeTaxYearPack,
    asOfDate: asOf,
    planningHorizonAge,
  });
  const yearCount = proj0.years.length;

  for (let t = 0; t < trials; t++) {
    const scenario = generateStochasticScenario(
      profile,
      startYear,
      yearCount,
      volatility,
      rng,
    );
    const projection = runProjection(profile, {
      taxYearPack,
      freezeTaxYearPack,
      asOfDate: asOf,
      economicScenario: scenario,
      planningHorizonAge,
    });
    const evalOpts: SuccessEvaluationOptions = {
      planningHorizonAge,
      essentialOnly: config.essentialOnly,
      householdSpendingTarget: config.householdSpendingTarget,
    };
    const ev = evaluatePathSuccess(projection, evalOpts);
    const terminal = projection.years[projection.years.length - 1]?.investableNetWorth ?? 0;
    paths.push({
      success: ev.success,
      firstFailureAge: ev.firstFailureAge,
      minFundedRatio: ev.minFundedRatio,
      terminalWealth: terminal,
    });
    onProgress?.(t + 1, trials);
  }

  const successes = paths.filter((p) => p.success).length;
  const terminals = paths.map((p) => p.terminalWealth).sort((a, b) => a - b);

  return {
    config: fullConfig,
    successRate: successes / trials,
    paths,
    terminalWealthP10: percentile(terminals, 0.1),
    terminalWealthP50: percentile(terminals, 0.5),
    terminalWealthP90: percentile(terminals, 0.9),
  };
}

/** Run MC on pre-built projection runner (e.g. household combine). */
export function runMonteCarloOnProjection(
  runOnePath: (trialIndex: number, rng: () => number) => Projection,
  config: MonteCarloConfig,
  evalOpts: SuccessEvaluationOptions,
  onProgress?: (done: number, total: number) => void,
): MonteCarloResult {
  const rng = mulberry32(config.seed);
  const paths: MonteCarloPathSummary[] = [];
  for (let t = 0; t < config.trials; t++) {
    const projection = runOnePath(t, rng);
    const ev = evaluatePathSuccess(projection, evalOpts);
    const terminal = projection.years[projection.years.length - 1]?.investableNetWorth ?? 0;
    paths.push({
      success: ev.success,
      firstFailureAge: ev.firstFailureAge,
      minFundedRatio: ev.minFundedRatio,
      terminalWealth: terminal,
    });
    onProgress?.(t + 1, config.trials);
  }
  const successes = paths.filter((p) => p.success).length;
  const terminals = paths.map((p) => p.terminalWealth).sort((a, b) => a - b);
  return {
    config,
    successRate: successes / config.trials,
    paths,
    terminalWealthP10: percentile(terminals, 0.1),
    terminalWealthP50: percentile(terminals, 0.5),
    terminalWealthP90: percentile(terminals, 0.9),
  };
}
