import { useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useProfileStore } from "@/store/useProfileStore";
import { cn } from "@/lib/utils";

const STEPS = [
  { to: "you", label: "You" },
  { to: "pensions", label: "Pensions" },
  { to: "isa", label: "ISA & Investments" },
  { to: "property", label: "Property" },
  { to: "btl", label: "BTL" },
  { to: "review", label: "Review" },
];

export function OnboardingLayout() {
  const load = useProfileStore((s) => s.load);
  const loaded = useProfileStore((s) => s.loaded);
  const loc = useLocation();

  useEffect(() => {
    if (!loaded) void load();
  }, [loaded, load]);

  const current = STEPS.findIndex((s) => loc.pathname.endsWith(s.to));
  const progress = current < 0 ? 0 : ((current + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-full bg-background bg-grid">
      <div className="container max-w-3xl py-8 px-4">
        <header className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-semibold tracking-tight">OnTrack</div>
              <div className="text-xs text-muted-foreground">
                Onboarding · Step {current + 1} of {STEPS.length}
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              All data stays on your device.
            </div>
          </div>
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {STEPS.map((s, i) => (
              <NavLink
                key={s.to}
                to={s.to}
                className={({ isActive }) =>
                  cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : i < current
                        ? "bg-secondary text-foreground"
                        : "bg-transparent text-muted-foreground hover:bg-secondary/60",
                  )
                }
              >
                {i + 1}. {s.label}
              </NavLink>
            ))}
          </div>
        </header>
        <Outlet />
      </div>
    </div>
  );
}
