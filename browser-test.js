/* ─────────────────────────────────────────────────────────────────────────────
   EngMon 브라우저 검증 (헤드리스 Chrome)

     node browser-test.js                        검증만 실행 (file://)
     node browser-test.js --shots                + .shots/ 에 스크린샷 저장
     node browser-test.js --site-root _site      배포본 폴더를 http 로 서빙해 검사
     node browser-test.js --live [url]           배포된 사이트 검사 (기본 engmon.monster)

   smoke-test.js 가 데이터·마크업·CSS 규칙을 검사하는 것과 달리,
   이 스크립트는 실제 Chrome 을 띄워 다음을 확인합니다.

     1) 목차(사이드바)가 화면보다 길 때 잘리지 않고 스크롤되는가
     2) 모바일/태블릿 폭에서 가로 오버플로·잘림이 없는가
     3) 터치 스와이프·목차 링크 이동이 동작하는가
     4) 주(week) 전환·52주 플랜·오늘의 학습·복습·백업·인쇄가 동작하는가
     5) 콘솔 에러가 없는가
     6) 방문 분석(자체 호스팅) — 수집 스크립트를 한 번만 부르는가, 도메인이 맞는가
        (수집 서버에는 실제로 보내지 않습니다. 요청만 가로채서 확인합니다)

   Chrome 경로는 CHROME 환경변수로 덮어쓸 수 있습니다.
   ───────────────────────────────────────────────────────────────────────────── */
'use strict';

const { spawn, spawnSync } = require('child_process');
const http = require('http');
const net = require('net');
const path = require('path');
const fs = require('fs');
const os = require('os');

const CANDIDATES = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);
const CHROME = CANDIDATES.find((p) => { try { return fs.existsSync(p); } catch (e) { return false; } });

if (!CHROME) {
  console.log('\n  Chrome 실행 파일을 찾지 못해 브라우저 검증을 건너뜁니다.');
  console.log('  CHROME 환경변수로 경로를 지정하세요.\n');
  process.exit(0);
}

/* 인자 — 기본(file://) · --site-root <dir> · --live [url] */
const RAW_ARGS = process.argv.slice(2);
const argVal = (name) => {
  const i = RAW_ARGS.indexOf(name);
  if (i === -1) return null;
  const next = RAW_ARGS[i + 1];
  return next && !next.startsWith('--') ? next : true;
};
const LIVE = argVal('--live');
const SITE_ROOT = argVal('--site-root');

let url = 'file:///' + path.join(__dirname, 'index.html').replace(/\\/g, '/');
let siteServer = null;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'engmon-browser-'));
const WANT_SHOTS = process.argv.indexOf('--shots') !== -1;
const OUT = path.join(__dirname, '.shots');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* 빈 포트를 먼저 잡아 씁니다. 고정 포트를 쓰면 이전 실행의 Chrome 이 남아 있을 때
   그 인스턴스에 붙어 엉뚱한 localStorage(프로필)를 검사하게 됩니다. */
function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
  });
}

let PORT = 0;
let chrome = null;
function killChrome() {
  if (!chrome || chrome.killed) return;
  try {
    if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(chrome.pid), '/T', '/F'], { stdio: 'ignore' });
  } catch (e) { /* 무시 */ }
  try { chrome.kill(); } catch (e) { /* 무시 */ }
  chrome = null;
}

async function getJson(p) { const res = await fetch('http://127.0.0.1:' + PORT + p); return res.json(); }
async function waitForDevtools() {
  for (let i = 0; i < 80; i++) { try { return await getJson('/json/version'); } catch (e) { await sleep(250); } }
  throw new Error('DevTools 에 연결하지 못했습니다');
}
function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  const events = [];
  const api = { events: events, onEvent: null, ready: null, send: null };
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error))); else resolve(msg.result);
    } else if (msg.method) {
      events.push(msg);
      /* 가로챈 요청(Fetch.requestPaused)은 여기서 반드시 응답해 줘야 합니다.
         응답하지 않으면 요청이 영영 멈춰 페이지가 열리지 않습니다. */
      if (api.onEvent) api.onEvent(msg);
    }
  });
  api.ready = new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
  api.send = (m, p) => {
    const mid = ++id;
    return new Promise((res, rej) => {
      pending.set(mid, { resolve: res, reject: rej });
      ws.send(JSON.stringify({ id: mid, method: m, params: p || {} }));
    });
  };
  return api;
}

/* 프로젝트 폴더를 그대로 서빙하는 최소 정적 서버 (http 로 열어야 분석 스크립트가 삽니다). */
function serveStatic(root) {
  const server = http.createServer((req, res) => {
    const file = decodeURIComponent(req.url.split('?')[0]);
    const send = (body, type) => { res.writeHead(200, { 'Content-Type': type }); res.end(body); };

    const target = path.join(root, file === '/' ? 'index.html' : file);
    fs.readFile(target, (err, buf) => {
      if (err) { res.writeHead(404); res.end('not found'); return; }
      const type = /\.css$/.test(target) ? 'text/css; charset=utf-8'
        : /\.js$/.test(target) ? 'text/javascript; charset=utf-8'
          : 'text/html; charset=utf-8';
      send(buf, type);
    });
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port })));
}

/* 임의의 폴더를 http 로 서빙합니다(--site-root). 서비스워커·매니페스트(PWA)를
   검사하려면 file:// 가 아니라 http 로 열어야 합니다. */
