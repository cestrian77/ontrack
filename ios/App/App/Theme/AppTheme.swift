import SwiftUI

enum AppColorScheme: String, CaseIterable, Identifiable {
    case system
    case light
    case dark
    var id: String { rawValue }
}

@Observable
@MainActor
final class AppThemeStore {
    var scheme: AppColorScheme {
        didSet {
            UserDefaults.standard.set(scheme.rawValue, forKey: "appColorScheme")
        }
    }

    init() {
        let raw = UserDefaults.standard.string(forKey: "appColorScheme") ?? "system"
        self.scheme = AppColorScheme(rawValue: raw) ?? .system
    }

    var colorScheme: ColorScheme? {
        switch scheme {
        case .system: nil
        case .light: .light
        case .dark: .dark
        }
    }
}
