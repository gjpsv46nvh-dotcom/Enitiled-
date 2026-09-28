const fs=require('fs'),vm=require('vm'),assert=require('assert');
vm.runInThisContext(fs.readFileSync('rules-2026-27.js','utf8'));
function near(a,b,t=.02){assert(Math.abs(a-b)<=t,`${a} != ${b}`)}
assert.equal(feCCS(0),90);
assert.equal(feCCS(88520),90);
assert.equal(feCCS(538520),0);
assert.equal(feCCS(93520),89);

let oneYoung=[{age:5,secondary:false}];
near(feFTBA(oneYoung,69131).fortnight,235.48);
assert(feFTBA(oneYoung,100000).fortnight>=75.60);
assert.equal(feFTBB([{age:3,secondary:false}],'single',124327,0).fortnight,200.34);
assert.equal(feFTBB([{age:3,secondary:false}],'single',124328,0).fortnight,0);
near(feFTBB([{age:3,secondary:false}],'couple',100000,7154).fortnight,200.34);
assert.equal(feFTBB([{age:3,secondary:false}],'couple',125000,0).fortnight,0);

near(feRent('single12',103.67).fortnight,0); // 207.34/fn threshold
near(feRent('single12',279.045).fortnight,263.06); // max threshold
assert(feAssetPass('single','yes',333000));
assert(!feAssetPass('single','yes',333001));
assert(feAssetPass('couple','no',766000));

near(feJobseeker('single',false,150*26,0),824.90);
near(feJobseeker('single',false,256*26,0),771.90);
near(feParenting('single',1,232.60*26,0),1068.20);
near(feParenting('couple',1,150*26,1440*26),755.10);
console.log('Core entitlement rule tests: PASS');
