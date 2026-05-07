#!/usr/bin/env node
/**
 * CI guard: fails (exit 1) if the codebase has no tax-year pack covering
 * today's UK tax year. Used by `.github/workflows/tax-year-check.yml` to
 * open a reminder issue every April once the new tax year starts.
 *
 * Reads `src/engine/constants/taxYears/index.ts` as text and extracts the
 * registered pack labels. Avoids needing a TS build step in CI.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function ukTaxYearLabel(date = new Date()) {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  const startYear = m > 4 || (m === 4 && d >= 6) ? y : y - 1;
  const endYY = String((startYear + 1) % 100).padStart(2, "0");
  return `${startYear}/${endYY}`;
}

function readRegisteredPackLabels() {
  const indexPath = resolve(root, "src/engine/constants/taxYears/index.ts");
  const indexSrc = readFileSync(indexPath, "utf8");
  const importRegex = /^import\s+\{\s*(TAX_YEAR_\d{4}_\d{2})\s*\}\s+from\s+["']\.\/(\d{4}-\d{2})["'];?$/gm;
  const labels = [];
  let match;
  while ((match = importRegex.exec(indexSrc)) !== null) {
    const fileStem = match[2]; // "2024-25"
    const startYear = fileStem.split("-")[0];
    const endYY = fileStem.split("-")[1];
    labels.push(`${startYear}/${endYY}`);
  }
  return labels;
}

const today = new Date();
const todayLabel = ukTaxYearLabel(today);
const registered = readRegisteredPackLabels();

console.log(`Today is ${today.toISOString().slice(0, 10)} (UK tax year ${todayLabel}).`);
console.log(`Registered packs: ${registered.join(", ") || "(none)"}`);

if (!registered.includes(todayLabel)) {
  console.error("");
  console.error(`::error::No tax-year pack registered for ${todayLabel}.`);
  console.error("To fix:");
  console.error(`  1. Verify figures from gov.uk Annex A "rates and allowances"`);
  console.error(`     and gov.scot Scottish Income Tax factsheet for ${todayLabel}.`);
  console.error(`  2. Create src/engine/constants/taxYears/${todayLabel.replace("/", "-").replace("/", "")}.ts`);
  console.error(`  3. Register it in src/engine/constants/taxYears/index.ts.`);
  process.exit(1);
}

console.log(`OK — pack for ${todayLabel} is registered.`);
