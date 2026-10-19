import { useEffect } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { BrandLogo } from "@/components/BrandLogo";
import { cn } from "@/lib/utils";
import { DISCLAIMER_SHORT } from "@/lib/legalCopy";
import { DATA_PACK_DISPLAY_NAME } from "@/lib/dataPack";
import { useProfileStore } from "@/store/useProfileStore";

export function SiteShell() {
  const onboardingComplete = useProfileStore((s) => s.onboardingComplete);
  const loaded = useProfileStore((s) => s.loaded);
  const load = useProfileStore((s) => s.load);
  const myInfoTo = onboardingComplete ? "/settings" : "/onboard/you";

  useEffect(() => {
    if (!loaded) void load();
  }, [loaded, load]);

  return (
    <div className="min-h-full flex flex-col bg-background [--site-header-height:3.5rem] [--site-footer-height:7.25rem]">
      <header className="fixed top-0 inset-x-0 z-40 h-14 border-b bg-card/90 backdrop-blur supports-[backdrop-filter]:bg-card/70">
        <div className="container h-full px-3 sm:px-4 flex items-center gap-3 min-w-0">
          <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="OnTrack home">
            <BrandLogo />
            <span className="font-semibold tracking-tight hidden sm:inline">OnTrack</span>
          </Link>
          <nav
            className="flex-1 min-w-0 flex items-center gap-1 sm:gap-2 justify-end overflow-x-auto py-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            aria-label="Site"
          >
            <SiteNavLink to="/dashboard">Dashboard</SiteNavLink>
            <SiteNavLink to={myInfoTo}>My information</SiteNavLink>
            <SiteNavLink to="/settings">Settings</SiteNavLink>
            <SiteNavLink to="/help#glossary">Glossary</SiteNavLink>
            <SiteNavLink to="/help">Help</SiteNavLink>
            <SiteNavLink to="/contact">Contact</SiteNavLink>
          </nav>
        </div>
      </header>

      <div
        className="flex-1 flex flex-col min-h-0 pt-[var(--site-header-height)] pb-[calc(var(--site-footer-height)+env(safe-area-inset-bottom,0px))]"
      >
        <Outlet />
      </div>

      <footer className="fixed bottom-0 inset-x-0 z-20 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/85 text-[11px] sm:text-xs text-muted-foreground pb-[max(0px,env(safe-area-inset-bottom))]">
        <div className="container px-3 sm:px-4 py-2 sm:py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
          <div className="leading-snug sm:max-w-xl shrink-0 space-y-1">
            <p>
              {DISCLAIMER_SHORT}{" "}
              <Link to="/help#disclaimer" className="text-primary underline underline-offset-2 whitespace-nowrap">
                Full disclaimer
              </Link>
            </p>
            <p>
              Local save included — back up with an{" "}
              <Link
                to="/settings#data-pack"
                className="text-primary underline underline-offset-2 whitespace-nowrap"
              >
                {DATA_PACK_DISPLAY_NAME}
              </Link>
              .
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 sm:justify-end shrink-0">
            <Link to="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <Link to="/help" className="hover:text-foreground transition-colors">
              Help
            </Link>
            <Link to="/whats-new" className="hover:text-foreground transition-colors">
              What&apos;s new
            </Link>
            <Link to="/contact" className="hover:text-foreground transition-colors">
              Contact
            </Link>
            <span className="h-3 w-px bg-border hidden sm:block" aria-hidden />
            <Link
              to="/whats-new"
              className="tabular-nums opacity-80 hover:text-foreground transition-colors"
              title="Release notes"
            >
              v{__APP_VERSION__} · {__APP_COMMIT__} · {__APP_BUILD_DATE__}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SiteNavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const location = useLocation();
  const path = to.includes("#") ? to.slice(0, to.indexOf("#")) : to;
  const toHash = to.includes("#") ? to.slice(to.indexOf("#")) : null;

  return (
    <NavLink
      to={to}
      className={({ isActive }) => {
        let active = isActive;
        // Same pathname (/help); NavLink ignores hash — only one of Glossary vs Help should be active.
        if (path === "/help" && location.pathname === "/help") {
          active = toHash != null ? location.hash === toHash : location.hash !== "#glossary";
        }
        return cn(
          "px-2 py-1.5 rounded-md whitespace-nowrap shrink-0 text-sm font-medium transition-colors",
          active
            ? "bg-secondary text-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
        );
      }}
      end={path === "/"}
    >
      {children}
    </NavLink>
  );
}
