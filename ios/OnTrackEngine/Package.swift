// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "OnTrackEngine",
    platforms: [.iOS(.v17), .macOS(.v14)],
    products: [
        .library(name: "OnTrackEngine", targets: ["OnTrackEngine"]),
    ],
    targets: [
        .target(
            name: "OnTrackEngine",
            path: "Sources/OnTrackEngine"
        ),
        .testTarget(
            name: "OnTrackEngineTests",
            dependencies: ["OnTrackEngine"],
            path: "Tests/OnTrackEngineTests"
        ),
    ]
)
