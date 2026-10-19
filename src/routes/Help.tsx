import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DISCLAIMER_FULL } from "@/lib/legalCopy";
import { DATA_PACK_DISPLAY_NAME } from "@/lib/dataPack";
import { GLOSSARY_ENTRIES } from "@/lib/glossaryTerms";
import { RETIREMENT_TARGET_HELP_INTRO } from "@/lib/retirementTargetExplain";
import { latestReleaseHighlights, latestReleaseNote } from "@/lib/releaseNotes";
import {
  STRESS_MONTE_CARLO_SEED_HINT,
  STRESS_PERCENTILE_HINT,
  STRESS_SUCCESS_RATE_HINT,
  STRESS_TERMINAL_WEALTH_HINT,
  STRESS_TRIALS_HINT,
  STRESS_VOLATILITY_INTRO,
  formatVolatilityDefaults,
} from "@/lib/stressExplain";

export default function Help() {
  const latest = latestReleaseNote();
  const highlights = latestReleaseHighlights(3);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Help</h1>
        <p className="text-sm text-muted-foreground mt-1">
          How OnTrack works, key terms, and what the numbers mean.
        </p>
      </div>

      <Card id="whats-new" className="scroll-mt-[calc(var(--site-header-height)+0.75rem)]">
        <CardHeader>
          <CardTitle>What&apos;s new</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Version {latest.version}</strong>
            {latest.date ? ` (${latest.date})` : ""} — recent changes that may affect your
            projections or settings.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            {highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <Button variant="outline" size="sm" asChild>
            <Link to="/whats-new">All release notes</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How OnTrack works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            OnTrack runs entirely in your browser. Your inputs are stored locally (IndexedDB); nothing is sent to a server for modelling.
          </p>
          <p>
            The engine projects wealth in annual steps from your current age to 100, in real terms (today&apos;s money). You can switch charts to nominal using the Real/Nominal toggle where shown.
          </p>
          <p>
            <strong className="text-foreground">Modelled:</strong> workplace and SIPP pensions, ISAs (including LISA rules), GIA with a simplified CGT drag, primary home and BTL with Section 24 mortgage interest treatment, state pension growth after claim age, DB pensions, inheritance timing, and several FIRE variants.
          </p>
          <p>
            <strong className="text-foreground">Not modelled:</strong> Open Banking, detailed Self Assessment, per-disposal CGT, child benefit charges, SDLT on purchases, full IHT planning (gifts/Trusts), or product-specific fees. Use this app for direction, not filing.
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link to="/settings">Tax year and global assumptions</Link>
          </Button>
        </CardContent>
      </Card>

      <Card id="data-pack">
        <CardHeader>
          <CardTitle>{DATA_PACK_DISPLAY_NAME}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            OnTrack saves your plan in this browser automatically. An{" "}
            <strong className="text-foreground">{DATA_PACK_DISPLAY_NAME}</strong> is a portable
            backup file (JSON on disk) with your profiles, scenarios, and dismissed insights.
          </p>
          <p>
            Download or restore it from the home page or Settings → {DATA_PACK_DISPLAY_NAME}. PDF
            reports are read-only; use the data pack to continue editing elsewhere.
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link to="/settings#data-pack">Open data pack settings</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>FIRE numbers (web)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            The <strong className="text-foreground">classic FIRE number</strong> is your target retirement income divided by your safe withdrawal rate (SWR), as if the whole income had to come from an invested pot.
          </p>
          <p>
            The <strong className="text-foreground">effective FIRE number</strong> uses the same SWR on the income still needed after you optionally count projected{" "}
            <strong className="text-foreground">State Pension</strong>, <strong className="text-foreground">defined benefit</strong> income, and{" "}
            <strong className="text-foreground">buy-to-let net cashflow</strong> (from your projection at a chosen reference age). That matches how drawdown in the engine already reduces withdrawals when those sources exist.
          </p>
          <p>
            <strong className="text-foreground">FIRE progress</strong> compares your chosen <strong className="text-foreground">FIRE pot</strong> (which wrappers to include) to the effective number. Coast FIRE only applies when pension is included in that pot.
          </p>
          <p>
            Configure this on the <Link className="text-primary underline underline-offset-2" to="/fire">FIRE</Link> page or under{" "}
            <Link className="text-primary underline underline-offset-2" to="/settings">Settings</Link>. Couple / family views use the primary account holder’s FIRE calculation settings for merged metrics; the partner has their own copy for solo analysis.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tax assumptions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            UK rates and allowances are stored as frozen packs per tax year (e.g. 2025/26). The pack used for dashboards and the base projection follows <strong className="text-foreground">today&apos;s calendar tax year</strong> unless you pick a specific year under Settings.
          </p>
          <p>
            Scenarios can optionally override that pack so you can compare the same life choices under different rulesets. By default, projections step registered tax-year packs along the calendar horizon (BTL property rates, Section 24 credit, drawdown tax). Pin a specific year in Settings to freeze one pack for the whole plan.
          </p>
          <p>
            From 6 April 2027 (2027/28), rental profits use separate property income rates (22% / 42% / 47% in England &amp; Wales) and a 22% finance-cost credit. We do not yet model the 2027/28 change to how personal allowances are allocated across income types. Pension drawdown enforces NMPA 57 from calendar year 2028 even if your profile still says 55.
          </p>
          <p>
            Official rates: see{" "}
            <a
              className="text-primary underline underline-offset-2"
              href="https://www.gov.uk/"
              target="_blank"
              rel="noreferrer"
            >
              GOV.UK
            </a>{" "}
            and HMRC guidance. OnTrack is not affiliated with HMRC.
          </p>
        </CardContent>
      </Card>

      <Card id="retirement-income-target" className="scroll-mt-[calc(var(--site-header-height)+0.75rem)]">
        <CardHeader>
          <CardTitle>Retirement income target and inflation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>{RETIREMENT_TARGET_HELP_INTRO}</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-foreground">Lifestyle in today&apos;s money (real)</strong> — e.g.
              &quot;I want to live like I do on £40,000 net today.&quot; Enter £40,000. The engine keeps
              that purchasing power through retirement; your pot and FIRE numbers are already sized for
              that goal. You do <strong className="text-foreground">not</strong> need to increase the
              target because retirement is years away.
            </li>
            <li>
              <strong className="text-foreground">A future headline figure (nominal)</strong> — e.g.
              &quot;I want £40,000 on my payslip when I&apos;m 65.&quot; That is a smaller lifestyle in
              today&apos;s terms if prices rise in between. OnTrack does not assume you mean this unless
              you lower your real target to match. If you are unsure, use today&apos;s-money thinking
              and check the nominal chart view for the headline pounds at your retirement age.
            </li>
          </ul>
          <p>
            Example: with 2.5% CPI, £40,000 in today&apos;s money is about £65,000 in nominal pounds
            twenty years ahead — same lifestyle, bigger label. The dashed retirement target on the cash
            flow chart follows your Real/Nominal toggle; the underlying plan always uses real terms.
          </p>
          <p>
            Changing <strong className="text-foreground">CPI</strong> in Settings affects how nominal
            charts translate amounts; it does not change your real spending target unless you edit the
            target itself. For stress testing, try the &quot;Higher inflation&quot; scenario on the
            Scenarios page.
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link to="/settings">CPI and global assumptions</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Real (today&apos;s £) vs nominal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Real (today&apos;s £)</strong> shows amounts in constant purchasing power: what those figures would mean if a pound in the future bought the same as a pound today. OnTrack&apos;s projection engine works in real terms so you can compare different ages without general inflation making later years look artificially large.
          </p>
          <p>
            <strong className="text-foreground">Nominal</strong> shows amounts in the pounds of each future year, including the effect of rising prices. The same real wealth appears as bigger nominal numbers over time when inflation is positive. Charts use your <strong className="text-foreground">CPI inflation</strong> assumption from Settings to convert between the two for display.
          </p>
          <p>
            Use real for &quot;will I be better off in terms of spending power?&quot; Use nominal when you want to see headline pound totals that grow with inflation. See{" "}
            <a className="text-primary underline underline-offset-2" href="#retirement-income-target">
              Retirement income target and inflation
            </a>{" "}
            for how this applies to your target income.
          </p>
        </CardContent>
      </Card>

      <Card id="stress-testing" className="scroll-mt-[calc(var(--site-header-height)+0.75rem)]">
        <CardHeader>
          <CardTitle>Stress testing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            The <Link className="text-primary underline underline-offset-2" to="/stress">Stress test</Link> page
            reuses the same annual engine as your dashboard. <strong className="text-foreground">Monte Carlo</strong>{" "}
            draws many random return paths (seeded for reproducibility).{" "}
            <strong className="text-foreground">Historical backtest</strong> runs one path through an illustrative
            UK equity/cash return series — not a full rolling-period study.
          </p>
          <p>
            Property appreciation and rent follow your profile assumptions; only investment returns vary by path.
          </p>
          <p>
            <strong className="text-foreground">Seed &amp; trials</strong> — {STRESS_MONTE_CARLO_SEED_HINT}{" "}
            {STRESS_TRIALS_HINT} Set defaults under Settings → Stress test defaults.
          </p>
          <p>
            <strong className="text-foreground">Volatility (σ)</strong> — {STRESS_VOLATILITY_INTRO} Defaults:{" "}
            {formatVolatilityDefaults()}. Expected returns and CPI are under Settings → Global assumptions.
          </p>
          <p>
            <strong className="text-foreground">Success rate</strong> — {STRESS_SUCCESS_RATE_HINT}
          </p>
          <p>
            <strong className="text-foreground">Terminal investable wealth</strong> — {STRESS_TERMINAL_WEALTH_HINT}{" "}
            {STRESS_PERCENTILE_HINT}
          </p>
          <p>
            For a higher inflation what-if without changing your base profile, use Scenarios → Change inflation
            assumption.
          </p>
          <p>
            Source docs in the repo: <code className="text-xs">docs/MONTE_CARLO_METHODOLOGY.md</code> and{" "}
            <code className="text-xs">docs/HISTORICAL_BACKTEST_METHODOLOGY.md</code>.
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link to="/stress">Open stress test</Link>
          </Button>
        </CardContent>
      </Card>

      <Card id="career-guardrails-care-iht" className="scroll-mt-[calc(var(--site-header-height)+0.75rem)]">
        <CardHeader>
          <CardTitle>Career path, guardrails, care &amp; IHT</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Salary growth and bonus</strong> compound on your employment income
            while you are still working, affecting pension contributions and BTL marginal tax rates.
          </p>
          <p>
            <strong className="text-foreground">Spending guardrails</strong> (optional) scale discretionary spending
            up or down based on portfolio performance vs the wealth at retirement entry — a simplified Guyton–Klinger-style rule.
          </p>
          <p>
            <strong className="text-foreground">Long-term care</strong> adds a real £/year cost for a window of ages
            you choose (illustrative social/care fees).
          </p>
          <p>
            <strong className="text-foreground">Inheritance tax</strong> shows an illustrative IHT estimate at a chosen
            age on total net worth (nil-rate bands + residence band). It does not model gifts, trusts, or step-up rules.
          </p>
          <p>Configure these under Settings → Planning &amp; longevity.</p>
        </CardContent>
      </Card>

      <Card id="glossary" className="scroll-mt-[calc(var(--site-header-height)+0.75rem)]">
        <CardHeader>
          <CardTitle>Glossary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {GLOSSARY_ENTRIES.map((entry) => (
            <Gloss key={entry.term} term={entry.term} body={entry.body} />
          ))}
        </CardContent>
      </Card>

      <Card id="disclaimer" className="scroll-mt-[calc(var(--site-header-height)+0.75rem)]">
        <CardHeader>
          <CardTitle>Disclaimer</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>{DISCLAIMER_FULL}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function Gloss({ term, body }: { term: string; body: string }) {
  return (
    <div>
      <div className="font-medium text-foreground">{term}</div>
      <p className="text-muted-foreground mt-0.5">{body}</p>
    </div>
  );
}
