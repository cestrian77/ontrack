import SwiftUI
import UIKit

enum DesignTypography {
    private static let family = "Plus Jakarta Sans"

    private static func uiTextStyle(for style: Font.TextStyle) -> UIFont.TextStyle {
        switch style {
        case .largeTitle: return .largeTitle
        case .title: return .title1
        case .title2: return .title2
        case .title3: return .title3
        case .headline: return .headline
        case .body: return .body
        case .callout: return .callout
        case .subheadline: return .subheadline
        case .footnote: return .footnote
        case .caption: return .caption1
        case .caption2: return .caption2
        @unknown default: return .body
        }
    }

    private static func scaledCustom(size base: CGFloat, relativeTo textStyle: Font.TextStyle, weight: Font.Weight) -> Font {
        let metrics = UIFontMetrics(forTextStyle: uiTextStyle(for: textStyle))
        let scaled = metrics.scaledValue(for: base)
        guard UIFont.familyNames.contains(family) else {
            return Font.system(size: scaled).weight(weight)
        }
        return Font.custom(family, size: scaled, relativeTo: textStyle).weight(weight)
    }

    // Roles from DESIGN.md (base sizes; scale via Dynamic Type)
    static var displayLg: Font { scaledCustom(size: 48, relativeTo: .largeTitle, weight: .bold) }
    static var headlineLg: Font { scaledCustom(size: 32, relativeTo: .title, weight: .bold) }
    static var headlineMd: Font { scaledCustom(size: 24, relativeTo: .title2, weight: .semibold) }
    static var bodyLg: Font { scaledCustom(size: 18, relativeTo: .title3, weight: .regular) }
    static var bodyMd: Font { scaledCustom(size: 16, relativeTo: .body, weight: .regular) }
    static var labelBold: Font { scaledCustom(size: 14, relativeTo: .subheadline, weight: .semibold) }
    static var labelSm: Font { scaledCustom(size: 12, relativeTo: .caption, weight: .medium) }
}
