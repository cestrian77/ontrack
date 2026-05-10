import Foundation

public struct TaxBand: Codable, Sendable, Equatable {
    public var upperBound: Double
    public var rate: Double
}

/// Subset of [`TaxYearPack`](../../../../src/engine/constants/taxYears/types.ts) used by the Swift engine.
public struct TaxYearPack: Sendable, Equatable {
    public var label: String
    public var englandWalesIncomeBands: [TaxBand]
    public var scotlandIncomeBands: [TaxBand]
    public var personalAllowance: Double
    public var paTaperStart: Double
    public var paTaperEnd: Double

    public var niBands: [TaxBand]

    public var isaAnnualAllowance: Double
    public var lisaAnnualAllowance: Double
    public var lisaBonusRate: Double
    public var lisaMaxAgeContrib: Int

    /// Frozen **2026/27** pack — keep aligned with [`2026-27.ts`](../../../../src/engine/constants/taxYears/2026-27.ts).
    public static let uk2026_27: TaxYearPack = {
        TaxYearPack(
            label: "2026/27",
            englandWalesIncomeBands: [
                TaxBand(upperBound: 12_570, rate: 0),
                TaxBand(upperBound: 50_270, rate: 0.2),
                TaxBand(upperBound: 125_140, rate: 0.4),
                TaxBand(upperBound: .infinity, rate: 0.45),
            ],
            scotlandIncomeBands: [
                TaxBand(upperBound: 12_570, rate: 0),
                TaxBand(upperBound: 16_537, rate: 0.19),
                TaxBand(upperBound: 29_526, rate: 0.2),
                TaxBand(upperBound: 43_662, rate: 0.21),
                TaxBand(upperBound: 75_000, rate: 0.42),
                TaxBand(upperBound: 125_140, rate: 0.45),
                TaxBand(upperBound: .infinity, rate: 0.48),
            ],
            personalAllowance: 12_570,
            paTaperStart: 100_000,
            paTaperEnd: 125_140,
            niBands: [
                TaxBand(upperBound: 12_570, rate: 0),
                TaxBand(upperBound: 50_270, rate: 0.08),
                TaxBand(upperBound: .infinity, rate: 0.02),
            ],
            isaAnnualAllowance: 20_000,
            lisaAnnualAllowance: 4_000,
            lisaBonusRate: 0.25,
            lisaMaxAgeContrib: 50,
        )
    }()
}
