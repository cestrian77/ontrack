import Foundation

public struct FireMetrics: Sendable, Equatable {
    public var fireNumber: Double
    public var leanFireNumber: Double
    public var fatFireNumber: Double
    public var coastFireNumber: Double
    public var baristaFireNumber: Double
    public var investableNow: Double
    public var fireProgressPct: Double
    public var coastFireProgressPct: Double
    public var yearsToFire: Int?
    public var fireAge: Int?
    public var coastReached: Bool
    public var savingsRate: Double
    public var effectiveFireNumber: Double
    public var effectiveLeanFireNumber: Double
    public var effectiveFatFireNumber: Double
    public var effectiveCoastFireNumber: Double
    public var effectiveBaristaFireNumber: Double
    public var firePotNow: Double
    public var firePotAtRetirement: Double
    public var passiveIncomeAtReference: Double
    public var referenceAgeForPassive: Int?
    public var coastFireApplicable: Bool
    public var fireCalculationUsesIncomeOffsets: Bool
    public var fireCalculationUsesPotFilters: Bool
}

public enum FireEngine {
    public static func computeFire(
        profile: UserProfile,
        projection: Projection,
        pack: TaxYearPack = .uk2026_27,
    ) -> FireMetrics {
        let prefs = FirePrefsMath.merge(profile.fireCalculationPrefs)
        let usesOffsets = FirePrefsMath.usesIncomeOffsets(prefs)
        let usesPotFilters = FirePrefsMath.usesPotFilters(prefs)

        let age = projection.meta.currentAge
        let swr = profile.safeWithdrawalRate
        let target = profile.targetRetirementIncome

        let fireNumber = target / swr
        let leanFireNumber = (target * profile.leanFirePct) / swr
        let fatFireNumber = (target * profile.fatFirePct) / swr
        let baristaTarget = max(0, target - profile.baristaPartTimeIncome)
        let baristaFireNumber = baristaTarget / swr

        let yearsToRetirement = max(1, profile.retirementTargetAge - age)
        let realPensionGrowth = (1 + profile.pensionGrowth) / (1 + profile.cpi) - 1
        let coastFireNumber = fireNumber / pow(1 + realPensionGrowth, Double(yearsToRetirement))

        let refYear = FirePrefsMath.findReferenceYear(projection: projection, profile: profile, prefs: prefs)
        let passiveIncomeAtReference = refYear.map { FirePrefsMath.passiveIncome(on: $0, prefs: prefs) } ?? 0
        let referenceAgeForPassive = refYear?.age

        let effectiveFireNumber =
            FirePrefsMath.portfolioGap(targetIncome: target, passive: passiveIncomeAtReference) / swr
        let effectiveLeanFireNumber =
            FirePrefsMath.portfolioGap(
                targetIncome: target * profile.leanFirePct,
                passive: passiveIncomeAtReference,
            ) / swr
        let effectiveFatFireNumber =
            FirePrefsMath.portfolioGap(
                targetIncome: target * profile.fatFirePct,
                passive: passiveIncomeAtReference,
            ) / swr
        let effectiveBaristaFireNumber =
            FirePrefsMath.portfolioGap(
                targetIncome: baristaTarget,
                passive: passiveIncomeAtReference,
            ) / swr

        let coastFireApplicable = prefs.includePensionInPot
        let effectiveCoastFireNumber = coastFireApplicable
            ? effectiveFireNumber / pow(1 + realPensionGrowth, Double(yearsToRetirement))
            : coastFireNumber

        let y0 = projection.years.first
        let investableNow = y0?.investableNetWorth ?? 0
        let firePotNow = y0.map { FirePrefsMath.firePot(on: $0, prefs: prefs) } ?? 0
        let atRetirement = projection.years.first { $0.age >= profile.retirementTargetAge }
        let firePotAtRetirement = atRetirement.map { FirePrefsMath.firePot(on: $0, prefs: prefs) } ?? firePotNow

        let fireProgressPct = min(
            1000,
            (firePotNow / max(1, effectiveFireNumber)) * 100,
        )
        let coastFireProgressPct = coastFireApplicable
            ? min(1000, (firePotNow / max(1, effectiveCoastFireNumber)) * 100)
            : 0
        let coastReached = coastFireApplicable && firePotNow >= effectiveCoastFireNumber

        var yearsToFire: Int?
        var fireAge: Int?
        for y in projection.years where FirePrefsMath.firePot(on: y, prefs: prefs) >= effectiveFireNumber {
            yearsToFire = y.age - age
            fireAge = y.age
            break
        }

        let tax = TaxIncomeNI.incomeTax(income: profile.grossSalary, region: profile.region, pack: pack)
        let ni = TaxIncomeNI.nationalInsurance(income: profile.grossSalary, pack: pack)
        _ = max(0, profile.grossSalary - tax - ni)
        let annualSaving =
            profile.ssIsaMonthly * 12
            + (profile.hasLisa ? profile.lisaMonthly * 12 : 0)
            + (profile.hasGia ? profile.giaMonthly * 12 : 0)
            + profile.sippMonthly * 12
            + profile.grossSalary * profile.employeeContribPct
        let savingsRate = profile.grossSalary > 0 ? annualSaving / profile.grossSalary : 0

        return FireMetrics(
            fireNumber: fireNumber,
            leanFireNumber: leanFireNumber,
            fatFireNumber: fatFireNumber,
            coastFireNumber: coastFireNumber,
            baristaFireNumber: baristaFireNumber,
            investableNow: investableNow,
            fireProgressPct: fireProgressPct,
            coastFireProgressPct: coastFireProgressPct,
            yearsToFire: yearsToFire,
            fireAge: fireAge,
            coastReached: coastReached,
            savingsRate: savingsRate,
            effectiveFireNumber: effectiveFireNumber,
            effectiveLeanFireNumber: effectiveLeanFireNumber,
            effectiveFatFireNumber: effectiveFatFireNumber,
            effectiveCoastFireNumber: effectiveCoastFireNumber,
            effectiveBaristaFireNumber: effectiveBaristaFireNumber,
            firePotNow: firePotNow,
            firePotAtRetirement: firePotAtRetirement,
            passiveIncomeAtReference: passiveIncomeAtReference,
            referenceAgeForPassive: referenceAgeForPassive,
            coastFireApplicable: coastFireApplicable,
            fireCalculationUsesIncomeOffsets: usesOffsets,
            fireCalculationUsesPotFilters: usesPotFilters,
        )
    }
}
