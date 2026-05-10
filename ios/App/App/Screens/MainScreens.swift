import Charts
import OnTrackEngine
import SwiftData
import SwiftUI
import UIKit

// MARK: - Dashboard

struct DashboardScreen: View {
    @Environment(\.householdPlanner) private var plannerOpt
    @Environment(\.horizontalSizeClass) private var hSize
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        if let planner = plannerOpt {
            dashboardBody(planner: planner)
        } else {
            Text("Loading…")
                .font(DesignTypography.bodyMd)
                .foregroundStyle(DesignColor.textSecondary(colorScheme))
        }
    }

    private func dashboardBody(planner: HouseholdPlanner) -> some View {
        let proj = planner.projection
        let fire = planner.fire
        return ScrollView {
            VStack(alignment: .leading, spacing: DesignLayout.bentoGutter) {
                BentoCard {
                    analysisHeader(planner: planner)
                }
                BentoCard {
                    VStack(alignment: .leading, spacing: DesignLayout.unit * 3) {
                        Text("Net worth trajectory")
                            .font(DesignTypography.headlineMd)
                            .foregroundStyle(DesignColor.textPrimary(colorScheme))
                            .tracking(0.24)
                            .accessibilityAddTraits(.isHeader)
                        Chart {
                            ForEach(Array(proj.years.enumerated()), id: \.offset) { _, y in
                                LineMark(
                                    x: .value("Age", y.age),
                                    y: .value("Total", y.totalNetWorth),
                                )
                                .foregroundStyle(
                                    LinearGradient(
                                        colors: [
                                            DesignColor.chartPrimary(colorScheme),
                                            DesignColor.chartSecondary(colorScheme),
                                        ],
                                        startPoint: .leading,
                                        endPoint: .trailing,
                                    ),
                                )
                            }
                        }
                        .frame(height: hSize == .compact ? 200 : 260)
                        .accessibilityLabel("Net worth by age chart")
                        .accessibilityHint(
                            "Total net worth from age \(proj.meta.currentAge) to \(proj.meta.currentAge + proj.years.count - 1).",
                        )
                    }
                }
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: DesignLayout.bentoGutter) {
                    metricCard(
                        "FIRE number",
                        AppFormat.gbp(fire.effectiveFireNumber),
                        hint: "Effective: portfolio need after optional passive offsets ÷ SWR. Classic \(AppFormat.gbp(fire.fireNumber)).",
                    )
                    metricCard(
                        fire.fireCalculationUsesPotFilters ? "FIRE pot" : "Investable",
                        AppFormat.gbp(fire.fireCalculationUsesPotFilters ? fire.firePotNow : fire.investableNow),
                        hint: "Balances included in FIRE progress (see web FIRE calculation settings).",
                    )
                    metricCard("FIRE progress", "\(Int(fire.fireProgressPct))%", hint: "FIRE pot vs effective FIRE number")
                    metricCard(
                        "Years to FIRE",
                        fire.yearsToFire.map { "\($0)" } ?? "—",
                        hint: "Based on current trajectory",
                    )
                }
                SharePreviewCard()
            }
            .screenCanvasPadding()
            .padding(.vertical, DesignLayout.unit * 5)
        }
        .scrollContentBackground(.hidden)
        .background(DesignColor.background(colorScheme))
        .navigationTitle("Dashboard")
    }

    @ViewBuilder
    private func analysisHeader(planner: HouseholdPlanner) -> some View {
        VStack(alignment: .leading, spacing: DesignLayout.unit * 2) {
            Picker("Analysis", selection: Binding(
                get: { planner.analysisViewMode },
                set: { planner.setAnalysisViewMode($0) },
            )) {
                Text("Individual").tag(HouseholdPlanner.AnalysisViewMode.individual)
                Text("Couple").tag(HouseholdPlanner.AnalysisViewMode.couple)
                Text("Family").tag(HouseholdPlanner.AnalysisViewMode.family)
            }
            .pickerStyle(.segmented)
            .tint(DesignColor.primary(colorScheme))
            if planner.partner != nil {
                Picker("Person", selection: Binding(
                    get: { planner.activePersonId },
                    set: { planner.setActivePersonId($0) },
                )) {
                    Text("You").tag(HouseholdPlanner.ActivePersonId.primary)
                    Text("Partner").tag(HouseholdPlanner.ActivePersonId.partner)
                }
                .pickerStyle(.segmented)
                .tint(DesignColor.primary(colorScheme))
            }
            Picker("Charts", selection: Binding(
                get: { planner.inflationToggle },
                set: { planner.setInflationToggle($0) },
            )) {
                Text("Real").tag(HouseholdPlanner.InflationToggle.real)
                Text("Nominal").tag(HouseholdPlanner.InflationToggle.nominal)
            }
            .pickerStyle(.segmented)
            .tint(DesignColor.primary(colorScheme))
            Text(
                planner.inflationToggle == .real
                    ? "Series shown in today’s money (real terms)."
                    : "Nominal toggle reserved for future chart scaling; engine runs in real terms.",
            )
            .font(DesignTypography.labelSm)
            .foregroundStyle(DesignColor.textSecondary(colorScheme))
        }
    }

    private func metricCard(_ title: String, _ value: String, hint: String) -> some View {
        VStack(alignment: .leading, spacing: DesignLayout.unit) {
            Text(title)
                .font(DesignTypography.labelSm)
                .foregroundStyle(DesignColor.textSecondary(colorScheme))
                .tracking(0.24)
            Text(value)
                .font(DesignTypography.headlineMd)
                .foregroundStyle(DesignColor.textPrimary(colorScheme))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(DesignLayout.unit * 5)
        .background(DesignColor.surfaceCard(colorScheme))
        .clipShape(RoundedRectangle(cornerRadius: DesignLayout.radiusCard, style: .continuous))
        .designCardShadow()
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(title): \(value). \(hint)")
    }
}

