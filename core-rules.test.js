const fs = require("fs");
const vm = require("vm");
global.window = {};
vm.runInThisContext(fs.readFileSync("rules-2026-27.js", "utf8"));
const R = window.FE_RULES, C = window.FE_CALCULATORS;
function eq(actual, expected, label) {
  if (actual !== expected) throw new Error(`${label}: expected ${expected}, got ${actual}`);
}
eq(R.financialYear, "2026-27", "financial year");
eq(R.ftbA.maximumRateIncomeThreshold, 69131, "FTB A threshold 1");
eq(R.ftbA.secondIncomeThreshold, 123078, "FTB A threshold 2");
eq(R.ftbA.firstTaperPerDollar, .20, "FTB A taper 1");
eq(R.ftbA.secondTaperPerDollar, .30, "FTB A taper 2");
eq(R.ftbA.baseRatePerChildFortnight, 75.60, "FTB A base rate");
eq(C.ftbAMaximumChildRate(6), 235.48, "FTB A child 0-12");
eq(C.ftbAMaximumChildRate(14), 306.46, "FTB A child 13-15");
eq(C.ftbAMaximumChildRate(17, true), 306.46, "FTB A secondary student");
eq(C.ftbAMaximumChildRate(17, false), 0, "FTB A non-student 17");
eq(C.ftbAIncomeTestBand(69131), "maximum-rate-income-band", "FTB A band max");
eq(C.ftbAIncomeTestBand(69132), "first-taper-band", "FTB A band taper 1");
eq(C.ftbAIncomeTestBand(123079), "second-taper-band", "FTB A band taper 2");
eq(C.ccsStandardPercentage(0), 90, "CCS low income");
eq(C.ccsStandardPercentage(88520), 90, "CCS threshold");
eq(C.ccsStandardPercentage(93520), 89, "CCS first full $5k step");
eq(C.ccsStandardPercentage(538520), 0, "CCS zero threshold");
console.log("✓ Structured 2026–27 entitlement rule tests passed");
