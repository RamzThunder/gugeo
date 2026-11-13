CONFIG.defaultMinutes=CONFIG.minutes;
/* 게임 동작 코드. 대사는 story.js, 그림 경로는 assets.js에 있습니다. */
const TYPES=["직접","돌려","안으로"], TLABEL={직접:"직접 말하기",돌려:"돌려 말하기",안으로:"안으로 향하기"};
const KEY="censor-escape-v1";
let ROOT=document;
const $=s=>ROOT.querySelector(s);
const $$=s=>ROOT.querySelectorAll(s);
// story.js의 TEXT 문구에서 {분} {힌트초} {조} 같은 자리를 채움
const T=(s,o)=>String(s).replace(/\{([^{}]+)\}/g,(m,k)=>{const v=Object.assign({분:CONFIG.minutes,힌트초:CONFIG.hintPenaltySec,조:S.group},o)[k];return v==null?m:v;});
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
let S={group:null,start:null,penalty:0,extra:0,stage:0,hints:0,done:null,approved:false,sus:0,grilled:0,epi:false,poem:"",meaning:"",poemAt:0,caught:0,badSeen:false,wired:false,room:""};
try{const r=localStorage.getItem(KEY); if(r) S=Object.assign(S,JSON.parse(r));}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){} if(typeof netPush==="function") netPush();};
let tick=null, ui={sel:{},per:{},cls:{},stamped:false,quiz:null,hintOn:null,s3ok:false};

function remain(){ if(!S.start) return CONFIG.minutes*60;
  const end=S.done||S.caught||Date.now(); return Math.round(CONFIG.minutes*60+S.extra-(end-S.start)/1000-S.penalty); }
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
function paintClock(){const r=remain(); document.querySelectorAll(".clk").forEach(c=>{c.textContent=fmt(r); c.classList.toggle("over",r<0);});
  // 시간이 다 되면 배드엔딩. 모든 임무를 끝내고 문 앞(4단계)에 온 조는 잡히지 않음
  if(S.group&&S.start&&S.stage>=1&&S.stage<4&&!S.done&&!S.caught&&r<=0) timeUp();}
function timeUp(){
  S.caught=Date.now(); S.badSeen=false; if(typeof stopVerdict==="function") stopVerdict(); vnStop();
  document.querySelectorAll(".overlay").forEach(x=>x.remove()); save(); render(); window.scrollTo(0,0); }
