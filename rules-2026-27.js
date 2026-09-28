// Finally Entitled — structured entitlement rules, 2026–27
// Batch 2: FTB A, FTB B, CCS, Parenting Payment, JobSeeker and selected Rent Assistance.
// Values are source-backed. Unsupported circumstances return null rather than being guessed.
window.FE_RULES = {
  schemaVersion: 2,
  financialYear: "2026-27",
  verifiedOn: "2026-09-28",
  disclaimer: "Pre-application estimate only. Services Australia makes the final eligibility and rate decision.",

  ftbA: {
    maximumRateIncomeThreshold: 69131,
    secondIncomeThreshold: 123078,
    firstTaperPerDollar: 0.20,
    secondTaperPerDollar: 0.30,
    baseRatePerChildFortnight: 75.60,
    maxRatePerChildFortnight: { age0to12: 235.48, age13to15: 306.46, age16to19SecondaryStudent: 306.46 },
    supplementIncomeLimit: 80000,
    supplementMaxPerChild2026_27: 970.90
  },

  ftbB: {
    primaryEarnerAnnualLimit: 124327,
    secondaryEarnerFreeAreaAnnual: 7154,
    secondaryEarnerTaperPerDollar: 0.20,
    secondaryEarnerCutoffYoungestUnder5: 35661,
    secondaryEarnerCutoffYoungest5to13: 27777,
    maxRatePerFamilyFortnight: { youngest0to4: 200.34, youngest5to18: 139.86 },
    supplementMaxPerFamily2026_27: 478.15,
    partneredYoungestChildMustBeUnder: 13,
    singleYoungestChildMax: 18,
    parentalLeavePayExclusion: true
  },

  ccs: {
    standard: { incomeAt90PercentOrBelow: 88520, zeroPercentAtOrAbove: 538520, startingPercent: 90, incomeStep: 5000, percentagePointDropPerStep: 1 }
  },

  parentingPayment: {
    maxFortnightly: { single: 1037.50, singlePensionSupplement: 30.70, partnered: 755.10, partneredSeparatedDueToIllnessRespiteOrPrison: 883.30 },
    singleIncome: {
      freeAreaByChildren: { "1": 232.60, "2": 257.20, "3": 281.80 },
      extraChildFreeArea: 24.60,
      taperPerDollar: 0.40,
      baseCutoffOneChild: 2950.60,
      cutoffIncreasePerExtraChild: 24.60
    },
    partneredIncome: {
      ownFreeArea: 150,
      ownSecondThreshold: 256,
      ownFirstTaper: 0.50,
      ownSecondTaper: 0.60,
      partnerFreeArea: 1440,
      partnerTaper: 0.60
    },
    assets: {
      singleHomeowner: 333000, singleNonHomeowner: 600000,
      coupleHomeownerCombined: 499000, coupleNonHomeownerCombined: 766000
    }
  },

  jobSeeker: {
    maxFortnightly: {
      singleNoChildren: 824.90, singleWithDependentChildren: 883.30,
      single55PlusAfter9Months: 883.30, partnered: 755.10,
      singlePrincipalCarerExempt: 1068.20
    },
    income: {
      freeArea: 150, secondThreshold: 256, firstTaper: 0.50, secondTaper: 0.60,
      principalCarerTaper: 0.40,
      cutoffs: {
        singleNoChildren: 1557.17, single55PlusAfter9Months: 1667.34,
        singlePartialCapacityUnder15Hours: 1667.34, singlePrincipalCarer: 2399.50,
        singlePrincipalCarerExempt: 2868.00, singleDependentChildNotPrincipalCarer: 1655.67
      }
    },
    assets: {
      singleHomeowner: 333000, singleNonHomeowner: 600000,
      coupleHomeownerCombined: 499000, coupleNonHomeownerCombined: 766000
    }
  },

  rentAssistance: {
    incomeSupportSingle: { rentThresholdFortnight: 157.80, rentForMaximumFortnight: 456.20, maxFortnight: 223.80, centsPerDollarAboveThreshold: 0.75 },
    incomeSupportSingleSharer: { rentThresholdFortnight: 157.80, rentForMaximumFortnight: 356.74, maxFortnight: 149.20, centsPerDollarAboveThreshold: 0.75 }
  }
};

