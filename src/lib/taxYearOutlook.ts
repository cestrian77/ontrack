import type { TaxYearPack } from "@/engine/constants/taxYears";
import { nextRegisteredTaxYearPack } from "@/engine/constants/taxYears";
import { btlAnnualCashflow } from "@/engine/btl/cashflow";
import { careerTaxableEmploymentIncome } from "@/engine/cashflow/careerPath";
import { marginalPropertyIncomeRate } from "@/engine/tax/propertyTax";
import type { Projection, UserProfile } from "@/engine/types";
import { gbp, pct } from "@/lib/utils";

export interface TaxYearOutlookRow {
  label: string;
  value: string;
  emphasis?: "muted" | "negative";
}

export interface TaxYearOutlook {
  nextPackLabel: string;
  headline: string;
  rows: TaxYearOutlookRow[];
  btlAnnualDelta: number | null;
}

export function buildTaxYearOutlook(
  profile: UserProfile,
  currentPack: TaxYearPack,
  projection?: Projection,
): TaxYearOutlook | null {
  const nextPack = nextRegisteredTaxYearPack(currentPack);
  if (!nextPack) return null;
  if (nextPack.btlSection24CreditRate === currentPack.btlSection24CreditRate) {
    const ewSame =
      nextPack.englandWalesPropertyIncomeBands[1]?.rate ===
      currentPack.englandWalesPropertyIncomeBands[1]?.rate;
    if (ewSame) return null;
  }

  const rows: TaxYearOutlookRow[] = [
    {
      label: "Property income rates (EW)",
      value: `${formatEwPropertyRates(currentPack)} → ${formatEwPropertyRates(nextPack)}`,
    },
    {
      label: "Section 24 credit",
      value: `${pct(currentPack.btlSection24CreditRate)} → ${pct(nextPack.btlSection24CreditRate)}`,
      emphasis: "muted",
    },
  ];

  let btlAnnualDelta: number | null = null;
  if (profile.btlProperties.length > 0) {
    const otherIncome = careerTaxableEmploymentIncome(profile, 0);
    let nowNet = 0;
    let nextNet = 0;
    for (const p of profile.btlProperties) {
      nowNet += btlAnnualCashflow(p, otherIncome, profile.region, {
        taxYearPack: currentPack,
      }).netCashflow;
      nextNet += btlAnnualCashflow(p, otherIncome, profile.region, {
        taxYearPack: nextPack,
      }).netCashflow;
    }
    btlAnnualDelta = nextNet - nowNet;
    const marginalNow = marginalPropertyIncomeRate(
      otherIncome + 5_000,
      profile.region,
      currentPack,
    );
    const marginalNext = marginalPropertyIncomeRate(
      otherIncome + 5_000,
      profile.region,
      nextPack,
    );
    rows.push({
      label: "Illustrative property marginal rate",
      value: `${pct(marginalNow)} → ${pct(marginalNext)}`,
      emphasis: "muted",
    });
    rows.push({
      label: "BTL portfolio (annual, same rents)",
      value: `${btlAnnualDelta >= 0 ? "+" : ""}${gbp(btlAnnualDelta)} vs ${currentPack.label}`,
      emphasis: btlAnnualDelta < 0 ? "negative" : "muted",
    });
  }

  if (projection?.meta.steppedTaxYears && profile.btlProperties.length > 0) {
    const idx = projection.years.findIndex((y) => y.taxYearLabel === nextPack.label);
    if (idx > 0) {
      const before = projection.years[idx - 1];
      const first = projection.years[idx];
      if (before.btlCashflowNet !== first.btlCashflowNet) {
        rows.push({
          label: `Projection at age ${first.age} (${first.year})`,
          value: `BTL net ${gbp(before.btlCashflowNet)} → ${gbp(first.btlCashflowNet)}`,
          emphasis:
            first.btlCashflowNet < before.btlCashflowNet ? "negative" : "muted",
        });
      }
    }
  }

  return {
    nextPackLabel: nextPack.label,
    headline: `From 6 April ${nextPack.startsOn.slice(0, 4)} (${nextPack.label})`,
    rows,
    btlAnnualDelta,
  };
}

function formatEwPropertyRates(pack: TaxYearPack): string {
  const rates = pack.englandWalesPropertyIncomeBands
    .map((b) => b.rate)
    .filter((r) => r > 0)
    .map((r) => `${Math.round(r * 100)}%`);
  return rates.join(" / ") || "—";
}
