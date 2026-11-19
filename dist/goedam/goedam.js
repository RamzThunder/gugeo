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

/* ep.1 지급물품 고르기: 고른 물건은 이 기기에만 저장(goedam-item). 목차의 [data-myitem]에도 보여 줌 */
(function(){
  var KEY="goedam-item", get=function(){try{return localStorage.getItem(KEY)||""}catch(e){return ""}};
  var set=function(v){try{v?localStorage.setItem(KEY,v):localStorage.removeItem(KEY)}catch(e){}};
  var nameOf=function(card){return card.querySelector("h3").textContent};
  var cards=document.querySelectorAll(".item"), mine=document.getElementById("item-mine");
  var paint=function(){
    var cur=get(), picked=null;
    cards.forEach(function(c){var on=c.dataset.item===cur; if(on) picked=c; c.classList.toggle("on",on);
      var b=c.querySelector(".item-go"); b.setAttribute("aria-pressed",on); b.textContent=on?"지급 완료 · 취소하기":"이걸로 정하기";});
    if(mine){ mine.hidden=!picked; if(picked) mine.innerHTML="<b>"+nameOf(picked)+"</b>을(를) 지급받았습니다. 이제 괴담으로 들어갈 차례예요."; }
  };
  cards.forEach(function(c){ c.querySelector(".item-go").addEventListener("click",function(){ set(get()===c.dataset.item?"":c.dataset.item); paint(); }); });
  if(cards.length) paint();
  var slot=document.querySelector("[data-myitem]"), names={stamp:"참 잘했어요 도장",blanket:"절대안전 담요",shoes:"불운 신발",mirror:"거울 노리개",lantern:"도깨비 등불",flag:"신장군 깃발"};
  if(slot&&names[get()]) slot.textContent="내 지급물품: "+names[get()]+" ✓";
})();
