/* 교실 TV(teacher.html)로 진행 상황을 보내는 코드. 학생 게임이 쓰고, teacher.html도 같이 씁니다.
   Firebase Realtime Database의 REST 주소만 쓰므로 별도 라이브러리는 없습니다.
   인터넷이 막히거나 방 번호가 없으면 아무 일도 하지 않고 게임은 그대로 돌아갑니다. */
const NET={
  db:"https://gugeo-c23ae-default-rtdb.asia-southeast1.firebasedatabase.app",
  root:"censor"
};
const netRoomOk=r=>/^[0-9A-Za-z가-힣-]{2,12}$/.test(r||"");
const netPiece=g=>{const w=CONFIG.finalWord;return w[(g-1)%w.length];};
const netUrl=(room,g)=>`${NET.db}/${NET.root}/${encodeURIComponent(room)}${g?"/groups/"+g:""}.json`;
let _netSig="", _netAt=0;
function netPush(force){
  if(typeof S==="undefined"||!netRoomOk(S.room)||!S.group) return;
  const d={stage:S.stage|0, where:(typeof curKey!=="undefined"&&curKey)||"", sus:Math.min(100,S.sus|0), hints:S.hints|0, grilled:S.grilled|0,
    start:S.start||0, penalty:S.penalty|0, extra:S.extra|0, min:CONFIG.minutes, done:S.done||0, caught:S.caught||0, epi:S.done&&S.epi?1:0, piece:S.done?netPiece(S.group):"", t:Date.now()};
  const sig=JSON.stringify(Object.assign({},d,{t:0})), now=Date.now();
  if(!force&&sig===_netSig&&now-_netAt<10000) return;
  _netSig=sig; _netAt=now;
  try{ fetch(netUrl(S.room,S.group),{method:"PUT",body:JSON.stringify(d),keepalive:true}).catch(()=>{}); }catch(e){}
}
function netClear(room,g){ if(!netRoomOk(room)) return Promise.resolve();
  const del=u=>{ try{ return fetch(u,{method:"DELETE"}).catch(()=>{}); }catch(e){ return Promise.resolve(); } };
  // 방 전체는 규칙상 한 번에 못 지우므로, 조마다 groups·poems·verdict 칸을 한 요청으로 비웁니다
  if(!g){ const d={}; for(let n=1;n<=Math.max(CONFIG.groups,20);n++) ["groups","poems","verdict","ctl"].forEach(k=>d[k+"/"+n]=null);
    try{ return fetch(netUrl(room),{method:"PATCH",body:JSON.stringify(d)}).catch(()=>{}); }catch(e){ return Promise.resolve(); } }
  return Promise.all([del(netUrl(room,g)),del(netKindUrl(room,"poems",g)),del(netKindUrl(room,"verdict",g)),del(netKindUrl(room,"ctl",g))]); }
// 3단계 위장 시: 학생이 censor/방/poems/조 에 올리고, TV가 censor/방/verdict/조 에 판정을 적습니다.
// kind: pass(통과) · censor(검열에 걸림: 상관 등장, 취조실) · vague(의미 모호: 접선책이 돌려보냄)
// verdict.for 에는 판정한 시의 t를 적어, 시를 고쳐 다시 내면 예전 판정은 무시됩니다.
const netKindUrl=(room,kind,g)=>`${NET.db}/${NET.root}/${encodeURIComponent(room)}/${kind}/${g}.json`;
function netPoem(){
  if(typeof S==="undefined"||!netRoomOk(S.room)||!S.group||!S.poem) return Promise.resolve(false);
  const d={poem:S.poem.slice(0,500),meaning:(S.meaning||"").slice(0,300),t:S.poemAt||Date.now()};
  try{ return fetch(netKindUrl(S.room,"poems",S.group),{method:"PUT",body:JSON.stringify(d)}).then(r=>r.ok).catch(()=>false); }catch(e){ return Promise.resolve(false); }
}
function netVerdict(room,g){
  try{ return fetch(netKindUrl(room,"verdict",g),{cache:"no-store"}).then(r=>r.ok?r.json():null).catch(()=>null); }catch(e){ return Promise.resolve(null); }
}
function netJudge(room,g,kind,forT){
  try{ return fetch(netKindUrl(room,"verdict",g),{method:"PUT",body:JSON.stringify({ok:kind==="pass",kind,for:forT,t:Date.now()})}).then(r=>r.ok).catch(()=>false); }catch(e){ return Promise.resolve(false); }
}
setInterval(()=>netPush(false),4000);
// 제한 시간: TV에서 바꾼 분(censor/방/settings/minutes)을 8초마다 받아 CONFIG.minutes에 반영
const netSetUrl=room=>`${NET.db}/${NET.root}/${encodeURIComponent(room)}/settings.json`;
function netSettings(){
  if(typeof S==="undefined"||!netRoomOk(S.room)) return;
  try{ fetch(netSetUrl(S.room),{cache:"no-store"}).then(r=>r.ok?r.json():null).then(j=>{
    const m=j&&j.minutes; if(!Number.isInteger(m)||m<1||m>120||m===CONFIG.minutes) return;
    CONFIG.minutes=m; if(typeof paintClock==="function") paintClock(); netPush(true);
  }).catch(()=>{}); }catch(e){}
}
function netSetMinutes(room,m){
  try{ return fetch(netSetUrl(room),{method:"PUT",body:JSON.stringify({minutes:m})}).then(r=>r.ok).catch(()=>false); }catch(e){ return Promise.resolve(false); }
}
setTimeout(netSettings,300); setInterval(netSettings,8000);
// 조별 관리: censor/방/ctl/조 = {sec: TV에서 준 추가 시간(초, 누적), admin: 관리 모드}. 5초마다 받아 옴
function netCtl(){
  if(typeof S==="undefined") return;
  if(!netRoomOk(S.room)||!S.group){ if(typeof teacherMode!=="undefined"&&teacherMode) setTeacherMode(false); return; }
  try{ fetch(netKindUrl(S.room,"ctl",S.group),{cache:"no-store"}).then(r=>r.ok?r.json():null).then(j=>{
    j=j||{}; if(typeof applyBonus==="function") applyBonus(Number.isInteger(j.sec)?j.sec:S.extra);
    if(typeof setTeacherMode==="function"&&!!j.admin!==teacherMode) setTeacherMode(!!j.admin);
  }).catch(()=>{}); }catch(e){}
}
function netSetCtl(room,g,patch){
  try{ return fetch(netKindUrl(room,"ctl",g),{method:"PATCH",body:JSON.stringify(patch)}).then(r=>r.ok).catch(()=>false); }catch(e){ return Promise.resolve(false); }
}
setTimeout(netCtl,500); setInterval(netCtl,5000);
