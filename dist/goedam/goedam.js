/* 읽기 설정(글자 크기·글꼴)과 읽은 만큼 차는 붉은 막대. 설정은 이 기기에만 저장됨 */
(function(){
  var root=document.documentElement, KEY="goedam-read";
  var load=function(){try{return JSON.parse(localStorage.getItem(KEY)||"{}")}catch(e){return {}}};
  var save=function(s){try{localStorage.setItem(KEY,JSON.stringify(s))}catch(e){}};
  var cur=load(); cur.size=cur.size||"m"; cur.font=cur.font||"sans";

  var btn=document.querySelector(".bar-aa"), panel=document.getElementById("aa");
  if(btn&&panel){
    btn.addEventListener("click",function(){var open=panel.hidden;panel.hidden=!open;btn.setAttribute("aria-expanded",open)});
    document.addEventListener("keydown",function(e){if(e.key==="Escape"&&!panel.hidden){panel.hidden=true;btn.setAttribute("aria-expanded",false);btn.focus()}});
    panel.querySelectorAll(".seg").forEach(function(seg){
      var key=seg.dataset.key;
      var mark=function(){seg.querySelectorAll("button").forEach(function(b){b.type="button";b.setAttribute("aria-pressed",b.dataset.v===cur[key])})};
      seg.addEventListener("click",function(e){
        var b=e.target.closest("button"); if(!b) return;
        cur[key]=b.dataset.v; root.dataset[key]=b.dataset.v; save(cur); mark();
      });
      mark();
    });
  }

  var bar=document.querySelector(".prog i");
  if(bar){
    var tick=false, upd=function(){
      var h=document.documentElement.scrollHeight-innerHeight;
      bar.style.width=(h>0?Math.min(100,scrollY/h*100):0)+"%"; tick=false;
    };
    addEventListener("scroll",function(){if(!tick){tick=true;requestAnimationFrame(upd)}},{passive:true});
    addEventListener("resize",upd); upd();
  }
})();
/* 이야기 속 지급물품 이름(.itm)에 마우스를 올리거나(손가락으로 누르거나 Tab으로 가면) 작은 물품 카드를 띄움. 평소에는 안 보임 */
(function(){
  var D={
    stamp:["참 잘했어요 도장","도장을 찍은 상대에게 신뢰를 얻는다. 효과는 중첩되지 않으며, 약 1시간 정도 지속된다. 단, 도장 자국이 번지는 경우 효과가 반전되어 불신을 얻게 된다. 지속시간 동일."],
    blanket:["절대안전 담요","90*150 사이즈의 담요. 가벼운 천으로 이루어져 있다. 담요에 덮힌 부분은 괴담에게 인식되지 않는다. 단, 움직이면 효과가 해제된다."],
    shoes:["불운 신발","착용자에게 불운을 불러오는 신발. 신발을 신고 있는 동안은 괴담 속 존재들에게 공격받지 않는다. 신발 끈이 풀리면 효과가 반대로 적용되어 행운을 불러오지만 괴담 속 존재들이 유인된다."],
    mirror:["거울 노리개","거울을 통해 보면 괴담이 만들어낸 환영이나 착각이 사라진 본질을 볼 수 있다. 단, 거울에 비친 괴담 역시 거울을 통해 당신의 생각을 읽어낼 수 있다."],
    lantern:["도깨비 등불","등불 안에 깃든 도깨비에게 조언을 얻을 수 있다. 단, 도깨비는 장난기가 많아 3번 중 1번의 확률로 조언을 반대로 말한다."],
    flag:["신장군 깃발","땅에 꽂으면 약 10분간 주변 2m 반경(깃발을 중심으로 반지름 2m)은 괴담의 영향을 받지 않는다. 한 번 땅에 꽂은 깃발은 다시 뽑을 수 없다."]
  };
  var words=document.querySelectorAll(".itm[data-item]"); if(!words.length) return;
  var card=document.createElement("div"); card.className="itm-card"; card.id="itm-card"; card.setAttribute("role","tooltip"); card.hidden=true;
  document.body.appendChild(card);
  var show=function(w){ var d=D[w.dataset.item]; if(!d) return;
    card.innerHTML='<img src="img/items/'+w.dataset.item+'.webp" alt=""><div><b>'+d[0]+'</b><p>'+d[1]+'</p></div>';
    card.hidden=false; w.setAttribute("aria-describedby","itm-card");
    var r=w.getBoundingClientRect(), cw=card.offsetWidth, ch=card.offsetHeight, m=10;
    var x=Math.min(Math.max(m,r.left+r.width/2-cw/2),innerWidth-cw-m), y=r.bottom+8;
    if(y+ch>innerHeight-m) y=Math.max(m,r.top-ch-8);
    card.style.left=x+"px"; card.style.top=y+"px"; };
  var hide=function(w){ card.hidden=true; if(w) w.removeAttribute("aria-describedby"); };
  words.forEach(function(w){
    w.addEventListener("mouseenter",function(){show(w)}); w.addEventListener("mouseleave",function(){ if(document.activeElement!==w) hide(w); });
    w.addEventListener("focus",function(){show(w)}); w.addEventListener("blur",function(){hide(w)});
  });
  document.addEventListener("keydown",function(e){ if(e.key==="Escape"&&!card.hidden){ hide(document.activeElement); if(document.activeElement&&document.activeElement.blur) document.activeElement.blur(); }});
  addEventListener("scroll",function(){ if(!card.hidden) hide(); },{passive:true});
})();

