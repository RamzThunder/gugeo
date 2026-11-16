# gugeo.party

국어 수업 활동을 모아 두는 첫 페이지(https://gugeo.party)입니다.

## 구성
| 경로 | 내용 |
|---|---|
| `dist/index.html` | gugeo.party 첫 페이지 (국어파티). 활동은 `<article class="feature">`를 복사해 더하고, 첫 화면 초대장(`.ticket`)은 오늘 쓸 활동으로 바꿉니다 |
| `dist/img/` | 첫 페이지에 쓰는 그림 (방탈출 게임 그림을 WebP로 옮겨 둠) |
| `dist/_redirects` | 예전 게임 주소(`/game/`, `/tv/`, `/dist/game/`)를 새 주소로 넘겨 줌 |
| `dist/favicon.ico` 등 | 사이트 아이콘 |

Cloudflare가 이 레포의 `dist/` 폴더를 그대로 서비스합니다 (빌드 명령 없음).

## 활동별 레포
| 활동 | 레포 | 주소 |
|---|---|---|
| 검열국을 탈출하라 (방탈출) | [RamzThunder/censor-escape](https://github.com/RamzThunder/censor-escape) | https://censor.gugeo.party/game/ · TV https://censor.gugeo.party/tv/ |

방탈출 게임은 2026-11에 이 레포에서 `censor-escape`로 분리했습니다. 그 전 기록은 censor-escape 레포에 그대로 있습니다.
