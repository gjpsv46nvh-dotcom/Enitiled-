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

function card(name,estimate,why,metrics=''){
 return `<article class="result"><span class="tag">ESTIMATED / WORTH CHECKING</span><h3>${name}</h3><div class="estimate">${estimate}</div>${metrics}<p>${why}</p><small>Estimate only. Final eligibility and rate are determined by the responsible government agency.</small></article>`;
}
function ccsRate(income){
 if(income<=88520) return 90;
 if(income>=538520) return 0;
 return Math.max(0,90-Math.floor((income-88520)/5000));
}
function ppSingleFree(kids){
 if(kids<=1)return 232.60;
 if(kids==2)return 257.20;
 if(kids==3)return 281.80;
 return 281.80+(kids-3)*24.60;
}
function raSingleNoKids(rentFortnight){
 const threshold=157.80,max=223.80;
 return Math.max(0,Math.min(max,(rentFortnight-threshold)*0.75));
}
function metric(a,b,c,d,e,f){
 return `<div class="metric-row"><div class="metric"><b>${a}</b><span>${b}</span></div><div class="metric"><b>${c}</b><span>${d}</span></div><div class="metric"><b>${e}</b><span>${f}</span></div></div>`;
}

$('calculateBtn').onclick=()=>{
 const income=+$('incomeSlider').value, kids=+$('children').value, youngest=+$('youngest').value, cc=+$('childcare').value,
 housing=$('housing').value, sit=$('situation').value, age=+$('age').value, relationship=$('relationship').value,
 rent=+$('rent').value, assets=+$('assets').value, homeowner=$('homeowner').value==='yes';
 let r=[];

 if(kids>0){
   const next = income<69131?69131:income<123078?123078:null;
   let txt = income<=69131 ? 'At or below the current first FTB Part A income-test threshold.' :
             income<=123078 ? 'Inside the current 20c-per-$1 FTB Part A taper range. Exact dollars need each child’s age, maintenance and supplement details.' :
             'Above the current second FTB Part A threshold, where the 30c-per-$1 test may apply until entitlement reaches nil.';
   r.push(card('Family Tax Benefit Part A','Potential match',txt,
     metric(money(income),'modelled family income', next?money(next):'Varies','next key threshold','20 Sep 2026','rules basis')));
 }

 if(cc>0){
   const rate=ccsRate(income);
   const nextBand = income<=88520?88520:Math.min(538520,88520+(Math.floor((income-88520)/5000)+1)*5000);
   r.push(card('Child Care Subsidy',rate+'% standard CCS',`Indicative standard CCS percentage from family income. Actual fee reduction also depends on the hourly fee/rate cap, eligible hours and other CCS rules. Families with more than one eligible child aged 5 or younger may receive a higher rate for one or more children.`,
      metric(money(income),'family income',money(nextBand),'next income band',cc+' child'+(cc==1?'':'ren'),'in childcare')));
 }

 if(housing==='rent'){
   let est='Potential match', why='Rent Assistance is only payable with certain qualifying payments and rates differ by family circumstances.';
   if(relationship==='single' && kids===0){
      const amt=raSingleNoKids(rent*2); est=money(amt)+'/fortnight';
      why='Illustrative single, no-children Rent Assistance calculation using the 20 September 2026 threshold and maximum. A single sharer has different limits.';
   }
   r.push(card('Rent Assistance',est,why,
     metric(money(rent*2),'fortnightly rent','75¢','$ per $1 above threshold','20 Sep 2026','rules basis')));
 }

 const ppAgeOK=(relationship==='single'&&youngest<14)||(relationship==='couple'&&youngest<6);
 if(kids>0 && ppAgeOK){
   if(relationship==='single'){
     const free=ppSingleFree(kids), cutoff=2950.60+Math.max(0,kids-1)*24.60;
     r.push(card('Parenting Payment','Up to $1,068.20/fn',`Current maximum single rate shown as Parenting Payment plus pension supplement. Your actual rate uses fortnightly income and assets; this annual household-income slider is not enough to calculate the exact payment.`,
       metric(money(free)+'/fn','income before reduction',money(cutoff)+'/fn','indicative income cut-off',money(homeowner?333000:600000),'asset limit')));
   } else {
     r.push(card('Parenting Payment','Up to $755.10/fn','Partnered Parenting Payment may apply where the principal carer has a child under 6. Exact rate needs each partner’s fortnightly income, not just annual household income.',
       metric('$256/fn','recipient income threshold','$1,440/fn','partner threshold',money(homeowner?499000:766000),'combined asset limit')));
   }
 }

 if(sit==='jobseeker'){
   let max=relationship==='single'?(kids>0?883.30:824.90):755.10;
   let cut=relationship==='single'?(kids>0?2399.50:1557.17):null;
   r.push(card('JobSeeker Payment','Up to '+money(max)+'/fn',`Maximum guide rate from 20 September 2026. Exact payment depends on fortnightly personal/partner income, assets, working credits and circumstances.`,
     metric(cut?money(cut)+'/fn':'Varies','income cut-off guide',money(homeowner?(relationship==='single'?333000:499000):(relationship==='single'?600000:766000)),'asset limit','20 Sep 2026','rules basis')));
 }
 if(sit==='student' || age<25) r.push(card('Youth / Study support','Potential match','Youth Allowance, Austudy or ABSTUDY may be relevant. V2 flags these for checking; exact student calculations require study, independence, living-at-home and parental-income details.'));
 if(sit==='carer') r.push(card('Carer support','Potential match','Carer Payment, Carer Allowance and related supplements may be relevant. Care needs and income/assets rules require a fuller assessment.'));
 if(sit==='disability') r.push(card('Disability support','Potential match','Disability Support Pension and related concessions may be relevant. Medical eligibility cannot be inferred from this questionnaire.'));
 if(sit==='retired' || age>=67) r.push(card('Age Pension & senior support','Potential match','Age Pension and senior concessions may be relevant. A full estimate needs detailed assets, income and residence information.'));
 if(!r.length) r.push(card('General concessions & support','Profile created','Federal, state and territory concessions should be checked against your circumstances.'));

 $('results').innerHTML=r.join('');
 $('matchSummary').textContent=`V2 model based on household income of ${money(income)} and the details entered.`;
 let insight = income<69131 ? `Your modelled income is ${money(69131-income)} below the first current FTB Part A income-test threshold.` :
               income<123078 ? `Your modelled income is ${money(123078-income)} below the current $123,078 FTB Part A second-test threshold.` :
               `Your modelled income is above $123,078, so the higher FTB Part A income test may be relevant if you otherwise qualify.`;
 $('incomeInsight').innerHTML=`<b>Income insight:</b> ${insight} Change the income slider and recalculate to compare scenarios.`;
 go('matches');
};

$('grantBtn').onclick=()=>{
 const state=$('state').value, industry=$('industry').value||'your industry', funding=$('funding').value, emp=+$('employees').value, turn=+$('turnover').value;
 $('grantResults').innerHTML=
 card(`${funding} grants & programs`,'Search category match',`Check current ${state} and Australian Government programs supporting ${funding.toLowerCase()} for ${industry}.`) +
 card('Business support programs','Also worth checking',`Profile: ${emp} employees and ${money(turn)} turnover. V2 keeps grants as live-search candidates because grant rounds, closing dates and eligibility can change.`);
};
refreshIncome();