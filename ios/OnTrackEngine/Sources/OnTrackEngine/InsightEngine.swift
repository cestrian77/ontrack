import Foundation

public struct Insight: Sendable, Equatable, Identifiable {
    public var id: String
    public var category: String
    public var severity: String
    public var title: String
    public var body: String
    public var impactScore: Int
    public var actionRoute: String?

    public init(
        id: String,
        category: String,
        severity: String,
        title: String,
        body: String,
        impactScore: Int,
        actionRoute: String? = nil,
    ) {
        self.id = id
        self.category = category
        self.severity = severity
        self.title = title
        self.body = body
        self.impactScore = impactScore
        self.actionRoute = actionRoute
    }
}

public struct InsightContext: Sendable {
    public var profile: UserProfile
    public var projection: Projection
    public var fire: FireMetrics
    public var taxYearPack: TaxYearPack

    public init(profile: UserProfile, projection: Projection, fire: FireMetrics, taxYearPack: TaxYearPack) {
        self.profile = profile
        self.projection = projection
        self.fire = fire
        self.taxYearPack = taxYearPack
    }
}

private func fmtGBP(_ n: Double) -> String {
    let f = NumberFormatter()
    f.numberStyle = .currency
    f.currencyCode = "GBP"
    f.maximumFractionDigits = 0
    return f.string(from: NSNumber(value: n)) ?? "£\(Int(n))"
}

public enum InsightEngine {
    public static func generateInsights(ctx: InsightContext) -> [Insight] {
        typealias Rule = (InsightContext) -> Insight?
        let rules: [Rule] = [
            onTrack,
            isaBridgeRule,
            coastFireRule,
            fireProgressRule,
            isaAllowanceRule,
            lisaUnused,
            taperRule,
            overpayMortgage,
            btlNegativeCashflow,
            higherRateRelief,
        ]
        return rules.compactMap { $0(ctx) }.sorted { $0.impactScore > $1.impactScore }
    }

    private static func onTrack(_ ctx: InsightContext) -> Insight? {
        guard ctx.projection.years.contains(where: { $0.age == ctx.profile.retirementTargetAge })
        else { return nil }
        if ctx.fire.firePotAtRetirement >= ctx.fire.effectiveFireNumber {
            return Insight(
                id: "on_track_ahead",
                category: "on_track",
                severity: "positive",
                title: "On track for retirement",
                body:
                    "You are projected to reach your retirement target of \(fmtGBP(ctx.profile.targetRetirementIncome)) p.a. at age \(ctx.profile.retirementTargetAge).",
                impactScore: 80,
                actionRoute: "/dashboard",
            )
        }
        let shortfall = ctx.fire.effectiveFireNumber - ctx.fire.firePotAtRetirement
        return Insight(
            id: "on_track_short",
            category: "on_track",
            severity: "negative",
            title: "Projected shortfall at retirement",
            body:
                "Based on current assumptions, you will have a shortfall of \(fmtGBP(shortfall)) at age \(ctx.profile.retirementTargetAge).",
            impactScore: 100,
            actionRoute: "/scenarios",
        )
    }

    private static func isaBridgeRule(_ ctx: InsightContext) -> Insight? {
        let b = IsaBridgeEngine.isaBridge(profile: ctx.profile, projection: ctx.projection)
        if !b.required { return nil }
        if b.shortfall > 0 {
            return Insight(
                id: "isa_bridge_short",
                category: "isa_bridge",
                severity: "warning",
                title: "ISA bridge appears insufficient",
                body:
                    "You plan to retire at \(ctx.profile.retirementTargetAge) but will only have \(fmtGBP(b.isaAtRetirement)) in ISA. You need \(fmtGBP(b.needed)) to cover ages \(ctx.profile.retirementTargetAge)–\(ctx.projection.meta.nmpa).",
                impactScore: 90,
                actionRoute: "/dashboard",
            )
        }
        return Insight(
            id: "isa_bridge_ok",
            category: "isa_bridge",
            severity: "positive",
            title: "ISA bridge is adequate",
            body:
                "You have \(fmtGBP(b.isaAtRetirement)) ISA available against a requirement of \(fmtGBP(b.needed)) for your pre-pension years.",
            impactScore: 60,
        )
    }

    private static func coastFireRule(_ ctx: InsightContext) -> Insight? {
        if !ctx.fire.coastFireApplicable || !ctx.fire.coastReached { return nil }
        return Insight(
            id: "coast_fire_reached",
            category: "fire",
            severity: "positive",
            title: "You have crossed Coast FIRE",
            body:
                "Your FIRE pot of \(fmtGBP(ctx.fire.firePotNow)) is projected to reach your effective FIRE number of \(fmtGBP(ctx.fire.effectiveFireNumber)) by age \(ctx.profile.retirementTargetAge) without further contributions.",
            impactScore: 75,
            actionRoute: "/fire",
        )
    }

    private static func fireProgressRule(_ ctx: InsightContext) -> Insight? {
        if ctx.fire.coastFireApplicable && ctx.fire.coastReached { return nil }
        if ctx.fire.fireProgressPct >= 100 { return nil }
        let gap = max(0, ctx.fire.effectiveFireNumber - ctx.fire.firePotNow)
        let ageStr = ctx.fire.fireAge.map { " (projected at age \($0))" } ?? ""
        return Insight(
            id: "fire_distance",
            category: "fire",
            severity: "info",
            title: "Distance to FIRE",
            body:
                "You are \(fmtGBP(gap)) away from your effective FIRE number\(ageStr).",
            impactScore: 55,
            actionRoute: "/fire",
        )
    }

