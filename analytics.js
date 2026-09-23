/* ─────────────────────────────────────────────────────────────────────────────
   방문 분석 — Microsoft Clarity (히트맵 · 세션 리플레이 · 페이지 방문)

   프로젝트 ID 는 index.html 의 `window.ENGMON_CLARITY_ID` 한 곳에서만 정합니다.
   ID 를 비워 두면(또는 자리표시자·형식 오류면) 이 파일은 **아무 것도 하지
   않습니다** — 스크립트를 내려받지도, 요청을 보내지도 않습니다.

   Clarity 를 쓰는 이유:
     · **무료이고 사이트·트래픽 제한이 없습니다.** 한 계정에 사이트를 얼마든지 넣습니다.
     · **한 프로젝트(하나의 ID)로 여러 도메인을 묶습니다** — 세 도메인 모두 같은 ID를
       붙이면 한 대시보드에서 함께 봅니다.
     · 입력창(텍스트·드롭다운) 내용은 **모든 마스킹 모드에서 기록되지 않습니다.**
       받아쓰기 답·이메일처럼 사용자가 입력한 값은 수집되지 않습니다.

   켜지지 않는 경우(모두 조용히 종료):
     1. 프로젝트 ID 가 없거나 형식이 아닐 때
     2. 파일을 `file://` 로 열었을 때 — 로컬 확인이 통계에 섞이지 않도록
     3. 브라우저의 추적 금지(Do Not Track)가 켜져 있을 때
        (Clarity 자체는 DNT 를 따르지 않으므로, 우리가 아예 불러오지 않습니다)

   알아 둘 점(켤 때 대시보드에서 함께 설정하세요):
     · Clarity 는 자사 쿠키(`_clck`·`_clsk`)를 씁니다. **Settings > Setup > Advanced 에서
       Cookies 를 끄면** 쿠키 없이도 동작합니다. 유럽(EEA·영국·스위스) 방문자에게는
       동의 신호(consent API)가 필요합니다 — README 참고.
     · **Settings > Masking 을 Strict 로** 두면 화면의 모든 글자가 가려집니다(권장).
     · 보관 기간은 **30일**입니다. 만 18세 미만 대상 사이트에는 쓰지 마세요.
   ───────────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var ID = window.ENGMON_CLARITY_ID;

  /* 1) 프로젝트 ID 가 없거나 자리표시자·형식 오류면 끝냅니다 */
  if (typeof ID !== 'string') return;
  ID = ID.trim();
  if (!ID) return;
  if (/^x+$/i.test(ID)) return;                 /* xxxxxxxxxx 자리표시자 */
  if (!/^[a-z0-9]{6,20}$/i.test(ID)) return;    /* Clarity 프로젝트 ID 형식이 아님 */

  /* 2) 로컬(file://)에서는 보내지 않습니다 */
  if (location.protocol !== 'http:' && location.protocol !== 'https:') return;

  /* 3) 추적 금지 설정을 존중합니다 */
  if (navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.msDoNotTrack === '1') return;

  /* Clarity 대기열을 먼저 만들고(공식 스니펫과 같은 방식) 스크립트를 비동기로 넣습니다.
     학습 행동(섹션 완료·단어 저장·정답률)을 보내는 호출은 하지 않습니다. */
  window.clarity = window.clarity || function () {
    (window.clarity.q = window.clarity.q || []).push(arguments);
  };

  var tag = document.createElement('script');
  tag.async = true;
  tag.src = 'https://www.clarity.ms/tag/' + ID;
  (document.head || document.documentElement).appendChild(tag);
})();
