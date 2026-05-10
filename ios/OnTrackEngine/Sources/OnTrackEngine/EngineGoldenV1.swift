import Foundation

public struct GoldenFireExpected: Codable, Sendable {
    public let fireNumber: Double
    public let leanFireNumber: Double
    public let fatFireNumber: Double
    public let coastFireNumber: Double
    public let baristaFireNumber: Double
    public let investableNow: Double
    public let fireProgressPct: Double
    public let coastFireProgressPct: Double
    public let yearsToFire: Int?
    public let fireAge: Int?
    public let coastReached: Bool
    public let savingsRate: Double
}

public struct ProjectionMetaExpected: Codable, Sendable {
    public let currentAge: Int
    public let retirementAge: Int
    public let nmpa: Int
    public let spa: Int
    public let horizon: Int
    public let isHousehold: Bool?
}

public struct GoldenYearSnapshot: Codable, Sendable {
    public let index: Int
    public let year: Int?
    public let age: Int
    public let totalNetWorth: Double
    public let investableNetWorth: Double
    public let pensionValue: Double?
    public let isaValue: Double?
    public let primaryEquity: Double?
    public let retired: Bool?
}

public struct GoldenProjectionExpected: Codable, Sendable {
    public let meta: ProjectionMetaExpected
    public let yearSnapshots: [GoldenYearSnapshot]
}

public struct GoldenExpected: Codable, Sendable {
    public let fire: GoldenFireExpected
    public let projection: GoldenProjectionExpected
}

/// Mirrors committed JSON under `fixtures/engine-goldens/cases/*.json`.
public struct EngineGoldenFileV1: Codable, Sendable {
    public let engineGoldenVersion: Int
    public let id: String
    public let description: String?
    public let asOfDate: String
    public let taxYearLabel: String
    public let profile: UserProfile
    public let expected: GoldenExpected
}
