# 구거 · gugeo.party

국어 수업 활동을 모아 두는 첫 페이지(https://gugeo.party)입니다.

## 구성
| 경로 | 내용 |
|---|---|
| `dist/index.html` | gugeo.party 첫 페이지. 브랜드 이름은 **구거**(gugeo를 그대로 읽은 말). 테마 색은 파비콘의 파란색 `#002b96`, 첫 화면 ㄱㅜㄱㅓ 글자는 파비콘 획 비율을 옮긴 SVG(`#gugeo`). 활동은 `<article class="feature">`를 복사해 더합니다. 진행 방법은 카드 안 `<div class="how">`에 적으면 카드를 눌렀을 때 펼쳐집니다 |
| `dist/img/` | 첫 페이지에 쓰는 그림 (방탈출 게임 그림을 WebP로 옮겨 둠) |
| `dist/_redirects` | 예전 게임 주소(`/game/`, `/tv/`, `/dist/game/`)를 새 주소로 넘겨 줌 |
| `dist/favicon.ico` 등 | 사이트 아이콘 |

Cloudflare가 이 레포의 `dist/` 폴더를 그대로 서비스합니다 (빌드 명령 없음).

## 활동별 레포
| 활동 | 레포 | 주소 |
|---|---|---|
| 검열국을 탈출하라 (방탈출) | [RamzThunder/censor-escape](https://github.com/RamzThunder/censor-escape) | https://censor.gugeo.party/game/ · TV https://censor.gugeo.party/tv/ |

방탈출 게임은 2026-11에 이 레포에서 `censor-escape`로 분리했습니다. 그 전 기록은 censor-escape 레포에 그대로 있습니다.
