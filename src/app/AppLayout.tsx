import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import * as Dialog from "@radix-ui/react-dialog";
import {
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
  Menu,
  X,
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

const NAV_PRIMARY = NAV.slice(0, 5);
const NAV_MORE = NAV.slice(5);

function navPathActive(pathname: string, to: string) {
  if (pathname === to) return true;
  if (to !== "/" && pathname.startsWith(`${to}/`)) return true;
  return false;
}

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
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

  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname]);

  const { fire, taxYearPack, analysisProfile } = useProjection();
  const age = ageFromDob(analysisProfile.dateOfBirth);
  const yearsToTarget = Math.max(
    0,
    analysisProfile.retirementTargetAge - age,
  );

  const moreTabActive = NAV_MORE.some(({ to }) =>
    navPathActive(location.pathname, to),
  );

  return (
    <div className="min-h-full bg-background [--planner-header-height:3.5rem] [--mobile-tab-bar-height:4.25rem]">
      <header className="sticky top-[var(--site-header-height)] z-30 border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-14 items-center justify-between gap-4 px-4">
          <div className="min-w-0 flex items-center gap-3">
            <span className="truncate text-xs text-muted-foreground sm:text-sm">
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
              <span className="text-muted-foreground">
                {fire.fireCalculationUsesPotFilters ? "FIRE pot" : "Investable"}
              </span>
              <span className="font-medium">
                {gbp(fire.fireCalculationUsesPotFilters ? fire.firePotNow : fire.investableNow)}
              </span>
              <span className="h-4 w-px bg-border" />
              <span className="text-muted-foreground">Tax yr</span>
              <span className="font-medium tabular-nums">{taxYearPack.label}</span>
            </div>
            <ThemeSwitch theme={theme} setTheme={setTheme} />
          </div>
        </div>
      </header>

      <div className="container flex flex-col md:flex-row gap-6 px-4 py-6">
        <nav className="hidden md:flex flex-col gap-1 w-44 shrink-0 sticky top-[calc(var(--site-header-height)+var(--planner-header-height))] self-start">
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
        <main className="flex-1 min-w-0 pb-[calc(var(--site-footer-height)+var(--mobile-tab-bar-height))] md:pb-0">
          <Outlet />
        </main>
      </div>

      <nav
        className="md:hidden fixed bottom-[var(--site-footer-height)] inset-x-0 z-30 border-t bg-card"
        style={{
          paddingBottom: "max(0.5rem, env(safe-area-inset-bottom, 0px))",
        }}
        aria-label="Primary"
      >
        <div className="flex items-stretch justify-around">
          {NAV_PRIMARY.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex min-h-12 min-w-[3rem] flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium touch-manipulation",
                  isActive ? "text-primary" : "text-muted-foreground",
                )
              }
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              <span className="leading-none">{label}</span>
            </NavLink>
          ))}
          <Dialog.Root open={moreOpen} onOpenChange={setMoreOpen}>
            <Dialog.Trigger asChild>
              <button
                type="button"
                className={cn(
                  "flex min-h-12 min-w-[3rem] flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium touch-manipulation",
                  moreTabActive || moreOpen
                    ? "text-primary"
                    : "text-muted-foreground",
                )}
                aria-label="More sections"
                aria-expanded={moreOpen}
              >
                <Menu className="h-5 w-5 shrink-0" aria-hidden />
                <span className="leading-none">More</span>
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 md:hidden" />
              <Dialog.Content
                className="fixed inset-x-0 bottom-0 z-50 max-h-[min(70vh,28rem)] rounded-t-xl border bg-card shadow-lg outline-none md:hidden"
                style={{
                  paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
                }}
                aria-describedby={undefined}
              >
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <Dialog.Title className="text-sm font-semibold">
                    More
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <Button variant="ghost" size="icon" className="h-11 w-11 shrink-0" aria-label="Close">
                      <X className="h-5 w-5" />
                    </Button>
                  </Dialog.Close>
                </div>
                <nav className="flex flex-col gap-0.5 overflow-y-auto p-2" aria-label="Additional destinations">
                  {NAV_MORE.map(({ to, label, Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      onClick={() => setMoreOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          "flex min-h-12 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium touch-manipulation",
                          isActive
                            ? "bg-secondary text-foreground"
                            : "text-muted-foreground active:bg-secondary/60",
                        )
                      }
                    >
                      <Icon className="h-5 w-5 shrink-0" aria-hidden />
                      {label}
                    </NavLink>
                  ))}
                </nav>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </nav>
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
