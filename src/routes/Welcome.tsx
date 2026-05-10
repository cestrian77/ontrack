import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, BarChart3, Flame, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useProfileStore } from "@/store/useProfileStore";
import { taxYearLabelForDate } from "@/engine/constants/uk";

export default function Welcome() {
  const navigate = useNavigate();
  const load = useProfileStore((s) => s.load);
  const onboardingComplete = useProfileStore((s) => s.onboardingComplete);
  const loaded = useProfileStore((s) => s.loaded);

  useEffect(() => {
    if (!loaded) void load();
  }, [load, loaded]);

  return (
    <div className="min-h-full bg-background bg-grid">
      <div className="container max-w-5xl px-4 py-16 md:py-24">
        <div className="flex items-center gap-3 mb-6">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-asset-pension to-asset-property shadow">
            <BarChart3 className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-semibold tracking-tight">OnTrack</div>
            <div className="text-xs text-muted-foreground">
              UK Retirement Trajectory Planner
            </div>
          </div>
        </div>

        <h1 className="text-4xl md:text-6xl font-semibold tracking-tight mb-6 leading-[1.05]">
          See whether you're on track for the retirement you want.
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground mb-8">
          OnTrack visualises the future impact of today's financial decisions.
          Pension, ISA, GIA, LISA, primary residence, BTL — modelled together,
          UK-aware, all on your device.
        </p>

        <div className="flex flex-wrap gap-3 mb-10">
          {onboardingComplete ? (
            <>
              <Button size="lg" onClick={() => navigate("/dashboard")}>
                Open dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/onboard/review">Edit my information</Link>
              </Button>
            </>
          ) : (
            <Button size="lg" asChild>
              <Link to="/onboard/you">
                Start in under 5 minutes <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <FeatureCard
            Icon={BarChart3}
            title="Visual wealth trajectory"
            body="Stacked projection by wrapper to age 100, with retirement and FIRE markers."
          />
          <FeatureCard
            Icon={Flame}
            title="FIRE tracker"
            body="Full, Lean, Fat, Coast and Barista numbers — and your projected FIRE age."
          />
          <FeatureCard
            Icon={ShieldCheck}
            title="UK-aware modelling"
            body={`${taxYearLabelForDate(new Date())} tax bands, ISA + pension wrappers, Section 24 BTL, ISA bridge logic.`}
          />
        </div>

        <div className="mt-12 space-y-1 text-xs text-muted-foreground max-w-xl">
          <div className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 shrink-0" /> Local-first. No financial
            data leaves your device.
          </div>
          <p>
            Your plan is saved in this browser (IndexedDB). For a portable backup,
            use Settings → Export JSON; import that file on this or another browser
            to restore. PDF reports are snapshots only — use JSON to restore inputs.
          </p>
          <p>
            <Link to="/help" className="text-primary underline underline-offset-2">
              Help, glossary, and disclaimers
            </Link>
            {" "}
            (also under Help in the app sidebar when you&apos;re using the planner).
          </p>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  Icon,
  title,
  body,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <Icon className="h-5 w-5 text-primary mb-3" />
        <div className="font-semibold mb-1">{title}</div>
        <div className="text-sm text-muted-foreground">{body}</div>
      </CardContent>
    </Card>
  );
}
