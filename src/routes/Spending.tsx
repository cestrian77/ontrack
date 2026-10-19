import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProfileStore } from "@/store/useProfileStore";
import { useUiStore } from "@/store/useUiStore";
import { baseTaxYearPack } from "@/lib/taxYearContext";
import { compileHouseholdBudget } from "@/engine/household/budget/compile";
import { applyHouseholdBudgetToPlan } from "@/engine/household/budget/apply";
import { BudgetLinesTable } from "@/components/budget/BudgetLinesTable";
import { ChildrenSection } from "@/components/budget/ChildrenSection";
import { gbp } from "@/lib/utils";
import { AnalysisViewSwitch } from "@/components/AnalysisViewSwitch";

export default function Spending() {
  const profile = useProfileStore((s) => s.profile);
  const partnerProfile = useProfileStore((s) => s.partnerProfile);
  const householdBudget = useProfileStore((s) => s.householdBudget);
  const setHouseholdBudget = useProfileStore((s) => s.setHouseholdBudget);
  const update = useProfileStore((s) => s.update);
  const updateHouseholdPrefs = useProfileStore((s) => s.updateHouseholdPrefs);
  const setDependentCount = useProfileStore((s) => s.setDependentCount);
  const analysisTaxYearLabel = useUiStore((s) => s.analysisTaxYearLabel);
  const analysisViewMode = useUiStore((s) => s.analysisViewMode);
  const activePersonId = useUiStore((s) => s.activePersonId);

  const [appliedMsg, setAppliedMsg] = useState<string | null>(null);

  const taxYearPack = useMemo(
    () => baseTaxYearPack(analysisTaxYearLabel),
    [analysisTaxYearLabel],
  );

  const budgetView =
    analysisViewMode === "individual" && activePersonId === "partner"
      ? "partner"
      : analysisViewMode === "individual"
        ? "primary"
        : "household";

  const compiled = useMemo(
    () =>
      compileHouseholdBudget(householdBudget, {
        primary: profile,
        partner: partnerProfile,
        taxYearPack,
        view: budgetView,
      }),
    [householdBudget, profile, partnerProfile, taxYearPack, budgetView, activePersonId],
  );

  const targetRetirement = profile.targetRetirementIncome;
  const delta = compiled.rollupNow.totalAnnual - targetRetirement;

  const applyToPlan = () => {
    const result = applyHouseholdBudgetToPlan(householdBudget, {
      primary: profile,
      partner: partnerProfile,
      taxYearPack,
    });
    update(result.primaryPatch);
    if (result.householdRetirementIncome != null) {
      updateHouseholdPrefs({ householdRetirementIncome: result.householdRetirementIncome });
    }
    setDependentCount(result.dependentCount);
    setHouseholdBudget({
      ...householdBudget,
      lastAppliedAt: new Date().toISOString(),
    });
    setAppliedMsg(
      `Updated retirement spending (${gbp(compiled.rollupNow.totalAnnual)}/yr) and merged ${result.eventsMerged} projection event(s).`,
    );
  };

  return (
    <div className="container py-6 space-y-6 max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-headline-md text-on-surface">Spending</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Build a picture of household costs today and over the next few years. This complements your
            existing FIRE and long-horizon projections — it does not replace them.
          </p>
        </div>
        <AnalysisViewSwitch />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Household budget</CardTitle>
          <CardDescription>
            Real pounds (today&apos;s money). Assign lines to you, your partner, shared costs, or a child.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BudgetLinesTable
            lines={householdBudget.lines}
            children={householdBudget.children}
            hasPartner={partnerProfile != null}
            onChange={(lines) => setHouseholdBudget({ ...householdBudget, lines })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Children</CardTitle>
          <CardDescription>
            Child-linked budget lines can end when they reach &quot;at home until&quot; age. University support is
            optional and illustrative (parental contributions only).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChildrenSection
            children={householdBudget.children}
            onChange={(children) => setHouseholdBudget({ ...householdBudget, children })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3 text-sm">
          <div>
            <p className="text-muted-foreground">Essential / year</p>
            <p className="text-lg font-medium tabular-nums">{gbp(compiled.rollupNow.essentialAnnual)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Discretionary / year</p>
            <p className="text-lg font-medium tabular-nums">
              {gbp(compiled.rollupNow.discretionaryAnnual)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Household total / year</p>
            <p className="text-lg font-medium tabular-nums">{gbp(compiled.rollupNow.totalAnnual)}</p>
          </div>
          {compiled.rollupNow.totalAnnual > 0 && (
            <p className="sm:col-span-3 text-muted-foreground">
              vs retirement target on your profile ({gbp(targetRetirement)}/yr):{" "}
              <span className={delta > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground"}>
                {delta >= 0 ? "+" : ""}
                {gbp(delta)}
              </span>
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Next 5 years (illustrative)</CardTitle>
          <CardDescription>
            Take-home employment income (household) vs budget outgoings; compared with contributions already
            on your profile. Does not change long-horizon projection until you apply below.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground border-b">
              <tr>
                <th className="py-2 pr-3">Year</th>
                <th className="py-2 pr-3">Income</th>
                <th className="py-2 pr-3">Outgoings</th>
                <th className="py-2 pr-3">Surplus</th>
                <th className="py-2 pr-3">Stated investing</th>
                <th className="py-2">Gap</th>
              </tr>
            </thead>
            <tbody>
              {compiled.nearTerm.map((row) => (
                <tr key={row.calendarYear} className="border-b border-border/50">
                  <td className="py-2 pr-3 tabular-nums">{row.calendarYear}</td>
                  <td className="py-2 pr-3 tabular-nums">{gbp(row.incomeAnnual)}</td>
                  <td className="py-2 pr-3 tabular-nums">{gbp(row.outgoingsAnnual)}</td>
                  <td className="py-2 pr-3 tabular-nums">{gbp(row.surplusAnnual)}</td>
                  <td className="py-2 pr-3 tabular-nums">{gbp(row.statedInvestingAnnual)}</td>
                  <td
                    className={`py-2 tabular-nums ${
                      row.gapAnnual < 0 ? "text-amber-600 dark:text-amber-400" : ""
                    }`}
                  >
                    {gbp(row.gapAnnual)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-muted-foreground mt-3">
            Negative gap: budget surplus is below stated ISA/pension contributions — check amounts or unallocated
            spend.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Link to retirement plan</CardTitle>
          <CardDescription>
            Writes essential/discretionary totals to Settings, updates your retirement income target, sets
            household retirement income when you have a partner, and merges timed child/uni costs into projection
            events (retirement-phase spending).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={householdBudget.syncProjectionEvents ?? true}
              onChange={(e) =>
                setHouseholdBudget({ ...householdBudget, syncProjectionEvents: e.target.checked })
              }
            />
            Sync timed costs into projection (timeline events on your profile)
          </label>
          <div className="flex flex-wrap gap-2 items-center">
            <Button type="button" onClick={applyToPlan} disabled={compiled.rollupNow.totalAnnual <= 0}>
              Apply to retirement plan
            </Button>
            <Button variant="outline" asChild>
              <Link to="/fire">View FIRE dashboard</Link>
            </Button>
          </div>
          {appliedMsg && <p className="text-sm text-muted-foreground">{appliedMsg}</p>}
          {householdBudget.lastAppliedAt && (
            <p className="text-xs text-muted-foreground">
              Last applied: {new Date(householdBudget.lastAppliedAt).toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
