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
     4. 문의 폼(Formspree)이 UTF-8 본문 전송·성공·실패·한도·reCAPTCHA를 올바로 처리하는가
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
  el.reset = () => {};

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

  /* id가 붙은 실제 태그의 속성을 그 요소로 옮깁니다 (action, placeholder ...).
     script.js 는 <form action> 을 읽어 Formspree 전송 주소로 쓰기 때문에,
     옮기지 않으면 화면과 다른 상태를 테스트하게 됩니다. */
  [...html.matchAll(/<([a-z][\w-]*)([^>]*)>/gi)].forEach((m) => {
    const idMatch = /\sid="([^"]+)"/.exec(m[2]);
    if (!idMatch) return;

    const el = byId.get(idMatch[1]);
    if (!el) return;

    [...m[2].matchAll(/([a-z][\w-]*)\s*=\s*"([^"]*)"/gi)].forEach((a) => {
      if (a[1] !== 'id') el.setAttribute(a[1], a[2]);
    });
  });

  const formEl = byId.get('contactForm');
  if (formEl) {
    if (opts.formspreeAction) formEl.setAttribute('action', opts.formspreeAction);
    if (opts.recaptchaKey) formEl.setAttribute('data-recaptcha-key', opts.recaptchaKey);

    /* 실제 폼처럼 submit 후 입력값이 비워지는지 볼 수 있게 */
    formEl.reset = () => {
      ['cfEmail', 'cfMsg'].forEach((id) => {
        const field = byId.get(id);
        if (field) field.value = '';
      });
    };

    /* FormData 최소 구현이 읽어 갈 “폼 안 입력값” */
    formEl.__fields = () => [...html.matchAll(/<(?:input|select|textarea)\b[^>]*>/gi)]
      .map((m) => {
        const name = (m[0].match(/\bname="([^"]+)"/) || [])[1];
        if (!name) return null;

        const id = (m[0].match(/\bid="([^"]+)"/) || [])[1];
        const el = id ? byId.get(id) : null;
        const attrValue = (m[0].match(/\bvalue="([^"]*)"/) || [])[1];

        return { name, value: (el && el.value) || attrValue || '' };
      })
      .filter(Boolean);
  }

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

  /* <head> — script 주입(reCAPTCHA)을 추적합니다. 가짜 네트워크라 append 하면
     바로 로드된 것으로 처리하고(opts.recaptchaLoad === false 면 실패로),
     테스트는 head.children 으로 "외부 요청이 있었는지"를 볼 수 있습니다. */
  const head = makeElement('head');
  head.appendChild = (child) => {
    head.children.push(child);
    child.parentNode = head;

    if (child.tagName === 'SCRIPT') {
      if (opts.recaptchaLoad === false) {
        if (typeof child.onerror === 'function') child.onerror();
      } else if (typeof child.onload === 'function') {
        child.onload();
      }
    }
    return child;
  };

  const document = {
    documentElement,
    body,
    head,
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

/* script.js 는 fetch(...).then(성공).then(성공, 실패) 형태만 씁니다.
   테스트를 동기로 유지하려고, 그 체인만 그대로 흉내 내는 최소 thenable을 씁니다
   (진짜 Promise는 마이크로태스크라서 check() 안에서 결과를 바로 볼 수 없습니다). */
function makeThenable(settle) {
  let value;
  let error;
  try { value = settle(); } catch (err) { error = err; }

  return {
    then(onOk, onErr) {
      if (error) {
        if (!onErr) return makeThenable(() => { throw error; });
        return makeThenable(() => onErr(error));
      }
      if (!onOk) return makeThenable(() => value);
      return makeThenable(() => onOk(value));
    },
  };
}

function makeSandbox(dom, opts) {
  const store = new Map(Object.entries((opts && opts.storage) || {}));
  const windowListeners = {};
  const fetchCalls = [];

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

  /* FormData 최소 구현 — 폼 입력값을 읽고, set() 으로 덧붙인 값(토큰·제목 등)을 담습니다. */
  sandbox.FormData = class FormData {
    constructor(form) {
      this._entries = [];

      const fields = (form && typeof form.__fields === 'function') ? form.__fields() : [];
      fields.forEach((f) => this.set(f.name, f.value));
    }

    set(name, value) {
      const pair = [String(name), String(value)];
      const i = this._entries.findIndex((e) => e[0] === pair[0]);

      if (i > -1) this._entries[i] = pair; else this._entries.push(pair);
      return this;
    }

    get(name) {
      const hit = this._entries.filter((e) => e[0] === String(name))[0];
      return hit ? hit[1] : null;
    }

    has(name) { return this._entries.some((e) => e[0] === String(name)); }

    /* script.js 는 폼 값을 URLSearchParams 로 옮길 때 forEach 를 씁니다. */
    forEach(cb) { this._entries.forEach((e) => cb(e[1], e[0])); }
  };

  /* 본문을 UTF-8 퍼센트 인코딩으로 만드는 브라우저 내장 API */
  sandbox.URLSearchParams = URLSearchParams;

  /* reCAPTCHA v3 — opts.recaptchaKey 를 주면 스크립트가 로드된 상태를 흑내 냅니다. */
  if (opts && opts.recaptchaKey) {
    sandbox.grecaptcha = {
      ready: (cb) => cb(),
      execute: () => {
        if (opts.recaptchaTokenFails) return makeThenable(() => { throw new Error('recaptcha'); });
        return makeThenable(() => 'test-token');
      },
    };
  }

  /* Formspree 전송 테스트용 가짜 fetch. opts.fetchResponse 로 응답을 바꿉니다. */
  sandbox.fetch = (url, options) => {
    fetchCalls.push({ url, options });
    const res = (opts && opts.fetchResponse) || { ok: true, status: 200 };
    return makeThenable(() => {
      if (res instanceof Error) throw res;
      return res;
    });
  };
  sandbox._fetchCalls = fetchCalls;

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

  /* ── 문의 폼 (Formspree) ─────────────────────────────────────────────── */
  const FORMSPREE_URL = 'https://formspree.io/f/mnpnvqaq';

  function submitForm(page, values) {
    const byId = page.dom.byId;
    byId.get('cfEmail').value = values.email;
    byId.get('cfMsg').value = values.message || '';

    const form = byId.get('contactForm');
    form.dispatch('submit', { preventDefault() {}, target: form });
    return form;
  }

  /* 전송 본문은 UTF-8 퍼센트 인코딩 문자열입니다 — 확인하려고 다시 파싱합니다. */
  function sentBody(page, index) {
    const call = page.sandbox._fetchCalls[index || 0];
    assert(call, '전송 기록이 없습니다');
    assert(typeof call.options.body === 'string', '본문이 문자열이 아닙니다');
    return new URLSearchParams(call.options.body);
  }

  check('폼을 채워 보내면 UTF-8 본문(x-www-form-urlencoded)으로 전송한다', () => {
    const page = runPage('index.html');
    submitForm(page, { email: 'a@b.com', message: '다음 호 기대할게요' });

    const calls = page.sandbox._fetchCalls;
    assert(calls.length === 1, 'fetch 호출 ' + calls.length + '회 (1회여야 함)');
    assert(calls[0].url === FORMSPREE_URL, '전송 주소 = ' + calls[0].url);
    assert(calls[0].options.method === 'POST', 'method = ' + calls[0].options.method);
    assert(calls[0].options.headers.Accept === 'application/json', 'Accept 헤더가 없습니다');
    /* 어떤 문자셋으로 보내는지 본문에 적혀 있어야 수신 쪽이 한글을 UTF-8 로
       해석합니다. x-www-form-urlencoded 는 CORS 안전 헤더라 사전 요청이 없습니다. */
    assert(calls[0].options.headers['Content-Type'] ===
      'application/x-www-form-urlencoded; charset=UTF-8',
      'Content-Type = ' + calls[0].options.headers['Content-Type']);

    const raw = calls[0].options.body;
    assert(typeof raw === 'string', '본문이 문자열(UTF-8 퍼센트 인코딩)이 아닙니다');
    assert(raw.indexOf('message=' + encodeURIComponent('다음')) > -1,
      '한글이 UTF-8 퍼센트 인코딩으로 나가지 않았습니다: ' + raw);

    const body = new URLSearchParams(raw);
    assert(body.get('email') === 'a@b.com', 'email = ' + body.get('email'));
    assert(body.get('message') === '다음 호 기대할게요', 'message = ' + body.get('message'));
    assert(body.get('_subject').indexOf('EngMon') === 0, '_subject = ' + body.get('_subject'));
    assert(body.get('source') === 'engmon.monster', 'source = ' + body.get('source'));

    /* 함정 칸은 비어 있고, reCAPTCHA 키가 없으면 토큰도 붙지 않아야 합니다 */
    assert(body.get('_gotcha') === '', '허니팟 칸이 비어 있지 않습니다');
    assert(body.get('g-recaptcha-response') === null, '키가 없는데 reCAPTCHA 토큰이 붙었습니다');
    return 'POST UTF-8 urlencoded · _subject·source 확인';
  });

  check('reCAPTCHA 키가 없으면 Google 스크립트를 부르지 않는다', () => {
    const page = runPage('index.html');
    submitForm(page, { email: 'a@b.com', message: '안녕' });

    assert(page.dom.document.head.children.length === 0,
      '외부 스크립트를 불러왔습니다: ' + page.dom.document.head.children.length + '개');
    return '외부 요청 0 (사이트 키 비움)';
  });

  check('reCAPTCHA 키가 있으면 토큰을 붙이고 스크립트는 한 번만 부른다', () => {
    const page = runPage('index.html', { recaptchaKey: 'test-site-key' });
    submitForm(page, { email: 'a@b.com', message: '안녕' });

    const head = page.dom.document.head;
    assert(head.children.length === 1, '스크립트 ' + head.children.length + '개 (1개여야 함)');
    assert(String(head.children[0].src).indexOf('test-site-key') > -1,
      '사이트 키가 주소에 없습니다: ' + head.children[0].src);
    assert(String(head.children[0].src).indexOf('google.com/recaptcha') > -1,
      'Google reCAPTCHA 주소가 아닙니다: ' + head.children[0].src);
    assert(sentBody(page, 0).get('g-recaptcha-response') === 'test-token',
      '토큰이 전달되지 않았습니다');

    /* 두 번째 전송은 스크립트를 다시 불러오지 않아야 합니다 */
    submitForm(page, { email: 'a@b.com', message: '두 번째' });

    assert(head.children.length === 1, '스크립트를 다시 불러왔습니다 (' + head.children.length + '개)');
    assert(page.sandbox._fetchCalls.length === 2, '두 번째 전송이 없습니다');
    return 'script 1회 · 토큰 전달';
  });

  check('reCAPTCHA 스크립트를 못 불러와도 전송은 시도한다', () => {
    const page = runPage('index.html', { recaptchaKey: 'test-site-key', recaptchaLoad: false });
    submitForm(page, { email: 'a@b.com', message: '안녕' });

    const calls = page.sandbox._fetchCalls;
    assert(calls.length === 1, 'fetch 호출 ' + calls.length + '회 (전송이 막혔습니다)');
    assert(sentBody(page, 0).get('g-recaptcha-response') === null, '토큰이 붙었습니다');
    return '로드 실패 → 토큰 없이 전송 시도';
  });

  check('전송 성공 시 상태 안내가 뜨고 입력값이 비워진다', () => {
    const page = runPage('index.html');
    submitForm(page, { email: 'a@b.com', message: '안녕하세요' });

    const t = page.sandbox.MonsterLab.t;
    const status = page.dom.byId.get('formStatus');
    assert(status, '#formStatus가 없습니다');
    assert(status.hidden === false, '성공 안내가 숨겨져 있습니다');
    assert(status.textContent === t('form.sent', 'ko'), '문구 = ' + status.textContent);
    assert(status.classList.contains('is-error') === false, '성공인데 오류 색으로 표시됩니다');
    assert(page.dom.byId.get('cfMsg').value === '', '전송 후에도 입력값이 남아 있습니다');

    const btn = page.dom.byId.get('cfSubmit');
    assert(btn.disabled === false, '전송 후에도 버튼이 잠겨 있습니다');
    assert(btn.textContent === t('form.send', 'ko'), '버튼 문구 = ' + btn.textContent);
    return '성공 안내 + 입력값 초기화 + 버튼 복구';
  });

  check('전송 실패와 한도 초과를 각각 다른 문구로 알린다', () => {
    const fail = runPage('index.html', { fetchResponse: { ok: false, status: 500 } });
    submitForm(fail, { email: 'a@b.com', message: '안녕' });

    const failStatus = fail.dom.byId.get('formStatus');
    assert(failStatus.hidden === false && failStatus.classList.contains('is-error'),
      '실패 안내가 오류 상태로 표시되지 않았습니다');
    assert(failStatus.textContent === fail.sandbox.MonsterLab.t('form.sendFail', 'ko'),
      '문구 = ' + failStatus.textContent);
    assert(fail.dom.byId.get('cfSubmit').disabled === false, '실패 후 버튼이 잠겨 있습니다');

    const rate = runPage('index.html', { fetchResponse: { ok: false, status: 429 } });
    submitForm(rate, { email: 'a@b.com', message: '안녕' });
    assert(rate.dom.byId.get('formStatus').textContent === rate.sandbox.MonsterLab.t('form.rateLimited', 'ko'),
      '429 문구 = ' + rate.dom.byId.get('formStatus').textContent);
    return '500 → 실패 안내 / 429 → 한도 안내';
  });

  check('전송 안내 문구도 언어를 바꾸면 함께 바뀐다', () => {
    const page = runPage('index.html', { fetchResponse: { ok: false, status: 500 } });
    submitForm(page, { email: 'a@b.com', message: '안녕' });

    page.dom.byId.get('langBtn').dispatch('click');

    const status = page.dom.byId.get('formStatus');
    const expected = page.sandbox.MonsterLab.t('form.sendFail', 'en');
    assert(page.dom.documentElement.getAttribute('lang') === 'en', '언어가 바뀌지 않았습니다');
    assert(status.textContent === expected, '영어 문구 = ' + status.textContent);
    return '오류 안내가 영어로 다시 그려짐';
  });

  check('문의 유형에 따라 제목·안내가 바뀌고 빈 내용은 막는다', () => {
    const page = runPage('index.html');
    const t = page.sandbox.MonsterLab.t;
    const type = page.dom.byId.get('cfType');
    const label = page.dom.byId.get('cfMsgLabel');

    assert(type, '#cfType이 없습니다');
    assert(label, '#cfMsgLabel이 없습니다');

    /* 기본값은 다음 호 알림 신청 — 이때만 내용을 비워 둘 수 있습니다 */
    type.value = 'subscribe';
    type.dispatch('change', { target: type });
    assert(label.textContent === t('form.message', 'ko'), '기본 안내 = ' + label.textContent);

    /* 내용이 필요한 유형으로 바꾸면 안내가 (필수)로 바뀝니다 */
    type.value = 'content';
    type.dispatch('change', { target: type });
    assert(label.textContent === t('form.messageRequired', 'ko'),
      '유형 변경 후 안내 = ' + label.textContent);

    submitForm(page, { email: 'a@b.com', message: '' });
    assert(page.sandbox._fetchCalls.length === 0, '빈 내용인데 전송했습니다');
    assert(page.dom.byId.get('formStatus').textContent === t('form.needDetail', 'ko'),
      '안내 문구 = ' + page.dom.byId.get('formStatus').textContent);

    /* 내용을 적으면 유형이 본문(type)과 메일 제목에 함께 담깁니다 */
    submitForm(page, { email: 'a@b.com', message: '3호 문법 설명에 오타가 있어요' });
    const body = sentBody(page, 0);
    assert(body.get('type') === 'content', 'type = ' + body.get('type'));
    assert(body.get('message') === '3호 문법 설명에 오타가 있어요', 'message가 빠졌습니다');

    const subject = body.get('_subject') || '';
    assert(subject.indexOf('EngMon') === 0, '_subject = ' + subject);
    assert(subject.indexOf(t('form.type.content', 'ko')) > -1,
      '제목에 유형이 없습니다: ' + subject);

    /* 관련 호 목록은 issues.js 를 보고 채웁니다 */
    const issue = page.dom.byId.get('cfIssue');
    const expected = 1 + (page.sandbox.MAGAZINE_ISSUES || []).length;
    assert(issue && issue.children.length === expected,
      '관련 호 목록 = ' + (issue && issue.children.length) + '개 (' + expected + '개여야 함)');

    return '유형 변경 · 빈 내용 차단 · type·제목 확인';
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

check('문의 폼이 실제 Formspree 폼 ID로 연결되어 있다', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const match = /<form[^>]*action="https:\/\/formspree\.io\/f\/([^"]+)"/.exec(html);

  assert(match, '폼 action에서 Formspree 주소를 찾지 못했습니다');
  assert(!/_/.test(match[1]), '폼 ID가 자리표시자입니다 — ' + match[1]);
  return 'formspree.io/f/' + match[1];
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

    assert(numeral && numeral.textContent === pad2(issue.week),
      '주 번호 = ' + (numeral && numeral.textContent) + ' (기대: ' + pad2(issue.week) + ')');
    assert(toc && toc.children.length === issue.sections.length,
      '목차 항목 = ' + (toc && toc.children.length) + '개 (데이터: ' + issue.sections.length + '개)');
    assert(progress && progress.textContent === '0 / ' + issue.sections.length,
      '진행률 = ' + (progress && progress.textContent));
    return 'W' + pad2(issue.week) + ' · 목차 ' + toc.children.length + '개 · 진행률 "' + progress.textContent + '"';
  });

  check('표지에 52주 위치와 통계가 함께 보인다', () => {
    const chips = dom.byId.get('issueMeta');

    /* 주제 · 레벨 · 분기 · 섹션 · 분 · 단어 · 퀴즈 = 7개 (발행된 주) */
    assert(chips && chips.children.length === 7, '표지 통계 칩 = ' + (chips && chips.children.length) + '개');

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

    /* 뒤따르는 검사는 기본 언어(한국어)를 전제로 합니다 — 되돌려 둡니다 */
    dom.byId.get('langBtn').dispatch('click');
    assert(dom.documentElement.getAttribute('lang') === 'ko', '한국어로 되돌아오지 않았습니다');

    return '섹션 ' + before + '개 유지, 미번역 키 0개 (en → ko 복귀)';
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

  check('주 선택기에 52주가 모두 있고 다른 주를 열 수 있다', () => {
    const weeks = sandbox.MAGAZINE_WEEKS || [];
    const nav = dom.byId.get('issueNav');

    assert(weeks.length === 52, '주가 ' + weeks.length + '개입니다 (52주 플랜이어야 합니다)');
    assert(nav && nav.children.length === weeks.length, '주 버튼 ' + (nav && nav.children.length) + '개');

    const active = nav.children.filter((b) => b.getAttribute('aria-pressed') === 'true')[0];
    assert(active, '현재 보고 있는 주 표시가 없습니다');

    /* 칩은 W01…W52 로 정렬되어 있지만 MAGAZINE_WEEKS 의 배열 순서는 다릅니다.
       순서가 아니라 data-week 로 짝을 찾습니다. */
    const other = nav.children.filter((b) => b !== active)[0];
    const next = weeks.filter((w) => String(w.week) === other.getAttribute('data-week'))[0];
    assert(next, '칩에 짝이 되는 주 데이터가 없습니다: ' + other.getAttribute('data-week'));
    other.dispatch('click');

    assert(dom.byId.get('issueNumeral').textContent === pad2(next.week),
      '주를 바꿨는데 표지 번호 = ' + dom.byId.get('issueNumeral').textContent);
    assert(JSON.parse(sandbox.localStorage.getItem('monsterlab.issue')) === next.slug,
      '선택한 주가 저장되지 않았습니다');
    assert(dom.byId.get('tocList').children.length === next.sections.length,
      '목차가 새 주 기준으로 다시 그려지지 않았습니다');
    return 'W' + pad2(weeks[0].week) + ' → W' + pad2(next.week) + ' 전환 · 목차 ' + next.sections.length + '개';
  });

  check('1년 플랜에 4분기와 52주가 그려진다', () => {
    const weeks = sandbox.MAGAZINE_WEEKS || [];
    const quarters = sandbox.MAGAZINE_QUARTERS || [];
    const list = dom.byId.get('planList');

    assert(list && list.children.length === quarters.length,
      '플랜 묶음 = ' + (list && list.children.length) + '개 (분기 ' + quarters.length + '개)');

    assert(dom.byId.get('planWeekCount').textContent === '52',
      '주 전체 = ' + dom.byId.get('planWeekCount').textContent);
    assert(dom.byId.get('planPublishedCount').textContent === String(weeks.filter((w) => w.sections && w.sections.length).length),
      '발행된 주 = ' + dom.byId.get('planPublishedCount').textContent);

    /* 분기마다 주가 들어 있고, 발행/예정 표시가 갈라져야 합니다 */
    let planned = 0;
    let published = 0;
    list.children.forEach((quarter) => {
      const grid = (quarter.children || []).filter((c) => c.className === 'plan-grid')[0];
      assert(grid && grid.children.length, '분기에 주가 없습니다');
      grid.children.forEach((item) => {
        if (String(item.className).indexOf('is-planned') > -1) planned++;
        else published++;
      });
    });

    assert(published === 4, '발행으로 표시된 주 = ' + published + '개 (4주여야 합니다)');
    assert(planned === 48, '발행 예정으로 표시된 주 = ' + planned + '개 (48주여야 합니다)');
    return '분기 ' + quarters.length + '개 · 발행 ' + published + '주 · 예정 ' + planned + '주';
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

  /* 아래 두 검사는 주를 바꿔놓으므로 이 블록의 맨 끝에 둡니다 */
  check('예전 호(issue-01) 기록을 주(week-01)로 이어받는다', () => {
    const saved = runPage('index.html', {
      storage: {
        'monsterlab.issue': '"issue-01"',
        'monsterlab.progress': '{"issue-01":["theme-words"]}',
      },
    });

    assert(JSON.parse(saved.sandbox.localStorage.getItem('monsterlab.issue')) === 'week-01',
      '마지막으로 본 주 = ' + saved.sandbox.localStorage.getItem('monsterlab.issue'));

    const progress = JSON.parse(saved.sandbox.localStorage.getItem('monsterlab.progress'));
    assert(progress['week-01'] && progress['week-01'].indexOf('theme-words') > -1,
      '진행률이 이어지지 않았습니다: ' + JSON.stringify(progress));

    return 'issue-01 → week-01 · 진행률 유지';
  });

  check('발행 전인 주는 본문 대신 준비 중 안내를 보여 준다', () => {
    const t = sandbox.MonsterLab.t;
    const nav = dom.byId.get('issueNav');

    nav.children[4].dispatch('click');          /* W05 — 아직 발행 전 */

    const content = dom.byId.get('issueContent');
    const texts = [];
    (function walk(node) {
      if (node.textContent) texts.push(node.textContent);
      (node.children || []).forEach(walk);
    })(content);
    const joined = texts.join(' ');

    assert(dom.byId.get('issueNumeral').textContent === '05',
      '표지 번호 = ' + dom.byId.get('issueNumeral').textContent);
    assert(content.children.length === 1, '본문 영역 = ' + content.children.length + '개 (안내 1개여야 함)');
    assert(joined.indexOf(t('mag.plannedTitle', 'ko')) > -1, '준비 중 안내가 없습니다');
    assert(dom.byId.get('issueProgressText').textContent === t('mag.planned', 'ko'),
      '진행률 = ' + dom.byId.get('issueProgressText').textContent);
    assert(dom.byId.get('tocList').children.length === 1, '목차가 안내 한 줄도 없습니다');
    assert(dom.byId.get('issueDateCover').textContent === 'WEEK 05',
      '표지 주 표시 = ' + dom.byId.get('issueDateCover').textContent);

    return 'W05 · 준비 중 안내 · 진행률 "' + dom.byId.get('issueProgressText').textContent + '"';
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

check('상단 홈 메뉴는 페이지 밖으로 나가지 않는다 (회귀)', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const nav = /<nav class="nav"[\s\S]*?<\/nav>/.exec(html);
  assert(nav, '상단 메뉴(<nav class="nav">)를 찾지 못했습니다');

  const home = /<a href="([^"]+)"[^>]*data-i18n="mag.navHome"/.exec(nav[0]);
  assert(home, '상단 메뉴에 홈 링크가 없습니다');

  /* 예전에는 https://monsterlab.monster 로 나갔습니다 — 이 매거진 안에 머물러야 합니다 */
  assert(home[1].charAt(0) === '#', '상단 홈이 페이지 밖으로 나갑니다: ' + home[1]);

  const id = home[1].slice(1);
  assert(html.indexOf('id="' + id + '"') > -1, home[1] + ' 앵커가 HTML에 없습니다');

  /* 그 앵커는 스크롤 강조 대상에서 빠져 있어야 합니다(늘 켜져 있으면 다른 메뉴가 안 켜집니다) */
  const script = fs.readFileSync(path.join(ROOT, 'script.js'), 'utf8');
  assert(script.indexOf("section.id !== '" + id + "'") > -1,
    '스크롤 강조에서 ' + home[1] + ' 를 빼지 않았습니다');

  return home[1] + ' · 강조 대상 제외 확인';
});

check('확인 문제 보기가 화면 언어를 따라간다', () => {
  const sandbox = vm.createContext(makeSandbox(makeDom('<html></html>'), {}));
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'issues.js'), 'utf8'), sandbox);

  const HANGUL = /[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7A3]/;
  const problems = [];
  let bilingual = 0;

  (sandbox.MAGAZINE_ISSUES || []).forEach((issue) => {
    issue.sections.forEach((section) => {
      (section.quiz || []).forEach((item, qi) => {
        item.options.forEach((option, oi) => {
          const where = issue.slug + '/' + section.id + ' Q' + (qi + 1) + ' 보기 ' + (oi + 1);

          /* 문자열 보기는 그대로 쓰이므로 한국어가 남으면 영어 모드에서 새어 나갑니다 */
          if (typeof option === 'string') {
            if (HANGUL.test(option)) problems.push(where + ' (영어 모드에 한국어가 남습니다)');
            return;
          }

          if (option && option.ko && option.en) { bilingual++; return; }
          problems.push(where + ' (보기는 문자열이거나 ko·en 을 함께 가져야 합니다)');
        });
      });
    });
  });

  assert(problems.length === 0, problems.slice(0, 4).join(' / '));
  return '보기 전부 영어 또는 ko·en (이중 언어 ' + bilingual + '개)';
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
    ['week', 'slug', 'quarter', 'level', 'published', 'theme', 'title', 'summary'].forEach((field) => {
      assert(issue[field] != null, 'W' + issue.week + '에 ' + field + '가 없습니다');
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

  return '발행 ' + issues.length + '주 / 섹션 ' + seen.size + '개 / 항목 ' + items + '개 / 퀴즈 ' + quizzes +
    '개 / 받아쓰기 ' + dictation + '개 / 표 ' + tables + '개';
});

check('52주 플랜 데이터가 온전하다', () => {
  const sandbox = vm.createContext(makeSandbox(makeDom('<html></html>'), {}));
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'issues.js'), 'utf8'), sandbox);

  const weeks = sandbox.MAGAZINE_WEEKS || [];
  const quarters = sandbox.MAGAZINE_QUARTERS || [];
  const published = sandbox.MAGAZINE_ISSUES || [];

  assert(weeks.length === 52, '52주여야 하는데 ' + weeks.length + '주입니다');
  assert(quarters.length === 4, '분기 묶음이 ' + quarters.length + '개입니다 (4개여야 합니다)');

  const numbers = weeks.map((w) => w.week).sort((a, b) => a - b);
  numbers.forEach((n, i) => assert(n === i + 1, '주 번호가 1~52가 아닙니다: ' + numbers.join(', ')));

  const seen = new Set();
  let withSections = 0;

  weeks.forEach((week) => {
    assert(!seen.has(week.slug), '중복 slug: ' + week.slug);
    seen.add(week.slug);

    assert(week.slug === 'week-' + pad2(week.week), 'slug 규칙 오류: ' + week.slug);
    ['theme', 'title', 'summary'].forEach((field) => {
      assert(week[field] && week[field].ko && week[field].en,
        'W' + pad2(week.week) + ' ' + field + '에 ko/en이 필요합니다');
    });
    assert(week.level, 'W' + pad2(week.week) + '에 레벨이 없습니다');
    assert(week.quarter >= 1 && week.quarter <= quarters.length,
      'W' + pad2(week.week) + ' 분기 값 = ' + week.quarter);

    const hasSections = !!(week.sections && week.sections.length);
    if (hasSections) withSections++;

    /* 발행된 주만 본문(sections)을 가지므로 두 값은 항상 함께 움직여야 합니다 */
    assert(hasSections === (week.published != null),
      'W' + pad2(week.week) + ': sections와 published는 함께 있어야 합니다');
  });

  assert(withSections === 4, '본문이 있는 주 = ' + withSections + '주 (1~4주여야 합니다)');
  assert(published.length === 4, '발행된 주 = ' + published.length + '주 (1~4주여야 합니다)');

  /* 5주부터는 아직 구성이 끝나지 않았습니다 */
  const planned = weeks.filter((w) => !(w.sections && w.sections.length));
  assert(planned.length === 48, '발행 전인 주 = ' + planned.length + '주 (48주여야 합니다)');
  assert(planned.every((w) => w.week >= 5), '5주 이전에 발행 전인 주가 있습니다');
  assert(published.every((w) => w.week <= 4), '1~4주만 발행된 상태여야 합니다');

  return '52주 · 분기 ' + quarters.length + ' · 발행 4주 · 예정 48주';
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
/* ── 8. 방문 분석 (Counter.dev) ─────────────────────────────────────── */

/* analytics.js 를 최소 환경에서 실행해, 무엇을 했는지 돌려줍니다.
   실제로 스크립트를 내려받지 않고 주입 시도만 관찰합니다. */
function runAnalytics(env) {
  const appended = [];
  const document = {
    head: { appendChild: (node) => appended.push(node) },
    documentElement: { appendChild: (node) => appended.push(node) },
    createElement: (tag) => ({
      tagName: String(tag).toUpperCase(),
      src: '',
      type: '',
      async: false,
      attrs: {},
      setAttribute(name, value) { this.attrs[name] = String(value); },
    }),
  };
  const location = { protocol: (env && env.protocol) || 'https:' };
  const navigator = { doNotTrack: env && env.dnt };
  const window = {
    ENGMON_COUNTER_ID: env ? env.id : undefined,
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

const COUNTER_ID = '93671ad4-a966-4a52-b48f-56c92d10a671';

check('방문 분석 — 사이트 ID가 없으면 아무 요청도 보내지 않는다', () => {
  const cases = [
    { label: '설정 없음', env: undefined },
    { label: '빈 문자열', env: { id: '' } },
    { label: '공백', env: { id: '   ' } },
    { label: '자리표시자', env: { id: '00000000-0000-0000-0000-000000000000' } },
    { label: '형식 오류(도메인)', env: { id: 'engmon.monster' } },
    { label: '형식 오류(너무 짧음)', env: { id: 'abc' } },
    { label: '형식 오류(하이픈 없음)', env: { id: '93671ad4a9664a52b48f56c92d10a671' } },
    { label: '형식 오류(하이픈 위치)', env: { id: '93671ad4-a966-4a52-b48f-56c92d10a67' } },
  ];

  cases.forEach((c) => {
    const out = runAnalytics(c.env);
    assert(out.appended.length === 0,
      c.label + ': 스크립트를 붙였습니다 — ID를 채우기 전에는 아무 것도 하지 않아야 합니다');
  });

  return cases.length + '가지 경우 모두 무동작';
});

check('방문 분석 — 로컬(file://)·추적 금지에서는 보내지 않는다', () => {
  const blocked = [
    { label: 'file://', env: { id: COUNTER_ID, protocol: 'file:' } },
    { label: 'navigator.doNotTrack', env: { id: COUNTER_ID, dnt: '1' } },
    { label: 'window.doNotTrack', env: { id: COUNTER_ID, windowDnt: '1' } },
  ];

  blocked.forEach((c) => {
    const out = runAnalytics(c.env);
    assert(out.appended.length === 0, c.label + ': 그래도 보냈습니다');
  });

  /* 로컬 확인이 통계에 섞이지 않아야 하고, 브라우저 검증도 조용해야 합니다 */
  return blocked.map((c) => c.label).join(' · ') + ' 차단 확인';
});

check('방문 분석 — Counter.dev 스크립트를 한 번만 부르고 ID를 넘긴다', () => {
  const out = runAnalytics({ id: COUNTER_ID });
  assert(out.appended.length === 1, '스크립트를 붙이지 않았습니다');

  const tag = out.appended[0];
  assert(tag.src === 'https://cdn.counter.dev/script.js',
    'Counter.dev 주소가 다릅니다: ' + tag.src);
  assert(tag.async === true, '스크립트가 async가 아닙니다 — 페이지 표시를 막습니다');

  /* 사이트 ID 와 UTC 시차는 태그의 data-* 속성으로 넘깁니다 */
  assert(tag.attrs['data-id'] === COUNTER_ID,
    '사이트 ID(data-id)가 넘어가지 않았습니다: ' + tag.attrs['data-id']);
  assert(/^-?\d+(\.\d+)?$/.test(tag.attrs['data-utcoffset'] || ''),
    'data-utcoffset 이 숫자가 아닙니다: ' + tag.attrs['data-utcoffset']);

  /* 예전 도구(GA4·Umami·Clarity) 흔적이 남아 있으면 안 됩니다 */
  assert(!out.window.gtag && !out.window.dataLayer && !out.window.umami && !out.window.clarity,
    'GA4/Umami/Clarity 흔적이 남아 있습니다');

  /* 학습 행동을 보내는 호출이 섞여 들어오지 않았는지 — 방문수·유입·국가만 수집 */
  const src = fs.readFileSync(path.join(ROOT, 'analytics.js'), 'utf8');
  assert(!/counter\(\s*['"]event/.test(src), '학습 이벤트를 보내는 코드가 있습니다');
  assert((src.match(/cdn\.counter\.dev\/script\.js/g) || []).length === 1,
    'Counter.dev 주소가 여러 곳에 있습니다');

  return 'script 1회 · async · data-id/data-utcoffset';
});

check('index.html — 방문 분석 스크립트를 한 번만, ID는 한 곳에서 정한다', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const refs = [...html.matchAll(/<script[^>]+src="analytics\.js(\?v=[\w.-]+)?"/g)];
  assert(refs.length === 1, 'analytics.js 참조가 ' + refs.length + '개입니다 (1개여야 합니다)');
  assert(refs[0][1], 'analytics.js 에 ?v= 캐시 무효화 버전이 없습니다');

  const ids = [...html.matchAll(/ENGMON_COUNTER_ID\s*=/g)];
  assert(ids.length === 1, '사이트 ID를 정하는 곳이 ' + ids.length + '곳입니다 (한 곳이어야 합니다)');

  /* 스크립트보다 ID 설정이 먼저 와야 합니다 */
  assert(html.indexOf('ENGMON_COUNTER_ID') < html.indexOf('analytics.js'),
    '사이트 ID 설정이 analytics.js 보다 뒤에 있습니다');
  assert(html.indexOf('ENGMON_CLARITY_ID') === -1, '예전 Clarity 설정이 남아 있습니다');
  assert(html.indexOf('ENGMON_GA4_ID') === -1, '예전 GA4 설정이 남아 있습니다');
  assert(html.indexOf('ENGMON_UMAMI_ID') === -1, '예전 Umami 설정이 남아 있습니다');
  assert(html.indexOf('ENGMON_CF_TOKEN') === -1, '예전 Cloudflare 설정이 남아 있습니다');

  /* 인라인 태그를 직접 붙이면 중복 로드가 됩니다 — analytics.js 가 넣습니다 */
  assert(html.indexOf('counter.dev/script.js') === -1,
    'index.html 에 Counter.dev 스크립트를 직접 넣었습니다');

  return 'analytics.js 1회 · 사이트 ID 1곳';
});

/* ── 결과 ─────────────────────────────────────────────────────────────── */
const pad = (s, n) => String(s) + ' '.repeat(Math.max(0, n - String(s).length));

console.log('\n  스모크 테스트 — ' + path.basename(ROOT) + '\n');
results.forEach(([status, name, detail]) => {
  console.log((status === 'PASS' ? '  ✓' : '  ✗') + ' ' + pad(name, 56) + (detail || ''));
});
console.log('\n  ' + (results.length - failures) + '/' + results.length + ' 통과\n');

process.exit(failures ? 1 : 0);
