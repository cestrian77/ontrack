import Foundation
import Observation
import OnTrackEngine
import SwiftData
import SwiftUI

/// Web-aligned analysis + UI prefs ([`useProjection`](../../../../src/lib/hooks.ts), [`useUiStore`](../../../../src/store/useUiStore.ts)).
@Observable
@MainActor
final class HouseholdPlanner {
    private let modelContext: ModelContext
    private var household: HouseholdRecord

    var primary: UserProfile
    var partner: UserProfile?
    var dependentCount: Int
    var onboardingComplete: Bool

    var analysisTaxYearLabel: String?
    var analysisViewMode: AnalysisViewMode
    var activePersonId: ActivePersonId
    var inflationToggle: InflationToggle
    var selectedScenarioIds: [String]

    private var saveTask: Task<Void, Never>?

    enum AnalysisViewMode: String, CaseIterable, Identifiable {
        case individual
        case couple
        case family
        var id: String { rawValue }
    }

    enum ActivePersonId: String, CaseIterable, Identifiable {
        case primary
        case partner
        var id: String { rawValue }
    }

    enum InflationToggle: String, CaseIterable, Identifiable {
        case real
        case nominal
        var id: String { rawValue }
    }

    private static let udTaxYear = "analysisTaxYearLabel"
    private static let udViewMode = "analysisViewMode"
    private static let udActivePerson = "activePersonId"
    private static let udInflation = "inflationToggle"
    private static let udScenarios = "selectedScenarioIds"

    init(modelContext: ModelContext, household: HouseholdRecord) throws {
        self.modelContext = modelContext
        self.household = household
        self.primary = try Self.decodePrimary(household)
        self.partner = try Self.decodePartner(household)
        self.dependentCount = household.dependentCount
        self.onboardingComplete = household.onboardingComplete
        let d = UserDefaults.standard
        self.analysisTaxYearLabel = d.string(forKey: Self.udTaxYear)
        self.analysisViewMode = AnalysisViewMode(rawValue: d.string(forKey: Self.udViewMode) ?? "individual") ?? .individual
        self.activePersonId = ActivePersonId(rawValue: d.string(forKey: Self.udActivePerson) ?? "primary") ?? .primary
        self.inflationToggle = InflationToggle(rawValue: d.string(forKey: Self.udInflation) ?? "real") ?? .real
        if let data = d.data(forKey: Self.udScenarios),
           let ids = try? JSONDecoder().decode([String].self, from: data)
        {
            self.selectedScenarioIds = Array(ids.prefix(3))
        } else {
            self.selectedScenarioIds = []
        }
    }

    private static func decodePrimary(_ h: HouseholdRecord) throws -> UserProfile {
        try JSONDecoder().decode(UserProfile.self, from: h.primaryProfileJSON)
    }

    private static func decodePartner(_ h: HouseholdRecord) throws -> UserProfile? {
        guard let d = h.partnerProfileJSON else { return nil }
        return try JSONDecoder().decode(UserProfile.self, from: d)
    }

    func setPrimary(_ next: UserProfile) {
        primary = next
        schedulePersist()
    }

    func setPartner(_ next: UserProfile?) {
        partner = next
        schedulePersist()
    }

    func patchPrimary(_ mutate: (inout UserProfile) -> Void) {
        var p = primary
        mutate(&p)
        primary = p
        schedulePersist()
    }

    func patchPartner(_ mutate: (inout UserProfile) -> Void) {
        guard var par = partner else { return }
        mutate(&par)
        partner = par
        schedulePersist()
    }

    func setDependentCount(_ n: Int) {
        dependentCount = max(0, min(20, n))
        household.dependentCount = dependentCount
        schedulePersist(immediateHouseholdOnly: true)
    }

    func setOnboardingComplete(_ done: Bool) {
        onboardingComplete = done
        household.onboardingComplete = done
        schedulePersist(immediateHouseholdOnly: true)
    }

    func setAnalysisTaxYearLabel(_ label: String?) {
        analysisTaxYearLabel = label
        persistPrefs()
    }

    func setAnalysisViewMode(_ mode: AnalysisViewMode) {
        analysisViewMode = mode
        persistPrefs()
    }

    func setActivePersonId(_ id: ActivePersonId) {
        activePersonId = id
        persistPrefs()
    }

    func setInflationToggle(_ v: InflationToggle) {
        inflationToggle = v
        persistPrefs()
    }

    func toggleScenario(id: String) {
        if let i = selectedScenarioIds.firstIndex(of: id) {
            selectedScenarioIds.remove(at: i)
        } else if selectedScenarioIds.count < 3 {
            selectedScenarioIds.append(id)
        }
        persistPrefs()
    }