// MARK: - FIRE

struct FireScreen: View {
    @Environment(\.householdPlanner) private var plannerOpt
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        if let planner = plannerOpt {
            let f = planner.fire
            List {
                Section("Targets (effective)") {
                    LabeledContent("Full FIRE", value: AppFormat.gbp(f.effectiveFireNumber))
                    LabeledContent("Lean FIRE", value: AppFormat.gbp(f.effectiveLeanFireNumber))
                    LabeledContent("Fat FIRE", value: AppFormat.gbp(f.effectiveFatFireNumber))
                    LabeledContent("Coast FIRE", value: AppFormat.gbp(f.effectiveCoastFireNumber))
                    LabeledContent("Barista FIRE", value: AppFormat.gbp(f.effectiveBaristaFireNumber))
                }
                Section("Classic (no passive offsets)") {
                    LabeledContent("Full FIRE", value: AppFormat.gbp(f.fireNumber))
                    LabeledContent("Lean FIRE", value: AppFormat.gbp(f.leanFireNumber))
                    LabeledContent("Fat FIRE", value: AppFormat.gbp(f.fatFireNumber))
                }
                Section("Progress") {
                    LabeledContent("FIRE pot", value: AppFormat.gbp(f.firePotNow))
                    LabeledContent("Investable (all)", value: AppFormat.gbp(f.investableNow))
                    LabeledContent("Passive at reference", value: AppFormat.gbp(f.passiveIncomeAtReference))
                    LabeledContent("FIRE progress", value: AppFormat.pct(f.fireProgressPct / 100))
                    LabeledContent(
                        "Coast progress",
                        value: f.coastFireApplicable ? AppFormat.pct(f.coastFireProgressPct / 100) : "N/A",
                    )
                    LabeledContent("Coast reached", value: f.coastFireApplicable ? (f.coastReached ? "Yes" : "No") : "N/A")
                    LabeledContent("Savings rate", value: AppFormat.pct(f.savingsRate))
                    if let y = f.yearsToFire, let age = f.fireAge {
                        LabeledContent("Years to FIRE", value: "\(y) (age \(age))")
                    }
                }
            }
            .font(DesignTypography.bodyMd)
            .foregroundStyle(DesignColor.textPrimary(colorScheme))
            .designListChrome()
            .navigationTitle("FIRE")
        } else {
            Text("Loading…")
                .font(DesignTypography.bodyMd)
                .foregroundStyle(DesignColor.textSecondary(colorScheme))
        }
    }
}

// MARK: - Tax