function startTick(){paintSus();clearInterval(tick); tick=setInterval(paintClock,1000);}
function hint(text,key){
  S.hints++; S.penalty+=CONFIG.hintPenaltySec; save(); paintClock();
  return text;
}
function foot(){return `<div class="foot"><span>${T(TEXT.common.hintFoot)}</span><span><button id="rbtn" type="button">${T(TEXT.common.restart)}</button></span></div>`;}
const SPRH={guard:"84%",guardCalm:"84%",guardSus:"84%",boss:"88%",bossSus:"88%",contact:"86%",contactSide:"86%",contactHappy:"86%"};
const sprKey=(k,m)=>!k?k:(({guard:{calm:"guardCalm",sus:"guardSus"},boss:{sus:"bossSus"},contact:{side:"contactSide",happy:"contactHappy"}}[k]||{})[m])||k;
function stageHTML(bg,spr){
  return `<div class="stage"><img class="bgimg" src="${IMG[bg]}" width="800" height="480" decoding="sync" alt="">${spr?`<span class="sw" style="--h:${SPRH[spr]}"><img class="spr0" src="${IMG[spr]}" alt="">${BLP[spr]?`<img class="pt" style="left:${BLP[spr].l}%;top:${BLP[spr].t}%;width:${BLP[spr].w}%;visibility:hidden" src="${BLP[spr].s}" alt="">`:''}</span>`:''}</div>`;
}
let vnTimer=null, vnStop=()=>{};
(function blinkLoop(){
  // 눈 깜빡임은 0.1초짜리 작은 변화라 '동작 줄이기' 설정과 상관없이 보여 줌 (학교 PC는 이 설정이 켜진 경우가 많음)
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
  let lastStage="";
  const show=()=>{
    const st=script[i]; if(!st){end();return;}
    if(st.bg) bg=st.bg;
    clearTimeout(capTimer);
    if(st.caption){ // 장면 자막: 사람 없이 배경 위에 글만 떴다가 저절로 넘어감
      $("#vbox").style.visibility="hidden";
      $("#vstage").innerHTML=stageHTML(bg)+`<div class="vcap"><span>${st.caption}</span></div>`; lastStage="";
      $("#vstage").onclick=next; capTimer=setTimeout(next,3400); return;
    }
    $("#vbox").style.visibility=""; $("#vstage").onclick=null;
    // 같은 배경·같은 인물이면 다시 그리지 않음 (폰에서 대사 넘길 때마다 그림이 깜빡이며 칸이 흔들리던 문제)
    const sk=bg+"|"+(sprKey(st.spr,st.mood)||"");
    if(sk!==lastStage){ $("#vstage").innerHTML=stageHTML(bg,sprKey(st.spr,st.mood)); lastStage=sk; }
    $("#vnm").textContent=st.who||""; const tx=$("#vtx"); tx.className="vtx"+(st.who?"":" nar");
    $("#vch").innerHTML=""; $("#vnx").hidden=true; full=typeof st.text==="function"?st.text():st.text; pos=0;
    if(st.sus){ addSus(st.sus); $("#vfl").textContent="의심도 +"+st.sus; } else $("#vfl").textContent="";
    clearInterval(vnTimer);
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
  curKey=key; setTimeout(paintTeacher); if(typeof netPush==="function") netPush();
  let el=panels[key];
  if(!el){ el=document.createElement("div"); el.className="panel"; el.setAttribute("role","dialog");
    el.innerHTML=`<div class="pwrap">${bar()}<div class="pbody">${html}</div><div class="row"><button class="btn ghost pclose" type="button">${T(TEXT.common.close)}</button></div></div>`;
    document.body.appendChild(el); panels[key]=el; ROOT=el; binder(); el.querySelector(".pclose").onclick=closePanel; }
  ROOT=el; el.hidden=false; curPanel=el; document.body.style.overflow="hidden"; paintClock(); paintSus(); el.scrollTop=0;
}
function closePanel(){ if(curPanel) curPanel.hidden=true; curPanel=null; curKey=null; if(typeof netPush==="function") netPush(); ROOT=document; document.body.style.overflow=""; }
function disposePanels(){ Object.values(panels).forEach(e=>e.remove()); panels={}; curPanel=null; curKey=null; ROOT=document; document.body.style.overflow=""; }
function render(){
  disposePanels(); setTimeout(paintTeacher);
  const a=$("#app"); document.querySelectorAll(".overlay").forEach(x=>x.remove());
  if(!S.group){ a.innerHTML=startHTML(); bindStart(); return; }
  if(S.done&&!S.epi){ playVN(EPI,()=>{S.epi=true;save();render();window.scrollTo(0,0);}); return; }
  if(S.done){ a.innerHTML=finaleHTML(); bindFoot(); return; }
  if(S.caught){ if(!S.badSeen){ playVN(BADEND,()=>{S.badSeen=true;save();render();window.scrollTo(0,0);}); return; }
    a.innerHTML=badHTML(); bindFoot(); return; }
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
    if(S.stage===3) return S.wired?openPanel("s3",stage3HTML(),bindStage3):openPanel("m3",m3HTML(),bindM3); return toast(T(TEXT.room.typewriterDone)); }
  if(o==="door"){ if(S.stage<4) return toast(T(TEXT.room.doorLocked));
    return openPanel("door",doorHTML(),bindDoor); }
}
// 교실 TV에 연결돼 있고 시를 냈으면, 비밀번호 대신 TV에서 선생님이 통과를 누름
const tvGate=()=>CONFIG.requireTeacher&&typeof netRoomOk==="function"&&netRoomOk(S.room)&&!!S.poem;
function doorHTML(){return `<h2>${T(TEXT.door.title)}</h2><p class="story">${T(tvGate()?TEXT.door.storyTv:TEXT.door.story)}</p><div id="gate"></div>`;}
function bindDoor(){ if(CONFIG.requireTeacher&&!S.approved) gate(); else finish(); }
/* ---------- 시작 ---------- */
function startHTML(){
  const g=Array.from({length:CONFIG.groups},(_,i)=>`<button type="button" data-g="${i+1}">${i+1}</button>`).join("");
  return `<div style="padding-top:20px;display:flex;flex-direction:column;gap:18px">
  <div class="pixwrap">${stageHTML("gate")}</div>
  <h3>${T(TEXT.start.sub)}</h3><h1>${T(TEXT.start.title)}</h1>
  <p class="story">${T(TEXT.start.story)}</p>
  <div class="card"><h3>${T(TEXT.start.roomLabel)}</h3><input id="room" class="roomin" type="text" inputmode="text" maxlength="12" autocomplete="off" placeholder="${esc(TEXT.start.roomHint)}" value="${esc(S.room||new URLSearchParams(location.search).get("room")||"")}"></div>
  <div class="card"><h3>${T(TEXT.start.pick)}</h3><div class="glist" id="gl">${g}</div>
  <button class="btn" id="ok" type="button" disabled>${T(TEXT.start.enter)}</button></div></div>`;
}
function bindStart(){
  let pick=null;
  document.querySelectorAll("#gl button").forEach(b=>b.onclick=()=>{pick=+b.dataset.g;
    document.querySelectorAll("#gl button").forEach(x=>x.classList.toggle("on",x===b)); $("#ok").disabled=false;});
  $("#ok").onclick=()=>{ const r=($("#room").value||"").trim(); S.room=(typeof netRoomOk==="function"&&netRoomOk(r))?r:""; S.group=pick;S.stage=0;save();render();};
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
    // 시인·작품 이름과 힌트는 처음부터 보여 줌 (난이도 낮춤)
    return `<div class="paper" id="card${i}"><span class="no">${T(TEXT.s1.card)} ${["①","②","③","④"][i]||i+1}</span>
      <div class="poet">${esc(c.title)}</div>
      <div class="txt">${toks}</div>
      ${c.hint?`<div class="chint">${T(TEXT.s1.cardHint)} ${esc(c.hint)}</div>`:""}
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
      if(good){el.classList.add("ok"); const w=$("#why"+i); w.hidden=false; w.textContent=T(TEXT.s1.cardOk,{시기:c.answer}); el.querySelectorAll("button").forEach(b=>b.disabled=true);}
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
    <span class="stamp ${d.type==="직접"?"":"pass"}" id="st${i}">${d.type==="직접"?"삭제":"통과"}</span></div>`).join("");
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
/* 열쇠 자리를 랜덤으로: 서랍 안쪽에서, 중심이 물건 2개 이상에 덮이는 곳만 후보로 삼는다 */
function placeKey(M){
  const K=DRAWER.key, its=M.items.map(it=>DRAWER.items[it.id]).filter(Boolean), AR=800/480, spots=[];
  const hit=(d,cx,cy)=>cx>=d.x&&cx<=d.x+d.w&&cy>=d.y&&cy<=d.y+d.h;
  for(let x=4;x<=96-K.w;x+=3) for(let y=4;y<=96-K.h;y+=3){
    const cx=x+K.w/2, cy=y+K.h/2;
    if(its.filter(d=>hit(d,cx,cy)).length>=2) spots.push([x,y]);
  }
  const p=spots.length?spots[Math.floor(Math.random()*spots.length)]:[K.x||50,K.y||40];
  return {...K,x:p[0],y:p[1],r:0};
}
/* ---------- 미니게임 1: 서랍 속 잡동사니 치우고 열쇠 찾기 ---------- */
function m1HTML(){
  const M=TEXT.m1, pos=(d,z)=>`left:${d.x}%;top:${d.y}%;width:${d.w}%;height:${d.h}%;z-index:${z};--r:${d.r||0}deg`;
  const items=M.items.map((it,i)=>{const d=DRAWER.items[it.id]; if(!d) return "";
    return `<button type="button" class="mitem${d.s?" img":""}" data-i="${i}" style="${pos(d,i+2)}" aria-label="${esc(it.label)} 치우기">${d.s?`<img src="${d.s}" alt="">`:`<span>${esc(it.label)}</span>`}</button>`;}).join("");
  const k=placeKey(M);
  return `<div style="display:flex;flex-direction:column;gap:14px"><h2>${T(M.title)}</h2>
  <p class="story">${T(M.story)}</p>
  <div class="mdrawer"${DRAWER.bg?` style="background-image:url(${DRAWER.bg})"`:""}>
    <button type="button" class="mkey" id="mkey" style="${pos(k,1)}" aria-label="${esc(M.keyLabel)}"><img src="${k.s||IMG.key}" alt=""></button>${items}</div>
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
    <span class="mbub" id="mbub" aria-hidden="true"></span>
    <button class="mhold" id="mpull" type="button" style="--p:0%"><img class="ico" src="${IMG.ribbon}" alt=""><span id="mlab">${T(M.btn)}</span></button></div></div>
  <div class="msg" id="msg" aria-live="polite">${T(M.away)}</div></div>`;
}
/* 꾹 누르고 있는 동안 리본이 당겨진다. 상관 패턴은 매번 다르게(랜덤) 움직인다. */
function bindM2(){
  const M=TEXT.m2, C=CONFIG.m2, el=panels.m2, st=$("#mstage"), spr=$("#mspr"), bub=$("#mbub"), msg=$("#msg"), btn=$("#mpull"), lab=$("#mlab");
  let n=0, mode="away", locked=false, timer=null, done=false, holding=false, lastT=0;
  const rnd=(a,b)=>a+Math.random()*(b-a);
  const paint=()=>{btn.style.setProperty("--p",Math.min(100,n/C.holdSec*100)+"%");};
  const set=m=>{ mode=m; st.className="stage mboss "+m+(IMG.bossBack?" hasback":"");
    spr.src=m==="look"?IMG.bossSus:(IMG.bossBack||IMG.boss);
    bub.textContent=T({away:M.bubAway,warn:M.bubWarn,look:M.bubLook}[m]||"");
    if(!locked||m==="away"){ msg.className="msg"+(m==="look"?" bad":""); msg.innerHTML=T(M[m]); }
    if(m==="away"){ locked=false; btn.classList.remove("lock"); } };
  // 상관 패턴: 서류 읽기 → (헛기침 → 돌아봄 | 헛기침만 하고 다시 서류) → ... 길이도 순서도 매번 랜덤
  const loop=()=>{
    if(done||!el.isConnected) return;
    if(el.hidden){ timer=setTimeout(loop,500); return; }   // 창을 닫아 두면 멈춤
    if(mode==="away"){
      set("warn"); timer=setTimeout(loop,rnd(400,1000));
    } else if(mode==="warn"){
      if(Math.random()<C.fakeChance){ set("away"); timer=setTimeout(loop,rnd(700,2200)); }   // 헛기침만 하고 안 돌아봄
      else { set("look"); timer=setTimeout(loop,rnd(900,2600)); }
    } else {
      set("away");
      timer=setTimeout(loop, Math.random()<C.quickChance?rnd(500,1000):rnd(1200,4500));      // 가끔 금방 또 헛기침
    }
  };
  const caught=()=>{ locked=true; holding=false; btn.classList.remove("on"); btn.classList.add("lock");
    n=Math.max(0,n-C.caughtBackSec); paint();
    msg.className="msg bad"; msg.innerHTML=T(M.caught,{의심도:C.caughtSus}); addSus(C.caughtSus); };
  const tick=()=>{
    const now=performance.now(), dt=Math.min(0.2,(now-lastT)/1000); lastT=now;
    if(done||!el.isConnected){ return; }
    if(holding&&!locked){
      if(mode==="look"){ caught(); }
      else { n+=dt; paint();
        if(n>=C.holdSec){ finish(); return; } }
    }
    requestAnimationFrame(tick);
  };
  const finish=()=>{ done=true; holding=false; clearTimeout(timer); set("away"); btn.classList.remove("on");
    btn.style.setProperty("--p","100%"); msg.className="msg ok"; msg.innerHTML=T(M.done);
    lab.innerHTML=T(M.take); btn.onclick=()=>{closePanel(); S.stage=3; save(); playVN(BOSSOUT,()=>{render(); toast(T(TEXT.s2.found),true); window.scrollTo(0,0);});}; };
  const down=e=>{ if(done||locked) return; e.preventDefault(); holding=true; btn.classList.add("on");
    try{btn.setPointerCapture(e.pointerId);}catch(_){} };
  const up=()=>{ holding=false; btn.classList.remove("on"); };
  btn.addEventListener("pointerdown",down);
  ["pointerup","pointercancel","lostpointercapture"].forEach(t=>btn.addEventListener(t,up));
  btn.addEventListener("contextmenu",e=>e.preventDefault());
  btn.addEventListener("keydown",e=>{ if((e.key===" "||e.key==="Enter")&&!e.repeat){ if(done){btn.click();return;} e.preventDefault(); down({preventDefault(){},pointerId:0}); }});
  btn.addEventListener("keyup",e=>{ if(e.key===" "||e.key==="Enter") up(); });
  paint(); set("away"); lastT=performance.now(); requestAnimationFrame(tick); timer=setTimeout(loop,rnd(1500,2800));
}
/* ---------- 미니게임 3: 타자기 리본 걸기 (어몽어스 전선 연결처럼 같은 색끼리 이어 주기) ---------- */
const WCOL=[["#e5484d","●","빨강"],["#3e8ef7","■","파랑"],["#f2c230","▲","노랑"],["#4fc27a","◆","초록"]];
function m3HTML(){
  const M=TEXT.m3;
  return `<div style="display:flex;flex-direction:column;gap:14px"><h2>${T(M.title)}</h2>
  <p class="story">${T(M.story)}</p>
  <div class="pixwrap wirewrap"><svg id="wsvg" viewBox="0 0 400 300" role="group" aria-label="${esc(M.title)}"></svg></div>
  <div class="msg" id="msg" aria-live="polite">${T(M.start)}</div><div class="row" id="m3go"></div></div>`;
}
function bindM3(){
  const M=TEXT.m3, C=CONFIG.m3, svg=$("#wsvg"), msg=$("#msg"), NS="http://www.w3.org/2000/svg";
  const shuf=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const L=[0,1,2,3], R=shuf(L), Y=[42,108,174,240], LX=46, RX=354;
  const mk=(n,a)=>{const e=document.createElementNS(NS,n);for(const k in a)e.setAttribute(k,a[k]);return e;};
  svg.appendChild(mk("rect",{x:0,y:0,width:400,height:300,fill:"#15171d"}));
  [LX-30,RX-16].forEach(x=>svg.appendChild(mk("rect",{x,y:14,width:46,height:272,fill:"#2a2d36",stroke:"#0a0b0e","stroke-width":3})));
  const wires=svg.appendChild(mk("g",{})), nodes=svg.appendChild(mk("g",{}));
  const node=(x,y,c,side,id)=>{
    const g=mk("g",{"data-side":side,"data-c":id,style:"cursor:pointer"});
    g.appendChild(mk("circle",{cx:x,cy:y,r:30,fill:"transparent"}));
    g.appendChild(mk("circle",{cx:x,cy:y,r:17,fill:WCOL[id][0],stroke:"#0a0b0e","stroke-width":4}));
    const t=mk("text",{x,y:y+6,"text-anchor":"middle","font-size":17,"font-weight":700,fill:"#0a0b0e","pointer-events":"none"}); t.textContent=WCOL[id][1]; g.appendChild(t);
    nodes.appendChild(g); return {x,y,id,g,side,done:false};
  };
  const LN=L.map((id,i)=>node(LX,Y[i],0,"L",id)), RN=R.map((id,i)=>node(RX,Y[i],0,"R",id));
  const path=(a,b)=>{const dx=Math.max(60,Math.abs(b.x-a.x)*.5);return `M${a.x} ${a.y} C${a.x+dx} ${a.y} ${b.x-dx} ${b.y} ${b.x} ${b.y}`;};
  const draw=(a,b,id,solid)=>{const o=mk("path",{d:path(a,b),fill:"none",stroke:"#0a0b0e","stroke-width":16,"stroke-linecap":"round"}),
    p=mk("path",{d:path(a,b),fill:"none",stroke:WCOL[id][0],"stroke-width":9,"stroke-linecap":"round"}); wires.append(o,p); return [o,p];};
  const pt=e=>{const m=svg.getScreenCTM().inverse(),p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const q=p.matrixTransform(m);return {x:q.x,y:q.y};};
  const near=(p,list)=>list.filter(n=>!n.done).map(n=>[Math.hypot(n.x-p.x,n.y-p.y),n]).filter(d=>d[0]<C.snap).sort((a,b)=>a[0]-b[0])[0];
  let drag=null, solved=0, tmp=null;
  svg.style.touchAction="none";
  svg.addEventListener("pointerdown",e=>{ if(solved>=4) return;
    const p=pt(e), all=[...LN,...RN], hit=all.filter(n=>!n.done).map(n=>[Math.hypot(n.x-p.x,n.y-p.y),n]).filter(d=>d[0]<C.snap).sort((a,b)=>a[0]-b[0])[0];
    if(!hit) return; e.preventDefault(); drag=hit[1]; try{svg.setPointerCapture(e.pointerId);}catch(_){} });
  svg.addEventListener("pointermove",e=>{ if(!drag) return; if(tmp) tmp.forEach(x=>x.remove());
    const p=pt(e); tmp=draw(drag.side==="L"?drag:{x:p.x,y:p.y},drag.side==="L"?{x:p.x,y:p.y}:drag,drag.id); });
  const end=e=>{ if(!drag) return; if(tmp){tmp.forEach(x=>x.remove());tmp=null;}
    const p=pt(e), other=drag.side==="L"?RN:LN, h=near(p,other); const a=drag; drag=null;
    if(!h) return; const b=h[1];
    if(a.id===b.id){ a.done=b.done=true; solved++; const [l,r]=a.side==="L"?[a,b]:[b,a]; draw(l,r,a.id);
      a.g.style.cursor=b.g.style.cursor="default";
      if(solved<4){ msg.className="msg ok"; msg.innerHTML=T(M.good,{남은:4-solved}); }
      else{ msg.className="msg ok"; msg.innerHTML=T(M.done);
        const go=document.createElement("button"); go.className="btn"; go.type="button"; go.textContent=T(M.sit);
        go.onclick=()=>{ S.wired=true; save(); closePanel(); openPanel("s3",stage3HTML(),bindStage3); }; $("#m3go").appendChild(go); }
    } else { msg.className="msg bad"; msg.innerHTML=T(M.wrong,{의심도:C.wrongSus}); if(C.wrongSus) addSus(C.wrongSus); }
  };
  svg.addEventListener("pointerup",end); svg.addEventListener("pointercancel",e=>{drag=null;if(tmp){tmp.forEach(x=>x.remove());tmp=null;}});
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
    m.className="msg ok";S.poem=v;S.meaning=why;S.poemAt=Date.now();save(); if(typeof netPoem==="function") netPoem();
    m.innerHTML=T(TEXT.s3.ok);
    $("#chk").disabled=true;t1.disabled=true;$("#t2").disabled=true;$("#hn").disabled=true;
    const nx=document.createElement("button");nx.className="btn";nx.type="button";nx.innerHTML=T(TEXT.s3.next);
    nx.onclick=()=>advance(4,T(TEXT.s3.found)); m.after(nx);
  };
}
function gate(){
  const tv=tvGate(), g=$("#gate");
  const pin=`<div class="card" style="border-color:var(--amber)"><b>${T(TEXT.door.gateTitle)}</b><p class="note">${T(TEXT.door.gateNote)}</p>
  <div class="row"><input type="password" id="pin" inputmode="numeric" autocomplete="off" aria-label="선생님 비밀번호" style="max-width:200px">
  <button class="btn" id="pk" type="button">${T(TEXT.door.gateBtn)}</button></div><div class="msg" id="pm" aria-live="polite"></div></div>`;
  g.innerHTML=tv?`<div class="card" style="border-color:var(--amber)"><b>${T(TEXT.door.waitTitle)}</b><p class="note">${T(TEXT.door.waitNote)}</p><div class="msg" id="wm" aria-live="polite"></div></div>
  <details id="pf" style="margin-top:14px"><summary class="note" style="cursor:pointer">${T(TEXT.door.pinFold)}</summary>${pin}</details>`:pin;
  const pm=g.querySelector("#pm"), pinEl=g.querySelector("#pin");
  g.querySelector("#pk").onclick=()=>{ if(pinEl.value===CONFIG.teacherPin){S.approved=true;stopVerdict();finish();}
    else{pm.className="msg bad";pm.innerHTML=T(TEXT.door.gateWrong);} };
  if(!tv) return;
  const wm=g.querySelector("#wm");
  netPoem().then(ok=>{ if(!ok&&!S.done){ wm.className="msg bad"; wm.innerHTML=T(TEXT.door.sendFail); g.querySelector("#pf").open=true; } });
  watchVerdict();
}
// TV에서 선생님이 누른 판정을 3초마다 확인
let verdictTimer=null;
function stopVerdict(){ clearInterval(verdictTimer); verdictTimer=null; }
function watchVerdict(){
  stopVerdict(); const room=S.room, gp=S.group, at=S.poemAt;
  const chk=()=>{
    if(S.done||S.stage!==4||S.poemAt!==at||S.room!==room||S.group!==gp) return stopVerdict();
    netVerdict(room,gp).then(v=>{
      if(!v||v.for!==at||!verdictTimer||S.done||S.stage!==4||S.poemAt!==at) return;
      stopVerdict();
      const k=v.kind||(v.ok?"pass":"vague");
      if(k==="pass"){ S.approved=true; finish(); } else rejected(k);
    });
  };
  verdictTimer=setInterval(chk,3000); chk();
}
// 선생님이 TV에서 '검열'이나 '보류'(예전 '의미 모호')를 누르면 장면을 보여 주고, 3단계로 돌아가 원래 시를 고쳐 씀
//  censor: 상관이 시를 붙잡음 → 의심도 가득 → 취조실(심문, 60초 손해)
//  vague : 접선책이 뜻이 흐리다며 돌려보냄
function rejected(kind){
  const poem=S.poem, mean=S.meaning, D=TEXT.door, cz=kind==="censor";
  S.stage=3; S.wired=true; S.poem=""; S.meaning=""; S.poemAt=0; save(); render(); window.scrollTo(0,0);
  const back=msg=>{ openKey("s3");
    const t1=$("#t1"), t2=$("#t2"), m=$("#msg");
    if(t1){ t1.value=poem||""; t2.value=mean||""; t1.oninput&&t1.oninput(); }
    if(m){ m.className="msg bad"; m.innerHTML=T(msg); } };
  const o=document.createElement("div"); o.className="overlay"; o.setAttribute("role","dialog");
  o.innerHTML='<div class="card" style="border-color:var(--stamp)">'+(cz?stageHTML("room","bossSus"):stageHTML("street","contactSide"))+`<h2>${T(cz?D.censorTitle:D.rejectTitle)}</h2>
  <p><b>${T(cz?D.censorWho:D.rejectWho)}</b><br>${T(cz?D.censorLine:D.rejectLine)}</p>
  <div class="paper"><span class="no">${T(cz?D.censorPoemLabel:D.rejectPoemLabel)}</span><div class="txt" style="white-space:pre-wrap">${esc(poem)}</div></div>
  ${cz?`<p class="msg bad"><b>${T(D.censorSus)}</b></p>`:`<p class="note">${T(D.rejectNote)}</p>`}
  <button class="btn" id="rjx" type="button">${T(cz?D.censorBtn:D.rejectBtn)}</button></div>`;
  document.body.appendChild(o);
  o.querySelector("#rjx").onclick=()=>{ o.remove();
    if(!cz) return back(D.rejected);
    addSus(Math.max(0,100-S.sus));   // 의심도 가득 → 취조실 장면(심문)이 뜸
    const ox=[...document.querySelectorAll(".overlay #ox")].pop();
    if(ox) ox.onclick=()=>{ ox.closest(".overlay").remove(); back(D.censorAfter); }; else back(D.censorAfter); };
}
function finish(){S.done=Date.now();save();render();window.scrollTo(0,0);}
/* ---------- 마무리 ---------- */
function finaleHTML(){
  const ch=netPiece(S.group), el=Math.round((S.done-S.start)/1000)+S.penalty-S.extra, over=remain()<0;
  return `<div style="display:flex;flex-direction:column;gap:18px;padding-top:24px"><h3>${S.group}조</h3><h1>${T(TEXT.finale.title)}</h1>
  <p class="story">${T(S.sus<30?TEXT.finale.good:S.sus<70?TEXT.finale.mid:TEXT.finale.bad)} ${T(TEXT.finale.after)}</p>
  <div class="big" aria-label="글자 조각">${esc(ch)}</div>
  <p style="text-align:center" class="note">${T(TEXT.finale.piece)}</p>
  <div class="stats"><span>걸린 시간 <b>${fmt(Math.max(0,el))}</b></span><span>사용한 힌트 <b>${S.hints}</b></span><span>심문 <b>${S.grilled}</b>회</span><span>의심도 <b>${Math.min(100,S.sus)}%</b></span>${over?`<span>제한 시간을 넘겼습니다</span>`:""}</div>
  <div class="card"><h3>${T(TEXT.finale.wrapTitle)}</h3>
  ${TEXT.finale.wrap.map(p=>`<p>${T(p)}</p>`).join("")}
  <p class="note">${T(TEXT.finale.next)}</p></div>
  <div class="foot"><span></span><span><button id="rbtn" type="button">${T(TEXT.common.restart)}</button></span></div></div>`;
}
function badHTML(){
  const B=TEXT.badend, el=Math.round((S.caught-S.start)/1000)+S.penalty-S.extra;
  return `<div style="display:flex;flex-direction:column;gap:18px;padding-top:24px"><h3>${S.group}조</h3><h1 style="color:var(--stamp)">${T(B.title)}</h1>
  <p class="story">${T(B.story)}</p>
  <div class="big" aria-label="글자 조각 없음" style="color:#6a6454;border-color:#6a6454">✕</div>
  <p style="text-align:center" class="note">${T(B.noPiece)}</p>
  <div class="stats"><span>버틴 시간 <b>${fmt(Math.max(0,el))}</b></span><span>사용한 힌트 <b>${S.hints}</b></span><span>심문 <b>${S.grilled}</b>회</span><span>의심도 <b>${Math.min(100,S.sus)}%</b></span></div>
  <div class="card"><h3>${T(TEXT.finale.wrapTitle)}</h3>
  ${TEXT.finale.wrap.map(p=>`<p>${T(p)}</p>`).join("")}
  <p class="note">${T(TEXT.finale.next)}</p></div>
  <div class="foot"><span></span><span><button id="rbtn" type="button">${T(TEXT.common.restart)}</button></span></div></div>`;
}
/* ---------- 관리 모드 ---------- */
function resetAll(){ const rm=S.room, gp=S.group; if(typeof netClear==="function"&&gp) netClear(rm,gp); S={group:null,start:null,penalty:0,extra:0,stage:0,hints:0,done:null,approved:false,sus:0,grilled:0,epi:false,poem:"",meaning:"",poemAt:0,caught:0,badSeen:false,wired:false,room:rm};save();render();window.scrollTo(0,0);}
function bindFoot(){
  const r=$("#rbtn"); if(r){ let t=null; r.onclick=()=>{ if(t){clearTimeout(t);resetAll();return;}
    r.textContent=T(TEXT.common.restartAgain); t=setTimeout(()=>{t=null;r.textContent=T(TEXT.common.restart);},4000); }; } }
