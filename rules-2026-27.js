// Finally Entitled — structured entitlement rules
// 2026–27 baseline. Source-backed values only; calculators must not invent missing rules.
window.FE_RULES = {
  schemaVersion: 1,
  financialYear: "2026-27",
  verifiedOn: "2026-09-28",
  disclaimer: "Pre-application estimate only. Services Australia makes the final eligibility and rate decision.",
  sources: {
    paymentsGuide: "https://www.servicesaustralia.gov.au/guide-to-australian-government-payments?context=22",
    ftbARates: "https://www.servicesaustralia.gov.au/family-tax-benefit-part-payment-rates?context=22151",
    ftbAIncome: "https://www.servicesaustralia.gov.au/income-test-for-family-tax-benefit-part?context=22151",
    ccsIncome: "https://www.servicesaustralia.gov.au/your-income-can-affect-child-care-subsidy?context=41186"
  },
  ftbA: {
    maximumRateIncomeThreshold: 69131,
    secondIncomeThreshold: 123078,
    firstTaperPerDollar: 0.20,
    secondTaperPerDollar: 0.30,
    baseRatePerChildFortnight: 75.60,
    maxRatePerChildFortnight: {
      age0to12: 235.48,
      age13to15: 306.46,
      age16to19SecondaryStudent: 306.46
    },
    supplementIncomeLimit: 80000,
    supplementMaxPerChild2026_27: 970.90,
    notes: [
      "Actual FTB Part A can also be affected by child support/maintenance, shared care, residence, immunisation and other circumstances.",
      "Do not infer a nil-payment cutoff from the simple taper alone; family composition and additional components can change the limit."
    ]
  },
  ccs: {
    standard: {
      incomeAt90PercentOrBelow: 88520,
      zeroPercentAtOrAbove: 538520,
      startingPercent: 90,
      incomeStep: 5000,
      percentagePointDropPerStep: 1
    },
    notes: [
      "The CCS percentage applies to the hourly fee or applicable hourly rate cap, whichever is lower.",
      "Higher CCS may apply for eligible families with more than one child aged 5 or younger.",
      "Activity, eligibility, hourly caps and care details must be handled separately."
    ]
  }
};

window.FE_CALCULATORS = {
  ccsStandardPercentage(familyIncome) {
    const r = window.FE_RULES.ccs.standard;
    const income = Number(familyIncome);
    if (!Number.isFinite(income) || income < 0) return null;
    if (income <= r.incomeAt90PercentOrBelow) return r.startingPercent;
    if (income >= r.zeroPercentAtOrAbove) return 0;
    // Services Australia describes a 1 percentage-point reduction for every $5,000 above the threshold.
    return Math.max(0, Math.min(90,
      r.startingPercent - Math.floor((income - r.incomeAt90PercentOrBelow) / r.incomeStep)
    ));
  },

  ftbAMaximumChildRate(age, secondaryStudent=false) {
    const r = window.FE_RULES.ftbA.maxRatePerChildFortnight;
    const a = Number(age);
    if (!Number.isFinite(a) || a < 0) return null;
    if (a <= 12) return r.age0to12;
    if (a <= 15) return r.age13to15;
    if (a <= 19 && secondaryStudent) return r.age16to19SecondaryStudent;
    return 0;
  },

  ftbAIncomeTestBand(familyIncome) {
    const income = Number(familyIncome);
    const r = window.FE_RULES.ftbA;
    if (!Number.isFinite(income) || income < 0) return null;
    if (income <= r.maximumRateIncomeThreshold) return "maximum-rate-income-band";
    if (income <= r.secondIncomeThreshold) return "first-taper-band";
    return "second-taper-band";
  }
};
