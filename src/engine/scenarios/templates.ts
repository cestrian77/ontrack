import type {
  MonthlyBoostParams,
  PropertySaleParam,
  Scenario,
  ScenarioParams,
  UserProfile,
} from "@/engine/types";

export interface ScenarioTemplateMeta {
  id: string;
  name: string;
  description: string;
  defaultColour: string;
}

const PALETTE = [
  "#0f766e",
  "#d4a017",
  "#1e3a8a",
  "#3b82f6",
  "#10b981",
  "#a855f7",
  "#ef4444",
  "#f97316",
  "#06b6d4",
  "#64748b",
];

export function pickColour(idx: number): string {
  return PALETTE[idx % PALETTE.length];
}

export const SCENARIO_TEMPLATES: ScenarioTemplateMeta[] = [
  {
    id: "retire_earlier",
    name: "Retire 5 years earlier",
    description: "Reduces retirement target age by 5 years.",
    defaultColour: "#0f766e",
  },
  {
    id: "retire_later",
    name: "Retire 5 years later",
    description: "Increases retirement target age by 5 years.",
    defaultColour: "#1e3a8a",
  },
  {
    id: "boost_pension",
    name: "Change pension contributions",
    description: "Adjust SIPP contributions up or down — flat or phased ramp over time.",
    defaultColour: "#0f766e",
  },
  {
    id: "boost_isa",
    name: "Change ISA contributions",
    description: "Adjust S&S ISA contributions up or down — flat or phased ramp.",
    defaultColour: "#d4a017",
  },
  {
    id: "overpay_mortgage",
    name: "Pay off mortgage early",
    description: "Extra monthly overpayment on primary (interest-only path in the model).",
    defaultColour: "#3b82f6",
  },
  {
    id: "lower_returns",
    name: "Change return assumptions",
    description: "Adjust pension and ISA growth assumptions (default: -1.5%).",
    defaultColour: "#ef4444",
  },
  {
    id: "higher_inflation",
    name: "Change inflation assumption",
    description: "Adjust inflation assumption (default: +1.5%).",
    defaultColour: "#f97316",
  },
  {
    id: "sell_property",
    name: "Sell property",
    description: "Sell primary and/or BTL; set replacement cost if you downsize/upsize.",
    defaultColour: "#06b6d4",
  },
  {
    id: "salary_sacrifice",
    name: "Salary sacrifice optimisation",
    description: "Increases pension contribution to bring income to basic rate threshold.",
    defaultColour: "#10b981",
  },
  {
    id: "inheritance",
    name: "Inheritance event",
    description: "Lump sum to cash in a chosen year.",
    defaultColour: "#a855f7",
  },
];

function normBoost(
  b: MonthlyBoostParams | undefined,
  defaults: { monthlyExtra: number },
): MonthlyBoostParams {
  return {
    monthlyExtra: b?.monthlyExtra ?? defaults.monthlyExtra,
    mode: b?.mode ?? "flat",
    rampYears: Math.max(1, b?.rampYears ?? 5),
  };
}

export function defaultParamsForTemplate(
  templateId: string,
  profile?: UserProfile,
): ScenarioParams {
  switch (templateId) {
    case "boost_pension":
      return {
        pensionBoost: { monthlyExtra: 200, mode: "flat", rampYears: 5 },
      };
    case "boost_isa":
      return {
        isaBoost: { monthlyExtra: 200, mode: "flat", rampYears: 5 },
      };
    case "overpay_mortgage":
      return {
        mortgageOverpay: { monthlyExtra: 500, mode: "flat", rampYears: 5 },
      };
    case "sell_property":
    case "reduce_btl": {
      if (profile?.btlProperties.length) {
        return { propertySales: [{ kind: "btl", btlIndex: 0 }] };
      }
      if (profile && profile.primaryValue > 0) {
        return { propertySales: [{ kind: "primary", replacementCost: 0 }] };
      }
      return { propertySales: [{ kind: "btl", btlIndex: 0 }] };
    }
    case "inheritance":
      return { inheritanceAmount: 50_000, inheritanceYearsFromNow: 5 };
    default:
      return {};
  }
}