/* 근무수칙의 '없는 4번': PPT처럼 4번이 0.1초 간격으로 어긋난 채 여러 겹(깨진 글자 포함) 번쩍였다가 한꺼번에 사라짐. 30초에 한 번쯤 불규칙하게 되풀이 */
(function(){
  var r4=document.querySelector(".rule4"); if(!r4) return;
  var gs=r4.querySelectorAll(".g");
  var burst=function(){
    gs.forEach(function(g,i){ setTimeout(function(){ g.classList.add("on"); },i*100); });
    setTimeout(function(){ gs.forEach(function(g){ g.classList.remove("on"); }); },gs.length*100+250+Math.random()*350);
    setTimeout(burst,25000+Math.random()*10000);   // 대략 30초에 한 번
  };
  setTimeout(burst,6000+Math.random()*4000);
})();

/* ep.1 성향 테스트: 한 화면에 질문 하나(또는 이야기 장면 하나). 결과 부서는 이 기기에 저장(goedam-dept: rescue|explore) */
(function(){
  var box=document.getElementById("quiz"), Q=window.QUIZ; if(!box||!Q) return;
  var KEY="goedam-dept", score={e:0,r:0}, door="", i=0, qn=0;
  var RES={
    explore:{org:"SG 주식회사",team:"전략탐사팀",body:'<p class="qz-b">괴담이 가득한 세계에 살게 된 당신.</p><p>당신은 괴담에서 다양한 아이템을 채집하여 다양한 상품을 만들어 판매하는 <em class="qz-red">회사</em>에 입사하였습니다.</p><p>이 회사에서 괴담은 <u>중요한 원료 수급처</u>입니다. 괴담 속에서 만나는 민간인들은.. 운이 좋지 않았나보네요. 어쩔 수 없죠?</p><p>당신이 알 바는 아닙니다.</p><p class="qz-b">당신의 가장 큰 목표는<br><mark>많은 아이템을 가지고<br>괴담을 성공적으로 탈출하는 것입니다.</mark></p>'},
    rescue:{org:"재난복구지원국",team:"특수구조과",body:'<p class="qz-b">괴담이 가득한 세계에 살게 된 당신.</p><p>당신은 괴담으로 인한 인명 피해 등을 막기 위해 괴담 속에서 민간인을 구조하고, 가능하다면 괴담을 종결(없애는 것)시키는 것을 목표로 하는 <em class="qz-red">정부기관</em>에 입사하였습니다.</p><p>지진, 화재와 같은 재난에서 시민을 구해내듯, 당신은 괴담 속에서 <u>시민을 구출하는 데</u>에 사명감을 갖고 있습니다.</p><p class="qz-b">당신의 가장 큰 목표는<br><mark>가능한 많은 민간인을 구하고<br>괴담을 종결시키는 것입니다.</mark></p>'}
  };
  var screen=function(html,red,dark,dawn){ box.className="quiz"+(red?" red":"")+(dark?" dark":"")+(dawn?" dawn":""); box.innerHTML='<div class="qz-screen" tabindex="-1">'+html+'</div>';
    document.documentElement.classList.toggle("lights-out",!!dark);   // '모든 불이 꺼집니다': 페이지 전체를 깜빡인 뒤 까맣게
    box.firstChild.focus({preventScroll:true}); scrollTo({top:0}); };
  var show=function(){
    if(i>=Q.length) return result();
    var s=Q[i];
    if(s.say){ screen('<p class="qz-say">'+s.say+'</p><button class="qz-btn" type="button">'+(s.next||"다음")+'</button>',s.red,s.dark,s.dawn);
      box.querySelector("button").onclick=function(){i++;show();}; return; }
    qn++;
    screen('<p class="qz-no">Q'+qn+'.</p><p class="qz-q">'+s.q+'</p><div class="qz-opts">'+s.a.map(function(a,k){return '<button class="qz-opt" type="button" data-k="'+k+'">'+a[0]+'</button>'}).join("")+'</div>',s.red,s.dark);
    box.querySelectorAll(".qz-opt").forEach(function(b){ var A=s.a[+b.dataset.k], flipped=0;
      var flip=function(){ if(A[2]&&!flipped){ flipped=Date.now(); b.textContent=A[2]; b.classList.add("flip"); } };   // 한 번 바뀌면 되돌아가지 않음
      b.addEventListener("mouseenter",flip); b.addEventListener("pointerdown",flip); b.addEventListener("focus",flip);
      b.onclick=function(){ flip(); var t=A[1];
        if(t.indexOf("e")>=0) score.e++; if(t.indexOf("r")>=0) score.r++; if(s.door) door=t;
        var wait=A[2]&&Date.now()-flipped<450?600:0;   // 누르자마자 바뀐 경우 '네'를 잠깐 보여 준 뒤 넘어감
        setTimeout(function(){ i++; show(); },wait); }; });
  };
  var result=function(){
    var d=score.e>score.r?"explore":score.r>score.e?"rescue":(door==="e"?"explore":"rescue"), R=RES[d];
    try{localStorage.setItem(KEY,d)}catch(e){}
    screen('<div class="qz-res-top" aria-hidden="true"></div><p class="qz-org">'+R.org+'</p><h2 class="qz-team">'+R.team+'</h2><div class="qz-body">'+R.body+'</div>'+
      '<a class="qz-btn" href="items.html">지급물품 살펴보러 가기 →</a><button class="qz-again" type="button">다시 하기</button>',false);
    box.classList.add("res");
    box.querySelector(".qz-again").onclick=function(){ score={e:0,r:0}; door=""; i=0; qn=0; show(); };
  };
  /* 불 꺼진 장면: 커서(손가락)가 있는 곳만 손전등처럼 밝힘 */
  var light=function(e){ if(!box.classList.contains("dark")) return; var r=box.getBoundingClientRect();
    box.style.setProperty("--mx",(e.clientX-r.left)+"px"); box.style.setProperty("--my",(e.clientY-r.top)+"px"); };
  box.addEventListener("pointermove",light); box.addEventListener("pointerdown",light);
  document.getElementById("qz-start").onclick=show;
})();