struct TaxScreen: View {
    @Environment(\.householdPlanner) private var plannerOpt
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        if let planner = plannerOpt {
            let pack = planner.taxYearPack
            let p = planner.analysisProfile
            List {
                Section("Tax year pack") {
                    LabeledContent("Label", value: pack.label)
                    LabeledContent("ISA allowance", value: AppFormat.gbp(pack.isaAnnualAllowance))
                    LabeledContent("LISA allowance", value: AppFormat.gbp(pack.lisaAnnualAllowance))
                }
                Section("Income tax snapshot (annual)") {
                    let tax = TaxIncomeNI.incomeTax(income: p.grossSalary, region: p.region, pack: pack)
                    let ni = TaxIncomeNI.nationalInsurance(income: p.grossSalary, pack: pack)
                    LabeledContent("Gross salary", value: AppFormat.gbp(p.grossSalary))
                    LabeledContent("Income tax", value: AppFormat.gbp(tax))
                    LabeledContent("National Insurance", value: AppFormat.gbp(ni))
                    LabeledContent("Marginal rate", value: AppFormat.pct(TaxIncomeNI.marginalIncomeRate(income: p.grossSalary, region: p.region, pack: pack)))
                }
            }
            .font(DesignTypography.bodyMd)
            .foregroundStyle(DesignColor.textPrimary(colorScheme))
            .designListChrome()
            .navigationTitle("Tax")
        } else {
            Text("Loading…")
                .font(DesignTypography.bodyMd)
                .foregroundStyle(DesignColor.textSecondary(colorScheme))
        }
    }
}

// MARK: - Property

struct PropertyScreen: View {
    @Environment(\.householdPlanner) private var plannerOpt
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        if let planner = plannerOpt {
            Form {
                Section("Primary") {
                    LabeledContent("Value", value: AppFormat.gbp(planner.primary.primaryValue))
                    LabeledContent("Mortgage", value: AppFormat.gbp(planner.primary.primaryMortgage))
                    LabeledContent("Rate", value: AppFormat.pct(planner.primary.primaryMortgageRate))
                    LabeledContent("Overpay / mo", value: AppFormat.gbp(planner.primary.primaryOverpayment))
                }
                Section("BTL (\(planner.primary.btlProperties.count))") {
                    if planner.primary.btlProperties.isEmpty {
                        Text("No BTL properties").foregroundStyle(DesignColor.textSecondary(colorScheme))
                    } else {
                        ForEach(Array(planner.primary.btlProperties.enumerated()), id: \.offset) { i, b in
                            NavigationLink("Property \(i + 1)") {
                                BTLDetailView(index: i, planner: planner)
                            }
                        }
                    }
                }
            }
            .font(DesignTypography.bodyMd)
            .foregroundStyle(DesignColor.textPrimary(colorScheme))
            .scrollContentBackground(.hidden)
            .background(DesignColor.background(colorScheme))
            .navigationTitle("Property")
        } else {
            Text("Loading…")
                .font(DesignTypography.bodyMd)
                .foregroundStyle(DesignColor.textSecondary(colorScheme))
        }
    }
}

private struct BTLDetailView: View {
    let index: Int
    var planner: HouseholdPlanner
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        Form {
            if index < planner.primary.btlProperties.count {
                let b = planner.primary.btlProperties[index]
                LabeledContent("Value", value: AppFormat.gbp(b.value))
                LabeledContent("Mortgage", value: AppFormat.gbp(b.mortgageBalance))
                LabeledContent("Rent / mo", value: AppFormat.gbp(b.monthlyGrossRent))
                let cf = BtlCashflowEngine.btlAnnualCashflow(
                    b,
                    otherIncome: planner.primary.grossSalary,
                    region: planner.primary.region,
                    taxYearPack: planner.taxYearPack,
                )
                LabeledContent("Annual net cashflow", value: AppFormat.gbp(cf.netCashflow))
            }
        }
        .font(DesignTypography.bodyMd)
        .foregroundStyle(DesignColor.textPrimary(colorScheme))
        .scrollContentBackground(.hidden)
        .background(DesignColor.background(colorScheme))
        .navigationTitle("BTL")
    }
}

// MARK: - Scenarios

struct ScenariosScreen: View {
    @Environment(\.householdPlanner) private var plannerOpt
    @Environment(\.modelContext) private var modelContext
    @Environment(\.colorScheme) private var colorScheme
    @Query(sort: \ScenarioRecord.createdAt, order: .reverse) private var scenarios: [ScenarioRecord]

