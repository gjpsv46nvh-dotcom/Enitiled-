// Finally Entitled — 2026–27 structured rules, Batch 3
// Load AFTER rules-2026-27.js. Adds pension/carer/new-parent rules without overwriting prior batches.
(function () {
  const R = window.FE_RULES = window.FE_RULES || {};
  const C = window.FE_CALCULATORS = window.FE_CALCULATORS || {};

  R.agePension = {
    effectiveFrom:"2026-09-20",
    maxFortnightly:{
      single:{basic:1135.40,pensionSupplement:88.20,energySupplement:14.10,total:1237.70},
      coupleEach:{basic:855.90,pensionSupplement:66.50,energySupplement:10.60,total:933.00},
      coupleCombined:{basic:1711.80,pensionSupplement:133.00,energySupplement:21.20,total:1866.00}
    },
    assets:{
      fullRate:{singleHomeowner:333000,singleNonHomeowner:600000,coupleHomeownerCombined:499000,coupleNonHomeownerCombined:766000},
      partPensionCutoff:{singleHomeowner:745750,singleNonHomeowner:1012750,coupleHomeownerCombined:1121000,coupleNonHomeownerCombined:1388000}
    }
  };

  R.dsp = {
    effectiveFrom:"2026-09-20",
    age21PlusMaxFortnightly:{
      single:{basic:1135.40,pensionSupplement:88.20,energySupplement:14.10,total:1237.70},
      coupleEach:{basic:855.90,pensionSupplement:65.50,energySupplement:10.60,total:933.00},
      coupleCombined:{basic:1711.80,pensionSupplement:131.00,energySupplement:21.20,total:1866.00}
    },
    incomeCutoffFortnightly:{single21Plus:2701.40,coupleLivingTogetherCombined:4128.00,coupleIllHealthCombined:5346.80},
    under21NoChildrenMaxFortnightly:{
      under18Dependent:581.50,under18Independent:839.80,age18to20Dependent:645.00,age18to20Independent:839.80,coupleUnder21:839.80
    }
  };

  R.carerPayment = {
    effectiveFrom:"2026-09-20",
    maxFortnightly:{
      single:{basic:1135.40,pensionSupplement:88.20,energySupplement:14.10,total:1237.70},
      coupleEach:{basic:855.90,pensionSupplement:66.50,energySupplement:10.60,total:933.00},
      coupleCombined:{basic:1711.80,pensionSupplement:133.00,energySupplement:21.20,total:1866.00}
    },
    income:{singleFreeAreaFortnight:226,singleTaperPerDollar:0.50,coupleCombinedFreeAreaFortnight:396,coupleEachTaperPerDollar:0.25,
      cutoff:{single:2701.40,coupleCombined:4128.00,coupleIllHealthCombined:5346.80}},
    assets:{partPensionCutoff:{singleHomeowner:745750,singleNonHomeowner:1012750,coupleHomeownerCombined:1121000,coupleNonHomeownerCombined:1388000}},
    careReceiver:{annualIncomeLimit:143752,assetLimit:886750}
  };

  R.parentalLeavePay = {
    financialYear:"2026-27",
    dailyBeforeTax:200.94,
    fiveDayWeekBeforeTax:1004.70,
    familyDaysIfBirthOrAdoptionFrom20260701:130,
    familyWeeksEquivalent:26,
    incomeTestUsing2025_26:{individualATI:186487,familyATI:386525},
    workTest:{monthsWorkedOfPrevious13:10,minimumHours:330,maximumGapWeeks:12},
    taxable:true
  };

  R.newborn = {
    upfrontPaymentPerChild:708.00,
    supplementMax13Weeks:{firstChild:2125.76,subsequentChild:709.80},
    requiresFTBPartA:true,
    cannotReceiveForSameChildWhileReceivingPLP:true
  };

  R.stillbornBabyPayment = {
    birthFrom:"2026-07-01",
    lumpSum:4482.12
  };

  C.parentalLeavePayIncomeTest = function(individualATI, familyATI) {
    const r=R.parentalLeavePay.incomeTestUsing2025_26;
    const i=Number(individualATI), f=Number(familyATI);
    if(!Number.isFinite(i)||i<0||!Number.isFinite(f)||f<0) return null;
    return {meetsIndividual:i<=r.individualATI,meetsFamily:f<=r.familyATI,passes:i<=r.individualATI||f<=r.familyATI};
  };

  C.parentalLeavePayGross = function(days) {
    const d=Number(days);
    if(!Number.isFinite(d)||d<0||d>R.parentalLeavePay.familyDaysIfBirthOrAdoptionFrom20260701) return null;
    return Math.round(d*R.parentalLeavePay.dailyBeforeTax*100)/100;
  };

  C.carerPaymentSingleIncomeReduction = function(incomeFortnight) {
    const x=Number(incomeFortnight), r=R.carerPayment.income;
    if(!Number.isFinite(x)||x<0) return null;
    return Math.round(Math.max(0,x-r.singleFreeAreaFortnight)*r.singleTaperPerDollar*100)/100;
  };

  C.pensionAssetBand = function({single=true,homeowner=true,assets=0}={}) {
    const x=Number(assets); if(!Number.isFinite(x)||x<0) return null;
    const a=R.agePension.assets;
    const full=single?(homeowner?a.fullRate.singleHomeowner:a.fullRate.singleNonHomeowner):(homeowner?a.fullRate.coupleHomeownerCombined:a.fullRate.coupleNonHomeownerCombined);
    const cutoff=single?(homeowner?a.partPensionCutoff.singleHomeowner:a.partPensionCutoff.singleNonHomeowner):(homeowner?a.partPensionCutoff.coupleHomeownerCombined:a.partPensionCutoff.coupleNonHomeownerCombined);
    return x<=full?"full-rate-assets-band":(x<=cutoff?"part-pension-assets-band":"over-standard-assets-cutoff");
  };
})();