/* 성향 테스트 결과로 정해진 부서를 목차·ep.2·ep.3의 고르기 칸에 '내 부서'로 표시 */
(function(){
  var d; try{d=localStorage.getItem("goedam-dept")}catch(e){} if(!d) return;
  var name=d==="rescue"?"특수구조과":"전략탐사팀";
  document.querySelectorAll("a.pick").forEach(function(a){ if((a.getAttribute("href")||"").indexOf(d)>=0) a.classList.add("mine"); });
  var t=document.querySelector("[data-mydept]"); if(t) t.textContent="내 부서: "+name+" ✓";
})();

/* 3.1 팬텀의 라이브 방송: .live 상자를 '재생되는 방송 화면'으로 바꿈.
   원고 순서대로 대사는 자막, '닉네임: 채팅'은 채팅창, [후원]은 팝업, [흔들림]은 화면 요동, [정지]는 멈춘 화면(3:00:00까지 빨리 감기).
   '소설 원문으로 보기'를 누르면 바로 아래 :::원문 상자(수정 전 소설 원문)가 펼쳐짐 */
(function(){
  document.querySelectorAll(".story .live").forEach(function(live){
    var top=live.querySelector(".live-top"), steps=[];
    Array.prototype.forEach.call(live.children,function(el){
      if(el===top) return;
      var c=el.className||"";
      if(c==="gap") steps.push({t:"pause",ms:500});
      else if(c==="gap2") steps.push({t:"pause",ms:900});
      else if(c==="scene") steps.push({t:"pause",ms:1500});
      else if(c==="chat-msg") steps.push({t:"chat",html:el.innerHTML});
      else if(c==="don") steps.push({t:"don",html:el.innerHTML});
      else if(c==="freeze") steps.push({t:"freeze"});
      else if(el.tagName==="P") steps.push({t:c==="shake"?"shake":"say",whisper:c==="whisper",html:el.innerHTML,len:el.textContent.length});
    });
    var name=top.querySelector("b").textContent, view=top.querySelector(".live-view").textContent;
    var script=document.createElement("div"); script.className="live-script"; script.hidden=true;
    while(live.children.length>1) script.appendChild(live.children[1]);
    live.classList.add("player");
    live.insertAdjacentHTML("beforeend",
      '<div class="lv-stage" aria-hidden="true"><div class="lv-cam"><div class="lv-exit"></div><div class="lv-light"></div><div class="lv-dust"></div><div class="lv-noise"></div></div><div class="lv-flick"></div>'+
      '<div class="lv-hud"><span class="live-on">LIVE</span><b>'+name+'</b><span class="lv-time">00:00</span><span class="live-view">'+view+'</span></div>'+
      '<div class="lv-don" hidden></div><p class="lv-sub"></p><div class="lv-end" hidden>방송이 종료되었습니다</div>'+
      '<button class="lv-play" type="button" tabindex="-1"><span>▶</span> 팬텀 라이브 재생</button></div>'+
      '<div class="lv-chat" aria-hidden="true"><p class="lv-chat-h">실시간 채팅</p><div class="lv-chat-list"></div></div>'+
      '<div class="lv-ctl"><button type="button" class="lv-btn lv-go">▶ 재생</button><button type="button" class="lv-btn lv-next">다음 ▸</button><button type="button" class="lv-btn lv-txt" aria-expanded="false">소설 원문으로 보기</button></div>');
    live.appendChild(script);
    var orig=live.nextElementSibling; if(orig&&orig.classList.contains("live-orig")){ orig.hidden=true; live.appendChild(orig); } else orig=script;
    var $=function(s){return live.querySelector(s)}, stage=$(".lv-stage"), sub=$(".lv-sub"), list=$(".lv-chat-list"), don=$(".lv-don"), time=$(".lv-time"), go=$(".lv-go");
    var k=0, timer=null, clock=null, sec=0, playing=false, done=false;
    var fmt=function(s){var h=Math.floor(s/3600),m=Math.floor(s/60)%60,x=s%60;return (h?h+":"+String(m).padStart(2,"0"):String(m).padStart(2,"0"))+":"+String(x).padStart(2,"0")};
    var tick=function(){ sec+=1; time.textContent=fmt(sec); };
    var addChat=function(html,isDon){ var p=document.createElement("p"); p.className="lv-msg"+(isDon?" lv-msg-don":""); p.innerHTML=html; list.appendChild(p);
      while(list.children.length>9) list.removeChild(list.firstChild); };
    var reset=function(){ k=0; sec=0; done=false; time.textContent="00:00"; list.innerHTML=""; sub.innerHTML=""; don.hidden=true; $(".lv-end").hidden=true;
      stage.classList.remove("fallen","frozen","shaking","ended"); };
    var stop=function(){ playing=false; clearTimeout(timer); clearInterval(clock); go.textContent=done?"↺ 다시 보기":"▶ 재생"; stage.classList.remove("on"); };
    var finish=function(){ done=true; stage.classList.add("ended"); $(".lv-end").hidden=false; sub.innerHTML=""; stop(); };
    var step=function(){
      if(!playing) return;
      if(k>=steps.length) return finish();
      var s=steps[k++], wait=600;
      if(s.t==="say"||s.t==="shake"){ sub.className="lv-sub"+(s.whisper?" whisper":""); sub.innerHTML=s.html; wait=Math.min(5200,1300+s.len*65);
        if(s.t==="shake"){ stage.classList.add("shaking"); setTimeout(function(){stage.classList.remove("shaking");stage.classList.add("fallen");},1400); wait=2600; } }
      else if(s.t==="chat"){ addChat(s.html); wait=stage.classList.contains("frozen")?1400:900; }
      else if(s.t==="don"){ don.innerHTML=s.html; don.hidden=false; addChat(s.html,true); setTimeout(function(){don.hidden=true;},2600); wait=1800; }
      else if(s.t==="freeze"){ stage.classList.add("frozen"); sub.innerHTML=""; clearInterval(clock);
        var from=sec, to=3*3600, t0=Date.now(); clock=setInterval(function(){ var r=Math.min(1,(Date.now()-t0)/7000); sec=Math.round(from+(to-from)*r); time.textContent=fmt(sec); if(r>=1) clearInterval(clock); },50); wait=1200; }
      else wait=s.ms;
      timer=setTimeout(step,wait);
    };
    var play=function(){ if(done) reset(); playing=true; stage.classList.add("on"); go.textContent="❚❚ 멈춤"; if(!stage.classList.contains("frozen")) clock=setInterval(tick,1000); step(); };
    go.onclick=function(){ playing?stop():play(); };
    $(".lv-play").onclick=play;
    $(".lv-next").onclick=function(){ if(!playing){ play(); return; } clearTimeout(timer); step(); };
    $(".lv-txt").onclick=function(){ var open=orig.hidden; orig.hidden=!open; this.setAttribute("aria-expanded",open); this.textContent=open?"소설 원문 접기":"소설 원문으로 보기"; };
  });
})();

