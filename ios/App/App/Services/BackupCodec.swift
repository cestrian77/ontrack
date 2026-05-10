import Foundation
import SwiftData

/// Aligned with [`src/db/repository.ts`](../../../../src/db/repository.ts) `exportAll` / `importAll` (versions 1 and 2).
enum BackupCodec {
    static func exportV2(
        household: HouseholdRecord?,
        scenarios: [ScenarioRecord],
        insightDismissals: [InsightDismissalRecord],
    ) throws -> String {
        var root: [String: Any] = [
            "version": 2,
            "exportedAt": ISO8601DateFormatter().string(from: Date()),
        ]
        if let h = household {
            root["household"] = try householdDict(h)
        }
        root["scenarios"] = try scenarios.map { try scenarioDict($0) }
        root["insightDismissals"] = insightDismissals.map {
            [
                "id": $0.insightId,
                "dismissedAt": ISO8601DateFormatter().string(from: $0.dismissedAt),
            ] as [String: Any]
        }
        let data = try JSONSerialization.data(withJSONObject: root, options: [.prettyPrinted, .sortedKeys])
        return String(decoding: data, as: UTF8.self)
    }

    private static func householdDict(_ h: HouseholdRecord) throws -> [String: Any] {
        let primary = try JSONSerialization.jsonObject(with: h.primaryProfileJSON) as? [String: Any] ?? [:]
        var partner: Any? = NSNull()
        if let pdata = h.partnerProfileJSON {
            partner = try JSONSerialization.jsonObject(with: pdata)
        }
        return [
            "id": h.id,
            "primary": primary,
            "partner": partner as Any,
            "dependentCount": h.dependentCount,
            "onboardingComplete": h.onboardingComplete,
            "updatedAt": ISO8601DateFormatter().string(from: h.updatedAt),
        ]
    }

    private static func scenarioDict(_ s: ScenarioRecord) throws -> [String: Any] {
        let o = try JSONSerialization.jsonObject(with: s.payloadJSON) as? [String: Any] ?? [:]
        return o
    }

    static func importV2(json: String, into context: ModelContext) throws {
        guard let data = json.data(using: .utf8) else { throw BackupError.invalidJSON }
        let top = try JSONSerialization.jsonObject(with: data) as? [String: Any]
        guard let top else { throw BackupError.invalidJSON }
        let version = top["version"] as? Int
        guard version == 1 || version == 2 else { throw BackupError.unsupportedVersion }

        try deleteAll(HouseholdRecord.self, in: context)
        try deleteAll(ScenarioRecord.self, in: context)
        try deleteAll(InsightDismissalRecord.self, in: context)

        if version == 2, let household = top["household"] as? [String: Any] {
            try ingestHouseholdV2(household, context: context)
        } else if let profile = top["profile"] as? [String: Any] {
            try ingestHouseholdLegacy(profile, context: context)
        }

        if let scenarios = top["scenarios"] as? [[String: Any]] {
            for s in scenarios {
                let id = (s["id"] as? String) ?? UUID().uuidString
                let createdAtStr = s["createdAt"] as? String ?? ISO8601DateFormatter().string(from: Date())
                let createdAt = ISO8601DateFormatter().date(from: createdAtStr) ?? Date()
                let payload = try JSONSerialization.data(withJSONObject: s)
                context.insert(ScenarioRecord(scenarioId: id, payloadJSON: payload, createdAt: createdAt))
            }
        }

        if let rows = top["insightDismissals"] as? [[String: Any]] {
            for row in rows {
                if let id = row["id"] as? String, let at = row["dismissedAt"] as? String,
                   let date = ISO8601DateFormatter().date(from: at)
                {
                    context.insert(InsightDismissalRecord(insightId: id, dismissedAt: date))
                }
            }
        }
        try context.save()
    }

    private static func ingestHouseholdV2(_ o: [String: Any], context: ModelContext) throws {
        let primary = o["primary"] as? [String: Any] ?? [:]
        let partner = o["partner"] as? [String: Any]
        let dependentCount = o["dependentCount"] as? Int ?? 0
        let onboardingComplete = o["onboardingComplete"] as? Bool ?? false
        let primaryData = try JSONSerialization.data(withJSONObject: primary)
        let partnerData = try partner.map { try JSONSerialization.data(withJSONObject: $0) }
        let updatedAtStr = o["updatedAt"] as? String ?? ""
        let updatedAt = ISO8601DateFormatter().date(from: updatedAtStr) ?? Date()
        context.insert(HouseholdRecord(
            id: "singleton",
            primaryProfileJSON: primaryData,
            partnerProfileJSON: partnerData,
            dependentCount: dependentCount,
            onboardingComplete: onboardingComplete,
            updatedAt: updatedAt
        ))
    }

    private static func ingestHouseholdLegacy(_ o: [String: Any], context: ModelContext) throws {
        let dataObj = (o["data"] as? [String: Any]) ?? o
        let primaryData = try JSONSerialization.data(withJSONObject: dataObj)
        let onboardingComplete = o["onboardingComplete"] as? Bool ?? false
        let updatedAtStr = o["updatedAt"] as? String ?? ""
        let updatedAt = ISO8601DateFormatter().date(from: updatedAtStr) ?? Date()
        context.insert(HouseholdRecord(
            id: "singleton",
            primaryProfileJSON: primaryData,
            partnerProfileJSON: nil,
            dependentCount: 0,
            onboardingComplete: onboardingComplete,
            updatedAt: updatedAt
        ))
    }

    private static func deleteAll<T: PersistentModel>(_ type: T.Type, in context: ModelContext) throws {
        let fd = FetchDescriptor<T>()
        for row in try context.fetch(fd) {
            context.delete(row)
        }
    }

    enum BackupError: Error, LocalizedError {
        case invalidJSON
        case unsupportedVersion
        var errorDescription: String? {
            switch self {
            case .invalidJSON: "Invalid JSON"
            case .unsupportedVersion: "Unsupported export version"
            }
        }
    }
}
