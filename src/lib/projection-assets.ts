/** Keys aligned with WealthJourney stacked areas and projection rows. */
export const PROJECTION_ASSET_LAYERS = [
  { key: "pensionValue" as const, label: "Pension" },
  { key: "isaValue" as const, label: "S&S ISA" },
  { key: "cashIsaValue" as const, label: "Cash ISA" },
  { key: "lisaValue" as const, label: "LISA" },
  { key: "giaValue" as const, label: "GIA" },
  { key: "cashValue" as const, label: "Cash" },
  { key: "primaryEquity" as const, label: "Primary equity" },
  { key: "btlEquity" as const, label: "BTL equity" },
];

export type ProjectionAssetKey = (typeof PROJECTION_ASSET_LAYERS)[number]["key"];