/* 공용: 요소 안 글자를 한 자씩 <span class="tc">로 감쌈(구조·꾸밈은 그대로). 감싼 span 목록을 돌려줌 */
window.goedamChars=function(el){
  var out=[], ts=[], w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT,null,false), n; while((n=w.nextNode())) ts.push(n);
  ts.forEach(function(t){ var f=document.createDocumentFragment();
    Array.from(t.nodeValue).forEach(function(c){ var s=document.createElement("span"); s.className="tc"; s.textContent=c; f.appendChild(s); out.push(s); });
    t.parentNode.replaceChild(f,t); });
  return out;
};

/* 3.1 문자(.sms): 화면에 들어오면 내 말 → '…' 입력 중 → 백운 선배 답장 순서로 나타남.
   병상 모니터(.monitor): 화면에 들어오면 한 글자씩 찍힘(커서 깜빡임). 글 전체는 처음부터 문서에 있음 */
(function(){
  var watch=function(el,fn){ if(!("IntersectionObserver" in window)){fn();return;}
    var io=new IntersectionObserver(function(es){ if(es[0].isIntersecting){ io.disconnect(); fn(); } },{threshold:.45}); io.observe(el); };
  document.querySelectorAll(".story .sms").forEach(function(box){
    var ps=box.querySelectorAll("p"); box.classList.add("wait");
    watch(box,function(){ var t=300;
      ps.forEach(function(p){
        if(p.classList.contains("sms-you")){ var dots=document.createElement("div"); dots.className="sms-typing"; dots.innerHTML="<i></i><i></i><i></i>";
          setTimeout(function(){ p.parentNode.insertBefore(dots,p); },t); t+=1600; setTimeout(function(){ dots.remove(); p.classList.add("in"); },t); }
        else { setTimeout(function(){ p.classList.add("in"); },t); }
        t+=700; });
    });
  });
  /* 모니터 상자(.monitor)와 모니터 한 줄(.monline)을 문서 순서대로 줄 세워, 앞 글이 다 찍혀야 다음 글이 찍히기 시작함.
     화면에 들어온 글부터 차례가 되고, 보지 않고 지나친 앞 글은 바로 다 보여 줘서 뒤 글이 기다리지 않게 함 */
  /* 글자를 한 자씩 span(.tc)으로 감싸 처음부터 제자리에 투명하게 깔아 둠 → 보이게만 하므로 찍히는 동안 줄바꿈 위치가 바뀌지 않음 */
  var Q=[], busy=false;
  var finish=function(it){ it.cs.forEach(function(s){ s.classList.add("on"); s.classList.remove("cur"); }); it.state="done"; };
  var run=function(it){
    busy=true; it.state="typing"; var cs=it.cs, k=0, prev=null;
    var tick=function(){
      if(prev) prev.classList.remove("cur");
      if(k>=cs.length){ var last=cs[cs.length-1]; if(last){ last.classList.add("cur");
          if(it.box.classList.contains("monline")) setTimeout(function(){ last.classList.remove("cur"); },1600); }
        it.state="done"; setTimeout(function(){ busy=false; pump(); },450); return; }
      var s=cs[k++]; s.classList.add("on","cur"); prev=s;
      var gap=s.dataset.end?520:(s.textContent==="."?260:55);   // 줄(문단) 끝에서는 조금 쉼
      setTimeout(tick,gap);
    };
    tick();
  };
  var pump=function(){ if(busy) return; for(var n=0;n<Q.length;n++){ var it=Q[n]; if(it.state==="done") continue; if(it.state==="ready") run(it); return; } };
  document.querySelectorAll(".story .monitor, .story .monline").forEach(function(box){
    var ps=box.classList.contains("monline")?[box]:[].slice.call(box.querySelectorAll("p"));
    box.setAttribute("aria-label","병상 모니터: "+box.textContent.trim());
    var cs=[]; ps.forEach(function(p){ if(p!==box) p.setAttribute("aria-hidden","true"); var a=window.goedamChars(p); if(a.length) a[a.length-1].dataset.end="1"; cs=cs.concat(a); });
    var it={box:box,cs:cs,state:"wait"}; Q.push(it);
    watch(box,function(){
      var me=Q.indexOf(it);
      for(var n=0;n<me;n++) if(Q[n].state==="wait") finish(Q[n]);   // 보지 않고 지나친 앞 글
      it.state="ready"; pump();
    });
  });
})();

