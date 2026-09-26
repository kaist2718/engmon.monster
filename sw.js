/* EngMon Service Worker — 오프라인 학습 지원
   ==========================================================================

   전략 (toeic.monster 와 같은 방식):
     · HTML 문서(페이지 이동): 네트워크 우선 → 새 배포가 즉시 반영, 오프라인이면 캐시 폴백
     · 그 밖의 에셋: stale-while-revalidate → 캐시를 즉시 응답하고 백그라운드에서 갱신
     · 외부 출처(방문 분석 수집 스크립트)는 손대지 않습니다

   캐시 주의:
     index.html 은 `styles.css?v=12` 처럼 버전 쿼리를 붙여 부릅니다.
     아래 CORE_ASSETS 는 버전 없는 이름으로 미리 담고, 버전이 붙은 요청은
     첫 방문의 fetch 가 runtime 캐시에 채웁니다. 그래서 첫 방문부터 오프라인이면
     버전 붙은 파일은 없을 수 있지만, 한 번만 열면 다음부터는 오프라인에서도 열립니다.

   캐시 이름에 버전이 들어갑니다 — CSS/JS 를 바꿔 배포할 때 CACHE_NAME 의 숫자를
   올리세요(?v= 를 올리는 것과 같은 시점). 그러지 않으면 옛 파일이 계속 보입니다.
   ========================================================================== */

var CACHE_NAME = "engmon-v9";

var CORE_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./script.js",
  "./magazine.js",
  "./issues.js",
  "./manifest.webmanifest",
  "./icon.svg",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
  "./assets/site.css",
  "./assets/fonts/pretendard-variable.woff2"
];

/* 설치: 핵심 에셋 캐시. 일부 파일이 없더라도(부분 배포 등) 설치 자체는 실패하지 않게 개별적으로 담습니다. */
self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return Promise.all(
        CORE_ASSETS.map(function (url) {
          return cache.add(url).catch(function () {});
        })
      );
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

/* 활성화: 이전 버전 캐시 정리 */
self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE_NAME; })
            .map(function (k) { return caches.delete(k); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

/* 페이지에서 새 버전으로 바로 전환하고 싶을 때 보내는 신호 */
self.addEventListener("message", function (event) {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

/* 요청 처리 */
self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);

  if (url.origin !== self.location.origin) return; // 외부 리소스(분석 스크립트)는 손대지 않습니다

  var accept = (req.headers.get("accept") || "");
  var isHTML = req.mode === "navigate" || accept.indexOf("text/html") !== -1;

  if (isHTML) {
    event.respondWith(
      fetch(req).then(function (response) {
        if (response && response.status === 200) {
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(req, copy); });
        }
        return response;
      }).catch(function () {
        return caches.match(req).then(function (cached) {
          return cached || caches.match("./index.html");
        }).then(function (cached) {
          /* 첫 방문부터 오프라인이면 캐시가 없습니다 — 유효한 실패 응답으로 마무리
             (undefined 를 respondWith 하면 TypeError 로 unhandled rejection 이 납니다) */
          return cached || Response.error();
        });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(function (cached) {
      var network = fetch(req).then(function (response) {
        if (response && response.status === 200 && response.type === "basic") {
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(req, copy); });
        }
        return response;
      }).catch(function () { return cached || Response.error(); });
      return cached || network;
    })
  );
});
