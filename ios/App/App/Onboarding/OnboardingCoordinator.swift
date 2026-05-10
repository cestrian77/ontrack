import OnTrackEngine
import SwiftUI
import UIKit

enum OnboardingStep: String, CaseIterable, Identifiable {
    case you
    case pensions
    case isa
    case property
    case btl
    case partnerYou
    case partnerPensions
    case partnerIsa
    case review

    var id: String { rawValue }

    var title: String {
        switch self {
        case .you: "You"
        case .pensions: "Pensions"
        case .isa: "ISA & investments"
        case .property: "Property"
        case .btl: "BTL"
        case .partnerYou: "Partner"
        case .partnerPensions: "Partner pensions"
        case .partnerIsa: "Partner ISAs"
        case .review: "Review"
        }
    }

    static func steps(primary: UserProfile, partner: UserProfile?) -> [OnboardingStep] {
        let includePartner = primary.partnered && partner != nil
        var s: [OnboardingStep] = [.you, .pensions, .isa, .property, .btl]
        if includePartner {
            s += [.partnerYou, .partnerPensions, .partnerIsa]
        }
        s.append(.review)
        return s
    }
}

struct OnboardingFlowView: View {
    @Bindable var household: HouseholdRecord
    @Environment(\.householdPlanner) private var plannerOpt
    @Environment(\.colorScheme) private var colorScheme
    @State private var step: OnboardingStep = .you

    var body: some View {
        if let planner = plannerOpt {
            onboardingContent(planner: planner)
        } else {
            ProgressView()
        }
    }

    private func onboardingContent(planner: HouseholdPlanner) -> some View {
        let steps = OnboardingStep.steps(primary: planner.primary, partner: planner.partner)
        let idx = steps.firstIndex(of: step) ?? 0
        let progress = Double(idx + 1) / Double(max(steps.count, 1))

        return ScrollView {
            VStack(alignment: .leading, spacing: DesignLayout.unit * 5) {
                ProgressView(value: progress)
                    .tint(DesignColor.primary(colorScheme))
                Text(step.title)
                    .font(DesignTypography.headlineLg)
                    .foregroundStyle(DesignColor.textPrimary(colorScheme))
                    .kerning(-0.32)
                BentoCard {
                    Form {
                        stepForm(step: step, planner: planner)
                    }
                    .scrollContentBackground(.hidden)
                    .environment(\.font, DesignTypography.bodyMd)
                }
            }
            .padding(.horizontal, DesignLayout.containerPaddingCompact)
            .padding(.top, DesignLayout.unit * 2)
            .padding(.bottom, DesignLayout.unit * 24)
        }
        .scrollContentBackground(.hidden)
        .background(DesignColor.background(colorScheme))
        .safeAreaInset(edge: .bottom, spacing: 0) {
            HStack(spacing: DesignLayout.bentoGutter) {
                Button("Back") { goBack(steps: steps) }
                    .buttonStyle(SecondaryButtonStyle())
                    .disabled(idx == 0)
                    .opacity(idx == 0 ? 0.45 : 1)
                Spacer()
                if step == .review {
                    Button("Finish") {
                        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                        planner.setOnboardingComplete(true)
                    }
                    .buttonStyle(PrimaryButtonStyle())
                } else {
                    Button("Continue") { goForward(steps: steps) }
                        .buttonStyle(PrimaryButtonStyle())
                }
            }
            .padding(.horizontal, DesignLayout.containerPaddingCompact)
            .padding(.vertical, DesignLayout.unit * 4)
            .frame(maxWidth: .infinity)
            .background {
                Rectangle()
                    .fill(.ultraThinMaterial)
                    .ignoresSafeArea(edges: .bottom)
            }
        }
        .navigationTitle("Onboarding")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            if !steps.contains(step) { step = .you }
        }
        .sensoryFeedback(.impact(weight: .light), trigger: step)
    }

    private func goBack(steps: [OnboardingStep]) {
        guard let i = steps.firstIndex(of: step), i > 0 else { return }
        step = steps[i - 1]
    }

    private func goForward(steps: [OnboardingStep]) {
        guard let i = steps.firstIndex(of: step), i + 1 < steps.count else { return }
        step = steps[i + 1]
    }

    @ViewBuilder
    private func stepForm(step: OnboardingStep, planner: HouseholdPlanner) -> some View {
        switch step {
        case .you:
            YouStepForm(planner: planner)
        case .pensions:
            PensionsStepForm(planner: planner, usePartner: false)
        case .isa:
            IsaStepForm(planner: planner, usePartner: false)
        case .property:
            PropertyStepForm(planner: planner, usePartner: false)
        case .btl:
            BTLStepForm()
        case .partnerYou:
            PartnerYouStepForm(planner: planner)
        case .partnerPensions:
            PensionsStepForm(planner: planner, usePartner: true)
        case .partnerIsa:
            IsaStepForm(planner: planner, usePartner: true)
        case .review:
            ReviewStepForm(planner: planner)
        }
    }
}

