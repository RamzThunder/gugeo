#!/usr/bin/env python3
"""괴담 원고(goedam/원고.md) → 이야기 쪽 HTML(dist/goedam/ep*.html)

사용법 (레포 맨 위 폴더에서):
    python3 goedam/build.py            원고를 HTML에 적용
    python3 goedam/build.py --check    적용하지 않고, 원고와 HTML이 같은지만 확인
    python3 goedam/build.py --extract  거꾸로 지금 HTML에서 원고를 새로 뽑음 (원고를 덮어씀)

각 HTML에서 <article class="story"> … </article> 안쪽만 바꿉니다.
쪽 제목·머리줄·이동 링크 같은 틀은 HTML 그대로 둡니다.
원고 쓰는 법은 원고.md 맨 위의 '쓰는 법'을 보세요.
"""
import html, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGES = os.path.join(ROOT, "dist", "goedam")
SRC = os.path.join(ROOT, "goedam", "원고.md")
ORDER = ["ep2", "ep2-rescue-1", "ep2-rescue-2", "ep2-rescue-3", "ep2-explore-1", "ep2-explore-2", "ep2-explore-3",
         "ep3-rescue", "ep3-rescue-summary", "ep3-explore", "ep3-explore-summary", "ep3-common"]
ITEMS = {"도장": "stamp", "담요": "blanket", "신발": "shoes", "노리개": "mirror", "등불": "lantern", "깃발": "flag"}
ITEMS_KO = {v: k for k, v in ITEMS.items()}
GAP, GAP2 = '<div class="gap"></div>', '<div class="gap2"></div>'
SCENE = '<div class="scene" aria-hidden="true"><i></i><i></i><i></i></div>'
PREFIX = {"bot": "[점원] ", "pen": "[필담] ", "say": "[강조] ",
          "dok": "[도깨비] ", "dok angry": "[도깨비:화남] ", "dok loud": "[도깨비:외침] ",
          "don": "[후원] ", "whisper": "[속삭임] ", "shake": "[흔들림] ", "freeze": "[정지] "}
BOX = {"라이브": "live", "채팅": "chat"}
RAW = re.compile(r"</?(div|ul|ol|aside|details|summary|figure|section|table|h[1-6])\b|<p[ >]")
ART = re.compile(r'(<article class="story">\n)(.*?)(</article>)', re.S)

HEAD = """# 괴담에 떨어져도 수행평가를 해야 하는구나 · 원고

<!--
쓰는 법 (이 상자 안은 사이트에 나오지 않아요)

· 고친 뒤 적용:  레포 맨 위 폴더에서  python3 goedam/build.py
· "## ep2-rescue-2 · 특수구조과 2/3"  ← 쪽 하나의 시작. '##' 뒤 첫 낱말이 파일 이름이에요. 순서·이름은 바꾸지 마세요.

· 한 줄 = 한 문단
· 빈 줄 1개 = 조금 띄우기,  빈 줄 2개 = 크게 띄우기
· * * *  (한 줄에 이것만) = 장면 전환 (빨간 점 세 개)
· ■ 는 그대로 쓰면 가림 표시가 돼요
· **굵게**   //기울임//   문단 안에서 줄 바꿈은 <br>
· - 로 시작하는 줄들 = 보고서·면접 질문 같은 기록 상자
· 줄 맨 앞에 붙이는 표시
    [점원] 서점 점원(안드로이드) 대사 — 픽셀 글꼴
    [필담] 백운 요원이 수첩에 쓴 글 — 손글씨 + 수첩 종이
    [강조] 굵게 따로 세운 한 줄
    [도깨비] 도깨비 등불 속 도깨비의 말 — 여러 목소리가 겹친 푸른 불꽃 글자
    [도깨비:화남] 화난 도깨비 (붉은 불꽃),  [도깨비:외침] 크게 외치는 도깨비
    [후원] 라이브 방송·채팅의 후원·미션 알림,  [속삭임] 작게 속삭이는 말
    [흔들림] 화면이 흔들리는 순간,  [정지] 멈춘 화면 표시
· 상자: 아래처럼 ::: 로 열고 ::: 로 닫아요. 안쪽은 보통 원고처럼 써요.
    :::라이브 팬텀 | 시청자 10명      ← 휴대폰 생방송 화면 (방송 이름 | 시청자 수)
    :::채팅                          ← 채팅창. 안쪽 한 줄 = '닉네임: 채팅'
    :::
· {666■}            금액 (호박색)
· [[칭찬 도장|도장]]  지급물품 이름 (누르면 설명 카드). | 뒤: 도장·담요·신발·노리개·등불·깃발
· < 로 시작하는 줄과 ```html 상자 안은 HTML 그대로 들어가요 (공문·광고판·방송 같은 꾸밈). 글만 고치고 꺾쇠(< >)는 건드리지 마세요.
-->
"""

