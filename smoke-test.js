/* ==========================================================================
   스모크 테스트 — 브라우저 없이 페이지 스크립트를 실제로 실행해 검증합니다.
   ==========================================================================

   실행:  node smoke-test.js

   왜 필요한가:
     이 저장소는 GitHub Pages로 바로 배포되는데, 개발 환경에서 브라우저를 띄울 수
     없습니다. 그래서 script.js의 초기화가 예외로 죽어도(예: 아직 선언되지 않은
     변수를 먼저 읽는 경우) 알아채지 못하고 배포되는 사고가 있었습니다. 그때
     화면에는 "테마 아이콘이 안 보이고 언어 전환도 안 되는" 증상이 나타났습니다.

   이 테스트가 확인하는 것:
     1. head의 인라인 스크립트 → script.js → magazine.js 순서로 오류 없이 실행되는가
     2. 언어 전환이 실제로 문구·탭 제목을 바꾸는가 (ko/en 사전에 빈틈은 없는가)
     3. 테마 버튼/강조색 스와치가 선택 상태를 정확히 반영하는가
     4. 문의 폼 검증과 메일 생성이 동작하는가
     5. 매거진이 데이터만큼 섹션을 그리고 언어 전환에 반응하는가
     6. 한 기능이 실패해도 나머지(특히 언어 전환)는 살아남는가  ← 핵심 회귀 테스트
     7. HTML에 중복 id가 없고, 에셋 URL에 캐시 무효화 버전이 붙어 있는가
   ========================================================================== */
'use strict';

const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = __dirname;
const results = [];
let failures = 0;

function check(name, fn) {
  try {
    const detail = fn();
    results.push(['PASS', name, detail || '']);
  } catch (err) {
    failures++;
    results.push(['FAIL', name, err && err.message]);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

/* 만들어진 DOM 트리에서 클래스 이름으로 요소를 찾습니다.
   (매거진은 DOM을 직접 만들어 붙이므로 querySelector로는 잡히지 않습니다) */
function collect(root, className, out) {
  if (!root) return out || [];
  const found = out || [];
  const classes = root.className ? String(root.className).split(/\s+/) : [];
  if (classes.indexOf(className) > -1) found.push(root);
  (root.children || []).forEach((child) => collect(child, className, found));
  return found;
}

/* 속성으로 요소를 찾습니다 (완료 표시 버튼처럼 클래스가 없는 경우) */
function collectAttr(root, attr, out) {
  if (!root) return out || [];
  const found = out || [];
  if (root.getAttribute && root.getAttribute(attr) != null) found.push(root);
  (root.children || []).forEach((child) => collectAttr(child, attr, found));
  return found;
}

const pad2 = (n) => (String(n).length < 2 ? '0' + n : String(n));

/* ── 최소 DOM 구현 ──────────────────────────────────────────────────────── */
function makeClassList() {
  const set = new Set();
  return {
    add(...names) { names.forEach((n) => set.add(n)); },
    remove(...names) { names.forEach((n) => set.delete(n)); },
    contains: (name) => set.has(name),
    toggle(name, force) {
      const on = force === undefined ? !set.has(name) : !!force;
      if (on) set.add(name); else set.delete(name);
      return on;
    },
  };
}

function makeElement(tag) {
  const el = {
    tagName: String(tag || 'div').toUpperCase(),
    children: [],
    parentNode: null,
    attributes: {},
    style: {},
    hidden: false,
    value: '',
    _handlers: {},
  };

  /* 실제 DOM과 같게: textContent/innerHTML에 값을 넣으면 자식 노드가 사라집니다.
     magazine.js는 컨테이너를 비울 때 node.textContent = '' 를 쓰기 때문에,
     이 동작이 없으면 재렌더링 때 섹션이 중복으로 쌓인 것처럼 보입니다. */
  let text = '';
  let markup = '';
  Object.defineProperty(el, 'textContent', {
    get: () => text,
    set: (value) => { text = String(value); el.children.length = 0; },
  });
  Object.defineProperty(el, 'innerHTML', {
    get: () => markup,
    set: (value) => { markup = String(value); el.children.length = 0; },
  });

  el.classList = makeClassList();
  el.setAttribute = (name, value) => {
    el.attributes[name] = String(value);
    if (name === 'id') el.id = String(value);
  };
  el.getAttribute = (name) => (el.attributes[name] === undefined ? null : el.attributes[name]);
  el.removeAttribute = (name) => { delete el.attributes[name]; };
  el.hasAttribute = (name) => el.attributes[name] !== undefined;
  el.appendChild = (child) => { el.children.push(child); child.parentNode = el; return child; };
  el.insertBefore = (child, ref) => {
    const i = el.children.indexOf(ref);
    if (i < 0) el.children.push(child); else el.children.splice(i, 0, child);
    child.parentNode = el;
    return child;
  };
  el.removeChild = (child) => {
    const i = el.children.indexOf(child);
    if (i > -1) el.children.splice(i, 1);
    return child;
  };
  el.addEventListener = (type, fn) => { (el._handlers[type] = el._handlers[type] || []).push(fn); };
  el.removeEventListener = () => {};
  el.dispatch = (type, event) => {
    (el._handlers[type] || []).forEach((fn) => fn(event || { target: el }));
  };
  el.querySelector = () => null;
  el.querySelectorAll = () => [];
  el.click = () => el.dispatch('click');
  el.focus = () => {};
  el.select = () => {};
  el.getBoundingClientRect = () => ({ top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 });

  Object.defineProperty(el, 'firstChild', { get: () => el.children[0] || null });
  Object.defineProperty(el, 'offsetHeight', { get: () => 1200 });
  Object.defineProperty(el, 'offsetTop', { get: () => 0 });

  return el;
}

function makeMeta(name, content) {
  const el = makeElement('meta');
  el.setAttribute('name', name);
  el.setAttribute('content', content);
  return el;
}

function makeDom(html, options) {
  const opts = options || {};
  const byId = new Map();
  const bySelector = {};

  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const duplicateIds = ids.filter((id, i) => ids.indexOf(id) !== i);

  ids.forEach((id) => {
    if (opts.missingIds && opts.missingIds.indexOf(id) !== -1) return;
    const el = makeElement(/^cf/.test(id) && !/Err$/.test(id) ? 'input' : 'div');
    el.setAttribute('id', id);
    byId.set(id, el);
  });

  ['data-i18n', 'data-i18n-html', 'data-i18n-placeholder', 'data-i18n-aria-label']
    .forEach((attr) => {
      bySelector['[' + attr + ']'] = [...html.matchAll(new RegExp(attr + '="([^"]+)"', 'g'))]
        .map((m) => {
          const el = makeElement('span');
          el.setAttribute(attr, m[1]);
          return el;
        });
    });

  bySelector['[data-theme-option]'] = [...html.matchAll(/data-theme-option="([^"]+)"/g)]
    .map((m) => {
      const el = makeElement('button');
      el.setAttribute('data-theme-option', m[1]);
      return el;
    });

  bySelector['.swatch'] = [...html.matchAll(/class="swatch"[^>]*data-accent="([^"]+)"/g)]
    .map((m) => {
      const el = makeElement('button');
      el.setAttribute('data-accent', m[1]);
      return el;
    });

  bySelector['[data-rate]'] = [...html.matchAll(/data-rate="([^"]+)"/g)].map((m) => {
    const el = makeElement('button');
    el.setAttribute('data-rate', m[1]);
    return el;
  });

  bySelector['.intent-tab'] = [...html.matchAll(/data-intent="([^"]+)"/g)].map((m) => {
    const el = makeElement('button');
    el.setAttribute('data-intent', m[1]);
    return el;
  });

  bySelector['[data-tr-toggle]'] = [...html.matchAll(/data-tr-toggle/g)].map(() => {
    const el = makeElement('button');
    el.setAttribute('data-tr-toggle', '1');
    return el;
  });

  bySelector['meta[name="theme-color"]'] = [makeMeta('theme-color', '#0a0e13')];
  bySelector['meta[name="description"]'] = [makeMeta('description', '')];

  /* <html> 태그의 속성( lang, data-title-key ... )도 그대로 옮깁니다 */
  const documentElement = makeElement('html');
  const htmlTag = html.match(/<html([^>]*)>/);
  if (htmlTag) {
    [...htmlTag[1].matchAll(/([a-z][\w-]*)="([^"]*)"/gi)].forEach((m) => {
      documentElement.setAttribute(m[1], m[2]);
    });
  }

  const body = makeElement('body');
  const documentListeners = {};

  const document = {
    documentElement,
    body,
    title: '',
    readyState: 'complete',
    getElementById: (id) => byId.get(id) || null,
    querySelector: (sel) => {
      if (opts.throwOnSelector && sel === opts.throwOnSelector) {
        throw new Error('테스트용 강제 실패: ' + sel);
      }
      return (bySelector[sel] && bySelector[sel][0]) || null;
    },
    querySelectorAll: (sel) => {
      if (opts.throwOnSelector && sel === opts.throwOnSelector) {
        throw new Error('테스트용 강제 실패: ' + sel);
      }
      return bySelector[sel] || [];
    },
    createElement: (tag) => makeElement(tag),
    createTextNode: (text) => {
      const node = makeElement('span');
      node.textContent = String(text);
      return node;
    },
    addEventListener: (type, fn) => {
      (documentListeners[type] = documentListeners[type] || []).push(fn);
    },
    removeEventListener: () => {},
    dispatchEvent: (event) => {
      (documentListeners[event.type] || []).forEach((fn) => fn(event));
      return true;
    },
    execCommand: () => true,
  };

  return { document, byId, bySelector, documentElement, duplicateIds };
}

