import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProfileStore } from "@/store/useProfileStore";
import { useProjection } from "@/lib/hooks";
import { gbp, pct } from "@/lib/utils";
import { ageFromDob } from "@/engine/project/runProjection";

export default function OnboardingReview() {
  const navigate = useNavigate();
  const { profile, completeOnboarding } = useProfileStore();
  const { fire } = useProjection();
  const age = ageFromDob(profile.dateOfBirth);

  const onFinish = () => {
    completeOnboarding();
    navigate("/dashboard");
  };

  const sections: { title: string; rows: [string, string][]; edit: string }[] = [
    {
      title: "You",
      edit: "/onboard/you",
      rows: [
        ["Current age", `${age}`],
        ["Region", profile.region === "scotland" ? "Scotland" : "England / Wales"],
        ["Retirement target age", `${profile.retirementTargetAge}`],
        ["Target retirement income", gbp(profile.targetRetirementIncome)],
        ["Gross salary", gbp(profile.grossSalary)],
      ],
    },
    {
      title: "Pensions",
      edit: "/onboard/pensions",
      rows: [
        ["Current pot", gbp(profile.pensionPot)],
        ["Employer + employee", `${pct(profile.employerContribPct + profile.employeeContribPct)}`],
        ["SIPP", `${gbp(profile.sippMonthly)}/mo`],
        ["Access age", `${profile.pensionAccessAge}`],
        ...((profile.hasDB
          ? ([
              ["DB income", `${gbp(profile.dbAnnualIncome)} from age ${profile.dbNRA}`],
            ] as [string, string][])
          : ([] as [string, string][]))),
      ],
    },
    {
      title: "ISA & investments",
      edit: "/onboard/isa",
      rows: [
        ["S&S ISA", `${gbp(profile.ssIsaValue)} + ${gbp(profile.ssIsaMonthly)}/mo`],
        ["Cash ISA", `${gbp(profile.cashIsaValue)} @ ${pct(profile.cashIsaRate)}`],
        ...(profile.hasLisa
          ? ([["LISA", `${gbp(profile.lisaValue)} + ${gbp(profile.lisaMonthly)}/mo`]] as [
              string,
              string,
            ][])
          : []),
        ...(profile.hasGia
          ? ([["GIA", `${gbp(profile.giaValue)} + ${gbp(profile.giaMonthly)}/mo`]] as [
              string,
              string,
            ][])
          : []),
      ],
    },
    {
      title: "Property",
      edit: "/onboard/property",
      rows: [
        ["Primary value", gbp(profile.primaryValue)],
        ["Mortgage", `${gbp(profile.primaryMortgage)} @ ${pct(profile.primaryMortgageRate)}`],
        ["Term remaining", `${profile.primaryMortgageTermYears} yrs`],
        ["BTL properties", `${profile.btlProperties.length}`],
      ],
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Review</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2">
          {sections.map((s) => (
            <div key={s.title} className="rounded-md border p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold">{s.title}</div>
                <Button
                  variant="link"
                  className="h-auto p-0 text-xs"
                  onClick={() => navigate(s.edit)}
                >
                  Edit
                </Button>
              </div>
              <dl className="space-y-1.5 text-sm">
                {s.rows.map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-3">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="font-medium tabular-nums text-right">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>

        <div className="rounded-md border bg-secondary/30 p-5">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary mt-0.5" />
            <div className="text-sm">
              <div className="font-semibold">First projection ready</div>
              <p className="text-muted-foreground">
                Your FIRE number is <span className="font-medium text-foreground">{gbp(fire.fireNumber)}</span>
                {fire.fireAge ? <> · projected FIRE at age <span className="font-medium text-foreground">{fire.fireAge}</span></> : null}
                . You can refine assumptions any time in Settings.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="ghost" onClick={() => navigate("/onboard/btl")}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <Button onClick={onFinish}>
            See my projection <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
