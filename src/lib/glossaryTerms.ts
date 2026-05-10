export interface GlossaryEntry {
  term: string;
  body: string;
}

/** Shared between Help and PDF export — keep in sync with product language. */
export const GLOSSARY_ENTRIES: readonly GlossaryEntry[] = [
  {
    term: "ISA",
    body: "Individual Savings Account. Growth and withdrawals are tax-free. Annual subscription limits apply across ISA types.",
  },
  {
    term: "LISA",
    body: "Lifetime ISA: government bonus on contributions, limits on age and on withdrawals for first home or from age 60.",
  },
  {
    term: "Annual allowance (pension)",
    body: "Maximum pension contributions that receive tax relief per year, with taper for high earners and MPAA after flexi-access.",
  },
  {
    term: "SIPP",
    body: "Self-invested personal pension. Personal contributions typically get basic-rate relief at source; higher/additional rate via Self Assessment.",
  },
  {
    term: "Section 24",
    body: "Restriction of mortgage interest relief on residential BTL: finance costs partly replaced by a basic-rate tax credit in the model.",
  },
  {
    term: "NMPA / SPA",
    body: "Normal minimum pension age for accessing DC pensions, and state pension age for new state pension.",
  },
  {
    term: "ISA bridge",
    body: "Using ISA withdrawals to fund living costs between retiring and reaching pension access age.",
  },
  {
    term: "FIRE",
    body: "Financial Independence, Retire Early — here: variants based on your target income and safe withdrawal rate.",
  },
] as const;
