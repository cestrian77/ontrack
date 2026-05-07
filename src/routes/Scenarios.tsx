import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProfileStore } from "@/store/useProfileStore";
import { useScenarioStore } from "@/store/useScenarioStore";
import { useUiStore } from "@/store/useUiStore";
import {
  applyScenario,
  createScenarioFromTemplate,
  defaultParamsForTemplate,
  scenarioTemplateConfigurable,
  SCENARIO_TEMPLATES,
  summarizeScenario,
} from "@/engine/scenarios/templates";
import { useProjection } from "@/lib/hooks";
import { runProjection } from "@/engine/project/runProjection";
import { computeFire } from "@/engine/fire/fire";
import { gbp } from "@/lib/utils";
import { WealthJourney } from "@/components/charts/WealthJourney";
import type {
  MonthlyBoostParams,
  PropertySaleParam,
  Scenario,
  ScenarioParams,
  UserProfile,
} from "@/engine/types";
import { Field, NumberInput } from "@/components/forms/Field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Scenarios() {
  const profile = useProfileStore((s) => s.profile);
  const { projection: baseProj, fire: baseFire } = useProjection();
  const scenarios = useScenarioStore((s) => s.scenarios);
  const upsert = useScenarioStore((s) => s.upsert);
  const remove = useScenarioStore((s) => s.remove);
  const selectedIds = useUiStore((s) => s.selectedScenarioIds);
  const toggleScenario = useUiStore((s) => s.toggleScenario);
  const trySelectScenario = useUiStore((s) => s.trySelectScenario);
  const removeScenarioFromSelection = useUiStore((s) => s.removeScenarioFromSelection);

  const [editing, setEditing] = useState<Scenario | null>(null);

  const selected = useMemo(
    () => scenarios.filter((s) => selectedIds.includes(s.id)).slice(0, 3),
    [scenarios, selectedIds],
  );

  const compareRows = useMemo(() => {
    return selected.map((s) => {
      const next = applyScenario(profile, s);
      const proj = runProjection(next);
      const f = computeFire(next, proj);
      const atRet = proj.years.find((y) => y.age === next.retirementTargetAge);
      return { scenario: s, fire: f, projection: proj, atRet };
    });
  }, [selected, profile]);

  const baseAtRet = baseProj.years.find((y) => y.age === profile.retirementTargetAge);

  const addOrSelectTemplate = async (tplId: string) => {
    const tpl = SCENARIO_TEMPLATES.find((t) => t.id === tplId);
    if (!tpl) return;
    const existing = scenarios.find((s) => s.templateId === tplId);
    if (existing) {
      trySelectScenario(existing.id);
      return;
    }
    const s = createScenarioFromTemplate(tpl, profile);
    await upsert(s);
    trySelectScenario(s.id);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Scenarios</CardTitle>
          <p className="text-xs text-muted-foreground">
            Each preset can only be saved once. Configure amounts and timing after adding. Scenarios layer on your base profile.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {SCENARIO_TEMPLATES.map((tpl) => {
              const saved = scenarios.some((s) => s.templateId === tpl.id);
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => void addOrSelectTemplate(tpl.id)}
                  className={`text-left rounded-md border p-3 transition-colors ${
                    saved
                      ? "border-primary/60 bg-secondary/30"
                      : "hover:border-primary hover:bg-secondary/40"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ background: tpl.defaultColour }}
                    />
                    <div className="font-medium text-sm">{tpl.name}</div>
                    {saved && (
                      <span className="text-[10px] text-muted-foreground ml-auto">Saved</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">{tpl.description}</div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Saved scenarios</CardTitle>
          <p className="text-xs text-muted-foreground">
            Tick up to 3 to overlay on the wealth chart. Use the pencil to change amounts, ramp, or which property to sell.
          </p>
        </CardHeader>
        <CardContent>
          {scenarios.length === 0 ? (
            <p className="text-sm text-muted-foreground">No saved scenarios yet — add one from the grid above.</p>
          ) : (
            <ul className="space-y-2">
              {scenarios.map((s) => {
                const isSelected = selectedIds.includes(s.id);
                const cfg = s.templateId && scenarioTemplateConfigurable(s.templateId);
                const sub = summarizeScenario(s);
                return (
                  <li
                    key={s.id}
                    className="flex items-start gap-3 rounded-md border p-3"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleScenario(s.id)}
                      className="h-4 w-4 accent-primary mt-0.5"
                    />
                    <span
                      className="h-3 w-3 rounded-full shrink-0 mt-1"
                      style={{ background: s.colour }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{s.name}</div>
                      {sub && (
                        <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
                      )}
                    </div>
                    {cfg && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={() => setEditing({ ...s, params: { ...s.params } })}
                        aria-label="Configure scenario"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => {
                        removeScenarioFromSelection(s.id);
                        void remove(s.id);
                      }}
                      aria-label="Delete scenario"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {editing && (
        <ScenarioParamsEditor
          scenario={editing}
          profile={profile}
          onClose={() => setEditing(null)}
          onSave={async (params) => {
            const next = { ...editing, params };
            await upsert(next);
            setEditing(null);
          }}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Wealth journey with scenario overlays</CardTitle>
        </CardHeader>
        <CardContent>
          <WealthJourney
            profile={profile}
            projection={baseProj}
            scenarios={selected}
            height={360}
          />
        </CardContent>
      </Card>

      {selected.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Comparison</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Metric</th>
                  <th className="text-right py-2 font-medium">Base</th>
                  {compareRows.map((r) => (
                    <th
                      key={r.scenario.id}
                      className="text-right py-2 font-medium"
                    >
                      <span
                        className="inline-block h-2 w-2 rounded-full mr-1.5 align-middle"
                        style={{ background: r.scenario.colour }}
                      />
                      {r.scenario.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <DeltaRow
                  label="Net worth at retirement"
                  base={baseAtRet?.totalNetWorth ?? 0}
                  values={compareRows.map((r) => r.atRet?.totalNetWorth ?? 0)}
                />
                <DeltaRow
                  label="State pension (annual at retirement)"
                  base={baseAtRet?.statePensionIncome ?? 0}
                  values={compareRows.map((r) => r.atRet?.statePensionIncome ?? 0)}
                />
                <DeltaRow
                  label="FIRE age"
                  base={baseFire.fireAge ?? 0}
                  values={compareRows.map((r) => r.fire.fireAge ?? 0)}
                  ageMode
                />
                <DeltaRow
                  label="FIRE number"
                  base={baseFire.fireNumber}
                  values={compareRows.map((r) => r.fire.fireNumber)}
                />
                <DeltaRow
                  label="Pension at retirement"
                  base={baseAtRet?.pensionValue ?? 0}
                  values={compareRows.map((r) => r.atRet?.pensionValue ?? 0)}
                />
                <DeltaRow
                  label="Investable at retirement"
                  base={baseAtRet?.investableNetWorth ?? 0}
                  values={compareRows.map((r) => r.atRet?.investableNetWorth ?? 0)}
                />
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ScenarioParamsEditor({
  scenario,
  profile,
  onClose,
  onSave,
}: {
  scenario: Scenario;
  profile: UserProfile;
  onClose: () => void;
  onSave: (p: ScenarioParams) => void | Promise<void>;
}) {
  const tid = scenario.templateId ?? "";
  const [params, setParams] = useState<ScenarioParams>(() => ({
    ...defaultParamsForTemplate(tid, profile),
    ...scenario.params,
  }));

  const maxPropertySales = 1 + profile.btlProperties.length;

  const updateSale = (idx: number, patch: Partial<PropertySaleParam>) => {
    const list = [...(params.propertySales ?? [])];
    list[idx] = { ...list[idx], ...patch } as PropertySaleParam;
    setParams((p) => ({ ...p, propertySales: list }));
  };

  const addSale = () => {
    const list = params.propertySales ?? [];
    if (list.length >= maxPropertySales) return;
    const hasPrimary = list.some((s) => s.kind === "primary");
    const usedBtl = new Set(
      list.filter((s) => s.kind === "btl").map((s) => s.btlIndex ?? 0),
    );
    if (!hasPrimary && profile.primaryValue > 0) {
      setParams((p) => ({
        ...p,
        propertySales: [...list, { kind: "primary", replacementCost: 0 }],
      }));
      return;
    }
    const freeBtl = Array.from(
      { length: profile.btlProperties.length },
      (_, i) => i,
    ).find((i) => !usedBtl.has(i));
    if (freeBtl === undefined) return;
    setParams((p) => ({
      ...p,
      propertySales: [...list, { kind: "btl", btlIndex: freeBtl }],
    }));
  };

  const removeSale = (idx: number) => {
    const list = [...(params.propertySales ?? [])];
    list.splice(idx, 1);
    setParams((p) => ({ ...p, propertySales: list }));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
      role="dialog"
      aria-modal
      aria-labelledby="scenario-editor-title"
    >
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-lg">
        <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
          <CardTitle id="scenario-editor-title" className="text-base">
            Configure: {scenario.name}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {tid === "boost_pension" && (
            <BoostFields
              label="SIPP monthly change"
              value={params.pensionBoost}
              onChange={(pensionBoost) => setParams((x) => ({ ...x, pensionBoost }))}
            />
          )}
          {tid === "boost_isa" && (
            <BoostFields
              label="S&S ISA monthly change"
              value={params.isaBoost}
              onChange={(isaBoost) => setParams((x) => ({ ...x, isaBoost }))}
            />
          )}
          {tid === "overpay_mortgage" && (
            <BoostFields
              label="Extra mortgage overpayment (interest-only)"
              value={params.mortgageOverpay}
              onChange={(mortgageOverpay) => setParams((x) => ({ ...x, mortgageOverpay }))}
            />
          )}
          {(tid === "sell_property" || tid === "reduce_btl") && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Sales apply in one step at the start of the projection. Net cash = equity minus replacement cost (primary only). BTL rows use your current labels.
              </p>
              {(params.propertySales ?? []).map((sale, idx) => (
                <div key={idx} className="rounded-md border p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Field label="Property" className="flex-1">
                      <Select
                        value={sale.kind === "primary" ? "primary" : `btl_${sale.btlIndex ?? 0}`}
                        onValueChange={(v) => {
                          if (v === "primary") {
                            updateSale(idx, { kind: "primary", replacementCost: sale.replacementCost ?? 0 });
                          } else {
                            const n = Number(v.replace("btl_", ""));
                            updateSale(idx, { kind: "btl", btlIndex: n });
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="primary">Primary residence</SelectItem>
                          {profile.btlProperties.map((p, i) => (
                            <SelectItem key={p.id} value={`btl_${i}`}>
                              BTL: {p.label?.trim() || `Property ${i + 1}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSale(idx)}
                      aria-label="Remove sale"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {sale.kind === "primary" && (
                    <Field label="Replacement home cost (£)" hint="Cash needed after sale; net proceeds = equity minus this.">
                      <NumberInput
                        prefix="£"
                        value={sale.replacementCost ?? 0}
                        onChange={(n) => updateSale(idx, { replacementCost: n })}
                      />
                    </Field>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSale}
                disabled={(params.propertySales?.length ?? 0) >= maxPropertySales}
              >
                <Plus className="h-4 w-4" /> Add sale
              </Button>
            </div>
          )}
          {tid === "inheritance" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Amount">
                <NumberInput
                  prefix="£"
                  value={params.inheritanceAmount ?? 50_000}
                  onChange={(n) =>
                    setParams((p) => ({ ...p, inheritanceAmount: n }))
                  }
                />
              </Field>
              <Field label="Years from now">
                <NumberInput
                  value={params.inheritanceYearsFromNow ?? 5}
                  onChange={(n) =>
                    setParams((p) => ({
                      ...p,
                      inheritanceYearsFromNow: Math.max(0, Math.round(n)),
                    }))
                  }
                  min={0}
                  max={80}
                />
              </Field>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                void onSave(params);
              }}
            >
              Save
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BoostFields({
  label,
  value,
  onChange,
}: {
  label: string;
  value: MonthlyBoostParams | undefined;
  onChange: (v: MonthlyBoostParams) => void;
}) {
  const b = value ?? { monthlyExtra: 200, mode: "flat" as const, rampYears: 5 };
  return (
    <div className="space-y-3">
      <Field label={`${label} (£/month)`}>
        <NumberInput
          prefix="£"
          suffix="/mo"
          value={b.monthlyExtra}
          onChange={(n) => onChange({ ...b, monthlyExtra: n })}
        />
      </Field>
      <Field label="Pattern">
        <Select
          value={b.mode}
          onValueChange={(v) =>
            onChange({ ...b, mode: v as "flat" | "ramp" })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="flat">Same every year</SelectItem>
            <SelectItem value="ramp">Linear ramp (0 → full over N years)</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      {b.mode === "ramp" && (
        <Field label="Ramp length (years)" hint="Monthly change phases linearly from 0 to the amount above.">
          <NumberInput
            value={b.rampYears}
            onChange={(n) => onChange({ ...b, rampYears: Math.max(1, Math.round(n)) })}
            min={1}
            max={40}
          />
        </Field>
      )}
    </div>
  );
}

function DeltaRow({
  label,
  base,
  values,
  ageMode,
}: {
  label: string;
  base: number;
  values: number[];
  ageMode?: boolean;
}) {
  const fmt = (v: number) => (ageMode ? (v ? `Age ${v}` : "—") : gbp(v));
  return (
    <tr className="border-b last:border-b-0">
      <td className="py-2 text-muted-foreground">{label}</td>
      <td className="py-2 text-right tabular-nums">{fmt(base)}</td>
      {values.map((v, i) => {
        const delta = v - base;
        const positive = ageMode ? delta < 0 : delta >= 0;
        return (
          <td key={i} className="py-2 text-right tabular-nums">
            <div>{fmt(v)}</div>
            <div
              className={`text-xs ${
                Math.abs(delta) < 0.5
                  ? "text-muted-foreground"
                  : positive
                    ? "text-success"
                    : "text-destructive"
              }`}
            >
              {Math.abs(delta) < 0.5
                ? "—"
                : `${delta > 0 ? "+" : ""}${ageMode ? delta : gbp(delta)}`}
            </div>
          </td>
        );
      })}
    </tr>
  );
}
