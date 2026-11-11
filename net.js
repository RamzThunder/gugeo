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
    start:S.start||0, penalty:S.penalty|0, extra:S.extra|0, min:CONFIG.minutes, done:S.done||0, piece:S.done?netPiece(S.group):"", t:Date.now()};
  const sig=JSON.stringify(Object.assign({},d,{t:0})), now=Date.now();
  if(!force&&sig===_netSig&&now-_netAt<10000) return;
  _netSig=sig; _netAt=now;
  try{ fetch(netUrl(S.room,S.group),{method:"PUT",body:JSON.stringify(d),keepalive:true}).catch(()=>{}); }catch(e){}
}
function netClear(room,g){ if(!netRoomOk(room)) return Promise.resolve();
  try{ return fetch(netUrl(room,g),{method:"DELETE"}).catch(()=>{}); }catch(e){ return Promise.resolve(); } }
setInterval(()=>netPush(false),4000);
