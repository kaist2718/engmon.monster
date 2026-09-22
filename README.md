# EngMon — engmon.monster

`engmon.monster` — 호(issue) 단위로 읽는 **월간 영어 매거진**. 빌드 도구가 필요 없는 정적 사이트(HTML + CSS + JS)입니다.
MonsterLab(`monsterlab.monster`)의 두 번째 서비스입니다.

## 구조

```
index.html     # 매거진 본문 (표지·목차·섹션·단어장·다음 호)
issues.js      # 매거진 데이터(호·섹션) — 이 파일이 콘텐츠의 "DB"
magazine.js    # 매거진 렌더링·오디오·단어장·진행률
script.js      # 페이지 공통 (한/영 전환, 테마, 강조색, 모바일 메뉴) — EngMon 범위로 정리된 사전
styles.css     # 스타일 (다크/라이트 테마, 강조색 프리셋, 반응형)
smoke-test.js  # 검증 스크립트 (배포 전 `node smoke-test.js`)
CNAME          # GitHub Pages 커스텀 도메인 (engmon.monster)
```

- 프레임워크·패키지·빌드 과정 없음. 파일을 그대로 올리면 동작합니다.
- 외부 의존성 없음(시스템 폰트, CDN 요청 없음). 매거진 오디오는 브라우저 내장 음성합성(`speechSynthesis`)을 씁니다.
- `script.js`가 공용 API(`window.MonsterLab`의 `t`·`toast`)와 `langchange` 이벤트를 노출하고,
  `magazine.js`는 그 두 가지로만 연결됩니다. (전역 이름은 MonsterLab 공용 스크립트에서 이어받은 것이라 그대로 둡니다.)
- `script.js`는 **공용 API를 먼저 노출한 뒤, 기능별로 `guard()` 안에서 초기화**합니다.
  한 기능이 예외로 죽어도 나머지(특히 언어 전환)는 계속 동작하고, 실패한 기능만 콘솔에 남습니다.

