import Foundation

public enum TaxIncomeNI {
    public static func personalAllowance(income: Double, pack: TaxYearPack) -> Double {
        if income <= pack.paTaperStart { return pack.personalAllowance }
        if income >= pack.paTaperEnd { return 0 }
        let reduction = floor((income - pack.paTaperStart) / 2)
        return max(0, pack.personalAllowance - reduction)
    }

    public static func applyTaperedPA(income: Double, bands: [TaxBand], pack: TaxYearPack) -> [TaxBand] {
        let pa = personalAllowance(income: income, pack: pack)
        guard !bands.isEmpty else { return bands }
        var out = bands
        out[0] = TaxBand(upperBound: pa, rate: out[0].rate)
        return out
    }

    public static func applyBands(taxable: Double, bands: [TaxBand]) -> Double {
        var prev = 0.0
        var tax = 0.0
        for band in bands {
            if taxable <= prev { break }
            let slice = min(taxable, band.upperBound) - prev
            if slice > 0 { tax += slice * band.rate }
            prev = band.upperBound
        }
        return tax
    }

    public static func incomeTax(income: Double, region: Region, pack: TaxYearPack) -> Double {
        if income <= 0 { return 0 }
        let base = region == .scotland ? pack.scotlandIncomeBands : pack.englandWalesIncomeBands
        let bands = applyTaperedPA(income: income, bands: base, pack: pack)
        return applyBands(taxable: income, bands: bands)
    }

    public static func nationalInsurance(income: Double, pack: TaxYearPack) -> Double {
        if income <= 0 { return 0 }
        return applyBands(taxable: income, bands: pack.niBands)
    }

    /// Marginal income tax rate on the next £1 of income (aligned with web `marginalIncomeRate`).
    public static func marginalIncomeRate(income: Double, region: Region, pack: TaxYearPack) -> Double {
        let base = region == .scotland ? pack.scotlandIncomeBands : pack.englandWalesIncomeBands
        let bands = applyTaperedPA(income: income, bands: base, pack: pack)
        for band in bands where income < band.upperBound {
            return band.rate
        }
        return bands.last?.rate ?? 0
    }
}
