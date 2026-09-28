/* Finally Entitled extended verified rules — 2026-27.
   Current 20 Sep 2026 unless a payment has a different statutory update cycle.
   These helpers SCREEN financial rules only; they do not replace qualification assessments.
*/
const FE_EXT_RULES={
  asAt:'2026-09-20',
  pension:{
    singleMax:1237.70,coupleEachMax:933.00,coupleCombinedMax:1866.00,
    incomeFree:{single:226,coupleCombined:396},
    assetFull:{single:{home:333000,nonhome:600000},couple:{home:499000,nonhome:766000}},
    assetCutoff:{single:{home:745750,nonhome:1012750},couple:{home:1121000,nonhome:1388000}}
  },
  dsp:{singleCutoff:2701.40,coupleCombinedCutoff:4128.00},
  carerPayment:{singleCutoff:2701.40,coupleCombinedCutoff:4128.00},
  carerAllowance:{fortnight:162.60,familyAtiLimit:250000,noAssetsTest:true},
  parentalLeave:{daily:200.94,week5:1004.70,familyDaysFrom20260701:130,individualAti202526:186487,familyAti202526:386525},
  newborn:{upfront:708,firstSupplementMax:2125.76,subsequentSupplementMax:709.80,weeks:13},
  stillborn:{from20260701:4482.12},
  cshc:{singleAnnual:105048,coupleAnnual:168076,coupleIllnessAnnual:210096,perChildAnnual:639.60,noAssetsTest:true},
  lihcc:{claimWeekly:{singleNoChild:826,coupleNoChild:1410,singleOneChild:1410,coupleOneChild:1444,extraChild:34}},
  pensionerConcession:{automatic:['age-pension','carer-payment','dsp','parenting-payment-single']}
};
function fePensionIncomeEstimate(rel,ownAnnual,partnerAnnual,maxOverride){
  const p=FE_EXT_RULES.pension, combined=(ownAnnual+(rel==='couple'?partnerAnnual:0))/26;
  const max=maxOverride || (rel==='couple'?p.coupleEachMax:p.singleMax);
  const free=rel==='couple'?p.incomeFree.coupleCombined:p.incomeFree.single;
  const taper=rel==='couple'?.25:.50;
  return feRound2(max-Math.max(0,combined-free)*taper);
}
function fePensionAssetScreen(rel,homeowner,assets){
  const g=rel==='couple'?'couple':'single',k=homeowner==='yes'?'home':'nonhome',p=FE_EXT_RULES.pension;
  if(assets<=p.assetFull[g][k]) return {band:'full',limit:p.assetFull[g][k]};
  if(assets<p.assetCutoff[g][k]) return {band:'part',limit:p.assetCutoff[g][k]};
  return {band:'over',limit:p.assetCutoff[g][k]};
}
function feCarerAllowanceScreen(householdAti){return {incomePass:householdAti<250000,fortnight:FE_EXT_RULES.carerAllowance.fortnight};}
function feCSHCScreen(rel,householdAti,children=0){const b=rel==='couple'?FE_EXT_RULES.cshc.coupleAnnual:FE_EXT_RULES.cshc.singleAnnual;const limit=b+Math.max(0,children)*FE_EXT_RULES.cshc.perChildAnnual;return {incomePass:householdAti<limit,limit};}
function fePLPIncomeScreen(individualAti,familyAti){return {individualPass:individualAti<=FE_EXT_RULES.parentalLeave.individualAti202526,familyPass:familyAti<=FE_EXT_RULES.parentalLeave.familyAti202526,pass:individualAti<=FE_EXT_RULES.parentalLeave.individualAti202526||familyAti<=FE_EXT_RULES.parentalLeave.familyAti202526};}
function fePLPGross(days){return feRound2(Math.max(0,Math.min(FE_EXT_RULES.parentalLeave.familyDaysFrom20260701,days))*FE_EXT_RULES.parentalLeave.daily);}
