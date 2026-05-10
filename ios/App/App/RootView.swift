import OnTrackEngine
import SwiftData
import SwiftUI

struct RootView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(filter: #Predicate<HouseholdRecord> { $0.id == "singleton" })
    private var households: [HouseholdRecord]

    @State private var planner: HouseholdPlanner?
    @State private var plannerLoadError: String?

    private var household: HouseholdRecord? { households.first }

    var body: some View {
        Group {
            if let err = plannerLoadError {
                LoadErrorView(message: err) {
                    plannerLoadError = nil
                    repairHouseholdJSON()
                    loadPlanner()
                }
            } else if let h = household {
                if h.onboardingComplete {
                    MainTabView()
                } else {
                    NavigationStack {
                        OnboardingFlowView(household: h)
                    }
                }
            } else {
                WelcomeView(onStartOnboarding: startOnboardingIfNeeded)
            }
        }
        .modifier(HouseholdPlannerInjection(planner: planner))
        .task(id: household?.persistentModelID) {
            repairHouseholdJSON()
            loadPlanner()
        }
        .onReceive(NotificationCenter.default.publisher(for: .householdDataDidChange)) { _ in
            repairHouseholdJSON()
            loadPlanner()
        }
    }

    private func repairHouseholdJSON() {
        guard let h = household else { return }
        if (try? JSONDecoder().decode(UserProfile.self, from: h.primaryProfileJSON)) == nil {
            if let data = try? DefaultWebProfile.defaultPrimaryJSONData() {
                h.primaryProfileJSON = data
                try? modelContext.save()
            }
        }
    }

    private func loadPlanner() {
        guard let h = household else {
            planner = nil
            return
        }
        do {
            planner = try HouseholdPlanner(modelContext: modelContext, household: h)
            plannerLoadError = nil
        } catch {
            planner = nil
            plannerLoadError = error.localizedDescription
        }
    }

    private func startOnboardingIfNeeded() {
        if household == nil {
            do {
                let row = HouseholdRecord(
                    id: "singleton",
                    primaryProfileJSON: try DefaultWebProfile.defaultPrimaryJSONData(),
                    partnerProfileJSON: nil,
                    dependentCount: 0,
                    onboardingComplete: false,
                    updatedAt: Date(),
                )
                modelContext.insert(row)
                try modelContext.save()
            } catch {
                plannerLoadError = error.localizedDescription
            }
        }
    }
}

extension Notification.Name {
    static let householdDataDidChange = Notification.Name("householdDataDidChange")
}

private struct LoadErrorView: View {
    var message: String
    var onRetry: () -> Void
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        ZStack {
            DesignColor.background(colorScheme).ignoresSafeArea()
            VStack(spacing: DesignLayout.unit * 3) {
                Text("Could not load profile")
                    .font(DesignTypography.headlineMd)
                    .foregroundStyle(DesignColor.textPrimary(colorScheme))
                Text(message)
                    .font(DesignTypography.labelSm)
                    .foregroundStyle(DesignColor.textSecondary(colorScheme))
                    .multilineTextAlignment(.center)
                Button("Repair & retry", action: onRetry)
                    .buttonStyle(PrimaryButtonStyle())
            }
            .padding(DesignLayout.containerPaddingCompact)
        }
    }
}

private struct HouseholdPlannerInjection: ViewModifier {
    let planner: HouseholdPlanner?

    func body(content: Content) -> some View {
        if let planner {
            content.environment(\.householdPlanner, planner)
        } else {
            content
        }
    }
}