function makeSandbox(dom, opts) {
  const store = new Map(Object.entries((opts && opts.storage) || {}));
  const windowListeners = {};

  const sandbox = {
    console: opts.silentConsole
      ? { log: () => {}, error: () => {}, warn: () => {} }
      : console,
    setTimeout,
    clearTimeout,
    Math,
    Date,
    JSON,
    document: dom.document,
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
    },
    navigator: {},
    location: { href: '' },
    CustomEvent: class {
      constructor(type, options) { this.type = type; this.detail = options && options.detail; }
    },
    IntersectionObserver: class {
      constructor(cb) { this.cb = cb; }
      observe(el) { this.cb([{ isIntersecting: true, target: el }]); }
      unobserve() {}
      disconnect() {}
    },
    SpeechSynthesisUtterance: class {
      constructor(text) { this.text = text; }
    },
    /* 파일 선택 대신 고정된 문자열을 돌려주는 최소 구현 */
    FileReader: class {
      readAsText(file) {
        this.result = (file && file.__text) || '';
        if (this.onload) this.onload();
      }
    },
    getComputedStyle: () => ({ getPropertyValue: () => '' }),
    _store: store,
  };

  sandbox.window = sandbox;
  sandbox.self = sandbox;
  sandbox.globalThis = sandbox;

  sandbox.matchMedia = () => ({
    matches: false,
    addEventListener() {},
    addListener() {},
    removeListener() {},
  });
  sandbox.scrollTo = () => {};
  sandbox.open = () => null;
  sandbox.confirm = () => true;
  sandbox.scrollY = 0;
  sandbox.pageYOffset = 0;
  sandbox.innerHeight = 800;
  sandbox.innerWidth = 1280;
  sandbox.addEventListener = (type, fn) => {
    (windowListeners[type] = windowListeners[type] || []).push(fn);
  };
  sandbox.removeEventListener = () => {};
  sandbox.speechSynthesis = { cancel() {}, speak() {} };

  return sandbox;
}

/* 브라우저와 같은 순서로 실행: head 인라인 → issues.js → script.js → magazine.js */
function runPage(file, options) {
  const opts = options || {};
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const dom = makeDom(html, opts);
  const sandbox = makeSandbox(dom, opts);
  const context = vm.createContext(sandbox);

  const inline = html.match(/<script>([\s\S]*?)<\/script>/);
  if (inline) {
    vm.runInContext(inline[1], context, { filename: file + ' (인라인)' });
  }

  ['issues.js', 'script.js', 'magazine.js'].forEach((name) => {
    if (!fs.existsSync(path.join(ROOT, name))) return;
    vm.runInContext(fs.readFileSync(path.join(ROOT, name), 'utf8'), context, { filename: name });
  });

  return { sandbox, dom, html };
}

const PAGES = ['index.html'];
const loaded = {};

/* ── 1. 두 페이지가 오류 없이 초기화되는가 ─────────────────────────────── */
PAGES.forEach((file) => {
  check(file + ' — 스크립트가 오류 없이 초기화된다', () => {
    loaded[file] = runPage(file);
  });
});

/* ── 2. index.html 기능 ────────────────────────────────────────────────── */
const index = loaded['index.html'];