private struct YouStepForm: View {
    var planner: HouseholdPlanner

    var body: some View {
        Group {
            Section("About you") {
                TextField("Date of birth (YYYY-MM-DD)", text: stringBinding(\.dateOfBirth, usePartner: false))
                Stepper(
                    "Retirement target age: \(planner.primary.retirementTargetAge)",
                    value: intBinding(\.retirementTargetAge, usePartner: false),
                    in: 50 ... 75,
                )
                LabeledContent("Target retirement income (£/yr)") {
                    TextField("35000", value: doubleBinding(\.targetRetirementIncome, usePartner: false), format: .number)
                }
                Picker("Region", selection: regionBinding(usePartner: false)) {
                    Text("England & Wales").tag(Region.england_wales)
                    Text("Scotland").tag(Region.scotland)
                }
                Toggle("Partnered household", isOn: partneredBinding)
            }
            Section("Household") {
                Stepper("Dependents: \(planner.dependentCount)", value: Binding(
                    get: { planner.dependentCount },
                    set: { planner.setDependentCount($0) },
                ), in: 0 ... 20)
            }
        }
    }

    private var partneredBinding: Binding<Bool> {
        Binding(
            get: { planner.primary.partnered },
            set: { v in
                planner.patchPrimary { $0.partnered = v }
                if v && planner.partner == nil {
                    if let par = try? DefaultWebProfile.makePartnerDefaults() {
                        planner.setPartner(par)
                    }
                } else if !v {
                    planner.setPartner(nil)
                }
            },
        )
    }

    private func stringBinding(_ kp: WritableKeyPath<UserProfile, String>, usePartner: Bool) -> Binding<String> {
        if usePartner {
            return Binding(
                get: { planner.partner?[keyPath: kp] ?? "" },
                set: { v in planner.patchPartner { $0[keyPath: kp] = v } },
            )
        }
        return Binding(
            get: { planner.primary[keyPath: kp] },
            set: { v in planner.patchPrimary { $0[keyPath: kp] = v } },
        )
    }

    private func intBinding(_ kp: WritableKeyPath<UserProfile, Int>, usePartner: Bool) -> Binding<Int> {
        if usePartner {
            return Binding(
                get: { planner.partner?[keyPath: kp] ?? 0 },
                set: { v in planner.patchPartner { $0[keyPath: kp] = v } },
            )
        }
        return Binding(
            get: { planner.primary[keyPath: kp] },
            set: { v in planner.patchPrimary { $0[keyPath: kp] = v } },
        )
    }

    private func doubleBinding(_ kp: WritableKeyPath<UserProfile, Double>, usePartner: Bool) -> Binding<Double> {
        if usePartner {
            return Binding(
                get: { planner.partner?[keyPath: kp] ?? 0 },
                set: { v in planner.patchPartner { $0[keyPath: kp] = v } },
            )
        }
        return Binding(
            get: { planner.primary[keyPath: kp] },
            set: { v in planner.patchPrimary { $0[keyPath: kp] = v } },
        )
    }

    private func regionBinding(usePartner: Bool) -> Binding<Region> {
        if usePartner {
            return Binding(
                get: { planner.partner?[keyPath: \.region] ?? .england_wales },
                set: { v in planner.patchPartner { $0.region = v } },
            )
        }
        return Binding(
            get: { planner.primary.region },
            set: { v in planner.patchPrimary { $0.region = v } },
        )
    }
}

private struct PartnerYouStepForm: View {
    var planner: HouseholdPlanner
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        Group {
            Section("Partner") {
                if let _ = planner.partner {
                    TextField("Date of birth", text: stringBinding(\.dateOfBirth))
                    Stepper(
                        "Retirement target age: \(planner.partner?.retirementTargetAge ?? 0)",
                        value: intBinding(\.retirementTargetAge),
                        in: 50 ... 75,
                    )
                    LabeledContent("Target income (£/yr)") {
                        TextField("28000", value: doubleBinding(\.targetRetirementIncome), format: .number)
                    }
                    Picker("Region", selection: regionBinding()) {
                        Text("England & Wales").tag(Region.england_wales)
                        Text("Scotland").tag(Region.scotland)
                    }
                } else {
                    Text("Enable “Partnered household” on the You step to add a partner.")
                        .foregroundStyle(DesignColor.textSecondary(colorScheme))
                }
            }
        }
    }

    private func stringBinding(_ kp: WritableKeyPath<UserProfile, String>) -> Binding<String> {
        Binding(
            get: { planner.partner?[keyPath: kp] ?? "" },
            set: { v in planner.patchPartner { $0[keyPath: kp] = v } },
        )
    }

    private func intBinding(_ kp: WritableKeyPath<UserProfile, Int>) -> Binding<Int> {
        Binding(
            get: { planner.partner?[keyPath: kp] ?? 0 },
            set: { v in planner.patchPartner { $0[keyPath: kp] = v } },
        )
    }

    private func doubleBinding(_ kp: WritableKeyPath<UserProfile, Double>) -> Binding<Double> {
        Binding(
            get: { planner.partner?[keyPath: kp] ?? 0 },
            set: { v in planner.patchPartner { $0[keyPath: kp] = v } },
        )
    }

    private func regionBinding() -> Binding<Region> {
        Binding(
            get: { planner.partner?[keyPath: \.region] ?? .england_wales },
            set: { v in planner.patchPartner { $0.region = v } },
        )
    }
}

