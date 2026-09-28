const $=id=>document.getElementById(id), money=n=>new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD',maximumFractionDigits:0}).format(n||0);
function go(id){document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));$(id).classList.add('active');scrollTo({top:0,behavior:'smooth'})}
document.querySelectorAll('[data-go]').forEach(b=>b.onclick=(e)=>{e.preventDefault();go(b.dataset.go)});

let step=1, hasChildren=true, childSeq=0;
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
document.querySelectorAll('[data-children]').forEach(b=>b.onclick=()=>{hasChildren=b.dataset.children==='yes';document.querySelectorAll('[data-children]').forEach(x=>x.classList.toggle('selected',x===b));$('childrenArea').style.display=hasChildren?'block':'none';if(hasChildren&&!document.querySelector('.child-card')) addChild()});
function addChild(){
 childSeq++; const d=document.createElement('div');d.className='child-card';d.innerHTML=`<div class="child-top"><h4>Child ${childSeq}</h4><button type="button" class="remove-child">Remove</button></div><div class="child-grid">
 <label>Date of birth<input class="childDob" type="date" value="2022-01-01"></label>
 <label>In approved childcare?<select class="childCare"><option value="no">No</option><option value="yes">Yes</option></select></label>
 <label>In secondary school?<select class="secondary"><option value="no">No</option><option value="yes">Yes</option></select></label></div>`;
 d.querySelector('.remove-child').onclick=()=>d.remove();$('childrenList').appendChild(d)
}
$('addChild').onclick=addChild; addChild();

function age(d){if(!d)return null;let b=new Date(d+'T00:00:00'),t=new Date(),a=t.getFullYear()-b.getFullYear();if(t<new Date(t.getFullYear(),b.getMonth(),b.getDate()))a--;return a}
function kids(){return [...document.querySelectorAll('.child-card')].map(c=>({age:age(c.querySelector('.childDob').value),childcare:c.querySelector('.childCare').value==='yes',secondary:c.querySelector('.secondary').value==='yes'}))}
function baseIncome(){const o=parseFloat($('annualOverride').value);const own=Number.isFinite(o)&&o>0?o:(+$('rate').value||0)*(+$('hours').value||0)*52+(+$('extras').value||0);return own+($('relationship').value==='couple'?(+$('partner').value||0):0)+(+$('otherIncome').value||0)}
function refreshIncome(){const t=baseIncome();$('householdTotal').textContent=money(t);$('incomeSlider').value=Math.min(600000,Math.round(t/1000)*1000);$('sliderValue').textContent=money(+$('incomeSlider').value)}
['rate','hours','extras','annualOverride','partner','otherIncome'].forEach(id=>$(id).addEventListener('input',refreshIncome));$('incomeSlider').oninput=()=>$('sliderValue').textContent=money(+$('incomeSlider').value);

