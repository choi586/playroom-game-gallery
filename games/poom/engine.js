/* 품 — 섬마을의 닷새 · 게임 엔진. 시나리오 글은 scenarios/ 폴더에 따로 있습니다. */

if(!CanvasRenderingContext2D.prototype.roundRect)CanvasRenderingContext2D.prototype.roundRect=function(a,b,w,h){this.rect(a,b,w,h)};
const $=id=>document.getElementById(id),cv=$('c'),W=640,H=400;let x=cv.getContext('2d');
/* 따라잡기 프레임에서는 그리기를 건너뛰기 위한 빈 캔버스 대역 */
const NOP=new Proxy({},{get:(o,k)=>k==='measureText'?()=>({width:0}):k==='createLinearGradient'||k==='createRadialGradient'?()=>({addColorStop(){}}):()=>{},set:()=>true});
const RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;let OFF=false;
function fit(){if(x===NOP)return;const d=Math.min(3,window.devicePixelRatio||1)*Math.max(1,cv.clientWidth/W);cv.width=W*d;cv.height=H*d;x.setTransform(d,0,0,d,0,0)}
addEventListener('resize',fit);setTimeout(fit,60);fit();
function rng(s){return()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

/* ───────── 시나리오 데이터 ───────── */
const POS={g:[112,160,58,160],d:[528,160,584,160],m:[122,318,58,322],b:[518,318,584,324]};
const HOME={x:320,y:212},FIELD={x:400,y:308},TREE={x:232,y:322};
const SCS={};
/* 시나리오 등록 + 형식 검사: 잘못된 파일은 게임을 멈추지 않고 화면에 이유를 알려 준다 */
const POOM=window.POOM={errors:[],add(s){const e=[],need=(c,m)=>{if(!c)e.push(m)};
 need(s&&typeof s.key==='string','key가 없습니다');need(['jeju','oki','tw'].includes(s.theme),"theme은 'jeju'·'oki'·'tw' 중 하나여야 합니다");
 need(Array.isArray(s.days)&&s.days.length===4,'days는 4개(첫날~넷째 날)여야 합니다');need(Array.isArray(s.ch)&&s.ch.length===4,'ch는 [null, 선택, 선택, 선택] 4칸이어야 합니다');
 need(Array.isArray(s.nb)&&s.nb.length===4&&'gdmb'.split('').every((id,i)=>s.nb[i]&&s.nb[i].id===id),"nb는 id가 g, d, m, b인 이웃 4명이어야 합니다");
 (s.nb||[]).forEach(n=>{need(Array.isArray(n.st)&&n.st.length===3,`${n.name||n.id}: 이야기(st)는 3편이어야 합니다`);(n.st||[]).forEach(t=>{if(t.w)need(s.words&&s.words[t.w],`${n.name}: 섬말 '${t.w}'가 words에 없습니다`)})});
 ['intro','after','rev','ok','fail','stormOk','stormNo','nowCap','year','label'].forEach(f=>need(typeof s[f]==='string',`${f} 항목이 없습니다`));
 if(e.length){POOM.errors.push(`[${s&&s.key||'?'}] `+e.join(' / '));return}SCS[s.key]=s},
 boot(){if(!Object.keys(SCS).length){card('<h2>시나리오를 불러오지 못했습니다</h2>'+(POOM.errors.join('<br>')||'scenarios 폴더의 파일을 확인해 주세요.'));return}title();requestAnimationFrame(loop)}};
const QS=['닷새 동안 누구의 일을 거들지 어떻게 골랐나요? 듣지 못한 이야기는 누구의 것이었나요?','어른들은 왜 아이들 앞에서 말을 줄였을까요?','그날의 선택에서 다른 쪽을 골랐다면 무엇이 달라졌을까요? 달라지지 않는 것은 무엇일까요?','지금 내 곁에서 품을 주고받는 사람은 누구인가요?'];

/* ───────── 상태 ───────── */
let SC=null,NB,S,keys={},tgt=null,parts=[],rain=[],t=0,busy=null,mode='title',tm=0,wind=0,deco=[],clouds=[],dq=null,sold=-120;
function setup(k){SC=SCS[k];NB=SC.nb;NB.forEach(n=>{const p=POS[n.id];n.x=p[0];n.y=p[1];n.fx=p[2];n.fy=p[3]});
 S={day:0,ap:3,food:2,bond:{},heard:[],words:[],ch:[],px:HOME.x,py:HOME.y+16,dir:1,walk:0,came:[]};NB.forEach(n=>S.bond[n.id]=0);
 const r=rng({jeju:7,oki:19,tw:31}[SC.theme]);deco=[];for(let i=0;i<70;i++){const dx=20+r()*600,dy=104+r()*236;if(dy>214&&dy<250)continue;if(dx>300&&dx<340&&dy>240)continue;deco.push({x:dx,y:dy,s:r(),v:r()})}
 clouds=[];for(let i=0;i<5;i++)clouds.push({x:r()*W,y:14+r()*46,w:40+r()*50});parts=[];rain=[];busy=null;tgt=null;wind=0}
const SAVE='poom-save-v1';
function load(){try{const v=JSON.parse(localStorage.getItem(SAVE)||'null');return v&&SCS[v.k]&&v.S&&v.S.day<4?v:null}catch(e){return null}}
function save(){try{localStorage.setItem(SAVE,JSON.stringify({k:SC.key,S:{day:S.day,food:S.food,bond:S.bond,heard:S.heard,words:S.words,ch:S.ch}}))}catch(e){}}
function clearSave(){try{localStorage.removeItem(SAVE)}catch(e){}}
function resume(){const v=load();if(!v)return title();closeCard();audio();setup(v.k);Object.assign(S,v.S);mode='play';dayStart()}
function skip(k){closeCard();audio();setup(k);mode='play';NB.forEach((n,i)=>{const c=i<3?2:1;S.bond[n.id]=c;for(let j=0;j<c;j++){S.heard.push(n.id+j);const w=n.st[j].w;if(w)S.words.push(w)}});S.day=3;S.ap=0;nextDay()}
function title(){setup(Object.keys(SCS)[0]);mode='title';cap();const v=load(),teacher=location.hash==='#teacher';
 const btns=Object.values(SCS).map(s=>`<button class="btn" style="background:${s.color||'#b5482e'}" onclick="start('${s.key}')">${s.emoji||''} ${s.label}</button>`).join('');
 card(`<h2>품</h2>세 섬 시리즈 · 한 편에 7분쯤

어느 섬마을에서 보내는 닷새.
이웃의 일을 거들고, 이야기를 듣고, 큰 바람을 함께 넘깁니다.
${v?`<button class="btn" style="background:#2b2620" onclick="resume()">▶ 이어서 하기 — ${SCS[v.k].short||SCS[v.k].label} ${v.S.day+1}일째</button><br>`:''}${btns}${teacher?`<div class="note"><b>교사용</b> · 수업 시연을 위해 다섯째 날(태풍)부터 시작합니다.<br>${Object.values(SCS).map(s=>`<button class="btn alt" onclick="skip('${s.key}')">${s.short||s.label} 태풍부터</button>`).join('')}</div>`:''}${POOM.errors.length?`<div class="note" style="color:#b5482e">불러오지 못한 시나리오: ${POOM.errors.join('<br>')}</div>`:''}<div class="note">경희대학교 글로벌류큐·오키나와연구소 · 교육용 웹게임 데모${OFF?' · 오프라인에서도 열립니다':''}</div>`)}
function start(k){closeCard();audio();setup(k);mode='play';card(SC.intro,'마을로',()=>dayStart())}
function card(html,btn,cb,dark){const b=$('box');b.className='box'+(dark?' dark':'');b.innerHTML=html+(btn?`<br><button class="btn" id="ob">${btn}</button>`:'');b.scrollTop=0;$('ov').classList.remove('hide');if(btn)$('ob').onclick=()=>{closeCard();cb&&cb()}}
function closeCard(){$('ov').classList.add('hide')}
const open=()=>!$('ov').classList.contains('hide')||dq;
function cap(s){const c=$('cap');if(s){c.textContent=s;c.classList.remove('hide')}else c.classList.add('hide')}
function toast(s){const e=$('toast');e.textContent=s;e.style.opacity=1;clearTimeout(toast.h);toast.h=setTimeout(()=>e.style.opacity=0,2600)}
function say(who,text,cb){dq={cb};$('dlg').innerHTML=`<span class="go">눌러서 계속 ▸</span><span class="who">${who}</span><br>${text}`;$('dlg').classList.remove('hide')}
$('dlg').onclick=()=>{if(!dq)return;const c=dq.cb;dq=null;$('dlg').classList.add('hide');c&&c()};
function dayStart(){save();S.ap=3;S.px=HOME.x;S.py=HOME.y+16;tgt=null;card(`<h2 style="font-size:1rem">${SC.year}</h2>`+SC.days[S.day],'하루 시작',()=>{const c=SC.ch[S.day];if(c)card(`<h2 style="font-size:1rem">그날 있었던 일</h2>${c.q}<br><button class="btn" onclick="pickC(0)">${c.a[0]}</button><button class="btn alt" onclick="pickC(1)">${c.a[1]}</button>`)})}
function pickC(i){closeCard();const c=SC.ch[S.day];S.ch.push([c.t,c.a[i]]);chime(1);say('그날',c.r[i])}
let hudS='',muted=false;function hud(){const play=mode==='play';const h=(play?`<span>📅 <b>${S.day+1}</b>/5일</span><span>✋ <b>${'●'.repeat(S.ap)}${'○'.repeat(3-S.ap)}</b></span><span>🍚 <b>${S.food}</b></span><span>👂 이야기 <b>${S.heard.length}</b></span>`:'<span>품 — 섬마을의 닷새</span>')+(mode!=='title'?`<button id="nb" onclick="book()">📖 섬말 수첩 ${S.words.length}</button><button id="mu" onclick="muted=!muted">${muted?'🔇':'🔊'}</button>`:'');if(h!==hudS){hudS=h;$('hud').innerHTML=h}}
let AC,windG;function audio(){if(AC)return;try{AC=new(window.AudioContext||window.webkitAudioContext)();const b=AC.createBuffer(1,AC.sampleRate*2,AC.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;const n=AC.createBufferSource();n.buffer=b;n.loop=true;const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=420;windG=AC.createGain();windG.gain.value=0;n.connect(f);f.connect(windG);windG.connect(AC.destination);n.start()}catch(e){AC=null}}
function chime(k){if(!AC||muted)return;try{const sc=[392,440,523,587,659,784],seq=k===2?[2,4,5]:k===1?[1,3]:[0,2];seq.forEach((n,i)=>{const o=AC.createOscillator(),g=AC.createGain(),t0=AC.currentTime+i*.16;o.type='sine';o.frequency.value=sc[n];g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(.09,t0+.03);g.gain.exponentialRampToValueAtTime(.0001,t0+.9);o.connect(g);g.connect(AC.destination);o.start(t0);o.stop(t0+1)})}catch(e){}}
function book(){if(open())return;const ws=S.words.map(k=>`<div class="word"><b>${SC.words[k][0]}</b><span>${SC.words[k][1]}</span></div>`).join('');
 card(`<h2>섬말 수첩</h2>${ws||'아직 적은 말이 없다. 이웃 일을 거들면 섬말을 하나씩 배운다.'}`,'닫기')}

/* ───────── 입력 ───────── */
addEventListener('keydown',e=>{keys[e.key]=1;if(e.key===' '||e.key==='Enter'){e.preventDefault();if(dq)$('dlg').onclick();else act()}});
addEventListener('keyup',e=>keys[e.key]=0);
const tap=e=>{const p=e.touches?e.touches[0]:e;e.cancelable&&e.preventDefault();const r=cv.getBoundingClientRect();tgt={x:(p.clientX-r.left)/r.width*W,y:(p.clientY-r.top)/r.height*H};
 const pts=[...NB.map(n=>[n.x,n.y-14,n.id]),[HOME.x,HOME.y-10,'home'],[FIELD.x,FIELD.y,'field']];const h=pts.find(([a,b])=>Math.hypot(a-tgt.x,b-tgt.y)<38);tgt.auto=h?h[2]:null;
 if(h){const q=h[2]==='home'?[HOME.x,HOME.y+14]:h[2]==='field'?[FIELD.x,FIELD.y]:[h[0]+14,h[1]+20];tgt.x=q[0];tgt.y=q[1]}};
if(window.PointerEvent)cv.addEventListener('pointerdown',tap);else cv.addEventListener('touchstart',tap,{passive:false});
$('act').onclick=()=>act();
function near(){if(mode!=='play'||busy||open())return null;
 for(const n of NB)if(Math.hypot(n.x-S.px,n.y-S.py)<40)return{type:'nb',n,id:n.id};
 if(Math.hypot(FIELD.x-S.px,FIELD.y-S.py)<42)return{type:'field',id:'field'};
 if(Math.hypot(HOME.x-S.px,HOME.y+14-S.py)<34)return{type:'home',id:'home'};return null}
function label(a){if(!a)return'';if(a.type==='nb')return S.ap<1?'해가 졌다':S.food<1?'나눠 먹을 양식이 없다':`${a.n.name} · ${a.n.task}`;if(a.type==='field')return S.ap<1?'해가 졌다':'우리 밭 매기 (양식 +3)';return S.ap>0?`하루 마치기 (일 ${S.ap} 남음)`:'집에 들어가 하루 마치기'}
function act(){const a=near();if(!a)return;if(a.type==='home'){nextDay();return}if(S.ap<1)return;
 if(a.type==='nb'){if(S.food<1)return;S.ap--;S.food--;busy={n:a.n,t:0}}else{S.ap--;busy={t:0}}}
function finish(){const b=busy;busy=null;
 if(b.n){const n=b.n,i=S.bond[n.id];for(let k=0;k<16;k++)parts.push({x:n.fx,y:n.fy-16,vx:(Math.random()-.5)*2.4,vy:-Math.random()*2-1,l:50,c:'#ffd27a'});
  if(i<3){const st=n.st[i];S.bond[n.id]++;S.heard.push(n.id+i);chime(0);say(n.name,st.s,()=>{if(st.w&&!S.words.includes(st.w)){S.words.push(st.w);chime(2);toast(`📖 섬말 수첩에 ‘${SC.words[st.w][0].split(' ')[0]}’을(를) 적었다`)}dusk()})}
  else say(n.name,'"오늘도 고맙다. 바람 오는 날 꼭 가마."',dusk)}
 else{S.food+=3;say('나','혼자 밭을 맸다. 손바닥이 얼얼하다. 그래도 며칠 먹을 양식이 생겼다.',dusk)}}
function dusk(){if(S.ap<1)cap('해가 졌다. 집으로 돌아가자.')}
function nextDay(){cap();S.day++;S.food=Math.max(0,S.food-1);if(S.day===4){mode='storm';tm=0;S.came=NB.filter(n=>S.bond[n.id]>0);S.px=HOME.x+8;S.py=HOME.y+20;
  card(`다섯째 날.\n하늘이 낮게 내려앉았다.\n바람이 온다.`,'지붕으로')}else dayStart()}

/* ───────── 그리기 도구 ───────── */
const el=(a,b,rx,ry)=>{x.beginPath();x.ellipse(a,b,rx,ry,0,0,6.3);x.fill()};
const rr=(a,b,w,h,r)=>{x.beginPath();x.roundRect(a,b,w,h,r);x.fill()};
function mix(a,b,p){const A=parseInt(a.slice(1),16),B=parseInt(b.slice(1),16),f=(s)=>(((A>>s)&255)+(((B>>s)&255)-((A>>s)&255))*p)|0;return`rgb(${f(16)},${f(8)},${f(0)})`}
const J=()=>SC.theme==='jeju',O=()=>SC.theme==='oki',T=()=>SC.theme==='tw';
const STN={jeju:'#3f3c3a',oki:'#b8b0a0',tw:'#8a8680'},GL={jeju:[15,-11],oki:[0,-8],tw:[17,-11]};
function person(px,py,o){const g=o.k==='sol';x.save();x.translate(px,py);x.scale(o.dir||1,1);const sw=Math.sin(o.ph||0);
 x.fillStyle='#0003';el(0,13,9,3);
 x.fillStyle=g?'#33382e':o.b;x.fillRect(-5,3,4,10+sw);x.fillRect(1,3,4,10-sw);
 x.fillStyle=g?'#4c5342':o.c;rr(-7,-9,14,14,3);
 if(o.k==='woman'||o.k==='elder'){x.fillStyle=o.b;x.beginPath();x.moveTo(-7,1);x.lineTo(7,1);x.lineTo(8,10);x.lineTo(-8,10);x.fill()}
 if(o.baby){x.fillStyle='#e8dcc8';el(-8,-6,5,6);x.fillStyle='#f0d2b0';el(-9,-10,3.2,3.2)}
 x.strokeStyle=g?'#4c5342':o.c;x.lineWidth=3;x.lineCap='round';const lift=o.work?Math.abs(Math.sin(o.ph*.8))*9:0;
 x.beginPath();x.moveTo(5,-6);x.lineTo(9+sw,3-lift);x.stroke();
 if(o.work){x.strokeStyle='#5a4a38';x.lineWidth=1.6;x.beginPath();x.moveTo(9+sw,3-lift);x.lineTo(15+sw,-4-lift);x.stroke()}
 if(g){x.strokeStyle='#22241e';x.lineWidth=1.6;x.beginPath();x.moveTo(-4,4);x.lineTo(-7,-20);x.stroke()}
 if(o.board){x.fillStyle='#b08a50';x.fillRect(-4,-5,9,6);x.strokeStyle='#3a2a1a';x.lineWidth=.6;x.strokeRect(-4,-5,9,6)}
 x.fillStyle=g?'#b0a590':'#f0d2b0';el(0,-15,6.5,6.5);
 if(g){x.fillStyle='#3d4238';x.beginPath();x.arc(0,-16,7.2,Math.PI,0);x.fill();x.fillRect(-8,-17,16,2)}
 else if(o.k==='elder'){x.fillStyle='#d8d4cc';x.beginPath();x.arc(0,-16,6.8,Math.PI*.95,Math.PI*.05);x.fill();x.fillStyle='#f4efe4';x.beginPath();x.arc(0,-17.5,6.2,Math.PI,0);x.fill()}
 else if(o.k==='man'){x.fillStyle='#1e1a17';x.beginPath();x.arc(0,-16,6.8,Math.PI,0);x.fill();x.fillStyle='#d9c28a';el(0,-19,10,2.6);x.beginPath();x.arc(0,-20,5,Math.PI,0);x.fill()}
 else if(o.k==='woman'){x.fillStyle='#2a1e18';x.beginPath();x.arc(0,-16,6.9,Math.PI*.9,Math.PI*.1);x.fill();el(-5.5,-17,3,3)}
 else{x.fillStyle='#1e1a17';x.beginPath();x.arc(0,-16.5,6.8,Math.PI,0);x.fill();x.fillRect(-6.8,-17,13.6,2)}
 if(!g){x.fillStyle='#2b2620';x.fillRect(2.4,-15.5,1.8,2)}
 x.restore()}
function house(hx,hy,st){/* st: 0 온전 1 폐허 2 터만 */const j=J();
 if(st===2){x.fillStyle=STN[SC.theme];for(let i=-26;i<=26;i+=9)el(hx+i,hy-2,5,3.4);x.fillStyle='#6f9a58';for(let i=-22;i<=22;i+=7){x.fillRect(hx+i,hy-9-(i*i%5),1.5,8)}return}
 if(st===1){x.fillStyle=j?'#2e2b29':'#7a7468';x.beginPath();x.moveTo(hx-28,hy);x.lineTo(hx-28,hy-14);x.lineTo(hx-20,hy-9);x.lineTo(hx-12,hy-16);x.lineTo(hx-2,hy-7);x.lineTo(hx+9,hy-12);x.lineTo(hx+18,hy-6);x.lineTo(hx+28,hy-13);x.lineTo(hx+28,hy);x.fill();
  x.strokeStyle='#1a1817';x.lineWidth=2.5;x.beginPath();x.moveTo(hx-14,hy-10);x.lineTo(hx-18,hy-30);x.moveTo(hx+12,hy-8);x.lineTo(hx+16,hy-24);x.stroke();return}
 const lit=S.ap<1&&mode==='play';
 if(T()){const ab=st===3;x.fillStyle=ab?'#8a5648':'#a85a44';x.fillRect(hx-28,hy-22,56,22);x.strokeStyle='#8a463688';x.lineWidth=.8;for(let i=1;i<5;i++){x.beginPath();x.moveTo(hx-28,hy-22+i*4.4);x.lineTo(hx+28,hy-22+i*4.4);x.stroke()}
  x.fillStyle=ab?'#0c0a0a':'#4a3626';x.fillRect(hx-6,hy-17,12,17);x.fillStyle='#c8302a';x.fillRect(hx-10.5,hy-16,3,ab?6:13);if(!ab)x.fillRect(hx+7.5,hy-16,3,13);x.fillStyle=lit?'#ffd27a':'#221e1c';x.fillRect(hx+13,hy-15,8,7);
  x.fillStyle='#5c6268';x.beginPath();x.moveTo(hx-38,hy-19);x.lineTo(hx-27,hy-41);x.lineTo(hx+27,hy-41);x.lineTo(hx+38,hy-19);x.closePath();x.fill();x.save();x.clip();x.strokeStyle='#42474c';x.lineWidth=1;for(let i=-38;i<=38;i+=5){x.beginPath();x.moveTo(hx+i*.72,hy-41);x.lineTo(hx+i,hy-19);x.stroke()}x.restore();
  x.strokeStyle='#3a3e44';x.lineWidth=3;x.lineCap='round';x.beginPath();x.moveTo(hx-35,hy-47);x.quadraticCurveTo(hx-27,hy-41,hx,hy-41);x.quadraticCurveTo(hx+27,hy-41,hx+35,hy-47);x.stroke()}
 else if(j){x.fillStyle='#55514e';x.fillRect(hx-28,hy-22,56,22);x.fillStyle='#6d6965';for(let i=0;i<14;i++)el(hx-24+(i*17)%50,hy-18+(i*7)%16,4,2.6);
  x.fillStyle='#3a2e22';x.fillRect(hx-5,hy-16,10,16);x.fillStyle=lit?'#ffd27a':'#2a2622';x.fillRect(hx+11,hy-15,8,7);
  x.beginPath();x.moveTo(hx-35,hy-19);x.quadraticCurveTo(hx-30,hy-50,hx,hy-52);x.quadraticCurveTo(hx+30,hy-50,hx+35,hy-19);x.closePath();
  const g=x.createLinearGradient(0,hy-52,0,hy-19);g.addColorStop(0,'#dcbc6c');g.addColorStop(1,'#a8873f');x.fillStyle=g;x.fill();
  x.save();x.clip();x.strokeStyle='#6b573088';x.lineWidth=1;for(let i=-70;i<70;i+=9){x.beginPath();x.moveTo(hx+i,hy-52);x.lineTo(hx+i+34,hy-18);x.moveTo(hx+i+34,hy-52);x.lineTo(hx+i,hy-18);x.stroke()}x.restore();
  x.fillStyle='#4a4644';x.fillRect(hx-44,hy-12,4,12);x.fillRect(hx-56,hy-12,4,12);x.strokeStyle='#8a6a48';x.lineWidth=1.6;for(let i=0;i<3;i++){x.beginPath();x.moveTo(hx-56,hy-10+i*3.5);x.lineTo(hx-40,hy-10+i*3.5);x.stroke()}}
 else{x.fillStyle='#7d6042';x.fillRect(hx-27,hy-20,54,20);x.fillStyle=lit?'#e8b860':'#3a2c20';x.fillRect(hx-18,hy-16,36,16);x.fillStyle='#7d6042';x.fillRect(hx-1.5,hy-16,3,16);
  x.fillStyle='#c0503a';x.beginPath();x.moveTo(hx-38,hy-17);x.lineTo(hx-22,hy-45);x.lineTo(hx+22,hy-45);x.lineTo(hx+38,hy-17);x.closePath();x.fill();
  x.save();x.clip();x.strokeStyle='#f0e2d088';x.lineWidth=1.3;for(let i=-36;i<=36;i+=6){x.beginPath();x.moveTo(hx+i*.62,hy-45);x.lineTo(hx+i*1.05,hy-17);x.stroke()}x.restore();
  x.strokeStyle='#f0e6d8';x.lineWidth=2.4;x.beginPath();x.moveTo(hx-22,hy-45);x.lineTo(hx+22,hy-45);x.stroke();
  x.fillStyle='#a8683c';el(hx,hy-49,4.5,3.5);el(hx+3,hy-52,2.6,2.4);
  x.fillStyle='#b8b0a0';for(let i=-42;i<=-30;i+=6)el(hx+i,hy-3,4,3.5)}}
function tree(tx,ty,bare){const s=Math.sin(t*.03)*1.5+wind*10*Math.sin(t*.12);x.fillStyle='#0002';el(tx,ty+2,26,6);
 x.strokeStyle='#5a4432';x.lineWidth=8;x.lineCap='round';x.beginPath();x.moveTo(tx,ty);x.quadraticCurveTo(tx-3,ty-22,tx+s*.3,ty-34);x.stroke();
 x.lineWidth=4;x.beginPath();x.moveTo(tx,ty-24);x.lineTo(tx-16+s*.5,ty-44);x.moveTo(tx,ty-26);x.lineTo(tx+17+s*.5,ty-46);x.stroke();
 if(bare){x.lineWidth=1.6;[[-16,-44,-26,-58],[-16,-44,-10,-62],[17,-46,28,-60],[17,-46,10,-64],[0,-34,2,-66]].forEach(([a,b,c,d])=>{x.beginPath();x.moveTo(tx+a,ty+b);x.lineTo(tx+c+s,ty+d);x.stroke()});return}
 if(T()){x.strokeStyle='#5a443288';x.lineWidth=1;for(let i=-22;i<=24;i+=7){x.beginPath();x.moveTo(tx+i+s*.5,ty-42);x.lineTo(tx+i*.8,ty-12-(i*i%9));x.stroke()}}
 const c=J()?['#4a7a42','#5c8c4c','#6f9c58']:['#2f6a4a','#3c7c54','#4f8c5e'];
 [[-20,-48,17,0],[18,-50,17,0],[0,-62,20,1],[-8,-46,15,1],[10,-44,14,2],[0,-56,13,2]].forEach(([a,b,r,k])=>{x.fillStyle=c[k];el(tx+a+s*(1+k*.3),ty+b,r,r*.85)})}
function animal(ax,ay){x.fillStyle='#0003';el(ax,ay+9,12,3);if(T()){x.fillStyle='#55595e';rr(ax-13,ay-7,24,14,6);el(ax+13,ay-5,6,5.5);x.fillRect(ax-10,ay+5,3.4,6);x.fillRect(ax+5,ay+5,3.4,6);x.strokeStyle='#2c2e30';x.lineWidth=2;x.lineCap='round';x.beginPath();x.moveTo(ax+10,ay-9);x.quadraticCurveTo(ax+4,ay-14,ax+2,ay-9);x.moveTo(ax+16,ay-9);x.quadraticCurveTo(ax+22,ay-14,ax+23,ay-8);x.stroke()}
 else if(J()){x.fillStyle='#4a3628';rr(ax-12,ay-6,22,13,5);el(ax+12,ay-6,5.5,5);x.fillRect(ax-10,ay+5,3,6);x.fillRect(ax+5,ay+5,3,6);x.fillStyle='#e8dcc8';x.fillRect(ax+10,ay-12,1.5,4);x.fillRect(ax+14,ay-12,1.5,4)}
 else{x.fillStyle='#f0ece2';rr(ax-9,ay-3,17,10,4);el(ax+9,ay-4,4.2,4);x.fillRect(ax-7,ay+5,2.4,6);x.fillRect(ax+4,ay+5,2.4,6);x.fillStyle='#8a7a68';x.fillRect(ax+8,ay-10,1.2,4);x.fillRect(ax+10.5,ay-10,1.2,4);x.fillRect(ax+11,ay-1,1,4)}}
function bubble(px,py,text){x.font='12px "Noto Sans KR"';const w=Math.min(250,x.measureText(text).width+16),bx=Math.max(4,Math.min(W-w-4,px-w/2)),by=py-66;
 x.fillStyle='#fffaf0ee';rr(bx,by,w,24,8);x.fillStyle='#2b2620';x.textAlign='left';x.fillText(text,bx+8,by+16,w-16)}

/* ───────── 배경 ───────── */
function back(){const m=mode,j=J(),p=m==='play'?(3-S.ap)/3:0;let a,b;
 if(m==='storm'){a='#333b46';b='#5a646e'}else if(m==='after'){a=j?'#8f999f':T()?'#4e5a72':'#6b6460';b=j?'#cdd3d6':T()?'#a4acb8':'#b89a80'}else if(m==='now'){a='#6fb6dc';b='#d6eef0'}
 else if(p>=1){a='#141a3a';b='#3a3a5e'}else{a=mix('#7fc0dc','#d98a5e',p);b=mix('#d8ecdc','#f6cf9c',p)}
 const g=x.createLinearGradient(0,0,0,100);g.addColorStop(0,a);g.addColorStop(1,b);x.fillStyle=g;x.fillRect(0,0,W,100);
 if(m==='play'&&p>=1){x.fillStyle='#fff';for(let i=0;i<40;i++){x.globalAlpha=.4+.6*Math.abs(Math.sin(t*.02+i));x.fillRect((i*97)%W,(i*53)%80,1.3,1.3)}x.globalAlpha=1;x.fillStyle='#f4eec8';el(96,34,11,11)}
 else if(m==='play'||m==='now'||m==='title'){x.fillStyle=p>.5?'#ffb070':'#fff6d0';el(540-p*90,26+p*46,13,13)}
 x.fillStyle=m==='storm'?'#77808a':p>=1?'#4a4f70':'#ffffffcc';clouds.forEach(c=>{c.x=(c.x+.08+wind*2)%(W+120);const cx=c.x-60;el(cx,c.y,c.w*.5,9);el(cx+c.w*.25,c.y-6,c.w*.28,9);el(cx-c.w*.22,c.y-3,c.w*.24,7)});
 if(O()&&m==='play'&&S.day===3){for(let i=0;i<9;i++){x.fillStyle=`rgba(25,22,22,${.55-i*.05})`;el(66+i*7+Math.sin(t*.02+i)*4,84-i*9,12+i*3.4,10+i*1.6)}}
 if(O()&&m==='after'){for(let k=0;k<3;k++)for(let i=0;i<7;i++){x.fillStyle=`rgba(30,26,24,${.5-i*.06})`;el(110+k*200+i*6,88-i*10,11+i*3,9+i*1.5)}}
 // 산
 const sn=m==='after'&&j;
 if(j){x.fillStyle=sn?'#c4ccd0':p>=1?'#2a3350':'#93aaa4';x.beginPath();x.moveTo(40,100);x.quadraticCurveTo(250,60,330,30);x.quadraticCurveTo(350,26,372,31);x.quadraticCurveTo(470,62,640,92);x.lineTo(640,100);x.fill()}
 if(T()){x.fillStyle=p>=1?'#2a3350':m==='after'?'#6a7a88':m==='storm'?'#5a6a70':'#7fa5a0';x.beginPath();x.moveTo(0,100);[[0,70],[60,52],[120,72],[200,30],[275,64],[350,24],[430,60],[520,34],[600,66],[640,54],[640,100]].forEach(q=>x.lineTo(q[0],q[1]));x.fill()}
 x.fillStyle=sn?'#aab4b6':p>=1?'#26402e':j?'#6d8f56':T()?(m==='after'?'#4a6a5a':'#4a8a60'):'#5a8a58';el(470,104,150,j?44:T()?50:30);x.fillStyle=sn?'#9aa6a8':p>=1?'#1f3628':j?'#5d7f4a':T()?(m==='after'?'#3f5f50':'#3f7a54'):'#4c7c4e';el(150,106,170,j?34:T()?44:26);
 if(T()){x.fillStyle=`rgba(255,255,255,${m==='after'?.5:.3})`;for(let i=0;i<4;i++)el((i*190+t*.15)%(W+200)-100,84+(i%2)*8,90,6);
  x.strokeStyle=p>=1?'#1f4a34':'#5a9a58';x.lineWidth=2;for(let i=0;i<26;i++){const bx=18+i*4.2+(i>12?500:0),sw2=Math.sin(t*.03+i)*1.2+wind*8;x.beginPath();x.moveTo(bx,112);x.quadraticCurveTo(bx,96,bx+sw2,80+(i%4)*3);x.stroke()}
  if(m==='play'&&S.day===2&&S.ap<=1){x.fillStyle='#3a2e22';x.fillRect(498,72,14,9);x.fillStyle=`rgba(255,200,100,${.7+.3*Math.sin(t*.08)})`;x.fillRect(502,75,5,4)}}
 if(O()&&(m==='now'||m==='play'||m==='after'||m==='storm')){x.fillStyle='#1a1614';el(566,92,13,9);if(m==='now'){const cs=['#e0564a','#f0c040','#5aa0d8','#70b860','#e88ab0'];for(let i=0;i<14;i++){x.fillStyle=cs[i%5];x.fillRect(555+i*1.6,84+Math.sin(i*.9)*2+i*.9,2,5)}}}
 if(j&&m==='play'&&S.day===2&&S.ap<=1)for(let i=0;i<4;i++){x.fillStyle=`rgba(255,170,80,${.5+.5*Math.sin(t*.1+i*2)})`;el(420+i*30,74+(i%2)*8,2.2,2.2)}
 // 땅
 const land=sn?'#e4e8ea':m==='after'?(T()?'#87928a':'#9a9278'):m==='storm'?(j?'#8f9a68':'#7f9a60'):j?'#b3b877':T()?'#8fba70':'#9cc070';x.fillStyle=land;x.fillRect(0,98,W,254);
 x.fillStyle=sn?'#d4d9dc':m==='now'?(j?'#a9b877':'#93bc6c'):'#cdbb8c';x.fillRect(0,226,W,18);x.fillRect(311,244,18,106);
 // 바다
 const sg=x.createLinearGradient(0,350,0,H);sg.addColorStop(0,m==='storm'?'#2d4048':j?'#3a6a78':T()?'#4a8a7a':'#2f9aa8');sg.addColorStop(1,j?'#1f3e48':T()?'#2a5a52':'#1c5a78');x.fillStyle=sg;x.fillRect(0,350,W,50);
 x.fillStyle=j?'#2a2826':T()?'#9a9a92':'#e8dcb8';for(let i=0;i<W;i+=14)el(i+7,351+Math.sin(i)*1.5,9,3.5);
 x.strokeStyle='#ffffff66';x.lineWidth=1.2;for(let r=0;r<3;r++){x.beginPath();for(let i=0;i<=W;i+=8)x.lineTo(i,366+r*11+Math.sin(i*.05+t*(.04+wind*.08)+r)*(2+wind*4));x.stroke()}
 if(O()&&m==='after'){x.fillStyle='#2a2e30';for(let i=0;i<9;i++){const sx=30+i*72,sy=372+(i%3)*8;x.fillRect(sx,sy,34,5);x.fillRect(sx+10,sy-5,12,5);x.fillRect(sx+15,sy-10,2,5)}}
 // 풀·억새·사탕수수
 if(m!=='after'||!sn)deco.forEach(d=>{const s=Math.sin(t*.04+d.x)*1.5+wind*7;if(j){x.strokeStyle='#8a8f58';x.lineWidth=1;x.beginPath();x.moveTo(d.x,d.y);x.lineTo(d.x+s,d.y-9);x.stroke();if(d.s>.45){x.strokeStyle='#f2efe2';x.lineWidth=2;x.beginPath();x.moveTo(d.x+s,d.y-9);x.lineTo(d.x+s*1.6+2,d.y-14);x.stroke()}}
  else if(T()){x.strokeStyle='#4f9a4a';x.lineWidth=1.2;x.beginPath();x.moveTo(d.x,d.y);x.lineTo(d.x+s,d.y-7);x.moveTo(d.x+3,d.y);x.lineTo(d.x+3+s,d.y-5);x.stroke();if(d.s>.8){x.fillStyle='#fff';el(d.x+s,d.y-8,1.4,1.4)}}
  else{if(d.s>.75){x.fillStyle='#3c8a4c';el(d.x,d.y-3,5,4);x.fillStyle='#e0403a';el(d.x-2+s*.2,d.y-5,1.8,1.8);el(d.x+3,d.y-2,1.6,1.6)}else{x.strokeStyle='#5c9a4a';x.lineWidth=1.2;x.beginPath();x.moveTo(d.x,d.y);x.lineTo(d.x+s,d.y-7);x.stroke()}}});
 // 돌담
 x.fillStyle=STN[SC.theme];[[16,222,262],[362,222,262],[16,248,286],[338,248,286]].forEach(([a,b,c])=>{for(let i=a;i<a+c;i+=9)el(i+4.5,b+(i%18?0:1),5,4)});
 if(j&&(m==='play')&&S.day>=2){x.fillStyle='#f4efe0';x.fillRect(268,208,9,11);x.fillStyle='#555';for(let i=0;i<4;i++)x.fillRect(269.5,210+i*2.2,6,.7)}
 if(T()&&m==='play'&&S.day>=1){x.fillStyle='#c8302a';x.fillRect(254,205,26,11);x.fillStyle='#fff';for(let i=0;i<5;i++)x.fillRect(257+i*4.4,208,2.6,5)}
 if(m==='after'||m==='now')return;
 // 일터
 const g0=NB[0],d0=NB[1],m0=NB[2];
 if(T()){x.fillStyle='#6a8a48';x.fillRect(g0.fx-26,g0.fy-12,52,24);x.fillStyle='#2f6a3a';for(let r=0;r<3;r++)for(let i=-22;i<=22;i+=7)el(g0.fx+i,g0.fy-7+r*8,4.4,3.2)}
 else if(j){x.fillStyle='#b89a50';x.fillRect(g0.fx-26,g0.fy-12,52,24);x.strokeStyle='#e0c060';x.lineWidth=2;for(let i=-22;i<=22;i+=6){const s=Math.sin(t*.05+i)*1+wind*5;x.beginPath();x.moveTo(g0.fx+i,g0.fy+10);x.lineTo(g0.fx+i+s,g0.fy-8);x.stroke()}}
 else{x.fillStyle='#6a8a48';x.fillRect(g0.fx-26,g0.fy-12,52,24);x.strokeStyle='#8fc060';x.lineWidth=2.2;for(let i=-22;i<=22;i+=5){const s=Math.sin(t*.05+i)*1.4+wind*6;x.beginPath();x.moveTo(g0.fx+i,g0.fy+10);x.lineTo(g0.fx+i+s,g0.fy-20);x.stroke()}}
 if(T()){x.strokeStyle='#9ab85a';x.lineWidth=2.4;for(let i=0;i<6;i++){x.beginPath();x.moveTo(d0.fx-18,d0.fy+6-i*2.4);x.lineTo(d0.fx+16,d0.fy+2-i*2.4);x.stroke()}}
 else if(j){x.fillStyle='#c8a850';for(let i=0;i<4;i++)el(d0.fx-10+i*7,d0.fy+4-i%2*5,9,4)}else{x.fillStyle='#b8b0a0';for(let i=0;i<7;i++)el(d0.fx-12+(i%4)*8,d0.fy+5-(i>3?7:0),5,4)}
 x.fillStyle=j?'#4a4644':T()?'#8a8680':'#a8a090';el(m0.fx,m0.fy,13,7);x.fillStyle='#2a5a6a';el(m0.fx,m0.fy-1,9,4.4);
 x.fillStyle='#8a7448';x.fillRect(FIELD.x-40,FIELD.y-17,80,34);x.strokeStyle='#6b5a34';x.lineWidth=1;for(let i=0;i<5;i++){x.beginPath();x.moveTo(FIELD.x-36,FIELD.y-12+i*6);x.lineTo(FIELD.x+36,FIELD.y-12+i*6);x.stroke()}
 x.fillStyle='#6a9a48';for(let i=0;i<Math.min(18,S.food*3);i++)el(FIELD.x-33+(i%9)*8,FIELD.y-9+(i>8?12:0),2.6,2.6)}

/* ───────── 메인 루프 ───────── */
function frame(noDraw){t++;if(noDraw){const c=x;x=NOP;try{frameBody()}finally{x=c}}else frameBody()}
function frameBody(){x.clearRect(0,0,W,H);back();const dr=[],m=mode;
 const hs=m==='after'?(T()?3:1):m==='now'?2:0;
 NB.forEach(n=>dr.push([n.y-12,()=>house(n.x,n.y-12,hs)]));dr.push([HOME.y,()=>{house(HOME.x,HOME.y,hs);
  if(m==='storm'&&tm>90&&S.came.length){x.strokeStyle='#d9c8a0';x.lineWidth=1.2;S.came.forEach(n=>{x.beginPath();x.moveTo(HOME.x,HOME.y-46);x.lineTo(n.cx,n.cy-4);x.stroke()})}}]);
 dr.push([TREE.y,()=>tree(TREE.x,TREE.y,m==='after'&&J())]);
 if(O()&&m!=='after'&&m!=='now')NB.forEach(n=>dr.push([n.y-14,()=>{x.fillStyle='#2f6a4a';el(n.x+42,n.y-34+Math.sin(t*.03)*.5,9,15);x.fillStyle='#5a4432';x.fillRect(n.x+40.5,n.y-20,3,8)}]));
 if(m==='now'){if(J())dr.push([258,()=>{x.fillStyle='#4a4644';rr(352,236,16,22,3);x.fillStyle='#d8d4cc';for(let i=0;i<4;i++)x.fillRect(355,240+i*4,10,1.2);x.fillStyle='#3c7a4a';for(let i=0;i<9;i++){x.fillRect(120+i*5,132-(i%3)*6,2,34)}}]);
  else if(T())dr.push([258,()=>{x.fillStyle='#8a8680';rr(350,222,12,36,2);x.fillStyle='#6a6660';x.fillRect(346,256,20,4);x.fillStyle='#2f6a3a';NB.forEach(n=>{for(let r=0;r<2;r++)for(let i=-24;i<=24;i+=8)el(n.x+i,n.y-6+r*9,4.6,3.4)})}]);
  else dr.push([258,()=>{x.strokeStyle='#8fc060';x.lineWidth=2.2;for(let k=0;k<4;k++){const n=NB[k];for(let i=-30;i<=30;i+=5){x.beginPath();x.moveTo(n.x+i,n.y+4);x.lineTo(n.x+i+Math.sin(t*.04+i)*1.5,n.y-24);x.stroke()}}}])}
 // 이동
 if(m==='play'&&!busy&&!open()){let dx=0,dy=0;if(keys.ArrowLeft||keys.a)dx--;if(keys.ArrowRight||keys.d)dx++;if(keys.ArrowUp||keys.w)dy--;if(keys.ArrowDown||keys.s)dy++;
  if(dx||dy)tgt=null;else if(tgt){const vx=tgt.x-S.px,vy=tgt.y-S.py,d=Math.hypot(vx,vy);if(d<4)tgt=null;else{dx=vx/d;dy=vy/d}}
  if(dx||dy){const d=Math.hypot(dx,dy);S.px=Math.max(12,Math.min(W-12,S.px+dx/d*2.3));S.py=Math.max(104,Math.min(346,S.py+dy/d*2.3));S.walk+=.4;if(Math.abs(dx)>.2)S.dir=dx>0?1:-1}}
 const me=o=>Object.assign({k:'me',c:SC.me.c,b:SC.me.b},o);
 if(m==='play'||m==='title'){const b0=NB[3];dr.push([b0.fy,()=>animal(b0.fx,b0.fy)]);
  NB.forEach(n=>{const w=busy&&busy.n===n,px=w?n.fx-14:n.x,py=w?n.fy+6:n.y;dr.push([py,()=>{person(px,py,{k:n.k,c:n.c,b:n.b,baby:n.baby,dir:1,ph:w?t*.3:0,work:w,board:O()&&n.id==='b'&&S.day>=1&&S.day<4});
   if(!w&&m==='play'){x.textAlign='center';x.font='600 11px "Noto Sans KR"';x.lineWidth=3;x.strokeStyle='#0008';x.strokeText(n.name,n.x,n.y+27);x.fillStyle='#fff';x.fillText(n.name,n.x,n.y+27);x.fillStyle='#ffd27a';x.font='9px sans-serif';x.fillText('●'.repeat(S.bond[n.id])+'○'.repeat(3-S.bond[n.id]),n.x,n.y+38);x.textAlign='left'}}])});
  if(m==='play'){if(busy){const n=busy.n,tx=n?n.fx+14:FIELD.x,ty=n?n.fy+6:FIELD.y;S.px+=(tx-S.px)*.1;S.py+=(ty-S.py)*.1;busy.t++;S.walk+=.3;S.dir=n?-1:1;if(busy.t%14===0)parts.push({x:tx-6,y:ty,vx:(Math.random()-.5),vy:-1.2,l:24,c:J()?'#e0c060':T()?'#4f9a4a':'#8fc060'});if(busy.t>=120)finish()}
   dr.push([S.py,()=>{person(S.px,S.py,me({dir:S.dir,ph:S.walk,work:!!busy}));if(busy){x.fillStyle='#0007';rr(S.px-22,S.py-50,44,6,3);x.fillStyle='#ffd27a';rr(S.px-22,S.py-50,44*busy.t/120,6,3)}}]);
   if(S.day===3||(O()&&S.day===2)){sold+=.7;if(sold>W+120)sold=-260;for(let i=0;i<4;i++)dr.push([236,()=>person(sold-i*24,236,{k:'sol',dir:1,ph:t*.25+i})])}}}
 if(m==='storm'&&!open()){tm++;wind=Math.min(1,tm/120);for(let i=0;i<(RM?2:7);i++)rain.push({x:Math.random()*W+160,y:-10,v:7+Math.random()*4});
  const ok=S.came.length>=3;S.came.forEach((n,i)=>{const p=Math.min(1,tm/110),ax=HOME.x-66+i*42+(i>1?10:0),ay=HOME.y+26+(i%2)*8;n.cx=n.x+(ax-n.x)*p;n.cy=n.y+(ay-n.y)*p;dr.push([n.cy,()=>person(n.cx,n.cy,{k:n.k,c:n.c,b:n.b,baby:n.baby,dir:n.cx<HOME.x?1:-1,ph:tm*.3,work:p>=1})])});
  dr.push([S.py,()=>person(S.px,S.py,me({dir:-1,ph:tm*.25,work:true}))]);
  if(!ok&&tm>130&&tm%5===0)parts.push({x:HOME.x+Math.random()*30-15,y:HOME.y-44,vx:-3-Math.random()*3,vy:-1-Math.random(),l:70,c:J()?'#c8a850':T()?'#5c6268':'#c0503a'});
  if(tm===60)cap(S.came.length?`${S.came.map(n=>n.name).join(', ')}가 밧줄을 들고 왔다.`:'아무도 오지 않았다. 다들 제 지붕 붙들기에도 바빴다.');
  if(tm===250)cap(ok?SC.stormOk:SC.stormNo);
  if(tm===470){cap();card(ok?SC.ok:SC.fail,'그 뒤의 이야기',()=>{mode='after';tm=0;wind=0;rain=[]})}}
 if(m==='after'&&T())for(let i=0;i<8;i++)dr.push([236,()=>person(50+i*77,236,{k:'sol',dir:i%2?-1:1,ph:0})]);
 if(m==='after'&&!open()){tm++;if(tm===110)card(SC.after,'세월이 흐른 뒤',()=>{mode='now';tm=0;rain=[]},true)}
 if(m==='now'&&!open()){tm++;if(tm===30)cap(SC.nowCap);if(tm===260){cap();reveal()}}
 dr.sort((a,b)=>a[0]-b[0]).forEach(d=>d[1]());
 // 조명
 if(m==='play'){const p=(3-S.ap)/3;if(p>=1){x.fillStyle='rgba(14,18,58,.5)';x.fillRect(0,0,W,H);x.globalCompositeOperation='lighter';[...NB.map(n=>[n.x+GL[SC.theme][0],n.y-12+GL[SC.theme][1]]),[HOME.x+GL[SC.theme][0],HOME.y+GL[SC.theme][1]]].forEach(([a,b])=>{const g=x.createRadialGradient(a,b,2,a,b,34);g.addColorStop(0,'rgba(255,190,90,.55)');g.addColorStop(1,'rgba(255,190,90,0)');x.fillStyle=g;x.fillRect(a-34,b-34,68,68)});x.globalCompositeOperation='source-over'}
  else if(p>0){x.fillStyle=`rgba(255,130,50,${.13*p})`;x.fillRect(0,0,W,H)}
  const am=SC.amb[S.day];if(am&&!busy&&!dq){const n=NB.find(v=>v.id===am[0]);if(Math.hypot(n.x-S.px,n.y-S.py)<120&&Math.hypot(n.x-S.px,n.y-S.py)>40)bubble(n.x,n.y,am[1])}}
 if(m==='storm'){x.strokeStyle='#cfe0ff99';x.lineWidth=1;rain.forEach(r=>{r.y+=r.v;r.x-=r.v*.7;x.beginPath();x.moveTo(r.x,r.y);x.lineTo(r.x-6,r.y+9);x.stroke()});rain=rain.filter(r=>r.y<H);
  x.strokeStyle='#ffffff22';x.lineWidth=2;for(let i=0;i<5;i++){const wy=(i*83+t*3)%H,wx=W-((t*9+i*190)%(W+200));x.beginPath();x.moveTo(wx,wy);x.lineTo(wx+90,wy-10);x.stroke()}x.fillStyle='rgba(10,14,24,.28)';x.fillRect(0,0,W,H)}
 if(m==='after'&&J()){if(t%2===0)rain.push({x:Math.random()*W,y:-5,v:.7+Math.random()});x.fillStyle='#fff';rain.forEach(r=>{r.y+=r.v;r.x+=Math.sin(r.y/20)*.4;x.fillRect(r.x,r.y,2,2)});rain=rain.filter(r=>r.y<H)}
 if(m==='after'&&O()){x.fillStyle='rgba(60,30,10,.18)';x.fillRect(0,0,W,H)}
 if(m==='after'&&T()){x.fillStyle='rgba(30,40,80,.28)';x.fillRect(0,0,W,H)}
 if(windG)windG.gain.value+=((muted||m==='title'?0:m==='storm'&&!open()?.3:.035)-windG.gain.value)*.05;
 if((m==='play'&&S.ap>0)||m==='now'){x.strokeStyle='#33333388';x.lineWidth=1.3;for(let i=0;i<3;i++){const bx=(t*.9+i*230)%(W+80)-40,by=30+i*14+Math.sin(t*.05+i)*5,f=Math.sin(t*.25+i)*3;x.beginPath();x.moveTo(bx-5,by-f);x.lineTo(bx,by);x.lineTo(bx+5,by-f);x.stroke()}}
 if(m==='play'&&S.ap===3&&t%9===0)[...NB.map(n=>[n.x-12,n.y-58]),[HOME.x-12,HOME.y-48]].forEach(([a,b])=>parts.push({x:a,y:b,vx:.25+Math.random()*.3,vy:-.5,l:60,c:'#ffffff55',g:1}));
 parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;if(!p.g)p.vy+=.05;p.l--;x.fillStyle=p.c;x.fillRect(p.x,p.y,3,3)});parts=parts.filter(p=>p.l>0);
 const q=near();if(tgt&&tgt.auto&&q&&q.id===tgt.auto&&!(q.type!=='home'&&S.ap<1)){tgt=null;act()}
 const a=near(),ab=$('act');ab.style.display=a?'block':'none';if(a)ab.textContent=label(a);
 hud()}
