import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ReportData } from "@/features/reports/buildReportData";
import type { ReportSectionId } from "@/features/reports/sections";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 11, lineHeight: 1.5 },
  title: { fontSize: 18, marginBottom: 4, fontWeight: 700 },
  subtitle: { color: "#666", marginBottom: 14 },
  section: { marginBottom: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "#dddddd" },
  sectionTitle: { fontSize: 13, marginBottom: 8, fontWeight: 700 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 8, marginBottom: 3 },
  label: { color: "#333" },
  value: { fontWeight: 600 },
  insightCard: { marginBottom: 8, padding: 8, borderWidth: 1, borderColor: "#dddddd" },
  insightTitle: { fontWeight: 700, marginBottom: 3 },
  insightMeta: { fontSize: 10, color: "#666", marginBottom: 2 },
  note: { color: "#666" },
});

export function ReportDocument({
  data,
  selectedSections,
}: {
  data: ReportData;
  selectedSections: ReportSectionId[];
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>OnTrack PDF Report</Text>
        <Text style={styles.subtitle}>
          {data.profileName} • Generated {new Date(data.generatedAt).toLocaleString("en-GB")}
        </Text>

        {selectedSections.includes("dashboard-summary") && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dashboard summary</Text>
            {data.dashboardMetrics.map((metric) => (
              <View key={metric.label} style={styles.row}>
                <Text style={styles.label}>{metric.label}</Text>
                <Text style={styles.value}>{metric.value}</Text>
              </View>
            ))}
          </View>
        )}

        {selectedSections.includes("scenario-comparison") && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Scenarios comparison</Text>
            {data.scenarioComparison.length === 0 ? (
              <Text style={styles.note}>No scenarios are selected.</Text>
            ) : (
              data.scenarioComparison.map((row) => (
                <View key={row.scenarioName} style={{ marginBottom: 8 }}>
                  <Text style={styles.value}>{row.scenarioName}</Text>
                  <View style={styles.row}>
                    <Text style={styles.label}>Net worth at retirement</Text>
                    <Text>{row.netWorthAtRetirement}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>FIRE age</Text>
                    <Text>{row.fireAge}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>FIRE number</Text>
                    <Text>{row.fireNumber}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {selectedSections.includes("insights") && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Insights and recommendations</Text>
            {data.activeInsights.length === 0 ? (
              <Text style={styles.note}>No active insights.</Text>
            ) : (
              data.activeInsights.map((insight) => (
                <View key={insight.title + insight.body} style={styles.insightCard}>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  <Text style={styles.insightMeta}>Severity: {insight.severity}</Text>
                  <Text>{insight.body}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {selectedSections.includes("profile-assumptions") && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile and assumptions</Text>
            {data.assumptions.map((metric) => (
              <View key={metric.label} style={styles.row}>
                <Text style={styles.label}>{metric.label}</Text>
                <Text style={styles.value}>{metric.value}</Text>
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}
