import Foundation

private let horizonAge = 100

public struct RunProjectionOptions: Sendable {
    public var taxYearPack: TaxYearPack
    public var asOfDate: String?

    public init(taxYearPack: TaxYearPack = .uk2026_27, asOfDate: String? = nil) {
        self.taxYearPack = taxYearPack
        self.asOfDate = asOfDate
    }
}

public enum ProjectionEngine {
    private static func rampedMonthlyExtra(_ adj: MonthlyBoostParams?, yearIndex: Int) -> Double {
        guard let adj else { return 0 }
        if adj.mode == "flat" { return adj.monthlyExtra }
        let y = max(1, adj.rampYears)
        return adj.monthlyExtra * min(1, Double(yearIndex) / Double(y))
    }

    private static var utcCalendar: Calendar {
        var c = Calendar(identifier: .gregorian)
        c.timeZone = TimeZone(secondsFromGMT: 0)!
        return c
    }

    private static func resolveAsOf(_ options: RunProjectionOptions) -> Date {
        if let iso = options.asOfDate, let d = parseDateOnly(iso) {
            return d.addingTimeInterval(12 * 3600)
        }
        return Date()
    }

    private static func parseDateOnly(_ s: String) -> Date? {
        let f = DateFormatter()
        f.timeZone = TimeZone(secondsFromGMT: 0)
        f.calendar = utcCalendar
        f.dateFormat = "yyyy-MM-dd"
        return f.date(from: s)
    }

    /// Calendar age; **UTC** date parts (aligned with `runProjection` + Vitest in UTC).
    public static func ageFromDob(dob: String, asOf: Date) -> Int {
        let cal = utcCalendar
        guard let dobDate = parseDateOnly(dob) else { return 0 }
        let y1 = cal.component(.year, from: dobDate)
        let y2 = cal.component(.year, from: asOf)
        var age = y2 - y1
        let m1 = cal.component(.month, from: dobDate)
        let m2 = cal.component(.month, from: asOf)
        let d1 = cal.component(.day, from: dobDate)
        let d2 = cal.component(.day, from: asOf)
        if m2 < m1 || (m2 == m1 && d2 < d1) { age -= 1 }
        return age
    }

    private static func realRate(nominal: Double, cpi: Double) -> Double {
        (1 + nominal) / (1 + cpi) - 1
    }

