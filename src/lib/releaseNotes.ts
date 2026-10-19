/** User-facing release summaries. Keep in sync with CHANGELOG.md (omit infra-only items). */

export const REPO_CHANGELOG_URL =
  "https://github.com/cestrian77/ontrack/blob/main/CHANGELOG.md";

export type ReleaseNoteSectionKey = "added" | "changed" | "fixed" | "model";

export const RELEASE_NOTE_SECTION_LABELS: Record<ReleaseNoteSectionKey, string> = {
  added: "Added",
  changed: "Changed",
  fixed: "Fixed",
  model: "Model & tax",
};

export interface ReleaseNoteEntry {
  version: string;
  date?: string;
  sections: Partial<Record<ReleaseNoteSectionKey, string[]>>;
}

export const USER_RELEASE_NOTES: ReleaseNoteEntry[] = [
  {
    version: "1.1.1",
    date: "2026-03-21",
    sections: {
      added: [
        "Dashboard Planning & longevity card (care costs chart, guardrail multiplier, per-person IHT).",
        "Partner-specific care, guardrails, and IHT in Settings.",
        "Insights for care, IHT, and guardrails when enabled.",
      ],
    },
  },
  {
    version: "1.1.0",
    date: "2026-03-21",
    sections: {
      added: [
        "Salary growth and bonus on the career path while working (pension contributions, BTL marginal rates).",
        "Dynamic spending guardrails (Guyton–Klinger-style) in Settings.",
        "Long-term care cost window and illustrative inheritance tax estimate at a chosen age.",
        "Stress test: historical mode uses a single path; methodology links in Help.",
        "Monte Carlo seed and default trials in Settings.",
      ],
      fixed: [
        "Data pack import: size cap, validation, confirm dialog, and clearer errors.",
        "Household historical backtest no longer repeats identical trials.",
      ],
    },
  },
  {
    version: "1.0.2",
    sections: {
      added: [
        "Phase 1 web release: deterministic engine, FIRE, BTL, scenarios, insights, PDF reports, and PWA offline shell.",
      ],
    },
  },
];

export function latestReleaseNote(): ReleaseNoteEntry {
  return USER_RELEASE_NOTES[0];
}

/** Short bullets for Help / summaries (newest release only). */
export function latestReleaseHighlights(maxItems = 3): string[] {
  const { sections } = latestReleaseNote();
  const combined = [
    ...(sections.model ?? []),
    ...(sections.added ?? []),
    ...(sections.changed ?? []),
    ...(sections.fixed ?? []),
  ];
  return combined.slice(0, maxItems);
}
