import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
          <CardTitle>Glossary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <Gloss term="ISA" body="Individual Savings Account. Growth and withdrawals are tax-free. Annual subscription limits apply across ISA types." />
          <Gloss term="LISA" body="Lifetime ISA: government bonus on contributions, limits on age and on withdrawals for first home or from age 60." />
          <Gloss term="Annual allowance (pension)" body="Maximum pension contributions that receive tax relief per year, with taper for high earners and MPAA after flexi-access." />
          <Gloss term="SIPP" body="Self-invested personal pension. Personal contributions typically get basic-rate relief at source; higher/additional rate via Self Assessment." />
          <Gloss term="Section 24" body="Restriction of mortgage interest relief on residential BTL: finance costs partly replaced by a basic-rate tax credit in the model." />
          <Gloss term="NMPA / SPA" body="Normal minimum pension age for accessing DC pensions, and state pension age for new state pension." />
          <Gloss term="ISA bridge" body="Using ISA withdrawals to fund living costs between retiring and reaching pension access age." />
          <Gloss term="FIRE" body="Financial Independence, Retire Early — here: variants based on your target income and safe withdrawal rate." />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Disclaimer</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            OnTrack is for education and planning only. It is not financial, tax, or legal advice. Tax law and product rules change; verify anything important with a qualified adviser and official sources.
          </p>
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
