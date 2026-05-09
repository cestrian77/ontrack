import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProfileStore } from "@/store/useProfileStore";
import { MortgageAmort } from "@/components/charts/MortgageAmort";
import { BTLDashboard } from "@/components/charts/BTLDashboard";
import { NumberInput, Field } from "@/components/forms/Field";
import { Input } from "@/components/ui/input";
import { overpaymentSummary } from "@/engine/property/mortgage";
import { useProjection } from "@/lib/hooks";
import { gbp, pct } from "@/lib/utils";

export default function Property() {
  const profile = useProfileStore((s) => s.profile);
  const update = useProfileStore((s) => s.update);
  const { projection, taxYearPack } = useProjection();
  const [op, setOp] = useState(profile.primaryOverpayment);

  const atRet = useMemo(() => {
    return (
      projection.years.find((y) => y.age === profile.retirementTargetAge) ??
      projection.years[projection.years.length - 1]
    );
  }, [projection.years, profile.retirementTargetAge]);

  const y0 = projection.years[0];

  const btlToday = useMemo(() => {
    const value = profile.btlProperties.reduce((s, p) => s + p.value, 0);
    const debt = profile.btlProperties.reduce((s, p) => s + p.mortgageBalance, 0);
    return { value, debt, equity: Math.max(0, value - debt) };
  }, [profile.btlProperties]);

  const summary = useMemo(
    () =>
      overpaymentSummary(
        {
          principal: profile.primaryMortgage,
          annualRate: profile.primaryMortgageRate,
          termYears: profile.primaryMortgageTermYears,
          type: profile.primaryMortgageType,
        },
        op,
      ),
    [profile, op],
  );

  const primaryEquityToday =
    y0?.primaryEquity ?? Math.max(0, profile.primaryValue - profile.primaryMortgage);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              {profile.primaryLabel?.trim()
                ? `${profile.primaryLabel.trim()} — snapshot`
                : "Primary residence — snapshot"}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Modelled appreciation {pct(profile.primaryAppreciation, 2)} p.a. in today&apos;s money (real terms in the projection).
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Property name" hint="Shown on this page and in exports.">
              <Input
                value={profile.primaryLabel ?? ""}
                onChange={(e) => update({ primaryLabel: e.target.value })}
                placeholder="e.g. Family home"
              />
            </Field>
            <div className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Today
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat label="Property value" value={gbp(profile.primaryValue)} />
              <Stat label="Mortgage (debt)" value={gbp(profile.primaryMortgage)} />
              <Stat label="Equity" value={gbp(primaryEquityToday)} />
            </div>
            {atRet && (
              <>
                <div className="text-xs font-semibold text-foreground uppercase tracking-wider pt-2 border-t">
                  Projected at retirement (age {profile.retirementTargetAge})
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Stat label="Property value" value={gbp(atRet.primaryValue)} />
                  <Stat label="Mortgage (debt)" value={gbp(atRet.primaryMortgageBalance)} />
                  <Stat label="Equity" value={gbp(atRet.primaryEquity)} />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>BTL portfolio — snapshot</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Aggregated value, debt, and equity across buy-to-lets.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Today
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat label="Total value" value={gbp(btlToday.value)} />
              <Stat label="Total debt" value={gbp(btlToday.debt)} />
              <Stat label="Equity" value={gbp(btlToday.equity)} />
            </div>
            {atRet && (
              <>
                <div className="text-xs font-semibold text-foreground uppercase tracking-wider pt-2 border-t">
                  Projected at retirement (age {profile.retirementTargetAge})
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Stat label="Total value" value={gbp(atRet.btlValue)} />
                  <Stat label="Total debt" value={gbp(atRet.btlMortgageBalance)} />
                  <Stat label="Equity" value={gbp(atRet.btlEquity)} />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Primary residence mortgage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Outstanding balance" value={gbp(profile.primaryMortgage)} />
            <Stat label="Rate" value={`${(profile.primaryMortgageRate * 100).toFixed(2)}%`} />
            <Stat label="Term remaining" value={`${profile.primaryMortgageTermYears}y`} />
          </div>

          <Field
            label="Modelled overpayment"
            hint="Default cap 10% of outstanding balance per year. Drag to see the effect."
          >
            <NumberInput
              prefix="£"
              suffix="/mo"
              value={op}
              onChange={(n) => {
                setOp(n);
                update({ primaryOverpayment: n });
              }}
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-3">
            <Stat
              label="Payoff (base)"
              value={`${(summary.baseMonths / 12).toFixed(1)}y`}
            />
            <Stat
              label="Payoff (with overpayment)"
              value={`${(summary.overpayMonths / 12).toFixed(1)}y`}
            />
            <Stat
              label="Interest saved"
              value={gbp(summary.interestSaved)}
              positive
            />
          </div>

          <MortgageAmort profile={profile} overpayment={op} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>BTL portfolio</CardTitle>
        </CardHeader>
        <CardContent>
          <BTLDashboard profile={profile} projection={projection} taxYearPack={taxYearPack} />
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={`text-lg font-semibold tabular-nums mt-1 ${
          positive ? "text-success" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}