/* 화면 주사율(60·90·120Hz)과 상관없이 같은 속도로 흐르도록 1/60초 단위로 진행 */
let last=0,acc=0;const STEP=1000/60;
function loop(now){requestAnimationFrame(loop);const dt=Math.min(100,now-(last||now));last=now;acc+=dt;let n=0;while(acc>=STEP&&n<4){acc-=STEP;n++}if(n)for(let i=0;i<n;i++)frame(i<n-1)}
function resultText(){const li=NB.map(n=>n.st.map((s,i)=>S.heard.includes(n.id+i)?`- ${n.name}: ${s.t}`:'').filter(Boolean).join('\n')).filter(Boolean).join('\n');
 return `[품 — ${SC.label}]\n들은 이야기 ${S.heard.length}/12\n${li}\n\n그날의 선택\n${S.ch.map(c=>`- ${c[0]}: ${c[1]}`).join('\n')}\n\n배운 섬말: ${S.words.map(k=>SC.words[k][0]).join(', ')||'없음'}\n지붕을 함께 지킨 이웃: ${S.came.map(n=>n.name).join(', ')||'없음'}`}
function copyResult(b){const tx=resultText(),done=()=>{b.textContent='복사했어요 ✓'},fb=()=>{const ta=document.createElement('textarea');ta.value=tx;ta.style.cssText='width:100%;height:9em;margin-top:10px;font:13px sans-serif';b.after(ta);ta.select();b.textContent='아래 글을 길게 눌러 복사하세요'};
 try{navigator.clipboard.writeText(tx).then(done,fb)}catch(e){fb()}}
