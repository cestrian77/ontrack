import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProjection } from "@/lib/hooks";
import { useProfileStore } from "@/store/useProfileStore";
import { useUiStore } from "@/store/useUiStore";
import { gbp, pct } from "@/lib/utils";
import type { MonteCarloResult } from "@/engine/montecarlo/runMonteCarlo";
import { DISCLAIMER_SHORT } from "@/lib/legalCopy";
import { resolveHouseholdRetirementIncome } from "@/engine/household/householdIncome";
import type { StressRunInput } from "@/lib/monteCarloRunner";
import type { MonteCarloWorkerResponse } from "@/workers/monteCarloWorker";

export default function Stress() {
  const { taxYearPack, analysisProfile, isHouseholdAnalysis } = useProjection();
  const primary = useProfileStore((s) => s.profile);
  const partner = useProfileStore((s) => s.partnerProfile);
  const householdPrefs = useProfileStore((s) => s.householdPrefs);
  const updateHouseholdPrefs = useProfileStore((s) => s.updateHouseholdPrefs);
  const analysisViewMode = useUiStore((s) => s.analysisViewMode);

  const [mode, setMode] = useState<"monte_carlo" | "historical">("monte_carlo");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<MonteCarloResult | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const runIdRef = useRef(0);

  const isHousehold =
    isHouseholdAnalysis &&
    partner != null &&
    (analysisViewMode === "couple" || analysisViewMode === "family");

  const householdTarget = useMemo(() => {
    if (!partner) return analysisProfile.targetRetirementIncome;
    return resolveHouseholdRetirementIncome(primary, partner, householdPrefs);
  }, [primary, partner, householdPrefs, analysisProfile.targetRetirementIncome]);

  const run = useCallback(() => {
    const runId = ++runIdRef.current;
    setRunning(true);
    const input: StressRunInput = {
      primary,
      partner,
      householdPrefs,
      taxYearPack,
      isHousehold,
      mode,
    };

    workerRef.current?.terminate();
    workerRef.current = new Worker(
      new URL("../workers/monteCarloWorker.ts", import.meta.url),
      { type: "module" },
    );
    const w = workerRef.current;

    const onMessage = (ev: MessageEvent<MonteCarloWorkerResponse>) => {
      if (ev.data.type === "result" && ev.data.runId === runId) {
        setResult(ev.data.result);
        setRunning(false);
        w.removeEventListener("message", onMessage);
      }
    };
    w.addEventListener("message", onMessage);
    w.postMessage({ type: "run", runId, input });
  }, [primary, partner, householdPrefs, taxYearPack, isHousehold, mode]);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  const vol = householdPrefs.monteCarloVolatility;
  const historical = mode === "historical";

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 pb-16">
      <div>
        <h1 className="font-display text-display-sm text-on-surface">Stress test</h1>
        <p className="mt-2 text-body-md text-on-surface-variant">
          Monte Carlo and historical paths use the same annual engine as your dashboard. Property
          appreciation stays as in your plan; only investment returns vary by path. {DISCLAIMER_SHORT}
        </p>
        <p className="mt-2 text-body-sm text-on-surface-variant">
          <Link className="text-primary underline" to="/help#stress-testing">
            Stress testing methodology
          </Link>
          {" · "}
          <Link className="text-primary underline" to="/help#career-guardrails-care-iht">
            Career path, guardrails, care &amp; IHT
          </Link>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assumptions</CardTitle>
          <CardDescription>
            {isHousehold
              ? `Household retirement income target: ${gbp(householdTarget)}/yr`
              : `Retirement income target: ${gbp(analysisProfile.targetRetirementIncome)}/yr`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="block text-label-sm text-on-surface-variant">
            Plan to age
            <input
              type="range"
              min={75}
              max={100}
              step={1}
              className="mt-1 w-full"
              value={householdPrefs.planningHorizonAge ?? 100}
              onChange={(e) =>
                updateHouseholdPrefs({ planningHorizonAge: Number(e.target.value) })
              }
            />
            <span className="text-on-surface">{householdPrefs.planningHorizonAge ?? 100}</span>
          </label>

          {!historical && (
            <label className="block text-label-sm text-on-surface-variant">
              Trials
              <input
                type="range"
                min={200}
                max={3000}
                step={100}
                className="mt-1 w-full"
                value={householdPrefs.monteCarloTrials ?? 1000}
                onChange={(e) =>
                  updateHouseholdPrefs({ monteCarloTrials: Number(e.target.value) })
                }
              />
              <span className="text-on-surface">{householdPrefs.monteCarloTrials ?? 1000}</span>
            </label>
          )}

          {historical && (
            <p className="text-body-sm text-on-surface-variant">
              Historical mode runs a single deterministic path through the illustrative UK return
              series (not multiple trials).
            </p>
          )}

          {vol && !historical && (
            <div className="grid gap-3 sm:grid-cols-2">
              {(["pension", "isa", "gia", "cash"] as const).map((key) => (
                <label key={key} className="text-label-sm text-on-surface-variant">
                  {key} volatility (σ)
                  <input
                    type="number"
                    step={0.01}
                    min={0}
                    max={0.5}
                    className="mt-1 w-full rounded-md border border-outline-variant px-2 py-1"
                    value={vol[key].stdev}
                    onChange={(e) =>
                      updateHouseholdPrefs({
                        monteCarloVolatility: {
                          ...vol,
                          [key]: { stdev: Number(e.target.value) },
                        },
                      })
                    }
                  />
                </label>
              ))}
            </div>
          )}

          <label className="flex items-center gap-2 text-label-sm">
            <input
              type="checkbox"
              checked={householdPrefs.successUsesEssentialOnly ?? false}
              onChange={(e) =>
                updateHouseholdPrefs({ successUsesEssentialOnly: e.target.checked })
              }
            />
            Success = essential spending only (when flexible spending is set on profile)
          </label>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={mode === "monte_carlo" ? "default" : "outline"}
              onClick={() => setMode("monte_carlo")}
            >
              Monte Carlo
            </Button>
            <Button
              variant={mode === "historical" ? "default" : "outline"}
              onClick={() => setMode("historical")}
            >
              Historical backtest
            </Button>
            <Button onClick={run} disabled={running}>
              {running ? "Running…" : "Run stress test"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>
              {historical
                ? "Single path through historical return series (illustrative)"
                : `${result.config.trials} simulated paths`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-headline-sm text-on-surface">
              Success rate: {pct(result.successRate * 100, 1)}
            </p>
            {!historical && (
              <p className="text-body-md text-on-surface-variant">
                Terminal investable wealth — P10 {gbp(result.terminalWealthP10)}, P50{" "}
                {gbp(result.terminalWealthP50)}, P90 {gbp(result.terminalWealthP90)}
              </p>
            )}
            {historical && (
              <p className="text-body-md text-on-surface-variant">
                Terminal investable wealth: {gbp(result.terminalWealthP50)}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
