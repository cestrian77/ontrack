import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProfileStore } from "@/store/useProfileStore";
import { useProjection } from "@/lib/hooks";
import { gbp, pct } from "@/lib/utils";
import { ageFromDob } from "@/engine/project/runProjection";

type ReviewSection = { title: string; rows: [string, string][]; edit: string };

export default function OnboardingReview() {
  const navigate = useNavigate();
  const profile = useProfileStore((s) => s.profile);
  const partnerProfile = useProfileStore((s) => s.partnerProfile);
  const completeOnboarding = useProfileStore((s) => s.completeOnboarding);
  const { fire } = useProjection();
  const age = ageFromDob(profile.dateOfBirth);
  const partnerFlow = Boolean(profile.partnered && partnerProfile);

  const onFinish = () => {
    completeOnboarding();
    navigate("/dashboard");
  };

  const sections: ReviewSection[] = useMemo(() => {
    const base: ReviewSection[] = [
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

    if (!partnerProfile) return base;

    const pAge = ageFromDob(partnerProfile.dateOfBirth);
    const partnerBlocks: ReviewSection[] = [
      {
        title: "Partner",
        edit: "/onboard/partner-you",
        rows: [
          ["Current age", `${pAge}`],
          ["Region", partnerProfile.region === "scotland" ? "Scotland" : "England / Wales"],
          ["Retirement target age", `${partnerProfile.retirementTargetAge}`],
          ["Target retirement income", gbp(partnerProfile.targetRetirementIncome)],
          ["Gross salary", gbp(partnerProfile.grossSalary)],
        ],
      },
      {
        title: "Partner pensions",
        edit: "/onboard/partner-pensions",
        rows: [
          ["Current pot", gbp(partnerProfile.pensionPot)],
          [
            "Employer + employee",
            `${pct(partnerProfile.employerContribPct + partnerProfile.employeeContribPct)}`,
          ],
          ["SIPP", `${gbp(partnerProfile.sippMonthly)}/mo`],
          ["Access age", `${partnerProfile.pensionAccessAge}`],
          ...((partnerProfile.hasDB
            ? ([
                [
                  "DB income",
                  `${gbp(partnerProfile.dbAnnualIncome)} from age ${partnerProfile.dbNRA}`,
                ],
              ] as [string, string][])
            : ([] as [string, string][]))),
        ],
      },
      {
        title: "Partner ISAs & cash",
        edit: "/onboard/partner-isa",
        rows: [
          [
            "S&S ISA",
            `${gbp(partnerProfile.ssIsaValue)} + ${gbp(partnerProfile.ssIsaMonthly)}/mo`,
          ],
          [
            "Cash ISA",
            `${gbp(partnerProfile.cashIsaValue)} @ ${pct(partnerProfile.cashIsaRate)}`,
          ],
          ...(partnerProfile.hasLisa
            ? ([
                [
                  "LISA",
                  `${gbp(partnerProfile.lisaValue)} + ${gbp(partnerProfile.lisaMonthly)}/mo`,
                ],
              ] as [string, string][])
            : []),
          ...(partnerProfile.hasGia
            ? ([
                [
                  "GIA",
                  `${gbp(partnerProfile.giaValue)} + ${gbp(partnerProfile.giaMonthly)}/mo`,
                ],
              ] as [string, string][])
            : []),
          ["Cash savings", gbp(partnerProfile.cashSavings)],
        ],
      },
    ];

    return [...base, ...partnerBlocks];
  }, [profile, partnerProfile, age]);

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
                Your effective FIRE number is{" "}
                <span className="font-medium text-foreground">{gbp(fire.effectiveFireNumber)}</span>
                {fire.effectiveFireNumber !== fire.fireNumber ? (
                  <> (classic {gbp(fire.fireNumber)})</>
                ) : null}
                {fire.fireAge ? <> · projected FIRE at age <span className="font-medium text-foreground">{fire.fireAge}</span></> : null}
                . Adjust income offsets and pot buckets under Settings → FIRE calculation.
                {partnerFlow ? (
                  <>
                    {" "}
                    Use the header switch (Couple / Family) to see merged household projections; tax and
                    savings rate here are still for your profile only.
                  </>
                ) : null}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="ghost"
            onClick={() =>
              navigate(partnerFlow ? "/onboard/partner-isa" : "/onboard/btl")
            }
          >
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
