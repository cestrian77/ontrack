import Foundation

enum MortgageMath {
    static func monthlyPayment(principal: Double, annualRate: Double, termYears: Double) -> Double {
        let n = termYears * 12
        let r = annualRate / 12
        if r == 0 { return principal / max(1, n) }
        let factor = pow(1 + r, n)
        return (principal * (r * factor)) / (factor - 1)
    }

    static func balanceAfterMonths(
        principal: Double,
        annualRate: Double,
        termYears: Double,
        months k: Double,
    ) -> Double {
        let r = annualRate / 12
        let n = termYears * 12
        if r == 0 {
            let m = principal / max(1, n)
            return max(0, principal - m * k)
        }
        let m = monthlyPayment(principal: principal, annualRate: annualRate, termYears: termYears)
        return max(
            0,
            principal * pow(1 + r, k) - (m * (pow(1 + r, k) - 1)) / r,
        )
    }

    public struct MortgageInputs: Sendable, Equatable {
        public var principal: Double
        public var annualRate: Double
        public var termYears: Double
        public var type: MortgageType
        public var monthlyOverpayment: Double

        public init(
            principal: Double,
            annualRate: Double,
            termYears: Double,
            type: MortgageType,
            monthlyOverpayment: Double = 0,
        ) {
            self.principal = principal
            self.annualRate = annualRate
            self.termYears = termYears
            self.type = type
            self.monthlyOverpayment = monthlyOverpayment
        }
    }

    public struct AmortPoint: Sendable, Equatable {
        public var monthIndex: Int
        public var balance: Double
        public var interestPaid: Double
        public var principalPaid: Double
    }

    /// Month-by-month amortisation (aligned with web `amortise`).
    public static func amortise(_ inputs: MortgageInputs) -> [AmortPoint] {
        let r = inputs.annualRate / 12
        let n = inputs.termYears * 12
        var balance = inputs.principal
        var cumulativeInterest = 0.0
        var cumulativePrincipal = 0.0
        let baseMonthly: Double =
            inputs.type == .interest_only
            ? inputs.principal * r
            : monthlyPayment(
                principal: inputs.principal,
                annualRate: inputs.annualRate,
                termYears: inputs.termYears,
            )
        var out: [AmortPoint] = []
        let maxMonths = Int(n)
        for i in 1 ... maxMonths where balance > 0.01 {
            let interest = balance * r
            let principalPaid: Double
            if inputs.type == .interest_only {
                principalPaid = inputs.monthlyOverpayment
            } else {
                let scheduled = baseMonthly - interest
                principalPaid = scheduled + inputs.monthlyOverpayment
            }
            let pp = min(principalPaid, balance)
            balance -= pp
            cumulativeInterest += interest
            cumulativePrincipal += pp
            out.append(
                AmortPoint(
                    monthIndex: i,
                    balance: balance,
                    interestPaid: cumulativeInterest,
                    principalPaid: cumulativePrincipal,
                ),
            )
            if balance < 0.01 { break }
        }
        return out
    }

    public struct OverpaymentSummary: Sendable, Equatable {
        public var baseMonths: Int
        public var baseInterest: Double
        public var overpayMonths: Int
        public var overpayInterest: Double
        public var monthsSaved: Int
        public var interestSaved: Double
    }

    public static func overpaymentSummary(_ inputs: MortgageInputs, overpayment: Double) -> OverpaymentSummary {
        let base = amortise(
            MortgageInputs(
                principal: inputs.principal,
                annualRate: inputs.annualRate,
                termYears: inputs.termYears,
                type: inputs.type,
                monthlyOverpayment: 0,
            ),
        )
        let over = amortise(
            MortgageInputs(
                principal: inputs.principal,
                annualRate: inputs.annualRate,
                termYears: inputs.termYears,
                type: inputs.type,
                monthlyOverpayment: overpayment,
            ),
        )
        let baseLast = base.last
        let overLast = over.last
        return OverpaymentSummary(
            baseMonths: base.count,
            baseInterest: baseLast?.interestPaid ?? 0,
            overpayMonths: over.count,
            overpayInterest: overLast?.interestPaid ?? 0,
            monthsSaved: base.count - over.count,
            interestSaved: (baseLast?.interestPaid ?? 0) - (overLast?.interestPaid ?? 0),
        )
    }

    /// Sum of interest portions over the first 12 months (repayment), for BTL modelling.
    public static func interestPortionOverYear(balance: Double, annualRate: Double, termYears: Double) -> Double {
        let r = annualRate / 12
        let m = monthlyPayment(principal: balance, annualRate: annualRate, termYears: termYears)
        var bal = balance
        var interestSum = 0.0
        for _ in 0 ..< 12 where bal > 0 {
            let interest = bal * r
            interestSum += interest
            let principal = m - interest
            bal = max(0, bal - principal)
        }
        return interestSum
    }
}
