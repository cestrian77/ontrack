import Foundation

public enum Region: String, Codable, Sendable {
    case england_wales
    case scotland
}

public enum Employment: String, Codable, Sendable {
    case employed
    case self_employed
    case both
}

public enum MortgageType: String, Codable, Sendable {
    case repayment
    case interest_only
}

public enum Ownership: String, Codable, Sendable {
    case sole
    case joint
}

public struct BTLProperty: Codable, Sendable, Equatable {
    public var id: String
    public var label: String?
    public var value: Double
    public var mortgageBalance: Double
    public var mortgageRate: Double
    public var mortgageTermYears: Double
    public var mortgageType: MortgageType
    public var monthlyGrossRent: Double
    public var voidRate: Double
    public var annualMaintenance: Double
    public var lettingAgentFeePct: Double
    public var annualInsurance: Double
    public var appreciationRate: Double
    public var ownership: Ownership
}

public struct MonthlyBoostParams: Codable, Sendable, Equatable {
    public var monthlyExtra: Double
    public var mode: String
    public var rampYears: Int

    public init(monthlyExtra: Double, mode: String, rampYears: Int) {
        self.monthlyExtra = monthlyExtra
        self.mode = mode
        self.rampYears = rampYears
    }
}

public struct ScenarioContributionAdj: Codable, Sendable, Equatable {
    public var sippExtraMonthly: MonthlyBoostParams?
    public var ssIsaExtraMonthly: MonthlyBoostParams?
    public var primaryOverpayExtraMonthly: MonthlyBoostParams?

    public init(
        sippExtraMonthly: MonthlyBoostParams? = nil,
        ssIsaExtraMonthly: MonthlyBoostParams? = nil,
        primaryOverpayExtraMonthly: MonthlyBoostParams? = nil,
    ) {
        self.sippExtraMonthly = sippExtraMonthly
        self.ssIsaExtraMonthly = ssIsaExtraMonthly
        self.primaryOverpayExtraMonthly = primaryOverpayExtraMonthly
    }
}

/// Mirrors [`src/engine/types.ts`](../../../../src/engine/types.ts) `UserProfile` for engine I/O.
public struct UserProfile: Codable, Sendable, Equatable {
    public var dateOfBirth: String
    public var retirementTargetAge: Int
    public var targetRetirementIncome: Double
    public var region: Region
    public var partnered: Bool

    public var employment: Employment
    public var grossSalary: Double
    public var bonus: Double
    public var salaryGrowth: Double
    public var statePensionClaimAge: Int
    public var statePensionWeekly: Double

    public var pensionPot: Double
    public var employeeContribPct: Double
    public var employerContribPct: Double
    public var sippMonthly: Double
    public var pensionAccessAge: Int
    public var pensionGrowth: Double
    public var hasDB: Bool
    public var dbAnnualIncome: Double
    public var dbNRA: Int

    public var ssIsaValue: Double
    public var ssIsaMonthly: Double
    public var cashIsaValue: Double
    public var cashIsaRate: Double
    public var giaValue: Double
    public var giaMonthly: Double
    public var giaGrowth: Double
    public var isaGrowth: Double
    public var lisaValue: Double
    public var lisaMonthly: Double
    public var hasLisa: Bool
    public var hasGia: Bool

    public var primaryValue: Double
    public var primaryMortgage: Double
    public var primaryMortgagePayment: Double
    public var primaryMortgageRate: Double
    public var primaryMortgageTermYears: Double
    public var primaryMortgageType: MortgageType
    public var primaryAppreciation: Double
    public var primaryOverpayment: Double
    public var primaryLabel: String?

    public var btlProperties: [BTLProperty]

    public var cashSavings: Double
    public var expectedInheritance: Double
    public var inheritanceYear: Int?
    public var otherIncomeMonthly: Double
    public var monthlySurplus: Double

    public var cpi: Double
    public var cashRate: Double
    public var rentalGrowth: Double
    public var spTripleLockGrowth: Double

    public var safeWithdrawalRate: Double
    public var leanFirePct: Double
    public var fatFirePct: Double
    public var baristaPartTimeIncome: Double

    /// Optional; web defaults match classic FIRE when omitted.
    public var fireCalculationPrefs: FireCalculationPrefs?

    /// Scenario-only contribution ramps (aligned with web `scenarioContributionAdj`).
    public var scenarioContributionAdj: ScenarioContributionAdj?

    public var updatedAt: String
}
