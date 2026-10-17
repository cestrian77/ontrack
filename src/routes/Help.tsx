import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DISCLAIMER_FULL } from "@/lib/legalCopy";
import { GLOSSARY_ENTRIES } from "@/lib/glossaryTerms";

export default function Help() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Help</h1>
        <p className="text-sm text-muted-foreground mt-1">
          How OnTrack works, key terms, and what the numbers mean.
        </p>
      </div>

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
            Scenarios can optionally override that pack so you can compare the same life choices under different rulesets. The projection does not yet step rules year-by-year along the horizon; it uses one pack per run for tax that affects the engine (e.g. BTL marginal rates).
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
            Use real for &quot;will I be better off in terms of spending power?&quot; Use nominal when you want to see headline pound totals that grow with inflation.
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
            Success means retirement spending is met each year until your planning horizon (optional essential-only mode).
          </p>
          <p>
            Source docs in the repo: <code className="text-xs">docs/MONTE_CARLO_METHODOLOGY.md</code> and{" "}
            <code className="text-xs">docs/HISTORICAL_BACKTEST_METHODOLOGY.md</code>.
          </p>
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
