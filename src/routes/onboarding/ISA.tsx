import { useProfileStore } from "@/store/useProfileStore";
import { Field, NumberInput, PercentInput } from "@/components/forms/Field";
import { StepShell } from "./StepShell";

export default function OnboardingISA() {
  const { profile, update } = useProfileStore();
  return (
    <StepShell
      title="ISAs & Investments"
      description="Tick the account types you use, then enter balances and contributions. The £20,000 combined annual ISA cap is enforced in the model."
      prev="/onboard/pensions"
      next="/onboard/property"
    >
      <div className="rounded-md border p-4 space-y-3 mb-2">
        <p className="text-xs text-muted-foreground">
          Uncheck any wrapper you do not use — those fields stay hidden and are excluded from
          projections and insights.
        </p>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={profile.hasLisa}
            onChange={(e) =>
              e.target.checked
                ? update({ hasLisa: true })
                : update({ hasLisa: false, lisaValue: 0, lisaMonthly: 0 })
            }
            className="h-4 w-4 accent-primary mt-0.5 shrink-0"
          />
          <span className="text-sm">
            <span className="font-medium text-foreground">I have a LISA</span>
            <span className="block text-xs text-muted-foreground mt-0.5">
              Lifetime ISA (government bonus). Hide if you do not hold one.
            </span>
          </span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={profile.hasGia}
            onChange={(e) =>
              e.target.checked
                ? update({ hasGia: true })
                : update({ hasGia: false, giaValue: 0, giaMonthly: 0 })
            }
            className="h-4 w-4 accent-primary mt-0.5 shrink-0"
          />
          <span className="text-sm">
            <span className="font-medium text-foreground">I have a GIA</span>
            <span className="block text-xs text-muted-foreground mt-0.5">
              Taxable general investment account outside ISAs.
            </span>
          </span>
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="S&S ISA value" example="£25,000">
          <NumberInput
            prefix="£"
            value={profile.ssIsaValue}
            onChange={(n) => update({ ssIsaValue: n })}
          />
        </Field>
        <Field label="S&S ISA monthly contribution" example="£300/mo">
          <NumberInput
            prefix="£"
            suffix="/mo"
            value={profile.ssIsaMonthly}
            onChange={(n) => update({ ssIsaMonthly: n })}
            max={1_667}
          />
        </Field>
        <Field label="Cash ISA value" example="£5,000">
          <NumberInput
            prefix="£"
            value={profile.cashIsaValue}
            onChange={(n) => update({ cashIsaValue: n })}
          />
        </Field>
        <Field
          label="Cash ISA interest rate"
          hint="Average annual interest your Cash ISA earns."
          example="3.5%"
        >
          <PercentInput
            value={profile.cashIsaRate}
            onChange={(n) => update({ cashIsaRate: n })}
            min={0}
            max={10}
          />
        </Field>
        {profile.hasLisa && (
          <>
            <Field label="LISA value" hint="Lifetime ISA. Max £4,000/year contribution.">
              <NumberInput
                prefix="£"
                value={profile.lisaValue}
                onChange={(n) => update({ lisaValue: n })}
              />
            </Field>
            <Field
              label="LISA monthly contribution"
              hint="25% bonus added to contributions until age 50."
              example="£333/mo"
            >
              <NumberInput
                prefix="£"
                suffix="/mo"
                value={profile.lisaMonthly}
                onChange={(n) => update({ lisaMonthly: n })}
                max={333}
              />
            </Field>
          </>
        )}
        {profile.hasGia && (
          <>
            <Field
              label="GIA value"
              hint="Taxable general investment account."
              example="£0"
            >
              <NumberInput
                prefix="£"
                value={profile.giaValue}
                onChange={(n) => update({ giaValue: n })}
              />
            </Field>
            <Field label="GIA monthly contribution" example="£0">
              <NumberInput
                prefix="£"
                suffix="/mo"
                value={profile.giaMonthly}
                onChange={(n) => update({ giaMonthly: n })}
              />
            </Field>
          </>
        )}
        <Field
          label="ISA growth assumption"
          hint="Nominal annual return."
          example="5%"
        >
          <PercentInput
            value={profile.isaGrowth}
            onChange={(n) => update({ isaGrowth: n })}
            min={0}
            max={15}
          />
        </Field>
        {profile.hasGia && (
          <Field
            label="GIA growth assumption"
            hint="Nominal; we apply a 0.5% CGT drag for taxable gains."
            example="5%"
          >
            <PercentInput
              value={profile.giaGrowth}
              onChange={(n) => update({ giaGrowth: n })}
              min={0}
              max={15}
            />
          </Field>
        )}
        <Field
          label="Cash savings"
          hint="Excluded from growth projections; emergency fund."
          example="£10,000"
        >
          <NumberInput
            prefix="£"
            value={profile.cashSavings}
            onChange={(n) => update({ cashSavings: n })}
          />
        </Field>
      </div>
    </StepShell>
  );
}
