/**
 * Mortgage amortisation (PRD §5.8).
 * Annual rate provided as decimal; closed-form repayment formula:
 *   M = P × r(1+r)^n / ((1+r)^n − 1)
 *   B(k) = P(1+r)^k − M((1+r)^k − 1)/r
 */

export interface MortgageInputs {
  principal: number;
  annualRate: number;
  termYears: number;
  type: "repayment" | "interest_only";
  monthlyOverpayment?: number;
}

export interface AmortPoint {
  monthIndex: number;
  balance: number;
  interestPaid: number;
  principalPaid: number;
}

export function monthlyPayment(p: number, annualRate: number, termYears: number): number {
  const n = termYears * 12;
  const r = annualRate / 12;
  if (r === 0) return p / Math.max(1, n);
  const factor = Math.pow(1 + r, n);
  return (p * (r * factor)) / (factor - 1);
}

export function balanceAfterMonths(
  p: number,
  annualRate: number,
  termYears: number,
  k: number,
): number {
  const r = annualRate / 12;
  const n = termYears * 12;
  if (r === 0) {
    const m = p / Math.max(1, n);
    return Math.max(0, p - m * k);
  }
  const m = monthlyPayment(p, annualRate, termYears);
  return Math.max(0, p * Math.pow(1 + r, k) - (m * (Math.pow(1 + r, k) - 1)) / r);
}

/** Simulate amortisation month-by-month, optionally with constant monthly overpayment. */
export function amortise(inputs: MortgageInputs): AmortPoint[] {
  const { principal, annualRate, termYears, type, monthlyOverpayment = 0 } = inputs;
  const r = annualRate / 12;
  const n = termYears * 12;
  const out: AmortPoint[] = [];
  let balance = principal;
  let cumulativeInterest = 0;
  let cumulativePrincipal = 0;
  const baseMonthly =
    type === "interest_only"
      ? principal * r
      : monthlyPayment(principal, annualRate, termYears);
  for (let i = 1; i <= n && balance > 0.01; i++) {
    const interest = balance * r;
    let principalPaid: number;
    if (type === "interest_only") {
      principalPaid = monthlyOverpayment;
    } else {
      const scheduled = baseMonthly - interest;
      principalPaid = scheduled + monthlyOverpayment;
    }
    if (principalPaid > balance) principalPaid = balance;
    balance -= principalPaid;
    cumulativeInterest += interest;
    cumulativePrincipal += principalPaid;
    out.push({
      monthIndex: i,
      balance,
      interestPaid: cumulativeInterest,
      principalPaid: cumulativePrincipal,
    });
    if (balance < 0.01) break;
  }
  return out;
}

export interface OverpaymentSummary {
  baseMonths: number;
  baseInterest: number;
  overpayMonths: number;
  overpayInterest: number;
  monthsSaved: number;
  interestSaved: number;
  newPayoffYears: number;
}

export function overpaymentSummary(
  inputs: MortgageInputs,
  overpayment: number,
): OverpaymentSummary {
  const base = amortise({ ...inputs, monthlyOverpayment: 0 });
  const over = amortise({ ...inputs, monthlyOverpayment: overpayment });
  const baseLast = base[base.length - 1];
  const overLast = over[over.length - 1];
  return {
    baseMonths: base.length,
    baseInterest: baseLast?.interestPaid ?? 0,
    overpayMonths: over.length,
    overpayInterest: overLast?.interestPaid ?? 0,
    monthsSaved: base.length - over.length,
    interestSaved: (baseLast?.interestPaid ?? 0) - (overLast?.interestPaid ?? 0),
    newPayoffYears: over.length / 12,
  };
}