if (index) {
  const { sandbox, dom } = index;

  check('window.MonsterLab API가 노출된다', () => {
    assert(sandbox.MonsterLab && typeof sandbox.MonsterLab.t === 'function',
      'window.MonsterLab.t 가 없습니다 (magazine.js가 키 이름을 그대로 출력합니다)');
    const label = sandbox.MonsterLab.t('mag.listen', 'ko');
    assert(label !== 'mag.listen', 't()가 키를 그대로 반환했습니다');
    return 't("mag.listen") = "' + label + '"';
  });

  check('인라인 스크립트가 첫 페인트 전에 테마/강조색을 심는다', () => {
    assert(dom.documentElement.getAttribute('data-theme-mode') === 'system',
      'data-theme-mode = ' + dom.documentElement.getAttribute('data-theme-mode'));
    assert(['dark', 'light'].indexOf(dom.documentElement.getAttribute('data-theme')) !== -1,
      'data-theme = ' + dom.documentElement.getAttribute('data-theme'));
    assert(dom.documentElement.getAttribute('data-accent') === 'mint',
      'data-accent = ' + dom.documentElement.getAttribute('data-accent'));
    return 'mode=system / theme=dark / accent=mint';
  });

  check('테마 버튼이 헤더와 모바일 메뉴 양쪽에 모두 있다', () => {
    const btns = dom.bySelector['[data-theme-option]'];
    assert(btns.length === 6, '테마 버튼이 ' + btns.length + '개입니다 (헤더 3 + 메뉴 3 = 6)');
    ['light', 'dark', 'system'].forEach((mode) => {
      const same = btns.filter((b) => b.getAttribute('data-theme-option') === mode);
      assert(same.length === 2, mode + ' 버튼이 ' + same.length + '개입니다');
    });
    return '2세트 × 3개';
  });

  check('테마 버튼 선택 상태가 두 세트에서 일치한다', () => {
    const btns = dom.bySelector['[data-theme-option]'];
    const pressed = btns.filter((b) => b.getAttribute('aria-pressed') === 'true');

    /* 세트(3개)마다 정확히 하나만 눌려 있어야 합니다 */
    assert(pressed.length === 2, '선택 상태 ' + pressed.length + '개 (세트마다 1개여야 함)');
    assert(pressed.every((b) => b.getAttribute('data-theme-option') === 'system'),
      '시스템 모드인데 ' + pressed.map((b) => b.getAttribute('data-theme-option')).join(',') + '가 선택됨');
    return '두 세트 모두 system 선택';
  });

  check('테마 버튼 클릭이 테마·저장값·선택 표시를 함께 바꾼다', () => {
    const btns = dom.bySelector['[data-theme-option]'];
    const lightBtn = btns.filter((b) => b.getAttribute('data-theme-option') === 'light')[0];

    lightBtn.dispatch('click');

    assert(dom.documentElement.getAttribute('data-theme') === 'light',
      'data-theme = ' + dom.documentElement.getAttribute('data-theme'));
    assert(sandbox.localStorage.getItem('monsterlab.theme') === 'light', '저장되지 않았습니다');

    const pressed = btns.filter((b) => b.getAttribute('aria-pressed') === 'true');
    assert(pressed.length === 2, '선택 상태 ' + pressed.length + '개');
    assert(pressed.every((b) => b.getAttribute('data-theme-option') === 'light'),
      '두 세트가 동기화되지 않았습니다');

    const label = btns[0].getAttribute('aria-label');
    assert(label && label !== 'undefined', 'aria-label = ' + label);
    return 'system → light, 두 세트 동기화 + 저장';
  });

  check('강조색 스와치가 선택 상태를 반영한다', () => {
    const swatches = dom.bySelector['.swatch'];
    assert(swatches.length === 4, '스와치 ' + swatches.length + '개');

    const mint = swatches.filter((s) => s.getAttribute('data-accent') === 'mint')[0];
    const ocean = swatches.filter((s) => s.getAttribute('data-accent') === 'ocean')[0];
    assert(mint.getAttribute('aria-pressed') === 'true', '기본값이 mint로 표시되지 않았습니다');

    ocean.dispatch('click');
    assert(dom.documentElement.getAttribute('data-accent') === 'ocean', 'data-accent가 바뀌지 않았습니다');
    assert(sandbox.localStorage.getItem('monsterlab.accent') === 'ocean', '저장되지 않았습니다');
    assert(ocean.getAttribute('aria-pressed') === 'true', '선택 표시가 갱신되지 않았습니다');
    return 'mint → ocean 전환·저장·표시 확인';
  });

  check('언어 버튼 클릭이 화면 문구를 영어로 바꾼다', () => {
    const items = dom.bySelector['[data-i18n]'];
    const before = items.map((el) => el.textContent);

    dom.byId.get('langBtn').dispatch('click');

    const changed = items.filter((el, i) => el.textContent !== before[i]).length;
    assert(dom.documentElement.getAttribute('lang') === 'en',
      'lang 속성 = ' + dom.documentElement.getAttribute('lang'));
    assert(changed > 20, '문구가 ' + changed + '개만 바뀌었습니다 (거의 그대로면 사전 누락입니다)');
    assert(sandbox.localStorage.getItem('monsterlab.lang') === 'en', '언어가 저장되지 않았습니다');
    assert(dom.byId.get('langLabel').textContent === 'KO', '버튼 라벨이 갱신되지 않았습니다');
    return changed + '개 문구 변경 + 저장 + 라벨 갱신';
  });

  check('언어 전환이 탭 제목과 설명도 바꾼다', () => {
    const title = dom.document.title;
    const desc = dom.bySelector['meta[name="description"]'][0].getAttribute('content');
    const expected = sandbox.MonsterLab.t('mag.pageTitle', 'en');
    assert(title === expected, 'title = "' + title + '" (기대: "' + expected + '")');
    assert(desc && desc.length > 10, 'description이 비어 있습니다');
    return 'title = "' + title + '"';
  });

  check('테마 버튼 설명도 새 언어로 갱신된다', () => {
    const btn = dom.bySelector['[data-theme-option]']
      .filter((b) => b.getAttribute('data-theme-option') === 'dark')[0];
    const expected = sandbox.MonsterLab.t('theme.setDark', 'en');
    assert(btn.getAttribute('aria-label') === expected,
      'aria-label = "' + btn.getAttribute('aria-label') + '" (기대: "' + expected + '")');
    return 'theme.setDark = "' + expected + '"';
  });

  check('Alt+L 단축키로도 언어가 전환된다', () => {
    dom.document.dispatchEvent({ type: 'keydown', altKey: true, key: 'l' });
    assert(dom.documentElement.getAttribute('lang') === 'ko',
      'Alt+L 후 lang = ' + dom.documentElement.getAttribute('lang'));
    dom.document.dispatchEvent({ type: 'keydown', altKey: true, key: 'l' });
    assert(dom.documentElement.getAttribute('lang') === 'en', '다시 영어로 돌아오지 않았습니다');
    return 'en ↔ ko 왕복';
  });

  check('저장된 설정이 있으면 그대로 복원된다', () => {
    const page = runPage('index.html', {
      storage: { 'monsterlab.theme': 'light', 'monsterlab.accent': 'ocean', 'monsterlab.lang': 'en' },
    });

    assert(page.dom.documentElement.getAttribute('data-theme') === 'light', '테마가 복원되지 않았습니다');
    assert(page.dom.documentElement.getAttribute('data-accent') === 'ocean', '강조색이 복원되지 않았습니다');
    assert(page.dom.documentElement.getAttribute('lang') === 'en', '언어가 복원되지 않았습니다');

    const pressed = page.dom.bySelector['[data-theme-option]']
      .filter((b) => b.getAttribute('aria-pressed') === 'true');
    assert(pressed.length === 2 && pressed.every((b) => b.getAttribute('data-theme-option') === 'light'),
      '복원된 테마가 버튼에 반영되지 않았습니다');
    return '테마 light · 강조 ocean · 언어 en 복원';
  });
}

/* ── 3. 오류 격리 (회귀 테스트) ────────────────────────────────────────── */
check('테마 초기화가 실패해도 언어 전환은 살아남는다', () => {
  const page = runPage('index.html', { throwOnSelector: '[data-theme-option]', silentConsole: true });

  assert(page.sandbox.MonsterLab, 'window.MonsterLab이 노출되지 않았습니다');

  const items = page.dom.bySelector['[data-i18n]'];
  const before = items.map((el) => el.textContent);
  const langBtn = page.dom.byId.get('langBtn');
  assert(langBtn, '#langBtn이 없습니다');

  langBtn.dispatch('click');

  const changed = items.filter((el, i) => el.textContent !== before[i]).length;
  assert(page.dom.documentElement.getAttribute('lang') === 'en',
    '테마가 죽자 언어 전환도 죽었습니다 (회귀!)');
  assert(changed > 20, '문구가 ' + changed + '개만 바뀌었습니다');
  return '테마 강제 실패 → 언어 전환 정상 (' + changed + '개 변경)';
});

check('요소 하나가 없어도 나머지 기능이 동작한다', () => {
  const page = runPage('index.html', { missingIds: ['siteHeader', 'toTop', 'footerTheme'], silentConsole: true });
  page.dom.byId.get('langBtn').dispatch('click');
  assert(page.dom.documentElement.getAttribute('lang') === 'en', '언어 전환이 죽었습니다');
  return '#siteHeader·#toTop·#footerTheme 제거 후에도 정상';
});  check('필수 요소(#langBtn·#langLabel·#toast)가 HTML에 있다', () => {
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    ['langBtn', 'langLabel', 'toast', 'siteHeader', 'nav', 'menuBtn',
      'issueContent', 'tocList', 'wbList', 'printBtn', 'dailyPanel', 'dailyDots',
      'wbBackupBtn', 'wbRestoreBtn', 'wbRestoreFile'].forEach((id) => {
    assert(html.indexOf('id="' + id + '"') !== -1, '# ' + id + ' 가 index.html에 없습니다');
  });
  return 'index.html 필수 요소 확인';
});

