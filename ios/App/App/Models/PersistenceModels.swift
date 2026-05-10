import Foundation
import SwiftData

@Model
final class HouseholdRecord {
    @Attribute(.unique) var id: String
    var primaryProfileJSON: Data
    var partnerProfileJSON: Data?
    var dependentCount: Int
    var onboardingComplete: Bool
    var updatedAt: Date

    init(
        id: String,
        primaryProfileJSON: Data,
        partnerProfileJSON: Data?,
        dependentCount: Int,
        onboardingComplete: Bool,
        updatedAt: Date
    ) {
        self.id = id
        self.primaryProfileJSON = primaryProfileJSON
        self.partnerProfileJSON = partnerProfileJSON
        self.dependentCount = dependentCount
        self.onboardingComplete = onboardingComplete
        self.updatedAt = updatedAt
    }
}

@Model
final class ScenarioRecord {
    @Attribute(.unique) var scenarioId: String
    var payloadJSON: Data
    var createdAt: Date

    init(scenarioId: String, payloadJSON: Data, createdAt: Date) {
        self.scenarioId = scenarioId
        self.payloadJSON = payloadJSON
        self.createdAt = createdAt
    }
}

@Model
final class InsightDismissalRecord {
    @Attribute(.unique) var insightId: String
    var dismissedAt: Date

    init(insightId: String, dismissedAt: Date) {
        self.insightId = insightId
        self.dismissedAt = dismissedAt
    }
}
