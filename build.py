#!/usr/bin/env python3
"""game.html + assets.js + story.js + game.js 를 하나의 HTML로 합치고, img/ fonts/ 는 옆 폴더로 복사합니다.
사용법:  python3 build.py   →  dist/game/index.html + dist/game/img/ + dist/game/fonts/, dist/tv/index.html
(dist 폴더째 배포하세요. 게임은 dist/game 폴더가 통째로 있어야 그림이 보입니다.)
"""
import base64, os, re, sys
ROOT = os.path.dirname(os.path.abspath(__file__))
def read(p): return open(os.path.join(ROOT, p), encoding="utf-8").read()
def b64(p): return base64.b64encode(open(os.path.join(ROOT, p), "rb").read()).decode()

html = read("game.html")
# 1) <script src="x.js"></script> 를 파일 내용으로 바꿉니다.
html = re.sub(r'<script src="([^"]+)"></script>',
              lambda m: "<script>\n" + read(m.group(1)) + "\n</script>", html)
# 2) 그림(img/)과 글꼴(fonts/)은 HTML에 넣지 않고 dist/game/ 옆 폴더로 복사합니다.
#    HTML이 가벼워져 첫 화면이 바로 뜨고, 그림은 뒤따라 받아집니다.
import shutil
def font_files():
    # fonts.js 의 FONT_USE 에서 실제로 쓰는 글꼴만 골라 그 파일들을 복사 목록에 넣음 (게임·TV 모두)
    js = read("fonts.js")
    use = re.search(r'const FONT_USE=\{(.*?)\n\};', js, re.S).group(1)
    names = set(re.findall(r':\s*"([^"]+)"', re.sub(r'//[^\n]*', '', use)))
    lst = re.search(r'const FONT_LIST=\{(.*?)\n\};', js, re.S).group(1)
    out = set()
    for n in names:
        m = re.search(r'"' + re.escape(n) + r'"\s*:\s*\{([^}]*)\}', lst)
        if not m:
            print("  fonts.js 에 없는 글꼴 이름:", n); continue
        out |= {"fonts/" + f for f in re.findall(r'(?:file|bold)\s*:\s*"([^"]+)"', m.group(1))}
    return out
def copy_assets(dst):
    used = set(re.findall(r'"(img/[^"]+\.png)"', html)) | font_files()
    for d in ("img", "fonts"):
        shutil.rmtree(os.path.join(dst, d), ignore_errors=True)
    for p in sorted(used):
        src = os.path.join(ROOT, p)
        if not os.path.exists(src):
            print("  파일이 없어 건너뜀:", p); continue
        os.makedirs(os.path.dirname(os.path.join(dst, p)), exist_ok=True)
        shutil.copy2(src, os.path.join(dst, p))
    print("  그림·글꼴", len(used), "개 복사")
os.makedirs(os.path.join(ROOT, "dist"), exist_ok=True)
os.makedirs(os.path.join(ROOT, "dist", "game"), exist_ok=True)
copy_assets(os.path.join(ROOT, "dist", "game"))
out = os.path.join(ROOT, "dist", "game", "index.html")
open(out, "w", encoding="utf-8").write(html)
print("만들었습니다:", out, round(os.path.getsize(out) / 1024), "KB")
# 교실 TV용 교사 화면 (그림 없이 가벼움)
t = re.sub(r'<script src="([^"]+)"></script>', lambda m: "<script>\n" + read(m.group(1)) + "\n</script>", read("teacher.html"))
t = t.replace('data-fontdir="fonts/"', 'data-fontdir="../game/fonts/"')   # TV는 게임 폴더의 글꼴을 같이 씀
os.makedirs(os.path.join(ROOT, "dist", "tv"), exist_ok=True)
tout = os.path.join(ROOT, "dist", "tv", "index.html")
open(tout, "w", encoding="utf-8").write(t)
# 관제판 빈티지 스킨: 외부 CSS와 가벼운 SVG 이미지도 함께 배포
shutil.copy2(os.path.join(ROOT, "teacher-vintage.css"), os.path.join(ROOT, "dist", "tv", "teacher-vintage.css"))
shutil.copytree(os.path.join(ROOT, "vintage-assets"), os.path.join(ROOT, "dist", "tv", "vintage-assets"), dirs_exist_ok=True)
print("만들었습니다:", tout, round(os.path.getsize(tout) / 1024), "KB")

# dist 폴더만 배포하는 호스팅(Cloudflare Workers 등)을 위한 첫 화면: 게임으로 넘겨 줍니다
open(os.path.join(ROOT, "dist", "index.html"), "w", encoding="utf-8").write('<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>검열국을 탈출하라</title><meta http-equiv="refresh" content="0; url=game/"><link rel="icon" href="/favicon.ico" sizes="any"><link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png"><link rel="apple-touch-icon" href="/apple-touch-icon.png"></head><body></body></html>')
print("만들었습니다: dist/index.html")

# 사이트 아이콘(파비콘): favicon/ 폴더의 파일을 dist 맨 위로 (모든 페이지가 /favicon.ico 등으로 씀)
for f in os.listdir(os.path.join(ROOT, "favicon")):
    shutil.copy2(os.path.join(ROOT, "favicon", f), os.path.join(ROOT, "dist", f))
print("만들었습니다: dist/favicon.ico 외 사이트 아이콘")