/* ── 4. i18n 사전 완전성 ───────────────────────────────────────────────── */
if (index) {
  check('HTML이 쓰는 모든 i18n 키가 ko·en 양쪽에 있다', () => {
    const missing = [];
    PAGES.forEach((file) => {
      const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
      ['data-i18n', 'data-i18n-html', 'data-i18n-placeholder', 'data-i18n-aria-label']
        .forEach((attr) => {
          const re = new RegExp(attr + '="([^"]+)"', 'g');
          [...html.matchAll(re)].forEach((m) => {
            ['ko', 'en'].forEach((lang) => {
              if (index.sandbox.MonsterLab.t(m[1], lang) === m[1]) {
                missing.push(file + ' ' + attr + '="' + m[1] + '" (' + lang + ')');
              }
            });
          });
        });
    });
    assert(missing.length === 0, '누락: ' + missing.slice(0, 5).join(' / '));
    return 'index.html 모든 속성 × ko·en 통과';
  });

  check('magazine.js가 참조하는 키가 ko·en 양쪽에 있다', () => {
    const src = fs.readFileSync(path.join(ROOT, 'magazine.js'), 'utf8');
    const keys = new Set([...src.matchAll(/\bt\('([^']+)'\)/g)].map((m) => m[1]));
    const missing = [];
    keys.forEach((key) => {
      ['ko', 'en'].forEach((lang) => {
        if (index.sandbox.MonsterLab.t(key, lang) === key) missing.push(key + ' (' + lang + ')');
      });
    });
    assert(missing.length === 0, '누락: ' + missing.join(', '));
    return keys.size + '개 키 확인';
  });

  check('사전에 한쪽 언어에만 있는 키가 없다', () => {
    const dump = (file) => {
      const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
      const start = src.indexOf('var I18N');
      const body = src.slice(start, src.indexOf('var STORAGE_KEY', start));
      const cut = body.indexOf('en: {');
      return {
        ko: [...body.slice(0, cut).matchAll(/'([^']+)':/g)].map((m) => m[1]),
        en: [...body.slice(cut).matchAll(/'([^']+)':/g)].map((m) => m[1]),
      };
    };
    const dict = dump('script.js');
    const onlyKo = dict.ko.filter((k) => dict.en.indexOf(k) === -1);
    const onlyEn = dict.en.filter((k) => dict.ko.indexOf(k) === -1);
    assert(onlyKo.length === 0, 'ko에만 있음: ' + onlyKo.join(', '));
    assert(onlyEn.length === 0, 'en에만 있음: ' + onlyEn.join(', '));
    return 'ko ' + dict.ko.length + '개 = en ' + dict.en.length + '개';
  });
}

check('사용하지 않는 i18n 키가 없다', () => {
  const src = fs.readFileSync(path.join(ROOT, 'script.js'), 'utf8');
  const start = src.indexOf('var I18N');
  const body = src.slice(start, src.indexOf('var STORAGE_KEY', start));
  const cut = body.indexOf('en: {');
  const keys = [...body.slice(0, cut).matchAll(/'([^']+)':/g)].map((m) => m[1]);

  /* 어디든 문자열로 등장하면 사용 중으로 봅니다. 'accent.' 처럼 조합해서
     만드는 키(accent.* / theme.* / contact.subject.* / mag.kind.*)는 접두사로 인정합니다. */
  const literals = new Set();
  PAGES.concat(['script.js', 'magazine.js']).forEach((file) => {
    const code = fs.readFileSync(path.join(ROOT, file), 'utf8');
    [...code.matchAll(/'([A-Za-z][\w.-]*)'/g)].forEach((m) => literals.add(m[1]));
  });

  const prefixes = [...literals].filter((s) => s.length > 1 && s.endsWith('.'));
  const unused = keys.filter((k) =>
    !literals.has(k) && !prefixes.some((p) => k.startsWith(p)));

  assert(unused.length === 0, '사용되지 않음: ' + unused.join(', '));
  return keys.length + '개 키 모두 사용 중 (조합 접두사 ' + prefixes.length + '개)';
});

/* ── 5. index.html = 매거진 ──────────────────────────────────────────────
   위 기능 테스트가 언어·테마를 바꿔놓았으므로, 매거진 검사는 새 인스턴스로 시작합니다. */
let magazine = null;
try { magazine = runPage('index.html'); } catch (e) { /* 초기화 실패는 위에서 이미 보고됩니다 */ }

if (magazine) {
  const { sandbox, dom } = magazine;

  check('index.html — 매거진이 데이터만큼 렌더링된다', () => {
    const content = dom.byId.get('issueContent');
    assert(content && content.children.length, '본문이 렌더링되지 않았습니다');

    const data = sandbox.MAGAZINE_ISSUES || [];
    assert(data.length, 'issues.js를 읽지 못했습니다');

    const expected = data[0].sections.length;
    assert(content.children.length === expected,
      '섹션 ' + content.children.length + '개 (데이터: ' + expected + '개)');
    return expected + '개 섹션';
  });

  check('표지·목차·진행률이 데이터와 맞는다', () => {
    const issue = (sandbox.MAGAZINE_ISSUES || [])[0];
    const numeral = dom.byId.get('issueNumeral');
    const toc = dom.byId.get('tocList');
    const progress = dom.byId.get('issueProgressText');

    assert(numeral && numeral.textContent === pad2(issue.number),
      '호 번호 = ' + (numeral && numeral.textContent) + ' (기대: ' + pad2(issue.number) + ')');
    assert(toc && toc.children.length === issue.sections.length,
      '목차 항목 = ' + (toc && toc.children.length) + '개 (데이터: ' + issue.sections.length + '개)');
    assert(progress && progress.textContent === '0 / ' + issue.sections.length,
      '진행률 = ' + (progress && progress.textContent));
    return '호 ' + pad2(issue.number) + ' · 목차 ' + toc.children.length + '개 · 진행률 "' + progress.textContent + '"';
  });

  check('표지 통계(단어 수·퀴즈 수)가 채워진다', () => {
    const chips = dom.byId.get('issueMeta');
    assert(chips && chips.children.length === 6, '표지 통계 칩 = ' + (chips && chips.children.length) + '개');

    const values = chips.children.map((li) => li.children[1] && li.children[1].textContent);
    values.forEach((v, i) => {
      assert(v && v !== '' && v !== 'undefined', i + '번째 칩이 비었습니다');
    });
    return values.join(' · ');
  });

  check('화면에 번역되지 않은 키 이름이 남지 않는다', () => {
    const content = dom.byId.get('issueContent');
    const texts = [];
    (function walk(node) {
      if (node.textContent) texts.push(node.textContent);
      (node.children || []).forEach(walk);
    })(content);

    const raw = texts.filter((t) => /^(mag\.|form\.|contact\.|theme\.|accent\.)/.test(t));
    assert(raw.length === 0, '키가 그대로 노출: ' + raw.slice(0, 3).join(', '));
    return '미번역 키 0개';
  });

  check('언어를 바꾸면 매거진 본문도 다시 그려진다', () => {
    const content = dom.byId.get('issueContent');
    const before = content.children.length;

    dom.byId.get('langBtn').dispatch('click');

    assert(dom.documentElement.getAttribute('lang') === 'en', '언어가 바뀌지 않았습니다');
    assert(content.children.length === before, '섹션 수가 달라졌습니다');

    const toc = dom.byId.get('tocList');
    const texts = [];
    (function walk(node) {
      if (node.textContent) texts.push(node.textContent);
      (node.children || []).forEach(walk);
    })(content);

    const raw = texts.filter((t) => /^(mag\.|form\.|contact\.)/.test(t));
    assert(raw.length === 0, '영어 전환 후 키가 노출: ' + raw.slice(0, 3).join(', '));
    assert(toc && toc.children.length, '목차가 사라졌습니다');
    return '섹션 ' + before + '개 유지, 미번역 키 0개';
  });

  check('단어장 저장·복사·비우기 요소가 준비돼 있다', () => {
    ['wbList', 'wbEmpty', 'wbCopyBtn', 'wbClearBtn'].forEach((id) => {
      assert(dom.byId.get(id), '#' + id + '가 없습니다');
    });
    return '4개 요소 확인';
  });

  check('듣기 속도를 바꾸면 저장되고 선택 표시가 갱신된다', () => {
    const btns = dom.bySelector['[data-rate]'];
    assert(btns.length === 3, '속도 버튼 ' + btns.length + '개 (3개여야 함)');

    const slow = btns.filter((b) => b.getAttribute('data-rate') === '0.75')[0];
    const fast = btns.filter((b) => b.getAttribute('data-rate') === '1.15')[0];

    assert(fast.getAttribute('aria-pressed') === 'false', '기본값이 1.25×로 표시되어 있습니다');
    assert(btns.filter((b) => b.getAttribute('aria-pressed') === 'true').length === 1,
      '선택 표시가 하나가 아닙니다');

    slow.dispatch('click');
    assert(JSON.parse(sandbox.localStorage.getItem('monsterlab.rate')) === 0.75,
      '저장값 = ' + sandbox.localStorage.getItem('monsterlab.rate'));
    assert(slow.getAttribute('aria-pressed') === 'true', '선택 표시가 갱신되지 않았습니다');
    assert(fast.getAttribute('aria-pressed') === 'false', '이전 선택이 남아 있습니다');

    /* 다시 열면 저장된 속도가 선택되어 있어야 합니다 */
    const reopened = runPage('index.html', { storage: { 'monsterlab.rate': '0.75' } });
    const restored = reopened.dom.bySelector['[data-rate]']
      .filter((b) => b.getAttribute('aria-pressed') === 'true');
    assert(restored.length === 1 && restored[0].getAttribute('data-rate') === '0.75',
      '저장된 속도가 복원되지 않았습니다');

    return '1× → 0.75× 저장 및 복원 확인';
  });

  check('호 선택기로 다른 호를 열 수 있다', () => {
    const data = sandbox.MAGAZINE_ISSUES || [];
    const nav = dom.byId.get('issueNav');

    assert(data.length > 1, '호가 ' + data.length + '개뿐입니다 (여러 호를 담아야 합니다)');
    assert(nav && nav.children.length === data.length, '호 버튼 ' + (nav && nav.children.length) + '개');

    const active = nav.children.filter((b) => b.getAttribute('aria-pressed') === 'true')[0];
    assert(active, '현재 보고 있는 호 표시가 없습니다');

    const other = nav.children.filter((b) => b !== active)[0];
    const next = data[nav.children.indexOf(other)];
    other.dispatch('click');

    assert(dom.byId.get('issueNumeral').textContent === pad2(next.number),
      '호를 바꿨는데 표지 번호 = ' + dom.byId.get('issueNumeral').textContent);
    assert(JSON.parse(sandbox.localStorage.getItem('monsterlab.issue')) === next.slug,
      '선택한 호가 저장되지 않았습니다');
    assert(dom.byId.get('tocList').children.length === next.sections.length,
      '목차가 새 호 기준으로 다시 그려지지 않았습니다');
    return pad2(data[0].number) + ' → ' + pad2(next.number) + ' 전환 · 목차 ' + next.sections.length + '개';
  });

  check('번역 가리기 토글이 상태·저장값·버튼 표시를 바꾼다', () => {
    const buttons = dom.bySelector['[data-tr-toggle]'];
    assert(buttons.length >= 1, '토글 버튼이 HTML에 없습니다');

    const before = dom.documentElement.getAttribute('data-tr');
    assert(before === 'on', '초기 data-tr = ' + before);

    buttons[0].dispatch('click');

    assert(dom.documentElement.getAttribute('data-tr') === 'off',
      'data-tr = ' + dom.documentElement.getAttribute('data-tr'));
    assert(JSON.parse(sandbox.localStorage.getItem('monsterlab.translation')) === 'off',
      '저장값 = ' + sandbox.localStorage.getItem('monsterlab.translation'));
    assert(buttons[0].getAttribute('aria-pressed') === 'false', 'aria-pressed가 갱신되지 않았습니다');

    buttons[0].dispatch('click');
    assert(dom.documentElement.getAttribute('data-tr') === 'on', '다시 켜지지 않았습니다');
    return 'on ↔ off · 버튼 ' + buttons.length + '개 동기화';
  });

  check('받아쓰기가 정답과 오답을 구분한다', () => {
    const inputs = collect(dom.byId.get('issueContent'), 'dict-input');
    assert(inputs.length, '받아쓰기 입력칸이 렌더링되지 않았습니다');

    const input = inputs[0];
    const row = input.parentNode;
    const checkBtn = collect(row, 'dict-actions')[0].children[0];

    input.value = 'totally wrong sentence';
    checkBtn.dispatch('click');
    assert(collect(row, 'dict-bad').length === 1, '오답 안내가 없습니다');
    assert(collect(row, 'dict-answer').length === 1, '오답일 때 정답이 공개되지 않았습니다');
    assert(collect(row, 'dict-word').length > 0, '정답 문장이 단어로 나뉘어 표시되지 않았습니다');

    const dictation = (sandbox.MAGAZINE_ISSUES || []).find((i) => i.slug === JSON.parse(sandbox.localStorage.getItem('monsterlab.issue')))
      .sections.filter((s) => s.dictation && s.dictation.length)[0];
    assert(dictation, '받아쓰기 데이터를 찾지 못했습니다');

    input.value = dictation.dictation[0].en;
    checkBtn.dispatch('click');
    assert(collect(row, 'dict-ok').length === 1, '정답 표시가 없습니다');
    assert(collect(row, 'dict-bad').length === 0, '정답인데 오답 안내가 남아 있습니다');
    return '오답 → 정답 처리 확인 (문항 ' + inputs.length + '개)';
  });

  check('확인 문제가 점수를 매기고 다시 풀 수 있다', () => {
    const issue = (sandbox.MAGAZINE_ISSUES || [])
      .find((i) => i.slug === JSON.parse(sandbox.localStorage.getItem('monsterlab.issue')));
    const quizSection = issue.sections.filter((s) => s.quiz && s.quiz.length)[0];
    assert(quizSection, '확인 문제 데이터가 없습니다');

    const rows = collect(dom.byId.get('issueContent'), 'quiz-item');
    const total = quizSection.quiz.length;
    assert(rows.length >= total, '퀴즈 항목 = ' + rows.length + '개');

    rows.slice(0, total).forEach((row, i) => {
      const options = collect(row, 'quiz-opt');
      options[quizSection.quiz[i].answer].dispatch('click');
    });

    const summary = collect(dom.byId.get('issueContent'), 'quiz-summary')[0];
    assert(summary && summary.hidden === false, '모두 풀었는데 점수 요약이 나오지 않았습니다');

    const score = collect(summary, 'quiz-summary-score')[0];
    assert(score && score.textContent === total + ' / ' + total, '점수 = ' + (score && score.textContent));

    const retry = collect(summary, 'quiz-summary-actions')[0].children[0];
    retry.dispatch('click');

    assert(summary.hidden === true, '다시 풀기 후 요약이 사라지지 않았습니다');
    assert(collect(rows[0], 'quiz-feedback').length === 0, '다시 풀기 후 피드백이 남아 있습니다');
    return total + '문항 채점 + 다시 풀기 확인';
  });

  check('단어장 검색이 목록을 걸러낸다', () => {
    const page = runPage('index.html', {
      storage: {
        'monsterlab.wordbook': JSON.stringify([
          { en: 'layover', ko: '경유 대기' },
          { en: 'boarding pass', ko: '탑승권' },
        ]),
      },
    });

    const list = page.dom.byId.get('wbList');
    assert(list.children.length === 2, '저장 단어 ' + list.children.length + '개');

    const search = page.dom.byId.get('wbSearch');
    assert(search, '#wbSearch가 없습니다');

    search.value = 'boarding';
    search.dispatch('input');
    assert(list.children.length === 1, '검색 후 ' + list.children.length + '개');
    assert(page.dom.byId.get('wbNoMatch').hidden === true, '결과가 있는데 안내가 보입니다');

    search.value = 'zzz';
    search.dispatch('input');
    assert(list.children.length === 0, '없는 단어인데 ' + list.children.length + '개 남았습니다');
    assert(page.dom.byId.get('wbNoMatch').hidden === false, '검색 결과 없음 안내가 보이지 않습니다');
    return '2 → 1 → 0개 필터링';
  });

  check('단어를 담으면 복습 카드가 준비된다', () => {
    const page = runPage('index.html', {
      storage: { 'monsterlab.wordbook': JSON.stringify([{ en: 'layover', ko: '경유 대기', note: '경유' }]) },
    });

    const pill = page.dom.byId.get('reviewDueCount');
    const stage = page.dom.byId.get('reviewStage');

    assert(pill && pill.textContent === '1', '복습 대기 카드 = ' + (pill && pill.textContent));

    const start = collect(stage, 'review-start')[0];
    assert(start, '복습 시작 안내가 없습니다');
    collect(start, 'btn')[0].dispatch('click');

    assert(collect(stage, 'review-card').length === 1, '카드가 나타나지 않았습니다');
    assert(collect(stage, 'review-face-ko').length === 0, '뜻이 처음부터 보입니다');

    collect(stage, 'review-actions')[0].children[0].dispatch('click');   /* 뜻 보기 */
    assert(collect(stage, 'review-face-ko').length === 1, '뜻이 나타나지 않았습니다');

    collect(stage, 'review-actions')[0].children[0].dispatch('click');   /* 알아요 */
    assert(collect(stage, 'review-done').length === 1, '복습 완료 화면이 없습니다');

    const srs = JSON.parse(page.sandbox.localStorage.getItem('monsterlab.srs'));
    assert(srs && srs.layover && srs.layover.box === 1, '복습 단계가 기록되지 않았습니다');
    return '카드 1장 복습 · 다음 단계 box=' + srs.layover.box;
  });

  check('모든 섹션 종류에 ko·en 문구가 있다', () => {
    const kinds = new Set();
    (sandbox.MAGAZINE_ISSUES || []).forEach((issue) => {
      issue.sections.forEach((s) => kinds.add(s.kind));
    });

    const missing = [];
    kinds.forEach((kind) => {
      ['ko', 'en'].forEach((lang) => {
        if (sandbox.MonsterLab.t('mag.kind.' + kind, lang) === 'mag.kind.' + kind) {
          missing.push(kind + ' (' + lang + ')');
        }
      });
    });

    assert(missing.length === 0, '누락: ' + missing.join(', '));
    return kinds.size + '종 × ko·en 확인';
  });

  check('학습 리듬(오늘의 활동·연속 학습일)이 기록된다', () => {
    const page = runPage('index.html');
    const { sandbox: sb, dom: d } = page;

    const done = collectAttr(d.byId.get('issueContent'), 'data-done-for')
      .filter((node) => node.tagName === 'BUTTON');
    assert(done.length >= 3, '완료 표시 버튼 = ' + done.length + '개');

    assert(d.byId.get('dailyCount').textContent === '0', '처음부터 오늘 활동이 있습니다');
    assert(d.byId.get('dailyDots').children.length === 7, '요일 점 = ' + d.byId.get('dailyDots').children.length + '개');

    done[0].dispatch('click');
    done[1].dispatch('click');
    done[2].dispatch('click');

    assert(d.byId.get('dailyCount').textContent === '3', '오늘 활동 = ' + d.byId.get('dailyCount').textContent);
    assert(d.byId.get('streakCount').textContent === '1', '연속 학습일 = ' + d.byId.get('streakCount').textContent);
    assert(d.byId.get('dailyFill').style.width === '100%', '진행 막대 = ' + d.byId.get('dailyFill').style.width);

    const days = JSON.parse(sb.localStorage.getItem('monsterlab.days'));
    assert(days && days.length === 1, '학습일 기록 = ' + (days && days.length) + '일');

    /* 완료를 취소하는 것은 활동으로 세지 않아야 합니다 */
    done[0].dispatch('click');
    assert(d.byId.get('dailyCount').textContent === '3',
      '완료 취소까지 활동으로 세고 있습니다 (' + d.byId.get('dailyCount').textContent + ')');

    return '활동 3회 · 연속 1일 · 막대 100% · 되돌리기 제외';
  });

  check('백업 파일을 불러와 단어장·복습·진행률·학습일을 합친다', () => {
    const page = runPage('index.html', {
      storage: { 'monsterlab.wordbook': JSON.stringify([{ en: 'layover', ko: '경유 대기' }]) },
    });
    const { sandbox: sb, dom: d } = page;

    const payload = {
      app: 'EngMon',
      wordbook: [{ en: 'headline', ko: '헤드라인' }, { en: 'layover', ko: '중복된 값' }],
      srs: { headline: { box: 3, due: 1 } },
      progress: { 'issue-03': ['daily-words'] },
      days: ['2026-09-01', '2026-09-02'],
    };

    const file = d.byId.get('wbRestoreFile');
    file.files = [{ __text: JSON.stringify(payload) }];
    file.dispatch('change');

    const words = JSON.parse(sb.localStorage.getItem('monsterlab.wordbook'));
    assert(words.length === 2, '병합 후 단어 = ' + words.length + '개');
    assert(words.some((w) => w.en === 'headline'), '새 단어가 들어오지 않았습니다');
    assert(words.filter((w) => w.en === 'layover')[0].ko === '경유 대기', '기존 단어가 덮어써졌습니다');

    const srs = JSON.parse(sb.localStorage.getItem('monsterlab.srs'));
    assert(srs && srs.headline && srs.headline.box === 3, '복습 단계가 복원되지 않았습니다');

    const days = JSON.parse(sb.localStorage.getItem('monsterlab.days'));
    assert(days && days.length === 2, '학습일 = ' + (days && days.length) + '일');

    const progress = JSON.parse(sb.localStorage.getItem('monsterlab.progress'));
    assert(progress && progress['issue-03'] && progress['issue-03'].indexOf('daily-words') > -1,
      '진행률이 복원되지 않았습니다');

    /* 깨진 파일은 조용히 거절합니다 */
    file.files = [{ __text: '{ not json' }];
    file.dispatch('change');
    assert(JSON.parse(sb.localStorage.getItem('monsterlab.wordbook')).length === 2,
      '깨진 파일이 단어장을 바꿔 버렸습니다');

    return '단어 1→2 · 복습단계 · 진행률 · 학습일 2일 · 깨진 파일 거절';
  });

  check('인쇄 버튼이 있고 눌러도 오류가 나지 않는다', () => {
    const page = runPage('index.html');
    const btn = page.dom.byId.get('printBtn');
    assert(btn, '#printBtn이 없습니다');

    btn.dispatch('click');   /* 테스트 환경에는 window.print가 없습니다 — 가드가 있어야 합니다 */
    return 'window.print 호출 가드 확인';
  });
}

/* ── 6. HTML 위생 점검 ─────────────────────────────────────────────────── */
PAGES.forEach((file) => {
  check(file + ' — 중복 id가 없다', () => {
    const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
    const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
    assert(dup.length === 0, '중복 id: ' + [...new Set(dup)].join(', '));
    return ids.length + '개 id 모두 고유';
  });

  check(file + ' — 에셋 URL에 캐시 무효화 버전이 붙어 있다', () => {
    const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
    const refs = [...html.matchAll(/(?:href|src)="((?:styles|[a-z-]+)\.(?:css|js))"/g)].map((m) => m[1]);
    assert(refs.length === 0, '버전 없는 참조: ' + refs.join(', '));
    return '모든 css/js 참조에 ?v= 포함';
  });
});

check('공유 에셋(styles.css / script.js) 버전 표기가 일관된다', () => {
  const versions = {};
  PAGES.forEach((file) => {
    const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
    [...html.matchAll(/([\w-]+\.(?:css|js))\?v=([\w.-]+)/g)].forEach((m) => {
      versions[m[1]] = versions[m[1]] || new Set();
      versions[m[1]].add(m[2]);
    });
  });

  const conflicts = Object.entries(versions)
    .filter(([, set]) => set.size > 1)
    .map(([name, set]) => name + ': ' + [...set].join(' vs '));
  assert(conflicts.length === 0, '버전 불일치: ' + conflicts.join(', '));

  const shared = ['styles.css', 'script.js'].filter((name) => versions[name]);
  assert(shared.length === 2, 'styles.css / script.js 버전 표기를 찾지 못했습니다');
  return Object.entries(versions).map(([n, s]) => n + '=' + [...s][0]).join(' ');

});

/* ── 7. 데이터 구조 ───────────────────────────────────────────────────── */
check('CSS에 없는 클래스를 화면에 쓰지 않는다', () => {
  const css = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');
  const defined = (name) => new RegExp('\\.' + name.replace(/[^\w-]/g, '') + '(?![\\w-])').test(css);

  const problems = [];

  /* 1) HTML에 적힌 클래스 */
  PAGES.forEach((file) => {
    const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
    const used = new Set();
    [...html.matchAll(/class="([^"]+)"/g)].forEach((m) => {
      m[1].split(/\s+/).forEach((c) => c && used.add(c));
    });
    used.forEach((c) => { if (!defined(c)) problems.push(file + ' .' + c); });
  });

  /* 2) 스크립트가 만들어내는 클래스 (매거진 렌더링 결과를 직접 훑어봅니다) */
  if (magazine) {
    const seen = new Set();
    ['issueContent', 'tocList', 'wbList', 'issueMeta'].forEach((id) => {
      (function walk(node) {
        if (!node) return;
        if (node.className) String(node.className).split(/\s+/).forEach((c) => c && seen.add(c));
        (node.children || []).forEach(walk);
      })(magazine.dom.byId.get(id));
    });
    seen.forEach((c) => { if (!defined(c)) problems.push('매거진 렌더링 .' + c); });
  }

  assert(problems.length === 0, '스타일 없음: ' + [...new Set(problems)].join(', '));
  return 'HTML + 매거진 렌더링 클래스 모두 정의됨';
});

