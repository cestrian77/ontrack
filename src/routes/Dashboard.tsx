import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProfileStore } from "@/store/useProfileStore";
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
import { gbp } from "@/lib/utils";
import { InsightRepo } from "@/db/repository";

export default function Dashboard() {
  const profile = useProfileStore((s) => s.profile);
  const { projection, fire } = useProjection();
  const allScenarios = useScenarioStore((s) => s.scenarios);
  const selectedIds = useUiStore((s) => s.selectedScenarioIds);
  const selectedScenarios = useMemo(
    () => allScenarios.filter((s) => selectedIds.includes(s.id)).slice(0, 3),
    [allScenarios, selectedIds],
  );

  const { dismissed, reload } = useDismissedInsights();
  const insights = useMemo(() => {
    return generateInsights({ profile, projection, fire }).filter(
      (i) => !dismissed.has(i.id),
    );
  }, [profile, projection, fire, dismissed]);

  const dismiss = async (id: string) => {
    await InsightRepo.dismiss(id);
    await reload();
  };

  const atRet = projection.years.find((y) => y.age === profile.retirementTargetAge);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Net worth today" value={gbp(projection.years[0]?.totalNetWorth ?? 0)} />
        <Stat label="Net worth at retirement" value={gbp(atRet?.totalNetWorth ?? 0)} />
        <Stat label="FIRE number" value={gbp(fire.fireNumber)} />
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
            profile={profile}
            projection={projection}
            scenarios={selectedScenarios}
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
          <CashflowChart profile={profile} projection={projection} height={300} />
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
          <AssetProjectionTables projection={projection} cpi={profile.cpi} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>FIRE progress</CardTitle>
          </CardHeader>
          <CardContent>
            <FireRing fire={fire} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Retirement income</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              At age {profile.retirementTargetAge}: composition of retirement income vs target.
            </p>
          </CardHeader>
          <CardContent>
            <IncomeStack profile={profile} projection={projection} />
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
            <AllocationDonut profile={profile} projection={projection} />
          </CardContent>
        </Card>
        <div className="lg:col-span-2">
          <TaxDashboard profile={profile} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="text-2xl font-semibold tabular-nums mt-1">{value}</div>
      </CardContent>
    </Card>
  );
}
