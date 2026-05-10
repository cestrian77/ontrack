import XCTest
@testable import OnTrackEngine

final class GoldenFixtureDecodingTests: XCTestCase {
    func testDecodesGoldens() throws {
        for filename in ["prd-fire-example.json", "default-profile-1990-dob.json"] {
            let url = FixturePaths.engineGoldensCases.appendingPathComponent(filename)
            let data = try Data(contentsOf: url)
            let decoded = try JSONDecoder().decode(EngineGoldenFileV1.self, from: data)
            XCTAssertEqual(decoded.engineGoldenVersion, 1)
            XCTAssertFalse(decoded.asOfDate.isEmpty)
            XCTAssertFalse(decoded.taxYearLabel.isEmpty)
            XCTAssertFalse(decoded.expected.projection.yearSnapshots.isEmpty)
        }
    }
}
