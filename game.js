/* 게임 동작 코드. 대사는 story.js, 그림 경로는 assets.js에 있습니다. */
const TYPES=["직접","돌려","안으로"], TLABEL={직접:"직접 말하기",돌려:"돌려 말하기",안으로:"안으로 향하기"};
const KEY="censor-escape-v1";
let ROOT=document;
const $=s=>ROOT.querySelector(s);
const $$=s=>ROOT.querySelectorAll(s);
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
    o.innerHTML='<div class="card" style="border-color:var(--stamp)">'+stageHTML("interro","bossSus")+'<h2>상관이 의심한다</h2><p>“자네, 요즘 실수가 잦군. 잠깐 따라오게.”</p><p class="note">심문을 받느라 60초를 잃었습니다. 침착하게 다시 임무에 집중하세요.</p><button class="btn" id="ox" type="button">자리로 돌아간다</button></div>';
    document.body.appendChild(o); $("#ox").onclick=()=>o.remove(); return; }
  save(); paintSus();
}
function paintClock(){const r=remain(); document.querySelectorAll(".clk").forEach(c=>{c.textContent=fmt(r); c.classList.toggle("over",r<0);});}
function startTick(){paintSus();clearInterval(tick); tick=setInterval(paintClock,1000);}
function hint(text,key){
  S.hints++; S.penalty+=CONFIG.hintPenaltySec; save(); paintClock();
  return text;
}
function foot(){return `<div class="foot"><span>한 번 힌트를 쓸 때마다 ${CONFIG.hintPenaltySec}초가 줄어듭니다.</span><span><button id="rbtn" type="button">처음부터 다시</button> <button id="tbtn" type="button">교사용</button></span></div>`;}
const SPRH={guard:"84%",guardCalm:"84%",guardSus:"84%",boss:"88%",bossSus:"88%",contact:"86%",contactSide:"86%",contactHappy:"86%"};
const sprKey=(k,m)=>!k?k:(({guard:{calm:"guardCalm",sus:"guardSus"},boss:{sus:"bossSus"},contact:{side:"contactSide",happy:"contactHappy"}}[k]||{})[m])||k;
function stageHTML(bg,spr){
  return `<div class="stage"><img class="bgimg" src="${IMG[bg]}" alt="">${spr?`<span class="sw" style="--h:${SPRH[spr]}"><img class="spr0" src="${IMG[spr]}" alt="">${BLP[spr]?`<img class="pt" style="left:${BLP[spr].l}%;top:${BLP[spr].t}%;width:${BLP[spr].w}%;visibility:hidden" src="${BLP[spr].s}" alt="">`:''}</span>`:''}</div>`;
}
let vnTimer=null;
(function blinkLoop(){
  const rm=matchMedia("(prefers-reduced-motion: reduce)").matches; if(rm) return;
  const once=cb=>{const b=document.querySelector(".stage .pt,.overlay .pt"); if(!b){cb&&cb();return;} b.style.visibility="visible"; setTimeout(()=>{b.style.visibility="hidden"; cb&&cb();},120);};
  const go=()=>setTimeout(()=>{ once(()=>{ if(Math.random()<.2) setTimeout(()=>once(),160); }); go(); },2500+Math.random()*3000);
  go();
})();
function playVN(script,done){
  const a=$("#app"); let i=0, typing=false, full="", pos=0, bg="gate";
  a.innerHTML=`<div class="vn"><div class="vtop"><span>${S.group}조</span><button type="button" id="vskip">건너뛰기</button></div>
   <div class="pixwrap" id="vstage"></div>
   <div class="vbox" id="vbox" tabindex="0"><div class="vnm" id="vnm"></div><div class="vtx" id="vtx" aria-live="polite"></div><div class="vflash" id="vfl"></div><div class="vch" id="vch"></div><span class="vnx" id="vnx">▼</span></div></div>`;
  const end=()=>{clearInterval(vnTimer);done();};
  $("#vskip").onclick=end;
  const idx=id=>script.findIndex(x=>x.id===id);
  const show=()=>{
    const st=script[i]; if(!st){end();return;}
    if(st.bg) bg=st.bg;
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
    if(typing){clearInterval(vnTimer);$("#vtx").textContent=full;finishType();return;}
    if(st.choices) return;
    if(st.goto){i=idx(st.goto);} else i++;
    if(i>=script.length){end();return;} show();
  };
  $("#vbox").onclick=next;
  $("#vbox").onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();next();}};
  show(); $("#vbox").focus({preventScroll:true});
}
let panels={}, curPanel=null;
function openPanel(key,html,binder){
  let el=panels[key];
  if(!el){ el=document.createElement("div"); el.className="panel"; el.setAttribute("role","dialog");
    el.innerHTML=`<div class="pwrap">${bar()}<div class="pbody">${html}</div><div class="row"><button class="btn ghost pclose" type="button">닫기 (풀던 내용은 그대로 남아요)</button></div></div>`;
    document.body.appendChild(el); panels[key]=el; ROOT=el; binder(); el.querySelector(".pclose").onclick=closePanel; }
  ROOT=el; el.hidden=false; curPanel=el; document.body.style.overflow="hidden"; paintClock(); paintSus(); el.scrollTop=0;
}
function closePanel(){ if(curPanel) curPanel.hidden=true; curPanel=null; ROOT=document; document.body.style.overflow=""; }
function disposePanels(){ Object.values(panels).forEach(e=>e.remove()); panels={}; curPanel=null; ROOT=document; document.body.style.overflow=""; }
function render(){
  disposePanels();
  const a=$("#app"); document.querySelectorAll(".overlay").forEach(x=>x.remove());
  if(!S.group){ a.innerHTML=startHTML(); bindStart(); return; }
  if(S.done&&!S.epi){ playVN(EPI,()=>{S.epi=true;save();render();window.scrollTo(0,0);}); return; }
  if(S.done){ a.innerHTML=finaleHTML(); bindFoot(); return; }
  if(S.stage===0){ a.innerHTML=introHTML(); bindFoot(); $("#go").onclick=()=>{playVN(PRO,()=>{S.stage=1;S.start=Date.now();save();render();window.scrollTo(0,0);toast("검열실에 들어왔다. 물건을 눌러 조사해 보자. 반짝이는 곳부터 살펴보면 좋다.");});}; return;}
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
  const inv=ITEMS.map(([n,k],i)=>S.stage>i+1?`<span class="it"><img class="ico" src="${IMG[k]}" alt="">${n}</span>`:"").join("")||'<span>아직 얻은 물건이 없다</span>';
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
  <div class="cap" id="cap" aria-hidden="true">물건을 눌러 조사하세요</div>
  <div class="toast" id="toast" aria-live="polite">검열실이다. 물건을 눌러 조사해 보자.</div>
  <div class="inv"><b>가진 물건</b>${inv}</div></div>`;
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
  if(o==="clock") return toast("남은 시간 "+fmt(remain())+". 의심도가 오르면 시간도 줄어든다.");
  if(o==="drawer"){ if(S.stage===1) return openPanel("s1",stage1HTML(),bindStage1); return toast("서랍은 이미 비었다. 열쇠는 챙겼다."); }
  if(o==="cabinet"){ if(S.stage<2) return toast("서류함이 잠겨 있다. 열쇠가 필요하다. 어디엔가 있을 것이다.");
    if(S.stage===2) return openPanel("s2",stage2HTML(),bindStage2); return toast("서류함의 문서는 모두 처리했다."); }
  if(o==="typewriter"){ if(S.stage<3) return toast("타자기에 리본이 없다. 아직 글을 칠 수 없다."); 
    if(S.stage===3) return openPanel("s3",stage3HTML(),bindStage3); return toast("시는 이미 원고 더미에 끼워 넣었다. 이제 나가야 한다."); }
  if(o==="door"){ if(S.stage<4) return toast("문이 잠겨 있다. 문 위의 불빛이 모두 켜져야 열릴 것 같다.");
    return openPanel("door",doorHTML(),bindDoor); }
}
function doorHTML(){return `<h2>접선 지점으로 가는 문</h2><p class="story">문 위의 불빛 세 개가 모두 켜졌다. 위장한 시를 끼운 원고 더미를 들고 나가면, 문밖에서 접선책이 기다린다. 선생님(접선책)께 우리가 쓴 시를 보여 드리고 비밀번호를 받으세요.</p><div id="gate"></div>`;}
function bindDoor(){ if(CONFIG.requireTeacher&&!S.approved) gate(); else finish(); }
/* ---------- 시작 ---------- */
function startHTML(){
  const g=Array.from({length:CONFIG.groups},(_,i)=>`<button type="button" data-g="${i+1}">${i+1}</button>`).join("");
  return `<div style="padding-top:20px;display:flex;flex-direction:column;gap:18px">
  <div class="pixwrap">${stageHTML("gate")}</div>
  <h3>조선총독부 경무국 도서과 · 잠입 임무</h3><h1>검열국을 탈출하라</h1>
  <p class="story">1940년 초 경성. 당신의 모둠은 검열관으로 위장해 도서과에 잠입한 독립운동가다. 검열실에서 중요한 메시지를 ‘시’로 위장해 검열 통과 원고에 섞어 내보내고, 정체가 드러나기 전에 빠져나와야 한다. 제한 시간은 ${CONFIG.minutes}분이다.</p>
  <div class="card"><h3>우리 모둠 번호를 고르세요</h3><div class="glist" id="gl">${g}</div>
  <button class="btn" id="ok" type="button" disabled>들어가기</button></div></div>`;
}
function bindStart(){
  let pick=null;
  document.querySelectorAll("#gl button").forEach(b=>b.onclick=()=>{pick=+b.dataset.g;
    document.querySelectorAll("#gl button").forEach(x=>x.classList.toggle("on",x===b)); $("#ok").disabled=false;});
  $("#ok").onclick=()=>{S.group=pick;S.stage=0;save();render();};
}
function introHTML(){
  return `<div class="wrap" style="padding:0"><div style="display:flex;flex-direction:column;gap:16px;padding-top:24px">
  <h2>${S.group}조, 검열실에 들어서다</h2>
  <div class="card"><p>겉으로는 총독부 검열관 보조, 속으로는 독립운동가다. 우리의 임무는 동지에게 전할 메시지를 시처럼 꾸며 검열을 통과시키는 것이다. 실수가 쌓이면 <b>의심도</b>가 오르고, 가득 차면 심문을 받아 시간을 잃는다.</p>
  <ol class="key" style="margin:0;padding-left:20px"><li>첫째 임무(책상 서랍): 시대마다 시의 모습이 다르다. 압수 원고의 시기를 알아내 기록부에 적으며 감을 익힌다.</li>
  <li>둘째 임무(서류함): 압수 문서를 표현 방식별로 나눈다. 어떤 글이 삭제되고 어떤 글이 통과되는지 눈에 익힌다.</li>
  <li>셋째 임무(타자기): 동지에게 전할 메시지를 검열관이 읽어도 모르게 시로 위장해 쓴다.</li>
  <li>마지막: 위장한 시를 원고 더미에 끼우고, 문 위의 불빛이 모두 켜지면 탈출한다.</li></ol>
  <p class="note">이야기가 먼저 나오고, 그다음 방 안의 물건을 눌러 조사하세요. 모둠원이 의견을 나누며 한 화면으로 함께 풀어요. 쓸모없어 보이는 물건에도 이야기가 있습니다. 시간은 검열실에 들어간 뒤부터 잽니다.</p>
  <button class="btn" id="go" type="button">정문으로 향한다</button></div></div></div>${foot()}`;
}
/* ---------- 1단계 ---------- */
function stage1HTML(){
  const cards=CONFIG.cards.map((c,i)=>{
    const toks=c.text.map((ln,li)=>ln.split(" ").map((w,wi)=>`<button type="button" class="tok" data-c="${i}" data-w="${li}-${wi}" data-t="${esc(w)}">${esc(w)}</button>`).join(" ")).join("<br>");
    const chs=CONFIG.periods.map(p=>`<button type="button" class="ch" data-c="${i}" data-p="${p}">${p}</button>`).join("");
    return `<div class="paper" id="card${i}"><span class="no">압수 원고 ${["①","②","③","④"][i]||i+1}</span>
      <div class="txt">${toks}</div>
      <div class="choices" role="group" aria-label="시기">${chs}</div><div class="why" id="why${i}" hidden></div></div>`;}).join("");
  return `<div style="display:flex;flex-direction:column;gap:14px"><h2>첫째 임무: 압수 원고 기록부</h2>
  <p class="story">서랍에서 압수 원고 기록부가 나왔다. 시를 위장하려면 시대마다 시가 어떤 모습인지부터 알아야 한다. 상관이 말한다. “시기별로 검열 기준이 다르니, 원고마다 쓰인 시기를 적게.” 시기를 고르고, 근거가 되는 낱말을 눌러 표시하세요.</p>
  <div class="grid">${cards}</div>
  <div class="row"><button class="btn" id="chk" type="button">기록부 제출</button><button class="btn ghost" id="hn" type="button">힌트 (-${CONFIG.hintPenaltySec}초)</button></div>
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
    if(hstep===0){ $("#msg").className="msg"; $("#msg").textContent="힌트: 같은 시기에는 같은 일이 벌어집니다. 이름·말·만주·새 학문처럼 시대 상황과 맞닿은 낱말을 먼저 찾아보세요."; hstep=1; }
    else{ document.querySelectorAll(`.tok[data-c="${open}"]`).forEach(t=>{ if(c.clues.some(k=>t.dataset.t.includes(k))) t.classList.add("hint");});
      $("#msg").textContent=`힌트: 붉은 테두리가 ${open+1}번째 원고의 단서 낱말입니다.`; }
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
    if(all){m.className="msg ok";m.textContent="기록이 정확하다. 상관이 고개를 끄덕인다.";
      const nx=document.createElement("button");nx.className="btn";nx.type="button";nx.textContent="서랍 안쪽을 더듬는다";
      nx.onclick=()=>advance(2,"서랍 깊숙한 곳에서 서류함 열쇠를 찾았다! 서류함을 살펴보자."); $("#chk").replaceWith(nx);}
    else{m.className="msg bad";m.textContent="붉게 표시된 원고를 다시 보세요. 시기를 골랐는지, 근거 낱말을 눌렀는지 확인하세요.";}
  };
}
/* ---------- 2단계 ---------- */
function stage2HTML(){
  const docs=CONFIG.docs.map((d,i)=>`<div class="paper" id="d${i}"><span class="no">압수 문서 ${i+1}</span>
    <div class="txt">${esc(d.text).replace(/\n/g,"<br>")}</div>
    <div class="choices" role="group" aria-label="표현 방식">${TYPES.map(t=>`<button type="button" class="ch" data-d="${i}" data-t="${t}">${TLABEL[t]}</button>`).join("")}</div>
    <span class="stamp ${d.type==="직접"?"":"pass"}" id="st${i}">${d.type==="직접"?"削除":"통과"}</span></div>`).join("");
  return `<div style="display:flex;flex-direction:column;gap:14px"><h2>둘째 임무: 삭제와 통과</h2>
  <p class="story">서류함이 열렸다. 어떤 글이 삭제되는지 눈에 익혀 두자. 상관의 지시다. “총독부를 직접 비판하고 저항하는 글에는 삭제 도장을 찍게. 나머지는 통과다.” 문서마다 표현 방식을 고르세요. 모두 맞으면 도장이 찍힙니다.</p>
  <div class="grid">${docs}</div>
  <div class="row"><button class="btn" id="chk" type="button">분류 제출</button><button class="btn ghost" id="hn" type="button">힌트 (-${CONFIG.hintPenaltySec}초)</button></div>
  <div class="msg" id="msg" aria-live="polite"></div><div id="quiz"></div></div>`;
}
function bindStage2(){
  ui.cls={};
  document.querySelectorAll(".ch[data-d]").forEach(b=>b.onclick=()=>{const d=b.dataset.d;ui.cls[d]=b.dataset.t;
    document.querySelectorAll(`.ch[data-d="${d}"]`).forEach(x=>x.classList.toggle("on",x===b));});
  let hs=0;
  $("#hn").onclick=()=>{hint(); $("#msg").className="msg";
    $("#msg").textContent=hs===0?"힌트: 직접 말하기는 비판과 저항을 그대로 말합니다. 돌려 말하기는 봄·씨앗·별 같은 상징에 담습니다. 안으로 향하기는 고향·가족·일상·내면을 노래합니다."
      :"힌트: 도장이 찍히는 글은 검열관이 한눈에 위험하다고 알아보는 글입니다. 먼저 직접 말하기에 해당하는 문서를 찾아보세요."; hs=1;};
  $("#chk").onclick=()=>{
    let all=true;
    let wrong=0;
    CONFIG.docs.forEach((d,i)=>{const el=$("#d"+i); el.classList.remove("bad");
      if(ui.cls[i]===d.type){el.classList.add("ok");} else {all=false; wrong++; void el.offsetWidth; el.classList.add("bad"); el.classList.remove("ok");}});
    const m=$("#msg");
    if(!all){m.className="msg bad";m.textContent="붉게 표시된 문서를 다시 나눠 보세요. 모두 골라야 합니다.";addSus(8*wrong);return;}
    m.className="msg ok";m.textContent="분류 완료. 도장을 찍는다...";
    document.querySelectorAll(".ch").forEach(b=>b.disabled=true); $("#chk").disabled=true; $("#hn").disabled=true;
    let n=0; CONFIG.docs.forEach((d,i)=>{ setTimeout(()=>$("#st"+i).classList.add("show"),400+n*450); n++;});
    setTimeout(()=>{$("#hn").disabled=false; showQuiz();},600+n*500);
  };
}
function showQuiz(){
  const q=CONFIG.s2quiz; ui.quiz=null;
  $("#quiz").innerHTML=`<div class="card q"><h3>도장을 찍으며 든 생각</h3><p><b>${esc(q.q)}</b></p>
  ${q.opts.map((o,i)=>`<button type="button" class="opt" data-o="${i}">${esc(o)}</button>`).join("")}<div class="msg" id="qm" aria-live="polite"></div></div>`;
  document.querySelectorAll(".opt").forEach(b=>b.onclick=()=>{
    const i=+b.dataset.o;
    if(i===q.ans){b.classList.add("good");document.querySelectorAll(".opt").forEach(x=>x.disabled=true);
      $("#qm").className="msg ok";$("#qm").textContent="맞습니다. 검열은 지배와 저항을 곧바로 말하는 글을 노렸습니다. 그렇다면 같은 마음을 어떻게 전해야 할까요?";
      const nx=document.createElement("button");nx.className="btn";nx.type="button";nx.textContent="서류함 맨 아래 칸을 연다";
      nx.onclick=()=>advance(3,"서류함 맨 아래에서 타자기 리본을 찾았다! 타자기로 가 보자."); $("#qm").after(nx);}
    else{b.classList.add("no");$("#qm").className="msg bad";$("#qm").textContent="다시 생각해 보세요. 도장이 찍힌 문서의 표현 방식은 무엇이었나요?";addSus(8);}
  });
}
/* ---------- 3단계 ---------- */
function stage3HTML(){
  const s=CONFIG.s3;
  return `<div style="display:flex;flex-direction:column;gap:14px"><h2>셋째 임무: 동지에게 보낼 쪽지</h2>
  <p class="story">타자기에 리본을 끼웠다. 동지에게 전할 메시지를 시처럼 꾸며 검열 통과 원고 더미에 섞어 내보낼 것이다. 뜻은 전하되 검열관은 눈치채지 못하게, 줄을 바꿔 시처럼 쓰세요.</p>
  <div class="paper"><span class="no">전달할 메시지</span><div class="txt">${esc(s.draft)}</div></div>
  <div class="card"><h3>검열관이 걸러 내는 낱말</h3><div class="banned" id="bw">${s.banned.map(w=>`<span data-w="${esc(w)}">${esc(w)}</span>`).join("")}</div>
  <label for="t1"><b>① 시로 위장한 메시지</b> <span class="note">두 줄 이상, 삭제 대상 낱말 없이, 상징이 되는 말을 하나 이상 넣으세요.</span></label>
  <textarea id="t1" placeholder="줄을 바꿔 시처럼 써 보세요"></textarea>
  <label for="t2"><b>② 동지만 아는 뜻</b> <span class="note">내 시에 숨긴 뜻을 풀어 쓰세요.</span></label>
  <textarea id="t2" style="min-height:70px" placeholder="예) ‘ ○○ ’은(는) …을 뜻한다."></textarea>
  <div class="row"><button class="btn" id="chk" type="button">검열 받기</button><button class="btn ghost" id="hn" type="button">힌트 (-${CONFIG.hintPenaltySec}초)</button></div>
  <div class="msg" id="msg" aria-live="polite"></div><div id="gate"></div></div></div>`;
}
function bindStage3(){
  const s=CONFIG.s3, t1=$("#t1");
  const hits=()=>s.banned.filter(w=>t1.value.includes(w));
  t1.oninput=()=>document.querySelectorAll("#bw span").forEach(sp=>sp.classList.toggle("hit",t1.value.includes(sp.dataset.w)));
  let hs=0;
  $("#hn").onclick=()=>{hint();$("#msg").className="msg";
    $("#msg").textContent=hs===0?"힌트: 해방과 희망을 직접 말하지 말고 자연물에 맡겨 보세요. 겨울 뒤에 오는 것, 어둠 뒤에 오는 것은 무엇일까요?"
      :`힌트: 이런 말을 쓸 수 있어요. ${s.symbols.slice(0,8).join(", ")}`; hs=1;};
  $("#chk").onclick=()=>{
    const m=$("#msg"), v=t1.value.trim(), why=$("#t2").value.trim(), h=hits();
    if(h.length){m.className="msg bad";m.textContent=`동료 검열관이 ‘${h.join("’, ‘")}’을(를) 찾아냈다! 다른 말로 바꾸세요.`;addSus(15);return;}
    if(v.length<12){m.className="msg bad";m.textContent="시가 너무 짧습니다. 12자 이상으로 쓰세요.";return;}
    if(v.split(/\n/).filter(x=>x.trim()).length<2){m.className="msg bad";m.textContent="시처럼 보이지 않습니다. 줄을 바꿔 두 줄 이상으로 쓰세요.";addSus(5);return;}
    if(!s.symbols.some(w=>v.includes(w))){m.className="msg bad";m.textContent="뜻을 대신 말해 줄 상징이 보이지 않습니다. 봄, 새벽, 별, 씨앗처럼 낱말을 넣어 보세요.";addSus(5);return;}
    if(why.length<6){m.className="msg bad";m.textContent="동지만 아는 뜻을 6자 이상으로 적으세요.";return;}
    m.className="msg ok";S.poem=v;S.meaning=why;save();
    m.textContent="통과! 동료 검열관은 평범한 시로 여기고 지나쳤다.";
    $("#chk").disabled=true;t1.disabled=true;$("#t2").disabled=true;$("#hn").disabled=true;
    const nx=document.createElement("button");nx.className="btn";nx.type="button";nx.textContent="시를 원고 더미에 끼워 넣는다";
    nx.onclick=()=>advance(4,"위장한 시를 원고 더미에 끼워 넣었다. 문 위의 불빛이 모두 켜졌다. 문으로 가자!"); m.after(nx);
  };
}
function gate(){
  $("#gate").innerHTML=`<div class="card" style="border-color:var(--amber)"><b>접선책이 시를 확인한다</b><p class="note">선생님께 위장한 시를 보여 드리고 비밀번호를 받으세요.</p>
  <div class="row"><input type="password" id="pin" inputmode="numeric" autocomplete="off" aria-label="선생님 비밀번호" style="max-width:200px">
  <button class="btn" id="pk" type="button">통로 열기</button></div><div class="msg" id="pm" aria-live="polite"></div></div>`;
  $("#pk").onclick=()=>{ if($("#pin").value===CONFIG.teacherPin){S.approved=true;finish();}
    else{$("#pm").className="msg bad";$("#pm").textContent="비밀번호가 맞지 않습니다.";} };
}
function finish(){S.done=Date.now();save();render();window.scrollTo(0,0);}
/* ---------- 마무리 ---------- */
function finaleHTML(){
  const w=CONFIG.finalWord, ch=w[(S.group-1)%w.length], el=Math.round((S.done-S.start)/1000)+S.penalty-S.extra, over=remain()<0;
  return `<div style="display:flex;flex-direction:column;gap:18px;padding-top:24px"><h3>${S.group}조</h3><h1>탈출 성공!</h1>
  <p class="story">${S.sus<30?"한 번도 의심받지 않은 완벽한 위장이었다.":S.sus<70?"아슬아슬했지만 끝내 정체를 들키지 않았다.":"가까스로 빠져나왔다. 조금만 늦었다면 붙잡혔을 것이다."} 위장한 시는 검열 통과 원고에 섞여 인쇄소 동지에게 전해졌다.</p>
  <div class="big" aria-label="글자 조각">${esc(ch)}</div>
  <p style="text-align:center" class="note">이 글자를 들고 다른 모둠과 모여 여덟 모둠의 조각으로 문장을 맞추세요.</p>
  <div class="stats"><span>걸린 시간 <b>${fmt(Math.max(0,el))}</b></span><span>사용한 힌트 <b>${S.hints}</b></span><span>심문 <b>${S.grilled}</b>회</span><span>의심도 <b>${Math.min(100,S.sus)}%</b></span>${over?`<span>제한 시간을 넘겼습니다</span>`:""}</div>
  <div class="card"><h3>활동지로 돌아가 정리하세요</h3>
  <p>생각해 볼 것: 우리는 메시지를 시로 위장했다. 실제 시인들은 시 속에 어떤 마음을 숨겼을까?</p>
  <p>(시대 상황) 때문에 시인은 (표현 방식)(으)로 말했다.<br>근거가 된 시구를 하나 골라 적어 봅시다.</p>
  <p class="note">다음 시간: 표현은 했지만 끝내 발표하지 못한 시를 만납니다.</p></div>
  <div class="foot"><span></span><span><button id="rbtn" type="button">처음부터 다시</button> <button id="tbtn" type="button">교사용</button></span></div></div>`;
}
/* ---------- 교사용 ---------- */
function resetAll(){S={group:null,start:null,penalty:0,extra:0,stage:0,hints:0,done:null,approved:false,sus:0,grilled:0,epi:false,poem:"",meaning:""};save();render();window.scrollTo(0,0);}
function bindFoot(){const b=$("#tbtn"); if(b) b.onclick=teacher;
  const r=$("#rbtn"); if(r){ let t=null; r.onclick=()=>{ if(t){clearTimeout(t);resetAll();return;}
    r.textContent="정말 처음부터? 한 번 더 누르세요"; t=setTimeout(()=>{t=null;r.textContent="처음부터 다시";},4000); }; } }