window.FE_CALCULATORS = {
  ccsStandardPercentage(income) {
    const r=window.FE_RULES.ccs.standard, x=Number(income);
    if(!Number.isFinite(x)||x<0) return null;
    if(x<=r.incomeAt90PercentOrBelow) return 90;
    if(x>=r.zeroPercentAtOrAbove) return 0;
    return Math.max(0,90-Math.floor((x-r.incomeAt90PercentOrBelow)/r.incomeStep));
  },

  ftbAMaximumChildRate(age, secondaryStudent=false) {
    const r=window.FE_RULES.ftbA.maxRatePerChildFortnight, a=Number(age);
    if(!Number.isFinite(a)||a<0) return null;
    if(a<=12) return r.age0to12;
    if(a<=15) return r.age13to15;
    if(a<=19&&secondaryStudent) return r.age16to19SecondaryStudent;
    return 0;
  },

  ftbAIncomeTestBand(income) {
    const x=Number(income), r=window.FE_RULES.ftbA;
    if(!Number.isFinite(x)||x<0) return null;
    if(x<=r.maximumRateIncomeThreshold) return "maximum-rate-income-band";
    if(x<=r.secondIncomeThreshold) return "first-taper-band";
    return "second-taper-band";
  },

  ftbBEstimate({single=false, primaryIncome=0, secondaryIncome=0, youngestAge, receivingPLP=false}={}) {
    const r=window.FE_RULES.ftbB, age=Number(youngestAge), p=Number(primaryIncome), s=Number(secondaryIncome);
    if([age,p,s].some(x=>!Number.isFinite(x)||x<0)) return null;
    if(receivingPLP) return {eligible:false, fortnightly:0, reason:"Parental Leave Pay period"};
    if(single) {
      if(age>18 || p>r.primaryEarnerAnnualLimit) return {eligible:false, fortnightly:0};
      return {eligible:true, fortnightly: age<=4?r.maxRatePerFamilyFortnight.youngest0to4:r.maxRatePerFamilyFortnight.youngest5to18};
    }
    if(age>=r.partneredYoungestChildMustBeUnder || p>r.primaryEarnerAnnualLimit) return {eligible:false, fortnightly:0};
    const max=age<=4?r.maxRatePerFamilyFortnight.youngest0to4:r.maxRatePerFamilyFortnight.youngest5to18;
    const annualReduction=Math.max(0,s-r.secondaryEarnerFreeAreaAnnual)*r.secondaryEarnerTaperPerDollar;
    const fortnightly=Math.max(0,max-annualReduction/26);
    return {eligible:fortnightly>0, fortnightly:Math.round(fortnightly*100)/100};
  },

  parentingSingleIncomeFreeArea(children) {
    const n=Math.floor(Number(children)), r=window.FE_RULES.parentingPayment.singleIncome;
    if(!Number.isFinite(n)||n<1) return null;
    if(n<=3) return r.freeAreaByChildren[String(n)];
    return r.freeAreaByChildren["3"]+(n-3)*r.extraChildFreeArea;
  },

  rentAssistanceSingle(rentFortnight, sharer=false) {
    const x=Number(rentFortnight);
    if(!Number.isFinite(x)||x<0) return null;
    const r=sharer?window.FE_RULES.rentAssistance.incomeSupportSingleSharer:window.FE_RULES.rentAssistance.incomeSupportSingle;
    return Math.round(Math.min(r.maxFortnight,Math.max(0,(x-r.rentThresholdFortnight)*r.centsPerDollarAboveThreshold))*100)/100;
  }
};
