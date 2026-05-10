import Foundation

/// Web-aligned scenario application ([`templates.ts`](../../../../src/engine/scenarios/templates.ts)).
public enum ScenarioApplyEngine {
    public static func applyScenario(profile: UserProfile, scenarioJSON: Data) throws -> UserProfile {
        let top = try JSONSerialization.jsonObject(with: scenarioJSON) as? [String: Any]
        guard let top else { throw ScenarioApplyError.invalidJSON }
        let tid = top["templateId"] as? String
        if tid == nil {
            let overrides = (top["overrides"] as? [String: Any]) ?? [:]
            var o = overrides
            o.removeValue(forKey: "scenarioContributionAdj")
            return try shallowMerge(profile, o)
        }
        let params = top["params"] as? [String: Any] ?? [:]
        let patch = try computeScenarioPatch(profile: profile, templateId: tid!, params: params)
        return try shallowMerge(profile, patch)
    }

    public enum ScenarioApplyError: Error {
        case invalidJSON
    }

    private static func shallowMerge(_ profile: UserProfile, _ patch: [String: Any]) throws -> UserProfile {
        let data = try JSONEncoder().encode(profile)
        var obj = try JSONSerialization.jsonObject(with: data) as! [String: Any]
        for (k, v) in patch where k != "scenarioContributionAdj" {
            obj[k] = v
        }
        let out = try JSONSerialization.data(withJSONObject: obj)
        return try JSONDecoder().decode(UserProfile.self, from: out)
    }

    private static func normBoost(_ b: [String: Any]?, defaults: Double) -> MonthlyBoostParams {
        let monthly = (b?["monthlyExtra"] as? Double) ?? defaults
        let mode = (b?["mode"] as? String) ?? "flat"
        let rampYears = max(1, (b?["rampYears"] as? Int) ?? 5)
        return MonthlyBoostParams(monthlyExtra: monthly, mode: mode, rampYears: rampYears)
    }

    private static func mergeBoost(
        _ patch: inout [String: Any],
        key: String,
        boost: MonthlyBoostParams,
    ) {
        var adj = patch["scenarioContributionAdj"] as? [String: Any] ?? [:]
        var inner: [String: Any] = [:]
        inner["monthlyExtra"] = boost.monthlyExtra
        inner["mode"] = boost.mode
        inner["rampYears"] = boost.rampYears
        adj[key] = inner
        patch["scenarioContributionAdj"] = adj
    }

    private static func propertySalesPatch(
        _ p: UserProfile,
        sales: [[String: Any]],
    ) throws -> [String: Any] {
        var cash = p.cashSavings
        var primaryValue = p.primaryValue
        var primaryMortgage = p.primaryMortgage
        var btls = p.btlProperties

        let primarySales = sales.filter { ($0["kind"] as? String) == "primary" }
        let btlSales = sales.filter { ($0["kind"] as? String) == "btl" }
        let sortedBtl = btlSales.sorted {
            let a = $0["btlIndex"] as? Int ?? 0
            let b = $1["btlIndex"] as? Int ?? 0
            return a > b
        }

        for s in sortedBtl {
            let idx = s["btlIndex"] as? Int ?? 0
            if idx >= 0, idx < btls.count {
                let prop = btls[idx]
                let equity = max(0, prop.value - prop.mortgageBalance)
                cash += equity
                btls.remove(at: idx)
            }
        }

        if let s = primarySales.first {
            let equity = max(0, primaryValue - primaryMortgage)
            let replacement = (s["replacementCost"] as? Double) ?? 0
            cash += equity - replacement
            primaryValue = 0
            primaryMortgage = 0
        }

        let btlData = try JSONEncoder().encode(btls)
        let btlArr = try JSONSerialization.jsonObject(with: btlData)
        return [
            "cashSavings": cash,
            "primaryValue": primaryValue,
            "primaryMortgage": primaryMortgage,
            "btlProperties": btlArr,
        ]
    }

    private static func computeScenarioPatch(
        profile: UserProfile,
        templateId: String,
        params: [String: Any],
    ) throws -> [String: Any] {
        var patch: [String: Any] = [:]
        switch templateId {
        case "retire_earlier":
            patch["retirementTargetAge"] = max(40, profile.retirementTargetAge - 5)
        case "retire_later":
            patch["retirementTargetAge"] = min(80, profile.retirementTargetAge + 5)
        case "boost_pension":
            let b = normBoost(params["pensionBoost"] as? [String: Any], defaults: 200)
            if b.mode == "flat" {
                patch["sippMonthly"] = profile.sippMonthly + b.monthlyExtra
            } else {
                mergeBoost(&patch, key: "sippExtraMonthly", boost: b)
            }
        case "boost_isa":
            let b = normBoost(params["isaBoost"] as? [String: Any], defaults: 200)
            if b.mode == "flat" {
                patch["ssIsaMonthly"] = profile.ssIsaMonthly + b.monthlyExtra
            } else {
                mergeBoost(&patch, key: "ssIsaExtraMonthly", boost: b)
            }
        case "overpay_mortgage":
            let b = normBoost(params["mortgageOverpay"] as? [String: Any], defaults: 500)
            if b.mode == "flat" {
                patch["primaryOverpayment"] = profile.primaryOverpayment + b.monthlyExtra
            } else {
                mergeBoost(&patch, key: "primaryOverpayExtraMonthly", boost: b)
            }
        case "lower_returns":
            patch["pensionGrowth"] = max(0, profile.pensionGrowth - 0.015)
            patch["isaGrowth"] = max(0, profile.isaGrowth - 0.015)
        case "higher_inflation":
            patch["cpi"] = min(0.1, profile.cpi + 0.015)
        case "sell_property", "reduce_btl":
            let raw = params["propertySales"] as? [[String: Any]]
            let sales: [[String: Any]]
            if let raw, !raw.isEmpty {
                sales = raw
            } else {
                sales = [["kind": "btl", "btlIndex": 0]]
            }
            let propPatch = try propertySalesPatch(profile, sales: sales)
            for (k, v) in propPatch { patch[k] = v }
        case "salary_sacrifice":
            let surplus = max(0, profile.grossSalary - 50_270)
            if surplus > 0 {
                patch["employeeContribPct"] = min(
                    1,
                    profile.employeeContribPct + surplus / max(1, profile.grossSalary),
                )
            }
        case "inheritance":
            let amt = (params["inheritanceAmount"] as? Double) ?? 50_000
            let years = max(0, (params["inheritanceYearsFromNow"] as? Int) ?? 5)
            let cal = Calendar(identifier: .gregorian)
            let y = cal.component(.year, from: Date())
            patch["expectedInheritance"] = amt
            patch["inheritanceYear"] = y + years
        default:
            break
        }
        return patch
    }
}