/** Apply property sales in order: BTLs by descending index, then primary (so indices stay valid). */
export function applyPropertySales(
  p: UserProfile,
  sales: PropertySaleParam[],
): Pick<UserProfile, "cashSavings" | "primaryValue" | "primaryMortgage" | "btlProperties"> {
  let cash = p.cashSavings;
  let primaryValue = p.primaryValue;
  let primaryMortgage = p.primaryMortgage;
  let btls = [...p.btlProperties];

  const primarySales = sales.filter((s) => s.kind === "primary");
  const btlSales = sales.filter((s) => s.kind === "btl");
  const sortedBtl = [...btlSales].sort(
    (a, b) => (b.btlIndex ?? 0) - (a.btlIndex ?? 0),
  );

  for (const s of sortedBtl) {
    const idx = s.btlIndex ?? 0;
    if (idx >= 0 && idx < btls.length) {
      const prop = btls[idx];
      const equity = Math.max(0, prop.value - prop.mortgageBalance);
      cash += equity;
      btls = btls.filter((_, i) => i !== idx);
    }
  }

  if (primarySales.length > 0) {
    const s = primarySales[0];
    const equity = Math.max(0, primaryValue - primaryMortgage);
    cash += equity - (s.replacementCost ?? 0);
    primaryValue = 0;
    primaryMortgage = 0;
  }

  return {
    cashSavings: cash,
    primaryValue,
    primaryMortgage,
    btlProperties: btls,
  };
}

function mergeBoostIntoProfile(
  patch: Partial<UserProfile>,
  key: keyof NonNullable<UserProfile["scenarioContributionAdj"]>,
  boost: MonthlyBoostParams,
): void {
  patch.scenarioContributionAdj = {
    ...patch.scenarioContributionAdj,
    [key]: boost,
  };
}

export function computeScenarioPatch(
  profile: UserProfile,
  s: Scenario,
): Partial<UserProfile> {
  const tid = s.templateId;
  const params = s.params ?? {};

  if (!tid) {
    const { scenarioContributionAdj: _a, ...rest } = s.overrides;
    void _a;
    return { ...rest };
  }

  const patch: Partial<UserProfile> = {};

  switch (tid) {
    case "retire_earlier":
      patch.retirementTargetAge = Math.max(40, profile.retirementTargetAge - 5);
      break;
    case "retire_later":
      patch.retirementTargetAge = Math.min(80, profile.retirementTargetAge + 5);
      break;
    case "boost_pension": {
      const b = normBoost(params.pensionBoost, { monthlyExtra: 200 });
      if (b.mode === "flat") {
        patch.sippMonthly = profile.sippMonthly + b.monthlyExtra;
      } else {
        mergeBoostIntoProfile(patch, "sippExtraMonthly", b);
      }
      break;
    }
    case "boost_isa": {
      const b = normBoost(params.isaBoost, { monthlyExtra: 200 });
      if (b.mode === "flat") {
        patch.ssIsaMonthly = profile.ssIsaMonthly + b.monthlyExtra;
      } else {
        mergeBoostIntoProfile(patch, "ssIsaExtraMonthly", b);
      }
      break;
    }
    case "overpay_mortgage": {
      const b = normBoost(params.mortgageOverpay, { monthlyExtra: 500 });
      if (b.mode === "flat") {
        patch.primaryOverpayment = profile.primaryOverpayment + b.monthlyExtra;
      } else {
        mergeBoostIntoProfile(patch, "primaryOverpayExtraMonthly", b);
      }
      break;
    }
    case "lower_returns":
      patch.pensionGrowth = Math.max(0, profile.pensionGrowth - 0.015);
      patch.isaGrowth = Math.max(0, profile.isaGrowth - 0.015);
      break;
    case "higher_inflation":
      patch.cpi = Math.min(0.1, profile.cpi + 0.015);
      break;
    case "sell_property": {
      const sales =
        params.propertySales != null && params.propertySales.length > 0
          ? params.propertySales
          : [{ kind: "btl" as const, btlIndex: 0 }];
      Object.assign(patch, applyPropertySales(profile, sales));
      break;
    }
    case "reduce_btl": {
      const legacy = params.propertySales?.length
        ? params.propertySales
        : [{ kind: "btl" as const, btlIndex: 0 }];
      Object.assign(patch, applyPropertySales(profile, legacy));
      break;
    }
    case "salary_sacrifice": {
      const surplus = Math.max(0, profile.grossSalary - 50_270);
      if (surplus > 0) {
        patch.employeeContribPct = Math.min(
          1,
          profile.employeeContribPct + surplus / Math.max(1, profile.grossSalary),
        );
      }
      break;
    }
    case "inheritance": {
      const amt = params.inheritanceAmount ?? 50_000;
      const years = Math.max(0, params.inheritanceYearsFromNow ?? 5);
      patch.expectedInheritance = amt;
      patch.inheritanceYear = new Date().getFullYear() + years;
      break;
    }
    default:
      break;
  }

  return patch;
}

