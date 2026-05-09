import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProfileStore } from "@/store/useProfileStore";
import { useScenarioStore } from "@/store/useScenarioStore";
import { useUiStore } from "@/store/useUiStore";
import { useDismissedInsights, useProjection } from "@/lib/hooks";
import { generateInsights } from "@/engine/insights/insights";
import { buildReportData } from "@/features/reports/buildReportData";
import { downloadReportPdf } from "@/features/reports/downloadReport";
import { generateReportChartImages } from "@/features/reports/renderPdfCharts";
import { FULL_REPORT_SECTION_IDS, REPORT_SECTIONS, type ReportSectionId } from "@/features/reports/sections";
import { baseTaxYearPack } from "@/lib/taxYearContext";

export default function ReportBuilder() {
  const profile = useProfileStore((s) => s.profile);
  const scenarios = useScenarioStore((s) => s.scenarios);
  const selectedScenarioIds = useUiStore((s) => s.selectedScenarioIds);
  const inflationToggle = useUiStore((s) => s.inflationToggle);
  const analysisTaxYearLabel = useUiStore((s) => s.analysisTaxYearLabel);
  const { projection, fire, taxYearPack } = useProjection();
  const { dismissed } = useDismissedInsights();
  const [selectedSections, setSelectedSections] = useState<ReportSectionId[]>(FULL_REPORT_SECTION_IDS);
  const [isGenerating, setIsGenerating] = useState(false);

  const activeInsights = useMemo(() => {
    return generateInsights({ profile, projection, fire, taxYearPack }).filter(
      (insight) => !dismissed.has(insight.id),
    );
  }, [dismissed, fire, profile, projection, taxYearPack]);

  const reportData = useMemo(
    () =>
      buildReportData({
        profile,
        projection,
        fire,
        baseTaxYearPack: taxYearPack,
        scenarios,
        selectedScenarioIds,
        insights: activeInsights,
      }),
    [activeInsights, fire, profile, projection, scenarios, selectedScenarioIds, taxYearPack],
  );

  const basePackForCharts = useMemo(
    () => baseTaxYearPack(analysisTaxYearLabel),
    [analysisTaxYearLabel],
  );

  const selectedScenarios = useMemo(
    () => scenarios.filter((s) => selectedScenarioIds.includes(s.id)).slice(0, 3),
    [scenarios, selectedScenarioIds],
  );

  const generate = async (sections: ReportSectionId[]) => {
    if (sections.length === 0) return;
    setIsGenerating(true);
    try {
      const chartImages = generateReportChartImages({
        sections,
        profile,
        projection,
        taxYearPack,
        baseTaxYearPack: basePackForCharts,
        mode: inflationToggle,
        scenarios: selectedScenarios,
      });
      const hasChart =
        chartImages.wealthJourney !== undefined || chartImages.cashflow !== undefined;
      await downloadReportPdf({
        data: { ...reportData, ...(hasChart ? { chartImages } : {}) },
        sections,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>PDF report builder</CardTitle>
          <p className="text-xs text-muted-foreground">
            Build a custom PDF from core screens only. Settings content is always excluded.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {REPORT_SECTIONS.map((section) => {
            const checked = selectedSections.includes(section.id);
            return (
              <label key={section.id} className="flex items-start gap-3 rounded-md border p-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-primary"
                  checked={checked}
                  onChange={() => {
                    setSelectedSections((current) =>
                      checked ? current.filter((id) => id !== section.id) : [...current, section.id],
                    );
                  }}
                />
                <div>
                  <div className="text-sm font-medium">{section.label}</div>
                  <div className="text-xs text-muted-foreground">{section.description}</div>
                </div>
              </label>
            );
          })}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="outline" onClick={() => setSelectedSections(FULL_REPORT_SECTION_IDS)}>
              Select all
            </Button>
            <Button variant="outline" onClick={() => setSelectedSections([])}>
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generate</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button onClick={() => void generate(FULL_REPORT_SECTION_IDS)} disabled={isGenerating}>
            <FileText className="h-4 w-4" /> Complete PDF report
          </Button>
          <Button
            variant="outline"
            onClick={() => void generate(selectedSections)}
            disabled={isGenerating || selectedSections.length === 0}
          >
            <FileText className="h-4 w-4" /> Generate custom PDF
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/settings">Back to settings</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
