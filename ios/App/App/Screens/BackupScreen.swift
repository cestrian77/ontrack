import SwiftData
import SwiftUI
import UniformTypeIdentifiers

struct BackupScreen: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.colorScheme) private var colorScheme
    @Query private var households: [HouseholdRecord]
    @Query private var scenarios: [ScenarioRecord]
    @Query private var insights: [InsightDismissalRecord]

    @State private var exportText: String = ""
    @State private var importError: String?
    @State private var showImporter = false

    var body: some View {
        List {
            Section("Export") {
                Button("Generate JSON (v2)") {
                    exportText = (try? BackupCodec.exportV2(
                        household: households.first { $0.id == "singleton" },
                        scenarios: scenarios,
                        insightDismissals: insights
                    )) ?? "{}"
                }
                if !exportText.isEmpty {
                    Text(exportText)
                        .font(.caption.monospaced())
                        .textSelection(.enabled)
                }
                ShareLink(item: exportText, subject: Text("OnTrack backup"), message: Text("Export")) {
                    Label("Share JSON", systemImage: "square.and.arrow.up")
                }
                .disabled(exportText.isEmpty)
            }
            Section("Import") {
                Button("Import from file…") { showImporter = true }
                if let importError {
                    Text(importError).foregroundStyle(DesignColor.danger())
                }
            }
        }
        .font(DesignTypography.bodyMd)
        .foregroundStyle(DesignColor.textPrimary(colorScheme))
        .tint(DesignColor.primary(colorScheme))
        .designListChrome()
        .navigationTitle("Backup")
        .fileImporter(
            isPresented: $showImporter,
            allowedContentTypes: [.json],
            allowsMultipleSelection: false
        ) { result in
            importError = nil
            switch result {
            case .success(let urls):
                guard let url = urls.first else { return }
                do {
                    let data = try Data(contentsOf: url)
                    let json = String(decoding: data, as: UTF8.self)
                    try BackupCodec.importV2(json: json, into: modelContext)
                    NotificationCenter.default.post(
                        name: Notification.Name("householdDataDidChange"),
                        object: nil,
                    )
                } catch {
                    importError = error.localizedDescription
                }
            case .failure(let err):
                importError = err.localizedDescription
            }
        }
    }
}
