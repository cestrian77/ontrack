import Foundation

public enum DefaultWebProfile {
    /// Mirrors web [`makeDefaultProfile`](../../../../src/engine/constants/defaults.ts) (same numbers as engine golden `default-profile-1990-dob` profile shape, with a dynamic DOB = today − 35y).
    public static func makeDefaultPrimary(asOf: Date = Date()) throws -> UserProfile {
        let cal = Calendar(identifier: .gregorian)
        guard let dobDate = cal.date(byAdding: DateComponents(year: -35), to: asOf) else {
            throw NSError(domain: "DefaultWebProfile", code: 0)
        }
        let y = cal.component(.year, from: dobDate)
        let m = cal.component(.month, from: dobDate)
        let d = cal.component(.day, from: dobDate)
        let dob = String(format: "%04d-%02d-%02d", y, m, d)
        let now = ISO8601DateFormatter().string(from: Date())
        let dict: [String: Any] = [
            "dateOfBirth": dob,
            "retirementTargetAge": 60,
            "targetRetirementIncome": 35_000,
            "region": "england_wales",
            "partnered": false,
            "employment": "employed",
            "grossSalary": 60_000,
            "bonus": 0,
            "salaryGrowth": 0.025,
            "statePensionClaimAge": 67,
            "statePensionWeekly": 241.3,
            "pensionPot": 50_000,
            "employeeContribPct": 0.05,
            "employerContribPct": 0.05,
            "sippMonthly": 0,
            "pensionAccessAge": 57,
            "pensionGrowth": 0.05,
            "hasDB": false,
            "dbAnnualIncome": 0,
            "dbNRA": 65,
            "ssIsaValue": 25_000,
            "ssIsaMonthly": 300,
            "cashIsaValue": 5_000,
            "cashIsaRate": 0.035,
            "giaValue": 0,
            "giaMonthly": 0,
            "giaGrowth": 0.05,
            "isaGrowth": 0.05,
            "lisaValue": 0,
            "lisaMonthly": 0,
            "hasLisa": true,
            "hasGia": true,
            "primaryValue": 350_000,
            "primaryMortgage": 200_000,
            "primaryMortgagePayment": 1_100,
            "primaryMortgageRate": 0.045,
            "primaryMortgageTermYears": 22,
            "primaryMortgageType": "repayment",
            "primaryAppreciation": 0.03,
            "primaryOverpayment": 0,
            "primaryLabel": "",
            "btlProperties": [] as [[String: Any]],
            "cashSavings": 10_000,
            "expectedInheritance": 0,
            "otherIncomeMonthly": 0,
            "monthlySurplus": 0,
            "cpi": 0.025,
            "cashRate": 0.035,
            "rentalGrowth": 0.03,
            "spTripleLockGrowth": 0.025,
            "safeWithdrawalRate": 0.035,
            "leanFirePct": 0.7,
            "fatFirePct": 1.5,
            "baristaPartTimeIncome": 12_000,
            "fireCalculationPrefs": [
                "offsetStatePension": false,
                "offsetDbPension": false,
                "offsetBtlNet": false,
                "referenceAgeMode": "at_retirement",
                "includePensionInPot": true,
                "includeSsIsaInPot": true,
                "includeCashIsaInPot": true,
                "includeLisaInPot": true,
                "includeGiaInPot": true,
                "includeCashInPot": true,
            ] as [String: Any],
            "updatedAt": now,
        ]
        let data = try JSONSerialization.data(withJSONObject: dict)
        return try JSONDecoder().decode(UserProfile.self, from: data)
    }

    public static func defaultPrimaryJSONData(asOf: Date = Date()) throws -> Data {
        let p = try makeDefaultPrimary(asOf: asOf)
        return try JSONEncoder().encode(p)
    }

    /// Web [`makePartnerProfileDefaults`](../../../../src/engine/constants/defaults.ts).
    public static func makePartnerDefaults(asOf: Date = Date()) throws -> UserProfile {
        var p = try makeDefaultPrimary(asOf: asOf)
        p.partnered = true
        p.primaryValue = 0
        p.primaryMortgage = 0
        p.primaryMortgagePayment = 0
        p.primaryMortgageRate = 0
        p.primaryMortgageTermYears = 25
        p.primaryOverpayment = 0
        p.primaryLabel = ""
        p.btlProperties = []
        p.grossSalary = 45_000
        p.pensionPot = 30_000
        p.targetRetirementIncome = 28_000
        p.updatedAt = ISO8601DateFormatter().string(from: Date())
        return p
    }
}
