import type { ReactNode } from "react";
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ReportData } from "@/features/reports/buildReportData";
import { REPORT_SECTION_RENDER_ORDER, type ReportSectionId } from "@/features/reports/sections";
import { GLOSSARY_ENTRIES } from "@/lib/glossaryTerms";
import { gbp } from "@/lib/utils";

const BRAND = {
  pension: "#0f766e",
  property: "#1e3a8a",
  muted: "#64748b",
  border: "#e2e8f0",
};

const styles = StyleSheet.create({
  cover: {
    padding: 0,
    fontSize: 11,
    fontFamily: "Helvetica",
  },
  coverTopBar: {
    height: 10,
    flexDirection: "row",
    width: "100%",
  },
  coverTopTeal: { flex: 1, backgroundColor: BRAND.pension },
  coverTopBlue: { flex: 1, backgroundColor: BRAND.property },
  coverBody: { padding: 40, paddingTop: 36 },
  coverLogoRow: { flexDirection: "row", alignItems: "center", marginBottom: 28 },
  coverLogoMark: {
    width: 36,
    height: 36,
    borderRadius: 6,
    flexDirection: "row",
    overflow: "hidden",
    marginRight: 12,
  },
  coverLogoHalf: { flex: 1, height: "100%" },
  coverTitle: { fontSize: 26, fontWeight: 700, color: "#0f172a", marginBottom: 6 },
  coverSubtitle: { fontSize: 12, color: BRAND.muted, marginBottom: 24 },
  coverMeta: { fontSize: 11, color: "#334155", lineHeight: 1.6, marginBottom: 4 },
  coverFoot: {
    marginTop: 48,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: BRAND.border,
    fontSize: 9,
    color: BRAND.muted,
    lineHeight: 1.45,
  },
  page: {
    padding: 32,
    paddingBottom: 48,
    fontSize: 10,
    lineHeight: 1.45,
    fontFamily: "Helvetica",
  },
  pageTopAccent: {
    height: 4,
    flexDirection: "row",
    marginBottom: 14,
    marginHorizontal: -32,
    marginTop: -32,
  },
  sectionTitle: { fontSize: 14, marginBottom: 10, fontWeight: 700, color: "#0f172a" },
  subsectionTitle: { fontSize: 11, marginTop: 8, marginBottom: 6, fontWeight: 700, color: "#334155" },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 8, marginBottom: 3 },
  label: { color: "#475569", flex: 1 },
  value: { fontWeight: 600, color: "#0f172a", maxWidth: "52%", textAlign: "right" },
  insightCard: { marginBottom: 8, padding: 8, borderWidth: 1, borderColor: BRAND.border },
  insightTitle: { fontWeight: 700, marginBottom: 3, fontSize: 10 },
  insightMeta: { fontSize: 9, color: BRAND.muted, marginBottom: 2 },
  note: { color: BRAND.muted },
  footnotes: { marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#f1f5f9" },
  footnote: { fontSize: 8, color: BRAND.muted, marginBottom: 3, lineHeight: 1.4 },
  chartTitle: { fontSize: 12, marginBottom: 6, fontWeight: 700 },
  chartImage: { width: "100%", maxHeight: 220, objectFit: "contain" as const },
  glossaryTerm: { fontSize: 10, fontWeight: 700, color: "#0f172a", marginTop: 6 },
  glossaryBody: { fontSize: 9, color: "#475569", marginBottom: 2 },
  allowanceRow: { marginBottom: 5 },
  allowanceLabel: { fontSize: 8, color: BRAND.muted, marginBottom: 2 },
  allowanceNums: { fontSize: 8, fontWeight: 600, color: "#334155", marginBottom: 2 },
  barTrack: { height: 3, backgroundColor: "#e2e8f0", borderRadius: 2 },
  barFill: { height: 3, borderRadius: 2, backgroundColor: BRAND.pension },
  footerLeft: {
    position: "absolute",
    bottom: 20,
    left: 32,
    fontSize: 8,
    color: BRAND.muted,
  },
  footerRight: {
    position: "absolute",
    bottom: 20,
    right: 32,
    fontSize: 8,
    color: BRAND.muted,
  },
});

function Footer() {
  return (
    <>
      <Text style={styles.footerLeft} fixed>
        On-Track · UK Retirement Planner
      </Text>
      <Text
        style={styles.footerRight}
        fixed
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
      />
    </>
  );
}

function PageChrome({ children }: { children: ReactNode }) {
  return (
    <Page size="A4" style={styles.page} wrap>
      <View style={styles.pageTopAccent}>
        <View style={{ flex: 1, backgroundColor: BRAND.pension }} />
        <View style={{ flex: 1, backgroundColor: BRAND.property }} />
      </View>
      {children}
      <Footer />
    </Page>
  );
}

