// Monde isométrique voxel : thème selon la phrase, construction progressive.
(function(){
const T={
glace:{k:/glace|neige|ice|froid|hiver|polaire/,sky:['#0b1e3d','#5aa9e6'],top:'#dff3ff',side:'#8cc5ec',acc:'#ffffff'},
lave:{k:/lave|volcan|feu|enfer|magma|lava/,sky:['#1a0505','#c2410c'],top:'#4a2a22',side:'#2a1410',acc:'#ff6a00'},
foret:{k:/for[eê]t|arbre|nature|jungle|ferme|farm/,sky:['#06210f','#4ade80'],top:'#4caf50',side:'#2f7d32',acc:'#a3e635'},
ville:{k:/ville|city|tycoon|banque|gratte|neon|néon/,sky:['#0a0a24','#6d28d9'],top:'#5b6b8c',side:'#323d5a',acc:'#22d3ee'},
desert:{k:/d[eé]sert|sable|pyramide|egypt|pirate|plage/,sky:['#3b1d07','#f59e0b'],top:'#e8c27a',side:'#b8893c',acc:'#fde68a'},
espace:{k:/espace|space|galax|plan[eè]te|robot|futur/,sky:['#02020a','#312e81'],top:'#6b7280',side:'#374151',acc:'#a78bfa'},
def:{k:/./,sky:['#0b1530','#2563eb'],top:'#60a5fa',side:'#1d4ed8',acc:'#fbbf24'}};
const pick=s=>{for(const n in T)if(n!=='def'&&T[n].k.test((s||'').toLowerCase()))return n;return'def'};
const hash=s=>{let h=2166136261;for(const c of s||'x'){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
const rng=a=>()=>(a=Math.imul(a^a>>>15,a|1),a^=a+Math.imul(a^a>>>7,a|61),((a^a>>>14)>>>0)/4294967296);
const sh=(c,f)=>{const n=parseInt(c.slice(1),16);const r=Math.min(255,(n>>16)*f)|0,g=Math.min(255,(n>>8&255)*f)|0,b=Math.min(255,(n&255)*f)|0;return`rgb(${r},${g},${b})`};
window.World={mount(cv,o={}){
 const x=cv.getContext('2d'),N=o.n||13;let th=T.def,cur=T.def.sky.slice(),H=[],prog=o.progress??1,tgt=prog,part=[],t0=0,txt='';
 const lerp=(a,b,t)=>a+(b-a)*t,hex=c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16));
 const mix=(a,b,t)=>'#'+hex(a).map((v,i)=>Math.round(lerp(v,hex(b)[i],t)).toString(16).padStart(2,'0')).join('');
 function gen(){const r=rng(hash(txt)+7);H=[];for(let i=0;i<N;i++){H[i]=[];for(let j=0;j<N;j++){const d=Math.hypot(i-N/2,j-N/2);H[i][j]=Math.max(1,Math.round(1+r()*2.2+(N/2-d)*.25+(r()>.93?3:0)))}}}
 function fit(){const d=devicePixelRatio||1;cv.width=cv.clientWidth*d;cv.height=cv.clientHeight*d}
 addEventListener('resize',fit);fit();gen();
 const api={set(s){txt=s;th=T[pick(s)];gen();part=[]},setProgress(p){tgt=p},theme:()=>pick(txt)};
 function frame(t){requestAnimationFrame(frame);const d=devicePixelRatio||1,W=cv.width,Ht=cv.height;prog+=(tgt-prog)*.05;
  cur=[mix(cur[0],th.sky[0],.06),mix(cur[1],th.sky[1],.06)];const g=x.createLinearGradient(0,0,0,Ht);g.addColorStop(0,cur[0]);g.addColorStop(1,cur[1]);x.fillStyle=g;x.fillRect(0,0,W,Ht);
  if(part.length<70)part.push({x:Math.random()*W,y:Math.random()*Ht,s:Math.random()*2+.5,v:Math.random()*.4+.1});
  x.fillStyle=th.acc;x.globalAlpha=.5;part.forEach(p=>{p.y-=p.v*d;if(p.y<0)p.y=Ht;x.fillRect(p.x,p.y,p.s*d,p.s*d)});x.globalAlpha=1;
  const tw=Math.min(W,Ht*1.5)/N*.95*(o.zoom||1),th2=tw/2,bh=tw*.55,cx=W*(o.cx??.5),cy=Ht*(o.cy??.42),ang=t/9000;
  const cs=[];for(let i=0;i<N;i++)for(let j=0;j<N;j++)cs.push([i,j]);
  // rotation lente : on projette avec angle, tri par profondeur
  const pr=(i,j)=>{const a=i-N/2,b=j-N/2,ca=Math.cos(ang),sa=Math.sin(ang);return[a*ca-b*sa,a*sa+b*ca]};
  cs.sort((p,q)=>{const A=pr(...p),B=pr(...q);return(A[0]+A[1])-(B[0]+B[1])});
  cs.forEach(([i,j],k)=>{const w=Math.max(0,Math.min(1,prog*(N*N*.6)/(N*N)*1.7-k/(N*N)*.7)),h=H[i][j]*w;if(h<=0.02)return;
   const[a,b]=pr(i,j),sx=cx+(a-b)*tw/2,sy=cy+(a+b)*th2/2-h*bh*.5-Math.sin(t/700+i+j)*1.5*d,top=h>4?th.acc:th.top;
   const f=(c,dx,dy)=>{x.beginPath();c.forEach(([u,v],n)=>n?x.lineTo(sx+u,sy+v):x.moveTo(sx+u,sy+v));x.closePath();x.fill()};
   const hw=tw/2,hh=th2/2,hb=h*bh;
   x.fillStyle=sh(th.side,.7);f([[-hw,0],[0,hh],[0,hh+hb],[-hw,hb]]);x.fillStyle=sh(th.side,.5);f([[hw,0],[0,hh],[0,hh+hb],[hw,hb]]);
   x.fillStyle=top;f([[0,-hh],[hw,0],[0,hh],[-hw,0]]);x.strokeStyle='rgba(0,0,0,.18)';x.stroke()});}
 requestAnimationFrame(frame);return api}};
})();
