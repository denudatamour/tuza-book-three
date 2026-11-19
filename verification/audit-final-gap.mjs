// Independent exact arithmetic audit for the full-class 353/177 proof.
// Uses the proposed literal integer table, not a recurrence generating it.
// Run: node research/book-three-gap/audit-final-gap.mjs
import assert from 'node:assert/strict';

const profiles = ['111','211','221','311','222','321','322','331','332','333'];
const numerator = Object.fromEntries(profiles.map((p,i) =>
  [p, [780,390,312,260,265,239,218,207,192,173][i]]));
const cover768 = Object.fromEntries(profiles.map((p,i) =>
  [p, [768,624,528,544,456,472,412,428,374,339][i]]));
const degree = p => [...p].reduce((a,k) => a + Number(k)-1, 0);
const key = a => [...a].sort((a,b) => b-a).join('');
function lower(p,k) {
  const a = [...p].map(Number), i = a.indexOf(k);
  assert(i >= 0 && k >= 2);
  a[i]--;
  return key(a);
}
const marginal = (p,k) => numerator[lower(p,k)]-numerator[p];
let checks = 0;
function check(condition, message) {
  checks++;
  assert(condition, message);
}
const rows = [];

for (const p of profiles) {
  const d = degree(p);
  let loss = (d+1)*numerator[p];
  for (const z of p) {
    const k = Number(z);
    if (k === 1) continue;
    check(marginal(p,k) >= 0, `negative marginal: ${p}, ${k}`);
    loss -= (k-1)*(d+1-k)*marginal(p,k);
  }
  check(loss <= 780, `local mean loss: ${p}`);

  for (let mask=0; mask<8; mask++) {
    const a=[...p].map(Number);
    let increment=0, valid=true;
    for (let i=0;i<3;i++) if (mask & (1<<i)) {
      if (a[i]===1) { valid=false; break; }
      increment += marginal(p,a[i]);
      a[i]--;
    }
    if (valid) check(numerator[key(a)]-numerator[p] >= increment,
      `simultaneous page drops: ${p}, ${mask}`);
  }

  // Independently reconstruct the coloring cost in denominator 768.
  // 768*(1/2-2^(-b-1))/b equals 192,144,112 for b=1,2,3.
  const reconstructed = [...p].reduce((s,b) => s + ({1:192,2:144,3:112})[b],0)
    + 768 / 2**(d+2);
  check(reconstructed === cover768[p], `color cost: ${p}`);

  const privateCount = [...p].filter(k => k==='1').length;
  let priceSlack = null;
  if (privateCount <= 1) {
    // Common denominator 1,048,320 for c, (11/6)f, and (1+flag)/28.
    priceSlack = 2464*numerator[p]+37440*(1+(privateCount===1?1:0))
      -1365*cover768[p];
    check(priceSlack >= 0, `seven-profile price inequality: ${p}`);
  }
  if (privateCount===0) {
    check(780*cover768[p] < 1536*numerator[p],
      `strict cover/packing comparison without private edges: ${p}`);
  }
  rows.push({profile:p, fNumerator:numerator[p], fDenominator:780,
    localLossNumerator:loss, localLossDenominator:780,
    coverNumerator:cover768[p], coverDenominator:768,
    priceSlackNumerator:priceSlack, priceSlackDenominator:1048320});
}

for (const k of [2,3]) for (const p of profiles) for (const q of profiles) {
  if (p.includes(String(k)) && q.includes(String(k)) && degree(p)<degree(q))
    check(marginal(p,k)>=marginal(q,k), `degree monotonicity: ${p},${q},${k}`);
}

// The omitted-private-edge repair saving, scaled by 16.
function saving16(owned) {
  const product = owned.reduce((x,l) => x*(2-l),1);
  return 4*owned.reduce((a,l)=>a+l,0)-8+8*product/(2**owned.length);
}
const owners=[[]];
for(let size=1;size<=3;size++) {
  for (const a of owners.filter(a=>a.length===size-1))
    for (const l of [0,1,2]) owners.push([...a,l]);
}
for (const a of owners) {
  check(saving16(a)>=0, `negative coalescing saving: ${a}`);
  if (a.filter(l=>l===1).length>=2)
    check(saving16(a)>=2, `matched-pair saving: ${a}`);
  if (a.length<3) for (const l of [0,1,2])
    check(saving16([...a,l])>=saving16(a), `saving monotonicity: ${a},${l}`);
}

// Final elimination: 11/6 + 9/56 = 335/168;
// 2-335/168=1/168, and (1+3/56)*168=177.
check(11*28+9*3===335, 'coefficient 335/168');
check(2*168-335===1, 'final positive coefficient');
check((56+3)*3===177, 'constant 177');
check(2*177-1===353, 'cover coefficient 353/177');
check(rows.find(r=>r.profile==='332').priceSlackNumerator===18,
  'smallest price slack is exactly 1/58240');

console.log(JSON.stringify({status:'PASS',checks,rows,
  conclusion:'177*tau <= 353*nu',
  scope:'Exact finite arithmetic only; the induction and geometric local-exchange proofs are audited separately.'},null,2));