check('매거진 데이터 구조가 올바르다', () => {
  const sandbox = vm.createContext(makeSandbox(makeDom('<html></html>'), {}));
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'issues.js'), 'utf8'), sandbox);

  const issues = sandbox.MAGAZINE_ISSUES;
  assert(Array.isArray(issues) && issues.length, 'MAGAZINE_ISSUES가 배열이 아닙니다');

  const seen = new Set();
  let items = 0;
  let quizzes = 0;
  let dictation = 0;
  let tables = 0;

  issues.forEach((issue) => {
    ['number', 'slug', 'theme', 'title', 'summary'].forEach((field) => {
      assert(issue[field] != null, '호에 ' + field + '가 없습니다');
    });
    issue.theme.ko && issue.theme.en || assert(false, 'theme에 ko/en이 필요합니다');

    issue.sections.forEach((section) => {
      assert(!seen.has(section.id), '중복 섹션 id: ' + section.id);
      seen.add(section.id);
      assert(section.title && section.title.ko && section.title.en,
        section.id + '의 제목이 ko/en 양쪽에 필요합니다');

      (section.items || []).forEach((item) => {
        items++;
        assert(item.en != null, section.id + ' 항목에 en이 없습니다');
        assert(item.ko != null, section.id + ' 항목에 ko가 없습니다');
      });

      (section.dialogue || []).forEach((line) => {
        assert(line.en && line.ko, section.id + ' 대화문에 ko/en이 필요합니다');
      });

      (section.quiz || []).forEach((item) => {
        quizzes++;
        assert(item.q && item.q.ko && item.q.en, section.id + ' 퀴즈 문제에 ko/en이 필요합니다');
        assert(Array.isArray(item.options) && item.options.length >= 2,
          section.id + ' 퀴즈 보기가 부족합니다');
        assert(item.answer >= 0 && item.answer < item.options.length,
          section.id + ' 퀴즈 정답 범위 오류');
        assert(item.explain && item.explain.ko && item.explain.en,
          section.id + ' 퀴즈 해설에 ko/en이 필요합니다');
      });

      (section.dictation || []).forEach((line) => {
        dictation++;
        assert(line.en && line.ko, section.id + ' 받아쓰기에 ko/en이 필요합니다');
      });

      if (section.table) {
        tables++;
        assert(Array.isArray(section.table.head) && section.table.head.length,
          section.id + ' 표에 head가 필요합니다');
        assert(Array.isArray(section.table.rows) && section.table.rows.length,
          section.id + ' 표에 rows가 필요합니다');
        section.table.head.forEach((head) => {
          assert(head && head.ko && head.en, section.id + ' 표 머리말에 ko/en이 필요합니다');
        });
      }

      if (section.body) {
        assert(Array.isArray(section.body.en) && section.body.en.length,
          section.id + ' 본문에 영어 문단(en)이 필요합니다');
      }

      if (section.reading) {
        assert(Array.isArray(section.reading) && section.reading.length,
          section.id + ' 독해 지문이 배열이 아닙니다');
      }
    });
  });

  return issues.length + '호 / 섹션 ' + seen.size + '개 / 항목 ' + items + '개 / 퀴즈 ' + quizzes +
    '개 / 받아쓰기 ' + dictation + '개 / 표 ' + tables + '개';
});

