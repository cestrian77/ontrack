import {
  ISA_ANNUAL_ALLOWANCE,
  PENSION_ANNUAL_ALLOWANCE,
  CGT_ANNUAL_EXEMPT,
  DIVIDEND_ALLOWANCE,
  PSA_BASIC,
} from "@/engine/constants/uk";
import { incomeTax, marginalIncomeRate } from "@/engine/tax/incomeTax";
import { nationalInsurance } from "@/engine/tax/ni";
import { workplaceContribAnnual, sippGrossAnnual } from "@/engine/pension/contributions";
import type { UserProfile } from "@/engine/types";
import { gbp, pct } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  profile: UserProfile;
}

export function TaxDashboard({ profile }: Props) {
  const tax = incomeTax(profile.grossSalary, profile.region);
  const ni = nationalInsurance(profile.grossSalary);
  const net = profile.grossSalary - tax - ni;
  const wp = workplaceContribAnnual(
    profile.grossSalary,
    profile.employeeContribPct,
    profile.employerContribPct,
  );
  const sipp = sippGrossAnnual(profile.sippMonthly);
  const totalPensionContrib = wp.total + sipp;
  const isaContribAnnual =
    profile.ssIsaMonthly * 12 + profile.lisaMonthly * 12;
  const marginal = marginalIncomeRate(profile.grossSalary, profile.region);

  const reliefSaved = sipp * Math.max(0, marginal - 0); // total relief on SIPP
  const isaEquivalent = sipp * 0; // ISA gets no relief

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Allowance usage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <AllowanceBar label="ISA" used={isaContribAnnual} cap={ISA_ANNUAL_ALLOWANCE} />
          <AllowanceBar label="Pension AA" used={totalPensionContrib} cap={PENSION_ANNUAL_ALLOWANCE} />
          <AllowanceBar label="CGT exempt" used={0} cap={CGT_ANNUAL_EXEMPT} />
          <AllowanceBar label="Dividend" used={0} cap={DIVIDEND_ALLOWANCE} />
          <AllowanceBar label="Personal Savings" used={0} cap={PSA_BASIC} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Income breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Gross salary" value={gbp(profile.grossSalary)} />
          <Row label="Income tax" value={gbp(tax)} muted />
          <Row label="National Insurance" value={gbp(ni)} muted />
          <Row label="Net take-home" value={gbp(net)} bold />
          <Row label="Marginal rate" value={pct(marginal)} muted />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Pension tax relief</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Workplace contrib" value={gbp(wp.total)} />
          <Row label="SIPP gross (incl. relief)" value={gbp(sipp)} />
          <Row label="Total pension contrib" value={gbp(totalPensionContrib)} bold />
          <Row
            label="Tax relief saved (vs ISA)"
            value={gbp(reliefSaved - isaEquivalent)}
            positive
          />
          <p className="text-xs text-muted-foreground pt-2">
            Net cost of £100 contributed: basic rate £80 · higher rate £60 · additional rate £55.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function AllowanceBar({ label, used, cap }: { label: string; used: number; cap: number }) {
  const ratio = Math.min(1, used / cap);
  const colour = ratio > 0.95 ? "bg-destructive" : ratio > 0.8 ? "bg-warning" : "bg-primary";
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums">
          {gbp(used)} / {gbp(cap)}
        </span>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <div className={`h-full ${colour}`} style={{ width: `${ratio * 100}%` }} />
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  muted,
  bold,
  positive,
}: {
  label: string;
  value: string;
  muted?: boolean;
  bold?: boolean;
  positive?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={[
          "tabular-nums",
          bold ? "font-semibold" : "",
          positive ? "text-success" : "",
          muted && !bold ? "text-foreground/80" : "",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}
