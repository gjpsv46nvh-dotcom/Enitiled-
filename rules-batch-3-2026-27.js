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
/* App compatibility helpers — financial screening only. */
const FE_EXT_RULES={
  asAt:'2026-09-20',
  pension:{singleMax:1237.70,coupleEachMax:933.00,coupleCombinedMax:1866.00,incomeFree:{single:226,coupleCombined:396},assetFull:{single:{home:333000,nonhome:600000},couple:{home:499000,nonhome:766000}},assetCutoff:{single:{home:745750,nonhome:1012750},couple:{home:1121000,nonhome:1388000}}},
  carerAllowance:{fortnight:162.60,familyAtiLimit:250000,noAssetsTest:true},
  parentalLeave:{daily:200.94,week5:1004.70,familyDaysFrom20260701:130,individualAti202526:186487,familyAti202526:386525},
  newborn:{upfront:708,firstSupplementMax:2125.76,subsequentSupplementMax:709.80,weeks:13},
  stillborn:{from20260701:4482.12},
  cshc:{singleAnnual:105048,coupleAnnual:168076,coupleIllnessAnnual:210096,perChildAnnual:639.60,noAssetsTest:true}
};
function fePensionIncomeEstimate(rel,ownAnnual,partnerAnnual,maxOverride){
  const p=FE_EXT_RULES.pension, combined=(Number(ownAnnual)+(rel==='couple'?Number(partnerAnnual):0))/26;
  const max=maxOverride || (rel==='couple'?p.coupleEachMax:p.singleMax), free=rel==='couple'?p.incomeFree.coupleCombined:p.incomeFree.single, taper=rel==='couple'?.25:.50;
  return feRound2(max-Math.max(0,combined-free)*taper);
}
function fePensionAssetScreen(rel,homeowner,assets){
  const g=rel==='couple'?'couple':'single',k=homeowner==='yes'?'home':'nonhome',p=FE_EXT_RULES.pension,x=Number(assets)||0;
  if(x<=p.assetFull[g][k]) return {band:'full',limit:p.assetFull[g][k]};
  if(x<=p.assetCutoff[g][k]) return {band:'part',limit:p.assetCutoff[g][k]};
  return {band:'over',limit:p.assetCutoff[g][k]};
}
function fePensionAssetEstimate(rel,homeowner,assets,maxOverride){
  const g=rel==='couple'?'couple':'single',k=homeowner==='yes'?'home':'nonhome',p=FE_EXT_RULES.pension,x=Math.max(0,Number(assets)||0);
  const max=maxOverride || (rel==='couple'?p.coupleEachMax:p.singleMax), full=p.assetFull[g][k], cutoff=p.assetCutoff[g][k];
  if(x>cutoff) return 0;
  // Standard pension assets test: $3/fn per $1,000 above the threshold for singles;
  // $1.50/fn for each member of a couple. Partial $1,000 increments count proportionally.
  const reduction=Math.max(0,x-full)/1000*(rel==='couple'?1.5:3);
  return feRound2(Math.max(0,max-reduction));
}
function fePensionFinancialEstimate(rel,homeowner,assets,ownAnnual,partnerAnnual,maxOverride){
  const incomeRate=fePensionIncomeEstimate(rel,ownAnnual,partnerAnnual,maxOverride);
  const assetRate=fePensionAssetEstimate(rel,homeowner,assets,maxOverride);
  return {incomeRate,assetRate,fortnight:feRound2(Math.max(0,Math.min(incomeRate,assetRate))),limitingTest:assetRate<incomeRate?'assets':(incomeRate<assetRate?'income':'neither')};
}
function feCarerAllowanceScreen(householdAti){return {incomePass:Number(householdAti)<FE_EXT_RULES.carerAllowance.familyAtiLimit,fortnight:FE_EXT_RULES.carerAllowance.fortnight};}
function feCSHCScreen(rel,householdAti,children=0){const b=rel==='couple'?FE_EXT_RULES.cshc.coupleAnnual:FE_EXT_RULES.cshc.singleAnnual,limit=b+Math.max(0,Number(children)||0)*FE_EXT_RULES.cshc.perChildAnnual;return {incomePass:Number(householdAti)<limit,limit};}
function fePLPIncomeScreen(individualAti,familyAti){const r=FE_EXT_RULES.parentalLeave;return {individualPass:Number(individualAti)<=r.individualAti202526,familyPass:Number(familyAti)<=r.familyAti202526,pass:Number(individualAti)<=r.individualAti202526||Number(familyAti)<=r.familyAti202526};}
function fePLPGross(days){return feRound2(Math.max(0,Math.min(FE_EXT_RULES.parentalLeave.familyDaysFrom20260701,Number(days)||0))*FE_EXT_RULES.parentalLeave.daily);}