export function ReportDocument({
  data,
  selectedSections,
}: {
  data: ReportData;
  selectedSections: ReportSectionId[];
}) {
  const ordered = REPORT_SECTION_RENDER_ORDER.filter((id) => selectedSections.includes(id));
  const generated = new Date(data.generatedAt).toLocaleString("en-GB");

  return (
    <Document title="On-Track Personal View" author="On-Track">
      <Page size="A4" style={styles.cover} wrap={false}>
        <View style={styles.coverTopBar}>
          <View style={styles.coverTopTeal} />
          <View style={styles.coverTopBlue} />
        </View>
        <View style={styles.coverBody}>
          <View style={styles.coverLogoRow}>
            <View style={styles.coverLogoMark}>
              <View style={[styles.coverLogoHalf, { backgroundColor: BRAND.pension }]} />
              <View style={[styles.coverLogoHalf, { backgroundColor: BRAND.property }]} />
            </View>
            <View>
              <Text style={styles.coverTitle}>On-Track Personal View</Text>
              <Text style={styles.coverSubtitle}>UK Retirement Planner</Text>
            </View>
          </View>
          <Text style={styles.coverMeta}>Profile: {data.profileName}</Text>
          <Text style={styles.coverMeta}>Analysis tax year: {data.analysisTaxYearLabel}</Text>
          <Text style={styles.coverMeta}>Generated: {generated}</Text>
          <Text style={styles.coverFoot}>
            This PDF is a read-only snapshot of your modelling inputs and results. To restore or move
            your editable plan, download your OnTrack data pack from Settings (not this PDF).
          </Text>
        </View>
      </Page>

      {ordered.includes("dashboard-summary") && (
        <PageChrome>
          <Text style={styles.sectionTitle}>Dashboard summary</Text>
          {data.dashboardMetrics.map((metric) => (
            <View key={metric.label} style={styles.row} wrap={false}>
              <Text style={styles.label}>{metric.label}</Text>
              <Text style={styles.value}>{metric.value}</Text>
            </View>
          ))}
          <View style={styles.footnotes}>
            {data.dashboardSummaryFootnotes.map((line, i) => (
              <Text key={i} style={styles.footnote}>
                {i + 1}. {line}
              </Text>
            ))}
          </View>
        </PageChrome>
      )}

      {ordered.includes("fire-detail") && (
        <PageChrome>
          <Text style={styles.sectionTitle}>FIRE detail</Text>
          {data.fireDetailMetrics.map((metric) => (
            <View key={metric.label} style={styles.row} wrap={false}>
              <Text style={styles.label}>{metric.label}</Text>
              <Text style={styles.value}>{metric.value}</Text>
            </View>
          ))}
          <View style={styles.footnotes}>
            {data.fireDetailFootnotes.map((line, i) => (
              <Text key={i} style={styles.footnote}>
                {i + 1}. {line}
              </Text>
            ))}
          </View>
        </PageChrome>
      )}

      {ordered.includes("scenario-comparison") && (
        <PageChrome>
          <Text style={styles.sectionTitle}>Scenarios comparison</Text>
          {data.scenarioComparison.length === 0 ? (
            <Text style={styles.note}>No scenarios are selected.</Text>
          ) : (
            data.scenarioComparison.map((row) => (
              <View key={row.scenarioName} style={{ marginBottom: 12 }} wrap={false}>
                <Text style={[styles.value, { maxWidth: "100%", textAlign: "left", marginBottom: 4 }]}>
                  {row.scenarioName}
                </Text>
                <Text style={{ fontSize: 9, color: BRAND.muted, marginBottom: 4 }}>
                  Template: {row.templateName} · {row.personScope === "partner" ? "Partner" : "Primary"}
                </Text>
                {row.summary ? (
                  <Text style={{ fontSize: 9, color: "#334155", marginBottom: 6 }}>{row.summary}</Text>
                ) : null}
                <View style={styles.row}>
                  <Text style={styles.label}>Net worth at retirement</Text>
                  <Text style={styles.value}>{row.netWorthAtRetirement}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>FIRE age</Text>
                  <Text style={styles.value}>{row.fireAge}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>FIRE number (effective)</Text>
                  <Text style={styles.value}>{row.fireNumber}</Text>
                </View>
              </View>
            ))
          )}
          {data.scenarioComparison.length > 0 && (
            <View style={styles.footnotes}>
              {data.scenarioComparisonFootnotes.map((line, i) => (
                <Text key={i} style={styles.footnote}>
                  {i + 1}. {line}
                </Text>
              ))}
            </View>
          )}
        </PageChrome>
      )}

      {ordered.includes("insights") && (
        <PageChrome>
          <Text style={styles.sectionTitle}>Insights and recommendations</Text>
          {data.activeInsights.length === 0 ? (
            <Text style={styles.note}>No active insights.</Text>
          ) : (
            data.activeInsights.map((insight) => (
              <View key={insight.title + insight.body} style={styles.insightCard} wrap={false}>
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <Text style={styles.insightMeta}>Severity: {insight.severity}</Text>
                <Text style={{ fontSize: 9 }}>{insight.body}</Text>
              </View>
            ))
          )}
        </PageChrome>
      )}

      {ordered.includes("profile-assumptions") && (
        <PageChrome>
          <Text style={styles.sectionTitle}>Profile and assumptions</Text>
          {data.assumptions.map((metric) => (
            <View key={metric.label} style={styles.row} wrap={false}>
              <Text style={styles.label}>{metric.label}</Text>
              <Text style={styles.value}>{metric.value}</Text>
            </View>
          ))}
        </PageChrome>
      )}

      {ordered.includes("tax-and-property") &&
        data.taxPersonSnapshots.map((snap) => (
          <PageChrome key={snap.personLabel}>
            <Text style={styles.sectionTitle}>Tax and buy-to-let · {snap.personLabel}</Text>
            <Text style={styles.subsectionTitle}>Allowance usage ({snap.tax.packLabel})</Text>
            {snap.tax.allowances.map((a) => {
              const ratio = a.cap > 0 ? Math.min(1, a.used / a.cap) : 0;
              return (
                <View key={a.label} style={styles.allowanceRow} wrap={false}>
                  <Text style={styles.allowanceLabel}>{a.label}</Text>
                  <Text style={styles.allowanceNums}>
                    {gbp(a.used)} / {gbp(a.cap)}
                  </Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${ratio * 100}%` }]} />
                  </View>
                </View>
              );
            })}
            <Text style={styles.subsectionTitle}>Income breakdown</Text>
            {snap.tax.incomeRows.map((r) => (
              <View key={r.label} style={styles.row} wrap={false}>
                <Text style={styles.label}>{r.label}</Text>
                <Text style={styles.value}>{r.value}</Text>
              </View>
            ))}
            <Text style={styles.subsectionTitle}>Pension tax relief</Text>
            {snap.tax.pensionRows.map((r) => (
              <View key={r.label} style={styles.row} wrap={false}>
                <Text style={styles.label}>{r.label}</Text>
                <Text style={styles.value}>{r.value}</Text>
              </View>
            ))}
            <Text style={[styles.footnote, { marginTop: 6 }]}>{snap.tax.pensionReliefNote}</Text>
            <Text style={[styles.subsectionTitle, { marginTop: 12 }]}>Buy-to-let (post-tax)</Text>
            {snap.btlBlocks.length === 0 ? (
              <Text style={styles.note}>No BTL properties in this profile.</Text>
            ) : (
              snap.btlBlocks.map((block) => (
                <View key={block.propertyId} style={{ marginBottom: 10 }} wrap={false}>
                  <Text style={{ fontSize: 10, fontWeight: 700, marginBottom: 4 }}>{block.title}</Text>
                  {block.rows.map((r) => (
                    <View key={r.label} style={styles.row}>
                      <Text style={styles.label}>{r.label}</Text>
                      <Text style={styles.value}>{r.value}</Text>
                    </View>
                  ))}
                </View>
              ))
            )}
          </PageChrome>
        ))}

      {ordered.includes("chart-wealth-journey") && (
        <PageChrome>
          <Text style={styles.chartTitle}>Wealth journey</Text>
          <View wrap={false}>
            {data.chartImages?.wealthJourney ? (
              <Image src={data.chartImages.wealthJourney} style={styles.chartImage} />
            ) : (
              <Text style={styles.note}>Chart was not generated (export again from the app).</Text>
            )}
          </View>
        </PageChrome>
      )}

      {ordered.includes("chart-cash-flow") && (
        <PageChrome>
          <Text style={styles.chartTitle}>Cash flow</Text>
          <View wrap={false}>
            {data.chartImages?.cashflow ? (
              <Image src={data.chartImages.cashflow} style={styles.chartImage} />
            ) : (
              <Text style={styles.note}>Chart was not generated (export again from the app).</Text>
            )}
          </View>
        </PageChrome>
      )}

      {ordered.includes("glossary") && (
        <PageChrome>
          <Text style={styles.sectionTitle}>Glossary</Text>
          <Text style={[styles.note, { marginBottom: 8 }]}>
            Same definitions as Help → Glossary in the app.
          </Text>
          {GLOSSARY_ENTRIES.map((entry) => (
            <View key={entry.term} wrap={false}>
              <Text style={styles.glossaryTerm}>{entry.term}</Text>
              <Text style={styles.glossaryBody}>{entry.body}</Text>
            </View>
          ))}
        </PageChrome>
      )}
    </Document>
  );
}
