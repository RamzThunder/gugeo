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
