/* ─────────────────────────────────────────────────────────────────────────────
   방문 분석 — Counter.dev (방문자 수 · 유입 경로 · 국가)

   사이트 ID(UUID)는 index.html 의 `window.ENGMON_COUNTER_ID` 한 곳에서만 정합니다.
   ID 를 비워 두면(또는 자리표시자·형식 오류면) 이 파일은 **아무 것도 하지
   않습니다** — 스크립트를 내려받지도, 요청을 보내지도 않습니다.

   Counter.dev 를 쓰는 이유:
     · **무료이고 오픈소스**(AGPL-v3, pay-what-you-want)입니다.
     · **쿠키를 쓰지 않고**(No Cookies) IP 주소도 저장하지 않아 **동의 배너가 필요 없습니다.**
     · 화면이 **방문자 수·유입 경로·국가**뿐이라 배울 것이 없습니다.
       (Clarity 의 히트맵·세션 리플레이 같은 복잡한 기능은 없습니다.)

   켜지지 않는 경우(모두 조용히 종료):
     1. 사이트 ID 가 없거나 형식이 아닐 때
     2. 파일을 `file://` 로 열었을 때 — 로컬 확인이 통계에 섞이지 않도록
     3. 브라우저의 추적 금지(Do Not Track)가 켜져 있을 때

   알아 둘 점:
     · Counter.dev 는 **사이트마다 ID(UUID)가 다릅니다.** 도메인이 여러 개면 대시보드에서
       사이트를 각각 만들고, 각 사이트의 index.html 에 그 ID 를 넣습니다.
       (같은 ID 를 여러 도메인에 붙이면 한 칸에 합쳐서 잡힙니다.)
     · `data-utcoffset` 으로 방문자 지역 시간대의 날짜 경계를 씁니다.
   ───────────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var ID = window.ENGMON_COUNTER_ID;

  /* 1) 사이트 ID 가 없거나 자리표시자·형식 오류면 끝냅니다 */
  if (typeof ID !== 'string') return;
  ID = ID.trim().toLowerCase();
  if (!ID) return;
  if (ID === '00000000-0000-0000-0000-000000000000') return;   /* 자리표시자 */
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(ID)) return; /* UUID 아님 */

  /* 2) 로컬(file://)에서는 보내지 않습니다 */
  if (location.protocol !== 'http:' && location.protocol !== 'https:') return;

  /* 3) 추적 금지 설정을 존중합니다 */
  if (navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.msDoNotTrack === '1') return;

  /* UTC 시차(시간) — 방문자 지역 시간대로 날짜를 나누는 데 씁니다 */
  var utcOffset = -new Date().getTimezoneOffset() / 60;

  var tag = document.createElement('script');
  tag.async = true;
  tag.src = 'https://cdn.counter.dev/script.js';
  tag.setAttribute('data-id', ID);
  tag.setAttribute('data-utcoffset', String(utcOffset));
  (document.head || document.documentElement).appendChild(tag);
})();