/* 휴대폰 알림(.noti): 화면에 들어오면 위에서 내려오며 두 번 진동 */
(function(){
  document.querySelectorAll(".story .noti").forEach(function(n){
    if(!("IntersectionObserver" in window)) return;
    n.classList.add("wait");
    var io=new IntersectionObserver(function(es){ if(es[0].isIntersecting){ io.disconnect(); setTimeout(function(){ n.classList.remove("wait"); n.classList.add("in"); },350); } },{threshold:.6});
    io.observe(n);
  });
})();

/* 도장 자국(.stampmark)은 화면에 들어오면 '쾅' 찍히고, 남은 횟수(.stampcount[data-to])는 잠깐 뒤 숫자가 바뀜 */
(function(){
  if(!("IntersectionObserver" in window)) return;
  var seen=function(el,fn,th){ var io=new IntersectionObserver(function(es){ if(es[0].isIntersecting){ io.disconnect(); fn(); } },{threshold:th||.6}); io.observe(el); };
  document.querySelectorAll(".story .stampmark").forEach(function(f){ f.classList.add("wait"); seen(f,function(){ setTimeout(function(){ f.classList.remove("wait"); f.classList.add("in"); },250); }); });
  document.querySelectorAll(".story .stampcount[data-to]").forEach(function(c){ seen(c,function(){
    var n=c.querySelector(".sc-num"); setTimeout(function(){ n.classList.add("tick"); setTimeout(function(){ n.textContent=c.dataset.to; },500); },900); }); });
})();

