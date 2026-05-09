export const REPORT_SECTIONS = [
  { id: "dashboard-summary", label: "Dashboard summary", description: "Headline retirement and FIRE metrics." },
  { id: "scenario-comparison", label: "Scenarios comparison", description: "Selected scenarios against your base plan." },
  { id: "insights", label: "Insights and recommendations", description: "Highest-impact model insights." },
  { id: "profile-assumptions", label: "Profile and assumptions", description: "Inputs and global assumptions used in the model." },
] as const;

export type ReportSectionId = (typeof REPORT_SECTIONS)[number]["id"];

export const FULL_REPORT_SECTION_IDS: ReportSectionId[] = REPORT_SECTIONS.map(
  (section) => section.id,
);
