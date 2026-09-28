const $=id=>document.getElementById(id), money=n=>new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD',maximumFractionDigits:0}).format(n||0);
function go(id){document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));$(id).classList.add('active');scrollTo({top:0,behavior:'smooth'})}
document.querySelectorAll('[data-go]').forEach(b=>b.onclick=(e)=>{e.preventDefault();go(b.dataset.go)});

let step=1, hasChildren=false, childrenAnswered=false, childSeq=0;
function showStep(n){step=n;document.querySelectorAll('.wizard-step').forEach(s=>s.classList.toggle('active-step',+s.dataset.step===n));$('progressFill').style.width=(n/3*100)+'%';$('progressText').textContent=`Step ${n} of 3`}
document.querySelectorAll('.nextStep').forEach(b=>b.onclick=()=>showStep(Math.min(3,step+1)));
document.querySelectorAll('.prevStep').forEach(b=>b.onclick=()=>showStep(Math.max(1,step-1)));
function syncHousing(){
 const renting=$('housing').value==='rent';
 $('rentWrap').style.display=renting?'flex':'none';
 if(!renting) $('rent').value=0;
}
$('housing').onchange=syncHousing;
function syncRelationship(){
 const coupled=$('relationship').value==='couple';
 $('partnerFields').style.display=coupled?'grid':'none';
 $('partner').closest('label').style.display=coupled?'flex':'none';
 refreshIncome();
}
$('relationship').onchange=syncRelationship;
document.querySelectorAll('[data-children]').forEach(b=>b.onclick=()=>{
 childrenAnswered=true; hasChildren=b.dataset.children==='yes';
 document.querySelectorAll('[data-children]').forEach(x=>x.classList.toggle('selected',x===b));
 $('childrenArea').style.display=hasChildren?'block':'none';
 if(hasChildren&&!document.querySelector('.child-card')) addChild();
 if(!hasChildren) $('childrenList').innerHTML='';
});
function addChild(){
 childSeq++; const d=document.createElement('div');d.className='child-card';d.innerHTML=`<div class="child-top"><h4>Child ${childSeq}</h4><button type="button" class="remove-child">Remove</button></div><div class="child-grid">
 <label>Date of birth<input class="childDob" type="date"></label>
 <label>In approved childcare?<select class="childCare"><option value="no">No</option><option value="yes">Yes</option></select></label>
 <label>In secondary school?<select class="secondary"><option value="no">No</option><option value="yes">Yes</option></select></label></div>`;
 d.querySelector('.remove-child').onclick=()=>d.remove();$('childrenList').appendChild(d)
}
$('addChild').onclick=addChild;

function age(d){if(!d)return null;let b=new Date(d+'T00:00:00'),t=new Date(),a=t.getFullYear()-b.getFullYear();if(t<new Date(t.getFullYear(),b.getMonth(),b.getDate()))a--;return a}
function kids(){return [...document.querySelectorAll('.child-card')].map(c=>({dob:c.querySelector('.childDob').value,age:age(c.querySelector('.childDob').value),childcare:c.querySelector('.childCare').value==='yes',secondary:c.querySelector('.secondary').value==='yes'}))}
function ownAnnualIncome(){const o=parseFloat($('annualOverride').value);return Number.isFinite(o)&&o>=0?o:(+$('rate').value||0)*(+$('hours').value||0)*52+(+$('extras').value||0)}
function baseIncome(){return ownAnnualIncome()+($('relationship').value==='couple'?(+$('partner').value||0):0)+(+$('otherIncome').value||0)}
function refreshIncome(){const t=baseIncome();$('householdTotal').textContent=money(t);$('incomeSlider').value=Math.min(600000,Math.round(t/100)*100);$('sliderValue').textContent=money(+$('incomeSlider').value)}
['rate','hours','extras','annualOverride','partner','otherIncome'].forEach(id=>$(id).addEventListener('input',refreshIncome));$('incomeSlider').oninput=()=>$('sliderValue').textContent=money(+$('incomeSlider').value);

