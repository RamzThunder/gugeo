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
html = re.sub(r'"(img/[^"]+\.png)"', lambda m: '"data:image/png;base64,' + b64(m.group(1)) + '"', html)
# 3) 글꼴 url(fonts/...) 을 data URI 로 바꿉니다.
html = re.sub(r'url\((fonts/[^)]+\.woff2)\)', lambda m: "url(data:font/woff2;base64," + b64(m.group(1)) + ")", html)
os.makedirs(os.path.join(ROOT, "dist"), exist_ok=True)
out = os.path.join(ROOT, "dist", "escape_room.html")
open(out, "w", encoding="utf-8").write(html)
print("만들었습니다:", out, round(os.path.getsize(out) / 1024), "KB")
