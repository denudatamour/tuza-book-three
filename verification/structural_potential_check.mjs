// Independent exact arithmetic audit of the 10-profile independence potential.
function gcd(a,b){a=a<0n?-a:a;b=b<0n?-b:b;while(b){let t=a%b;a=b;b=t;}return a;}
function F(a,b=1n){a=BigInt(a);b=BigInt(b);if(b<0n){a=-a;b=-b;}let g=gcd(a,b);return {a:a/g,b:b/g};}
function add(x,y){return F(x.a*y.b+y.a*x.b,x.b*y.b);}
function neg(x){return F(-x.a,x.b);}
function sub(x,y){return add(x,neg(y));}
function mul(x,y){return F(x.a*y.a,x.b*y.b);}
function div(x,y){return F(x.a*y.b,x.b*y.a);}
function cmp(x,y){let z=x.a*y.b-y.a*x.b;return z<0n?-1:z>0n?1:0;}
function s(x){return x.a+"/"+x.b;}
function decimal(x){return Number(x.a)/Number(x.b);}
const profs=["111","211","221","311","222","321","331","322","332","333"];
const f={"111":F(1),"211":F(1,2),"221":F(2,5),"311":F(1,3),"222":F(17,50),"321":F(153,500)};
const simple780=process.argv.includes("--simple780");
const key=arr=>arr.sort((a,b)=>b-a).join("");
const deg=p=>[...p].reduce((z,k)=>z+Number(k)-1,0);
function lower(p,i){let a=[...p].map(Number);a[i]--;return key(a);}
for(const p of ["331","322","332","333"]){
 let num=F(1),den=deg(p)+1;
 for(let i=0;i<3;i++){let k=Number(p[i]);if(k<2)continue;let w=(k-1)*(deg(p)+1-k);num=add(num,mul(F(w),f[lower(p,i)]));den+=w;}
 f[p]=div(num,F(den));
}
if(simple780){const numerators={"111":780,"211":390,"221":312,"311":260,"222":265,"321":239,"322":218,"331":207,"332":192,"333":173};for(const p of profs)f[p]=F(numerators[p],780);}
let tests=0;
const localLoss={};
function assert(ok,message){tests++;if(!ok)throw Error(message);}
function gap(p,k){return sub(f[lower(p,p.indexOf(String(k)))],f[p]);}
for(const p of profs){
 let loss=mul(F(deg(p)+1),f[p]);
 for(let i=0;i<3;i++){let k=Number(p[i]);if(k<2)continue;loss=sub(loss,mul(F((k-1)*(deg(p)+1-k)),gap(p,k)));}
 assert(cmp(loss,F(1))<=0,"local inequality "+p);
 localLoss[p]=loss;
 for(let mask=0;mask<8;mask++){
  let a=[...p].map(Number),initial=F(0),valid=true;
  for(let i=0;i<3;i++)if(mask&(1<<i)){if(a[i]===1){valid=false;break;}initial=add(initial,gap(p,a[i]));a[i]--;}
  if(valid)assert(cmp(sub(f[key(a)],f[p]),initial)>=0,"simultaneous losses "+p+" "+mask);
 }
}
for(let k=2;k<=3;k++)for(const p of profs)for(const q of profs){
 if(!p.includes(String(k))||!q.includes(String(k))||deg(p)>=deg(q))continue;
 assert(cmp(gap(p,k),gap(q,k))>=0,"marginal monotonicity "+p+" "+q+" "+k);
}
let best={p:null,r:F(0)},rows=[];
for(const p of profs){
 let c=F(0);
 for(const z of p){const k=Number(z);c=add(c,div(sub(F(1,2),F(1,2**(k+1))),F(k)));}
 c=add(c,F(1,2**(deg(p)+2)));
 const ratio=div(c,f[p]);
 let finalMargin=null;
 if([...p].filter(k=>k==="1").length<=1){finalMargin=sub(add(mul(F(11,6),f[p]),F(1+Number(p.includes("1")),28)),c);assert(cmp(finalMargin,F(0))>=0,"final mixed row "+p);}
 if(!p.includes("1")&&cmp(ratio,best.r)>0)best={p,r:ratio};
 rows.push({profile:p,degree:deg(p),potential:s(f[p]),decimal:decimal(f[p]),localLoss780:s(mul(F(780),localLoss[p])),marginal2:p.includes("2")?s(gap(p,2)):null,marginal3:p.includes("3")?s(gap(p,3)):null,cover:s(c),ratio:s(ratio),ratioDecimal:decimal(ratio),finalMargin:finalMargin?s(finalMargin):null});
}
assert(cmp(best.r,simple780?F(2):F(199,100))<0,"no-single-page coefficient");
console.log(JSON.stringify({status:"PASS",simple780,tests,rows,bestNoSinglePage:{profile:best.p,ratio:s(best.r),decimal:decimal(best.r)}},null,2));

