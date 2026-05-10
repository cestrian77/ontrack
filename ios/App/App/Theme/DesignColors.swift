import SwiftUI

/// Semantic colors from docs/design/fintech_design_system/DESIGN.md (light) and inverse-* mapping for dark.
enum DesignColor {
    static func background(_ scheme: ColorScheme) -> Color {
        scheme == .dark
            ? Color(red: 0.176, green: 0.192, blue: 0.192)
            : Color(red: 0.969, green: 0.980, blue: 0.976)
    }

    static func surfaceCard(_ scheme: ColorScheme) -> Color {
        scheme == .dark
            ? Color(red: 0.22, green: 0.25, blue: 0.25)
            : Color.white
    }

    static func surfaceSidebar(_ scheme: ColorScheme) -> Color {
        scheme == .dark
            ? Color(red: 0.20, green: 0.22, blue: 0.22)
            : Color(red: 0.945, green: 0.956, blue: 0.953)
    }

    static func fieldBackground(_ scheme: ColorScheme) -> Color {
        scheme == .dark
            ? Color.white.opacity(0.08)
            : Color(red: 0.922, green: 0.933, blue: 0.929)
    }

    static func textPrimary(_ scheme: ColorScheme) -> Color {
        scheme == .dark
            ? Color(red: 0.933, green: 0.945, blue: 0.941)
            : Color(red: 0.094, green: 0.110, blue: 0.110)
    }

    static func textSecondary(_ scheme: ColorScheme) -> Color {
        scheme == .dark
            ? Color(red: 0.65, green: 0.72, blue: 0.69)
            : Color(red: 0.235, green: 0.286, blue: 0.275)
    }

    static func primary(_ scheme: ColorScheme) -> Color {
        scheme == .dark
            ? Color(red: 0.349, green: 0.859, blue: 0.780)
            : Color(red: 0.0, green: 0.419, blue: 0.373)
    }

    static func primaryButtonFill(_ scheme: ColorScheme) -> Color {
        scheme == .dark
            ? Color(red: 0.349, green: 0.859, blue: 0.780)
            : Color(red: 0.0, green: 0.659, blue: 0.588)
    }

    static func onPrimaryButton(_ scheme: ColorScheme) -> Color {
        scheme == .dark
            ? Color(red: 0.0, green: 0.125, blue: 0.110)
            : Color.white
    }

    static func chartPrimary(_ scheme: ColorScheme) -> Color {
        primary(scheme)
    }

    static func chartSecondary(_ scheme: ColorScheme) -> Color {
        Color(red: 0.318, green: 0.380, blue: 0.380)
    }

    static func segmentBackground(_ scheme: ColorScheme) -> Color {
        scheme == .dark
            ? Color.white.opacity(0.12)
            : Color(red: 0.922, green: 0.933, blue: 0.929)
    }

    static func cardShadow(_ scheme: ColorScheme) -> Color {
        Color(red: 26 / 255, green: 31 / 255, blue: 30 / 255, opacity: scheme == .dark ? 0.25 : 0.04)
    }

    static func danger() -> Color {
        Color(red: 0.729, green: 0.102, blue: 0.102)
    }
}
