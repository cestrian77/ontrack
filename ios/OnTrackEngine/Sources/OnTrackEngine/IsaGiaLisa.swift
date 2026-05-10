import Foundation

enum IsaGiaLisa {
    static let defaultGiaCgtDrag = 0.005

    static func compoundAnnual(_ pv: Double, rate: Double) -> Double {
        pv * (1 + rate)
    }

    static func lisaAnnualGrowth(
        pv: Double,
        monthlyContribution: Double,
        growthRate: Double,
        age: Int,
        pack: TaxYearPack,
    ) -> Double {
        let contribAllowed = age <= pack.lisaMaxAgeContrib ? monthlyContribution : 0
        let annualContrib = min(contribAllowed * 12, pack.lisaAnnualAllowance)
        let bonus = annualContrib * pack.lisaBonusRate
        return pv * (1 + growthRate) + annualContrib + bonus
    }

    static func giaAnnualGrowth(
        pv: Double,
        monthlyContribution: Double,
        growthRate: Double,
        cgtDrag: Double = defaultGiaCgtDrag,
    ) -> Double {
        let effective = max(0, growthRate - cgtDrag)
        return pv * (1 + effective) + monthlyContribution * 12
    }
}
