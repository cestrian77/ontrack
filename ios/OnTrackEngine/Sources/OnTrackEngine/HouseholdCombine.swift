import Foundation

public enum HouseholdEngine {
    private static func zeroPrimaryFields(_ y: ProjectionYear) -> ProjectionYear {
        var z = y
        z.primaryEquity = 0
        z.primaryValue = 0
        z.primaryMortgageBalance = 0
        return z
    }

    private static func mergeYear(
        _ a: ProjectionYear,
        _ b: ProjectionYear,
        excludePartnerPrimary: Bool,
    ) -> ProjectionYear {
        let bEff = excludePartnerPrimary ? zeroPrimaryFields(b) : b
        let pensionValue = a.pensionValue + bEff.pensionValue
        let isaValue = a.isaValue + bEff.isaValue
        let cashIsaValue = a.cashIsaValue + bEff.cashIsaValue
        let lisaValue = a.lisaValue + bEff.lisaValue
        let giaValue = a.giaValue + bEff.giaValue
        let cashValue = a.cashValue + bEff.cashValue
        let primaryEquity = a.primaryEquity + bEff.primaryEquity
        let primaryValue = a.primaryValue + bEff.primaryValue
        let primaryMortgageBalance = a.primaryMortgageBalance + bEff.primaryMortgageBalance
        let btlEquity = a.btlEquity + bEff.btlEquity
        let btlValue = a.btlValue + bEff.btlValue
        let btlMortgageBalance = a.btlMortgageBalance + bEff.btlMortgageBalance
        let investableNetWorth = pensionValue + isaValue + cashIsaValue + lisaValue + giaValue + cashValue
        let totalNetWorth = investableNetWorth + primaryEquity + btlEquity
        return ProjectionYear(
            year: a.year,
            age: a.age,
            pensionValue: pensionValue,
            isaValue: isaValue,
            cashIsaValue: cashIsaValue,
            lisaValue: lisaValue,
            giaValue: giaValue,
            cashValue: cashValue,
            primaryEquity: primaryEquity,
            primaryValue: primaryValue,
            primaryMortgageBalance: primaryMortgageBalance,
            btlEquity: btlEquity,
            btlValue: btlValue,
            btlMortgageBalance: btlMortgageBalance,
            totalNetWorth: totalNetWorth,
            investableNetWorth: investableNetWorth,
            btlCashflowNet: a.btlCashflowNet + bEff.btlCashflowNet,
            statePensionIncome: a.statePensionIncome + bEff.statePensionIncome,
            dbIncome: a.dbIncome + bEff.dbIncome,
            drawdownIncome: a.drawdownIncome + bEff.drawdownIncome,
            retired: a.retired && bEff.retired,
        )
    }

    /// Merge two projections by row index (primary’s age axis), mirroring web `combineProjections`.
    public static func combineProjections(
        primary: Projection,
        partner: Projection,
        profiles: (primary: UserProfile, partner: UserProfile),
        excludePartnerPrimary: Bool = true,
    ) -> Projection {
        let n = min(primary.years.count, partner.years.count)
        var years: [ProjectionYear] = []
        years.reserveCapacity(n)
        for i in 0 ..< n {
            years.append(mergeYear(primary.years[i], partner.years[i], excludePartnerPrimary: excludePartnerPrimary))
        }
        let retirementAge = max(
            profiles.primary.retirementTargetAge,
            profiles.partner.retirementTargetAge,
        )
        return Projection(
            years: years,
            meta: ProjectionMeta(
                currentAge: primary.meta.currentAge,
                retirementAge: retirementAge,
                nmpa: primary.meta.nmpa,
                spa: primary.meta.spa,
                horizon: n,
                isHousehold: true,
            ),
        )
    }

    /// Synthetic profile for household FIRE + insights (web `buildHouseholdSyntheticProfile`).
    public static func buildHouseholdSyntheticProfile(primary: UserProfile, partner: UserProfile) -> UserProfile {
        var s = primary
        s.partnered = true
        s.statePensionClaimAge = max(primary.statePensionClaimAge, partner.statePensionClaimAge)
        s.fireCalculationPrefs = FirePrefsMath.merge(primary.fireCalculationPrefs)
        s.targetRetirementIncome = primary.targetRetirementIncome + partner.targetRetirementIncome
        s.retirementTargetAge = max(primary.retirementTargetAge, partner.retirementTargetAge)
        s.grossSalary = primary.grossSalary + partner.grossSalary
        s.bonus = primary.bonus + partner.bonus
        s.baristaPartTimeIncome = primary.baristaPartTimeIncome + partner.baristaPartTimeIncome
        s.hasLisa = primary.hasLisa || partner.hasLisa
        s.hasGia = primary.hasGia || partner.hasGia
        s.ssIsaMonthly = primary.ssIsaMonthly + partner.ssIsaMonthly
        s.lisaMonthly = primary.lisaMonthly + partner.lisaMonthly
        s.giaMonthly = primary.giaMonthly + partner.giaMonthly
        s.sippMonthly = primary.sippMonthly + partner.sippMonthly
        s.otherIncomeMonthly = primary.otherIncomeMonthly + partner.otherIncomeMonthly
        s.monthlySurplus = primary.monthlySurplus + partner.monthlySurplus
        let sumSal = primary.grossSalary + partner.grossSalary
        if sumSal > 0 {
            s.employeeContribPct =
                (primary.grossSalary * primary.employeeContribPct
                    + partner.grossSalary * partner.employeeContribPct) / sumSal
        }
        return s
    }

    public static func computeHouseholdFire(
        primary: UserProfile,
        partner: UserProfile,
        combinedProjection: Projection,
        pack: TaxYearPack = .uk2026_27,
    ) -> FireMetrics {
        let synthetic = buildHouseholdSyntheticProfile(primary: primary, partner: partner)
        return FireEngine.computeFire(profile: synthetic, projection: combinedProjection, pack: pack)
    }
}