function card(type,name,estimate,why,url){
 const labels={calculated:'CALCULATED ESTIMATE',conditional:'CONDITIONAL ESTIMATE',official:'OFFICIAL ASSESSMENT NEEDED',discovery:'MAY BE WORTH CHECKING'};
 return `<article class="result ${type}"><span class="tag">${labels[type]||labels.discovery}</span><h3>${name}</h3><div class="estimate">${estimate}</div><p>${why}</p>${url?`<a class="source-link" target="_blank" rel="noopener" href="${url}">Official government information →</a>`:''}</article>`
}
$('calculateBtn').onclick=()=>{
 if(!validateProfile()) return;
 const household=baseIncome(), own=ownAnnualIncome(), partner=$('relationship').value==='couple'?(+$('partner').value||0):0;
 const K=hasChildren?kids():[], rel=$('relationship').value, housing=$('housing').value, sit=$('situation').value;
 const assets=+$('assets').value||0, homeowner=$('homeowner').value, childCount=K.length;
 const depUnder16=K.some(k=>k.age!==null&&k.age<16);
 let r=[], x=[];
 let annualFamilyValue=0, annualIncomeSupportCandidates=[];

 const ftba=feFTBA(K,household);
 if(ftba){
   const wording=household<=FE_RULES.ftbA.free?'published maximum-rate income band':'published income-test formula';
   annualFamilyValue += Math.max(0,ftba.fortnight)*26;
   r.push(card('calculated','Family Tax Benefit Part A',`${money(ftba.fortnight)}/fortnight`,
    `Estimate from the ${wording}, child ages and 2026–27 standard rates. Excludes Rent Assistance, supplements, shared-care adjustments, maintenance income, immunisation/health-check reductions and newborn components.`,
    'https://www.servicesaustralia.gov.au/income-test-for-family-tax-benefit-part?context=22151'));
 }

 const ftbb=feFTBB(K,rel,own,partner);
 if(ftbb){
   if(ftbb.fortnight>0){ annualFamilyValue += Math.max(0,ftbb.fortnight)*26; r.push(card('calculated','Family Tax Benefit Part B',`${money(ftbb.fortnight)}/fortnight`,
      `Estimate using the youngest child’s age and the 2026–27 primary/secondary earner income test. It assumes no shared-care adjustment and no days receiving Parental Leave Pay.`,
      'https://www.servicesaustralia.gov.au/income-test-for-family-tax-benefit-part-b?context=22151')); }
   else x.push(card('discovery','Family Tax Benefit Part B','Current profile does not pass the basic income/age screen',
      'Other circumstances such as grandparent care can use different rules, so the official assessment may still be relevant.',
      'https://www.servicesaustralia.gov.au/family-tax-benefit-part-b'));
 }

 const cc=K.filter(k=>k.childcare&&k.age!==null&&k.age<=13&&!k.secondary);
 if(cc.length){
   const pct=feCCS(household);
   r.push(card('calculated','Child Care Subsidy',`${pct}% standard CCS percentage`,
     `This is the published standard income-based percentage. The dollar subsidy still depends on the lower of the service fee or hourly cap, subsidised hours, withholding and any higher-rate child rules.`,
     'https://www.servicesaustralia.gov.au/your-income-can-affect-child-care-subsidy?context=41186'));
 }

 const assetPass=homeowner?feAssetPass(rel,homeowner,assets):null;

 if(sit==='jobseeker'){
   const ageNow=age($('yourDob').value);
   if(ageNow!==null && ageNow>=22 && ageNow<67 && assetPass){
     if(rel==='single' || $('partnerSituation').value==='working' || $('partnerSituation').value==='notworking'){
       const amt=feJobseeker(rel,depUnder16,own,partner);
       if(amt>0) annualIncomeSupportCandidates.push(amt*26);
       r.push(card('calculated','JobSeeker Payment',`${money(amt)}/fortnight`,
         `Income-test estimate using your separate fortnightly income${rel==='couple'?' and a non-pension partner income test':''}. Working Credits, waiting periods, mutual obligations, Rent Assistance and other supplements are not included.`,
         'https://www.servicesaustralia.gov.au/income-test-for-jobseeker-payment?context=51411'));
     } else r.push(card('official','JobSeeker Payment','Official assessment needed','Your partner may receive a pension or another payment, which changes the income test.','https://www.servicesaustralia.gov.au/jobseeker-payment'));
   } else if(assetPass===false) r.push(card('official','JobSeeker Payment','Assets appear above the standard limit','The published standard assets test appears not to be met. Services Australia should confirm assessable assets and exemptions.','https://www.servicesaustralia.gov.au/income-and-assets-tests-for-jobseeker-payment?context=51411'));
   else r.push(card('official','JobSeeker Payment','Official assessment needed','Age, residence and other qualification rules must also be met.','https://www.servicesaustralia.gov.au/jobseeker-payment'));
 }

 const youngest=K.length?Math.min(...K.map(k=>k.age).filter(v=>v!==null)):null;
 const ppAgeOK=youngest!==null&&((rel==='single'&&youngest<14)||(rel==='couple'&&youngest<6));
 if(ppAgeOK){
   if(assetPass){
     if(rel==='single' || ['working','notworking'].includes($('partnerSituation').value)){
       const amt=feParenting(rel,K.length,own,partner);
       if(amt>0) annualIncomeSupportCandidates.push(amt*26);
       r.push(card('calculated','Parenting Payment',`${money(amt)}/fortnight`,
         `Income-test estimate using the current maximum rate and separate personal/partner income rules. Residence, principal-carer rules, waiting periods, partner-payment interactions and supplements may change the actual amount.`,
         'https://www.servicesaustralia.gov.au/income-and-assets-tests-for-parenting-payment?context=22196'));
     } else r.push(card('official','Parenting Payment','Official assessment needed','A partner receiving a pension, Youth Allowance or Austudy can change the income test.','https://www.servicesaustralia.gov.au/parenting-payment'));
   } else r.push(card('official','Parenting Payment','Assets appear above the standard limit','The standard assets test appears not to be met; assessable-asset exemptions still need official confirmation.','https://www.servicesaustralia.gov.au/income-and-assets-tests-for-parenting-payment?context=22196'));
 }

 if(housing==='rent'){
   const weekly=+$('rent').value||0;
   if(K.length && ftba && ftba.fortnight>ftba.baseFortnight){
     const key=`${rel==='couple'?'couple':'single'}${K.length>=3?'3':'12'}`, ra=feRent(key,weekly);
     r.push(card('conditional','Rent Assistance',`${money(ra.fortnight)}/fortnight`,
       `Rate estimate using your rent and family size. This applies only if you receive FTB Part A at more than the base rate and meet the accommodation rules.`,
       'https://www.servicesaustralia.gov.au/how-much-rent-assistance-you-can-get?context=22206'));
   } else if(['jobseeker','carer','disability','retired'].includes(sit)){
     const key=rel==='couple'?'couple':'single',ra=feRent(key,weekly);
     r.push(card('conditional','Rent Assistance',`${money(ra.fortnight)}/fortnight`,
       'Rate estimate if you receive an eligible income-support payment and meet the accommodation rules. Special sharer and under-25 rules are not modelled.',
       'https://www.servicesaustralia.gov.au/who-can-get-rent-assistance?context=22206'));
   } else r.push(card('official','Rent Assistance','Qualifying payment needed','Rent alone does not qualify someone. Rent Assistance is paid with specified eligible payments.','https://www.servicesaustralia.gov.au/who-can-get-rent-assistance?context=22206'));
 }

 if(sit==='carer'||$('careSomeone').value==='yes'){
   const ca=feCarerAllowanceScreen(household), pa=fePensionAssetScreen(rel,homeowner,assets), cp=fePensionIncomeEstimate(rel,own,partner);
   x.push(card('conditional','Carer Payment',pa.band==='over'?'Assets appear above the standard pension cut-off':`${money(cp)}/fortnight income-test screen`,
     pa.band==='over'?'Your entered assessable assets appear above the standard pension asset cut-off. Hardship provisions, exemptions and Rent Assistance can affect the official result.':`Financial screen only. The income test suggests up to this amount before the asset test and other interactions. Services Australia must still assess the care receiver and care requirements.`,
     'https://www.servicesaustralia.gov.au/carer-payment'));
   x.push(card('conditional','Carer Allowance',ca.incomePass?`${money(ca.fortnight)}/fortnight standard rate`:'Income test appears not met',
     ca.incomePass?'Your entered household income is below the $250,000 family adjusted-taxable-income limit. There is no assets test, but the care and medical rules still need official assessment.':'Your entered household income is at or above the $250,000 family adjusted-taxable-income limit. Services Australia uses adjusted taxable income and specified deeming rules.',
     'https://www.servicesaustralia.gov.au/carer-allowance'));
 }
 if(sit==='disability'||$('workDisability').value==='yes'){
   const pa=fePensionAssetScreen(rel,homeowner,assets), dsp=fePensionIncomeEstimate(rel,own,partner);
   x.push(card('conditional','Disability Support Pension',pa.band==='over'?'Assets appear above the standard pension cut-off':`${money(dsp)}/fortnight financial screen`,
     pa.band==='over'?'Your entered assets appear above the standard pension asset cut-off.':'Income/assets screening only. DSP also requires medical and non-medical qualification, including impairment and work-capacity assessment.',
     'https://www.servicesaustralia.gov.au/disability-support-pension'));
 }
 if(sit==='student') x.push(card('official','Student & apprentice support','More study details needed','Youth Allowance, Austudy and ABSTUDY use age, course, independence, parental/partner income and living-arrangement rules not collected in this short check. Search Support includes each pathway.','https://www.servicesaustralia.gov.au/students-and-trainees'));
 const userAge=age($('yourDob').value);
 if(userAge!==null&&userAge>=67){
   const pa=fePensionAssetScreen(rel,homeowner,assets), ap=fePensionIncomeEstimate(rel,own,partner), cshc=feCSHCScreen(rel,household,K.length);
   x.push(card('conditional','Age Pension',pa.band==='over'?'Assets appear above the standard pension cut-off':`${money(ap)}/fortnight income-test screen`,
     pa.band==='over'?'Your entered assets appear above the standard pension asset cut-off.':'Income/assets screen only. Deeming, Work Bonus, residence, asset exemptions and other pension rules can change the official rate.',
     'https://www.servicesaustralia.gov.au/age-pension'));
   x.push(card('conditional','Commonwealth Seniors Health Card',cshc.incomePass?`Income screen appears met (limit ${money(cshc.limit)}/year)`:`Income screen appears over ${money(cshc.limit)}/year`,
     'This card is generally for people of Age Pension age who are not receiving an income-support payment. The test uses adjusted taxable income plus specified deemed income and has no assets test.',
     'https://www.servicesaustralia.gov.au/commonwealth-seniors-health-card'));
 }

 // Low Income Health Care Card: annual income is not enough for a definitive result because the test uses the prior 8 weeks.
 let weekly=household/52, lihLimit;
 if(rel==='single') lihLimit=K.length?1410+(Math.max(0,K.length-1)*34):826;
 else lihLimit=K.length?1444+(Math.max(0,K.length-1)*34):1410;
 x.push(card('conditional','Low Income Health Care Card',`Claim threshold: under ${money(lihLimit)}/week`,
   `Your annualised household income is about ${money(weekly)}/week, but the actual claim test uses gross income from the 8 weeks before claiming and includes specified income types.`,
   'https://www.servicesaustralia.gov.au/income-test-for-low-income-health-care-card?context=21986'));

 if(['jobseeker'].includes(sit)) x.push(card('discovery','Health Care Card','Usually linked to a qualifying payment','If you qualify for certain Centrelink payments, a Health Care Card may be issued automatically. Exact card entitlement follows the qualifying payment and circumstances.','https://www.servicesaustralia.gov.au/health-care-card'));
 if((userAge!==null&&userAge>=67)||sit==='carer'||sit==='disability'||(rel==='single'&&ppAgeOK)) x.push(card('discovery','Pensioner Concession Card','May be issued automatically with a qualifying payment','Age Pension, Carer Payment, DSP and Parenting Payment single are among the payments that can automatically qualify a person for this card.','https://www.servicesaustralia.gov.au/pensioner-concession-card'));

 if(K.some(k=>k.age!==null&&k.age<1)){
   const plp=fePLPIncomeScreen(own,household);
   x.push(card('conditional','Parental Leave Pay',plp.pass?`${money(FE_EXT_RULES.parentalLeave.daily)}/day before tax · up to 130 family days for births from 1 Jul 2026`:'Income screen appears not met',
     plp.pass?'Income screen only. The work test, birth/adoption date, residency and day-sharing rules still need to be checked.':'Your entered income is above both the individual and family income screens used for 2026–27 claims; official assessment uses the relevant prior financial year.',
     'https://www.servicesaustralia.gov.au/parental-leave-pay'));
   x.push(card('official','Newborn Upfront Payment & Newborn Supplement',`${money(FE_EXT_RULES.newborn.upfront)} upfront; supplement may also apply`,
     'This can apply with FTB Part A when Parental Leave Pay is not being received for the same child. The supplement depends on whether this is the first eligible child and family circumstances.',
     'https://www.servicesaustralia.gov.au/newborn-upfront-payment-and-newborn-supplement'));
 }
 if(cc.length) x.push(card('official','Additional Child Care Subsidy','Circumstance-specific assessment','Higher assistance can apply for child wellbeing, grandparent care, hardship or transition to work.','https://www.servicesaustralia.gov.au/additional-child-care-subsidy'));

 const sc=profileStateCode(), stateNames={Tas:'Tasmania',Vic:'Victoria',NSW:'New South Wales',Qld:'Queensland',SA:'South Australia',WA:'Western Australia',ACT:'ACT',NT:'Northern Territory'};
 SUPPORT_CATALOGUE.filter(z=>z.c==='State support'&&z.loc===sc).forEach(z=>x.push(card('discovery',`${stateNames[sc]} support & concessions`,'State check recommended',z.s,z.u)));

 if(!r.length) r.push(card('official','No major payment calculated yet','More circumstances may be needed','No common payment could be safely calculated from the current answers. Search Support still checks broader Commonwealth, state and territory programs.'));
 const annualEstimatedValue=annualFamilyValue+(annualIncomeSupportCandidates.length?Math.max(...annualIncomeSupportCandidates):0);
 const annualSummary=$('annualValueSummary');
 if(annualEstimatedValue>0){
   $('annualValueAmount').textContent=`${money(annualEstimatedValue)} per year`;
   $('annualValueNote').textContent='Estimated from payments we can calculate from your answers. Conditional matches and “worth checking” items are not included. Payments that cannot be received together are not added together.';
   annualSummary.style.display='block';
 } else { annualSummary.style.display='none'; }
 $('results').innerHTML=r.join(''); $('extraResults').innerHTML=x.join(''); $('extraSection').style.display=x.length?'block':'none';
 $('matchSummary').textContent=`Using exact entered household income of ${money(household)} and ${K.length} child${K.length===1?'':'ren'} in your profile.`;
 $('incomeInsight').innerHTML=`<b>Accuracy mode:</b> the main check uses exact entered income, not the rounded scenario slider. Core rules validated to 20 September 2026.`;
 go('matches');
};