/* 무전(.radio): 왼쪽에 작은 무전기(안테나·채널 액정·불빛·스피커)를 붙이고, 화면에 들어오면 액정에 '연결 중 → 수신 중(송신 중)'이 뜨고 말이 끊겨 들어옴.
   … 자리에서는 잡음(▒▒▒)으로 깨지며 액정에 '신호 불안정'이 떴다가 이어지고, 점원 목소리가 끼어든 백운 요원의 무전은 '신호 끊김'으로 끝남.
   채널: 특수구조과 ep.2(구조 1팀 백운) = CH 01 · 구조1팀, ep.3 3.1(3팀) = CH 03 · 구조3팀 */
(function(){
  var rs=document.querySelectorAll(".story p.radio"); if(!rs.length) return;
  var ch=/ep3-rescue/.test(location.pathname)?"CH 03 · 구조3팀":"CH 01 · 구조1팀";
  rs.forEach(function(p){
    var out=p.classList.contains("out"), cut=!!p.querySelector(".bot");
    var wrap=document.createElement("div"); wrap.className="rd"+(out?" out":"");
    wrap.setAttribute("role","group"); wrap.setAttribute("aria-label","무전("+(out?"송신":"수신")+", "+ch+"): "+p.textContent.trim());
    wrap.innerHTML='<div class="rd-dev" aria-hidden="true"><i class="rd-ant"></i><div class="rd-lcd"><span class="rd-ch">'+ch+'</span><span class="rd-sq"></span></div><i class="rd-led"></i><i class="rd-grille"></i></div>';
    p.parentNode.insertBefore(wrap,p); wrap.appendChild(p); p.setAttribute("aria-hidden","true");
    if(!("IntersectionObserver" in window)) return;
    var cs=window.goedamChars(p), sq=wrap.querySelector(".rd-sq");
    var io=new IntersectionObserver(function(es){ if(!es[0].isIntersecting) return; io.disconnect();
      wrap.classList.add("on"); sq.textContent="연결 중"; var k=0, live=out?"송신 중":"수신 중";
      var tick=function(){
        if(k>=cs.length){ sq.textContent=cut?"신호 끊김":(out?"송신 종료":"수신 종료");
          if(cut){ var lost=document.createElement("span"); lost.className="rd-lost"; lost.textContent=" ─ 신호 끊김 ─"; lost.setAttribute("aria-hidden","true"); p.appendChild(lost); }
          setTimeout(function(){ wrap.classList.remove("on"); wrap.classList.add(cut?"dead":"done"); sq.textContent=cut?"신호 끊김":""; },cut?900:700); return; }
        var s=cs[k++], c=s.textContent; s.classList.add("on");
        if(c==="…"){ s.classList.add("nz"); wrap.classList.add("static"); sq.textContent="신호 불안정";
          setTimeout(function(){ s.classList.remove("nz"); wrap.classList.remove("static"); sq.textContent=live; tick(); },520); return; }
        setTimeout(tick,c===" "?20:45);
      };
      setTimeout(function(){ sq.textContent=live; tick(); },650);
    },{threshold:.6});
    io.observe(wrap);
  });
})();

