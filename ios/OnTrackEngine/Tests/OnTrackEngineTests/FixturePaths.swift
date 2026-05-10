import Foundation

enum FixturePaths {
    /// From `Tests/OnTrackEngineTests` up to repo root `ontrack/`.
    static var repoRoot: URL {
        URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
    }

    static var engineGoldensCases: URL {
        repoRoot.appendingPathComponent("fixtures/engine-goldens/cases", isDirectory: true)
    }
}
