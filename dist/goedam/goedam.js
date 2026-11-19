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
