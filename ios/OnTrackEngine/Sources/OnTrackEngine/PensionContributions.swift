import Foundation

enum PensionContributions {
    static func sippGrossAnnual(monthlyNet: Double) -> Double {
        (monthlyNet * 12) / 0.8
    }

    static func workplaceContribAnnual(
        grossSalary: Double,
        employeePct: Double,
        employerPct: Double,
    ) -> (employee: Double, employer: Double, total: Double) {
        let employee = grossSalary * employeePct
        let employer = grossSalary * employerPct
        return (employee, employer, employee + employer)
    }

    static func dbAnnualIncomeAtAge(profile: UserProfile, age: Int) -> Double {
        if !profile.hasDB { return 0 }
        if Double(age) < Double(profile.dbNRA) { return 0 }
        return profile.dbAnnualIncome
    }
}