const STATE_CODE={'Tasmania':'Tas','Victoria':'Vic','New South Wales':'NSW','Queensland':'Qld','South Australia':'SA','Western Australia':'WA','Australian Capital Territory':'ACT','Northern Territory':'NT'};
const STATE_GRANT_HUBS={
 Tas:['Tasmanian grants & programs','Official Tasmanian Government programs and grant information.','https://www.service.tas.gov.au/services/government-help-and-support/grants-funding-and-scholarships'],
 Vic:['Victorian grants & programs','Official Victorian Government grants and programs.','https://www.vic.gov.au/grants-and-programs'],
 NSW:['NSW grants, rebates & savings','Official NSW Government grants, rebates and cost-of-living support.','https://www.nsw.gov.au/grants-and-funding'],
 Qld:['Queensland grants finder','Official Queensland Government grants and assistance.','https://www.qld.gov.au/community/grants-scholarships-awards'],
 SA:['South Australian grants','Official South Australian Government grants and assistance.','https://www.sa.gov.au/topics/care-and-support/grants'],
 WA:['Western Australian grants','Official WA Government grants and funding information.','https://www.wa.gov.au/service/community-services/grants-and-subsidies'],
 ACT:['ACT grants','Official ACT Government grant programs.','https://www.act.gov.au/community/grants'],
 NT:['Northern Territory grants','Official NT Government grants and funding.','https://nt.gov.au/community/grants-and-volunteers/grants']
};
const HOUSEHOLD_GRANTS=[
 {n:'Cheaper Home Batteries Program',loc:'ALL',tags:'Battery Solar',d:'Around a 30% upfront discount for eligible small-scale batteries connected to new or existing solar. Available to households, businesses and community organisations.',u:'https://www.dcceew.gov.au/energy/programs/cheaper-home-batteries'},
 {n:'Small-scale Renewable Energy Scheme',loc:'ALL',tags:'Solar Energy efficiency',d:'Reduces the upfront cost of eligible rooftop solar and other small-scale renewable systems through small-scale technology certificates.',u:'https://www.energy.gov.au/solar/financial-benefits-solar/government-rebates-and-loans-solar'},
 {n:'Household Energy Upgrades Fund',loc:'ALL',tags:'Solar Battery Energy efficiency Appliances Renovation',d:'Discounted finance through participating lenders for eligible household energy upgrades including solar, batteries, efficient appliances and renovations.',u:'https://www.dcceew.gov.au/energy/programs/household-energy-upgrades-fund'},
 {n:'Government energy rebates & assistance finder',loc:'ALL',tags:'Solar Battery Energy efficiency Appliances Cost of living',d:'The Australian Government live directory of Commonwealth, state and territory energy rebates and assistance.',u:'https://www.energy.gov.au/rebates'}
];
function grantCard(name,badge,desc,url){return card('discovery',name,badge,desc,url)}
$('householdGrantBtn').onclick=()=>{
 const state=STATE_CODE[$('grantState').value], topic=$('grantTopic').value, housing=$('grantHousing').value, concession=$('grantConcession').value;
 let out=HOUSEHOLD_GRANTS.filter(g=>g.loc==='ALL'||g.loc===state).filter(g=>topic==='all'||g.tags.toLowerCase().includes(topic.toLowerCase())).map(g=>grantCard(g.n,'Current official program',g.d,g.u));
 out.push(grantCard('Live Australian energy rebate finder','Live government catalogue',`Search current programs for ${$('grantState').value}, including location- and technology-specific rebates. Your profile: ${housing}${concession==='Yes'?', concession card holder':''}.`,'https://www.energy.gov.au/rebates'));
 const h=STATE_GRANT_HUBS[state]; if(h) out.push(grantCard(h[0],'State / territory catalogue',h[1],h[2]));
 $('householdGrantResults').innerHTML=out.join('');
};
$('grantBtn').onclick=()=>{
 const state=STATE_CODE[$('state').value],industry=$('industry').value||'your industry',funding=$('funding').value,emp=+$('employees').value,turn=+$('turnover').value,regional=$('regional').value;
 let out=[];
 out.push(grantCard('Australian Government Grants and Programs Finder','600+ opportunities listed',`Use the official national finder for a live search matching ${industry}, ${emp} employees, ${money(turn)} turnover${funding!=='all'?`, and ${funding.toLowerCase()} support`:''}.`,'https://business.gov.au/grants-and-programs'));
 if(funding==='all'||/energy|solar/i.test(funding)) out.push(grantCard('Energy rebates & assistance for business','Live government catalogue','Search current Commonwealth, state and territory energy programs for businesses, including solar, batteries and efficiency support.','https://www.energy.gov.au/rebates'));
 if(funding==='all'||/R&D|innovation/i.test(funding)) out.push(grantCard('R&D and innovation support','Official program search','Check current Australian Government innovation, commercialisation and research support through the Grants and Programs Finder.','https://business.gov.au/grants-and-programs'));
 if(funding==='all'||/Export/i.test(funding)) out.push(grantCard('Export support','Official program search','Check current export grants, market-development and Austrade support that match your business.','https://business.gov.au/grants-and-programs'));
 const h=STATE_GRANT_HUBS[state]; if(h) out.push(grantCard(h[0],'State / territory catalogue',`${h[1]} Regional/rural: ${regional}.`,h[2]));
 $('grantResults').innerHTML=out.join('');
};

