import XCTest
@testable import OnTrackEngine

final class InsightAndScenarioTests: XCTestCase {
    func testGenerateInsightsReturnsOrdered() throws {
        let p = try DefaultWebProfile.makeDefaultPrimary()
        let opts = RunProjectionOptions(taxYearPack: .uk2026_27, asOfDate: "2026-05-10")
        let proj = ProjectionEngine.runProjection(p, options: opts)
        let fire = FireEngine.computeFire(profile: p, projection: proj, pack: .uk2026_27)
        let ctx = InsightContext(profile: p, projection: proj, fire: fire, taxYearPack: .uk2026_27)
        let insights = InsightEngine.generateInsights(ctx: ctx)
        XCTAssertFalse(insights.isEmpty)
        for i in 0 ..< (insights.count - 1) {
            XCTAssertGreaterThanOrEqual(insights[i].impactScore, insights[i + 1].impactScore)
        }
    }

    func testApplyScenarioRetireEarlier() throws {
        let p = try DefaultWebProfile.makeDefaultPrimary()
        let scenarioJSON = """
        {"id":"t1","name":"Test","colour":"#000","templateId":"retire_earlier","overrides":{},"createdAt":"2026-01-01T00:00:00.000Z"}
        """.data(using: .utf8)!
        let next = try ScenarioApplyEngine.applyScenario(profile: p, scenarioJSON: scenarioJSON)
        XCTAssertEqual(next.retirementTargetAge, max(40, p.retirementTargetAge - 5))
    }
}
