# 검열국 탈출 (일제강점기 문학 1차시 방탈출)

드라마 「100일의 거짓말」 연계 수업용 HTML 방탈출 게임입니다.

## 파일 구성
| 파일 | 내용 |
|---|---|
| `story.js` | **대사·설정**. 프롤로그(PRO), 에필로그(EPI), 물건 눌렀을 때 한 줄(FLAVOR), 제한 시간·비밀번호·시구 카드·압수 문서(CONFIG) |
| `game.js` | 게임 동작 코드 (화면, 단계 진행, 힌트, 교사 패널) |
| `assets.js` | 그림 경로·눈 깜빡임 조각·검열실 물건 좌표 |
| `game.html` | 화면 틀과 디자인(CSS) |
| `img/` | 배경, 캐릭터, 아이콘, 오브젝트 PNG |
| `fonts/` | 갈무리11 글꼴 (SIL OFL 1.1) |
| `build.py` | 위 파일들을 한 장짜리 HTML로 합침 |
| `dist/escape_room.html` | **수업에 쓰는 단일 파일** (크롬북, 폰 어디서든 실행) |

## 고치는 법
1. `story.js`의 대사를 고칩니다.
2. `game.html`을 브라우저로 열어 확인합니다 (VS Code의 Live Server 확장을 쓰면 저장할 때마다 새로고침됩니다).
3. 수업용 파일이 필요하면 `python3 build.py`를 실행해 `dist/escape_room.html`을 만듭니다.

### 대사 형식
```js
{bg:"street", spr:"contact", mood:"side", who:"접선책", text:"대사"}
```
- `bg`: 배경 `gate` `street` `press` (생략하면 앞 장면 그대로)
- `spr`: 인물 `guard` `boss` `contact` (생략하면 인물 없음)
- `mood`: 표정. guard: 생략(화남) `calm` `sus` / boss: 생략(보통) `sus` / contact: 생략(보통) `side` `happy`
- `who`: 말하는 사람 이름. 빈 문자열이면 해설
- `choices`: 선택지 `[{t:"보이는 글", goto:"이동할 id"}]`, `id`: 이동 대상 표시, `sus`: 의심도 증가량

### 이 파일에 없는 글
단계별 안내 문구, 힌트, 결과 화면 글은 `game.js`에 있습니다. `Ctrl+F`로 찾아 고치세요.

## 주의
- 그림은 이미지 생성 AI로 만든 것입니다. 사용한 도구의 이용약관을 확인하세요.
- 교사용 비밀번호(`teacherPin`)가 파일 안에 그대로 보입니다.
- 시구 카드는 수업용으로 지은 가상 원고입니다.
