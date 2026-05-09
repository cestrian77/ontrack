import type { ReportData } from "@/features/reports/buildReportData";
import type { ReportSectionId } from "@/features/reports/sections";

export async function downloadReportPdf({
  data,
  sections,
  filename,
}: {
  data: ReportData;
  sections: ReportSectionId[];
  filename?: string;
}): Promise<void> {
  const [{ pdf }, { ReportDocument }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/features/reports/ReportDocument"),
  ]);
  const instance = pdf(<ReportDocument data={data} selectedSections={sections} />);
  const blob = await instance.toBlob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename ?? `ontrack-report-${new Date().toISOString().slice(0, 10)}.pdf`;
  anchor.click();
  URL.revokeObjectURL(url);
}
