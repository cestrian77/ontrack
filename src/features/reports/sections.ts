export const REPORT_SECTIONS = [
  { id: "dashboard-summary", label: "Dashboard summary", description: "Headline retirement and FIRE metrics." },
  {
    id: "fire-detail",
    label: "FIRE detail",
    description: "Full FIRE page metrics: variants, pot, savings rate, and calculation flags.",
  },
  { id: "scenario-comparison", label: "Scenarios comparison", description: "Selected scenarios with summaries against your base plan." },
  { id: "insights", label: "Insights and recommendations", description: "Highest-impact model insights." },
  { id: "profile-assumptions", label: "Profile and assumptions", description: "Inputs and global assumptions used in the model." },
  {
    id: "tax-and-property",
    label: "Tax and buy-to-let",
    description: "Tax dashboard metrics and BTL yields (per person when a partner exists).",
  },
  {
    id: "chart-wealth-journey",
    label: "Wealth journey chart",
    description: "Stacked net worth by wrapper (matches dashboard; respects Real/Nominal toggle).",
  },
  {
    id: "chart-cash-flow",
    label: "Cash flow chart",
    description: "Annual inflow vs retirement income target (matches dashboard; respects Real/Nominal toggle).",
  },
  {
    id: "glossary",
    label: "Glossary",
    description: "Key terms used in OnTrack (same as Help).",
  },
] as const;

export type ReportSectionId = (typeof REPORT_SECTIONS)[number]["id"];

export const FULL_REPORT_SECTION_IDS: ReportSectionId[] = REPORT_SECTIONS.map(
  (section) => section.id,
);

/** Dashboard-style PDF: headline metrics plus the two dashboard charts. */
export const SIMPLE_REPORT_SECTION_IDS: ReportSectionId[] = [
  "dashboard-summary",
  "chart-wealth-journey",
  "chart-cash-flow",
];

/** Full analysis PDF: scenarios, insights, assumptions, tax/BTL, glossary. */
export const ADVANCED_REPORT_SECTION_IDS: ReportSectionId[] = FULL_REPORT_SECTION_IDS;

/** Order for PDF body (after cover). */
export const REPORT_SECTION_RENDER_ORDER: ReportSectionId[] = [
  "dashboard-summary",
  "fire-detail",
  "scenario-comparison",
  "insights",
  "profile-assumptions",
  "tax-and-property",
  "chart-wealth-journey",
  "chart-cash-flow",
  "glossary",
];
