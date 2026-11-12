/* ===== 글꼴 설정 =====
   이 파일만 고치면 게임과 교실 TV의 글꼴이 바뀝니다. 고친 뒤 python3 build.py 를 실행하세요.

   ▶ 바꾸는 법: 아래 FONT_USE 에서 자리 옆 "글꼴 이름"을 FONT_LIST 의 이름으로 바꿔 넣으면 끝.
       예)  제목: "그리운경찰인권",   →   제목: "조선100년",

   ▶ 복붙용 글꼴 이름 (FONT_LIST 에 있는 것)
       "갈무리"          도트(픽셀) 글씨            0.7MB
       "갈무리장체"       갈무리를 좁게 (굵게 없음)   0.2MB
       "모나10"          도트 글씨, 갈무리와 비슷    0.7MB  (굵게 포함)
       "모나10x12"       도트 글씨, 세로로 길쭉(장체 느낌)  0.3MB  (굵게 포함)
       "모나12"          도트 글씨, 크고 또렷        2.6MB  (굵게 포함)
       "모나8x12"        도트 글씨, 아주 좁게 (굵게 없음)  0.3MB
       "델타돋움"         도트 글씨, 돋움 느낌 (굵게 없음)  0.5MB
       "그리운묘은흘림"   붓으로 흘려 쓴 손글씨       3.3MB
       "그리운경찰인권"   또박또박 관청 손글씨        1.1MB
       "조선100년"        신문 활자 같은 명조        1.2MB
       "신라문화"         붓글씨 느낌 제목체          2.3MB  (굵게까지 쓰면 +2.4MB)
       "기기고딕"         기기에 깔린 기본 고딕       0MB   받을 것 없음
       "기기명조"         기기에 깔린 기본 명조       0MB   받을 것 없음

   ▶ 새 글꼴 넣기: 파일을 fonts/ 폴더에 넣고 FONT_LIST 에 한 줄 더 적으세요.
       "이름": {file:"파일이름.woff2", bold:"굵은파일.woff2(없으면 지우기)", note:"설명"},
     woff2 가 가장 가볍습니다. 눈누(noonnu.cc) 글꼴은 웹용 woff2 주소가 따로 있으니 그걸 받아 쓰세요.
*/

/* 1) 쓸 수 있는 글꼴 목록 */
const FONT_LIST={
  "갈무리":        {file:"Galmuri11.woff2", bold:"Galmuri11-Bold.woff2", note:"SIL OFL 1.1"},
  "갈무리장체":     {file:"Galmuri11-Condensed.woff2", note:"SIL OFL 1.1"},
  "모나10":        {file:"Mona10.woff2", bold:"Mona10-Bold.woff2", note:"모나 글꼴, SIL OFL 1.1"},
  "모나10x12":     {file:"Mona10x12.woff2", bold:"Mona10x12-Bold.woff2", note:"모나 글꼴, SIL OFL 1.1"},
  "모나12":        {file:"Mona12.woff2", bold:"Mona12-Bold.woff2", note:"모나 글꼴, SIL OFL 1.1"},
  "모나8x12":      {file:"Mona8x12.woff2", note:"모나 글꼴, SIL OFL 1.1"},
  "델타돋움":       {file:"DeltaDotumKR.woff2", note:"눈누 배포 원본"},
  "그리운묘은흘림":  {file:"Griun_MyoeunHeullim-Rg.woff2", note:"무료, 수정·판매 금지 (눈누 배포 원본)"},
  "그리운경찰인권":  {file:"Griun_PolHumanrights-Rg.woff2", note:"무료, 수정·판매 금지 (눈누 배포 원본)"},
  "조선100년":      {file:"ChosunCentennial.woff2", note:"무료, 배포된 형태 그대로 (눈누 배포 원본)"},
  "신라문화":       {file:"Shilla_CultureM-Medium.woff2", bold:"Shilla_CultureB-Bold.woff2", note:"눈누 배포 원본"},
  "기기고딕":       {system:'"Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",sans-serif'},
  "기기명조":       {system:'"AppleMyungjo","Batang","Noto Serif KR",serif'}
};