const SUPPORT_CATALOGUE = [
 {n:"Family Tax Benefit",c:"Families",k:"family children kids child ftb tax benefit raising kids",s:"Help with the cost of raising children.",who:"Families caring for dependent children. Income, child age, care percentage and other family circumstances affect eligibility and rate.",amount:"Rates vary by child age, family income and circumstances.",need:"Family income estimate, child details and care arrangements.",apply:"Usually claimed through Centrelink/myGov.",u:"https://www.servicesaustralia.gov.au/family-tax-benefit"},
 {n:"Child Care Subsidy",c:"Families",k:"childcare day care child care ccs daycare",s:"Helps eligible families with the cost of approved child care.",who:"Families using approved child care who meet eligibility requirements.",amount:"The subsidy percentage depends mainly on family income, with other rules affecting subsidised hours and the amount paid.",need:"Family income, child details and approved child-care information.",apply:"Claim through Centrelink/myGov and confirm enrolment details.",u:"https://www.servicesaustralia.gov.au/child-care-subsidy"},
 {n:"Additional Child Care Subsidy",c:"Families",k:"extra childcare hardship grandparent transition work child wellbeing accs",s:"Extra child-care assistance for certain circumstances.",who:"May apply for child wellbeing, grandparent carers, temporary financial hardship or transition to work.",amount:"Higher assistance can apply depending on the ACCS category.",need:"Child-care details and evidence relevant to the applicable category.",apply:"Claim or assessment pathway depends on the ACCS category.",u:"https://www.servicesaustralia.gov.au/additional-child-care-subsidy"},
 {n:"Parenting Payment",c:"Families",k:"parent parenting young child mum dad single parent",s:"Income support for the main carer of a young child.",who:"Main carers who meet child-age, income, assets and other eligibility rules.",amount:"Fortnightly rates depend on whether you are single or partnered and your income.",need:"Income, assets, partner and child details.",apply:"Claim through Centrelink/myGov.",u:"https://www.servicesaustralia.gov.au/parenting-payment"},
 {n:"Parental Leave Pay",c:"Families",k:"baby newborn birth parental leave maternity paternity ppl",s:"Government-funded parental leave pay for eligible parents.",who:"Parents who meet work, income and other eligibility rules for a birth or adoption.",amount:"Paid for an eligible period at the applicable government rate.",need:"Work history, income, child/birth or adoption details.",apply:"Claim through Centrelink/myGov.",u:"https://www.servicesaustralia.gov.au/parental-leave-pay"},
 {n:"Newborn Upfront Payment and Newborn Supplement",c:"Families",k:"new baby newborn birth payment supplement",s:"Support for some families after a new baby joins the family.",who:"May apply where the family is eligible for FTB Part A and is not receiving Parental Leave Pay for that child.",amount:"Depends on family circumstances and eligibility.",need:"Newborn and family income details.",apply:"Usually assessed with Family Tax Benefit.",u:"https://www.servicesaustralia.gov.au/newborn-upfront-payment-and-newborn-supplement"},
 {n:"Stillborn Baby Payment",c:"Families",k:"stillborn stillbirth baby bereavement",s:"A payment for eligible families following a stillbirth.",who:"Eligibility depends on the circumstances and applicable income rules.",amount:"A lump-sum payment may apply.",need:"Relevant birth and family details.",apply:"Services Australia provides the claim pathway.",u:"https://www.servicesaustralia.gov.au/stillborn-baby-payment"},
 {n:"Double Orphan Pension",c:"Families",k:"orphan child care double orphan",s:"Help with the costs of caring for an eligible orphaned child.",who:"People caring for a child whose circumstances meet the Double Orphan Pension rules.",amount:"A fortnightly payment may apply.",need:"Child and caring-arrangement details.",apply:"Check the Services Australia claim process.",u:"https://www.servicesaustralia.gov.au/double-orphan-pension"},
 {n:"JobSeeker Payment",c:"Work",k:"job lost job unemployed unemployment looking work sick injured short term",s:"Income support while looking for work or when temporarily unable to do usual work or study.",who:"Generally people from age 22 to Age Pension age who meet income, assets and other rules.",amount:"Fortnightly rate depends on age, partner status, children and income.",need:"Income, assets, partner and work circumstances.",apply:"Claim through Centrelink/myGov.",u:"https://www.servicesaustralia.gov.au/jobseeker-payment"},
 {n:"Youth Allowance",c:"Study",k:"youth allowance young student apprentice job seeker study uni tafe",s:"Support for eligible young students, apprentices and job seekers.",who:"May apply to students/apprentices aged 24 or younger and job seekers aged 21 or younger, subject to rules.",amount:"Rates depend on age, living arrangements, independence and income tests.",need:"Study/work, living, parental/partner income and independence details.",apply:"Claim through Centrelink/myGov.",u:"https://www.servicesaustralia.gov.au/youth-allowance"},
 {n:"Austudy",c:"Study",k:"austudy study mature student apprentice uni tafe 25",s:"Income support for eligible students and Australian Apprentices aged 25 or older.",who:"Full-time students or Australian Apprentices who meet age, study, income and assets rules.",amount:"Fortnightly rate varies with circumstances.",need:"Course/apprenticeship, income, assets and partner details.",apply:"Claim through Centrelink/myGov.",u:"https://www.servicesaustralia.gov.au/austudy"},
 {n:"ABSTUDY",c:"Study",k:"abstudy aboriginal torres strait islander study apprentice education",s:"A group of payments and support for eligible Aboriginal and Torres Strait Islander students and apprentices.",who:"Eligibility varies by study, apprenticeship and personal circumstances.",amount:"Different ABSTUDY components have different rates and purposes.",need:"Study and personal circumstances.",apply:"Check the relevant ABSTUDY claim pathway.",u:"https://www.servicesaustralia.gov.au/abstudy"},
 {n:"Tertiary Access Payment",c:"Study",k:"tertiary access regional remote move university uni study relocation",s:"A one-off payment for eligible regional or remote students moving for tertiary study.",who:"Certain students moving from regional or remote areas for tertiary education.",amount:"One-off support; amount depends on eligibility rules.",need:"Home location, study and relocation details.",apply:"Claim through the applicable Services Australia process.",u:"https://www.servicesaustralia.gov.au/tertiary-access-payment"},
 {n:"Pensioner Education Supplement",c:"Study",k:"pension education supplement study pes",s:"Helps some payment recipients with study costs.",who:"People receiving certain eligible payments who undertake approved study.",amount:"A supplementary payment may apply.",need:"Current payment and course details.",apply:"Check eligibility and claim through Services Australia.",u:"https://www.servicesaustralia.gov.au/pensioner-education-supplement"},
 {n:"Student Start-up Loan",c:"Study",k:"student startup loan study uni loan",s:"A voluntary loan for eligible higher-education students receiving certain study payments.",who:"Eligible students receiving qualifying study payments.",amount:"Loan amounts and repayment rules apply.",need:"Study and payment details.",apply:"Apply through Services Australia if eligible.",u:"https://www.servicesaustralia.gov.au/student-start-up-loan"},
 {n:"Carer Payment",c:"Carers",k:"carer caring disability illness frail aged full time care",s:"Income support if you provide constant care to someone with disability, illness or who is frail aged.",who:"Carers meeting care, income, assets and other eligibility rules.",amount:"Fortnightly pension rates depend on relationship and means testing.",need:"Care needs, medical information, income and assets.",apply:"Claim through Centrelink/myGov.",u:"https://www.servicesaustralia.gov.au/carer-payment"},
 {n:"Carer Allowance",c:"Carers",k:"carer allowance caring child adult disability illness",s:"A supplementary payment for eligible people providing daily care.",who:"Carers whose care recipient meets the applicable disability/medical and care requirements.",amount:"A supplementary payment; different means-testing rules apply from Carer Payment.",need:"Care and medical information plus income details where required.",apply:"Claim through Centrelink/myGov.",u:"https://www.servicesaustralia.gov.au/carer-allowance"},
 {n:"Carer Supplement",c:"Carers",k:"carer supplement annual caring",s:"An annual supplement for eligible recipients of certain carer payments.",who:"Generally paid automatically to eligible recipients at the qualifying time.",amount:"Annual supplement amount depends on qualifying payments.",need:"Usually no separate claim if already eligible.",apply:"Generally automatic where eligibility is met.",u:"https://www.servicesaustralia.gov.au/carer-supplement"},
 {n:"Carer Adjustment Payment",c:"Carers",k:"carer adjustment child catastrophic event disability care",s:"A one-off payment for some families caring for a child after a catastrophic event.",who:"Families meeting specific care and financial-impact criteria.",amount:"A one-off payment may be available.",need:"Evidence of the event, care needs and family circumstances.",apply:"Special claim process applies.",u:"https://www.servicesaustralia.gov.au/carer-adjustment-payment"},
 {n:"Disability Support Pension",c:"Disability",k:"dsp disability pension permanent condition unable work health",s:"Income support for eligible people with a long-term condition that significantly limits work.",who:"Medical and non-medical eligibility rules apply, including impairment and work-capacity requirements.",amount:"Pension rate depends on age, relationship, income and assets.",need:"Medical evidence, work capacity, income and assets.",apply:"Claim through Centrelink/myGov.",u:"https://www.servicesaustralia.gov.au/disability-support-pension"},
 {n:"Mobility Allowance",c:"Disability",k:"mobility disability transport travel work study public transport",s:"Help with travel costs for some people with disability, illness or injury who cannot use public transport without substantial assistance.",who:"Work, study or job-search participation and disability-related rules apply.",amount:"A fortnightly allowance may apply.",need:"Disability, transport and participation details.",apply:"Claim through Services Australia.",u:"https://www.servicesaustralia.gov.au/mobility-allowance"},
 {n:"Essential Medical Equipment Payment",c:"Disability",k:"medical equipment electricity power heating cooling equipment health",s:"An annual payment to help with additional energy costs from eligible medical equipment or medically required heating/cooling.",who:"Concession-card and medical-equipment/condition requirements apply.",amount:"Annual assistance is available for eligible equipment or heating/cooling.",need:"Concession details and medical/equipment evidence.",apply:"Claim through Services Australia.",u:"https://www.servicesaustralia.gov.au/essential-medical-equipment-payment"},
 {n:"Age Pension",c:"Older Australians",k:"age pension retirement older senior 67",s:"Income support for eligible older Australians.",who:"People who have reached Age Pension age and meet residence, income and assets rules.",amount:"Pension rate depends on relationship, income and assets.",need:"Income, assets, partner and residence information.",apply:"Claim through Centrelink/myGov.",u:"https://www.servicesaustralia.gov.au/age-pension"},
 {n:"Commonwealth Seniors Health Card",c:"Concessions",k:"senior health card retirees older concession cshc",s:"A concession card for eligible people of Age Pension age who meet the income test but may not receive a pension.",who:"Age Pension age, residence and income rules apply.",amount:"Not a cash payment; provides access to concessions and cheaper medicines/health services in relevant circumstances.",need:"Income, age and residence details.",apply:"Claim through Centrelink/myGov.",u:"https://www.servicesaustralia.gov.au/commonwealth-seniors-health-card"},
 {n:"Low Income Health Care Card",c:"Concessions",k:"low income health care card concession cheap medicine medical",s:"A concession card for eligible people on a low income.",who:"Residence, age/independence and income-test rules apply.",amount:"Not a cash payment; can provide access to concessions.",need:"Recent income and residence details.",apply:"Claim through Centrelink/myGov.",u:"https://www.servicesaustralia.gov.au/low-income-health-care-card"},
 {n:"Pensioner Concession Card",c:"Concessions",k:"pensioner concession card cheap medicine transport rates",s:"A concession card generally linked to qualifying pension or payment status.",who:"Issued to recipients of certain pensions/payments and some other eligible groups.",amount:"Not a cash payment; concessions vary by service and state/territory.",need:"Usually linked to qualifying payment status.",apply:"Often issued automatically when eligible.",u:"https://www.servicesaustralia.gov.au/pensioner-concession-card"},
 {n:"Health Care Card",c:"Concessions",k:"health care card concession medicine payment",s:"A concession card linked to certain Centrelink payments and circumstances.",who:"Generally issued with qualifying payments or supplements.",amount:"Not a cash payment; concessions can include cheaper medicines and other benefits.",need:"Qualifying payment/circumstances.",apply:"Often issued automatically where eligible.",u:"https://www.servicesaustralia.gov.au/health-care-card"},
 {n:"Rent Assistance",c:"Housing & supplements",k:"rent rental housing board lodging help rent assistance",s:"Extra payment to help with rent for eligible people receiving certain payments.",who:"You generally need to receive an eligible payment and pay enough rent, board or lodging.",amount:"Rate depends on rent paid, family situation and applicable thresholds.",need:"Rent/board/lodging amount and qualifying payment details.",apply:"Usually assessed as part of an eligible Centrelink payment.",u:"https://www.servicesaustralia.gov.au/rent-assistance"},
 {n:"Remote Area Allowance",c:"Housing & supplements",k:"remote area allowance rural remote tax zone",s:"Extra help for some income-support recipients living in eligible remote areas.",who:"Requires an eligible income-support payment and residence in the relevant tax zone.",amount:"A supplementary fortnightly amount may apply.",need:"Address and qualifying payment details.",apply:"Usually linked to your main payment.",u:"https://www.servicesaustralia.gov.au/remote-area-allowance"},
 {n:"Pension Supplement",c:"Housing & supplements",k:"pension supplement bills utilities phone medicine",s:"Extra support included with certain pension payments to help with regular costs.",who:"Available with certain qualifying pensions and circumstances.",amount:"Amount depends on pension and circumstances.",need:"Usually tied to existing pension eligibility.",apply:"Generally paid with the qualifying pension.",u:"https://www.servicesaustralia.gov.au/pension-supplement"},
 {n:"Pharmaceutical Allowance",c:"Housing & supplements",k:"pharmaceutical medicine medication allowance prescriptions",s:"Help with medicine costs for some eligible payment recipients.",who:"Eligibility is linked to certain payments and circumstances.",amount:"A supplementary amount may be paid.",need:"Qualifying payment details.",apply:"Generally linked to the main payment.",u:"https://www.servicesaustralia.gov.au/pharmaceutical-allowance"},
 {n:"Telephone Allowance",c:"Housing & supplements",k:"telephone phone internet allowance bills",s:"Help with phone and internet costs for some eligible recipients.",who:"Eligibility depends on qualifying payment/card and service circumstances.",amount:"A quarterly allowance may apply.",need:"Qualifying payment/card and phone/internet details.",apply:"Check Services Australia eligibility.",u:"https://www.servicesaustralia.gov.au/telephone-allowance"},
 {n:"Youth Disability Supplement",c:"Housing & supplements",k:"youth disability supplement young dsp youth allowance",s:"Extra support for some young people with disability receiving an eligible payment.",who:"Linked to qualifying disability and payment circumstances.",amount:"A supplementary amount may be included with the main payment.",need:"Age, disability and qualifying payment details.",apply:"Usually assessed with the main payment.",u:"https://www.servicesaustralia.gov.au/youth-disability-supplement"},
 {n:"Crisis Payment",c:"Special circumstances",k:"crisis emergency domestic violence disaster prison humanitarian extreme circumstances",s:"A one-off payment for eligible people in certain severe or extreme circumstances.",who:"Specific crisis categories, timing and eligibility rules apply.",amount:"One-off assistance is based on the relevant rules.",need:"Evidence and details of the crisis circumstances.",apply:"Contact/claim quickly because time limits can apply.",u:"https://www.servicesaustralia.gov.au/crisis-payment"},
 {n:"Special Benefit",c:"Special circumstances",k:"special benefit hardship no other payment financial hardship",s:"Financial help for some people in severe financial hardship who cannot get another income-support payment.",who:"Strict eligibility, income/assets and hardship rules apply.",amount:"Rate depends on circumstances.",need:"Income, assets, residence/visa and hardship details.",apply:"Claim through Services Australia.",u:"https://www.servicesaustralia.gov.au/special-benefit"},
 {n:"Farm Household Allowance",c:"Work",k:"farm farmer farming rural hardship household allowance",s:"Support for eligible farming families experiencing financial hardship.",who:"Farmers and partners who meet farm, income, assets and other requirements.",amount:"Income support plus related assistance may apply.",need:"Farm, income, assets and business details.",apply:"Claim through Services Australia.",u:"https://www.servicesaustralia.gov.au/farm-household-allowance"},
 {n:"Assistance for Isolated Children Scheme",c:"Study",k:"isolated children remote school boarding distance education",s:"Help for families whose children cannot attend an appropriate government school locally because of location or special circumstances.",who:"Different allowances have different schooling and isolation requirements.",amount:"Various allowances may be available.",need:"Schooling, location and living arrangement details.",apply:"Claim through Services Australia.",u:"https://www.servicesaustralia.gov.au/assistance-for-isolated-children-scheme"},
{n:"Small-scale Renewable Energy Scheme (solar discount)",c:"Energy & solar",loc:"ALL",k:"solar panels rooftop pv stc certificate discount renewable energy home business",s:"Australian Government support that reduces the upfront cost of eligible rooftop solar and other small-scale renewable systems.",who:"Eligible households and businesses installing qualifying systems through the Small-scale Renewable Energy Scheme.",amount:"The value varies with system size, location, installation date and certificate market value; it is commonly reflected as an upfront discount.",need:"An eligible system and appropriately accredited installer/provider.",apply:"The discount is normally arranged through the solar retailer or installer.",u:"https://www.energy.gov.au/solar/financial-benefits-solar/government-rebates-and-loans-solar"},
 {n:"Cheaper Home Batteries Program",c:"Energy & solar",loc:"ALL",k:"solar battery batteries rebate discount storage cheaper home battery",s:"Australian Government support reducing the upfront cost of eligible small-scale batteries connected to solar.",who:"Eligible households and small businesses across Australia installing a qualifying battery connected to new or existing rooftop solar.",amount:"The program provides an upfront battery discount whose value depends on eligible battery capacity and current scheme settings.",need:"Eligible battery equipment and an appropriately accredited installation.",apply:"The discount is generally provided through the battery retailer or installer.",u:"https://www.energy.gov.au/rebates/cheaper-home-batteries-program"},
 {n:"Household Energy Upgrades Fund",c:"Energy & solar",loc:"ALL",k:"energy upgrade finance solar battery insulation windows appliances green loan",s:"Discounted finance for eligible household energy upgrades.",who:"Availability depends on participating lenders and their lending criteria.",amount:"Discounted finance products rather than a standard cash rebate.",need:"Eligible upgrade and participating lender requirements.",apply:"Access through participating lenders.",u:"https://www.energy.gov.au/rebates/household-energy-upgrades-fund"},
 {n:"SunSPOT solar and battery calculator",c:"Energy & solar",loc:"ALL",k:"solar calculator battery savings panels system size",s:"A free independent tool for estimating suitable rooftop solar and battery options.",who:"Households and businesses considering solar or battery storage.",amount:"Not a rebate; it estimates system size, costs and potential savings.",need:"Basic electricity-use and property information.",apply:"Use the free calculator online.",u:"https://www.energy.gov.au/rebates/sunspot-solar-and-battery-calculator"},
 {n:"Solar Homes – solar PV rebate",c:"Energy & solar",loc:"Vic",k:"victoria solar homes pv panels rebate loan",s:"Victorian support for eligible households installing rooftop solar.",who:"Eligible Victorian owner-occupiers and rental properties subject to Solar Homes requirements including current household-income rules.",amount:"Solar PV rebates of up to $1,400 are available under current program settings, with an equivalent interest-free loan option for eligible households.",need:"Property, household income, ownership/rental and approved-product/provider requirements.",apply:"Apply through Solar Victoria before installation as required by the program.",u:"https://www.solar.vic.gov.au/solar-panel-rebate"},
 {n:"Solar Homes – hot water rebate",c:"Energy & solar",loc:"Vic",k:"victoria hot water heat pump solar hot water rebate",s:"Victorian rebate for eligible efficient hot-water upgrades.",who:"Eligible Victorian households meeting Solar Homes property and income requirements.",amount:"Up to $1,400 for eligible locally made hot-water products or up to $1,000 for other eligible products under current settings.",need:"Eligible property, product and installer plus household eligibility.",apply:"Apply through Solar Victoria.",u:"https://www.solar.vic.gov.au/hot-water-rebate"},
 {n:"Victorian Energy Upgrades",c:"Energy & solar",loc:"Vic",k:"victoria energy upgrades veu discount appliances heating cooling hot water draught lighting",s:"Discounts on eligible energy-saving products and services for Victorian homes.",who:"Victorian households; specific activities have their own product and installation rules.",amount:"Discount varies by upgrade and provider.",need:"An eligible upgrade delivered through an accredited provider.",apply:"Contact an accredited Victorian Energy Upgrades provider.",u:"https://www.energy.gov.au/rebates/victorian-energy-upgrades-homes"},
 {n:"Home Energy Saver",c:"Energy & solar",loc:"NSW",k:"nsw solar battery home energy saver loan discount insulation hot water",s:"NSW help with upfront costs of household energy-saving upgrades.",who:"Current zero-interest loans target eligible homeowners/landlords within the program income limit; targeted discounts have separate lower-income or concession-card rules.",amount:"Current program settings include zero-interest loans up to $15,000, with targeted discounts up to $4,000 subject to availability and eligibility.",need:"Household income, property and upgrade details plus provider eligibility.",apply:"Apply through the NSW Home Energy Saver program/provider.",u:"https://www.energy.nsw.gov.au/households/grants-rebates/home-energy-saver"},
 {n:"NSW Virtual Power Plant incentive",c:"Energy & solar",loc:"NSW",k:"nsw vpp battery virtual power plant solar incentive",s:"An incentive for eligible NSW battery owners who connect their battery to a virtual power plant.",who:"People with an eligible battery, or installing one, who meet the VPP program requirements.",amount:"Incentive value depends on battery capacity and current certificate settings.",need:"Eligible battery and participating VPP/provider.",apply:"Access the incentive through an approved provider.",u:"https://www.energy.nsw.gov.au/households/grants-rebates/household-energy-saving-upgrades/virtual-power-plant-vpp-incentive"},
 {n:"Solar for Apartment Residents",c:"Energy & solar",loc:"NSW",k:"nsw apartment solar strata renters shared solar grant",s:"Co-funding for eligible NSW apartment buildings to install shared rooftop solar.",who:"Eligible owners corporations and authorised representatives of apartment or multi-unit buildings.",amount:"Grant support co-funds eligible shared solar installations; current round conditions and funding limits apply.",need:"Owners-corporation authority, building and project details.",apply:"Apply through NSW Climate and Energy Action while the relevant round is open.",u:"https://www.energy.nsw.gov.au/households/grants-rebates/solar-for-apartment-residents"},
 {n:"WA Residential Battery Scheme",c:"Energy & solar",loc:"WA",k:"wa western australia residential battery rebate loan solar battery",s:"Western Australian support for eligible households purchasing and installing a home battery.",who:"Eligible WA households meeting current scheme and equipment requirements.",amount:"A rebate and/or no-interest loan may be available under current scheme settings.",need:"Eligible battery/system, household and provider requirements.",apply:"Use the WA Residential Battery Scheme process.",u:"https://www.energy.gov.au/rebates/wa-residential-battery-scheme"},
 {n:"Distributed Energy Buyback Scheme",c:"Energy & solar",loc:"WA",k:"wa solar feed in tariff export battery debs buyback electricity",s:"Pays eligible WA customers for electricity exported to the grid from systems such as rooftop solar and batteries.",who:"Eligible customers and systems connected under the scheme.",amount:"Export payments vary by time and current tariff settings.",need:"Eligible system, meter and electricity account.",apply:"Check eligibility with the relevant WA electricity retailer/provider.",u:"https://www.energy.gov.au/rebates/distributed-energy-buyback-scheme"},
 {n:"Sustainable Household Scheme",c:"Energy & solar",loc:"ACT",k:"act solar battery loan electrification ev charger hot water insulation sustainable household",s:"ACT finance support for eligible household energy-efficiency and electrification upgrades.",who:"Eligible ACT households meeting scheme and finance requirements.",amount:"Current household loans range from $2,000 to $20,000 for eligible products; specific concession-card support can differ.",need:"Eligible household, product and finance requirements.",apply:"Apply through the ACT Sustainable Household Scheme.",u:"https://www.climatechoices.act.gov.au/policy-programs/sustainable-household-scheme"},
 {n:"Home Energy Support Program",c:"Energy & solar",loc:"ACT",k:"act concession solar rebate home energy support insulation electric appliances",s:"Extra ACT energy-upgrade help for eligible concession card holders.",who:"Eligible ACT concession card holders meeting program requirements.",amount:"Current support can include rebates up to $5,000 covering up to half the cost of eligible upgrades, with access to zero-interest finance under applicable settings.",need:"Eligible concession card, property and upgrade.",apply:"Apply through ACT Climate Choices.",u:"https://www.climatechoices.act.gov.au/policy-programs/home-energy-support-program"},
 {n:"Solar for Apartments Program",c:"Energy & solar",loc:"ACT",k:"act apartment solar strata grant loan",s:"Support for eligible ACT apartment complexes installing rooftop solar.",who:"Eligible apartment/owners-corporation projects meeting current program requirements.",amount:"Grant and zero-interest loan support may be available.",need:"Apartment project and owners-corporation details.",apply:"Check the current ACT Solar for Apartments round.",u:"https://www.energy.gov.au/rebates/act-solar-apartments-program"},
 {n:"South Australia Virtual Power Plant",c:"Energy & solar",loc:"SA",k:"sa south australia vpp solar battery virtual power plant concession",s:"A solar-and-battery virtual power plant offer for eligible South Australian households.",who:"Eligibility and offers depend on the SA VPP program and household circumstances.",amount:"Savings depend on energy use and the applicable electricity plan rather than a fixed universal rebate.",need:"Property, electricity and system eligibility.",apply:"Check the SA VPP program and compare the applicable energy offer.",u:"https://www.energymining.sa.gov.au/consumers/solar-and-batteries/south-australias-virtual-power-plant"},
 {n:"Solar for Multi Dwellings Grant Scheme",c:"Energy & solar",loc:"NT",k:"nt northern territory apartment multi dwelling solar grant",s:"Northern Territory support for solar infrastructure in eligible multi-dwelling properties.",who:"Eligible multi-dwelling projects meeting the current grant conditions.",amount:"Funding can cover up to 50% of eligible total solar installation costs under current program settings.",need:"Property/project eligibility and quotes.",apply:"Check the current NT grant process and availability.",u:"https://www.energy.gov.au/rebates/solar-multi-dwellings-grant-scheme"},
 {n:"Annual electricity concession",c:"Energy & solar",loc:"Tas",k:"tas tasmania electricity concession power bill energy discount pension health care card",s:"A daily electricity-bill discount for eligible Tasmanian concession customers.",who:"Eligible Tasmanian electricity customers holding qualifying concession status.",amount:"A daily concession is applied to eligible electricity accounts; the rate can change.",need:"Eligible concession status and electricity account details.",apply:"Apply through the relevant Tasmanian concession/electricity process.",u:"https://www.energy.gov.au/rebates/annual-electricity-concession-tas"},
 {n:"Your Energy Support",c:"Energy & solar",loc:"Tas",k:"tas tasmania energy support power bill hardship electricity efficiency",s:"Support for eligible Tasmanian customers to better manage energy use and bills.",who:"Eligible Tasmanian energy customers under the program criteria.",amount:"Support is tailored rather than a single universal cash payment.",need:"Electricity account and household circumstances.",apply:"Check the Your Energy Support program.",u:"https://www.energy.gov.au/rebates/your-energy-support"},
 {n:"Life support energy concessions",c:"Energy & solar",loc:"ALL",k:"life support medical equipment electricity concession power oxygen dialysis",s:"State and territory assistance can help eligible households with electricity costs for approved life-support or medical equipment.",who:"Eligibility varies by jurisdiction, concession status, equipment and medical certification.",amount:"Rebate/concession amounts vary by state or territory.",need:"Medical certification, eligible equipment and electricity-account details.",apply:"Search your state in Finally Entitled or the government energy rebate directory.",u:"https://www.energy.gov.au/rebates"},
 {n:"Government energy rebates & assistance finder",c:"Energy & solar",loc:"ALL",k:"energy rebate electricity gas solar battery hot water insulation appliance concession power bill all rebates",s:"Australian Government directory covering current federal, state, territory and participating local energy rebates and assistance.",who:"Programs range from broad household support to concession-card, location, property and technology-specific schemes.",amount:"Varies by program.",need:"Your state, household/business type and the kind of energy support you need.",apply:"Use the official energy.gov.au rebate finder for current program availability.",u:"https://www.energy.gov.au/rebates"},
{n:"Tasmania discounts and concessions",c:"State support",loc:"Tas",k:"state support tasmania tas concession electricity water rates transport rego registration ambulance health dental glasses school education seniors cost living",s:"Tasmanian concessions and discounts can reduce everyday costs for eligible households.",who:"Eligibility depends on the individual Tasmanian concession, card, payment, age or household circumstance.",amount:"Support varies by program and can include bill discounts, concessions and other assistance.",need:"Your concession-card/payment status and the service you need help with.",apply:"Use the Tasmanian Government concessions directory to check the relevant program.",u:"https://www.concessions.tas.gov.au/"},
 {n:"Victoria concessions and benefits",c:"State support",loc:"Vic",k:"state support victoria vic concession electricity gas water rates transport rego ambulance health dental glasses school education seniors cost living",s:"Victorian concessions can help eligible people with energy, water, transport, health and other living costs.",who:"Eligibility varies by concession card, payment and personal circumstances.",amount:"Discounts and rebates vary by program.",need:"Your card/payment status and household circumstances.",apply:"Use Victoria's official concessions and benefits information.",u:"https://services.dffh.vic.gov.au/concessions-and-benefits"},
 {n:"NSW rebates, concessions and support",c:"State support",loc:"NSW",k:"state support nsw new south wales concession electricity gas water rates transport rego toll health school seniors cost living rebate",s:"NSW offers rebates and support across household bills, transport and other living costs.",who:"Each NSW program has its own eligibility rules, often involving concession status, income, age or household circumstances.",amount:"Varies by rebate or concession.",need:"Your household circumstances and any eligible concession cards/payments.",apply:"Use the NSW Government rebates and support information to find the relevant program.",u:"https://www.nsw.gov.au/money-and-taxes/cost-of-living-hub"},
 {n:"Queensland concessions",c:"State support",loc:"Qld",k:"state support queensland qld concession electricity gas water rates transport rego health school seniors cost living",s:"Queensland concessions can reduce the cost of utilities, transport, health and other services for eligible people.",who:"Eligibility depends on the individual concession and qualifying circumstances.",amount:"Varies by concession.",need:"Your concession-card/payment status and household details.",apply:"Use the Queensland Government concessions directory.",u:"https://www.qld.gov.au/community/cost-of-living-support/concessions"},
 {n:"South Australia concessions",c:"State support",loc:"SA",k:"state support south australia sa concession energy water transport medical health cost living seniors disability",s:"South Australian concessions provide help with eligible household and living costs.",who:"Eligibility varies by concession, payment/card status and circumstances.",amount:"Varies by program.",need:"Your household, card/payment and service details.",apply:"Use the SA Government concessions information.",u:"https://www.sa.gov.au/topics/care-and-support/concessions"},
 {n:"Western Australia concessions",c:"State support",loc:"WA",k:"state support western australia wa concession electricity water rates transport rego seniors cost living health",s:"Western Australian concessions and rebates can help eligible households with a range of living costs.",who:"Eligibility varies by program and qualifying card/payment or circumstance.",amount:"Varies by concession or rebate.",need:"Your household and concession details.",apply:"Use the WA Government concessions directory.",u:"https://www.wa.gov.au/service/community-services/community-support/concessions"},
 {n:"ACT cost of living support",c:"State support",loc:"ACT",k:"state support act canberra concession electricity gas water rates transport rego health cost living",s:"ACT support includes concessions and rebates for eligible residents across essential household costs.",who:"Eligibility varies by concession, card/payment status and household circumstances.",amount:"Varies by program.",need:"Your household and concession details.",apply:"Use the ACT Government cost-of-living support information.",u:"https://www.act.gov.au/cost-of-living-support"},
 {n:"NT Pensioner and Carer Concession Scheme",c:"State support",loc:"NT",k:"state support nt northern territory pensioner carer concession electricity water travel transport vehicle glasses rates",s:"The Northern Territory concession scheme provides eligible pensioners and carers with help across selected living costs.",who:"Membership and benefit eligibility depend on NT scheme rules.",amount:"Benefits vary by service and entitlement.",need:"Age, residence, pension/carer and scheme details.",apply:"Check the NT Pensioner and Carer Concession Scheme.",u:"https://nt.gov.au/community/concessions-and-payments/nt-pensioner-and-carer-concession-scheme"}
];