/* 관리 모드: 교실 TV에서 조마다 켜고 끕니다(net.js의 netCtl이 받아 옴). 학생 화면에는 켜는 버튼이 없습니다.
   켜지면 화면 구석에 ‘메뉴’와 ‘넘기기 ▶’가 생겨 단계를 바로 넘길 수 있습니다. 기기에 기억하지 않습니다. */
let teacherMode=false; try{localStorage.removeItem("censor-escape-teacher");}catch(e){}   // 예전 버전이 기억해 둔 교사 모드 지우기
function setTeacherMode(on){ teacherMode=!!on; if(!on) document.querySelectorAll(".overlay.tmenu").forEach(x=>x.remove()); paintTeacher(); }
// 바로 가기 목록: [이름, 상태를 맞추고 화면을 여는 함수]
const JUMPS=[
  ["프롤로그",()=>{S.stage=0;}],
  ["1단계",()=>{S.stage=1;},"s1"],["서랍 게임",()=>{S.stage=1;},"m1"],
  ["2단계",()=>{S.stage=2;},"s2"],["서류함 게임",()=>{S.stage=2;},"m2"],
  ["상관 자리 비움",()=>{S.stage=3;},"boss"],["리본 걸기 게임",()=>{S.stage=3;S.wired=false;},"m3"],
  ["3단계",()=>{S.stage=3;S.wired=true;},"s3"],["문",()=>{S.stage=4;},"door"],
  ["에필로그",()=>{S.stage=4;S.done=Date.now();S.epi=false;}],
  ["결과 화면",()=>{S.stage=4;S.done=S.done||Date.now();S.epi=true;}],
  ["배드엔딩",()=>{S.stage=Math.max(1,Math.min(3,S.stage));S.caught=Date.now();S.badSeen=false;}]
];
const PANELS={s1:()=>[stage1HTML(),bindStage1],m1:()=>[m1HTML(),bindM1],s2:()=>[stage2HTML(),bindStage2],m2:()=>[m2HTML(),bindM2],m3:()=>[m3HTML(),bindM3],s3:()=>[stage3HTML(),bindStage3],door:()=>[doorHTML(),bindDoor]};
function openKey(k){ if(k==="boss"){ S.stage=3; save(); return playVN(BOSSOUT,()=>{render();window.scrollTo(0,0);}); } const [h,b]=PANELS[k](); openPanel(k,h,b); }
function jumpTo(i){
  vnStop(); document.querySelectorAll(".overlay").forEach(x=>x.remove());
  S.group=S.group||1; S.done=null; S.epi=false; S.start=S.start||Date.now();
  S.approved=false;   // 문 화면에서 비밀번호 칸이 다시 보이게
  S.caught=0; S.badSeen=false;
  stopVerdict();
  JUMPS[i][1](); save(); render(); window.scrollTo(0,0);
  if(JUMPS[i][2]) openKey(JUMPS[i][2]);
}
// 지금 화면 바로 다음으로
function teacherNext(){
  if(!S.group) return jumpTo(0);
  if(S.caught) return;
  if(S.done) return jumpTo(JUMPS.findIndex(j=>j[0]==="결과 화면"));
  if(S.stage===0) return jumpTo(1);
  const order=["s1","m1","s2","m2","boss","m3","s3","door"], room={1:"s1",2:"s2",3:S.wired?"s3":"m3",4:"door"};
  if(!curKey) return openKey(room[S.stage]);
  if(curKey==="door"){ S.approved=true; stopVerdict(); closePanel(); return finish(); }
  jumpTo(JUMPS.findIndex(j=>j[2]===order[order.indexOf(curKey)+1]));
}
function paintTeacher(){
  let t=document.querySelector("#tbar");
  const show=teacherMode&&!(S.done&&S.epi)&&!S.caught;
  if(!teacherMode){ if(t) t.remove(); return; }
  if(!t){ t=document.createElement("div"); t.id="tbar";
    t.innerHTML=`<span>관리 모드</span><button type="button" id="tmenu">메뉴</button><button type="button" id="tnext">넘기기 ▶</button>`;
    document.body.appendChild(t); t.querySelector("#tmenu").onclick=teacher; t.querySelector("#tnext").onclick=teacherNext; }
  t.querySelector("#tnext").hidden=!show;
}
function teacher(){
  if(!teacherMode) return;
  const o=document.createElement("div");o.className="overlay tmenu";o.setAttribute("role","dialog");o.setAttribute("aria-label","관리 모드");
  o.innerHTML=`<div class="card"><h2>관리 모드</h2>
    <p class="note">교실 TV에서 켠 관리 모드입니다. 화면 오른쪽 아래 ‘넘기기 ▶’로 문제를 풀지 않고 다음으로 넘어갈 수 있습니다. 끄는 것도 TV에서 합니다. 시간 추가(+5분)도 TV의 이 조 칸에서 합니다.</p>
    <h3>바로 가기</h3><div class="row tjump">${JUMPS.map((j,i)=>`<button class="btn ghost" type="button" data-j="${i}">${j[0]}</button>`).join("")}</div>
    <div class="row"><button class="btn ghost" id="rs" type="button">이 기기 처음부터</button></div>
    <h3>정답</h3><ul class="key"><li>1단계: ${CONFIG.cards.map((c,i)=>`${i+1}번 ${c.answer}`).join(", ")}</li>
    <li>2단계: ${CONFIG.docs.map((d,i)=>`${i+1}번 ${TLABEL[d.type]}`).join(", ")} / 삭제 도장 글의 특징은 ‘${esc(CONFIG.s2quiz.opts[CONFIG.s2quiz.ans])}’</li>
    <li>3단계: 삭제 대상 낱말(${CONFIG.s3.banned.join(", ")})을 쓰지 않고, 상징어를 넣은 두 줄 이상의 시와 숨은 뜻을 확인</li></ul>
    <div class="row"><button class="btn ghost" id="tc" type="button">닫기</button></div></div>`;
  document.body.appendChild(o);
  const q=s=>o.querySelector(s);
  q("#tc").onclick=()=>o.remove();
  o.querySelectorAll("[data-j]").forEach(b=>b.onclick=()=>{o.remove();jumpTo(+b.dataset.j);});
  q("#rs").onclick=()=>{o.remove();resetAll();};
}
// TV에서 '기록 초기화'나 '새 검열실 개설'을 누르면: 진행을 모두 지우고 처음 화면으로
function roomReset(closed){
  vnStop(); if(typeof stopVerdict==="function") stopVerdict(); disposePanels();
  document.querySelectorAll(".overlay").forEach(x=>x.remove());
  const rm=closed?"":S.room, rid=S.resetId;
  if(closed){ try{ history.replaceState(null,"",location.pathname); }catch(e){} }   // 주소의 ?room= 도 지움
  S={group:null,start:null,penalty:0,extra:0,stage:0,hints:0,done:null,approved:false,sus:0,grilled:0,epi:false,poem:"",meaning:"",poemAt:0,caught:0,badSeen:false,wired:false,room:rm,resetId:closed?null:rid};
  CONFIG.minutes=CONFIG.defaultMinutes||CONFIG.minutes; setTeacherMode(false); save(); render(); window.scrollTo(0,0);
  const o=document.createElement("div"); o.className="overlay"; o.setAttribute("role","dialog");
  o.innerHTML=`<div class="card"><h2>${T(closed?TEXT.reset.closedTitle:TEXT.reset.title)}</h2><p>${T(closed?TEXT.reset.closed:TEXT.reset.line)}</p><button class="btn" type="button">${T(TEXT.reset.btn)}</button></div>`;
  document.body.appendChild(o); o.querySelector("button").onclick=()=>o.remove();
}
// TV에서 준 추가 시간(초, 누적)을 반영. 붙잡힌 조는 붙잡힌 순간부터 다시 이어서 함
function applyBonus(sec){
  if(!Number.isInteger(sec)||sec<0||sec===S.extra||!S.group) return;
  const add=sec-S.extra; S.extra=sec;
  if(S.caught&&!S.done&&add>0){ S.start+=Date.now()-S.caught; S.caught=0; S.badSeen=false; vnStop();
    document.querySelectorAll(".overlay").forEach(x=>x.remove()); save(); render(); window.scrollTo(0,0); toast("시간이 "+Math.round(add/60)+"분 늘었다. 다시 임무로!",true); return; }
  save(); paintClock(); if(add>0) toast("시간이 "+Math.round(add/60)+"분 늘었다!",true);
}
render();
// 첫 화면을 띄운 뒤, 나머지 그림을 뒤에서 미리 받아 둠 (장면이 바뀔 때 끊기지 않게)
(function preload(){
  const urls=new Set(), walk=v=>{ if(typeof v==="string"){ if(/\.(png|webp)$/.test(v)) urls.add(v); } else if(v&&typeof v==="object") Object.values(v).forEach(walk); };
  [IMG,BLP,CUT,typeof DRAWER!=="undefined"?DRAWER:null].forEach(walk);
  const list=[...urls]; let i=0;
  const next=()=>{ if(i>=list.length) return; const im=new Image(); im.onload=im.onerror=next; im.src=list[i++]; };
  // 글꼴을 다 받은 뒤에 그림을 4장씩 차례로 (글꼴이 먼저)
  const go=()=>{ for(let k=0;k<4;k++) next(); };
  (document.fonts&&document.fonts.ready?document.fonts.ready:Promise.resolve()).then(()=>setTimeout(go,200),()=>setTimeout(go,200));
})();
