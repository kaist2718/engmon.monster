/* ==========================================================================
   EngMon — 호(issue) 페이지 렌더링
   ==========================================================================

   데이터:   issues.js  (MAGAZINE_ISSUES)
   공통기능: script.js  (테마·강조색·언어·토스트, window.MonsterLab)
   이 파일은 "그리기"만 담당합니다. 문구를 바꾸려면 issues.js를 고치세요.

   저장 키 (모두 브라우저 localStorage)
     monsterlab.wordbook   저장한 단어 [{ en, ko, note, section }]
     monsterlab.progress   섹션 완료 { 'issue-01': ['quiz', ...] }
   ========================================================================== */
(function () {
  'use strict';

  var WB_KEY = 'monsterlab.wordbook';
  var PROGRESS_KEY = 'monsterlab.progress';
  var WORDS_PER_MINUTE = 180;

  var KIND_ICONS = {
    vocabulary: '📚',
    grammar: '🧩',
    idioms: '🎭',
    natural: '🗣️',
    conversation: '💬',
    discussion: '🤝',
    culture: '🌍',
    quiz: '✅',
    humor: '😄',
    note: '📝'
  };

  var ISSUES = window.MAGAZINE_ISSUES || [];
  var ISSUE = ISSUES[0];
  var api = window.MonsterLab || {
    t: function (key) { return key; },
    toast: function () {}
  };

  var savedWords = [];
  var doneSections = [];
  var speakingBtn = null;
  var revealObserver = null;
  var activeSectionId = null;

  /* ── 작은 도우미 ────────────────────────────────────────────────────── */
  function lang() {
    return document.documentElement.getAttribute('lang') === 'en' ? 'en' : 'ko';
  }

  function t(key) { return api.t(key); }

  /* { ko, en } 형태에서 현재 언어를 고릅니다. 문자열이면 그대로. */
  function pick(value) {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    if (value[lang()] != null) return value[lang()];
    return value.ko || value.en || '';
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  /* 본문에서 **굵게** 만 지원하는 아주 작은 서식 (내용은 우리가 쓴 것이라 안전) */
  function richText(text) {
    return String(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  }

  function elRich(tag, className, text) {
    var node = el(tag, className);
    node.innerHTML = richText(text);
    return node;
  }

  /* 학습 콘텐츠에 언어를 표시합니다.
     한국어 화면에서도 영어 지문은 화면 낭독기와 브라우저 음성이 영어로 읽습니다. */
  function langTag(node, code) {
    node.setAttribute('lang', code);
    return node;
  }

  function plain(text) { return String(text).replace(/\*\*/g, ''); }

  function pad(n) { return String(n).length < 2 ? '0' + n : String(n); }

  function store(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (raw == null) return fallback;
      var value = JSON.parse(raw);
      return value == null ? fallback : value;
    } catch (e) { return fallback; }
  }

  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* private mode */ }
  }

  function isArray(value) { return Object.prototype.toString.call(value) === '[object Array]'; }

  function byId(id) { return document.getElementById(id); }

  /* ── 읽기 시간·분량 ─────────────────────────────────────────────────── */
  function sectionWords(section) {
    var text = [];

    if (section.intro) text.push(pick(section.intro));
    if (section.body) {
      (section.body[lang()] || section.body.ko || []).forEach(function (p) { text.push(p); });
    }
    (section.items || []).forEach(function (i) { text.push(i.en); });
    (section.dialogue || []).forEach(function (l) { text.push(l.en); });
    (section.questions || []).forEach(function (q) { text.push(q.en); });
    (section.bullets || []).forEach(function (b) { text.push(b.ko); });

    return text.join(' ').split(/\s+/).filter(function (w) { return w.length > 1; }).length;
  }

  function sectionMinutes(section) {
    return Math.max(1, Math.round(sectionWords(section) / WORDS_PER_MINUTE));
  }

  function issueWords() {
    return ISSUE.sections.reduce(function (sum, s) { return sum + sectionWords(s); }, 0);
  }

  /* ── 단어장 ─────────────────────────────────────────────────────────── */
  function loadWordbook() {
    var list = store(WB_KEY, []);
    savedWords = isArray(list) ? list.filter(function (w) { return w && w.en; }) : [];
  }

  function isSaved(en) {
    return savedWords.some(function (w) { return w.en === en; });
  }

  function toggleWord(entry) {
    if (isSaved(entry.en)) {
      savedWords = savedWords.filter(function (w) { return w.en !== entry.en; });
    } else {
      savedWords = savedWords.concat([entry]);
    }
    save(WB_KEY, savedWords);
    renderWordbook();
    updateCounts();
    syncSaveButtons();
  }

  /* ── 섹션 완료 ──────────────────────────────────────────────────────── */
  function progressKey() { return ISSUE ? ISSUE.slug : 'issue'; }

  function loadProgress() {
    var all = store(PROGRESS_KEY, {});
    var list = all && all[progressKey()];
    doneSections = isArray(list) ? list : [];
  }

  function isDone(id) { return doneSections.indexOf(id) > -1; }

  function toggleDone(id) {
    doneSections = isDone(id)
      ? doneSections.filter(function (x) { return x !== id; })
      : doneSections.concat([id]);

    var all = store(PROGRESS_KEY, {});
    all[progressKey()] = doneSections;
    save(PROGRESS_KEY, all);

    renderToc();
    updateProgressUI();
    syncDoneButtons();
  }

  /* ── 듣기 속도 ────────────────────────────────────────────────────── */
  var RATE_KEY = 'monsterlab.rate';
  var RATES = [0.75, 0.92, 1.15];   /* 느리게 · 보통(0.92) · 빠르게 */
  var speechRate = 0.92;

  function setupRate() {
    var buttons = document.querySelectorAll('[data-rate]');
    if (!buttons.length) return;

    var saved = store(RATE_KEY, 0.92);
    speechRate = RATES.indexOf(saved) === -1 ? 0.92 : saved;

    Array.prototype.forEach.call(buttons, function (btn) {
      var rate = parseFloat(btn.getAttribute('data-rate'));

      btn.setAttribute('aria-pressed', rate === speechRate ? 'true' : 'false');

      btn.addEventListener('click', function () {
        speechRate = rate;
        save(RATE_KEY, rate);

        Array.prototype.forEach.call(buttons, function (other) {
          other.setAttribute('aria-pressed', other === btn ? 'true' : 'false');
        });

        api.toast(t('mag.rateSaved'));
      });
    });
  }

  /* ── 오디오 (브라우저 음성합성, 비용 0) ─────────────────────────────── */
  function sectionAudioText(section) {
    var parts = [];

    if (section.intro && section.intro.en) parts.push(plain(section.intro.en));
    (section.body && isArray(section.body.en) ? section.body.en : []).forEach(function (p) {
      parts.push(plain(p));
    });
    (section.items || []).forEach(function (item) { parts.push(item.en); });
    (section.dialogue || []).forEach(function (line) { parts.push(line.who + ': ' + line.en); });

    return parts.join(' ');
  }

  function setSpeaking(btn, on) {
    if (!btn) return;
    btn.classList.toggle('is-on', on);
    btn.textContent = on ? '⏹ ' + t('mag.stop') : '▶ ' + t('mag.listen');
  }

  function speak(btn, text) {
    if (!('speechSynthesis' in window)) {
      api.toast(t('mag.noAudio'));
      return;
    }

    if (speakingBtn === btn) {
      window.speechSynthesis.cancel();
      setSpeaking(btn, false);
      speakingBtn = null;
      return;
    }

    window.speechSynthesis.cancel();
    if (speakingBtn) setSpeaking(speakingBtn, false);

    var utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = speechRate;

    utterance.onend = function () {
      setSpeaking(btn, false);
      if (speakingBtn === btn) speakingBtn = null;
    };

    speakingBtn = btn;
    setSpeaking(btn, true);
    window.speechSynthesis.speak(utterance);
  }

  /* ── 표지 ───────────────────────────────────────────────────────────── */
  function renderCover() {
    var numeral = byId('issueNumeral');
    var dateCover = byId('issueDateCover');
    var themeCover = byId('issueThemeCover');
    var kicker = byId('issueKicker');
    var title = byId('issueTitle');
    var summary = byId('issueSummary');

    if (numeral) numeral.textContent = pad(ISSUE.number);
    if (dateCover) dateCover.textContent = String(ISSUE.date).replace('-', ' · ');
    if (themeCover) themeCover.textContent = pick(ISSUE.theme);
    if (kicker) kicker.textContent = 'ISSUE ' + pad(ISSUE.number);
    if (title) title.textContent = pick(ISSUE.title);
    if (summary) summary.textContent = pick(ISSUE.summary);

    renderCoverMeta();
    updateProgressUI();
    updateResumeButton();
  }

  function renderCoverMeta() {
    var meta = byId('issueMeta');
    if (!meta) return;

    meta.textContent = '';

    function chip(label, value) {
      var li = el('li');
      li.appendChild(el('span', 'chip-label', label));
      li.appendChild(el('span', 'chip-value', value));
      meta.appendChild(li);
    }

    chip(t('mag.theme'), pick(ISSUE.theme));
    chip(t('mag.level'), ISSUE.level);
    chip(t('mag.sections'), String(ISSUE.sections.length));
    chip(t('mag.minutes'), String(issueWords() ? Math.max(1, Math.round(issueWords() / WORDS_PER_MINUTE)) : ISSUE.minutes));
  }

  function updateProgressUI() {
    var total = ISSUE.sections.length;
    var done = doneSections.length;
    var pct = total ? Math.round((done / total) * 100) : 0;

    var text = byId('issueProgressText');
    var fill = byId('issueProgressFill');

    if (text) text.textContent = done + ' / ' + total;
    if (fill) fill.style.width = pct + '%';
  }

  function firstUnfinished() {
    for (var i = 0; i < ISSUE.sections.length; i++) {
      if (!isDone(ISSUE.sections[i].id)) return ISSUE.sections[i];
    }
    return ISSUE.sections[0];
  }

  function updateResumeButton() {
    var btn = byId('resumeBtn');
    if (!btn) return;

    var target = firstUnfinished();
    var label = doneSections.length
      ? t('mag.resume') + ' · ' + pick(target.title)
      : t('mag.startReading');

    btn.href = '#' + target.id;
    btn.textContent = label;
  }

  function updateCounts() {
    var nodes = document.querySelectorAll('[data-wb-count]');
    Array.prototype.forEach.call(nodes, function (node) {
      node.textContent = String(savedWords.length);
    });
  }

  /* ── 목차 ───────────────────────────────────────────────────────────── */
  function renderToc() {
    var list = byId('tocList');
    if (!list) return;

    list.textContent = '';

    ISSUE.sections.forEach(function (section, i) {
      var item = el('li', 'toc-item' + (isDone(section.id) ? ' is-done' : ''));

      var link = el('a', 'toc-link');
      link.href = '#' + section.id;
      link.setAttribute('data-toc-for', section.id);
      link.appendChild(el('span', 'toc-icon', KIND_ICONS[section.kind] || '•'));

      var body = el('span', 'toc-body');
      body.appendChild(el('span', 'toc-title', pick(section.title)));
      body.appendChild(el('span', 'toc-kind', t('mag.kind.' + section.kind) + ' · ' + sectionMinutes(section) + t('mag.minSuffix')));
      link.appendChild(body);

      link.appendChild(el('span', 'toc-check', isDone(section.id) ? '✓' : pad(i + 1)));
      item.appendChild(link);
      list.appendChild(item);
    });

    markActiveToc(activeSectionId);
  }

  function markActiveToc(id) {
    var links = document.querySelectorAll('[data-toc-for]');
    Array.prototype.forEach.call(links, function (link) {
      var on = link.getAttribute('data-toc-for') === id;
      link.classList.toggle('is-active', on);
      if (on) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }

  function setupScrollSpy() {
    if (!('IntersectionObserver' in window)) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        activeSectionId = entry.target.id;
        markActiveToc(activeSectionId);
      });
    }, { rootMargin: '-25% 0px -60% 0px', threshold: 0 });

    Array.prototype.forEach.call(document.querySelectorAll('.m-section'), function (node) {
      observer.observe(node);
    });
  }

  /* ── 읽기 진행 바 (스크롤) ──────────────────────────────────────────── */
  function setupReadBar() {
    var body = byId('issueContent');
    var fill = byId('readBarFill');
    if (!body || !fill) return;

    function update() {
      var top = body.getBoundingClientRect().top + window.scrollY;
      var height = body.offsetHeight;
      var viewport = window.innerHeight;
      var passed = window.scrollY + viewport * 0.35 - top;
      var ratio = height > 0 ? passed / height : 0;

      ratio = ratio < 0 ? 0 : (ratio > 1 ? 1 : ratio);
      fill.style.width = Math.round(ratio * 100) + '%';
    }

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
  }

  /* ── 섹션 그리기 ────────────────────────────────────────────────────── */
  function buildSection(section, index) {
    var wrap = el('section', 'section m-section');
    wrap.id = section.id;
    wrap.setAttribute('data-reveal', '');

    var inner = el('div', 'wrap');
    wrap.appendChild(inner);

    /* 머리말 */
    var head = el('div', 'm-head');
    inner.appendChild(head);

    head.appendChild(el('span', 'm-num' + (isDone(section.id) ? ' is-done' : ''), isDone(section.id) ? '✓' : pad(index + 1)));

    var headMain = el('div', 'm-head-main');
    var kind = el('p', 'm-kind');
    kind.appendChild(el('span', 'm-kind-icon', KIND_ICONS[section.kind] || '•'));
    kind.appendChild(el('span', null, t('mag.kind.' + section.kind)));
    kind.appendChild(el('span', 'm-dot', '·'));
    kind.appendChild(el('span', 'm-level', section.level));
    kind.appendChild(el('span', 'm-dot', '·'));
    kind.appendChild(el('span', null, sectionMinutes(section) + t('mag.minSuffix')));
    headMain.appendChild(kind);
    headMain.appendChild(el('h2', 'm-title', pick(section.title)));
    head.appendChild(headMain);

    var tools = el('div', 'm-tools');

    var audioBtn = el('button', 'm-btn m-audio', '▶ ' + t('mag.listen'));
    audioBtn.type = 'button';
    audioBtn.addEventListener('click', function () {
      speak(audioBtn, sectionAudioText(section));
    });
    tools.appendChild(audioBtn);

    var doneBtn = el('button', 'm-btn');
    doneBtn.type = 'button';
    doneBtn.setAttribute('data-done-for', section.id);
    doneBtn.addEventListener('click', function () { toggleDone(section.id); });
    tools.appendChild(doneBtn);

    head.appendChild(tools);

    if (section.intro) {
      inner.appendChild(langTag(el('p', 'm-intro', pick(section.intro)), lang()));
    }

    /* 본문 문단 */
    if (section.body) {
      var paragraphs = section.body[lang()] || section.body.ko || section.body.en || [];
      var bodyBox = el('div', 'm-body');
      paragraphs.forEach(function (text) {
        bodyBox.appendChild(langTag(elRich('p', null, text), lang()));
      });
      inner.appendChild(bodyBox);
    }

    /* 강조 인용 */
    if (section.quote) {
      var quote = el('blockquote', 'm-quote');
      quote.appendChild(langTag(el('p', null, pick(section.quote)), lang()));
      inner.appendChild(quote);
    }

    /* 저장 버튼이 붙는 어휘·표현 */
    if (section.items && section.items.length) {
      var items = el('ul', 'm-items');
      section.items.forEach(function (entry) {
        var li = el('li', 'm-item');

        var text = el('div', 'm-item-text');
        text.appendChild(langTag(el('span', 'm-item-en', entry.en), 'en'));
        text.appendChild(langTag(el('span', 'm-item-ko', entry.ko), 'ko'));
        if (entry.note) text.appendChild(el('span', 'm-item-note', entry.note));
        li.appendChild(text);

        var saveBtn = el('button', 'm-btn');
        saveBtn.type = 'button';
        saveBtn.setAttribute('data-save-for', entry.en);
        saveBtn.addEventListener('click', function () {
          toggleWord({
            en: entry.en,
            ko: entry.ko,
            note: entry.note || '',
            section: pick(section.title)
          });
        });
        li.appendChild(saveBtn);

        items.appendChild(li);
      });
      inner.appendChild(items);
    }

    /* 저장 버튼 없는 목록 (해설 노트) */
    if (section.bullets && section.bullets.length) {
      var bullets = el('ul', 'm-bullets');
      section.bullets.forEach(function (b) {
        bullets.appendChild(elRich('li', null, pick(b)));
      });
      inner.appendChild(bullets);
    }

    /* 대화문 */
    if (section.dialogue && section.dialogue.length) {
      var dialogue = el('div', 'm-dialogue');
      section.dialogue.forEach(function (line, li) {
        var row = el('div', 'm-line' + (li % 2 ? ' is-right' : ''));
        row.appendChild(el('span', 'm-avatar', String(line.who || '?').charAt(0).toUpperCase()));

        var bubble = el('div', 'm-bubble');
        bubble.appendChild(el('span', 'm-who', line.who));
        bubble.appendChild(langTag(el('span', 'm-bubble-en', line.en), 'en'));
        bubble.appendChild(langTag(el('span', 'm-bubble-ko', line.ko), 'ko'));
        row.appendChild(bubble);

        dialogue.appendChild(row);
      });
      inner.appendChild(dialogue);
    }

    /* 토론 질문 */
    if (section.questions && section.questions.length) {
      var questions = el('ol', 'm-questions');
      section.questions.forEach(function (q) {
        questions.appendChild(langTag(el('li', null, pick(q)), lang()));
      });
      inner.appendChild(questions);
    }

    /* 확인 문제 */
    if (section.quiz && section.quiz.length) {
      var quiz = el('div', 'm-quiz');
      section.quiz.forEach(function (item, qi) {
        quiz.appendChild(buildQuizItem(item, qi));
      });
      inner.appendChild(quiz);
    }

    /* 섹션 끝 — 다음 섹션으로 */
    var next = ISSUE.sections[index + 1];
    var foot = el('div', 'm-foot');

    if (next) {
      var nextLink = el('a', 'm-next');
      nextLink.href = '#' + next.id;
      nextLink.appendChild(el('span', 'm-next-label', t('mag.nextSection')));
      nextLink.appendChild(el('strong', 'm-next-title', pick(next.title)));
      nextLink.appendChild(el('span', 'm-next-arrow', '→'));
      foot.appendChild(nextLink);
    } else {
      var wbLink = el('a', 'm-next');
      wbLink.href = '#wordbook';
      wbLink.appendChild(el('span', 'm-next-label', t('mag.wbKicker')));
      wbLink.appendChild(el('strong', 'm-next-title', t('mag.wbTitle')));
      wbLink.appendChild(el('span', 'm-next-arrow', '→'));
      foot.appendChild(wbLink);
    }

    inner.appendChild(foot);
    return wrap;
  }

  function buildQuizItem(item, index) {
    var box = el('div', 'quiz-item');
    var letters = 'ABCDEFGH';

    var q = langTag(elRich('p', 'quiz-q', pick(item.q)), lang());
    q.insertBefore(el('span', 'quiz-num', String(index + 1)), q.firstChild);
    box.appendChild(q);

    var options = el('div', 'quiz-options');

    item.options.forEach(function (option, oi) {
      var btn = el('button', 'quiz-opt');
      btn.type = 'button';
      btn.appendChild(el('span', 'quiz-letter', letters.charAt(oi) || String(oi + 1)));
      btn.appendChild(langTag(el('span', 'quiz-text', option), 'en'));

      btn.addEventListener('click', function () {
        if (box.getAttribute('data-answered') === 'true') return;
        box.setAttribute('data-answered', 'true');

        var correct = oi === item.answer;
        btn.classList.add(correct ? 'is-correct' : 'is-wrong');

        if (!correct) {
          var right = options.children[item.answer];
          if (right) right.classList.add('is-correct');
        }

        var feedback = el('p', 'quiz-feedback ' + (correct ? 'is-correct' : 'is-wrong'));
        feedback.appendChild(el('span', 'quiz-feedback-icon', correct ? '✓' : '!'));
        feedback.appendChild(langTag(el(
          'span',
          null,
          (correct ? t('mag.quizCorrect') : t('mag.quizWrong')) + ' — ' + pick(item.explain)
        ), lang()));
        box.appendChild(feedback);
      });

      options.appendChild(btn);
    });

    box.appendChild(options);
    return box;
  }

  /* 저장/완료 버튼 상태만 갱신 (본문을 다시 그리지 않음 → 퀴즈 답 보존) */
  function syncSaveButtons() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-save-for]'), function (btn) {
      var on = isSaved(btn.getAttribute('data-save-for'));
      btn.classList.toggle('is-on', on);
      btn.textContent = on ? '✓ ' + t('mag.saved') : '+ ' + t('mag.save');
    });
  }

  function syncDoneButtons() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-done-for]'), function (btn) {
      var on = isDone(btn.getAttribute('data-done-for'));
      btn.classList.toggle('is-on', on);
      btn.textContent = on ? '✓ ' + t('mag.done') : '○ ' + t('mag.markDone');
    });
  }

  function renderContent() {
    var holder = byId('issueContent');
    if (!holder) return;

    holder.textContent = '';

    ISSUE.sections.forEach(function (section, i) {
      holder.appendChild(buildSection(section, i));
    });

    syncSaveButtons();
    syncDoneButtons();
    renderToc();
    applyReveal();
    setupScrollSpy();
  }

  /* ── 단어장 그리기 ──────────────────────────────────────────────────── */
  function renderWordbook() {
    var list = byId('wbList');
    var empty = byId('wbEmpty');
    var actions = byId('wbActions');

    if (!list) return;

    list.textContent = '';

    if (empty) empty.hidden = savedWords.length > 0;
    if (actions) actions.hidden = savedWords.length === 0;

    savedWords.forEach(function (word) {
      var li = el('li', 'wb-item');

      var text = el('div', 'wb-text');
      text.appendChild(langTag(el('span', 'wb-en', word.en), 'en'));
      text.appendChild(langTag(el('span', 'wb-ko', word.ko), 'ko'));
      if (word.note) text.appendChild(el('span', 'wb-note', word.note));
      if (word.section) text.appendChild(el('span', 'wb-from', word.section));
      li.appendChild(text);

      var remove = el('button', 'm-btn', '✕ ' + t('mag.remove'));
      remove.type = 'button';
      remove.addEventListener('click', function () {
        savedWords = savedWords.filter(function (w) { return w.en !== word.en; });
        save(WB_KEY, savedWords);
        renderWordbook();
        updateCounts();
        syncSaveButtons();
      });
      li.appendChild(remove);

      list.appendChild(li);
    });
  }

  function wordbookText() {
    return savedWords.map(function (w) {
      return w.en + ' — ' + w.ko + (w.note ? '  (' + w.note + ')' : '');
    }).join('\n');
  }

  function copyText(text, doneKey) {
    function done() { api.toast(t(doneKey)); }

    function fallback() {
      var area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', 'readonly');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      try { document.execCommand('copy'); done(); } catch (e) { /* ignore */ }
      document.body.removeChild(area);
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else {
      fallback();
    }
  }

  /* ── 스크롤 진입 애니메이션 ─────────────────────────────────────────── */
  function applyReveal() {
    var reduce = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce || !('IntersectionObserver' in window)) return;

    document.documentElement.classList.add('reveal-ready');

    if (revealObserver) revealObserver.disconnect();

    revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -4% 0px' });

    Array.prototype.forEach.call(document.querySelectorAll('[data-reveal]'), function (node) {
      node.classList.add('reveal');
      revealObserver.observe(node);
    });
  }

  /* ── 시작 ───────────────────────────────────────────────────────────── */
  function init() {
    if (!ISSUE) return;

    loadWordbook();
    loadProgress();

    renderCover();
    renderContent();
    renderWordbook();
    updateCounts();
    setupReadBar();
    setupRate();

    /* 언어가 바뀌면 그려진 문구도 다시 그립니다 (script.js가 보내는 이벤트) */
    document.addEventListener('langchange', function () {
      renderCover();
      renderContent();
      renderWordbook();
      updateCounts();
    });

    var copyBtn = byId('wbCopyBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var text = wordbookText();
        if (text) copyText(text, 'mag.wbCopied');
      });
    }

    var clearBtn = byId('wbClearBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        if (!savedWords.length) return;
        if (!window.confirm(t('mag.wbClearConfirm'))) return;

        savedWords = [];
        save(WB_KEY, savedWords);
        renderWordbook();
        updateCounts();
        syncSaveButtons();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
