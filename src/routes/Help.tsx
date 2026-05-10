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
            <strong className="text-foreground">Not modelled:</strong> detailed Self Assessment, capital gains on each disposal, child benefit charges, SDLT on purchases, joint tax splitting beyond BTL ownership, or product-specific fees. Use this app for direction, not filing.
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
