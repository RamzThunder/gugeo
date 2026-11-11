/* 게임 동작 코드. 대사는 story.js, 그림 경로는 assets.js에 있습니다. */
const TYPES=["직접","돌려","안으로"], TLABEL={직접:"직접 말하기",돌려:"돌려 말하기",안으로:"안으로 향하기"};
const KEY="censor-escape-v1";
let ROOT=document;
const $=s=>ROOT.querySelector(s);
const $$=s=>ROOT.querySelectorAll(s);
// story.js의 TEXT 문구에서 {분} {힌트초} {조} 같은 자리를 채움
const T=(s,o)=>String(s).replace(/\{([^{}]+)\}/g,(m,k)=>{const v=Object.assign({분:CONFIG.minutes,힌트초:CONFIG.hintPenaltySec,조:S.group},o)[k];return v==null?m:v;});
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
let S={group:null,start:null,penalty:0,extra:0,stage:0,hints:0,done:null,approved:false,sus:0,grilled:0,epi:false,poem:"",meaning:""};
try{const r=localStorage.getItem(KEY); if(r) S=Object.assign(S,JSON.parse(r));}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
let tick=null, ui={sel:{},per:{},cls:{},stamped:false,quiz:null,hintOn:null,s3ok:false};

function remain(){ if(!S.start) return CONFIG.minutes*60;
  const end=S.done||Date.now(); return Math.round(CONFIG.minutes*60+S.extra-(end-S.start)/1000-S.penalty); }
const fmt=t=>{const a=Math.abs(t);return (t<0?"+":"")+String(Math.floor(a/60)).padStart(2,"0")+":"+String(a%60).padStart(2,"0")};
function bar(){
  const st=[1,2,3].map(n=>`<i class="${S.stage>n?"done":S.stage===n?"on":""}"></i>`).join("");
  return `<div class="bar"><span class="grp">${S.group}조</span><span class="steps" aria-label="진행">${st}</span>
  <span class="sus" title="의심도"><span>의심도</span><span class="g"><i></i></span></span><span class="time clk" role="timer">${fmt(remain())}</span></div>`;
}
function paintSus(){document.querySelectorAll(".sus").forEach(e=>{e.querySelector("i").style.width=Math.min(100,S.sus)+"%";
  e.classList.toggle("hi",S.sus>=50); e.classList.toggle("max",S.sus>=80);});}
