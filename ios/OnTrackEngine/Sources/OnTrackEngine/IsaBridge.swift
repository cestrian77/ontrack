import Foundation

public struct IsaBridgeResult: Sendable, Equatable {
    public var required: Bool
    public var bridgeYears: Int
    public var isaAtRetirement: Double
    public var needed: Double
    public var shortfall: Double
}

public enum IsaBridgeEngine {
    public static func isaBridge(profile: UserProfile, projection: Projection) -> IsaBridgeResult {
        let retirementAge = projection.meta.retirementAge
        let nmpa = projection.meta.nmpa
        if retirementAge >= nmpa {
            return IsaBridgeResult(
                required: false,
                bridgeYears: 0,
                isaAtRetirement: 0,
                needed: 0,
                shortfall: 0,
            )
        }
        let bridgeYears = nmpa - retirementAge
        let atRetire = projection.years.first { $0.age == retirementAge }
        let isaAtRetirement = (atRetire?.isaValue ?? 0) + (atRetire?.cashIsaValue ?? 0)
        let needed = profile.targetRetirementIncome * Double(bridgeYears)
        return IsaBridgeResult(
            required: true,
            bridgeYears: bridgeYears,
            isaAtRetirement: isaAtRetirement,
            needed: needed,
            shortfall: needed - isaAtRetirement,
        )
    }
}