check('인쇄용 스타일이 있고 번역을 종이에서는 되살린다', () => {
  const css = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');
  assert(/@media print/.test(css), '인쇄 스타일(@media print)이 없습니다');
  assert(/:root\[data-tr="off"\] \.trl \{ display: block !important; \}/.test(css),
    '인쇄할 때 한국어 해설이 감춰집니다');
  assert(/break-inside: avoid/.test(css), '인쇄 시 섹션 중간에서 페이지가 끊깁니다');
  return '인쇄 스타일 + 번역 강제 표시 + 페이지 나눔 확인';
});

check('스티키 목차가 화면보다 길어도 스크롤된다 (CSS 회귀)', () => {
  const css = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');
  const start = css.indexOf('.issue-aside {');
  assert(start > -1, '.issue-aside 규칙을 찾지 못했습니다');

  const rule = css.slice(start, css.indexOf('}', start));
  assert(/max-height\s*:/.test(rule),
    '.issue-aside에 max-height가 없습니다 — 목차 아래쪽이 영영 잘립니다');
  assert(/overflow-y\s*:\s*auto/.test(rule),
    '.issue-aside에 overflow-y: auto가 없습니다 — 목차를 끝까지 내려볼 수 없습니다');
  return 'max-height + overflow-y: auto 확인';
});

