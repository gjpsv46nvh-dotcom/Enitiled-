const fs=require('fs'),vm=require('vm'),assert=require('assert');
vm.runInThisContext(fs.readFileSync('rules-2026-27.js','utf8'));
vm.runInThisContext(fs.readFileSync('rules-batch-3-2026-27.js','utf8'));
function near(a,b,t=.02){assert(Math.abs(a-b)<=t,`${a} != ${b}`)}
near(fePensionIncomeEstimate('single',226*26,0),1237.70);
near(fePensionIncomeEstimate('couple',396*26,0),933.00);
assert.equal(fePensionAssetScreen('single','yes',333000).band,'full');
assert.equal(fePensionAssetScreen('single','yes',500000).band,'part');
assert.equal(fePensionAssetScreen('single','yes',800000).band,'over');
assert(feCarerAllowanceScreen(249999).incomePass);
assert(!feCarerAllowanceScreen(250000).incomePass);
assert(feCSHCScreen('single',100000,0).incomePass);
assert(!feCSHCScreen('single',110000,0).incomePass);
assert(fePLPIncomeScreen(180000,400000).pass);
assert(fePLPIncomeScreen(200000,300000).pass);
assert(!fePLPIncomeScreen(200000,400000).pass);
near(fePLPGross(5),1004.70);
console.log('Extended entitlement rule tests: PASS');