    private static func isaAllowanceRule(_ ctx: InsightContext) -> Insight? {
        let lisaAnnual = ctx.profile.hasLisa ? ctx.profile.lisaMonthly * 12 : 0
        let annual = ctx.profile.ssIsaMonthly * 12 + lisaAnnual
        let remaining = ctx.taxYearPack.isaAnnualAllowance - annual
        if remaining <= 0 { return nil }
        return Insight(
            id: "isa_allowance_remaining",
            category: "tax",
            severity: "info",
            title: "Unused ISA allowance",
            body:
                "You have \(fmtGBP(remaining)) of unused ISA allowance this tax year. This resets on 5 April.",
            impactScore: 45,
            actionRoute: "/tax",
        )
    }

    private static func lisaUnused(_ ctx: InsightContext) -> Insight? {
        if !ctx.profile.hasLisa { return nil }
        let age = ProjectionEngine.ageFromDob(dob: ctx.profile.dateOfBirth, asOf: Date())
        if age > ctx.taxYearPack.lisaMaxAgeContrib { return nil }
        let annual = ctx.profile.lisaMonthly * 12
        if annual >= ctx.taxYearPack.lisaAnnualAllowance { return nil }
        let remaining = ctx.taxYearPack.lisaAnnualAllowance - annual
        return Insight(
            id: "lisa_unused",
            category: "tax",
            severity: "info",
            title: "LISA bonus available",
            body:
                "Contributing a further \(fmtGBP(remaining)) to your LISA this year unlocks a 25% government bonus of up to \(fmtGBP(remaining * ctx.taxYearPack.lisaBonusRate)).",
            impactScore: 50,
            actionRoute: "/tax",
        )
    }

    private static func taperRule(_ ctx: InsightContext) -> Insight? {
        if ctx.profile.grossSalary <= ctx.taxYearPack.paTaperStart { return nil }
        if ctx.profile.grossSalary >= ctx.taxYearPack.paTaperEnd {
            return Insight(
                id: "pa_fully_tapered",
                category: "tax",
                severity: "warning",
                title: "Personal Allowance fully withdrawn",
                body:
                    "Your income above \(fmtGBP(ctx.taxYearPack.paTaperEnd)) means you have lost the full \(fmtGBP(ctx.taxYearPack.personalAllowance)) personal allowance. Pension contributions can restore it.",
                impactScore: 85,
                actionRoute: "/tax",
            )
        }
        let lost = (ctx.profile.grossSalary - ctx.taxYearPack.paTaperStart) / 2
        return Insight(
            id: "pa_taper",
            category: "tax",
            severity: "warning",
            title: "Personal Allowance is tapering",
            body:
                "You are above the \(fmtGBP(ctx.taxYearPack.paTaperStart)) taper threshold. \(fmtGBP(lost)) of your personal allowance has been withdrawn. Additional pension contributions can restore it.",
            impactScore: 70,
            actionRoute: "/tax",
        )
    }

    private static func overpayMortgage(_ ctx: InsightContext) -> Insight? {
        if ctx.profile.primaryMortgage <= 0 { return nil }
        if ctx.profile.primaryOverpayment > 0 { return nil }
        let summary = MortgageMath.overpaymentSummary(
            MortgageMath.MortgageInputs(
                principal: ctx.profile.primaryMortgage,
                annualRate: ctx.profile.primaryMortgageRate,
                termYears: ctx.profile.primaryMortgageTermYears,
                type: ctx.profile.primaryMortgageType,
            ),
            overpayment: 300,
        )
        if summary.interestSaved < 1000 { return nil }
        let y = summary.monthsSaved / 12
        let m = summary.monthsSaved % 12
        return Insight(
            id: "overpay_300",
            category: "property",
            severity: "info",
            title: "Mortgage overpayment opportunity",
            body:
                "Overpaying by £300/month would save \(fmtGBP(summary.interestSaved)) in interest and pay off your mortgage \(y) years and \(m) months early.",
            impactScore: 65,
            actionRoute: "/property",
        )
    }

    private static func btlNegativeCashflow(_ ctx: InsightContext) -> Insight? {
        if ctx.profile.btlProperties.isEmpty { return nil }
        var totalCf = 0.0
        for p in ctx.profile.btlProperties {
            totalCf += BtlCashflowEngine.btlAnnualCashflow(
                p,
                otherIncome: ctx.profile.grossSalary,
                region: ctx.profile.region,
                taxYearPack: ctx.taxYearPack,
            ).netCashflow
        }
        if totalCf >= 0 { return nil }
        return Insight(
            id: "btl_negative",
            category: "property",
            severity: "negative",
            title: "BTL portfolio is cashflow negative",
            body:
                "Your BTL cashflow is negative by \(fmtGBP(-totalCf))/year after costs and tax. Review costs or rental assumptions.",
            impactScore: 88,
            actionRoute: "/property",
        )
    }

    private static func higherRateRelief(_ ctx: InsightContext) -> Insight? {
        let marginal = TaxIncomeNI.marginalIncomeRate(
            income: ctx.profile.grossSalary,
            region: ctx.profile.region,
            pack: ctx.taxYearPack,
        )
        if marginal < 0.4 { return nil }
        if ctx.profile.sippMonthly > 0 { return nil }
        return Insight(
            id: "higher_rate_relief",
            category: "tax",
            severity: "info",
            title: "Higher-rate relief available",
            body:
                "As a higher-rate taxpayer, additional pension contributions attract 40% relief vs 20% in basic rate. A SIPP top-up may be worthwhile.",
            impactScore: 55,
            actionRoute: "/tax",
        )
    }
}