    var body: some View {
        if let planner = plannerOpt {
            List {
                Section("Templates") {
                    ForEach(ScenarioTemplates.all, id: \.id) { t in
                        Button {
                            addTemplate(t, planner: planner)
                        } label: {
                            VStack(alignment: .leading) {
                                Text(t.name).font(DesignTypography.labelBold)
                                Text(t.description).font(DesignTypography.labelSm).foregroundStyle(DesignColor.textSecondary(colorScheme))
                            }
                        }
                    }
                }
                Section("Your scenarios") {
                    ForEach(scenarios, id: \.scenarioId) { s in
                        scenarioRow(s, planner: planner)
                    }
                    .onDelete(perform: deleteScenarios)
                }
            }
            .font(DesignTypography.bodyMd)
            .foregroundStyle(DesignColor.textPrimary(colorScheme))
            .designListChrome()
            .navigationTitle("Scenarios")
        } else {
            Text("Loading…")
                .font(DesignTypography.bodyMd)
                .foregroundStyle(DesignColor.textSecondary(colorScheme))
        }
    }

    private func scenarioRow(_ s: ScenarioRecord, planner: HouseholdPlanner) -> some View {
        let name = (try? JSONSerialization.jsonObject(with: s.payloadJSON) as? [String: Any])?["name"] as? String ?? s.scenarioId
        return HStack {
            Text(name)
            Spacer()
            Button("Run") {
                if let merged = try? ScenarioApplyEngine.applyScenario(profile: planner.primary, scenarioJSON: s.payloadJSON) {
                    let proj = ProjectionEngine.runProjection(merged, options: RunProjectionOptions(taxYearPack: planner.taxYearPack))
                    let fire = FireEngine.computeFire(profile: merged, projection: proj, pack: planner.taxYearPack)
                    _ = fire
                }
            }
            .buttonStyle(SecondaryButtonStyle())
        }
    }

    private func addTemplate(_ t: ScenarioTemplateMeta, planner: HouseholdPlanner) {
        let id = "\(t.id)_\(Int(Date().timeIntervalSince1970))"
        let scenario: [String: Any] = [
            "id": id,
            "name": t.name,
            "colour": t.defaultColour,
            "templateId": t.id,
            "params": [:] as [String: Any],
            "overrides": [:] as [String: Any],
            "createdAt": ISO8601DateFormatter().string(from: Date()),
        ]
        if let data = try? JSONSerialization.data(withJSONObject: scenario) {
            modelContext.insert(ScenarioRecord(scenarioId: id, payloadJSON: data, createdAt: Date()))
            planner.toggleScenario(id: id)
            try? modelContext.save()
        }
    }

    private func deleteScenarios(at offsets: IndexSet) {
        for i in offsets {
            let s = scenarios[i]
            modelContext.delete(s)
        }
        try? modelContext.save()
    }
}

struct ScenarioTemplateMeta: Identifiable {
    var id: String
    var name: String
    var description: String
    var defaultColour: String
}

enum ScenarioTemplates {
    static let all: [ScenarioTemplateMeta] = [
        .init(id: "retire_earlier", name: "Retire 5 years earlier", description: "Retirement age −5", defaultColour: "#0f766e"),
        .init(id: "retire_later", name: "Retire 5 years later", description: "Retirement age +5", defaultColour: "#1e3a8a"),
        .init(id: "boost_pension", name: "Boost pension", description: "Extra SIPP contributions", defaultColour: "#0f766e"),
        .init(id: "boost_isa", name: "Boost ISA", description: "Extra ISA contributions", defaultColour: "#d4a017"),
        .init(id: "lower_returns", name: "Lower returns", description: "−1.5% growth", defaultColour: "#ef4444"),
        .init(id: "higher_inflation", name: "Higher inflation", description: "+1.5% CPI", defaultColour: "#f97316"),
    ]
}

// MARK: - Insights

struct InsightsScreen: View {
    @Environment(\.householdPlanner) private var plannerOpt
    @Environment(\.modelContext) private var modelContext
    @Environment(\.colorScheme) private var colorScheme
    @Query private var dismissals: [InsightDismissalRecord]