# ---------- HTML → 원고 ----------
def inline_to_md(t):
    t = re.sub(r'<span class="itm" data-item="(\w+)" tabindex="0">(.*?)</span>', lambda m: "[[%s|%s]]" % (m.group(2), ITEMS_KO[m.group(1)]), t)
    t = re.sub(r'<span class="won">(\d+) ?<span class="x">(■+)</span></span>', lambda m: "{%s%s}" % (m.group(1), m.group(2)), t)
    t = re.sub(r'<span class="x">(■+)</span>', r"\1", t)
    t = t.replace("<strong>", "**").replace("</strong>", "**").replace("<em>", "//").replace("</em>", "//")
    return t.replace("&quot;", '"').replace("&#x27;", "'")

def article_to_md(body):
    out, lines, i = [], body.split("\n"), 0
    while i < len(lines):
        l = lines[i]
        if l == "": i += 1; continue
        if l == GAP: out.append(""); i += 1; continue
        if l == GAP2: out += ["", ""]; i += 1; continue
        if l == SCENE: out.append("* * *"); i += 1; continue
        m = re.match(r'<div class="(live|chat)" ', l)
        if m:
            kind = m.group(1); j = i + 1
            while lines[j] != "</div><!--/%s-->" % kind: j += 1
            body_lines = lines[i + 1:j]; i = j + 1
            if kind == "live":
                h = re.search(r"<b>(.*?)</b><span class=\"live-view\">(.*?)</span>", body_lines[0])
                out.append(":::라이브 %s | %s" % (inline_to_md(h.group(1)), inline_to_md(h.group(2))))
                out += article_to_md("\n".join(body_lines[1:]))
            else:
                out.append(":::채팅")
                for c in body_lines:
                    cm = re.fullmatch(r'<p class="chat-msg"><b>(.*?)</b> (.*)</p>', c)
                    out += ["%s: %s" % (inline_to_md(cm.group(1)), inline_to_md(cm.group(2)))] if cm else article_to_md(c)
            out.append(":::"); continue
        if l.startswith("<figure"):
            j = i
            while not lines[j].startswith("</figure>"): j += 1
            out += ["```html"] + lines[i:j + 1] + ["```"]; i = j + 1; continue
        m = re.fullmatch(r'<ul class="doc">((?:<li>.*?</li>)+)</ul>', l)
        if m:
            out += ["- " + inline_to_md(x) for x in re.findall(r"<li>(.*?)</li>", m.group(1))]; i += 1; continue
        m = re.fullmatch(r'<p(?: class="([^"]+)")?>(.*)</p>', l)
        if m and (m.group(1) is None or m.group(1) in PREFIX):
            out.append(PREFIX.get(m.group(1), "") + inline_to_md(m.group(2))); i += 1; continue
        out.append(l); i += 1   # 그 밖의 HTML 줄은 그대로
    return out

# ---------- 원고 → HTML ----------
def esc_quotes(t):
    parts = re.split(r"(<[^>]+>)", t)
    return "".join(p if p.startswith("<") else p.replace('"', "&quot;").replace("'", "&#x27;") for p in parts)

def md_to_inline(t):
    t = esc_quotes(t)
    t = re.sub(r"\[\[(.+?)\|(.+?)\]\]", lambda m: '<span class="itm" data-item="%s" tabindex="0">%s</span>' % (ITEMS[m.group(2).strip()], m.group(1)), t)
    t = re.sub(r"\{(\d+)(■+)\}", lambda m: "\0W%s\0X%s\0Y" % (m.group(1), m.group(2)), t)
    t = re.sub(r"(?<!\0X)(■+)", r'<span class="x">\1</span>', t)
    t = t.replace("\0W", '<span class="won">').replace("\0X", '<span class="x">').replace("\0Y", "</span></span>")
    t = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", t)
    t = re.sub(r"(?<!:)//(.+?)//", r"<em>\1</em>", t)
    return t

