import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  RELEASE_NOTE_SECTION_LABELS,
  REPO_CHANGELOG_URL,
  USER_RELEASE_NOTES,
  type ReleaseNoteSectionKey,
} from "@/lib/releaseNotes";

const SECTION_ORDER: ReleaseNoteSectionKey[] = ["model", "added", "changed", "fixed"];

export default function WhatsNew() {
  return (
    <div className="container max-w-3xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">What&apos;s new</h1>
        <p className="text-sm text-muted-foreground mt-1">
          User-facing updates that can change screens, assumptions, or projection results. You&apos;re
          running version{" "}
          <span className="font-medium text-foreground tabular-nums">{__APP_VERSION__}</span>.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Full changelog</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-3">
          <p>
            This page summarises releases. The repository changelog also lists infrastructure and
            deployment changes that do not affect your plan in the browser.
          </p>
          <Button variant="outline" size="sm" asChild>
            <a href={REPO_CHANGELOG_URL} target="_blank" rel="noopener noreferrer">
              View CHANGELOG on GitHub
              <ExternalLink className="ml-2 h-3.5 w-3.5" aria-hidden />
            </a>
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {USER_RELEASE_NOTES.map((entry) => (
          <Card key={entry.version}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex flex-wrap items-baseline gap-x-2 gap-y-0">
                <span>Version {entry.version}</span>
                {entry.date ? (
                  <span className="text-sm font-normal text-muted-foreground">{entry.date}</span>
                ) : null}
                {entry.version === __APP_VERSION__ ? (
                  <span className="text-xs font-medium text-primary">Current</span>
                ) : null}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {SECTION_ORDER.map((key) => {
                const items = entry.sections[key];
                if (!items?.length) return null;
                return (
                  <div key={key}>
                    <div className="font-medium text-foreground">
                      {RELEASE_NOTE_SECTION_LABELS[key]}
                    </div>
                    <ul className="mt-1.5 list-disc pl-5 text-muted-foreground space-y-1">
                      {items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        Tax year packs and global assumptions are in{" "}
        <Link to="/settings" className="text-primary underline underline-offset-2">
          Settings
        </Link>
        . Methodology for stress testing is in{" "}
        <Link to="/help" className="text-primary underline underline-offset-2">
          Help
        </Link>
        .
      </p>
    </div>
  );
}