function addSus(n){
  S.sus+=n;
  if(S.sus>=100){ S.grilled++; S.penalty+=60; S.sus=40; save(); paintSus(); paintClock();
    const o=document.createElement("div");o.className="overlay";o.setAttribute("role","dialog");
    o.innerHTML='<div class="card" style="border-color:var(--stamp)">'+stageHTML("interro","bossSus")+`<h2>${T(TEXT.grill.title)}</h2><p>${T(TEXT.grill.line)}</p><p class="note">${T(TEXT.grill.note)}</p><button class="btn" id="ox" type="button">${T(TEXT.grill.btn)}</button></div>`;
    document.body.appendChild(o); o.querySelector("#ox").onclick=()=>o.remove(); return; }
  save(); paintSus();
}
function paintClock(){const r=remain(); document.querySelectorAll(".clk").forEach(c=>{c.textContent=fmt(r); c.classList.toggle("over",r<0);});}
function startTick(){paintSus();clearInterval(tick); tick=setInterval(paintClock,1000);}
function hint(text,key){
  S.hints++; S.penalty+=CONFIG.hintPenaltySec; save(); paintClock();
  return text;
}
function foot(){return `<div class="foot"><span>${T(TEXT.common.hintFoot)}</span><span><button id="rbtn" type="button">${T(TEXT.common.restart)}</button> <button id="tbtn" type="button">${T(TEXT.common.teacher)}</button></span></div>`;}
const SPRH={guard:"84%",guardCalm:"84%",guardSus:"84%",boss:"88%",bossSus:"88%",contact:"86%",contactSide:"86%",contactHappy:"86%"};
const sprKey=(k,m)=>!k?k:(({guard:{calm:"guardCalm",sus:"guardSus"},boss:{sus:"bossSus"},contact:{side:"contactSide",happy:"contactHappy"}}[k]||{})[m])||k;
function stageHTML(bg,spr){
  return `<div class="stage"><img class="bgimg" src="${IMG[bg]}" alt="">${spr?`<span class="sw" style="--h:${SPRH[spr]}"><img class="spr0" src="${IMG[spr]}" alt="">${BLP[spr]?`<img class="pt" style="left:${BLP[spr].l}%;top:${BLP[spr].t}%;width:${BLP[spr].w}%;visibility:hidden" src="${BLP[spr].s}" alt="">`:''}</span>`:''}</div>`;
}
let vnTimer=null, vnStop=()=>{};
(function blinkLoop(){
  const rm=matchMedia("(prefers-reduced-motion: reduce)").matches; if(rm) return;
  const once=cb=>{const b=document.querySelector(".stage .pt,.overlay .pt"); if(!b){cb&&cb();return;} b.style.visibility="visible"; setTimeout(()=>{b.style.visibility="hidden"; cb&&cb();},120);};
  const go=()=>setTimeout(()=>{ once(()=>{ if(Math.random()<.2) setTimeout(()=>once(),160); }); go(); },2500+Math.random()*3000);
  go();
})();
function playVN(script,done){
  const a=$("#app"); let i=0, typing=false, full="", pos=0, bg="gate";
  a.innerHTML=`<div class="vn"><div class="vtop"><span>${S.group}조</span><button type="button" id="vskip">${T(TEXT.common.skip)}</button></div>
   <div class="pixwrap" id="vstage"></div>
   <div class="vbox" id="vbox" tabindex="0"><div class="vnm" id="vnm"></div><div class="vtx" id="vtx" aria-live="polite"></div><div class="vflash" id="vfl"></div><div class="vch" id="vch"></div><span class="vnx" id="vnx">▼</span></div></div>`;
  let capTimer=null;
  vnStop=()=>{clearInterval(vnTimer);clearTimeout(capTimer);};
  const end=()=>{vnStop();done();};
  $("#vskip").onclick=end;
  const idx=id=>script.findIndex(x=>x.id===id);
  const show=()=>{
    const st=script[i]; if(!st){end();return;}
    if(st.bg) bg=st.bg;
    clearTimeout(capTimer);
    if(st.caption){ // 장면 자막: 사람 없이 배경 위에 글만 떴다가 저절로 넘어감
      $("#vbox").style.visibility="hidden";
      $("#vstage").innerHTML=stageHTML(bg)+`<div class="vcap"><span>${st.caption}</span></div>`;
      $("#vstage").onclick=next; capTimer=setTimeout(next,3400); return;
    }
    $("#vbox").style.visibility=""; $("#vstage").onclick=null;
    $("#vstage").innerHTML=stageHTML(bg,sprKey(st.spr,st.mood));
    $("#vnm").textContent=st.who||""; const tx=$("#vtx"); tx.className="vtx"+(st.who?"":" nar");
    $("#vch").innerHTML=""; $("#vnx").hidden=true; full=typeof st.text==="function"?st.text():st.text; pos=0;
    if(st.sus){ addSus(st.sus); $("#vfl").textContent="의심도 +"+st.sus; } else $("#vfl").textContent="";
    clearInterval(vnTimer);
    if(matchMedia("(prefers-reduced-motion: reduce)").matches){tx.textContent=full;finishType();return;}
    typing=true; tx.textContent="";
    vnTimer=setInterval(()=>{pos++; tx.textContent=full.slice(0,pos); if(pos>=full.length){clearInterval(vnTimer);typing=false;finishType();}},28);
  };
  const finishType=()=>{
    typing=false; const st=script[i];
    if(st.choices){ const c=$("#vch"); c.innerHTML="";
      st.choices.forEach(ch=>{const b=document.createElement("button");b.type="button";b.textContent=ch.t;
        b.onclick=e=>{e.stopPropagation(); i=idx(ch.goto); show();}; c.appendChild(b);}); }
    else $("#vnx").hidden=false;
  };
  const next=()=>{
    const st=script[i];
    if(st.caption){clearTimeout(capTimer); i++; if(i>=script.length){end();return;} show(); $("#vbox").focus({preventScroll:true}); return;}
    if(typing){clearInterval(vnTimer);$("#vtx").textContent=full;finishType();return;}
    if(st.choices) return;
    if(st.goto){i=idx(st.goto);} else i++;
    if(i>=script.length){end();return;} show();
  };
  $("#vbox").onclick=next;
  $("#vbox").onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();next();}};
  show(); $("#vbox").focus({preventScroll:true});
}
let panels={}, curPanel=null, curKey=null;
function openPanel(key,html,binder){
  curKey=key; setTimeout(paintTeacher);
  let el=panels[key];
  if(!el){ el=document.createElement("div"); el.className="panel"; el.setAttribute("role","dialog");
    el.innerHTML=`<div class="pwrap">${bar()}<div class="pbody">${html}</div><div class="row"><button class="btn ghost pclose" type="button">${T(TEXT.common.close)}</button></div></div>`;
    document.body.appendChild(el); panels[key]=el; ROOT=el; binder(); el.querySelector(".pclose").onclick=closePanel; }
  ROOT=el; el.hidden=false; curPanel=el; document.body.style.overflow="hidden"; paintClock(); paintSus(); el.scrollTop=0;
}
function closePanel(){ if(curPanel) curPanel.hidden=true; curPanel=null; curKey=null; ROOT=document; document.body.style.overflow=""; }
function disposePanels(){ Object.values(panels).forEach(e=>e.remove()); panels={}; curPanel=null; curKey=null; ROOT=document; document.body.style.overflow=""; }
function render(){
  disposePanels(); setTimeout(paintTeacher);
  const a=$("#app"); document.querySelectorAll(".overlay").forEach(x=>x.remove());
  if(!S.group){ a.innerHTML=startHTML(); bindStart(); return; }
  if(S.done&&!S.epi){ playVN(EPI,()=>{S.epi=true;save();render();window.scrollTo(0,0);}); return; }
  if(S.done){ a.innerHTML=finaleHTML(); bindFoot(); return; }
  if(S.stage===0){ a.innerHTML=introHTML(); bindFoot(); $("#go").onclick=()=>{playVN(PRO,()=>{S.stage=1;S.start=Date.now();save();render();window.scrollTo(0,0);toast(T(TEXT.room.entered));});}; return;}
  a.innerHTML=bar()+roomHTML()+foot(); bindRoom(); bindFoot(); startTick();
}
function toast(t,isNew){const e=document.querySelector("#toast"); if(!e) return; e.textContent=t; e.classList.toggle("new",!!isNew);}
function advance(n,msg){ S.stage=n; save(); render(); toast(msg,true); window.scrollTo(0,0); }
/* ---------- 방 ---------- */
const ITEMS=[["서류함 열쇠","key"],["타자기 리본","ribbon"],["위장한 시","poem"]];
function roomHTML(){
  const L=i=>S.stage>i?"#6bb585":"#3a3f4a";
  const pulse=(x,y)=>`<rect class="pulse" x="${x-8}" y="${y-8}" width="16" height="16"/>`;
  const tg={1:"drawer",2:"cabinet",3:"typewriter",4:"door"}[S.stage];
  const hs=(id,label,x,y,w,h)=>`<g class="hs${tg===id?" tgt":""}" data-o="${id}" tabindex="0" role="button" aria-label="${label}"><image class="cut" href="${CUT[id].s}" x="${CUT[id].x}" y="${CUT[id].y}" width="${CUT[id].w}" height="${CUT[id].h}"/><rect class="hit" x="${CUT[id].x}" y="${CUT[id].y}" width="${CUT[id].w}" height="${CUT[id].h}"/></g>`;
  const inv=ITEMS.map(([n,k],i)=>S.stage>i+1?`<span class="it"><img class="ico" src="${IMG[k]}" alt="">${n}</span>`:"").join("")||`<span>${T(TEXT.room.invEmpty)}</span>`;
  return `<div style="display:flex;flex-direction:column;gap:10px">
  <div class="pixwrap"><img class="bgimg" src="${IMG.room}" alt="검열실">
  <svg class="hot" viewBox="0 0 800 480" role="group" aria-label="검열실 내부">
   ${[684,714,741].map((x,i)=>`<circle cx="${x}" cy="58" r="11.5" fill="#262420"/><circle cx="${x}" cy="58" r="8" fill="${S.stage>i+1?"#6bb585":"#3a3f4a"}"/>${S.stage>i+1?`<circle cx="${x-2}" cy="56" r="2.5" fill="#b8f2c8"/>`:""}`).join("")}
   ${["cabinet","door","trash"].map(k=>`<ellipse cx="${CUT[k].x+CUT[k].w/2}" cy="${CUT[k].y+CUT[k].h-1}" rx="${CUT[k].w*0.52}" ry="5" fill="#000" opacity=".35"/>`).join("")}
   <defs><radialGradient id="lg"><stop offset="0" stop-color="#ffc861" stop-opacity=".30"/><stop offset="1" stop-color="#ffc861" stop-opacity="0"/></radialGradient></defs><ellipse cx="487" cy="262" rx="70" ry="50" fill="url(#lg)"/>
   ${hs("window","창문",118,27,191,215)}${hs("calendar","달력",326,94,62,79)}${hs("poster","검열 기준 포스터",408,67,96,113)}${hs("clock","벽시계",528,49,80,89)}
   ${hs("cabinet","서류함",2,151,116,252)}${hs("drawer","책상 서랍",225,297,95,94)}${hs("typewriter","타자기",346,213,89,66)}${hs("lamp","스탠드",442,190,84,89)}
   ${hs("trash","휴지통",576,338,54,62)}${hs("door","문",635,89,160,304)}
   ${S.stage<2?'<g transform="translate(0,50)"><path d="M54 296 v-8 a6 6 0 0 1 12 0 v8" fill="none" stroke="#e0a93f" stroke-width="3"/><rect x="50" y="296" width="20" height="16" fill="#e0a93f" stroke="#1a1405" stroke-width="2"/><rect x="58" y="301" width="4" height="6" fill="#1a1405"/></g>':""}
  </svg></div>
  <div class="cap" id="cap" aria-hidden="true">${T(TEXT.room.hover)}</div>
  <div class="toast" id="toast" aria-live="polite">${T(TEXT.room.first)}</div>
  <div class="inv"><b>${T(TEXT.room.inv)}</b>${inv}</div></div>`;
}
function bindRoom(){
  document.querySelectorAll(".hs").forEach(g=>{
    const o=g.dataset.o, lab=g.getAttribute("aria-label");
    g.onmouseenter=g.onfocus=()=>{const c=$("#cap"); if(c) c.textContent=lab;};
    const act=()=>useObj(o);
    g.onclick=act; g.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();act();}};
  });
}
function useObj(o){
  if(FLAVOR[o]) return toast(FLAVOR[o]);
  if(o==="clock") return toast(T(TEXT.room.clock,{남은시간:fmt(remain())}));
  if(o==="drawer"){ if(S.stage===1) return openPanel("s1",stage1HTML(),bindStage1); return toast(T(TEXT.room.drawerDone)); }
  if(o==="cabinet"){ if(S.stage<2) return toast(T(TEXT.room.cabinetLocked));
    if(S.stage===2) return openPanel("s2",stage2HTML(),bindStage2); return toast(T(TEXT.room.cabinetDone)); }
  if(o==="typewriter"){ if(S.stage<3) return toast(T(TEXT.room.typewriterLocked)); 
    if(S.stage===3) return openPanel("s3",stage3HTML(),bindStage3); return toast(T(TEXT.room.typewriterDone)); }
  if(o==="door"){ if(S.stage<4) return toast(T(TEXT.room.doorLocked));
    return openPanel("door",doorHTML(),bindDoor); }
}
function doorHTML(){return `<h2>${T(TEXT.door.title)}</h2><p class="story">${T(TEXT.door.story)}</p><div id="gate"></div>`;}
function bindDoor(){ if(CONFIG.requireTeacher&&!S.approved) gate(); else finish(); }
/* ---------- 시작 ---------- */
function startHTML(){
  const g=Array.from({length:CONFIG.groups},(_,i)=>`<button type="button" data-g="${i+1}">${i+1}</button>`).join("");
  return `<div style="padding-top:20px;display:flex;flex-direction:column;gap:18px">
  <div class="pixwrap">${stageHTML("gate")}</div>
  <h3>${T(TEXT.start.sub)}</h3><h1>${T(TEXT.start.title)}</h1>
  <p class="story">${T(TEXT.start.story)}</p>
  <div class="card"><h3>${T(TEXT.start.pick)}</h3><div class="glist" id="gl">${g}</div>
  <button class="btn" id="ok" type="button" disabled>${T(TEXT.start.enter)}</button></div></div>`;
}
function bindStart(){
  let pick=null;
  document.querySelectorAll("#gl button").forEach(b=>b.onclick=()=>{pick=+b.dataset.g;
    document.querySelectorAll("#gl button").forEach(x=>x.classList.toggle("on",x===b)); $("#ok").disabled=false;});
  $("#ok").onclick=()=>{S.group=pick;S.stage=0;save();render();};
}
function introHTML(){
  return `<div class="wrap" style="padding:0"><div style="display:flex;flex-direction:column;gap:16px;padding-top:24px">
  <h2>${T(TEXT.intro.title)}</h2>
  <div class="card"><p>${T(TEXT.intro.about)}</p>
  <ol class="key" style="margin:0;padding-left:20px">${TEXT.intro.missions.map(m=>`<li>${T(m)}</li>`).join("")}</ol>
  <p class="note">${T(TEXT.intro.note)}</p>
  <button class="btn" id="go" type="button">${T(TEXT.intro.go)}</button></div></div></div>${foot()}`;
}
/* ---------- 1단계 ---------- */
function stage1HTML(){
  const cards=CONFIG.cards.map((c,i)=>{
    const toks=c.text.map((ln,li)=>ln.split(" ").map((w,wi)=>`<button type="button" class="tok" data-c="${i}" data-w="${li}-${wi}" data-t="${esc(w)}">${esc(w)}</button>`).join(" ")).join("<br>");
    const chs=CONFIG.periods.map(p=>`<button type="button" class="ch" data-c="${i}" data-p="${p}">${p}</button>`).join("");
    return `<div class="paper" id="card${i}"><span class="no">${T(TEXT.s1.card)} ${["①","②","③","④"][i]||i+1}</span>
      <div class="txt">${toks}</div>
      <div class="choices" role="group" aria-label="시기">${chs}</div><div class="why" id="why${i}" hidden></div></div>`;}).join("");
  return `<div style="display:flex;flex-direction:column;gap:14px"><h2>${T(TEXT.s1.title)}</h2>
  <p class="story">${T(TEXT.s1.story)}</p>
  <div class="grid">${cards}</div>
  <div class="row"><button class="btn" id="chk" type="button">${T(TEXT.s1.submit)}</button><button class="btn ghost" id="hn" type="button">${T(TEXT.common.hintBtn)}</button></div>
  <div class="msg" id="msg" aria-live="polite"></div></div>`;
}
function bindStage1(){
  ui.sel={};ui.per={};
  $$(".tok").forEach(b=>b.onclick=()=>{b.classList.toggle("sel");
    const k=b.dataset.c; ui.sel[k]=ui.sel[k]||new Set(); const t=b.dataset.t; const key=b.dataset.w;
    ui.sel[k].has(key)?ui.sel[k].delete(key):ui.sel[k].add(key); b.dataset.on=ui.sel[k].has(key)?"1":"";});
  document.querySelectorAll(".ch").forEach(b=>b.onclick=()=>{const c=b.dataset.c;ui.per[c]=b.dataset.p;
    document.querySelectorAll(`.ch[data-c="${c}"]`).forEach(x=>x.classList.toggle("on",x===b));});
  let hstep=0;
  $("#hn").onclick=()=>{
    const open=CONFIG.cards.findIndex((c,i)=>!$("#card"+i).classList.contains("ok")); if(open<0) return;
    hint(); const c=CONFIG.cards[open];
    if(hstep===0){ $("#msg").className="msg"; $("#msg").innerHTML=T(TEXT.s1.hint1); hstep=1; }
    else{ document.querySelectorAll(`.tok[data-c="${open}"]`).forEach(t=>{ if(c.clues.some(k=>t.dataset.t.includes(k))) t.classList.add("hint");});
      $("#msg").innerHTML=T(TEXT.s1.hint2,{번호:open+1}); }
  };
  $("#chk").onclick=()=>{
    let all=true, wrong=0;
    CONFIG.cards.forEach((c,i)=>{
      const el=$("#card"+i); if(el.classList.contains("ok")) return;
      const words=[...document.querySelectorAll(`.tok[data-c="${i}"].sel`)].map(t=>t.dataset.t);
      const clueHit=words.some(w=>c.clues.some(k=>w.includes(k)||k.includes(w)));
      const good=ui.per[i]===c.answer&&clueHit;
      el.classList.remove("bad");
      if(good){el.classList.add("ok"); const w=$("#why"+i); w.hidden=false; w.textContent=`${c.answer}: ${c.why}`; el.querySelectorAll("button").forEach(b=>b.disabled=true);}
      else{all=false; wrong++; void el.offsetWidth; el.classList.add("bad");}
    });
    if(wrong) addSus(10*wrong);
    const m=$("#msg");
    if(all){m.className="msg ok";m.innerHTML=T(TEXT.s1.ok);
      const nx=document.createElement("button");nx.className="btn";nx.type="button";nx.innerHTML=T(TEXT.s1.next);
      nx.onclick=()=>{closePanel();openPanel("m1",m1HTML(),bindM1);}; $("#chk").replaceWith(nx);}
    else{m.className="msg bad";m.innerHTML=T(TEXT.s1.wrong);}
  };
}
/* ---------- 2단계 ---------- */
// docs의 marks 낱말을 눈에 띄게 표시
const markWords=(h,ws)=>!ws||!ws.length?h:h.replace(new RegExp(ws.map(w=>esc(w).replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|"),"g"),m=>`<b class="mk">${m}</b>`);
function stage2HTML(){
  const docs=CONFIG.docs.map((d,i)=>`<div class="paper" id="d${i}"><span class="no">${T(TEXT.s2.doc)} ${i+1}</span>
    <div class="txt">${markWords(esc(d.text),d.marks).replace(/\n/g,"<br>")}</div>
    <div class="choices" role="group" aria-label="표현 방식">${TYPES.map(t=>`<button type="button" class="ch" data-d="${i}" data-t="${t}">${TLABEL[t]}</button>`).join("")}</div>
    <span class="stamp ${d.type==="직접"?"":"pass"}" id="st${i}">${d.type==="직접"?"削除":"통과"}</span></div>`).join("");
  return `<div style="display:flex;flex-direction:column;gap:14px"><h2>${T(TEXT.s2.title)}</h2>
  <p class="story">${T(TEXT.s2.story)}</p>
  <div class="grid">${docs}</div>
  <div class="row"><button class="btn" id="chk" type="button">${T(TEXT.s2.submit)}</button><button class="btn ghost" id="hn" type="button">${T(TEXT.common.hintBtn)}</button></div>
  <div class="msg" id="msg" aria-live="polite"></div><div id="quiz"></div></div>`;
}
function bindStage2(){
  ui.cls={};
  document.querySelectorAll(".ch[data-d]").forEach(b=>b.onclick=()=>{const d=b.dataset.d;ui.cls[d]=b.dataset.t;
    document.querySelectorAll(`.ch[data-d="${d}"]`).forEach(x=>x.classList.toggle("on",x===b));});
  let hs=0;
  $("#hn").onclick=()=>{hint(); $("#msg").className="msg";
    $("#msg").innerHTML=T(hs===0?TEXT.s2.hint1:TEXT.s2.hint2); hs=1;};
  $("#chk").onclick=()=>{
    let all=true;
    let wrong=0;
    CONFIG.docs.forEach((d,i)=>{const el=$("#d"+i); el.classList.remove("bad");
      if(ui.cls[i]===d.type){el.classList.add("ok");} else {all=false; wrong++; void el.offsetWidth; el.classList.add("bad"); el.classList.remove("ok");}});
    const m=$("#msg");
    if(!all){m.className="msg bad";m.innerHTML=T(TEXT.s2.wrong);addSus(8*wrong);return;}
    m.className="msg ok";m.innerHTML=T(TEXT.s2.ok);
    document.querySelectorAll(".ch").forEach(b=>b.disabled=true); $("#chk").disabled=true; $("#hn").disabled=true;
    let n=0; CONFIG.docs.forEach((d,i)=>{ setTimeout(()=>$("#st"+i).classList.add("show"),400+n*450); n++;});
    setTimeout(()=>{$("#hn").disabled=false; showQuiz();},600+n*500);
  };
}
function showQuiz(){
  const q=CONFIG.s2quiz; ui.quiz=null;
  $("#quiz").innerHTML=`<div class="card q"><h3>${T(TEXT.s2.quizTitle)}</h3><p><b>${esc(q.q)}</b></p>
  ${q.opts.map((o,i)=>`<button type="button" class="opt" data-o="${i}">${esc(o)}</button>`).join("")}<div class="msg" id="qm" aria-live="polite"></div></div>`;
  document.querySelectorAll(".opt").forEach(b=>b.onclick=()=>{
    const i=+b.dataset.o;
    if(i===q.ans){b.classList.add("good");document.querySelectorAll(".opt").forEach(x=>x.disabled=true);
      $("#qm").className="msg ok";$("#qm").innerHTML=T(TEXT.s2.quizOk);
      const nx=document.createElement("button");nx.className="btn";nx.type="button";nx.innerHTML=T(TEXT.s2.next);
      nx.onclick=()=>{closePanel();openPanel("m2",m2HTML(),bindM2);}; $("#qm").after(nx);}
    else{b.classList.add("no");$("#qm").className="msg bad";$("#qm").innerHTML=T(TEXT.s2.quizWrong);addSus(8);}
  });
}
/* ---------- 미니게임 1: 서랍 속 잡동사니 치우고 열쇠 찾기 ---------- */
function m1HTML(){
  const M=TEXT.m1, pos=(d,z)=>`left:${d.x}%;top:${d.y}%;width:${d.w}%;height:${d.h}%;z-index:${z};--r:${d.r||0}deg`;
  const items=M.items.map((it,i)=>{const d=DRAWER.items[it.id]; if(!d) return "";
    return `<button type="button" class="mitem${d.s?" img":""}" data-i="${i}" style="${pos(d,i+2)}" aria-label="${esc(it.label)} 치우기">${d.s?`<img src="${d.s}" alt="">`:`<span>${esc(it.label)}</span>`}</button>`;}).join("");
  const k=DRAWER.key;
  return `<div style="display:flex;flex-direction:column;gap:14px"><h2>${T(M.title)}</h2>
  <p class="story">${T(M.story)}</p>
  <div class="mdrawer"${DRAWER.bg?` style="background-image:url(${DRAWER.bg})"`:""}>
    <button type="button" class="mkey" id="mkey" style="${pos(k,1)}" aria-label="${esc(M.keyLabel)}"><img src="${IMG.key}" alt=""></button>${items}</div>
  <div class="msg" id="msg" aria-live="polite">${T(M.start)}</div></div>`;
}
function bindM1(){
  const M=TEXT.m1, box=$(".mdrawer"), key=$("#mkey");
  const kr=()=>key.getBoundingClientRect();
  // 열쇠 위에 아직 물건이 겹쳐 있는지
  const covered=()=>[...box.querySelectorAll(".mitem:not(.gone)")].some(b=>{const a=b.getBoundingClientRect(),k=kr();
    return a.left<k.right-4&&a.right>k.left+4&&a.top<k.bottom-4&&a.bottom>k.top+4;});
  box.querySelectorAll(".mitem").forEach(b=>b.onclick=()=>{
    const it=M.items[+b.dataset.i]; b.classList.add("gone"); b.style.setProperty("--dx",(Math.random()<.5?-1:1)*(60+Math.random()*40)+"%");
    setTimeout(()=>b.hidden=true,400);
    const m=$("#msg"); m.className="msg"; m.innerHTML=T(it.line);
    if(!covered()&&!key.classList.contains("seen")){key.classList.add("seen"); m.className="msg ok"; m.innerHTML=T(it.line)+"<br>"+T(M.keySeen);}
  });
  key.onclick=()=>{ if(covered()) return; closePanel(); advance(2,T(TEXT.s1.found)); };
}
/* ---------- 미니게임 2: 상관 눈 피해 리본 꺼내기 ---------- */
function m2HTML(){
  const M=TEXT.m2;
  return `<div style="display:flex;flex-direction:column;gap:14px"><h2>${T(M.title)}</h2>
  <p class="story">${T(M.story)}</p>
  <div class="pixwrap"><div class="stage mboss away" id="mstage"><img class="bgimg" src="${IMG.room}" alt="">
    <span class="sw" style="--h:88%"><img class="spr0" id="mspr" src="${IMG.bossBack||IMG.boss}" alt="상관"></span>
    <span class="mbub" id="mbub" aria-hidden="true"></span></div></div>
  <div class="msg" id="msg" aria-live="polite">${T(M.away)}</div>
  <div class="mrib"><img class="ico" src="${IMG.ribbon}" alt=""><span>${T(M.progress)}</span><span class="g"><i id="mbar"></i></span></div>
  <div class="row"><button class="btn" id="mpull" type="button">${T(M.btn)}</button></div></div>`;
}
function bindM2(){
  const M=TEXT.m2, C=CONFIG.m2, el=panels.m2, st=$("#mstage"), spr=$("#mspr"), bub=$("#mbub"), msg=$("#msg"), btn=$("#mpull"), bar=$("#mbar");
  let n=0, last=0, mode="away", locked=false, timer=null, done=false;
  const rnd=(a,b)=>a+Math.random()*(b-a);
  const paint=()=>{bar.style.width=Math.min(100,n/C.pulls*100)+"%";};
  const set=m=>{ mode=m; st.className="stage mboss "+m+(IMG.bossBack?" hasback":"");
    spr.src=m==="look"?IMG.bossSus:(IMG.bossBack||IMG.boss);
    bub.textContent=T({away:M.bubAway,warn:M.bubWarn,look:M.bubLook}[m]||"");
    if(!locked||m==="away"){ msg.className="msg"+(m==="look"?" bad":""); msg.innerHTML=T(M[m]); }
    if(m==="away"){ locked=false; btn.disabled=false; } };
  const loop=()=>{
    if(done||!el.isConnected) return;
    if(el.hidden){ timer=setTimeout(loop,500); return; }   // 창을 닫아 두면 멈춤
    if(mode==="away"){ set("warn"); timer=setTimeout(loop,700); }
    else if(mode==="warn"){ set("look"); timer=setTimeout(loop,rnd(1300,2200)); }
    else { set("away"); timer=setTimeout(loop,rnd(1600,3400)); }
  };
  btn.onclick=()=>{
    if(done||locked) return;
    if(mode==="look"){ locked=true; btn.disabled=true; n=Math.max(0,n-C.caughtBack); paint();
      msg.className="msg bad"; msg.innerHTML=T(M.caught,{의심도:C.caughtSus}); addSus(C.caughtSus); return; }
    if(Date.now()-last<C.gap) return; last=Date.now(); n++; paint();
    if(n>=C.pulls){ done=true; clearTimeout(timer); set("away"); msg.className="msg ok"; msg.innerHTML=T(M.done);
      btn.innerHTML=T(M.take); btn.onclick=()=>{closePanel(); advance(3,T(TEXT.s2.found));}; }
  };
  paint(); set("away"); timer=setTimeout(loop,rnd(1800,3000));
}
/* ---------- 3단계 ---------- */
function stage3HTML(){
  const s=CONFIG.s3;
  return `<div style="display:flex;flex-direction:column;gap:14px"><h2>${T(TEXT.s3.title)}</h2>
  <p class="story">${T(TEXT.s3.story)}</p>
  <div class="paper"><span class="no">${T(TEXT.s3.draftLabel)}</span><div class="txt">${esc(s.draft)}</div></div>
  <div class="card"><h3>${T(TEXT.s3.bannedTitle)}</h3><div class="banned" id="bw">${s.banned.map(w=>`<span data-w="${esc(w)}">${esc(w)}</span>`).join("")}</div>
  <label for="t1"><b>${T(TEXT.s3.poemLabel)}</b> <span class="note">${T(TEXT.s3.poemNote)}</span></label>
  <textarea id="t1" placeholder="${esc(T(TEXT.s3.poemPlaceholder))}"></textarea>
  <label for="t2"><b>${T(TEXT.s3.meanLabel)}</b> <span class="note">${T(TEXT.s3.meanNote)}</span></label>
  <textarea id="t2" style="min-height:70px" placeholder="${esc(T(TEXT.s3.meanPlaceholder))}"></textarea>
  <div class="row"><button class="btn" id="chk" type="button">${T(TEXT.s3.submit)}</button><button class="btn ghost" id="hn" type="button">${T(TEXT.common.hintBtn)}</button></div>
  <div class="msg" id="msg" aria-live="polite"></div><div id="gate"></div></div></div>`;
}
function bindStage3(){
  const s=CONFIG.s3, t1=$("#t1");
  const hits=()=>s.banned.filter(w=>t1.value.includes(w));
  t1.oninput=()=>document.querySelectorAll("#bw span").forEach(sp=>sp.classList.toggle("hit",t1.value.includes(sp.dataset.w)));
  let hs=0;
  $("#hn").onclick=()=>{hint();$("#msg").className="msg";
    $("#msg").innerHTML=hs===0?T(TEXT.s3.hint1):T(TEXT.s3.hint2,{상징:s.symbols.slice(0,8).join(", ")}); hs=1;};
  $("#chk").onclick=()=>{
    const m=$("#msg"), v=t1.value.trim(), why=$("#t2").value.trim(), h=hits();
    if(h.length){m.className="msg bad";m.innerHTML=T(TEXT.s3.caught,{낱말:h.join("’, ‘")});addSus(15);return;}
    if(v.length<12){m.className="msg bad";m.innerHTML=T(TEXT.s3.tooShort);return;}
    if(v.split(/\n/).filter(x=>x.trim()).length<2){m.className="msg bad";m.innerHTML=T(TEXT.s3.oneLine);addSus(5);return;}
    if(!s.symbols.some(w=>v.includes(w))){m.className="msg bad";m.innerHTML=T(TEXT.s3.noSymbol);addSus(5);return;}
    if(why.length<6){m.className="msg bad";m.innerHTML=T(TEXT.s3.meanShort);return;}
    m.className="msg ok";S.poem=v;S.meaning=why;save();
    m.innerHTML=T(TEXT.s3.ok);
    $("#chk").disabled=true;t1.disabled=true;$("#t2").disabled=true;$("#hn").disabled=true;
    const nx=document.createElement("button");nx.className="btn";nx.type="button";nx.innerHTML=T(TEXT.s3.next);
    nx.onclick=()=>advance(4,T(TEXT.s3.found)); m.after(nx);
  };
}
function gate(){
  $("#gate").innerHTML=`<div class="card" style="border-color:var(--amber)"><b>${T(TEXT.door.gateTitle)}</b><p class="note">${T(TEXT.door.gateNote)}</p>
  <div class="row"><input type="password" id="pin" inputmode="numeric" autocomplete="off" aria-label="선생님 비밀번호" style="max-width:200px">
  <button class="btn" id="pk" type="button">${T(TEXT.door.gateBtn)}</button></div><div class="msg" id="pm" aria-live="polite"></div></div>`;
  $("#pk").onclick=()=>{ if($("#pin").value===CONFIG.teacherPin){S.approved=true;finish();}
    else{$("#pm").className="msg bad";$("#pm").innerHTML=T(TEXT.door.gateWrong);} };
}
function finish(){S.done=Date.now();save();render();window.scrollTo(0,0);}
/* ---------- 마무리 ---------- */
function finaleHTML(){
  const w=CONFIG.finalWord, ch=w[(S.group-1)%w.length], el=Math.round((S.done-S.start)/1000)+S.penalty-S.extra, over=remain()<0;
  return `<div style="display:flex;flex-direction:column;gap:18px;padding-top:24px"><h3>${S.group}조</h3><h1>${T(TEXT.finale.title)}</h1>
  <p class="story">${T(S.sus<30?TEXT.finale.good:S.sus<70?TEXT.finale.mid:TEXT.finale.bad)} ${T(TEXT.finale.after)}</p>
  <div class="big" aria-label="글자 조각">${esc(ch)}</div>
  <p style="text-align:center" class="note">${T(TEXT.finale.piece)}</p>
  <div class="stats"><span>걸린 시간 <b>${fmt(Math.max(0,el))}</b></span><span>사용한 힌트 <b>${S.hints}</b></span><span>심문 <b>${S.grilled}</b>회</span><span>의심도 <b>${Math.min(100,S.sus)}%</b></span>${over?`<span>제한 시간을 넘겼습니다</span>`:""}</div>
  <div class="card"><h3>${T(TEXT.finale.wrapTitle)}</h3>
  ${TEXT.finale.wrap.map(p=>`<p>${T(p)}</p>`).join("")}
  <p class="note">${T(TEXT.finale.next)}</p></div>
  <div class="foot"><span></span><span><button id="rbtn" type="button">${T(TEXT.common.restart)}</button> <button id="tbtn" type="button">${T(TEXT.common.teacher)}</button></span></div></div>`;
}
/* ---------- 교사용 ---------- */
function resetAll(){S={group:null,start:null,penalty:0,extra:0,stage:0,hints:0,done:null,approved:false,sus:0,grilled:0,epi:false,poem:"",meaning:""};save();render();window.scrollTo(0,0);}
function bindFoot(){const b=$("#tbtn"); if(b) b.onclick=teacher;
  const r=$("#rbtn"); if(r){ let t=null; r.onclick=()=>{ if(t){clearTimeout(t);resetAll();return;}
    r.textContent=T(TEXT.common.restartAgain); t=setTimeout(()=>{t=null;r.textContent=T(TEXT.common.restart);},4000); }; } }
/* 교사 모드: 비밀번호를 한 번 넣으면 켜지고, 화면 구석 버튼으로 단계를 바로 넘길 수 있음.
   이 기기에 기억되므로 학생 기기에서는 꼭 끄세요. */
const TKEY="censor-escape-teacher";
let teacherMode=false; try{teacherMode=localStorage.getItem(TKEY)==="1";}catch(e){}
function setTeacherMode(on){ teacherMode=on; try{on?localStorage.setItem(TKEY,"1"):localStorage.removeItem(TKEY);}catch(e){} paintTeacher(); }
// 바로 가기 목록: [이름, 상태를 맞추고 화면을 여는 함수]
const JUMPS=[
  ["프롤로그",()=>{S.stage=0;}],
  ["1단계",()=>{S.stage=1;},"s1"],["서랍 게임",()=>{S.stage=1;},"m1"],
  ["2단계",()=>{S.stage=2;},"s2"],["서류함 게임",()=>{S.stage=2;},"m2"],
  ["3단계",()=>{S.stage=3;},"s3"],["문",()=>{S.stage=4;},"door"],
  ["에필로그",()=>{S.stage=4;S.done=Date.now();S.epi=false;}],
  ["결과 화면",()=>{S.stage=4;S.done=S.done||Date.now();S.epi=true;}]
];
const PANELS={s1:()=>[stage1HTML(),bindStage1],m1:()=>[m1HTML(),bindM1],s2:()=>[stage2HTML(),bindStage2],m2:()=>[m2HTML(),bindM2],s3:()=>[stage3HTML(),bindStage3],door:()=>[doorHTML(),bindDoor]};
function openKey(k){ const [h,b]=PANELS[k](); openPanel(k,h,b); }
function jumpTo(i){
  vnStop(); document.querySelectorAll(".overlay").forEach(x=>x.remove());
  S.group=S.group||1; S.done=null; S.epi=false; S.start=S.start||Date.now();
  S.approved=false;   // 문 화면에서 비밀번호 칸이 다시 보이게
  JUMPS[i][1](); save(); render(); window.scrollTo(0,0);
  if(JUMPS[i][2]) openKey(JUMPS[i][2]);
}
// 지금 화면 바로 다음으로
function teacherNext(){
  if(!S.group) return jumpTo(0);
  if(S.done) return jumpTo(JUMPS.length-1);
  if(S.stage===0) return jumpTo(1);
  const order=["s1","m1","s2","m2","s3","door"], room={1:"s1",2:"s2",3:"s3",4:"door"};
  if(!curKey) return openKey(room[S.stage]);
  if(curKey==="door"){ S.approved=true; closePanel(); return finish(); }
  jumpTo(JUMPS.findIndex(j=>j[2]===order[order.indexOf(curKey)+1]));
}
function paintTeacher(){
  let t=document.querySelector("#tbar");
  const show=teacherMode&&!(S.done&&S.epi);
  if(!teacherMode){ if(t) t.remove(); return; }
  if(!t){ t=document.createElement("div"); t.id="tbar";
    t.innerHTML=`<span>교사 모드</span><button type="button" id="tmenu">메뉴</button><button type="button" id="tnext">넘기기 ▶</button>`;
    document.body.appendChild(t); t.querySelector("#tmenu").onclick=teacher; t.querySelector("#tnext").onclick=teacherNext; }
  t.querySelector("#tnext").hidden=!show;
}
function teacher(){
  const o=document.createElement("div");o.className="overlay";o.setAttribute("role","dialog");o.setAttribute("aria-label","교사용");
  o.innerHTML=`<div class="card"><h2>교사용</h2><div class="row" id="tlogin"><input type="password" id="tp" inputmode="numeric" autocomplete="off" aria-label="비밀번호" style="max-width:200px">
  <button class="btn" id="to" type="button">열기</button></div><div id="tb"></div><div class="row"><button class="btn ghost" id="tc" type="button">닫기</button></div></div>`;
  document.body.appendChild(o);
  const q=s=>o.querySelector(s);
  q("#tc").onclick=()=>o.remove();
  const open=()=>{ q("#tlogin").hidden=true; setTeacherMode(true);
    q("#tb").innerHTML=`<p class="note">교사 모드가 켜졌습니다. 화면 오른쪽 아래 ‘넘기기 ▶’로 문제를 풀지 않고 다음으로 넘어갈 수 있습니다. 이 기기에 기억되니 학생 기기에서는 꼭 끄세요.</p>
    <h3>바로 가기</h3><div class="row tjump">${JUMPS.map((j,i)=>`<button class="btn ghost" type="button" data-j="${i}">${j[0]}</button>`).join("")}</div>
    <div class="row"><button class="btn" id="p5" type="button">+5분</button><button class="btn ghost" id="rs" type="button">이 기기 처음부터</button><button class="btn ghost" id="toff" type="button">교사 모드 끄기</button></div><p class="msg" id="tm"></p>
    <h3>정답</h3><ul class="key"><li>1단계: ${CONFIG.cards.map((c,i)=>`${i+1}번 ${c.answer}`).join(", ")}</li>
    <li>2단계: ${CONFIG.docs.map((d,i)=>`${i+1}번 ${TLABEL[d.type]}`).join(", ")} / 삭제 도장 글의 특징은 ‘${esc(CONFIG.s2quiz.opts[CONFIG.s2quiz.ans])}’</li>
    <li>3단계: 삭제 대상 낱말(${CONFIG.s3.banned.join(", ")})을 쓰지 않고, 상징어를 넣은 두 줄 이상의 시와 숨은 뜻을 확인</li></ul>`;
    o.querySelectorAll("[data-j]").forEach(b=>b.onclick=()=>{o.remove();jumpTo(+b.dataset.j);});
    q("#p5").onclick=()=>{S.extra+=300;save();paintClock();q("#tm").textContent="5분을 더했습니다.";};
    q("#rs").onclick=()=>{o.remove();resetAll();};
    q("#toff").onclick=()=>{setTeacherMode(false);o.remove();}; };
  if(teacherMode) return open();
  q("#to").onclick=()=>{ if(q("#tp").value!==CONFIG.teacherPin){q("#tb").innerHTML='<p class="msg bad">비밀번호가 맞지 않습니다.</p>';return;} open(); };
}
render();