check('좁은 화면에서 섹션 머리가 줄바꿈된다 (CSS 회귀)', () => {
  const css = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');

  /* 760px 이하 블록을 잘라서 검사합니다 */
  const start = css.indexOf('@media (max-width: 760px) {');
  assert(start > -1, '760px 이하 미디어 쿼리를 찾지 못했습니다');
  const block = css.slice(start, css.indexOf('\n@media (max-width: 900px)', start));

  assert(/\.m-head\s*\{[^}]*flex-wrap\s*:\s*wrap/.test(block),
    '좁은 화면에서 .m-head에 flex-wrap: wrap이 없습니다 — 학습 도구가 폭을 다 먹고 제목이 한 글자 폭으로 찌그러집니다');
  assert(/\.m-tools\s*\{[^}]*flex\s*:\s*1 1 100%/.test(block),
    '좁은 화면에서 .m-tools가 아랫줄 전체 폭을 차지하지 않습니다');
  return '.m-head 줄바꿈 + .m-tools 전체 폭 확인';
});

/* ── 8. 방문 분석 (Google Analytics 4) ──────────────────────────────── */

/* analytics.js 를 최소 환경에서 실행해, 무엇을 했는지 돌려줍니다.
   실제로 스크립트를 내려받지 않고 주입 시도만 관찰합니다. */
