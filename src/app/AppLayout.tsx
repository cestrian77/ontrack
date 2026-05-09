import { useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Building2,
  Flame,
  Home,
  Landmark,
  Lightbulb,
  FileText,
  CircleHelp,
  Settings as SettingsIcon,
  SlidersHorizontal,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { useProfileStore } from "@/store/useProfileStore";
import { useScenarioStore } from "@/store/useScenarioStore";
import { useTheme } from "./ThemeProvider";
import { ageFromDob } from "@/engine/project/runProjection";
import { useProjection } from "@/lib/hooks";
import { AnalysisViewSwitch } from "@/components/AnalysisViewSwitch";
import { cn, gbp, pct } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FIRE_PROGRESS_TOOLTIP } from "@/lib/fireMetricsExplain";

const NAV = [
  { to: "/dashboard", label: "Dashboard", Icon: Home },
  { to: "/fire", label: "FIRE", Icon: Flame },
  { to: "/scenarios", label: "Scenarios", Icon: SlidersHorizontal },
  { to: "/property", label: "Property", Icon: Building2 },
  { to: "/tax", label: "Tax", Icon: Landmark },
  { to: "/insights", label: "Insights", Icon: Lightbulb },
  { to: "/help", label: "Help", Icon: CircleHelp },
  { to: "/reports/builder", label: "Reports", Icon: FileText },
  { to: "/settings", label: "Settings", Icon: SettingsIcon },
];

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const onboardingComplete = useProfileStore((s) => s.onboardingComplete);
  const loaded = useProfileStore((s) => s.loaded);
  const load = useProfileStore((s) => s.load);
  const loadScenarios = useScenarioStore((s) => s.load);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (!loaded) void load();
  }, [load, loaded]);

  useEffect(() => {
    void loadScenarios();
  }, [loadScenarios]);

  useEffect(() => {
    if (loaded && !onboardingComplete && location.pathname !== "/help") {
      navigate("/onboard/you", { replace: true });
    }
  }, [loaded, onboardingComplete, navigate, location.pathname]);

  const { fire, taxYearPack, analysisProfile } = useProjection();
  const age = ageFromDob(analysisProfile.dateOfBirth);
  const yearsToTarget = Math.max(
    0,
    analysisProfile.retirementTargetAge - age,
  );

  return (
    <div className="min-h-full bg-background">
      <header className="sticky top-0 z-30 border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-14 items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="font-semibold tracking-tight">OnTrack</span>
            <span className="hidden sm:inline text-xs text-muted-foreground">
              UK Retirement Planner
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex shrink-0">
              <AnalysisViewSwitch />
            </div>
            <div className="hidden md:flex items-center gap-3 text-xs">
              <span className="text-muted-foreground">Target</span>
              <span className="font-medium">
                Age {analysisProfile.retirementTargetAge} · {yearsToTarget}y
              </span>
              <span className="h-4 w-px bg-border" />
              <span className="text-muted-foreground">FIRE</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="font-medium underline decoration-dotted decoration-muted-foreground/60 underline-offset-2"
                    aria-label="Explain FIRE progress"
                  >
                    {pct(Math.min(1, fire.fireProgressPct / 100))}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs text-left leading-snug">
                  {FIRE_PROGRESS_TOOLTIP}
                </TooltipContent>
              </Tooltip>
              <span className="h-4 w-px bg-border" />
              <span className="text-muted-foreground">Investable</span>
              <span className="font-medium">{gbp(fire.investableNow)}</span>
              <span className="h-4 w-px bg-border" />
              <span className="text-muted-foreground">Tax yr</span>
              <span className="font-medium tabular-nums">{taxYearPack.label}</span>
            </div>
            <ThemeSwitch theme={theme} setTheme={setTheme} />
          </div>
        </div>
      </header>

      <div className="container flex flex-col md:flex-row gap-6 px-4 py-6">
        <nav className="hidden md:flex flex-col gap-1 w-44 shrink-0 sticky top-20 self-start">
          {NAV.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <main className="flex-1 min-w-0 pb-20 md:pb-0">
          <Outlet />
        </main>
      </div>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t bg-card">
        <div className="flex items-center justify-around">
          {NAV.slice(0, 5).map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 px-3 py-2 text-[10px] font-medium",
                  isActive ? "text-primary" : "text-muted-foreground",
                )
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

function Logo() {
  return (
    <div className="grid h-8 w-8 place-items-center rounded-md bg-gradient-to-br from-asset-pension to-asset-property shadow-sm">
      <BarChart3 className="h-4 w-4 text-white" strokeWidth={2.5} />
    </div>
  );
}

function ThemeSwitch({
  theme,
  setTheme,
}: {
  theme: "light" | "dark" | "system";
  setTheme: (t: "light" | "dark" | "system") => void;
}) {
  const next: "light" | "dark" | "system" =
    theme === "system" ? "light" : theme === "light" ? "dark" : "system";
  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`Theme: ${theme}`}
      onClick={() => setTheme(next)}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}
