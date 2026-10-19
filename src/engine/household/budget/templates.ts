export interface BudgetTemplate {
  id: string;
  label: string;
  essential: boolean;
  /** Typical annual £ hint for empty rows (user can change). */
  hintAnnual?: number;
}

export const BUDGET_TEMPLATES: BudgetTemplate[] = [
  { id: "utilities", label: "Utilities (gas, electric, water)", essential: true, hintAnnual: 2400 },
  { id: "council_tax", label: "Council tax", essential: true, hintAnnual: 2200 },
  { id: "broadband", label: "Broadband", essential: true, hintAnnual: 480 },
  { id: "mobile", label: "Mobile phones", essential: true, hintAnnual: 600 },
  { id: "groceries", label: "Groceries", essential: true, hintAnnual: 6000 },
  { id: "insurance", label: "Home & contents insurance", essential: true, hintAnnual: 400 },
  { id: "car", label: "Car (finance, fuel, tax, insurance)", essential: true, hintAnnual: 4500 },
  { id: "clothing", label: "Clothing", essential: false, hintAnnual: 1200 },
  { id: "gym", label: "Gym / fitness", essential: false, hintAnnual: 600 },
  { id: "eating_out", label: "Eating out & takeaways", essential: false, hintAnnual: 2400 },
  { id: "subscriptions", label: "Subscriptions & streaming", essential: false, hintAnnual: 480 },
  { id: "childcare", label: "Childcare / nursery", essential: true, hintAnnual: 12000 },
  { id: "school", label: "School costs (uniform, trips)", essential: true, hintAnnual: 800 },
  { id: "activities", label: "Children's clubs & activities", essential: false, hintAnnual: 600 },
];

export function templateById(id: string): BudgetTemplate | undefined {
  return BUDGET_TEMPLATES.find((t) => t.id === id);
}
