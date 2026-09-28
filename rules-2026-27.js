/* Finally Entitled 2026-27 core rules
   Validated against Services Australia / DSS official material current 20 Sep 2026.
   Dollar estimates deliberately exclude supplements/interactions not collected by the UI.
*/
const FE_RULES={
  asAt:"2026-09-20",
  ftbA:{free:69131,higher:123078,maxYoung:235.48,maxOlder:306.46,base:75.60},
  ftbB:{primaryLimit:124327,secondaryFree:7154,maxYoung:200.34,maxOlder:139.86,secondaryTaper:.20},
  ccs:{fullIncome:88520,zeroIncome:538520,fullPct:90,stepIncome:5000},
  rent:{
    incomeSupport:{
      single:{threshold:157.80,maxRent:456.20,max:223.80},
      couple:{threshold:255.80,maxRent:537.14,max:211.00}
    },
    ftb:{
      single12:{threshold:207.34,maxRent:558.09,max:263.06},
      single3:{threshold:207.34,maxRent:603.82,max:297.36},
      couple12:{threshold:306.60,maxRent:657.35,max:263.06},
      couple3:{threshold:306.60,maxRent:703.08,max:297.36}
    }
  },
  assets:{single:{home:333000,nonhome:600000},couple:{home:499000,nonhome:766000}},
  parenting:{
    singleMax:1068.20, // $1,037.50 + $30.70 pension supplement
    partneredMax:755.10,
    singleFree1:232.60,extraChild:24.60,singleTaper:.40,
    partnerFree:1440,ownFree:150,ownSecond:256
  },
  jobseeker:{
    singleNoChild:824.90,singleChild:883.30,partnered:755.10,
    ownFree:150,ownSecond:256,partnerFree:1440
  },
  lihcc:{single:826,couple:1410,singleOneChild:1410,coupleOneChild:1444,extraChild:34}
};
function feRound2(n){return Math.max(0,Math.round((n+Number.EPSILON)*100)/100)}
function feCCS(income){
  if(income<=FE_RULES.ccs.fullIncome)return 90;
  if(income>=FE_RULES.ccs.zeroIncome)return 0;
  return Math.max(0,90-Math.floor((income-FE_RULES.ccs.fullIncome)/5000));
}
function feFTBA(children,income){
  const eligible=children.filter(k=>k.age!==null&&(k.age<=15||(k.age<=19&&k.secondary)));
  if(!eligible.length)return null;
  const maxFn=eligible.reduce((s,k)=>s+(k.age<=12?FE_RULES.ftbA.maxYoung:FE_RULES.ftbA.maxOlder),0);
  const baseFn=eligible.length*FE_RULES.ftbA.base;
  const maxAnnual=maxFn*26, baseAnnual=baseFn*26;
  let annual;
  if(income<=FE_RULES.ftbA.free) annual=maxAnnual;
  else if(income<=FE_RULES.ftbA.higher) annual=Math.max(baseAnnual,maxAnnual-.20*(income-FE_RULES.ftbA.free));
  else {
    // Above the higher threshold, continue from the rate reached at $123,078,
    // then apply the published 30c-per-$1 taper. For smaller families the
    // first test has already reached the base rate; for larger families it
    // can still be above base at the higher threshold.
    const atHigher=Math.max(baseAnnual,maxAnnual-.20*(FE_RULES.ftbA.higher-FE_RULES.ftbA.free));
    annual=Math.max(0,atHigher-.30*(income-FE_RULES.ftbA.higher));
  }
  return {fortnight:feRound2(annual/26),maxFortnight:feRound2(maxFn),baseFortnight:feRound2(baseFn),children:eligible.length};
}
function feFTBB(children,rel,ownAnnual,partnerAnnual){
  const eligible=children.filter(k=>k.age!==null&&(k.age<=15||(k.age<=18&&k.secondary)));
  if(!eligible.length)return null;
  const youngest=Math.min(...eligible.map(k=>k.age));
  const max=youngest<=4?FE_RULES.ftbB.maxYoung:FE_RULES.ftbB.maxOlder;
  if(rel==='single') return ownAnnual<=FE_RULES.ftbB.primaryLimit?{fortnight:max,reason:"single"}:{fortnight:0,reason:"income"};
  if(rel!=='couple'||youngest>=13)return {fortnight:0,reason:"age"};
  const primary=Math.max(ownAnnual,partnerAnnual), secondary=Math.min(ownAnnual,partnerAnnual);
  if(primary>FE_RULES.ftbB.primaryLimit)return {fortnight:0,reason:"primary"};
  return {fortnight:feRound2(max-Math.max(0,secondary-FE_RULES.ftbB.secondaryFree)*FE_RULES.ftbB.secondaryTaper/26),reason:"couple"};
}
function feRent(key,weeklyRent){
  const r=FE_RULES.rent.ftb[key]||FE_RULES.rent.incomeSupport[key];
  if(!r)return null;
  const rentFn=weeklyRent*2;
  return {fortnight:feRound2(Math.min(r.max,Math.max(0,(rentFn-r.threshold)*.75))),threshold:r.threshold,max:r.max};
}
function feAssetPass(rel,homeowner,assets){
  const group=rel==='couple'?'couple':'single', k=homeowner==='yes'?'home':'nonhome';
  return assets<=FE_RULES.assets[group][k];
}
function feJobseeker(rel,hasDepChild,ownAnnual,partnerAnnual){
  const own=ownAnnual/26, partner=partnerAnnual/26;
  let max=rel==='couple'?FE_RULES.jobseeker.partnered:(hasDepChild?FE_RULES.jobseeker.singleChild:FE_RULES.jobseeker.singleNoChild);
  let reduction=0;
  if(rel==='single'&&hasDepChild) reduction=Math.max(0,own-150)*.40;
  else {
    reduction+=Math.max(0,Math.min(own,256)-150)*.50;
    reduction+=Math.max(0,own-256)*.60;
    if(rel==='couple') reduction+=Math.max(0,partner-1440)*.60;
  }
  return feRound2(max-reduction);
}
function feParenting(rel,childCount,ownAnnual,partnerAnnual){
  const own=ownAnnual/26, partner=partnerAnnual/26;
  if(rel==='single'){
    const free=232.60+Math.max(0,childCount-1)*24.60;
    return feRound2(FE_RULES.parenting.singleMax-Math.max(0,own-free)*.40);
  }
  let red=Math.max(0,Math.min(own,256)-150)*.50+Math.max(0,own-256)*.60+Math.max(0,partner-1440)*.60;
  return feRound2(FE_RULES.parenting.partneredMax-red);
}
