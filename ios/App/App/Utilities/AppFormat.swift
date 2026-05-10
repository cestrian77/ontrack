import Foundation

enum AppFormat {
    private static let gbpFormatter: NumberFormatter = {
        let f = NumberFormatter()
        f.numberStyle = .currency
        f.currencyCode = "GBP"
        f.maximumFractionDigits = 0
        return f
    }()

    static func gbp(_ n: Double) -> String {
        gbpFormatter.string(from: NSNumber(value: n)) ?? "£\(Int(n))"
    }

    static func pct(_ n: Double) -> String {
        String(format: "%.1f%%", n * 100)
    }
}
