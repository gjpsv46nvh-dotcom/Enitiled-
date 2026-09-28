const $=id=>document.getElementById(id);
const money=n=>new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD',maximumFractionDigits:0}).format(n||0);
function go(id){document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));$(id).classList.add('active');scrollTo({top:0,behavior:'smooth'})}
document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));

function baseIncome(){
 const override=parseFloat($('annualOverride').value);
 const own=Number.isFinite(override)&&override>0?override:(+$('rate').value||0)*(+$('hours').value||0)*52+(+$('extras').value||0);
 return own+(+$('partner').value||0)+(+$('otherIncome').value||0);
}
function refreshIncome(){
 const t=baseIncome(); $('householdTotal').textContent=money(t); $('incomeSlider').value=Math.min(300000,Math.round(t/1000)*1000); $('sliderValue').textContent=money(+$('incomeSlider').value);
}
['rate','hours','extras','annualOverride','partner','otherIncome'].forEach(id=>$(id).addEventListener('input',refreshIncome));
$('incomeSlider').oninput=()=>{$('sliderValue').textContent=money(+$('incomeSlider').value)}

function card(name,estimate,why){
 return `<article class="result"><span class="tag">WORTH CHECKING</span><h3>${name}</h3><div class="estimate">${estimate}</div><p>${why}</p><small>Indicative screening only — confirm current rules and eligibility with the responsible government agency.</small></article>`;
}
$('calculateBtn').onclick=()=>{
 const income=+$('incomeSlider').value, kids=+$('children').value, youngest=+$('youngest').value, cc=+$('childcare').value, housing=$('housing').value, sit=$('situation').value, age=+$('age').value;
 let r=[];
 if(kids>0) r.push(card('Family Tax Benefit','Estimate requires current rate table',`You entered ${kids} dependent child${kids==1?'':'ren'}. FTB is income tested, so household income of ${money(income)} is relevant.`));
 if(cc>0) r.push(card('Child Care Subsidy','Potential match',`${cc} child${cc==1?' is':'ren are'} in childcare. CCS depends on family circumstances, approved care and income.`));
 if(housing==='rent') r.push(card('Rent Assistance','Potential match','Rent Assistance can be added to certain eligible payments. Your rent and the payment you receive both matter.'));
 if(kids>0 && youngest<14) r.push(card('Parenting Payment','Check circumstances',`Your youngest child is ${youngest}. Parenting Payment has different rules for single and partnered principal carers and is income/assets tested.`));
 if(sit==='jobseeker') r.push(card('JobSeeker Payment','Potential match','Income, assets, age, residence and work circumstances affect eligibility and payment rate.'));
 if(sit==='student' || age<25) r.push(card('Youth / Study support','Potential match','Youth Allowance, Austudy or other study support may be relevant depending on age, study and independence rules.'));
 if(sit==='carer') r.push(card('Carer support','Potential match','Carer Payment, Carer Allowance and supplementary support may be relevant depending on the care provided and other rules.'));
 if(sit==='disability') r.push(card('Disability support','Potential match','Disability Support Pension and related concessions may be worth checking. Medical and non-medical rules apply.'));
 if(sit==='retired' || age>=67) r.push(card('Age Pension & senior support','Potential match','Income, assets, residence and age rules determine eligibility.'));
 if(!r.length) r.push(card('General concessions & support','Profile created','We would next check federal, state and territory programs against your location and circumstances.'));
 $('results').innerHTML=r.join('');
 $('matchSummary').textContent=`Based on a modelled household income of ${money(income)}. V1 currently screens categories; live official rate tables will be the next data layer.`;
 go('matches');
};

$('grantBtn').onclick=()=>{
 const state=$('state').value, industry=$('industry').value||'your industry', funding=$('funding').value, emp=+$('employees').value, turn=+$('turnover').value;
 $('grantResults').innerHTML=
 card(`${funding} grants & programs`,'Search category match',`Look for ${state} and Australian Government programs supporting ${funding.toLowerCase()} for ${industry}.`) +
 card('Business support programs','Also worth checking',`Profile: ${emp} employees and ${money(turn)} turnover. Eligibility varies by program, location, project and funding round.`);
};

refreshIncome();