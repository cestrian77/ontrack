export const REPORT_SECTIONS = [
  { id: "dashboard-summary", label: "Dashboard summary", description: "Headline retirement and FIRE metrics." },
  { id: "scenario-comparison", label: "Scenarios comparison", description: "Selected scenarios against your base plan." },
  { id: "insights", label: "Insights and recommendations", description: "Highest-impact model insights." },
  { id: "profile-assumptions", label: "Profile and assumptions", description: "Inputs and global assumptions used in the model." },
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
] as const;

export type ReportSectionId = (typeof REPORT_SECTIONS)[number]["id"];

export const FULL_REPORT_SECTION_IDS: ReportSectionId[] = REPORT_SECTIONS.map(
  (section) => section.id,
);
