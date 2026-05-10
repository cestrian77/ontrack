import SwiftUI
import UIKit

enum DashboardSnapshotExporter {
    /// Renders an arbitrary SwiftUI view to PNG data (native replacement for html-to-image + share sheet).
    @MainActor
    static func pngData<V: View>(content: V, size: CGSize, scale: CGFloat = 2) -> Data? {
        let renderer = ImageRenderer(content: content.frame(width: size.width, height: size.height))
        renderer.scale = scale
        return renderer.uiImage?.pngData()
    }

    /// Writes a sample image to temp and returns file URL for `UIActivityViewController`.
    @MainActor
    static func writeSamplePNG() -> URL? {
        let view = SampleShareCard()
        let size = CGSize(width: 360, height: 200)
        guard let data = pngData(content: view, size: size) else { return nil }
        let name = "ontrack-dashboard-\(Int(Date().timeIntervalSince1970)).png"
        let url = FileManager.default.temporaryDirectory.appendingPathComponent(name)
        do {
            try data.write(to: url)
            return url
        } catch {
            return nil
        }
    }
}

private struct SampleShareCard: View {
    var body: some View {
        ZStack {
            LinearGradient(colors: [Color(red: 0.06, green: 0.45, blue: 0.42), Color(red: 0.04, green: 0.2, blue: 0.18)], startPoint: .topLeading, endPoint: .bottomTrailing)
            VStack(spacing: 8) {
                Text("OnTrack")
                    .font(.title.bold())
                    .foregroundStyle(.white)
                Text("Native SwiftUI snapshot")
                    .font(.subheadline)
                    .foregroundStyle(.white.opacity(0.9))
            }
            .padding()
        }
    }
}

struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }

    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}