private struct PensionsStepForm: View {
    var planner: HouseholdPlanner
    var usePartner: Bool

    private var p: UserProfile {
        if usePartner { return planner.partner ?? planner.primary }
        return planner.primary
    }

    var body: some View {
        Group {
            Section("Workplace & SIPP") {
                LabeledContent("Pension pot (£)") {
                    TextField("0", value: d(\.pensionPot), format: .number)
                }
                LabeledContent("Employee %") {
                    TextField("0.05", value: d(\.employeeContribPct), format: .number)
                }
                LabeledContent("Employer %") {
                    TextField("0.05", value: d(\.employerContribPct), format: .number)
                }
                LabeledContent("SIPP (£/mo)") {
                    TextField("0", value: d(\.sippMonthly), format: .number)
                }
                Stepper("Pension access age: \(p.pensionAccessAge)", value: i(\.pensionAccessAge), in: 55 ... 60)
                LabeledContent("Pension growth (real)") {
                    TextField("0.05", value: d(\.pensionGrowth), format: .number)
                }
                Toggle("Defined benefit pension", isOn: bool(\.hasDB))
                if p.hasDB {
                    LabeledContent("DB income (£/yr)") {
                        TextField("0", value: d(\.dbAnnualIncome), format: .number)
                    }
                    Stepper("DB NRA: \(p.dbNRA)", value: i(\.dbNRA), in: 60 ... 70)
                }
            }
            Section("State pension") {
                Stepper("Claim age: \(p.statePensionClaimAge)", value: i(\.statePensionClaimAge), in: 66 ... 68)
                LabeledContent("Weekly amount (£)") {
                    TextField("241.3", value: d(\.statePensionWeekly), format: .number)
                }
            }
        }
    }

    private func d(_ kp: WritableKeyPath<UserProfile, Double>) -> Binding<Double> {
        if usePartner {
            return Binding(
                get: { planner.partner?[keyPath: kp] ?? 0 },
                set: { v in planner.patchPartner { $0[keyPath: kp] = v } },
            )
        }
        return Binding(
            get: { planner.primary[keyPath: kp] },
            set: { v in planner.patchPrimary { $0[keyPath: kp] = v } },
        )
    }

    private func i(_ kp: WritableKeyPath<UserProfile, Int>) -> Binding<Int> {
        if usePartner {
            return Binding(
                get: { planner.partner?[keyPath: kp] ?? 0 },
                set: { v in planner.patchPartner { $0[keyPath: kp] = v } },
            )
        }
        return Binding(
            get: { planner.primary[keyPath: kp] },
            set: { v in planner.patchPrimary { $0[keyPath: kp] = v } },
        )
    }

    private func bool(_ kp: WritableKeyPath<UserProfile, Bool>) -> Binding<Bool> {
        if usePartner {
            return Binding(
                get: { planner.partner?[keyPath: kp] ?? false },
                set: { v in planner.patchPartner { $0[keyPath: kp] = v } },
            )
        }
        return Binding(
            get: { planner.primary[keyPath: kp] },
            set: { v in planner.patchPrimary { $0[keyPath: kp] = v } },
        )
    }
}

private struct IsaStepForm: View {
    var planner: HouseholdPlanner
    var usePartner: Bool

    var body: some View {
        Group {
            Section("ISAs & GIA") {
                LabeledContent("S&S ISA value (£)") {
                    TextField("0", value: d(\.ssIsaValue), format: .number)
                }
                LabeledContent("S&S ISA (£/mo)") {
                    TextField("0", value: d(\.ssIsaMonthly), format: .number)
                }
                LabeledContent("Cash ISA (£)") {
                    TextField("0", value: d(\.cashIsaValue), format: .number)
                }
                Toggle("Use LISA", isOn: bool(\.hasLisa))
                LabeledContent("LISA (£/mo)") {
                    TextField("0", value: d(\.lisaMonthly), format: .number)
                }
                Toggle("Use GIA", isOn: bool(\.hasGia))
                LabeledContent("GIA value (£)") {
                    TextField("0", value: d(\.giaValue), format: .number)
                }
                LabeledContent("ISA growth (real)") {
                    TextField("0.05", value: d(\.isaGrowth), format: .number)
                }
            }
        }
    }

