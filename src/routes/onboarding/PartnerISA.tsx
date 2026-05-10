import { Navigate } from "react-router-dom";
import { useProfileStore } from "@/store/useProfileStore";
import { Field, NumberInput, PercentInput } from "@/components/forms/Field";
import { StepShell } from "./StepShell";

export default function OnboardingPartnerISA() {
  const profile = useProfileStore((s) => s.profile);
  const partnerProfile = useProfileStore((s) => s.partnerProfile);
  const updatePartner = useProfileStore((s) => s.updatePartner);

  if (!profile.partnered || !partnerProfile) {
    return <Navigate to="/onboard/btl" replace />;
  }

  const p = partnerProfile;

  return (
    <StepShell
      title="Partner ISAs & investments"
      description="Their own wrappers and cash savings. Primary home and BTL are still entered on your steps only."
      prev="/onboard/partner-pensions"
      next="/onboard/review"
    >
      <div className="rounded-md border p-4 space-y-3 mb-2">
        <p className="text-xs text-muted-foreground">
          Uncheck wrappers they do not use — balances and contributions are ignored in projections.
        </p>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={p.hasLisa}
            onChange={(e) =>
              e.target.checked
                ? updatePartner({ hasLisa: true })
                : updatePartner({ hasLisa: false, lisaValue: 0, lisaMonthly: 0 })
            }
            className="h-4 w-4 accent-primary mt-0.5 shrink-0"
          />
          <span className="text-sm">
            <span className="font-medium text-foreground">Partner has a LISA</span>
          </span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={p.hasGia}
            onChange={(e) =>
              e.target.checked
                ? updatePartner({ hasGia: true })
                : updatePartner({ hasGia: false, giaValue: 0, giaMonthly: 0 })
            }
            className="h-4 w-4 accent-primary mt-0.5 shrink-0"
          />
          <span className="text-sm">
            <span className="font-medium text-foreground">Partner has a GIA</span>
          </span>
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="S&S ISA value" example="£15,000">
          <NumberInput
            prefix="£"
            value={p.ssIsaValue}
            onChange={(n) => updatePartner({ ssIsaValue: n })}
          />
        </Field>
        <Field label="S&S ISA monthly contribution" example="£200/mo">
          <NumberInput
            prefix="£"
            suffix="/mo"
            value={p.ssIsaMonthly}
            onChange={(n) => updatePartner({ ssIsaMonthly: n })}
            max={1_667}
          />
        </Field>
        <Field label="Cash ISA value" example="£3,000">
          <NumberInput
            prefix="£"
            value={p.cashIsaValue}
            onChange={(n) => updatePartner({ cashIsaValue: n })}
          />
        </Field>
        <Field label="Cash ISA interest rate" example="3.5%">
          <PercentInput
            value={p.cashIsaRate}
            onChange={(n) => updatePartner({ cashIsaRate: n })}
            min={0}
            max={10}
          />
        </Field>
        {p.hasLisa && (
          <>
            <Field label="LISA value">
              <NumberInput
                prefix="£"
                value={p.lisaValue}
                onChange={(n) => updatePartner({ lisaValue: n })}
              />
            </Field>
            <Field label="LISA monthly contribution" example="£333/mo">
              <NumberInput
                prefix="£"
                suffix="/mo"
                value={p.lisaMonthly}
                onChange={(n) => updatePartner({ lisaMonthly: n })}
                max={333}
              />
            </Field>
          </>
        )}
        {p.hasGia && (
          <>
            <Field label="GIA value" example="£0">
              <NumberInput
                prefix="£"
                value={p.giaValue}
                onChange={(n) => updatePartner({ giaValue: n })}
              />
            </Field>
            <Field label="GIA monthly contribution" example="£0">
              <NumberInput
                prefix="£"
                suffix="/mo"
                value={p.giaMonthly}
                onChange={(n) => updatePartner({ giaMonthly: n })}
              />
            </Field>
          </>
        )}
        <Field label="ISA growth assumption" example="5%">
          <PercentInput
            value={p.isaGrowth}
            onChange={(n) => updatePartner({ isaGrowth: n })}
            min={0}
            max={15}
          />
        </Field>
        {p.hasGia && (
          <Field label="GIA growth assumption" example="5%">
            <PercentInput
              value={p.giaGrowth}
              onChange={(n) => updatePartner({ giaGrowth: n })}
              min={0}
              max={15}
            />
          </Field>
        )}
        <Field label="Cash savings" example="£5,000">
          <NumberInput
            prefix="£"
            value={p.cashSavings}
            onChange={(n) => updatePartner({ cashSavings: n })}
          />
        </Field>
      </div>
    </StepShell>
  );
}
