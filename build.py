#!/usr/bin/env python3
"""game.html + assets.js + story.js + game.js + img/ + fonts/ 를 하나의 HTML로 합칩니다.
사용법:  python3 build.py   →  dist/escape_room.html 생성 (이 파일 하나만 있으면 어디서든 실행됩니다)
"""
import base64, os, re, sys
ROOT = os.path.dirname(os.path.abspath(__file__))
def read(p): return open(os.path.join(ROOT, p), encoding="utf-8").read()
def b64(p): return base64.b64encode(open(os.path.join(ROOT, p), "rb").read()).decode()

html = read("game.html")
# 1) <script src="x.js"></script> 를 파일 내용으로 바꿉니다.
html = re.sub(r'<script src="([^"]+)"></script>',
              lambda m: "<script>\n" + read(m.group(1)) + "\n</script>", html)
# 2) "img/....png" 문자열을 data URI 로 바꿉니다.
#    파일이 없으면 (예: 설명 속 예시 경로) 그대로 두고 알려 줍니다.
def img_uri(m):
    p = m.group(1)
    if not os.path.exists(os.path.join(ROOT, p)):
        print("  그림 파일이 없어 건너뜀:", p)
        return m.group(0)
    return '"data:image/png;base64,' + b64(p) + '"'
html = re.sub(r'"(img/[^"]+\.png)"', img_uri, html)
# 3) 글꼴 url(fonts/...) 을 data URI 로 바꿉니다.
html = re.sub(r'url\((fonts/[^)]+\.woff2)\)', lambda m: "url(data:font/woff2;base64," + b64(m.group(1)) + ")", html)
os.makedirs(os.path.join(ROOT, "dist"), exist_ok=True)
os.makedirs(os.path.join(ROOT, "dist", "game"), exist_ok=True)
out = os.path.join(ROOT, "dist", "game", "index.html")
open(out, "w", encoding="utf-8").write(html)
print("만들었습니다:", out, round(os.path.getsize(out) / 1024), "KB")
# 교실 TV용 교사 화면 (그림 없이 가벼움)
t = re.sub(r'<script src="([^"]+)"></script>', lambda m: "<script>\n" + read(m.group(1)) + "\n</script>", read("teacher.html"))
os.makedirs(os.path.join(ROOT, "dist", "tv"), exist_ok=True)
tout = os.path.join(ROOT, "dist", "tv", "index.html")
open(tout, "w", encoding="utf-8").write(t)
print("만들었습니다:", tout, round(os.path.getsize(tout) / 1024), "KB")

# dist 폴더만 배포하는 호스팅(Cloudflare Workers 등)을 위한 첫 화면: 게임으로 넘겨 줍니다
open(os.path.join(ROOT, "dist", "index.html"), "w", encoding="utf-8").write('<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>검열국을 탈출하라</title><meta http-equiv="refresh" content="0; url=game/"></head><body></body></html>')
print("만들었습니다: dist/index.html")
