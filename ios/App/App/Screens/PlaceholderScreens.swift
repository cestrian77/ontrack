import SwiftUI

struct WelcomeView: View {
    var onStartOnboarding: () -> Void

    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        ZStack {
            DesignColor.background(colorScheme)
                .ignoresSafeArea()
            VStack(spacing: DesignLayout.bentoGutter) {
                Image(systemName: "chart.line.uptrend.xyaxis")
                    .font(.system(size: 48, weight: .medium))
                    .foregroundStyle(DesignColor.primary(colorScheme))
                    .symbolRenderingMode(.hierarchical)
                Text("OnTrack")
                    .font(DesignTypography.displayLg)
                    .foregroundStyle(DesignColor.textPrimary(colorScheme))
                    .kerning(-0.96)
                Text("See whether you're on track for the retirement you want.")
                    .font(DesignTypography.bodyLg)
                    .foregroundStyle(DesignColor.textPrimary(colorScheme))
                    .multilineTextAlignment(.center)
                Text("UK retirement trajectory planner — pensions, ISAs, property, and FIRE — modelled on your device.")
                    .font(DesignTypography.bodyMd)
                    .foregroundStyle(DesignColor.textSecondary(colorScheme))
                    .multilineTextAlignment(.center)
                Button("Get started") {
                    onStartOnboarding()
                }
                .buttonStyle(PrimaryButtonStyle())
                .padding(.top, DesignLayout.unit * 2)
            }
            .multilineTextAlignment(.center)
            .padding(.horizontal, DesignLayout.containerPaddingCompact)
        }
    }
}