    var body: some View {
        if let planner = plannerOpt {
            let dismissed = Set(dismissals.map(\.insightId))
            let list = planner.insights(dismissed: dismissed)
            List {
                ForEach(list) { insight in
                    VStack(alignment: .leading, spacing: 6) {
                        Text(insight.title).font(DesignTypography.headlineMd)
                        Text(insight.body).font(DesignTypography.bodyMd).foregroundStyle(DesignColor.textSecondary(colorScheme))
                        Button("Dismiss") {
                            modelContext.insert(InsightDismissalRecord(insightId: insight.id, dismissedAt: Date()))
                            try? modelContext.save()
                        }
                        .font(DesignTypography.labelSm)
                        .tint(DesignColor.primary(colorScheme))
                    }
                    .padding(.vertical, 4)
                }
            }
            .font(DesignTypography.bodyMd)
            .foregroundStyle(DesignColor.textPrimary(colorScheme))
            .designListChrome()
            .navigationTitle("Insights")
        } else {
            Text("Loading…")
                .font(DesignTypography.bodyMd)
                .foregroundStyle(DesignColor.textSecondary(colorScheme))
        }
    }
}

// MARK: - Help

struct HelpScreen: View {
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: DesignLayout.unit * 4) {
                Text("Help")
                    .font(DesignTypography.headlineLg)
                    .foregroundStyle(DesignColor.textPrimary(colorScheme))
                    .kerning(-0.32)
                Text(LegalCopy.helpIntro)
                    .font(DesignTypography.bodyMd)
                    .foregroundStyle(DesignColor.textPrimary(colorScheme))
                Text(LegalCopy.helpNotModelled)
                    .font(DesignTypography.bodyMd)
                    .foregroundStyle(DesignColor.textPrimary(colorScheme))
                Text(LegalCopy.disclaimerShort)
                    .font(DesignTypography.labelSm)
                    .foregroundStyle(DesignColor.textSecondary(colorScheme))
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .screenCanvasPadding()
            .padding(.vertical, DesignLayout.unit * 4)
        }
        .scrollContentBackground(.hidden)
        .background(DesignColor.background(colorScheme))
        .navigationTitle("Help")
    }
}

// MARK: - Reports

struct ReportsScreen: View {
    @Environment(\.householdPlanner) private var plannerOpt
    @Environment(\.colorScheme) private var colorScheme
    @State private var pdfData: Data?
    @State private var showShare = false

    var body: some View {
        if let planner = plannerOpt {
            Form {
                Section {
                    Button("Generate PDF summary") {
                        pdfData = ReportPDFBuilder.build(
                            fire: planner.fire,
                            profile: planner.analysisProfile,
                            taxYearLabel: planner.taxYearPack.label,
                        )
                        showShare = pdfData != nil
                    }
                    .buttonStyle(PrimaryButtonStyle())
                }
                Section("About") {
                    Text("Native PDFKit export — key metrics from your current analysis profile.")
                        .font(DesignTypography.labelSm)
                        .foregroundStyle(DesignColor.textSecondary(colorScheme))
                }
            }
            .font(DesignTypography.bodyMd)
            .foregroundStyle(DesignColor.textPrimary(colorScheme))
            .scrollContentBackground(.hidden)
            .background(DesignColor.background(colorScheme))
            .navigationTitle("Reports")
            .sheet(isPresented: $showShare) {
                if let pdfData {
                    ShareSheet(items: [pdfData as Any])
                }
            }
        } else {
            Text("Loading…")
                .font(DesignTypography.bodyMd)
                .foregroundStyle(DesignColor.textSecondary(colorScheme))
        }
    }
}

enum ReportPDFBuilder {
    static func build(fire: FireMetrics, profile: UserProfile, taxYearLabel: String) -> Data? {
        let text = """
        OnTrack — summary
        Tax year: \(taxYearLabel)
        Target retirement income: \(AppFormat.gbp(profile.targetRetirementIncome))
        FIRE number (effective): \(AppFormat.gbp(fire.effectiveFireNumber))
        FIRE number (classic): \(AppFormat.gbp(fire.fireNumber))
        FIRE pot now: \(AppFormat.gbp(fire.firePotNow))
        FIRE progress: \(Int(fire.fireProgressPct))%
        """
        let bounds = CGRect(x: 0, y: 0, width: 612, height: 792)
        let data = NSMutableData()
        guard let consumer = CGDataConsumer(data: data as CFMutableData) else { return nil }
        var mediaBox = bounds
        guard let ctx = CGContext(consumer: consumer, mediaBox: &mediaBox, nil) else { return nil }
        ctx.beginPDFPage(nil)
        let nsText = text as NSString
        nsText.draw(at: CGPoint(x: 48, y: 720), withAttributes: [.font: UIFont.systemFont(ofSize: 12)])
        ctx.endPDFPage()
        ctx.closePDF()
        return data as Data
    }
}

