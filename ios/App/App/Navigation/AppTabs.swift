import SwiftUI

private enum PlannerTab: Hashable {
    case dashboard
    case fire
    case scenarios
    case property
    case tax
    case insights
    case help
    case reports
    case settings

    var title: String {
        switch self {
        case .dashboard: "Dashboard"
        case .fire: "FIRE"
        case .scenarios: "Scenarios"
        case .property: "Property"
        case .tax: "Tax"
        case .insights: "Insights"
        case .help: "Help"
        case .reports: "Reports"
        case .settings: "Settings"
        }
    }

    var systemImage: String {
        switch self {
        case .dashboard: "chart.line.uptrend.xyaxis"
        case .fire: "flame"
        case .scenarios: "square.stack.3d.up"
        case .property: "house"
        case .tax: "sterlingsign.circle"
        case .insights: "lightbulb"
        case .help: "questionmark.circle"
        case .reports: "doc.text"
        case .settings: "gearshape"
        }
    }

    /// Primary row (matches web bottom nav) then overflow in tab order.
    static let ordered: [PlannerTab] = [
        .dashboard, .fire, .scenarios, .property, .tax,
        .insights, .help, .reports, .settings,
    ]
}

struct MainTabView: View {
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass
    @Environment(\.colorScheme) private var colorScheme
    @State private var tab: PlannerTab = .dashboard

    var body: some View {
        Group {
            if horizontalSizeClass == .regular {
                NavigationSplitView {
                    List(PlannerTab.ordered, id: \.self) { t in
                        Button {
                            tab = t
                        } label: {
                            Label(t.title, systemImage: t.systemImage)
                                .font(DesignTypography.bodyMd)
                        }
                        .foregroundStyle(tab == t ? DesignColor.primary(colorScheme) : DesignColor.textPrimary(colorScheme))
                    }
                    .scrollContentBackground(.hidden)
                    .background(DesignColor.surfaceSidebar(colorScheme))
                    .navigationTitle("OnTrack")
                } detail: {
                    NavigationStack {
                        tabContent(tab)
                    }
                }
            } else {
                TabView(selection: $tab) {
                    ForEach(PlannerTab.ordered, id: \.self) { t in
                        NavigationStack {
                            tabContent(t)
                        }
                        .tabItem { Label(t.title, systemImage: t.systemImage) }
                        .tag(t)
                    }
                }
                .tint(DesignColor.primary(colorScheme))
                .toolbarBackground(.ultraThinMaterial, for: .tabBar)
            }
        }
    }

    @ViewBuilder
    private func tabContent(_ t: PlannerTab) -> some View {
        switch t {
        case .dashboard: DashboardScreen()
        case .fire: FireScreen()
        case .scenarios: ScenariosScreen()
        case .property: PropertyScreen()
        case .tax: TaxScreen()
        case .insights: InsightsScreen()
        case .help: HelpScreen()
        case .reports: ReportsScreen()
        case .settings: SettingsScreen()
        }
    }
}
