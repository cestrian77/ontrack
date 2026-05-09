import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProfileStore } from "@/store/useProfileStore";
import { useProjection } from "@/lib/hooks";
import { TaxDashboard } from "@/components/charts/TaxDashboard";
import { pensionNetCost } from "@/engine/pension/contributions";
import { gbp, pct } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Tax() {
  const profile = useProfileStore((s) => s.profile);
  const { taxYearPack } = useProjection();
  const sample100 = pensionNetCost(100, profile.grossSalary, profile.region, taxYearPack);
  const sample1000 = pensionNetCost(1000, profile.grossSalary, profile.region, taxYearPack);

  return (
    <div className="space-y-6">
      <TaxDashboard profile={profile} taxYearPack={taxYearPack} />

      <Card>
        <CardHeader>
          <CardTitle>Pension contribution efficiency</CardTitle>
          <p className="text-xs text-muted-foreground">
            Cost comparison: salary sacrifice (full income tax + NI saving) vs personal SIPP
            (relief at source + Self Assessment claim for higher/additional rate).
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue="100">
            <TabsList>
              <TabsTrigger value="100">£100 contribution</TabsTrigger>
              <TabsTrigger value="1000">£1,000 contribution</TabsTrigger>
            </TabsList>
            <TabsContent value="100">
              <CompareGrid s={sample100} gross={100} marginal={sample100.marginalRate} />
            </TabsContent>
            <TabsContent value="1000">
              <CompareGrid s={sample1000} gross={1000} marginal={sample1000.marginalRate} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function CompareGrid({
  s,
  gross,
  marginal,
}: {
  s: { sacrifice: number; sippNet: number; marginalRate: number };
  gross: number;
  marginal: number;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Stat label={`£${gross} gross`} value={gbp(gross)} />
      <Stat
        label="Salary sacrifice — net cost"
        value={gbp(s.sacrifice)}
        sub={`Marginal: ${pct(marginal)}`}
      />
      <Stat
        label="SIPP — net cost"
        value={gbp(s.sippNet)}
        sub={`Includes relief at source + claim`}
      />
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-lg font-semibold tabular-nums mt-1">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}