function serveDir(root) {
  const MIME = {
    '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8', '.webmanifest': 'application/manifest+json; charset=utf-8',
    '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
    '.woff2': 'font/woff2', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  };
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
    if (p.endsWith('/')) p += 'index.html';
    const target = path.join(root, p);
    const rel = path.relative(root, target);
    if (rel.startsWith('..') || path.isAbsolute(rel)) { res.writeHead(403); return res.end('forbidden'); }
    fs.readFile(target, (err, buf) => {
      if (err) {
        fs.readFile(path.join(root, '404.html'), (e2, notFound) => {
          if (e2) { res.writeHead(404); res.end('not found'); return; }
          res.writeHead(404, { 'Content-Type': MIME['.html'] });
          res.end(notFound);
        });
        return;
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(target).toLowerCase()] || 'application/octet-stream' });
      res.end(buf);
    });
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port })));
}

let pass = 0;
let fail = 0;
function report(ok, label, detail) {
  if (ok) { pass++; console.log('  ✓ ' + label + (detail ? '  ' + detail : '')); }
  else { fail++; console.log('  ✗ ' + label + (detail ? '  ' + detail : '')); }
}

/* ── 목차(사이드바) 스크롤 상태 ─────────────────────────────────────────── */
const asideProbe = `(() => {
  const html = document.documentElement;
  const prev = html.style.scrollBehavior;
  html.style.scrollBehavior = 'auto';
  window.scrollTo(0, 4000);
  const aside = document.querySelector('.issue-aside');
  /* 사이드바가 붙어 있는 상태에서, 사이드바 자체를 끝까지 내린 뒤 측정합니다 */
  aside.scrollTop = aside.scrollHeight;
  const box = aside.getBoundingClientRect();
  const last = document.querySelector('#tocList li:last-child').getBoundingClientRect();
  const hint = document.querySelector('.aside-hint').getBoundingClientRect();
  const out = {
    viewportH: innerHeight,
    top: Math.round(box.top),
    bottom: Math.round(box.bottom),
    needsScroll: aside.scrollHeight > aside.clientHeight + 1,
    canScroll: aside.scrollHeight - aside.clientHeight,
    scrollTop: Math.round(aside.scrollTop),
    lastBottom: Math.round(last.bottom),
    hintBottom: Math.round(hint.bottom),
    hintBottomVsViewport: Math.round(hint.bottom - innerHeight),
    position: getComputedStyle(aside).position,
    overflowY: getComputedStyle(aside).overflowY,
  };
  html.style.scrollBehavior = prev;
  return out;
})()`;

/* ── 가로 오버플로/잘림 ─────────────────────────────────────────────────── */
const overflowProbe = `(() => {
  const d = document.documentElement;
  const vw = d.clientWidth;
  function clippedX(node) {
    let n = node.parentElement;
    while (n && n !== document.body) {
      const ox = getComputedStyle(n).overflowX;
      if (ox === 'hidden' || ox === 'auto' || ox === 'scroll') return true;
      n = n.parentElement;
    }
    return false;
  }
  const offenders = [];
  document.querySelectorAll('body *').forEach((n) => {
    const r = n.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return;
    if (clippedX(n)) return;
    if (r.right > vw + 1 || r.left < -1) offenders.push(n.tagName.toLowerCase() + '.' + String(n.className).slice(0, 24));
  });
  const aside = document.querySelector('.issue-aside');
  const menu = document.getElementById('menuBtn');

  /* '찌그러진 글상자' 찾기 — flex 행이 줄바꿈되지 않으면 폭이 0 이 되고
     글자는 상자 밖으로 흘러 세로로 한 글자씩 쌓입니다. 가로 오버플로 검사로는
     잡히지 않아서(상자 폭이 0 이라 화면 밖으로 안 나감) 따로 확인합니다. */
  const squeezed = [];
  document.querySelectorAll('body *').forEach((n) => {
    const txt = (n.textContent || '').trim();
    if (!txt) return;
    if (n.querySelector('*')) return; /* 자식이 있으면 부모만 보면 됨 */
    if (n.closest('.visually-hidden, .toast, [hidden], script, style')) return;
    const r = n.getBoundingClientRect();
    if (r.width <= 2 && r.height >= 16) squeezed.push(n.tagName.toLowerCase() + '.' + String(n.className).trim().split(/\s+/)[0] + ' w=' + Math.round(r.width) + ' h=' + Math.round(r.height) + ' "' + txt.slice(0, 16) + '"');
    /* 말줄임표로 잘려 사라진 라벨도 문제입니다(좁은 화면 탭바 라벨 등) */
    if (r.width > 2 && n.classList.contains('tab-label') && n.scrollWidth > n.clientWidth + 1) {
      squeezed.push('tab-label 잘림 "' + txt.slice(0, 16) + '"');
    }
  });

  return {
    vw,
    hOverflow: d.scrollWidth > vw + 1,
    offenders: offenders.slice(0, 6),
    squeezed: squeezed.slice(0, 6),
    asidePosition: aside ? getComputedStyle(aside).position : null,
    asideClipped: aside ? aside.scrollHeight > aside.clientHeight + 1 : null,
    tocItems: document.querySelectorAll('#tocList li').length,
    menuVisible: menu ? getComputedStyle(menu).display !== 'none' : null,
    sections: document.querySelectorAll('.m-section').length,
  };
})()`;