function reveal(){clearSave();const li=NB.map(n=>n.st.map((s,i)=>S.heard.includes(n.id+i)?`<li>${n.name} — ${s.t}</li>`:'<li class="no">· · ·</li>').join('')).join('');
 const ws=S.words.map(k=>SC.words[k][0].split(' ')[0]).join(' · ')||'없음';const cs=S.ch.map(c=>`<li>${c[0]} — ${c[1]}</li>`).join('');const others='<button class="btn" style="background:#2b2620;border:1px solid #666" onclick="copyResult(this)">📋 내 결과 복사 (모둠 토론용)</button><br>'+Object.values(SCS).filter(s=>s.key!==SC.key).map(s=>`<button class="btn alt" onclick="start('${s.key}')">${s.emoji||''} ${s.short||s.label}</button>`).join('');
 card(`${SC.rev}<h3>당신이 들은 이야기 ${S.heard.length} / 12</h3><ul>${li}</ul>듣지 못한 이야기는 여기 적히지 않습니다. 실제로도 많은 이야기가 그렇게, 들어 줄 사람을 만나지 못한 채 남았습니다.<h3>당신의 선택</h3><ul>${cs}</ul><h3>당신이 배운 섬말</h3>${ws}

제주의 <b>수눌음</b>, 오키나와의 <b>유이마루</b>, 대만의 <b>방반(放伴)</b>. 섬마다 연결의 말이 있었습니다.<h3>함께 이야기해 봅시다</h3><ul>${QS.map(q=>`<li>${q}</li>`).join('')}</ul><div class="note">※ 데모 버전입니다. 등장인물과 마을은 창작이며, 역사적 배경 서술은 전공 연구진의 검토를 거쳐 보완할 예정입니다. 정식판에서는 실제 구술 음성과 사진 아카이브가 이 자리에 이어집니다.<br>경희대학교 글로벌류큐·오키나와연구소</div>${others}`,'처음으로',title,true)}