let supportCategory="all";
function profileStateCode(){
 const m={'Tasmania':'Tas','Victoria':'Vic','New South Wales':'NSW','Queensland':'Qld','South Australia':'SA','Western Australia':'WA','Australian Capital Territory':'ACT','Northern Territory':'NT'};
 return m[$('personState').value]||'all';
}
function syncSupportStateFromProfile(){
 if($('supportState')){$('supportState').value=profileStateCode();renderSupport();}
}
$('personState').addEventListener('change',syncSupportStateFromProfile);

function norm(v){return (v||"").toLowerCase().replace(/[^a-z0-9 ]/g," ")}
function renderSupport(){
 const q=norm($('supportQuery').value);
 const words=q.split(/\s+/).filter(Boolean);
 const st=$('supportState').value;
 let rows=SUPPORT_CATALOGUE.filter(x=>{
   const cat=supportCategory==="all"||x.c===supportCategory;
   const place=st==="all"||!x.loc||x.loc==="ALL"||x.loc===st;
   const hay=norm(x.n+" "+x.c+" "+x.k+" "+x.s);
   return cat && place && (!words.length||words.some(w=>hay.includes(w)));
 }).sort((a,b)=>{
   if(!words.length) return 0;
   const score=x=>{const hay=norm(x.n+" "+x.c+" "+x.k+" "+x.s), name=norm(x.n); return (name.includes(q)?20:0)+words.filter(w=>name.includes(w)).length*5+words.filter(w=>hay.includes(w)).length;};
   return score(b)-score(a);
 });
 $('supportCount').textContent=`${rows.length} support option${rows.length===1?'':'s'} found`; $('supportDetail').innerHTML='';
 if(!rows.length){$('supportResults').innerHTML='<div class="empty-state"><b>No matching support found.</b><span>Try a simpler term such as rent, childcare, power bill, solar, study or carer.</span></div>';return;}
 $('supportResults').innerHTML=rows.length?rows.map((x,i)=>`<article class="support-item" data-support="${SUPPORT_CATALOGUE.indexOf(x)}"><span class="type">${x.c}${x.loc&&x.loc!=="ALL"?`<span class="state-pill">${x.loc}</span>`:""}</span><h3>${x.n}</h3><p>${x.s}</p><span class="read">Read simple guide →</span></article>`).join(''):`<div class="no-support"><h3>No exact match</h3><p>Try simpler words such as “rent”, “baby”, “study”, “carer” or “job”. The eligibility checker can also search based on your circumstances.</p></div>`;
 document.querySelectorAll('[data-support]').forEach(el=>el.onclick=()=>openSupport(+el.dataset.support));
}
function openSupport(i){
 const x=SUPPORT_CATALOGUE[i];
 $('supportDetail').innerHTML=`<article class="support-detail"><span class="eyebrow">${x.c}${x.loc&&x.loc!=="ALL"?` · ${x.loc}`:" · Australia-wide"}</span><h2>${x.n}</h2><p class="lead">${x.s}</p><div class="support-detail-grid"><div class="info-box"><h4>Who may qualify?</h4><p>${x.who}</p></div><div class="info-box"><h4>How much?</h4><p>${x.amount}</p></div><div class="info-box"><h4>What might I need?</h4><p>${x.need}</p></div><div class="info-box"><h4>How do I apply?</h4><p>${x.apply}</p></div></div><div class="support-note"><b>Pre-application guide:</b> Finally Entitled helps you understand what may apply before you claim. Government agencies make the final eligibility decision.</div><div class="official-bottom"><a class="primary" href="${x.u}" target="_blank" rel="noopener">Official information / apply →</a></div></article>`;
 $('supportDetail').scrollIntoView({behavior:'smooth',block:'start'});
}
$('supportQuery').addEventListener('input',renderSupport); $('supportState').addEventListener('change',renderSupport);
document.querySelectorAll('[data-search]').forEach(b=>b.onclick=()=>{if(b.dataset.search==='state support'){supportCategory='State support';$('supportQuery').value='';}else{$('supportQuery').value=b.dataset.search;supportCategory='all';}document.querySelectorAll('.cat').forEach(c=>c.classList.toggle('active',c.dataset.cat===supportCategory));renderSupport()});
document.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{supportCategory=b.dataset.cat;document.querySelectorAll('.cat').forEach(c=>c.classList.toggle('active',c===b));renderSupport()});
renderSupport();

