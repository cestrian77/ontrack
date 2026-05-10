import XCTest
@testable import OnTrackEngine

final class GoldenParityTests: XCTestCase {
    func nearlyEqual(_ a: Double, _ b: Double, tol: Double, _ msg: String) {
        XCTAssertLessThanOrEqual(abs(a - b), tol, "\(msg): \(a) vs \(b)")
    }

    func testPrdFireExampleMatchesGoldens() throws {
        let url = FixturePaths.engineGoldensCases.appendingPathComponent("prd-fire-example.json")
        let data = try Data(contentsOf: url)
        let g = try JSONDecoder().decode(EngineGoldenFileV1.self, from: data)
        XCTAssertEqual(g.engineGoldenVersion, 1)
        XCTAssertEqual(g.taxYearLabel, TaxYearPack.uk2026_27.label)

        let opts = RunProjectionOptions(taxYearPack: .uk2026_27, asOfDate: g.asOfDate)
        let proj = ProjectionEngine.runProjection(g.profile, options: opts)
        let fire = FireEngine.computeFire(profile: g.profile, projection: proj, pack: .uk2026_27)

        nearlyEqual(fire.fireNumber, g.expected.fire.fireNumber, tol: 0.01, "fireNumber")
        nearlyEqual(fire.investableNow, g.expected.fire.investableNow, tol: 0.01, "investableNow")
        XCTAssertEqual(fire.yearsToFire, g.expected.fire.yearsToFire)
        XCTAssertEqual(fire.fireAge, g.expected.fire.fireAge)
        XCTAssertEqual(fire.coastReached, g.expected.fire.coastReached)

        XCTAssertEqual(proj.meta.currentAge, g.expected.projection.meta.currentAge)
        XCTAssertEqual(proj.meta.retirementAge, g.expected.projection.meta.retirementAge)
        XCTAssertEqual(proj.meta.nmpa, g.expected.projection.meta.nmpa)
        XCTAssertEqual(proj.meta.spa, g.expected.projection.meta.spa)
        XCTAssertEqual(proj.meta.horizon, g.expected.projection.meta.horizon)

        for snap in g.expected.projection.yearSnapshots {
            let y = proj.years[snap.index]
            XCTAssertEqual(y.age, snap.age)
            nearlyEqual(y.totalNetWorth, snap.totalNetWorth, tol: 0.02, "tnw@\(snap.index)")
            nearlyEqual(y.investableNetWorth, snap.investableNetWorth, tol: 0.02, "inw@\(snap.index)")
        }
    }

    func testEffectiveFireLowerWhenStatePensionOffset() throws {
        var p = try DefaultWebProfile.makeDefaultPrimary()
        p.dateOfBirth = "1990-05-10"
        p.retirementTargetAge = 67
        p.statePensionClaimAge = 67
        p.targetRetirementIncome = 40_000
        p.safeWithdrawalRate = 0.035
        p.fireCalculationPrefs = FireCalculationPrefs(offsetStatePension: true)
        let opts = RunProjectionOptions(taxYearPack: .uk2026_27, asOfDate: "2026-05-10")
        let proj = ProjectionEngine.runProjection(p, options: opts)
        let fire = FireEngine.computeFire(profile: p, projection: proj, pack: .uk2026_27)
        XCTAssertLessThan(fire.effectiveFireNumber, fire.fireNumber)
        XCTAssertGreaterThan(fire.passiveIncomeAtReference, 0)
    }

    func testDefaultProfileMatchesGoldens() throws {
        let url = FixturePaths.engineGoldensCases.appendingPathComponent("default-profile-1990-dob.json")
        let data = try Data(contentsOf: url)
        let g = try JSONDecoder().decode(EngineGoldenFileV1.self, from: data)
        let opts = RunProjectionOptions(taxYearPack: .uk2026_27, asOfDate: g.asOfDate)
        let proj = ProjectionEngine.runProjection(g.profile, options: opts)
        let fire = FireEngine.computeFire(profile: g.profile, projection: proj, pack: .uk2026_27)

        nearlyEqual(fire.fireNumber, g.expected.fire.fireNumber, tol: 0.01, "fireNumber")
        XCTAssertEqual(proj.meta.currentAge, g.expected.projection.meta.currentAge)
        for snap in g.expected.projection.yearSnapshots {
            let y = proj.years[snap.index]
            nearlyEqual(y.totalNetWorth, snap.totalNetWorth, tol: 0.02, "tnw@\(snap.index)")
        }
    }
}
