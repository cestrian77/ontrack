import SwiftData
import SwiftUI

@main
struct OnTrackApp: App {
    @State private var appTheme = AppThemeStore()

    init() {
        TabBarChrome.applyAppearance()
    }

    private static func makeContainer() -> ModelContainer {
        let schema = Schema([
            HouseholdRecord.self,
            ScenarioRecord.self,
            InsightDismissalRecord.self,
        ])
        let config = ModelConfiguration(isStoredInMemoryOnly: false)
        do {
            return try ModelContainer(for: schema, configurations: config)
        } catch {
            fatalError("SwiftData container failed: \(error)")
        }
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(appTheme)
                .preferredColorScheme(appTheme.colorScheme)
                .modifier(AppAccentTintModifier())
        }
        .modelContainer(Self.makeContainer())
    }
}

private struct AppAccentTintModifier: ViewModifier {
    @Environment(\.colorScheme) private var colorScheme

    func body(content: Content) -> some View {
        content.tint(DesignColor.primary(colorScheme))
    }
}
