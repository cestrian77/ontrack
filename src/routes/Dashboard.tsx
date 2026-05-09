import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useScenarioStore } from "@/store/useScenarioStore";
import { useUiStore } from "@/store/useUiStore";
import { useDismissedInsights, useProjection } from "@/lib/hooks";
import { generateInsights } from "@/engine/insights/insights";
import { WealthJourney } from "@/components/charts/WealthJourney";
import { FireRing } from "@/components/charts/FireRing";
import { IncomeStack } from "@/components/charts/IncomeStack";
import { AllocationDonut } from "@/components/charts/AllocationDonut";
import { TaxDashboard } from "@/components/charts/TaxDashboard";
import { InflationToggle } from "@/components/charts/InflationToggle";
import { CashflowChart } from "@/components/charts/CashflowChart";
import { InsightCard } from "@/components/insights/InsightCard";
import { AssetProjectionTables } from "@/components/projection/AssetProjectionTables";
import { MetricHint } from "@/components/ui/metric-hint";
import {
  FIRE_NUMBER_TOOLTIP,
  FIRE_PROGRESS_TOOLTIP,
  NET_WORTH_TOTAL_TOOLTIP,
} from "@/lib/fireMetricsExplain";
import { gbp } from "@/lib/utils";
import { InsightRepo } from "@/db/repository";
import { HOUSEHOLD_VIEW_FOOTNOTE } from "@/engine/household/semantics";
import { AnalysisViewSwitch } from "@/components/AnalysisViewSwitch";

export default function Dashboard() {
  const {
    projection,
    fire,
    taxYearPack,
    analysisProfile,
    isHouseholdAnalysis,
  } = useProjection();
  const allScenarios = useScenarioStore((s) => s.scenarios);
  const selectedIds = useUiStore((s) => s.selectedScenarioIds);
  const selectedScenarios = useMemo(
    () => allScenarios.filter((s) => selectedIds.includes(s.id)).slice(0, 3),
    [allScenarios, selectedIds],
  );

  const { dismissed, reload } = useDismissedInsights();
  const insights = useMemo(() => {
    return generateInsights({
      profile: analysisProfile,
      projection,
      fire,
      taxYearPack,
    }).filter((i) => !dismissed.has(i.id));
  }, [analysisProfile, projection, fire, taxYearPack, dismissed]);

  const dismiss = async (id: string) => {
    await InsightRepo.dismiss(id);
    await reload();
  };

  const atRet = projection.years.find(
    (y) => y.age === analysisProfile.retirementTargetAge,
  );

  return (
    <div className="space-y-6">
      <div className="lg:hidden">
        <AnalysisViewSwitch />
      </div>
      {isHouseholdAnalysis && (
        <p className="text-xs text-muted-foreground border border-border rounded-md p-3 bg-muted/30">
          {HOUSEHOLD_VIEW_FOOTNOTE}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Net worth today" value={gbp(projection.years[0]?.totalNetWorth ?? 0)} hint={NET_WORTH_TOTAL_TOOLTIP} />
        <Stat
          label="Net worth at retirement"
          value={gbp(atRet?.totalNetWorth ?? 0)}
          hint={NET_WORTH_TOTAL_TOOLTIP}
        />
        <Stat label="FIRE number" value={gbp(fire.fireNumber)} hint={FIRE_NUMBER_TOOLTIP} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
          <div>
            <CardTitle>Wealth journey</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Stacked projection by wrapper to age 100. Markers: retirement target, NMPA, SPA, FIRE number.
            </p>
          </div>
          <InflationToggle />
        </CardHeader>
        <CardContent>
          <WealthJourney
            profile={analysisProfile}
            projection={projection}
            scenarios={isHouseholdAnalysis ? [] : selectedScenarios}
            height={380}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
          <div>
            <CardTitle>Cash flow</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Take-home salary + other income + BTL net while employed; pensions, DB, drawdown and BTL net in retirement. Dashed line is your retirement income target (real/nominal per toggle).
            </p>
          </div>
          <InflationToggle />
        </CardHeader>
        <CardContent>
          <CashflowChart
            profile={analysisProfile}
            projection={projection}
            taxYearPack={taxYearPack}
            height={300}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Year-by-year asset balances</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Raw projection series per wrapper (toggle Real/Nominal in the chart above).
          </p>
        </CardHeader>
        <CardContent>
          <AssetProjectionTables projection={projection} cpi={analysisProfile.cpi} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              FIRE progress
              <MetricHint text={FIRE_PROGRESS_TOOLTIP} />
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Investable wealth vs FIRE number (excludes property equity).
            </p>
          </CardHeader>
          <CardContent>
            <FireRing fire={fire} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Retirement income</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              At age {analysisProfile.retirementTargetAge}: composition of retirement income vs target.
            </p>
          </CardHeader>
          <CardContent>
            <IncomeStack
              profile={analysisProfile}
              projection={projection}
              taxYearPack={taxYearPack}
            />
          </CardContent>
        </Card>
      </div>

      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.slice(0, 3).map((i) => (
              <InsightCard key={i.id} insight={i} onDismiss={dismiss} />
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Asset allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <AllocationDonut profile={analysisProfile} projection={projection} />
          </CardContent>
        </Card>
        <div className="lg:col-span-2">
          <TaxDashboard profile={analysisProfile} taxYearPack={taxYearPack} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-1.5 min-h-[1rem]">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          {hint ? <MetricHint text={hint} /> : null}
        </div>
        <div className="text-2xl font-semibold tabular-nums mt-1">{value}</div>
      </CardContent>
    </Card>
  );
}
