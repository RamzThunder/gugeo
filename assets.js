/* 그림 경로 모음. 그림 파일은 img/ 폴더에 있습니다. */
const IMG={gate:"img/gate.png",
  street:"img/street.png",
  };
Object.assign(IMG,{
  interro:"img/interro.png",
  press:"img/press.png",
  key:"img/key.png",
  ribbon:"img/ribbon.png",
  poem:"img/poem.png"});
IMG.room="img/room.png";
Object.assign(IMG,{
  guard:"img/guard.png",
  guardCalm:"img/guardCalm.png",
  guardSus:"img/guardSus.png",
  boss:"img/boss.png",
  bossSus:"img/bossSus.png",
  contact:"img/contact.png",
  contactSide:"img/contactSide.png",
  contactHappy:"img/contactHappy.png",
  });
const BLP={
  guard:{s:"img/blink_guard.png", l:36.722,t:29.231,w:34.025},
  guardCalm:{s:"img/blink_guardCalm.png", l:36.722,t:29.231,w:34.025},
  guardSus:{s:"img/blink_guardSus.png", l:36.722,t:29.231,w:34.025},
  boss:{s:"img/blink_boss.png", l:37.311,t:29.231,w:28.908},
  bossSus:{s:"img/blink_bossSus.png", l:37.311,t:29.231,w:28.908},
  contact:{s:"img/blink_contact.png", l:37.278,t:31.538,w:27.416},
  contactSide:{s:"img/blink_contactSide.png", l:37.278,t:31.538,w:27.416},
  contactHappy:{s:"img/blink_contactHappy.png", l:37.278,t:31.538,w:27.416}
};
const CUT={
  window:{s:"img/cut_window.png", x:118,y:27,w:191,h:215},
  calendar:{s:"img/cut_calendar.png", x:328,y:94,w:57,h:79},
  poster:{s:"img/cut_poster.png", x:411,y:67,w:90,h:113},
  clock:{s:"img/cut_clock.png", x:528,y:52,w:81,h:84},
  cabinet:{s:"img/cut_cabinet.png", x:16,y:154,w:88,h:248},
  typewriter:{s:"img/cut_typewriter.png", x:348,y:215,w:85,h:66},
  lamp:{s:"img/cut_lamp.png", x:450,y:196,w:73,h:87},
  trash:{s:"img/cut_trash.png", x:574,y:326,w:55,h:75},
  door:{s:"img/cut_door.png", x:635,y:89,w:160,h:304},
  drawer:{s:"img/cut_drawer.png", x:226,y:296,w:94,h:94}
};

/* ===== 서랍 미니게임 그림 자리 =====
   x, y, w, h는 서랍 그림 안의 위치(%)입니다. r은 기울기(도).
   그림이 준비되면 s: 뒤에 따옴표로 img/파일이름.png 를 넣으세요. s가 없으면 이름표가 적힌 임시 상자로 보입니다.
   나중에 적힌 물건이 위에 쌓입니다. 열쇠(key)는 맨 아래에 깔립니다. */
const DRAWER={
  bg:"",   // 서랍 속 바닥 그림 (예: img/drawer_inside.png 를 따옴표 안에). 비우면 나무 무늬 임시 바닥.
  key:{x:54,y:47,w:16,h:26,s:"img/key_big.png"},
  items:{
    bundle:{x:46,y:38,w:34,h:44,r:-4,s:"img/drawer_bundle.png"},
    ledger:{x:52,y:44,w:26,h:40,r:6,s:"img/drawer_ledger.png"},
    stamp: {x:20,y:56,w:16,h:26,r:-12,s:"img/drawer_stamp.png"},
    paper: {x:8, y:12,w:34,h:40,r:-8,s:"img/drawer_paper.png"},
    pen:   {x:30,y:22,w:30,h:12,r:18,s:"img/drawer_pen.png"},
    lens:  {x:72,y:10,w:18,h:28,r:0,s:"img/drawer_lens.png"},
    tin:   {x:60,y:60,w:22,h:26,r:-6,s:"img/drawer_tin.png"}
  }
};
/* ===== 서류함 미니게임 그림 자리 =====
   bossBack: 상관이 등 돌리고 서류 보는 그림. 비우면 boss 그림을 어둡게 해서 대신 씁니다. */
IMG.bossBack="img/bossBack.png";
