/* ─────────────────────────────────────────────────────────────────────────────
   방문 분석 — Google Analytics 4 (페이지 방문만)

   측정 ID 는 index.html 의 `window.ENGMON_GA4_ID` 한 곳에서만 정합니다.
   ID 를 비워 두면(또는 자리표시자 `G-XXXXXXXXXX` 그대로면) 이 파일은 **아무 것도
   하지 않습니다** — 스크립트를 내려받지도, 요청을 보내지도 않습니다.

   켜지지 않는 경우(모두 조용히 종료):
     1. 측정 ID 가 없거나 형식이 `G-...` 가 아닐 때
     2. 파일을 `file://` 로 열었을 때 — 로컬 확인이 통계에 섞이지 않도록
     3. 브라우저의 추적 금지(Do Not Track)가 켜져 있을 때

   수집 범위: 페이지 방문(조회수·유입·기기·국가·체류 시간)만.
   섹션 완료·단어 저장 같은 **학습 행동은 보내지 않습니다**.
   개인을 알아볼 수 있는 값(이름·이메일·입력한 받아쓰기 답)도 보내지 않습니다.
   ───────────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var ID = window.ENGMON_GA4_ID;

  /* 1) 측정 ID 가 없거나 아직 자리표시자면 끝냅니다 */
  if (typeof ID !== 'string') return;
  ID = ID.trim();
  if (!ID) return;
  if (/^G-X+$/i.test(ID)) return;              /* G-XXXXXXXXXX 자리표시자 */
  if (!/^G-[A-Z0-9]{4,}$/i.test(ID)) return;   /* GA4 측정 ID 형식이 아님 */

  /* 2) 로컬(file://)에서는 보내지 않습니다 */
  if (location.protocol !== 'http:' && location.protocol !== 'https:') return;

  /* 3) 추적 금지 설정을 존중합니다 */
  if (navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.msDoNotTrack === '1') return;

  /* gtag 대기열을 먼저 만들고 스크립트를 내려받습니다 */
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  var tag = document.createElement('script');
  tag.async = true;
  tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(ID);
  (document.head || document.documentElement).appendChild(tag);

  window.gtag('js', new Date());
  window.gtag('config', ID, {
    anonymize_ip: true,                     /* IP 익명화 */
    allow_google_signals: false,            /* 광고·리마케팅 신호 끔 */
    allow_ad_personalization_signals: false,
    send_page_view: true,                   /* 페이지 방문만 수집 */
  });
})();
