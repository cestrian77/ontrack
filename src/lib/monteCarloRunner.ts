import type { TaxYearPack } from "@/engine/constants/taxYears";
import type { HouseholdPrefs, UserProfile } from "@/engine/types";
import { combineProjections } from "@/engine/household/combineProjections";
import { resolveHouseholdRetirementIncome } from "@/engine/household/householdIncome";
import { generateStochasticScenario } from "@/engine/montecarlo/generatePath";
import {
  DEFAULT_MONTE_CARLO_SEED,
  DEFAULT_MONTE_CARLO_TRIALS,
  DEFAULT_MONTE_CARLO_VOLATILITY,
  DEFAULT_PLANNING_HORIZON_AGE,
} from "@/engine/montecarlo/defaults";
import { runMonteCarlo, type MonteCarloResult } from "@/engine/montecarlo/runMonteCarlo";
import { evaluatePathSuccess } from "@/engine/montecarlo/success";
import { mulberry32 } from "@/engine/montecarlo/rng";
import { runProjection } from "@/engine/project/runProjection";
import { historicalScenarioFromProfile } from "@/engine/historical/data";

export interface StressRunInput {
  primary: UserProfile;
  partner: UserProfile | null;
  householdPrefs: HouseholdPrefs;
  taxYearPack: TaxYearPack;
  freezeTaxYearPack?: boolean;
  isHousehold: boolean;
  mode: "monte_carlo" | "historical";
}

function projectionOpts(
  input: StressRunInput,
  extra?: { economicScenario?: ReturnType<typeof historicalScenarioFromProfile>; planningHorizonAge: number },
) {
  return {
    taxYearPack: input.taxYearPack,
    freezeTaxYearPack: input.freezeTaxYearPack ?? false,
    planningHorizonAge: extra?.planningHorizonAge,
    economicScenario: extra?.economicScenario,
  };
}

function historicalSingleResult(
  projection: ReturnType<typeof runProjection>,
  config: MonteCarloResult["config"],
): MonteCarloResult {
  const ev = evaluatePathSuccess(projection, {
    planningHorizonAge: config.planningHorizonAge,
    essentialOnly: config.essentialOnly,
    householdSpendingTarget: config.householdSpendingTarget,
  });
  const terminal = projection.years.at(-1)?.investableNetWorth ?? 0;
  const path = {
    success: ev.success,
    firstFailureAge: ev.firstFailureAge,
    minFundedRatio: ev.minFundedRatio,
    terminalWealth: terminal,
  };
  return {
    config: { ...config, trials: 1 },
    successRate: ev.success ? 1 : 0,
    paths: [path],
    terminalWealthP10: terminal,
    terminalWealthP50: terminal,
    terminalWealthP90: terminal,
  };
}

export function runStressAnalysis(input: StressRunInput): MonteCarloResult {
  const prefs = input.householdPrefs;
  const volatility = prefs.monteCarloVolatility ?? DEFAULT_MONTE_CARLO_VOLATILITY;
  const planningHorizonAge = prefs.planningHorizonAge ?? DEFAULT_PLANNING_HORIZON_AGE;
  const trials =
    input.mode === "historical" ? 1 : (prefs.monteCarloTrials ?? DEFAULT_MONTE_CARLO_TRIALS);
  const seed = prefs.monteCarloSeed ?? DEFAULT_MONTE_CARLO_SEED;

  const baseConfig = {
    trials,
    seed,
    volatility,
    planningHorizonAge,
    essentialOnly: prefs.successUsesEssentialOnly,
  };

  if (input.mode === "historical") {
    const proj0 = runProjection(input.primary, projectionOpts(input, { planningHorizonAge }));
    const startYear = proj0.years[0]?.year ?? new Date().getFullYear();
    const yearCount = proj0.years.length;
    const scenario = historicalScenarioFromProfile(input.primary, startYear, yearCount);

    if (!input.isHousehold || !input.partner) {
      const projection = runProjection(
        input.primary,
        projectionOpts(input, { economicScenario: scenario, planningHorizonAge }),
      );
      return historicalSingleResult(projection, baseConfig);
    }

    const householdTarget = resolveHouseholdRetirementIncome(
      input.primary,
      input.partner,
      prefs,
    );
    const projA = runProjection(
      input.primary,
      projectionOpts(input, { economicScenario: scenario, planningHorizonAge }),
    );
    const projB = runProjection(
      input.partner,
      projectionOpts(input, { economicScenario: scenario, planningHorizonAge }),
    );
    const projection = combineProjections(projA, projB, {
      primary: input.primary,
      partner: input.partner,
    });
    return historicalSingleResult(projection, {
      ...baseConfig,
      householdSpendingTarget: householdTarget,
    });
  }

  if (!input.isHousehold || !input.partner) {
    return runMonteCarlo(input.primary, input.taxYearPack, {
      trials,
      seed,
      volatility,
      planningHorizonAge,
      essentialOnly: prefs.successUsesEssentialOnly,
      freezeTaxYearPack: input.freezeTaxYearPack,
    });
  }

  const householdTarget = resolveHouseholdRetirementIncome(
    input.primary,
    input.partner,
    prefs,
  );
  const rng = mulberry32(seed);
  const paths = [];
  const proj0 = runProjection(input.primary, projectionOpts(input, { planningHorizonAge }));
  const yearCount = proj0.years.length;
  const startYear = proj0.years[0]?.year ?? new Date().getFullYear();

  for (let t = 0; t < trials; t++) {
    const scenario = generateStochasticScenario(
      input.primary,
      startYear,
      yearCount,
      volatility,
      rng,
    );
    const projA = runProjection(
      input.primary,
      projectionOpts(input, { economicScenario: scenario, planningHorizonAge }),
    );
    const projB = runProjection(
      input.partner,
      projectionOpts(input, { economicScenario: scenario, planningHorizonAge }),
    );
    const projection = combineProjections(projA, projB, {
      primary: input.primary,
      partner: input.partner,
    });
    const ev = evaluatePathSuccess(projection, {
      planningHorizonAge,
      essentialOnly: prefs.successUsesEssentialOnly,
      householdSpendingTarget: householdTarget,
    });
    paths.push({
      success: ev.success,
      firstFailureAge: ev.firstFailureAge,
      minFundedRatio: ev.minFundedRatio,
      terminalWealth: projection.years.at(-1)?.investableNetWorth ?? 0,
    });
  }

  const successes = paths.filter((p) => p.success).length;
  const terminals = paths.map((p) => p.terminalWealth).sort((a, b) => a - b);
  const pct = (p: number) =>
    terminals.length ? terminals[Math.floor(p * (terminals.length - 1))] : 0;

  return {
    config: {
      trials,
      seed,
      volatility,
      planningHorizonAge,
      essentialOnly: prefs.successUsesEssentialOnly,
      householdSpendingTarget: householdTarget,
    },
    successRate: successes / trials,
    paths,
    terminalWealthP10: pct(0.1),
    terminalWealthP50: pct(0.5),
    terminalWealthP90: pct(0.9),
  };
}