// MARK: - Legal

enum LegalCopy {
    static let helpIntro =
        "OnTrack runs entirely on your device. Your inputs are stored locally; nothing is sent to a server for modelling. The engine projects wealth in annual steps from your current age to 100, in real terms (today's money)."
    static let helpNotModelled =
        "Not modelled: detailed Self Assessment, CGT on each disposal, child benefit charges, SDLT, joint tax splitting beyond BTL ownership, or product-specific fees. Use this app for direction, not filing."
    static let disclaimerShort =
        "This app is for educational planning only and is not regulated financial advice."
}

// MARK: - Share preview (from legacy placeholder)

// MARK: - Settings

struct SettingsScreen: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.householdPlanner) private var plannerOpt
    @Environment(\.colorScheme) private var colorScheme
    @Environment(AppThemeStore.self) private var appTheme
    @Query(filter: #Predicate<HouseholdRecord> { $0.id == "singleton" })
    private var households: [HouseholdRecord]

    var body: some View {
        Form {
            Section("Appearance") {
                Picker("Theme", selection: Binding(
                    get: { appTheme.scheme },
                    set: { appTheme.scheme = $0 },
                )) {
                    Text("System").tag(AppColorScheme.system)
                    Text("Light").tag(AppColorScheme.light)
                    Text("Dark").tag(AppColorScheme.dark)
                }
            }
            Section("Analysis") {
                if let planner = plannerOpt {
                    Picker("Tax year override", selection: Binding(
                        get: { planner.analysisTaxYearLabel ?? "calendar" },
                        set: { v in planner.setAnalysisTaxYearLabel(v == "calendar" ? nil : v) },
                    )) {
                        Text("Calendar (2026/27)").tag("calendar")
                        Text("2026/27").tag(TaxYearPack.uk2026_27.label)
                    }
                }
            }
            Section("Data") {
                NavigationLink("Export / import backup") {
                    BackupScreen()
                }
                if let p = plannerOpt {
                    Button("Re-run onboarding") {
                        p.setOnboardingComplete(false)
                    }
                }
                Button("Reset all data", role: .destructive) {
                    try? resetAll()
                }
            }
            Section("About") {
                LabeledContent("Version", value: Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "—")
            }
        }
        .font(DesignTypography.bodyMd)
        .foregroundStyle(DesignColor.textPrimary(colorScheme))
        .tint(DesignColor.primary(colorScheme))
        .scrollContentBackground(.hidden)
        .background(DesignColor.background(colorScheme))
        .navigationTitle("Settings")
    }

    private func resetAll() throws {
        try BackupCodec.importV2(
            json: "{\"version\":2,\"scenarios\":[],\"insightDismissals\":[]}",
            into: modelContext,
        )
        let fd = FetchDescriptor<HouseholdRecord>()
        let rows = try modelContext.fetch(fd)
        if let h = rows.first {
            h.primaryProfileJSON = try DefaultWebProfile.defaultPrimaryJSONData()
            h.partnerProfileJSON = nil
            h.dependentCount = 0
            h.onboardingComplete = false
            h.updatedAt = Date()
        } else {
            modelContext.insert(
                HouseholdRecord(
                    id: "singleton",
                    primaryProfileJSON: try DefaultWebProfile.defaultPrimaryJSONData(),
                    partnerProfileJSON: nil,
                    dependentCount: 0,
                    onboardingComplete: false,
                    updatedAt: Date(),
                ),
            )
        }
        try modelContext.save()
        NotificationCenter.default.post(
            name: Notification.Name("householdDataDidChange"),
            object: nil,
        )
    }
}

struct SharePreviewCard: View {
    @Environment(\.colorScheme) private var colorScheme
    @State private var showShare = false
    @State private var shareURL: URL?

    var body: some View {
        BentoCard {
            VStack(alignment: .leading, spacing: DesignLayout.unit * 2) {
                Text("Snapshot share")
                    .font(DesignTypography.headlineMd)
                    .foregroundStyle(DesignColor.textPrimary(colorScheme))
                Button("Share sample PNG") {
                    if let url = DashboardSnapshotExporter.writeSamplePNG() {
                        shareURL = url
                        showShare = true
                    }
                }
                .buttonStyle(SecondaryButtonStyle())
            }
        }
        .sheet(isPresented: $showShare) {
            if let shareURL {
                ShareSheet(items: [shareURL])
            }
        }
    }
}