    public static func runProjection(_ profile: UserProfile, options: RunProjectionOptions = RunProjectionOptions())
        -> Projection
    {
        let pack = options.taxYearPack
        let asOf = resolveAsOf(options)
        let cal = utcCalendar
        let currentAge = ageFromDob(dob: profile.dateOfBirth, asOf: asOf)
        let startYear = cal.component(.year, from: asOf)
        let retirementAge = profile.retirementTargetAge
        let nmpa = profile.pensionAccessAge
        let spa = profile.statePensionClaimAge
        let horizon = max(horizonAge - currentAge, 1)

        var pension = profile.pensionPot
        var ssIsa = profile.ssIsaValue
        var cashIsa = profile.cashIsaValue
        var lisa = profile.hasLisa ? profile.lisaValue : 0
        var gia = profile.hasGia ? profile.giaValue : 0
        var cash = profile.cashSavings

        var primaryValue = profile.primaryValue
        var primaryBalance = profile.primaryMortgage

        var btlBalances = profile.btlProperties.map(\.mortgageBalance)
        var btlValues = profile.btlProperties.map(\.value)

        let rPension = realRate(nominal: profile.pensionGrowth, cpi: profile.cpi)
        let rIsa = realRate(nominal: profile.isaGrowth, cpi: profile.cpi)
        let rGia = realRate(nominal: profile.giaGrowth, cpi: profile.cpi)
        let rCash = realRate(nominal: profile.cashRate, cpi: profile.cpi)
        let rCashIsa = realRate(nominal: profile.cashIsaRate, cpi: profile.cpi)
        let rPrimary = profile.primaryAppreciation

        var years: [ProjectionYear] = []

        for i in 0 ... horizon {
            let age = currentAge + i
            let year = startYear + i
            let retired = age >= retirementAge

            let wp = PensionContributions.workplaceContribAnnual(
                grossSalary: profile.grossSalary,
                employeePct: profile.employeeContribPct,
                employerPct: profile.employerContribPct,
            )
            let adj = profile.scenarioContributionAdj
            let sippExtra = rampedMonthlyExtra(adj?.sippExtraMonthly, yearIndex: i)
            let isaExtra = rampedMonthlyExtra(adj?.ssIsaExtraMonthly, yearIndex: i)
            let overpayExtra = rampedMonthlyExtra(adj?.primaryOverpayExtraMonthly, yearIndex: i)
            let sippAnnual = PensionContributions.sippGrossAnnual(monthlyNet: profile.sippMonthly + sippExtra)

            let annualPensionContrib = retired ? 0 : wp.total + sippAnnual
            let annualSsIsaContrib = retired ? 0 : (profile.ssIsaMonthly + isaExtra) * 12
            let annualLisaContribMonthly = (retired || !profile.hasLisa) ? 0 : profile.lisaMonthly
            let giaMonthlyEff = profile.hasGia ? profile.giaMonthly : 0

            if i > 0 {
                pension = pension * (1 + rPension) + annualPensionContrib
                ssIsa = ssIsa * (1 + rIsa) + annualSsIsaContrib
                cashIsa = IsaGiaLisa.compoundAnnual(cashIsa, rate: rCashIsa)
                lisa = IsaGiaLisa.lisaAnnualGrowth(
                    pv: lisa,
                    monthlyContribution: annualLisaContribMonthly,
                    growthRate: rIsa,
                    age: age,
                    pack: pack,
                )
                gia = IsaGiaLisa.giaAnnualGrowth(pv: gia, monthlyContribution: giaMonthlyEff, growthRate: rGia)
                cash = IsaGiaLisa.compoundAnnual(cash, rate: rCash)

                primaryValue = primaryValue * (1 + rPrimary)
                let monthsElapsed = Double(i * 12)
                let termYears = max(profile.primaryMortgageTermYears, 1)
                primaryBalance = MortgageMath.balanceAfterMonths(
                    principal: profile.primaryMortgage,
                    annualRate: profile.primaryMortgageRate,
                    termYears: termYears,
                    months: min(monthsElapsed, termYears * 12),
                )
                if profile.primaryMortgageType == .interest_only {
                    let totalOverpayMo = profile.primaryOverpayment + overpayExtra
                    primaryBalance = max(0, profile.primaryMortgage - totalOverpayMo * 12 * Double(i))
                }

                for idx in profile.btlProperties.indices {
                    let p = profile.btlProperties[idx]
                    btlValues[idx] *= 1 + p.appreciationRate
                    let months = min(Double(i * 12), max(p.mortgageTermYears, 1) * 12)
                    if p.mortgageType == .interest_only {
                        btlBalances[idx] = p.mortgageBalance
                    } else {
                        btlBalances[idx] = MortgageMath.balanceAfterMonths(
                            principal: p.mortgageBalance,
                            annualRate: p.mortgageRate,
                            termYears: max(p.mortgageTermYears, 1),
                            months: months,
                        )
                    }
                }

                if profile.expectedInheritance > 0, let iy = profile.inheritanceYear, year == iy {
                    cash += profile.expectedInheritance
                }
            }

            let btlCashflowNet = 0.0
            _ = pow((1 + profile.rentalGrowth) / (1 + profile.cpi), Double(i))
            // BTL cashflow omitted until full Section-24 port; goldens use `btlProperties: []`.

            let rSpLock = realRate(nominal: profile.spTripleLockGrowth, cpi: profile.cpi)
            let yearsClaimingSp = max(0, age - spa)
            let statePensionIncome =
                age >= spa
                ? profile.statePensionWeekly * 52 * pow(1 + rSpLock, Double(yearsClaimingSp))
                : 0
            let dbIncome = PensionContributions.dbAnnualIncomeAtAge(profile: profile, age: age)

            var drawdownIncome = 0.0
            if retired {
                let target = profile.targetRetirementIncome
                let passive = statePensionIncome + dbIncome + max(0, btlCashflowNet)
                var remaining = max(0, target - passive)
                let fromIsa = min(ssIsa, remaining)
                ssIsa -= fromIsa
                remaining -= fromIsa
                if age >= nmpa, remaining > 0 {
                    let fromPension = min(pension, remaining)
                    pension -= fromPension
                    remaining -= fromPension
                }
                if remaining > 0 {
                    let fromGia = min(gia, remaining)
                    gia -= fromGia
                    remaining -= fromGia
                }
                if remaining > 0 {
                    let fromCash = min(cash, remaining)
                    cash -= fromCash
                    remaining -= fromCash
                }
                let targetNeed = max(0, target - passive)
                drawdownIncome = targetNeed - remaining
            }

            let primaryEquity = max(0, primaryValue - primaryBalance)
            let btlEquityArr: [Double] = profile.btlProperties.indices.map { idx in
                max(0, btlValues[idx] - btlBalances[idx])
            }
            let btlEquity = btlEquityArr.reduce(0, +)
            let btlValueSum = btlValues.reduce(0, +)
            let btlBalanceSum = btlBalances.reduce(0, +)

            let investableNetWorth = pension + ssIsa + cashIsa + lisa + gia + cash
            let totalNetWorth = investableNetWorth + primaryEquity + btlEquity

            years.append(
                ProjectionYear(
                    year: year,
                    age: age,
                    pensionValue: pension,
                    isaValue: ssIsa,
                    cashIsaValue: cashIsa,
                    lisaValue: lisa,
                    giaValue: gia,
                    cashValue: cash,
                    primaryEquity: primaryEquity,
                    primaryValue: primaryValue,
                    primaryMortgageBalance: primaryBalance,
                    btlEquity: btlEquity,
                    btlValue: btlValueSum,
                    btlMortgageBalance: btlBalanceSum,
                    totalNetWorth: totalNetWorth,
                    investableNetWorth: investableNetWorth,
                    btlCashflowNet: btlCashflowNet,
                    statePensionIncome: statePensionIncome,
                    dbIncome: dbIncome,
                    drawdownIncome: drawdownIncome,
                    retired: retired,
                ),
            )
        }

        return Projection(
            years: years,
            meta: ProjectionMeta(
                currentAge: currentAge,
                retirementAge: retirementAge,
                nmpa: nmpa,
                spa: spa,
                horizon: horizon + 1,
                isHousehold: false,
            ),
        )
    }
}