function runAnalytics(env) {
  const appended = [];
  const document = {
    head: { appendChild: (node) => appended.push(node) },
    documentElement: { appendChild: (node) => appended.push(node) },
    createElement: (tag) => ({ tagName: String(tag).toUpperCase(), src: '', async: false }),
  };
  const location = { protocol: (env && env.protocol) || 'https:' };
  const navigator = { doNotTrack: env && env.dnt };
  const window = {
    ENGMON_GA4_ID: env ? env.id : undefined,
    document: document,
    location: location,
    navigator: navigator,
    doNotTrack: env && env.windowDnt,
  };

  const sandbox = {
    window: window,
    document: document,
    location: location,
    navigator: navigator,
    encodeURIComponent: encodeURIComponent,
    Date: Date,
  };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'analytics.js'), 'utf8'), sandbox, { filename: 'analytics.js' });

  return { appended: appended, window: window };
}

check('방문 분석 — 측정 ID가 없으면 아무 요청도 보내지 않는다', () => {
  const cases = [
    { label: '설정 없음', env: undefined },
    { label: '빈 문자열', env: { id: '' } },
    { label: '공백', env: { id: '   ' } },
    { label: '자리표시자', env: { id: 'G-XXXXXXXXXX' } },
    { label: '형식 오류(짧음)', env: { id: 'G-123' } },
    { label: '형식 오류(UA-)', env: { id: 'UA-12345678-1' } },
  ];

  cases.forEach((c) => {
    const out = runAnalytics(c.env);
    assert(out.appended.length === 0,
      c.label + ': 스크립트를 붙였습니다 — ID를 채우기 전에는 아무 것도 하지 않아야 합니다');
    assert(!out.window.gtag, c.label + ': gtag를 만들었습니다');
  });

  return cases.length + '가지 경우 모두 무동작';
});

check('방문 분석 — 로컬(file://)·추적 금지에서는 보내지 않는다', () => {
  const blocked = [
    { label: 'file://', env: { id: 'G-ABCDE12345', protocol: 'file:' } },
    { label: 'navigator.doNotTrack', env: { id: 'G-ABCDE12345', dnt: '1' } },
    { label: 'window.doNotTrack', env: { id: 'G-ABCDE12345', windowDnt: '1' } },
  ];

  blocked.forEach((c) => {
    const out = runAnalytics(c.env);
    assert(out.appended.length === 0, c.label + ': 그래도 보냈습니다');
  });

  /* 로컬 확인이 통계에 섞이지 않아야 하고, 브라우저 검증도 조용해야 합니다 */
  return blocked.map((c) => c.label).join(' · ') + ' 차단 확인';
});

check('방문 분석 — 페이지 방문만 수집하도록 설정한다', () => {
  const out = runAnalytics({ id: 'G-ABCDE12345' });
  assert(out.appended.length === 1, '스크립트를 붙이지 않았습니다');

  const tag = out.appended[0];
  assert(tag.src === 'https://www.googletagmanager.com/gtag/js?id=G-ABCDE12345',
    'gtag 스크립트 주소가 다릅니다: ' + tag.src);
  assert(tag.async === true, '스크립트가 async가 아닙니다 — 페이지 표시를 막습니다');

  const calls = out.window.dataLayer.map((args) => Array.prototype.slice.call(args));
  const config = calls.filter((c) => c[0] === 'config')[0];
  assert(config, "gtag('config', …) 호출이 없습니다");
  assert(config[1] === 'G-ABCDE12345', '측정 ID가 전달되지 않았습니다');

  const opts = config[2] || {};
  assert(opts.send_page_view === true, '페이지 방문 수집이 꺼져 있습니다');
  assert(opts.anonymize_ip === true, 'IP 익명화가 꺼져 있습니다');
  assert(opts.allow_google_signals === false, '광고 신호를 끄지 않았습니다');
  assert(opts.allow_ad_personalization_signals === false, '광고 맞춤설정 신호를 끄지 않았습니다');

  /* 학습 행동을 보내는 코드가 섞여 들어오지 않았는지 — '페이지 방문만' 원칙 */
  const events = calls.filter((c) => c[0] === 'event').map((c) => c[1]);
  assert(events.length === 0, '학습 이벤트를 보내고 있습니다: ' + events.join(', '));

  return '스크립트 1회 · config 1회 · 이벤트 0회 · IP 익명화';
});

check('index.html — 방문 분석 스크립트를 한 번만, ID는 한 곳에서 정한다', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const refs = [...html.matchAll(/<script[^>]+src="analytics\.js(\?v=[\w.-]+)?"/g)];
  assert(refs.length === 1, 'analytics.js 참조가 ' + refs.length + '개입니다 (1개여야 합니다)');
  assert(refs[0][1], 'analytics.js 에 ?v= 캐시 무효화 버전이 없습니다');

  const ids = [...html.matchAll(/ENGMON_GA4_ID\s*=/g)];
  assert(ids.length === 1, '측정 ID를 정하는 곳이 ' + ids.length + '곳입니다 (한 곳이어야 합니다)');

  /* 스크립트보다 ID 설정이 먼저 와야 합니다 */
  assert(html.indexOf('ENGMON_GA4_ID') < html.indexOf('analytics.js'),
    '측정 ID 설정이 analytics.js 보다 뒤에 있습니다');

  return 'analytics.js 1회 · 측정 ID 1곳';
});

/* ── 결과 ─────────────────────────────────────────────────────────────── */
const pad = (s, n) => String(s) + ' '.repeat(Math.max(0, n - String(s).length));

console.log('\n  스모크 테스트 — ' + path.basename(ROOT) + '\n');
results.forEach(([status, name, detail]) => {
  console.log((status === 'PASS' ? '  ✓' : '  ✗') + ' ' + pad(name, 56) + (detail || ''));
});
console.log('\n  ' + (results.length - failures) + '/' + results.length + ' 통과\n');

process.exit(failures ? 1 : 0);
