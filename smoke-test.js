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
});

check('필수 요소(#langBtn·#langLabel·#toast)가 HTML에 있다', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  ['langBtn', 'langLabel', 'toast', 'siteHeader', 'nav', 'menuBtn',
    'issueContent', 'tocList', 'wbList'].forEach((id) => {
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

  check('표지·목차·진행률이 채워진다', () => {
    const numeral = dom.byId.get('issueNumeral');
    const toc = dom.byId.get('tocList');
    const progress = dom.byId.get('issueProgressText');

    assert(numeral && numeral.textContent === '01', '호 번호 = ' + (numeral && numeral.textContent));
    assert(toc && toc.children.length, '목차가 비어 있습니다');
    assert(progress && progress.textContent === '0 / 10', '진행률 = ' + (progress && progress.textContent));
    return '호 01 · 목차 ' + toc.children.length + '개 · 진행률 "' + progress.textContent + '"';
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
    });
  });

  return issues.length + '호 / 섹션 ' + seen.size + '개 / 항목 ' + items + '개 / 퀴즈 ' + quizzes + '개';
});

/* ── 결과 ─────────────────────────────────────────────────────────────── */
const pad = (s, n) => String(s) + ' '.repeat(Math.max(0, n - String(s).length));

console.log('\n  스모크 테스트 — ' + path.basename(ROOT) + '\n');
results.forEach(([status, name, detail]) => {
  console.log((status === 'PASS' ? '  ✓' : '  ✗') + ' ' + pad(name, 56) + (detail || ''));
});
console.log('\n  ' + (results.length - failures) + '/' + results.length + ' 통과\n');

process.exit(failures ? 1 : 0);