export function applyScenario(profile: UserProfile, s: Scenario): UserProfile {
  if (s.templateId) {
    const patch = computeScenarioPatch(profile, s);
    return { ...profile, ...patch };
  }
  return { ...profile, ...s.overrides };
}

export function createScenarioFromTemplate(
  template: ScenarioTemplateMeta,
  profile: UserProfile,
  personScope: "primary" | "partner" = "primary",
): Scenario {
  return {
    id: `${template.id}_${Date.now()}`,
    name: template.name,
    colour: template.defaultColour,
    templateId: template.id,
    params: defaultParamsForTemplate(template.id, profile),
    overrides: {},
    createdAt: new Date().toISOString(),
    personScope,
  };
}

export function scenarioTemplateConfigurable(templateId: string): boolean {
  return (
    templateId === "boost_pension" ||
    templateId === "boost_isa" ||
    templateId === "overpay_mortgage" ||
    templateId === "sell_property" ||
    templateId === "inheritance" ||
    templateId === "reduce_btl"
  );
}

export function summarizeScenario(s: Scenario): string {
  const parts: string[] = [];
  if (s.params?.taxYearLabel) {
    parts.push(`Tax rules ${s.params.taxYearLabel}`);
  }
  if (!s.templateId || !s.params) return parts.join(" · ");
  const p = s.params;
  if (p.pensionBoost) {
    const sign = p.pensionBoost.monthlyExtra > 0 ? "+" : "";
    parts.push(
      p.pensionBoost.mode === "flat"
        ? `${sign}£${p.pensionBoost.monthlyExtra}/mo SIPP`
        : `SIPP ramp to ${sign}£${p.pensionBoost.monthlyExtra}/mo over ${p.pensionBoost.rampYears}y`,
    );
  }
  if (p.isaBoost) {
    const sign = p.isaBoost.monthlyExtra > 0 ? "+" : "";
    parts.push(
      p.isaBoost.mode === "flat"
        ? `${sign}£${p.isaBoost.monthlyExtra}/mo ISA`
        : `ISA ramp to ${sign}£${p.isaBoost.monthlyExtra}/mo over ${p.isaBoost.rampYears}y`,
    );
  }
  if (p.mortgageOverpay) {
    const sign = p.mortgageOverpay.monthlyExtra > 0 ? "+" : "";
    parts.push(
      p.mortgageOverpay.mode === "flat"
        ? `${sign}£${p.mortgageOverpay.monthlyExtra}/mo overpay`
        : `Overpay ramp to ${sign}£${p.mortgageOverpay.monthlyExtra}/mo over ${p.mortgageOverpay.rampYears}y`,
    );
  }
  if (p.propertySales?.length) {
    parts.push(
      `${p.propertySales.length} sale(s): ${p.propertySales.map((x) => (x.kind === "primary" ? "home" : `BTL ${(x.btlIndex ?? 0) + 1}`)).join(", ")}`,
    );
  }
  if (p.inheritanceAmount != null) {
    parts.push(
      `£${Math.round(p.inheritanceAmount).toLocaleString("en-GB")} in ${p.inheritanceYearsFromNow ?? "?"}y`,
    );
  }
  if (s.personScope === "partner") {
    parts.push("Partner profile");
  }
  return parts.join(" · ");
}
