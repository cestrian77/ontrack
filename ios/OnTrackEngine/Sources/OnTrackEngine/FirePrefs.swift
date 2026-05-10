import Foundation

public enum FireReferenceAgeMode: String, Codable, Sendable {
    case at_retirement
    case steady_state_after_spa
}

/// Mirrors web [`FireCalculationPrefs`](../../../../src/engine/types.ts).
public struct FireCalculationPrefs: Codable, Sendable, Equatable {
    public var offsetStatePension: Bool
    public var offsetDbPension: Bool
    public var offsetBtlNet: Bool
    public var referenceAgeMode: FireReferenceAgeMode
    public var includePensionInPot: Bool
    public var includeSsIsaInPot: Bool
    public var includeCashIsaInPot: Bool
    public var includeLisaInPot: Bool
    public var includeGiaInPot: Bool
    public var includeCashInPot: Bool

    public init(
        offsetStatePension: Bool = false,
        offsetDbPension: Bool = false,
        offsetBtlNet: Bool = false,
        referenceAgeMode: FireReferenceAgeMode = .at_retirement,
        includePensionInPot: Bool = true,
        includeSsIsaInPot: Bool = true,
        includeCashIsaInPot: Bool = true,
        includeLisaInPot: Bool = true,
        includeGiaInPot: Bool = true,
        includeCashInPot: Bool = true,
    ) {
        self.offsetStatePension = offsetStatePension
        self.offsetDbPension = offsetDbPension
        self.offsetBtlNet = offsetBtlNet
        self.referenceAgeMode = referenceAgeMode
        self.includePensionInPot = includePensionInPot
        self.includeSsIsaInPot = includeSsIsaInPot
        self.includeCashIsaInPot = includeCashIsaInPot
        self.includeLisaInPot = includeLisaInPot
        self.includeGiaInPot = includeGiaInPot
        self.includeCashInPot = includeCashInPot
    }

    public static let webDefault = FireCalculationPrefs()
}

public enum FirePrefsMath {
    public static func merge(_ partial: FireCalculationPrefs?) -> FireCalculationPrefs {
        guard let p = partial else { return .webDefault }
        var d = FireCalculationPrefs.webDefault
        d.offsetStatePension = p.offsetStatePension
        d.offsetDbPension = p.offsetDbPension
        d.offsetBtlNet = p.offsetBtlNet
        d.referenceAgeMode = p.referenceAgeMode
        d.includePensionInPot = p.includePensionInPot
        d.includeSsIsaInPot = p.includeSsIsaInPot
        d.includeCashIsaInPot = p.includeCashIsaInPot
        d.includeLisaInPot = p.includeLisaInPot
        d.includeGiaInPot = p.includeGiaInPot
        d.includeCashInPot = p.includeCashInPot
        return d
    }

    public static func usesIncomeOffsets(_ prefs: FireCalculationPrefs) -> Bool {
        prefs.offsetStatePension || prefs.offsetDbPension || prefs.offsetBtlNet
    }

    public static func usesPotFilters(_ prefs: FireCalculationPrefs) -> Bool {
        !prefs.includePensionInPot || !prefs.includeSsIsaInPot || !prefs.includeCashIsaInPot
            || !prefs.includeLisaInPot || !prefs.includeGiaInPot || !prefs.includeCashInPot
    }

    public static func passiveIncome(on y: ProjectionYear, prefs: FireCalculationPrefs) -> Double {
        var s = 0.0
        if prefs.offsetStatePension { s += y.statePensionIncome }
        if prefs.offsetDbPension { s += y.dbIncome }
        if prefs.offsetBtlNet { s += max(0, y.btlCashflowNet) }
        return s
    }

    public static func firePot(on y: ProjectionYear, prefs: FireCalculationPrefs) -> Double {
        var t = 0.0
        if prefs.includePensionInPot { t += y.pensionValue }
        if prefs.includeSsIsaInPot { t += y.isaValue }
        if prefs.includeCashIsaInPot { t += y.cashIsaValue }
        if prefs.includeLisaInPot { t += y.lisaValue }
        if prefs.includeGiaInPot { t += y.giaValue }
        if prefs.includeCashInPot { t += y.cashValue }
        return t
    }

    public static func portfolioGap(targetIncome: Double, passive: Double) -> Double {
        max(0, targetIncome - passive)
    }

    public static func findReferenceYear(
        projection: Projection,
        profile: UserProfile,
        prefs: FireCalculationPrefs,
    ) -> ProjectionYear? {
        let threshold: Int =
            prefs.referenceAgeMode == .at_retirement
            ? profile.retirementTargetAge
            : max(profile.retirementTargetAge, profile.statePensionClaimAge)
        return projection.years.first { $0.age >= threshold }
    }
}
