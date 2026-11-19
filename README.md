# 구거 · gugeo.party

국어 수업 활동을 모아 두는 첫 페이지(https://gugeo.party)입니다.

## 구성
| 경로 | 내용 |
|---|---|
| `dist/index.html` | gugeo.party 첫 페이지. 섹션은 01 활동 · 02 개발 중 · 03 지난 활동(접혀 있는 `<details class="past">`, 지난 해 활동 article을 그 안에 넣음). 브랜드 이름은 **구거**(gugeo를 그대로 읽은 말). 테마 색은 파비콘의 파란색 `#002b96`, 첫 화면 ㄱㅜㄱㅓ 글자는 파비콘 획 비율을 옮긴 SVG(`#gugeo`). 활동은 `<article class="feature">`를 복사해 더합니다. 진행 방법은 카드 안 `<div class="how">`에 적으면 카드를 눌렀을 때 펼쳐집니다 |
| `goedam/원고.md` | 괴담 이야기 12쪽의 글을 한 파일에 모은 원고. 고친 뒤 `python3 goedam/build.py`를 돌리면 `dist/goedam/ep*.html`의 본문에 적용됨 (`--check`는 확인만). 쓰는 법은 원고 맨 위에 있음 |
| `goedam/연출-계획.md` | 괴담 이야기에 아직 넣지 않은 연출 목록(다음에 이어서 할 일)과 이미 한 것 |
| `dist/img/` | 첫 페이지에 쓰는 그림 (방탈출 게임 그림을 WebP로 옮겨 둠) |
| `dist/video/` | 점령전 '개발 중' 카드의 티저(`war-teaser.mp4`, 약 40초 반복·무음), 전체 보기 창의 오프닝(`war-full.mp4`, 128초), 포스터(`war-teaser.webp`). lit-war 레포에서 `sh scripts/openings/make-teaser.sh` 로 만들어 `output/openings/common-propaganda-v3/teaser/`에 생긴 파일을 복사. Cloudflare Pages는 파일 하나에 25MB까지만 올라감 |
| `dist/goedam/` | 연재 이야기 「괴담에 떨어져도 수행평가를 해야 하는구나」 (gugeo.party/goedam/). 2025 구글 사이트(sites.google.com/view/2025gugeo)에서 옮겨 옴. 글은 원문 그대로, 꾸밈은 `goedam.css`. 성향 테스트(스모어)·지급물품 보드(띵커벨)는 바깥 링크 |
| `dist/_redirects` | 예전 게임 주소(`/game/`, `/tv/`, `/dist/game/`)를 새 주소로 넘겨 줌 |
| `dist/favicon.ico` 등 | 사이트 아이콘 |

Cloudflare가 이 레포의 `dist/` 폴더를 그대로 서비스합니다 (빌드 명령 없음).

## 활동별 레포
| 활동 | 레포 | 주소 |
|---|---|---|
| 검열국을 탈출하라 (방탈출) | [RamzThunder/censor-escape](https://github.com/RamzThunder/censor-escape) | https://censor.gugeo.party/game/ · TV https://censor.gugeo.party/tv/ |

방탈출 게임은 2026-11에 이 레포에서 `censor-escape`로 분리했습니다. 그 전 기록은 censor-escape 레포에 그대로 있습니다.

괴담(`dist/goedam/`)의 `goedam.css`·`goedam.js`는 브라우저가 4시간 동안 캐시하므로, 고친 뒤에는 모든 쪽의 `?v=` 값을 바꿉니다: `cd dist/goedam && v=$(cat goedam.css goedam.js | md5 | cut -c1-8) && sed -i '' -E "s#goedam\.(css|js)(\?v=[a-z0-9]+)?\"#goedam.\1?v=$v\"#g" *.html`