refreshIncome();syncRelationship();syncHousing();showStep(1);syncSupportStateFromProfile();

// Government source status is handled independently by status.js.


function showFormNotice(msg){
 const n=$('formNotice'); n.textContent=msg; n.hidden=false;
 n.scrollIntoView({behavior:'smooth',block:'center'});
}
function clearFormNotice(){ $('formNotice').hidden=true; $('formNotice').textContent=''; }
function validateProfile(){
 clearFormNotice();
 if(!$('yourDob').value){showFormNotice('Please enter your date of birth so age-based support can be checked accurately.');return false;}
 if(!$('personState').value){showFormNotice('Please select your state or territory so local concessions and rebates can be checked.');return false;}
 if(!childrenAnswered){showFormNotice('Please tell us whether you have children.');return false;}
 if($('relationship').value==='couple' && !$('partnerDob').value){showFormNotice("Please enter your partner's date of birth.");return false;}
 const childDobs=hasChildren?[...document.querySelectorAll('.childDob')]:[];
 if(childDobs.some(x=>!x.value)){showFormNotice('Please add a date of birth for each child you have added, or remove an unused child row.');return false;}
 return true;
}

document.addEventListener('click',e=>{
 const b=e.target.closest('[data-go]');
 if(!b) return;
 const current=document.querySelector('.page.active');
 if(current && current.id==='personal' && (b.dataset.go==='income'||b.dataset.go==='matches') && !validateProfile()){
   e.preventDefault(); e.stopImmediatePropagation();
 }
},true);
$('relationship').addEventListener('change',()=>{$('partnerDob').required=$('relationship').value==='couple';});

function syncIncomeSliderToInputs(){
 const total=Math.max(0,Math.round(Number(($('householdTotal').textContent||'0').replace(/[^0-9.]/g,''))||0));
 if(total<=Number($('incomeSlider').max)){ $('incomeSlider').value=total; $('sliderValue').textContent=money(total); }
}
['rate','hours','partner'].forEach(id=>$(id).addEventListener('change',()=>setTimeout(syncIncomeSliderToInputs,0)));