    private func d(_ kp: WritableKeyPath<UserProfile, Double>) -> Binding<Double> {
        if usePartner {
            return Binding(
                get: { planner.partner?[keyPath: kp] ?? 0 },
                set: { v in planner.patchPartner { $0[keyPath: kp] = v } },
            )
        }
        return Binding(
            get: { planner.primary[keyPath: kp] },
            set: { v in planner.patchPrimary { $0[keyPath: kp] = v } },
        )
    }

    private func bool(_ kp: WritableKeyPath<UserProfile, Bool>) -> Binding<Bool> {
        if usePartner {
            return Binding(
                get: { planner.partner?[keyPath: kp] ?? false },
                set: { v in planner.patchPartner { $0[keyPath: kp] = v } },
            )
        }
        return Binding(
            get: { planner.primary[keyPath: kp] },
            set: { v in planner.patchPrimary { $0[keyPath: kp] = v } },
        )
    }
}

private struct PropertyStepForm: View {
    var planner: HouseholdPlanner
    var usePartner: Bool

    var body: some View {
        Group {
            Section("Primary home") {
                LabeledContent("Value (£)") {
                    TextField("0", value: d(\.primaryValue), format: .number)
                }
                LabeledContent("Mortgage balance (£)") {
                    TextField("0", value: d(\.primaryMortgage), format: .number)
                }
                LabeledContent("Mortgage rate (decimal)") {
                    TextField("0.045", value: d(\.primaryMortgageRate), format: .number)
                }
                LabeledContent("Term (years)") {
                    TextField("25", value: d(\.primaryMortgageTermYears), format: .number)
                }
                Picker("Mortgage type", selection: mt()) {
                    Text("Repayment").tag(MortgageType.repayment)
                    Text("Interest only").tag(MortgageType.interest_only)
                }
                LabeledContent("Overpayment (£/mo)") {
                    TextField("0", value: d(\.primaryOverpayment), format: .number)
                }
            }
            Section("Cash") {
                LabeledContent("Cash savings (£)") {
                    TextField("0", value: d(\.cashSavings), format: .number)
                }
            }
        }
    }

    private func d(_ kp: WritableKeyPath<UserProfile, Double>) -> Binding<Double> {
        if usePartner {
            return Binding(
                get: { planner.partner?[keyPath: kp] ?? 0 },
                set: { v in planner.patchPartner { $0[keyPath: kp] = v } },
            )
        }
        return Binding(
            get: { planner.primary[keyPath: kp] },
            set: { v in planner.patchPrimary { $0[keyPath: kp] = v } },
        )
    }

    private func mt() -> Binding<MortgageType> {
        if usePartner {
            return Binding(
                get: { planner.partner?[keyPath: \.primaryMortgageType] ?? .repayment },
                set: { v in planner.patchPartner { $0.primaryMortgageType = v } },
            )
        }
        return Binding(
            get: { planner.primary.primaryMortgageType },
            set: { v in planner.patchPrimary { $0.primaryMortgageType = v } },
        )
    }
}

private struct BTLStepForm: View {
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        Section("Buy-to-let") {
            Text(
                "Add or edit BTL properties in the Property tab after onboarding. The shared engine goldens use an empty BTL list for numeric parity.",
            )
            .font(DesignTypography.labelSm)
            .foregroundStyle(DesignColor.textSecondary(colorScheme))
        }
    }
}

private struct ReviewStepForm: View {
    var planner: HouseholdPlanner

    var body: some View {
        Group {
            Section("Summary") {
                LabeledContent("Retirement age", value: "\(planner.primary.retirementTargetAge)")
                LabeledContent("Target income", value: AppFormat.gbp(planner.primary.targetRetirementIncome))
                LabeledContent("Dependents", value: "\(planner.dependentCount)")
                LabeledContent("Partner", value: planner.partner == nil ? "No" : "Yes")
            }
            Section("FIRE snapshot") {
                let f = planner.fire
                LabeledContent("FIRE number (effective)", value: AppFormat.gbp(f.effectiveFireNumber))
                LabeledContent("FIRE number (classic)", value: AppFormat.gbp(f.fireNumber))
                LabeledContent("FIRE pot", value: AppFormat.gbp(f.firePotNow))
                LabeledContent("Progress", value: "\(Int(f.fireProgressPct))%")
            }
        }
    }
}