/* 2) 자리별 글꼴 — 여기 이름만 바꾸세요 */
const FONT_USE={
  // 학생 게임
  기본:    "모나10x12",          // 버튼, 상태줄 시간, 안내 상자 제목, 결과 숫자 등 아래에 없는 나머지 (굵은 글씨가 많아 굵은체 있는 글꼴 추천)
  본문:    "델타돋움",          // 대사(장면 대화·선택지)와 안내문(단계 설명, 작은 안내, 맞음·틀림 메시지, 알림 줄, 임무 목록)
  조번호:  "모나10x12",          // 위쪽 상태줄과 대사 화면 왼쪽 위의 "N조"
  제목:    "그리운경찰인권",    // 게임 제목, 단계 제목
  도장:    "그리운경찰인권",    // 삭제·통과 도장
  종이글:  "그리운묘은흘림",    // 시구 카드, 압수 문서, 전할 메시지
  시쓰기:  "그리운묘은흘림",    // 3단계에서 학생이 위장 시를 쓰는 칸
  자막:    "갈무리장체",    // 장면 자막 ("1940년대 초, 경성, 어느 날 새벽" 등)
  이름표:  "모나10x12",          // 대사 위에 뜨는 말하는 사람 이름
  글자조각: "조선100년",          // 결과 화면의 큰 글자 조각
  // 교실 TV
  TV조번호:  "신라문화",  // 조 카드 왼쪽 위의 "N조"
  TV글자조각: "조선100년",  // 탈출한 조 카드에 뜨는 큰 글자
  TV모은글자: "조선100년",  // 아래쪽 '그날이오면-심훈' 글자 칸
  TV추가시간: "그리운묘은흘림",  // +5분 버튼 위 '총 +N분' 꼬리표
  TV통신:   "신라문화",   // 오른쪽 위 '통신 양호 / 통신 끊김' 꼬리표
  TVQR번호: "그리운경찰인권",   // QR 크게 보기 창의 '검열실 번호 8771'
  TVQR주소: "조선100년",         // QR 크게 보기 창의 입장 주소와 '닫힙니다' 안내
  TV시:     "그리운묘은흘림",   // 시 확인 창에 뜨는 학생 시
  TV축하:   "신라문화"    // 글자를 다 모았을 때 뜨는 큰 글자
};

/* ---------- 여기부터는 고치지 않아도 됩니다 ---------- */
// 자리마다 화면의 어느 부분인지 (CSS 선택자)
const FONT_SLOTS={
  기본:"body,button,input,.choices,.paper .no",
  본문:".vtx,.vch button,.story,.note,.msg,.toast,.cap,.card p,.key,.why",
  제목:"h1,h2", 도장:".stamp", 종이글:".paper .txt", 시쓰기:"textarea", 자막:".vcap span",
  이름표:".vnm,.mbub", 글자조각:".big", 조번호:".bar .grp,.vtop span",
  TV조번호:".g .no", TV통신:"#ct", TV글자조각:".piece .ch", TV모은글자:".slot",
  TV추가시간:'.g .ctl button[id^="p5"][data-badge]:not([data-badge=""]):after',
  TVQR번호:"#qrbig .qr-room", TVQR주소:"#qrbig .qr-link,#qrbig .qr-close",
  TV시:"#rv pre", TV축하:"#done .w"
};
(function applyFonts(){
  const dir=document.documentElement.getAttribute("data-fontdir")||"fonts/";
  const fam=n=>"F_"+Object.keys(FONT_LIST).indexOf(n);
  const fmt=f=>/\.woff2$/i.test(f)?"woff2":/\.woff$/i.test(f)?"woff":/\.otf$/i.test(f)?"opentype":"truetype";
  const tv=!!document.querySelector("#rv"), mine=k=>tv?/^TV/.test(k):!/^TV/.test(k);
  const used=[...new Set(Object.keys(FONT_USE).filter(mine).map(k=>FONT_USE[k]))].filter(n=>FONT_LIST[n]);
  let css="";
  used.forEach(n=>{ const f=FONT_LIST[n]; if(f.system) return;
    [[f.file,400],[f.bold,700]].forEach(([file,w])=>{ if(!file) return;
      const url=dir+encodeURI(file);
      css+=`@font-face{font-family:"${fam(n)}";font-weight:${w};src:url("${url}") format("${fmt(file)}");font-display:block}\n`;
      const l=document.createElement("link"); l.rel="preload"; l.as="font"; l.href=url; l.crossOrigin="anonymous"; document.head.appendChild(l); }); });
  Object.keys(FONT_USE).filter(mine).forEach(k=>{ const n=FONT_USE[k], f=FONT_LIST[n], sel=FONT_SLOTS[k];
    if(!f||!sel){ console.warn("글꼴 설정 확인:",k,n); return; }
    const stack=f.system?f.system:`"${fam(n)}","Apple SD Gothic Neo","Malgun Gothic",sans-serif`;
    // 게임: 굵은 꼴이 없는 글꼴은 억지로 굵게 만들지 않음. TV: 디자인에서 정한 굵기 그대로 둠
    css+=`${sel}{font-family:${stack};${!tv&&!f.system&&!f.bold?"font-synthesis:none;font-weight:400;":""}}\n`;
    if(k==="기본"&&!tv) css+=`:root{--sans:${stack};--serif:${stack}}\n`; });
  const st=document.createElement("style"); st.id="font-settings"; st.textContent=css; document.head.appendChild(st);
})();
