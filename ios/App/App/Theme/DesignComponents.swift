import SwiftUI
import UIKit

// MARK: - Card shadow (0 10px 30px rgba(26,31,30,0.04))

struct DesignCardShadowModifier: ViewModifier {
    @Environment(\.colorScheme) private var colorScheme

    func body(content: Content) -> some View {
        content
            .shadow(color: DesignColor.cardShadow(colorScheme), radius: 15, x: 0, y: 5)
            .shadow(color: DesignColor.cardShadow(colorScheme), radius: 30, x: 0, y: 10)
    }
}

extension View {
    func designCardShadow() -> some View {
        modifier(DesignCardShadowModifier())
    }
}

// MARK: - Bento card

struct BentoCard<Content: View>: View {
    var glass: Bool = false
    @ViewBuilder var content: () -> Content

    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        Group {
            if glass {
                content()
                    .padding(DesignLayout.cardPadding)
                    .background {
                        RoundedRectangle(cornerRadius: DesignLayout.radiusCard, style: .continuous)
                            .fill(.ultraThinMaterial)
                            .overlay {
                                RoundedRectangle(cornerRadius: DesignLayout.radiusCard, style: .continuous)
                                    .strokeBorder(Color.white.opacity(colorScheme == .dark ? 0.12 : 0.45), lineWidth: 1)
                            }
                    }
            } else {
                content()
                    .padding(DesignLayout.cardPadding)
                    .background {
                        RoundedRectangle(cornerRadius: DesignLayout.radiusCard, style: .continuous)
                            .fill(DesignColor.surfaceCard(colorScheme))
                    }
                    .designCardShadow()
            }
        }
    }
}

// MARK: - Screen canvas / list chrome

struct ScreenCanvasModifier: ViewModifier {
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass

    func body(content: Content) -> some View {
        let pad = horizontalSizeClass == .regular
            ? DesignLayout.containerPaddingRegular
            : DesignLayout.containerPaddingCompact
        content
            .frame(maxWidth: .infinity)
            .padding(.horizontal, pad)
    }
}

struct DesignListChromeModifier: ViewModifier {
    @Environment(\.colorScheme) private var colorScheme

    func body(content: Content) -> some View {
        content
            .scrollContentBackground(.hidden)
            .background(DesignColor.background(colorScheme))
    }
}

extension View {
    func screenCanvasPadding() -> some View {
        modifier(ScreenCanvasModifier())
    }

    func designListChrome() -> some View {
        modifier(DesignListChromeModifier())
    }
}

// MARK: - Buttons

struct PrimaryButtonStyle: ButtonStyle {
    @Environment(\.colorScheme) private var colorScheme

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(DesignTypography.labelBold)
            .tracking(0.7)
            .foregroundStyle(DesignColor.onPrimaryButton(colorScheme))
            .padding(.horizontal, DesignLayout.unit * 5)
            .padding(.vertical, DesignLayout.unit * 3 + 2)
            .background(DesignColor.primaryButtonFill(colorScheme))
            .clipShape(RoundedRectangle(cornerRadius: DesignLayout.radiusControl, style: .continuous))
            .opacity(configuration.isPressed ? 0.92 : 1)
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
    }
}

struct SecondaryButtonStyle: ButtonStyle {
    @Environment(\.colorScheme) private var colorScheme

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(DesignTypography.labelBold)
            .tracking(0.5)
            .foregroundStyle(DesignColor.textPrimary(colorScheme))
            .padding(.horizontal, DesignLayout.unit * 4)
            .padding(.vertical, DesignLayout.unit * 3)
            .background {
                RoundedRectangle(cornerRadius: DesignLayout.radiusControl, style: .continuous)
                    .fill(.ultraThinMaterial)
                    .overlay {
                        RoundedRectangle(cornerRadius: DesignLayout.radiusControl, style: .continuous)
                            .strokeBorder(DesignColor.textSecondary(colorScheme).opacity(0.22), lineWidth: 1)
                    }
            }
            .opacity(configuration.isPressed ? 0.9 : 1)
    }
}

// MARK: - Tab bar (UIKit; resolves for light/dark)

enum TabBarChrome {
    static func applyAppearance() {
        let appearance = UITabBarAppearance()
        appearance.configureWithTransparentBackground()
        appearance.backgroundEffect = UIBlurEffect(style: .systemUltraThinMaterial)
        appearance.backgroundColor = .clear
        let item = appearance.stackedLayoutAppearance
        let normalMuted = UIColor { tc in
            tc.userInterfaceStyle == .dark
                ? UIColor(red: 0.65, green: 0.72, blue: 0.69, alpha: 1)
                : UIColor(red: 0.235, green: 0.286, blue: 0.275, alpha: 1)
        }
        item.normal.iconColor = normalMuted
        item.normal.titleTextAttributes = [.foregroundColor: normalMuted]
        let selectedTeal = UIColor { tc in
            tc.userInterfaceStyle == .dark
                ? UIColor(red: 0.349, green: 0.859, blue: 0.780, alpha: 1)
                : UIColor(red: 0.0, green: 0.419, blue: 0.373, alpha: 1)
        }
        item.selected.iconColor = selectedTeal
        item.selected.titleTextAttributes = [.foregroundColor: selectedTeal]
        UITabBar.appearance().standardAppearance = appearance
        UITabBar.appearance().scrollEdgeAppearance = appearance
    }
}