function teacher(){
  const o=document.createElement("div");o.className="overlay";o.setAttribute("role","dialog");o.setAttribute("aria-label","교사용");
  o.innerHTML=`<div class="card"><h2>교사용</h2><div class="row"><input type="password" id="tp" inputmode="numeric" autocomplete="off" aria-label="비밀번호" style="max-width:200px">
  <button class="btn" id="to" type="button">열기</button><button class="btn ghost" id="tc" type="button">닫기</button></div><div id="tb"></div></div>`;
  document.body.appendChild(o);
  $("#tc").onclick=()=>o.remove();
  $("#to").onclick=()=>{ if($("#tp").value!==CONFIG.teacherPin){$("#tb").innerHTML='<p class="msg bad">비밀번호가 맞지 않습니다.</p>';return;}
    $("#tb").innerHTML=`<div class="row"><button class="btn" id="p5" type="button">+5분</button><button class="btn ghost" id="rs" type="button">이 기기 처음부터</button></div><p class="msg" id="tm"></p>
    <h3>정답</h3><ul class="key"><li>1단계: ${CONFIG.cards.map((c,i)=>`${i+1}번 ${c.answer}`).join(", ")}</li>
    <li>2단계: ${CONFIG.docs.map((d,i)=>`${i+1}번 ${TLABEL[d.type]}`).join(", ")} / 공통점은 ‘${esc(CONFIG.s2quiz.opts[CONFIG.s2quiz.ans])}’</li>
    <li>3단계: 삭제 대상 낱말(${CONFIG.s3.banned.join(", ")})을 쓰지 않고, 상징어를 넣은 두 줄 이상의 시와 숨은 뜻을 확인</li></ul>`;
    $("#p5").onclick=()=>{S.extra+=300;save();paintClock();$("#tm").textContent="5분을 더했습니다.";};
    $("#rs").onclick=()=>{o.remove();resetAll();}; };
}
render();
