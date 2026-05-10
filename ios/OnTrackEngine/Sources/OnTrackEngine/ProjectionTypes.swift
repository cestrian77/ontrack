import Foundation

public struct ProjectionYear: Sendable, Equatable {
    public var year: Int
    public var age: Int
    public var pensionValue: Double
    public var isaValue: Double
    public var cashIsaValue: Double
    public var lisaValue: Double
    public var giaValue: Double
    public var cashValue: Double
    public var primaryEquity: Double
    public var primaryValue: Double
    public var primaryMortgageBalance: Double
    public var btlEquity: Double
    public var btlValue: Double
    public var btlMortgageBalance: Double
    public var totalNetWorth: Double
    public var investableNetWorth: Double
    public var btlCashflowNet: Double
    public var statePensionIncome: Double
    public var dbIncome: Double
    public var drawdownIncome: Double
    public var retired: Bool
}

public struct ProjectionMeta: Sendable, Equatable {
    public var currentAge: Int
    public var retirementAge: Int
    public var nmpa: Int
    public var spa: Int
    public var horizon: Int
    /// True when `combineProjections` merged primary + partner.
    public var isHousehold: Bool

    public init(
        currentAge: Int,
        retirementAge: Int,
        nmpa: Int,
        spa: Int,
        horizon: Int,
        isHousehold: Bool = false,
    ) {
        self.currentAge = currentAge
        self.retirementAge = retirementAge
        self.nmpa = nmpa
        self.spa = spa
        self.horizon = horizon
        self.isHousehold = isHousehold
    }
}

public struct Projection: Sendable, Equatable {
    public var years: [ProjectionYear]
    public var meta: ProjectionMeta
}