> MonsterLab 본체와 분리된 저장소입니다. 홈페이지·서비스 소개는 [monsterlab.monster](https://monsterlab.monster)에 있습니다.
> 이 사이트 안에서 MonsterLab 홈으로 가는 링크는 모두 `https://monsterlab.monster`를 가리킵니다.

## 로컬에서 보기

`index.html`을 브라우저로 열면 됩니다. 로컬 서버로 확인하려면:

```bash
python -m http.server 8000
# 또는
npx serve .
```

## 검증 (배포 전)

```bash
node smoke-test.js
```

브라우저 없이 페이지 스크립트를 **실제로 실행**해 보는 테스트입니다(의존성 없음, Node만 있으면 됩니다).
`index.html`의 인라인 스크립트 → `issues.js` → `script.js` → `magazine.js`를 최소 DOM 위에서 돌리고,
언어 전환·테마 선택·강조색·매거진 렌더링·단어장·듣기 속도 저장까지 클릭을 흉내 내 확인합니다.

특히 다음을 지켜줍니다.

- **회귀 테스트**: 테마 초기화가 강제로 실패해도 언어 전환이 살아남는지 검사합니다.
- **사전 검사**: `data-i18n` 키가 ko/en 양쪽에 모두 있는지, 쓰이지 않는 키가 없는지 확인합니다.
  (`script.js`의 사전은 EngMon이 실제로 쓰는 키만 남겨 두었습니다. 새 기능을 넣고 키를 늘리면 이 검사에 걸립니다.)
- **매거진 검사**: `issues.js` 데이터만큼 섹션이 렌더링되는지, 진행률·목차가 채워지는지 확인합니다.

## 캐시 무효화 (배포 후 "안 바뀐 것처럼 보이는" 문제)

CSS·JS를 참조할 때 `?v=3` 같은 버전을 붙여 둡니다.

```html
<link rel="stylesheet" href="styles.css?v=3" />
<script src="script.js?v=3"></script>
```

**CSS나 JS를 고쳐서 배포할 때는 `index.html`의 `?v=` 숫자를 올리세요.**
그러지 않으면 브라우저나 CDN이 예전 파일을 계속 쓰면서 수정이 반영되지 않은 것처럼 보입니다.

## 배포

정적 호스팅 아무 곳에나 HTML·CSS·JS 파일을 올리면 됩니다
(`index.html`, `issues.js`, `magazine.js`, `script.js`, `styles.css`, `CNAME`).

- **GitHub Pages**: 이 저장소를 푸시하고 Pages를 활성화 (커스텀 도메인은 `engmon.monster`)
- **Vercel / Netlify / Cloudflare Pages**: 빌드 명령 없이 루트 디렉터리 지정

> GitHub Pages는 저장소당 커스텀 도메인 하나만 지원합니다. 그래서 MonsterLab(`monsterlab.monster`)과
> EngMon(`engmon.monster`)은 **저장소를 분리**해 운영합니다.

## 새 호(issue) 추가

`issues.js` 하나로 호를 추가합니다. 서버도 CMS도 필요 없습니다.

```js
var MAGAZINE_ISSUES = [
  { number: 2, slug: 'issue-02', date: '2026-11', level: 'B1', minutes: 25,
    theme: { ko, en }, title: { ko, en }, summary: { ko, en },
    sections: [ { id, kind, level, title:{ko,en}, intro, body, items, dialogue, questions, quiz } ] }
];
```

- 배열의 **맨 앞 호**가 페이지에 표시됩니다(`issues[0]`). 새 호는 맨 앞에 끼워 넣으면 됩니다.
- 섹션 필드는 모두 선택사항이고, 있는 필드만 그려집니다.
  - `items` — 어휘·표현. 각 항목에 "단어장에 저장" 버튼이 자동으로 붙습니다.
  - `quote` — 섹션 중간의 강조 인용 `{ ko, en }`
  - `bullets` — 저장 버튼 없는 목록
  - `dialogue` — `{ who, en, ko }` 대화문 (말풍선)
  - `questions` — 토론 질문 / `quiz` — 보기 중 정답 인덱스(`answer`)와 해설
- `kind` 값은 `mag.kind.<kind>` 문구와 짝을 이룹니다. 새 종류를 쓰려면 `script.js`의 `I18N`에
  `mag.kind.<이름>`을 ko/en 양쪽에 추가하세요.
- **오디오**: `issues.js`의 영어 필드(`body.en`, `items[].en`, `dialogue[].en`)를 모아
  `speechSynthesis`로 읽습니다. 오디오 파일이 필요 없고 비용도 0입니다.

저장 키: `monsterlab.wordbook`(저장한 단어) · `monsterlab.progress`(섹션 완료) · `monsterlab.rate`(듣기 속도)
— 모두 이 브라우저에만 남습니다. (기존 MonsterLab 키 이름을 그대로 씁니다.)

> ⚠️ 1호 내용은 **템플릿 예시(초안)**입니다. 실제 발행 전에 자체 집필로 교체하세요.
> "Learn Hot English"는 실존 상업 브랜드이므로 이름·섹션 구성·문장을 그대로 가져오면 안 됩니다.
> 포맷(월간 테마 + 고정 섹션)만 참고하고 내용은 직접 써야 합니다.

## 브랜드

- 이름: **EngMon** (한글 **엥몬**), 도메인 `engmon.monster` — `eng`(English) + `mon`(Monster) + `.monster`
- MonsterLab(`monsterlab.monster`)의 형제 브랜드. 같은 `.monster` 패밀리입니다.
- 컨셉: **영어를 먹고 자라는 괴물**. 매 호마다 진화하며, 읽기 진행률이 곧 성장입니다.
- 색·테마는 `styles.css`의 기존 변수를 그대로 씁니다 (다크 `#0a0e13` + 강조색 4종).

### 이메일 주소

수신 주소는 **`kaist2718@gmail.com`** 입니다. `script.js`의 `EMAIL` 상수와 `index.html`의 `mailto:` 링크에 나옵니다.

### 색상 / 테마 / 강조색

`styles.css` 상단의 변수 블록(`:root`, `:root[data-theme="light"]`, `:root[data-accent="..."]`)을 따릅니다.
라이트 테마의 `--accent`는 본문 텍스트로도 쓰이므로 **배경 대비 4.5:1**을 지켜야 합니다.

## 기능

- 매거진: 표지 카드(호 번호·테마·날짜), 붙어 있는 목차(스크롤 위치 추적), 상단 읽기 진행 바,
  섹션별 듣기·읽기 시간·완료 표시, 단어장 저장/복사/비우기, 즉시 채점되는 확인 문제, 다음 섹션 이동
- 한/영 전환 토글 — 동적 콘텐츠도 `langchange` 이벤트로 함께 다시 그려집니다
- 다크/라이트/시스템 3단계 테마 **선택** 버튼 (`localStorage` 저장)
- 강조색 4종 프리셋 (푸터 스와치)
- 모바일 햄버거 메뉴, 스크롤 시 헤더 경계선, 맨 위로 가기 버튼
- **Alt + L** 단축키로 언어 전환
- 듣기 속도 3단계(0.75× / 1× / 1.25×, `localStorage` 저장)
- 영어 학습 콘텐츠에 `lang="en"`(한국어 해설에는 `lang="ko"`) 표시
- `prefers-reduced-motion` 존중, 키보드 포커스 링 지원
