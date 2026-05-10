import Foundation

/// PRD §8.2 basic-rate credit on finance costs (aligned with `DEFAULT_BTL_INTEREST_RELIEF`).
private let defaultBtlInterestRelief = 0.2

public struct BTLCashflowResult: Sendable, Equatable {
    public var netCashflow: Double
}

public enum BtlCashflowEngine {
    public static func btlAnnualCashflow(
        _ p: BTLProperty,
        otherIncome: Double,
        region: Region,
        taxYearPack: TaxYearPack,
        rentScale: Double = 1,
        operatingCostScale: Double = 1,
    ) -> BTLCashflowResult {
        let mb = p.mortgageBalance
        let termRem = max(1, p.mortgageTermYears)
        let ownershipFactor = p.ownership == .joint ? 0.5 : 1.0
        let grossRent = p.monthlyGrossRent * 12 * rentScale
        let voidAdjustment = grossRent * p.voidRate
        let effectiveRent = grossRent - voidAdjustment
        let agentFees = effectiveRent * p.lettingAgentFeePct
        let maintenance = p.annualMaintenance * operatingCostScale
        let insurance = p.annualInsurance * operatingCostScale
        let operatingExpenses = agentFees + maintenance + insurance

        let mortgageInterest: Double =
            p.mortgageType == .interest_only
            ? mb * p.mortgageRate
            : MortgageMath.interestPortionOverYear(
                balance: mb,
                annualRate: p.mortgageRate,
                termYears: termRem,
            )
        let mortgagePayment: Double =
            p.mortgageType == .interest_only
            ? mortgageInterest
            : MortgageMath.monthlyPayment(
                principal: mb,
                annualRate: p.mortgageRate,
                termYears: termRem,
            ) * 12

        let taxableIncome = (effectiveRent - operatingExpenses) * ownershipFactor
        let marginal = TaxIncomeNI.marginalIncomeRate(
            income: otherIncome + max(0, taxableIncome),
            region: region,
            pack: taxYearPack,
        )
        let taxBeforeCredit = max(0, taxableIncome) * marginal
        let s24Credit = mortgageInterest * ownershipFactor * defaultBtlInterestRelief
        let taxOnRental = max(0, taxBeforeCredit - s24Credit)
        let netCashflow =
            (effectiveRent - operatingExpenses - mortgagePayment) * ownershipFactor - taxOnRental
        return BTLCashflowResult(netCashflow: netCashflow)
    }
}