(async () => {
  PORT = await freePort();
  chrome = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--remote-debugging-port=' + PORT, '--user-data-dir=' + profile, '--window-size=1440,900', 'about:blank',
  ], { stdio: 'ignore' });

  await waitForDevtools();
  const r0 = await fetch('http://127.0.0.1:' + PORT + '/json/new?about:blank', { method: 'PUT' });
  const cdp = connect((await r0.json()).webSocketDebuggerUrl);
  await cdp.ready;
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Log.enable');

  /* 모드 선택 — file://(기본) · --site-root(배포본 폴더) · --live(배포 주소).
     서비스워커·매니페스트(PWA)는 http(s) 에서만 동작하므로 기본 모드에서는 건너뜁니다. */
  if (LIVE) {
    url = typeof LIVE === 'string' ? LIVE : 'https://engmon.monster/';
    console.log('\n  대상: ' + url + ' (라이브)');

    /* 배포 직후에는 CDN/캐시가 이전 배포본을 돌려줄 수 있습니다. 이전 배포본에 대해
       검사하면 데이터·기능 검사가 엉뚱한 이유로 실패하므로, 이번 커밋의 index.html 이
       부르는 스크립트 버전(?v=) 이 라이브 HTML 에 나타날 때까지 기다립니다.
       (deploy.yml 의 잠깐 대기(sleep) 를 대체하는 확실한 확인입니다) */
    const localIndex = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    /* 스크립트 하나가 아니라 에셋 참조 전체(?v=)를 기준으로 합니다 —
       어떤 파일만 고친 푸시에서도 새 배포본을 정확히 알아봅니다 */
    const markers = [...localIndex.matchAll(/(?:src|href)="[^"]*\?v=[\w.-]+"/g)].map((m) => m[0]);
    if (markers.length) {
      const deadline = Date.now() + 180000;
      let reflected = false;
      while (Date.now() < deadline) {
        const liveHtml = await fetch(url).then((r) => r.text()).catch(() => '');
        if (markers.every((mk) => liveHtml.indexOf(mk) > -1)) { reflected = true; break; }
        console.log('  · 라이브가 아직 이전 배포본입니다 — 배포 반영을 기다립니다…');
        await sleep(10000);
      }
      if (!reflected) {
        throw new Error('라이브가 아직 이전 배포본을 보여 줍니다 — ' + markers.join(', ') + ' 를 찾지 못했습니다 (' + url + '). 배포가 반영된 뒤 다시 실행하세요.');
      }
    }
  } else if (SITE_ROOT) {
    const root = path.resolve(__dirname, typeof SITE_ROOT === 'string' ? SITE_ROOT : '.');
    const s = await serveDir(root);
    siteServer = s.server;
    url = 'http://127.0.0.1:' + s.port + '/index.html';
    console.log('\n  대상: ' + root + ' (http 서빙)');
  }

  const evalv = async (expr) => {
    const r = await cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true });
    if (r.exceptionDetails) {
      const e = r.exceptionDetails.exception;
      throw new Error('페이지 평가 실패: ' + ((e && e.description) || r.exceptionDetails.text || 'unknown'));
    }
    return r.result.value;
  };
  const evalAwait = async (expr) => (await cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result.value;
  const load = async (w, h, mobile) => {
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, mobile: !!mobile });
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: !!mobile, maxTouchPoints: 5 });
    await cdp.send('Page.navigate', { url });
    /* 고정 대기 대신 매거진이 실제로 그려질 때까지 기다립니다.
       기준은 **목차 항목**입니다 — .issue-aside 는 index.html 에 정적으로 있어서
       그것만 보면 아직 스크립트가 돌기 전에 검사가 시작됩니다(매거진 데이터가
       커지면 렌더링이 300ms 를 넘겨 tocList 가 비어 있는 채로 잡히기도 합니다). */
    /* 콘텐츠가 늘수록 렌더링이 느려집니다. 대기 시간을 넉넉히 두고,
       끝내 못 기다렸으면 여기서 분명한 메시지로 실패시킵니다.
       (그냥 진행하면 asideProbe 가 null 을 잡고 알 수 없는 에러로 죽습니다)
       CI 처럼 여러 검사를 연달아 돌릴 때 첫 네비게이션이 간혹 멈추는 경우가 있어,
       못 기다렸으면 한 번 다시 네비게이션한 뒤 다시 기다립니다. */
    /* 콘텐츠가 커질수록 첫 렌더링이 느려집니다. 기계가 느릴 때 첫 시도가
       타임아웃으로 죽지 않도록 시도당 30초 이상 기다립니다. */
    const rendered = async () => {
      for (let i = 0; i < 240; i++) {
        const ok = await evalv('!!document.querySelector(".issue-aside") && !!document.querySelector("#tocList li")').catch(() => false);
        if (ok) return true;
        await sleep(150);
      }
      return false;
    };

    let ready = await rendered();
    if (!ready) {
      await cdp.send('Page.navigate', { url });
      ready = await rendered();
    }
    if (!ready) {
      /* 무엇이 문제인지 알 수 있게 페이지 상태를 함께 남깁니다 */
      const diag = await evalv(`(() => ({
        title: document.title,
        readyState: document.readyState,
        data: typeof window.MAGAZINE_WEEKS,
        tocItems: document.querySelectorAll('#tocList li').length,
        sections: document.querySelectorAll('.m-section').length
      }))()`).catch((e) => '진단 실패: ' + e.message);
      throw new Error('매거진 렌더링 대기 시간 초과 — ' + w + 'x' + h + ' 에서 2회 시도했는데 목차(#tocList li)가 나오지 않았습니다 · ' + JSON.stringify(diag));
    }
    await sleep(200); /* 레이아웃 안정화 */
  };

  /* ── 1. 목차 스크롤 ──────────────────────────────────────────────────── */
  console.log('\n[1] 목차(사이드바) 스크롤 — 데스크톱');
  /* 사이드바 붙임(sticky)은 본문이 길 때 의미가 있습니다 — 전체 보기로 펼친 뒤
     검사합니다. (한 섹션씩 보기에서는 짧은 본문에서 스티키가 아예 안 붙습니다) */
  await load(1400, 1080, false);
  await evalv(`(() => {
    const view = document.querySelector('.step-view');
    if (view && view.getAttribute('aria-pressed') === 'false') view.click();
    return true;
  })()`);
  for (const h of [1080, 1000, 900, 800, 700, 600]) {
    await load(1400, h, false);
    const v = await evalv(asideProbe);
    /* needsScroll 이면 안내 문구가 잘리지 않고 화면 안에 들어와야 합니다 */
    report(v.hintBottom <= v.viewportH + 1,
      '뷰포트 ' + String(v.viewportH).padStart(4) + 'px — 목차 끝(마지막 항목 + 안내)까지 보임',
      'aside ' + v.top + '~' + v.bottom + ' · 내부스크롤 ' + v.canScroll + 'px · 안내 ' + v.hintBottom + '/' + v.viewportH +
      ' · overflow-y=' + v.overflowY);
  }
  await load(1400, 700, false);
  /* 부드러운 스크롤(smooth)을 끄지 않으면 스크롤 애니메이션 도중에 좌표를
     잡아 휠 이벤트가 다른 곳에 떨어집니다(플레이키의 원인). */
  await evalv('document.documentElement.style.scrollBehavior = "auto"; document.querySelector(".issue-aside").scrollTop = 0; window.scrollTo(0, 4000);');
  await sleep(400);
  const wheelBefore = await evalv('document.querySelector(".issue-aside").scrollTop');
  const rect = await evalv(`(() => { const b = document.querySelector('.issue-aside').getBoundingClientRect(); return { x: Math.round(b.left + b.width / 2), y: Math.round(b.top + b.height / 2) }; })()`);
  for (let i = 0; i < 14; i++) {
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: rect.x, y: rect.y, deltaX: 0, deltaY: 160 });
    await sleep(90);
  }
  /* 휠은 위에서 측정한 asideProbe 를 다시 쓰지 않습니다(그 안에서 scrollTop 을 끝으로 보내기 때문) */
  const wheelAfter = await evalv(`(() => {
    const aside = document.querySelector('.issue-aside');
    const hint = document.querySelector('.aside-hint').getBoundingClientRect();
    return { scrollTop: Math.round(aside.scrollTop), canScroll: aside.scrollHeight - aside.clientHeight, hintBottom: Math.round(hint.bottom), viewportH: innerHeight };
  })()`);
  report(wheelAfter.scrollTop > wheelBefore,
    '마우스 휠로 목차 자체가 스크롤된다',
    'aside.scrollTop ' + Math.round(wheelBefore) + ' → ' + wheelAfter.scrollTop + ' (최대 ' + wheelAfter.canScroll + 'px)');
  report(wheelAfter.hintBottom <= wheelAfter.viewportH + 1,
    '휠로 내리면 안내 문구까지 화면에 들어온다',
    '안내 bottom=' + wheelAfter.hintBottom + ' ≤ 뷰포트 ' + wheelAfter.viewportH);

  /* ── 2. 모바일/태블릿 레이아웃 ───────────────────────────────────────── */
  console.log('\n[2] 모바일/태블릿 레이아웃');
  for (const w of [820, 768, 600, 430, 414, 390, 375, 360, 320]) {
    await load(w, 780, true);
    const v = await evalv(overflowProbe);
    report(!v.hOverflow && v.offenders.length === 0,
      String(w).padStart(4) + 'px — 가로 오버플로·잘림 없음',
      '목차=' + v.asidePosition + '(잘림 ' + v.asideClipped + ') 메뉴버튼=' + v.menuVisible + ' 섹션 ' + v.sections + '개' +
      (v.offenders.length ? ' | 화면 밖: ' + JSON.stringify(v.offenders) : ''));
    report(v.squeezed.length === 0,
      String(w).padStart(4) + 'px — 폭 0 으로 찌그러진 글상자 없음',
      v.squeezed.length ? '찌그러짐: ' + JSON.stringify(v.squeezed) : '정상');
  }

  /* 모바일에서 목차가 전부 보이는가 (한 단 레이아웃에서는 잘리면 안 됨) */
  const mobileAside = await evalv(`(() => {
    const html = document.documentElement;
    const prev = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';
    const aside = document.querySelector('.issue-aside');
    const hint = document.querySelector('.aside-hint');
    hint.scrollIntoView({ block: 'end' });
    const h = hint.getBoundingClientRect();
    const last = document.querySelector('#tocList li:last-child').getBoundingClientRect();
    html.style.scrollBehavior = prev;
    return { clipped: aside.scrollHeight > aside.clientHeight + 1, hintBottom: Math.round(h.bottom), lastBottom: Math.round(last.bottom), vh: innerHeight };
  })()`);
  report(!mobileAside.clipped && mobileAside.hintBottom <= mobileAside.vh + 1,
    '모바일 목차도 잘리지 않는다',
    '내부 잘림=' + mobileAside.clipped + ' · 끝 항목 bottom=' + mobileAside.lastBottom + ' · 안내 bottom=' + mobileAside.hintBottom + ' ≤ ' + mobileAside.vh);

  /* ── 3. 터치 스크롤 + 목차 링크 이동 ─────────────────────────────────── */
  console.log('\n[3] 터치 스크롤 · 목차 이동 (390px)');
  await load(390, 780, true);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: 680 }] });
  await sleep(60);
  for (const y of [596, 512, 428, 344, 260, 176]) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195, y }] });
    await sleep(45);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await sleep(1100);
  const touchY = await evalv('window.scrollY');
  report(touchY > 150, '터치 스와이프로 페이지 스크롤', 'scrollY=' + Math.round(touchY));

  /* 앞선 사이드바 검사가 전체 보기로 바꿔 뒀을 수 있으니 한 섹션씩으로 맞춥니다 */
  await evalv(`(() => {
    const view = document.querySelector('.step-view');
    if (view && view.getAttribute('aria-pressed') === 'true') view.click();
    return true;
  })()`);

  /* 한 섹션씩 보기(기본)에서는 목차를 누르면 스크롤 대신 그 섹션이 열립니다 */
  const jump = await evalv(`(() => {
    const links = document.querySelectorAll('#tocList a');
    const last = links[links.length - 1];
    const target = last.getAttribute('href');
    last.click();
    const secs = Array.from(document.querySelectorAll('.m-section'));
    return {
      target: target,
      links: links.length,
      open: secs.filter((s) => !s.hidden).map((s) => s.id),
      total: secs.length
    };
  })()`);
  await sleep(900);
  const jumpAfter = await evalv('window.scrollY');
  report(jump.links >= 10 && jump.open.length === 1 && jump.open[0] === jump.target.replace('#', ''),
    '목차 마지막 항목을 누르면 그 섹션만 열린다',
    jump.links + '개 링크 · ' + jump.target + ' → 열린 섹션 ' + jump.open.join(', ') + ' · scrollY=' + Math.round(jumpAfter));

  /* 전체 보기 ↔ 한 섹션씩 · ← → 키 */
  const views = await evalv(`(() => {
    const secs = Array.from(document.querySelectorAll('.m-section'));
    const view = document.querySelector('.step-view');
    view.click(); /* 전체 보기 */
    const allOpen = secs.filter((s) => !s.hidden).length;
    view.click(); /* 한 섹션씩 */
    const before = secs.findIndex((s) => !s.hidden);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    const after = secs.findIndex((s) => !s.hidden);
    return { allOpen: allOpen, total: secs.length, before: before, after: after };
  })()`);
  report(views.allOpen === views.total, '전체 보기에서 모든 섹션이 펼쳐진다',
    '펼침 ' + views.allOpen + ' / ' + views.total + '개');
  report(views.after === views.before - 1, '← → 키로 섹션이 넘어간다',
    views.before + ' → ' + views.after + ' (한 섹션씩)');

  /* 모바일 하단 탭바 양 끝의 이전/다음 */
  const tab = await evalv(`(() => {
    const bar = document.getElementById('tabBar');
    const prev = document.getElementById('tabStepPrev');
    const next = document.getElementById('tabStepNext');
    const secs = Array.from(document.querySelectorAll('.m-section'));
    const before = secs.findIndex((s) => !s.hidden);
    const shown = bar ? getComputedStyle(bar).display !== 'none' : false;
    const labelFit = Array.from(document.querySelectorAll('.tab-label'))
      .every((l) => l.scrollWidth <= l.clientWidth + 1);
    if (next && !next.disabled) next.click();
    const after = secs.findIndex((s) => !s.hidden);
    return { shown: shown, has: !!prev && !!next, before: before, after: after, labelFit: labelFit };
  })()`);
  report(tab.shown && tab.has && tab.after === tab.before + 1 && tab.labelFit,
    '모바일 탭바 이전/다음으로 섹션이 넘어간다',
    '탭바=' + tab.shown + ' · ' + tab.before + ' → ' + tab.after + ' · 라벨 잘림=' + !tab.labelFit);

  /* ── 4. 기능 ─────────────────────────────────────────────────────────── */
  console.log('\n[4] 기능');
  await load(1400, 900, false);
  const f = await evalv(`(() => {
    const out = {};
    out.weekChips = document.querySelectorAll('.week-chip').length;
    out.planItems = document.querySelectorAll('.plan-item').length;
    out.plannedItems = document.querySelectorAll('.plan-item.is-planned').length;
    out.dots = document.querySelectorAll('.daily-dot').length;
    out.dailyBefore = document.getElementById('dailyCount').textContent;
    out.issueBefore = document.getElementById('issueNumeral').textContent;

    // 완료 표시 → 오늘의 학습 / 스트릭
    document.querySelector('[data-done-for]').click();
    out.dailyCount = document.getElementById('dailyCount').textContent;
    out.streak = document.getElementById('streakCount').textContent;
    out.dailyFill = document.getElementById('dailyFill').style.width;

    // 주 전환 W01 → W04 (발행된 마지막 주)
    const chips = document.querySelectorAll('.week-chip');
    chips[3].click();
    out.issueAfter = document.getElementById('issueNumeral').textContent;
    out.sectionsAfter = document.querySelectorAll('.m-section').length;
    out.issueSaved = JSON.parse(localStorage.getItem('monsterlab.issue'));

    // 아직 발행 전인 주(W05) → 본문 대신 준비 중 안내
    chips[4].click();
    out.plannedNotice = !!document.querySelector('.m-planned-note');
    out.plannedSections = document.querySelectorAll('#issueContent .m-section').length;
    out.plannedToc = document.querySelectorAll('#tocList .is-planned').length;
    chips[0].click();

    // 번역 가리기
    const tr = document.querySelector('[data-tr-toggle]');
    tr.click();
    out.trAttr = document.documentElement.getAttribute('data-tr');
    out.trLabels = Array.prototype.map.call(document.querySelectorAll('[data-tr-toggle]'), (b) => b.textContent.trim());
    tr.click();
    out.trBack = document.documentElement.getAttribute('data-tr');

    // 단어 담기 → 복습 카드
    document.querySelector('[data-save-for]').click();
    out.wbCount = document.querySelector('[data-wb-count]').textContent;
    document.getElementById('wbReviewBtn').click();
    out.reviewCards = document.querySelectorAll('.review-card').length;

    // 인쇄 버튼
    out.hasPrint = !!document.getElementById('printBtn');

    // 백업 파일 생성 (다운로드는 가로채서 횟수만 확인)
    let downloads = 0;
    const realClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () { downloads++; };
    document.getElementById('wbBackupBtn').click();
    HTMLAnchorElement.prototype.click = realClick;
    out.downloads = downloads;

    return out;
  })()`);
  report(f.weekChips === 52 && f.planItems === 52, '주 선택기·52주 플랜에 모든 주가 나온다',
    '칩 ' + f.weekChips + '개 · 플랜 ' + f.planItems + '주');
  report(f.plannedItems === 48, '아직 발행되지 않은 주는 예정으로 표시', f.plannedItems + '주 예정');
  report(f.issueAfter === '04' && f.issueSaved === 'week-04', '주 전환 W01 → W04',
    'W' + f.issueAfter + ' (섹션 ' + f.sectionsAfter + '개, 저장=' + f.issueSaved + ')');
  report(f.plannedNotice === true && f.plannedSections === 1 && f.plannedToc === 1,
    '발행 전인 주는 준비 중 안내를 보여 준다',
    '안내=' + f.plannedNotice + ' · 본문 ' + f.plannedSections + '개 · 목차 ' + f.plannedToc + '줄');
  report(f.dots === 7, '오늘의 학습 — 7일 점 표시', 'dots=' + f.dots);
  report(f.dailyBefore === '0' && f.issueBefore === '01', '새 프로필에서 시작 상태가 깨끗함', '활동 0 · W' + f.issueBefore);
  report(f.dailyCount === '1' && f.streak === '1', '학습 활동·연속 학습일 기록', '활동=' + f.dailyCount + ' · 연속=' + f.streak + '일 · 막대=' + f.dailyFill);
  report(f.trAttr === 'off' && f.trBack === 'on' && f.trLabels.length === 2, '번역 가리기 토글 + 버튼 2곳 동기화', f.trLabels.join(' / '));
  report(f.wbCount === '1', '단어 담기 → 단어장 카운트', '단어장 ' + f.wbCount + '개');
  report(f.reviewCards >= 1, '복습 카드 생성', '카드 ' + f.reviewCards + '장');
  report(f.hasPrint === true && f.downloads >= 1, '인쇄 버튼 · 백업 JSON 생성', '다운로드 트리거 ' + f.downloads + '회');

  /* 완료 후 자동 이동 옵션 — 켜면 완료한 섹션에서 다음으로 넘어갑니다 */
  const auto = await evalv(`(() => {
    const secs = Array.from(document.querySelectorAll('.m-section'));
    const toggle = document.querySelector('[data-auto-toggle]');
    const toggles = document.querySelectorAll('[data-auto-toggle]');
    toggle.click(); /* 켜기 */
    const before = secs.findIndex((s) => !s.hidden);
    const doneBtn = secs[before].querySelector('[data-done-for]');
    doneBtn.click();
    if (secs.findIndex((s) => !s.hidden) === before) doneBtn.click(); /* 이미 완료였으면 다시 완료로 전환 */
    const after = secs.findIndex((s) => !s.hidden);
    return {
      on: toggle.getAttribute('aria-pressed'),
      synced: Array.from(toggles).every((b) => b.getAttribute('aria-pressed') === 'true'),
      saved: localStorage.getItem('monsterlab.autonext'),
      before: before, after: after
    };
  })()`);
  report(auto.on === 'true' && auto.synced && auto.after === auto.before + 1,
    '완료 후 자동 이동 옵션이 다음 섹션으로 넘긴다',
    '켜짐=' + auto.on + ' · 버튼 동기화=' + auto.synced + ' · ' + auto.before + ' → ' + auto.after + ' · 저장=' + auto.saved);

  /* ── 5. 인쇄 미디어 ──────────────────────────────────────────────────── */
  console.log('\n[5] 인쇄 미디어');
  await cdp.send('Emulation.setEmulatedMedia', { media: 'print' });
  await cdp.send('Page.navigate', { url });
  await sleep(1500);
  const print = await evalv(`(() => {
    const trl = document.querySelector('.m-trl');
    const secs = Array.from(document.querySelectorAll('.m-section'));
    const quarters = Array.from(document.querySelectorAll('.plan-quarter'));
    return {
      header: getComputedStyle(document.getElementById('siteHeader')).display,
      tools: getComputedStyle(document.querySelector('.m-tools')).display,
      trl: trl ? getComputedStyle(trl).display : null,
      sections: secs.length,
      shown: secs.filter((s) => getComputedStyle(s).display !== 'none').length,
      quarters: quarters.length,
      quartersShown: quarters.filter((q) => getComputedStyle(q).display !== 'none').length,
    };
  })()`);
  report(print.header === 'none' && print.tools === 'none', '인쇄 시 헤더·조작 버튼 숨김', 'header=' + print.header + ' tools=' + print.tools);
  report(print.trl !== 'none', '인쇄물에는 한국어 해설 유지', 'trl=' + print.trl + ' · 섹션 ' + print.sections + '개');
  report(print.shown === print.sections, '인쇄에는 한 섹션씩 보기의 접힌 섹션까지 전부 나온다',
    '출력 ' + print.shown + ' / ' + print.sections + '개');
  report(print.quartersShown === print.quarters, '인쇄에는 한 분기씩 보기의 접힌 분기까지 전부 나온다',
    '출력 ' + print.quartersShown + ' / ' + print.quarters + '개');
  await cdp.send('Emulation.setEmulatedMedia', { media: '' });

  /* ── 6. 콘솔 ─────────────────────────────────────────────────────────── */
  const errors = cdp.events.filter((e) => e.method === 'Log.entryAdded' && e.params.entry.level === 'error');
  /* file:// 에서는 폰트·매니페스트가 "origin null" CORS 로 막혀 콘솔에 남습니다.
     웹 출처가 아니라 file:// 자체의 제약이고 화면은 대체 글꼴로 정상 동작하므로,
     기본 모드에서는 그 두 가지(file:// 자원 + net::ERR_FAILED)만 걸러냅니다.
     http(s)(--site-root·--live)에서는 하나도 걸러내지 않습니다. */
  const fileMode = url.indexOf('file:') === 0;
  const relevant = errors.filter((e) => {
    const t = e.params.entry.text || '';
    /* file:// 자원 제약(폰트·매니페스트)은 무해합니다. */
    if (fileMode && (t.indexOf("origin 'null'") > -1 || t.indexOf('net::ERR_FAILED') > -1)) return false;
    /* 자체 수집 서버가 잠시 안 닿는 것은 사이트 문제가 아닙니다(태그 자체는 7번 항목에서 검사). */
    if (t.indexOf('visitor-analytics-a5bp.onrender.com') > -1) return false;
    return true;
  });
  report(relevant.length === 0, '콘솔 에러 없음',
    relevant.length ? relevant.map((e) => e.params.entry.text).join(' | ')
      : (fileMode && errors.length ? 'file:// 자원 제약 ' + errors.length + '건 제외' : ''));

  /* ── 8. PWA (서비스워커 · 매니페스트) ────────────────────────────────── */
  if (/^https?:/.test(url)) {
    console.log('\n[8] PWA — 서비스워커 · 매니페스트');
    await load(1280, 900, false);
    await sleep(1400); /* window load 이후 등록되므로 조금 기다립니다 */
    const pwa = await evalAwait(`(async () => {
      const out = { hasManifest: !!document.querySelector('link[rel="manifest"]'), regs: 0, supported: 'serviceWorker' in navigator };
      if (out.supported) { try { out.regs = (await navigator.serviceWorker.getRegistrations()).length; } catch (e) {} }
      try {
        const res = await fetch('manifest.webmanifest');
        out.status = res.status;
        const m = await res.json();
        out.name = m.name || '';
        out.icons = (m.icons || []).length;
      } catch (e) { out.status = 0; }
      return out;
    })()`);
    report(pwa.hasManifest && pwa.status === 200 && pwa.icons >= 3,
      '매니페스트가 연결되고 아이콘이 3개 이상',
      'status=' + pwa.status + ' · 이름="' + pwa.name + '" · 아이콘 ' + pwa.icons + '개');
    report(pwa.supported && pwa.regs >= 1,
      '서비스워커가 등록된다(오프라인 지원)', '등록 ' + pwa.regs + '개 · 지원=' + pwa.supported);
  } else {
    console.log('\n[8] PWA — file:// 이라 건너뜀 (--site-root 또는 --live 로 확인)');
  }

  /* ── 7. 스크린샷 ─────────────────────────────────────────────────────── */
  if (WANT_SHOTS) {
    console.log('\n[6] 스크린샷');
    fs.mkdirSync(OUT, { recursive: true });
    for (const shot of [
      { w: 1400, h: 900, y: 0, m: false, name: 'b-cover' },
      { w: 1400, h: 900, sel: '#issueContent', m: false, name: 'b-stepbar' },
      { w: 1400, h: 700, sel: '#sections', m: false, name: 'b-toc' },
      { w: 1400, h: 900, sel: '#review', m: false, name: 'b-review' },
      { w: 1400, h: 900, y: 'bottom', m: false, name: 'b-footer' },
      { w: 390, h: 780, y: 0, m: true, name: 'b-mobile-top' },
      { w: 390, h: 780, sel: '#issueContent', m: true, name: 'b-mobile-step' },
      { w: 390, h: 780, sel: '#wordbook', m: true, name: 'b-mobile-reading' },
    ]) {
      await load(shot.w, shot.h, shot.m);
      /* 부드러운 스크롤을 끄지 않으면 애니메이션 도중에 찍힙니다.
         한 섹션씩 보기라 화면은 고정 좌표가 아니라 요소 기준으로 잡습니다. */
      await evalv('document.documentElement.style.scrollBehavior = "auto"; ' +
        (shot.sel
          ? '(() => { const el = document.querySelector("' + shot.sel + '"); if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 150); })()'
          : 'window.scrollTo(0,' + (shot.y === 'bottom' ? 'document.documentElement.scrollHeight' : shot.y) + ')'));
      await sleep(900);
      const png = await cdp.send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(OUT, shot.name + '.png'), Buffer.from(png.data, 'base64'));
    }
    console.log('  .shots/b-*.png 저장');
  }

  /* ── 7. 방문 분석 (자체 호스팅) ─────────────────────────────────────── */
  console.log('\n[7] 방문 분석 (자체 호스팅) — 네트워크 확인');

  /* 실제 수집 서버로 보내지 않도록 모든 요청을 가로챕니다.
     수집 스크립트 요청은 붙잡아 확인만 하고 실패시킵니다. */
  const ANALYTICS_HOST = 'visitor-analytics-a5bp.onrender.com';
  const ANALYTICS_SRC = 'https://' + ANALYTICS_HOST + '/analytics.js';
  const requested = [];
  /* file:// 모드에서는 분석 스크립트가 삽니다(http 로 열어야 함) — 프로젝트 루트를 잠깐 서빙합니다.
     --site-root / --live 에서는 이미 http(s) 이므로 **검사 대상 그대로** 셉니다.
     (예전에는 --site-root 에서도 루트 사본을 열어 배포본이 아닌 원본을 검사했습니다) */
  const static_ = (LIVE || SITE_ROOT) ? null : await serveStatic(__dirname);
  const indexUrl = static_ ? 'http://127.0.0.1:' + static_.port + '/index.html' : url;
  cdp.onEvent = (msg) => {
    if (msg.method !== 'Fetch.requestPaused') return;
    const params = msg.params;
    requested.push(params.request.url);
    const fail = params.request.url.indexOf(ANALYTICS_HOST) > -1;
    cdp.send(fail ? 'Fetch.failRequest' : 'Fetch.continueRequest', fail
      ? { requestId: params.requestId, errorReason: 'Failed' }
      : { requestId: params.requestId }).catch(() => {});
  };
  await cdp.send('Fetch.enable', { patterns: [{ urlPattern: '*' }] });

  /* (a) 페이지를 열면 수집 스크립트를 한 번만 부르는가

     두 가지가 요청 수를 어지럽히므로 정리하고 셉니다.
     · 이전 페이지가 떠나며 보내는 체류시간 집계(/api/collect) — 빈 페이지로 먼저
       떠나 보내게 한 뒤 세기를 시작합니다. (라이브에서 "요청 2회" 로 오검사하던 원인)
     · 브라우저 캐시에 남은 스크립트 — 캐시에서 나오면 가로채지지 않아 실행되어
       집계가 추가로 전송됩니다. 캐시를 끄고 검사합니다.

     수집 스크립트가 살아 있으면 /api/collect 로 집계도 같은 수집 서버로 보내므로,
     "한 번 부른다"의 기준은 스크립트 요청(analytics.js)입니다.
     그 밖에는 스크립트의 집계 전송(/api/collect)만 허용합니다. */
  await cdp.send('Page.navigate', { url: 'about:blank' });
  await sleep(500);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  requested.length = 0;
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await cdp.send('Page.navigate', { url: indexUrl });
  await sleep(1800);
  const trackerReqs = requested.filter((u) => u.indexOf(ANALYTICS_HOST) > -1);
  const scriptReqs = trackerReqs.filter((u) => /\/analytics\.js([?#]|$)/.test(u));
  const beaconReqs = trackerReqs.filter((u) => /\/api\/collect([?#]|$)/.test(u));
  const strayReqs = trackerReqs.filter((u) => scriptReqs.indexOf(u) === -1 && beaconReqs.indexOf(u) === -1);
  report(scriptReqs.length === 1 && strayReqs.length === 0, '수집 스크립트를 한 번만 부른다',
    '스크립트 ' + scriptReqs.length + '회 · 집계 ' + beaconReqs.length + '회' +
    (strayReqs.length ? ' · 예상 밖: ' + strayReqs.join(', ') : '') +
    (scriptReqs.length !== 1 ? ' · 전체: ' + trackerReqs.join(', ') : ''));

  /* (b) 태그의 주소·도메인이 맞고, 다른 도구 흔적이 없는가 */
  const trackerTag = await evalv(`(() => {
    const tags = Array.prototype.slice.call(document.querySelectorAll('script[data-domain]'));
    return {
      count: tags.length,
      src: tags[0] ? tags[0].src : null,
      domain: tags[0] ? tags[0].getAttribute('data-domain') : null,
      traces: typeof window.gtag + '/' + typeof window.umami + '/' + typeof window.dataLayer + '/' + typeof window.clarity,
    };
  })()`);

  report(trackerTag.count === 1 && trackerTag.src === ANALYTICS_SRC, '태그가 수집 서버를 한 번만 가리킨다',
    '태그 ' + trackerTag.count + '개 · ' + (trackerTag.src || '(없음)'));
  report(trackerTag.domain === 'engmon.monster', '추적 도메인이 이 사이트로 지정된다',
    'data-domain=' + trackerTag.domain);
  report(trackerTag.traces === 'undefined/undefined/undefined/undefined', 'GA4/Umami/Clarity 흔적이 없다',
    'gtag/umami/dataLayer/clarity=' + trackerTag.traces);
  report(requested.filter((u) => /counter\.dev|clarity\.ms|google-analytics/.test(u)).length === 0,
    '이전 도구(Counter.dev 등)로 나가는 요청이 없다', '이전 도구 요청 0건');

  await cdp.send('Fetch.disable');
  cdp.onEvent = null;
  if (static_) static_.server.close();

  console.log('\n  결과: ' + pass + ' 통과 / ' + fail + ' 실패\n');
  if (siteServer) siteServer.close();
  killChrome();
  await sleep(400);
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) {}
  process.exit(fail ? 1 : 0);
})().catch(async (err) => {
  console.error('\n브라우저 검증 실패:', err.message, '\n');
  if (siteServer) siteServer.close();
  killChrome();
  await sleep(400);
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) {}
  process.exit(1);
});