def md_to_article(lines):
    out, i, n = [], 0, len(lines)
    while i < n:
        l = lines[i]
        if l == "":
            k = 0
            while i < n and lines[i] == "": k += 1; i += 1
            if out and i < n: out.append(GAP if k == 1 else GAP2)
            continue
        if l == "* * *": out.append(SCENE); i += 1; continue
        if l.startswith(":::") and l[3:].split(" ")[0] in BOX:
            kind = BOX[l[3:].split(" ")[0]]; arg = l[3:].partition(" ")[2]
            j = i + 1
            while lines[j] != ":::": j += 1
            inner = lines[i + 1:j]; i = j + 1
            if kind == "live":
                name, _, view = [x.strip() for x in arg.partition("|")]
                out.append('<div class="live" role="group" aria-label="라이브 방송 화면">')
                out.append('<div class="live-top" aria-hidden="true"><span class="live-on">LIVE</span><b>%s</b><span class="live-view">%s</span></div>' % (md_to_inline(name), md_to_inline(view)))
                out.append(md_to_article(inner).rstrip("\n"))
            else:
                out.append('<div class="chat" role="group" aria-label="채팅창">')
                for c in inner:
                    m = re.match(r"([^\[\]:]{1,20}): (.+)$", c)
                    if m: out.append('<p class="chat-msg"><b>%s</b> %s</p>' % (md_to_inline(m.group(1)), md_to_inline(m.group(2))))
                    elif c: out.append(md_to_article([c]).rstrip("\n"))
            out.append('</div><!--/%s-->' % kind); continue
        if l == "```html":
            j = i + 1
            while lines[j] != "```": j += 1
            out += lines[i + 1:j]; i = j + 1; continue
        if l.startswith("- "):
            items = []
            while i < n and lines[i].startswith("- "): items.append("<li>%s</li>" % md_to_inline(lines[i][2:])); i += 1
            out.append('<ul class="doc">%s</ul>' % "".join(items)); continue
        if RAW.match(l): out.append(l); i += 1; continue   # 문단이 <br>·<span> 같은 글 속 꾸밈으로 시작하면 그냥 문단
        cls = ""
        for c, p in sorted(PREFIX.items(), key=lambda kv: -len(kv[1])):
            if l.startswith(p): cls, l = ' class="%s"' % c, l[len(p):]; break
        out.append("<p%s>%s</p>" % (cls, md_to_inline(l))); i += 1
    return "\n".join(out) + "\n"

def read_src():
    text = open(SRC, encoding="utf-8").read()
    text = re.sub(r"<!--.*?-->", "", text, flags=re.S)
    pages, cur = {}, None
    for line in text.split("\n"):
        if line.startswith("## "): cur = line[3:].split()[0]; pages[cur] = []; continue
        if cur is not None and not line.startswith("# "): pages[cur].append(line.rstrip())
    for k in pages:
        while pages[k] and pages[k][-1] == "": pages[k].pop()
        while pages[k] and pages[k][0] == "": pages[k].pop(0)
    return pages

def norm(s):
    return html.unescape("\n".join(l for l in s.split("\n") if l.strip()))

def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else ""
    if mode == "--extract":
        md = [HEAD]
        for name in ORDER:
            s = open(os.path.join(PAGES, name + ".html"), encoding="utf-8").read()
            where = re.search(r'<span class="bar-where">(.*?)</span>', s).group(1)
            md += ["", "", "## %s · %s" % (name, where), ""] + article_to_md(ART.search(s).group(2))
        open(SRC, "w", encoding="utf-8").write("\n".join(md).rstrip() + "\n")
        print("원고를 뽑았습니다:", os.path.relpath(SRC, ROOT)); return
    pages, bad, changed = read_src(), 0, 0
    for name in ORDER:
        path = os.path.join(PAGES, name + ".html")
        s = open(path, encoding="utf-8").read()
        new = md_to_article(pages[name])
        old = ART.search(s).group(2)
        if norm(new) == norm(old): continue
        if mode == "--check": print("다름:", name); bad += 1; continue
        open(path, "w", encoding="utf-8").write(ART.sub(lambda m: m.group(1) + new + m.group(3), s, count=1)); changed += 1
        print("적용:", name + ".html")
    if mode == "--check": print("모두 같습니다." if not bad else "%d쪽이 다릅니다." % bad); sys.exit(1 if bad else 0)
    print("바뀐 쪽이 없습니다." if not changed else "%d쪽에 적용했습니다." % changed)

if __name__ == "__main__":
    main()