function ccsRate(i){if(i<=88520)return 90;if(i>=538520)return 0;return Math.max(0,90-Math.floor((i-88520)/5000))}
function card(type,name,estimate,why,url){return `<article class="result ${type}"><span class="tag">${type==='calculated'?'CALCULATED ESTIMATE':'MAY BE WORTH CHECKING'}</span><h3>${name}</h3><div class="estimate">${estimate}</div><p>${why}</p>${url?`<a class="source-link" target="_blank" rel="noopener" href="${url}">Official government information →</a>`:''}</article>`}
$('calculateBtn').onclick=()=>{
 const income=+$('incomeSlider').value,K=hasChildren?kids():[],rel=$('relationship').value,housing=$('housing').value,sit=$('situation').value;
 let r=[],eligibleKids=K.filter(k=>k.age!==null && (k.age<=15 || (k.age<=19&&k.secondary))),cc=K.filter(k=>k.childcare&&k.age!==null&&k.age<=13&&!k.secondary);
 if(eligibleKids.length){
  let max=eligibleKids.reduce((s,k)=>s+(k.age<=12?235.48:306.46),0);
  if(income<=69131){
    r.push(card('calculated','Family Tax Benefit Part A',`Up to ${money(max)}/fortnight`,'Your modelled income is within the current maximum-rate income-test band. This is still a guide: care percentage, maintenance income and other eligibility rules can change the actual amount.','https://www.servicesaustralia.gov.au/family-tax-benefit-part-payment-rates?context=22151'));
  } else {
    let desc=income<=123078?'Your income is in the current 20c-per-$1 taper range. The exact amount depends on child ages, base-rate floors, care percentage, maintenance income and other FTB rules.':'Your income is above the second current FTB Part A threshold. A further income test may apply, and the exact result depends on your children and other FTB rules.';
    r.push(card('discovery','Family Tax Benefit Part A','Income-tested — calculate next',desc,'https://www.servicesaustralia.gov.au/income-test-for-family-tax-benefit-part?context=22151'));
  }
 }
 if(cc.length){let pct=ccsRate(income);r.push(card('calculated','Child Care Subsidy',`${pct}% standard CCS rate`,`Income-based standard CCS percentage estimate. Actual subsidy also depends on approved care, hourly fee/cap, subsidised hours and other rules. Higher CCS can apply to some families with more than one eligible child aged 5 or younger.`,'https://www.servicesaustralia.gov.au/your-income-can-affect-child-care-subsidy?context=41186'))}
 if(housing==='rent')r.push(card('discovery','Rent Assistance','Check eligibility','Rent Assistance may be added to certain qualifying payments. Your underlying payment, rent and family circumstances determine eligibility and rate.','https://www.servicesaustralia.gov.au/rent-assistance'));
 if(K.length && ((rel==='single'&&Math.min(...K.map(k=>k.age))<14)||(rel==='couple'&&Math.min(...K.map(k=>k.age))<6)))r.push(card('discovery','Parenting Payment','Check eligibility','Your family profile triggers a Parenting Payment check. Individual fortnightly income, partner income and assets are needed for the full rate calculation.','https://www.servicesaustralia.gov.au/parenting-payment'));
 if(sit==='jobseeker')r.push(card('discovery','JobSeeker Payment','Check eligibility','Your work situation triggers a JobSeeker check. Income, assets and other eligibility conditions apply.','https://www.servicesaustralia.gov.au/jobseeker-payment'));
 if(sit==='student')r.push(card('discovery','Student & apprentice support','Check multiple programs','Youth Allowance, Austudy, ABSTUDY and related study support may be relevant depending on age, course, independence and living arrangements.','https://www.servicesaustralia.gov.au/students-and-trainees'));
 if(sit==='carer'||$('careSomeone').value==='yes')r.push(card('discovery','Carer support','Check multiple programs','Carer Payment, Carer Allowance and related supplements may be relevant. Care requirements and means tests vary.','https://www.servicesaustralia.gov.au/caring-for-someone'));
 if(sit==='disability'||$('workDisability').value==='yes')r.push(card('discovery','Disability support','Check multiple programs','Disability Support Pension, Mobility Allowance and other support may be relevant. Medical and non-medical eligibility requires an official assessment.','https://www.servicesaustralia.gov.au/living-with-disability'));
 if(age($('yourDob').value)>=67||sit==='retired')r.push(card('discovery','Age Pension & seniors support','Check eligibility','Age, residence, income and assets rules apply. Concession cards may also be relevant.','https://www.servicesaustralia.gov.au/age-pension'));
 if(!r.length)r.push(card('discovery','Government support search','No obvious major payment yet','Your profile does not currently trigger one of the major common-payment categories. State, territory and concession programs can still be relevant.'));
 let x=[];
 // Separate discovery catalogue: these are surfaced without pretending a full eligibility assessment has been completed.
 if(K.length){
   x.push(card('discovery','Family Tax Benefit Part B','Worth checking','FTB Part B supports some single-parent, grandparent-carer and one-main-income families. Age of the youngest child and the secondary earner’s income are important.','https://www.servicesaustralia.gov.au/family-tax-benefit-part-b'));
   x.push(card('discovery','Health & concession cards','Worth checking','Depending on household income and the payments you receive, a Health Care Card, Low Income Health Care Card or other concession card may be relevant.','https://www.servicesaustralia.gov.au/concession-and-health-care-cards'));
 }
 if(K.some(k=>k.age!==null && k.age<1)){
   x.push(card('discovery','New baby support','Worth checking','A recent birth can trigger checks for Parental Leave Pay and, in some circumstances, Newborn Upfront Payment and Newborn Supplement. These payments interact with other family assistance.','https://www.servicesaustralia.gov.au/having-baby'));
 }
 if(cc.length){
   x.push(card('discovery','Additional Child Care Subsidy','Worth checking','Some families can receive extra childcare assistance in specific circumstances, including transition to work, temporary financial hardship, grandparent care or child wellbeing situations.','https://www.servicesaustralia.gov.au/additional-child-care-subsidy'));
 }
 if($('careSomeone').value==='yes'||sit==='carer'){
   x.push(card('discovery','Carer Allowance & supplements','Worth checking','Carer Allowance can have different eligibility rules from Carer Payment, so it is worth checking separately along with related supplements.','https://www.servicesaustralia.gov.au/carer-allowance'));
 }
 if($('workDisability').value==='yes'||sit==='disability'){
   x.push(card('discovery','Mobility & disability-related assistance','Worth checking','Depending on work, study and disability circumstances, support beyond DSP may be relevant.','https://www.servicesaustralia.gov.au/living-with-disability'));
 }
 if(sit==='student'){
   x.push(card('discovery','Education supplements & help','Worth checking','Study support can include more than a base payment. Depending on circumstances, supplements, loans and relocation-related assistance may also be relevant.','https://www.servicesaustralia.gov.au/students-and-trainees'));
 }
 if(housing==='rent'){
   x.push(card('discovery','State housing & cost-of-living help','Check your state','Your state or territory may offer concessions or housing-related assistance in addition to Commonwealth payments. V4 flags this for the state-program catalogue.','https://www.servicesaustralia.gov.au/concessions'));
 }
 x.push(card('discovery','State & territory concessions','Run local check',`Your profile is in ${$('personState').value}. Electricity, transport, rates, education and other concessions can be administered outside Centrelink, so these should be checked separately.`,null));
 $('extraResults').innerHTML=x.join('');
 $('extraSection').style.display=x.length?'block':'none';
 $('results').innerHTML=r.join('');$('matchSummary').textContent=`Based on a modelled household income of ${money(income)} and ${K.length} child${K.length===1?'':'ren'} in your profile.`;
 $('incomeInsight').innerHTML=`<b>Why this is useful:</b> calculated estimates are shown separately from programs that need more information or an official assessment. Rules basis: September 2026.`;
 go('matches')
};

$('grantBtn').onclick=()=>{const state=$('state').value,industry=$('industry').value||'your industry',funding=$('funding').value,emp=+$('employees').value,turn=+$('turnover').value;$('grantResults').innerHTML=card('discovery',`${funding} grants & programs`,'Live programs change',`Profile match: ${state}, ${industry}, ${emp} employees, ${money(turn)} turnover. Current grant rounds should be verified against official government sources.`,'https://business.gov.au/grants-and-programs')+card('discovery','Business advice & support','Also worth checking','Government-funded business advisers, training and support can be useful even where a cash grant is not available.','https://business.gov.au/expertise-and-advice')};
refreshIncome();syncRelationship();syncHousing();showStep(1);