    var taxYearPack: TaxYearPack {
        if let label = analysisTaxYearLabel, label == TaxYearPack.uk2026_27.label {
            return .uk2026_27
        }
        return .uk2026_27
    }

    var analysisProfile: UserProfile {
        let canHousehold =
            (analysisViewMode == .couple || analysisViewMode == .family) && partner != nil
        if canHousehold, let par = partner {
            return HouseholdEngine.buildHouseholdSyntheticProfile(primary: primary, partner: par)
        }
        if activePersonId == .partner, let par = partner { return par }
        return primary
    }

    var isHouseholdAnalysis: Bool {
        (analysisViewMode == .couple || analysisViewMode == .family) && partner != nil
    }

    var projection: Projection {
        let opts = RunProjectionOptions(taxYearPack: taxYearPack, asOfDate: nil)
        let canHousehold =
            (analysisViewMode == .couple || analysisViewMode == .family) && partner != nil
        if canHousehold, let par = partner {
            let a = ProjectionEngine.runProjection(primary, options: opts)
            let b = ProjectionEngine.runProjection(par, options: opts)
            return HouseholdEngine.combineProjections(primary: a, partner: b, profiles: (primary, par))
        }
        let single = (activePersonId == .partner && partner != nil) ? partner! : primary
        return ProjectionEngine.runProjection(single, options: opts)
    }

    var fire: FireMetrics {
        let opts = RunProjectionOptions(taxYearPack: taxYearPack, asOfDate: nil)
        let canHousehold =
            (analysisViewMode == .couple || analysisViewMode == .family) && partner != nil
        if canHousehold, let par = partner {
            let comb = projection
            return HouseholdEngine.computeHouseholdFire(
                primary: primary,
                partner: par,
                combinedProjection: comb,
                pack: taxYearPack,
            )
        }
        let single = (activePersonId == .partner && partner != nil) ? partner! : primary
        let proj = ProjectionEngine.runProjection(single, options: opts)
        return FireEngine.computeFire(profile: single, projection: proj, pack: taxYearPack)
    }

    func insights(dismissed: Set<String>) -> [Insight] {
        InsightEngine.generateInsights(
            ctx: InsightContext(
                profile: analysisProfile,
                projection: projection,
                fire: fire,
                taxYearPack: taxYearPack,
            ),
        )
        .filter { !dismissed.contains($0.id) }
    }

    private func schedulePersist(immediateHouseholdOnly: Bool = false) {
        saveTask?.cancel()
        if immediateHouseholdOnly {
            persistHouseholdFields()
            return
        }
        saveTask = Task { @MainActor in
            try? await Task.sleep(nanoseconds: 300_000_000)
            guard !Task.isCancelled else { return }
            persistProfilesToHousehold()
        }
    }

    private func persistHouseholdFields() {
        household.updatedAt = Date()
        try? modelContext.save()
    }

    private func persistProfilesToHousehold() {
        do {
            household.primaryProfileJSON = try JSONEncoder().encode(primary)
            household.partnerProfileJSON = try partner.map { try JSONEncoder().encode($0) }
            household.dependentCount = dependentCount
            household.onboardingComplete = onboardingComplete
            household.updatedAt = Date()
            try modelContext.save()
        } catch {
            assertionFailure("save failed: \(error)")
        }
    }

    private func persistPrefs() {
        let d = UserDefaults.standard
        d.set(analysisTaxYearLabel, forKey: Self.udTaxYear)
        d.set(analysisViewMode.rawValue, forKey: Self.udViewMode)
        d.set(activePersonId.rawValue, forKey: Self.udActivePerson)
        d.set(inflationToggle.rawValue, forKey: Self.udInflation)
        if let data = try? JSONEncoder().encode(selectedScenarioIds) {
            d.set(data, forKey: Self.udScenarios)
        }
    }

    func reloadFromStore() throws {
        let fd = FetchDescriptor<HouseholdRecord>(predicate: #Predicate<HouseholdRecord> { $0.id == "singleton" })
        guard let h = try modelContext.fetch(fd).first else { return }
        household = h
        primary = try Self.decodePrimary(h)
        partner = try Self.decodePartner(h)
        dependentCount = h.dependentCount
        onboardingComplete = h.onboardingComplete
    }
}

private struct HouseholdPlannerKey: EnvironmentKey {
    static var defaultValue: HouseholdPlanner? { nil }
}

extension EnvironmentValues {
    var householdPlanner: HouseholdPlanner? {
        get { self[HouseholdPlannerKey.self] }
        set { self[HouseholdPlannerKey.self] = newValue }
    }
}