/* 병원 방송(p.pa): 띠 왼쪽에 천장 스피커, 위에 음표 네 개 차임(딩동댕동 높낮이). 화면에 들어오면 차임이 차례로 울린 뒤 문장이 켜짐.
   코드별 색: 코드 블루=파랑, 코드 옐로우=노랑, 해제·클리어=초록. 문장 속 방송(.pa-in)도 같은 색 */
(function(){
  var code=function(t){ return /해제|클리어/.test(t)?"pa-green":/코드 블루/.test(t)?"pa-blue":/코드 옐로우/.test(t)?"pa-yellow":""; };
  document.querySelectorAll(".story .pa-in").forEach(function(s){ var c=code(s.textContent); if(c) s.classList.add(c); });
  document.querySelectorAll(".story p.pa").forEach(function(p){
    var c=code(p.textContent); if(c) p.classList.add(c);
    p.innerHTML='<span class="pa-spk" aria-hidden="true"><i></i></span><span class="pa-body"><span class="pa-chime" aria-hidden="true"><i>♪</i><i>♩</i><i>♪</i><i>♫</i></span><span class="pa-text">'+p.innerHTML+'</span></span>';
    if(!("IntersectionObserver" in window)) return;
    p.classList.add("wait");
    var io=new IntersectionObserver(function(es){ if(!es[0].isIntersecting) return; io.disconnect();
      p.classList.remove("wait"); p.classList.add("play");
      p.querySelectorAll(".pa-chime i").forEach(function(n,k){ setTimeout(function(){ n.classList.add("on"); },200+k*320); });
      setTimeout(function(){ p.classList.add("said"); },200+4*320+150);
      setTimeout(function(){ p.classList.remove("play"); },200+4*320+2600);
    },{threshold:.7});
    io.observe(p);
  });
})();
