/* ==========================================================================
   EngMon — 호(issue) 페이지 렌더링과 학습 도구
   ==========================================================================

   데이터:   issues.js  (MAGAZINE_ISSUES)
   공통기능: script.js  (테마·강조색·언어·토스트, window.MonsterLab)
   이 파일은 "그리기와 상호작용"만 담당합니다. 문구를 바꾸려면 issues.js를 고치세요.

   저장 키 (모두 브라우저 localStorage)
     monsterlab.wordbook      저장한 표현 [{ en, ko, note, section }]
     monsterlab.progress      섹션 완료 { 'issue-01': ['quiz', ...] }
     monsterlab.srs           복습 기록 { 'word': { box, due } }
     monsterlab.issue         보고 있는 호 slug
     monsterlab.translation   'on' | 'off'  (한국어 번역 표시)
     monsterlab.rate          듣기 속도

   학습 콘텐츠 표시 원칙
     · 영어 지문은 항상 영어로, UI 문구만 화면 언어를 따릅니다.
     · 한국어 도움말은 .trl 클래스가 붙고, "번역 가리기"로 한 번에 감출 수 있습니다.
     · 오디오는 브라우저 음성합성(speechSynthesis)만 씁니다 — 파일도 비용도 없습니다.
   ========================================================================== */
(function () {
  'use strict';

  var WB_KEY = 'monsterlab.wordbook';
  var PROGRESS_KEY = 'monsterlab.progress';
  var SRS_KEY = 'monsterlab.srs';
  var DAYS_KEY = 'monsterlab.days';
  var DAILY_KEY = 'monsterlab.daily';
  var DAILY_GOAL = 3;                  /* 하루 목표 활동 수 */
  var ISSUE_KEY = 'monsterlab.issue';
  var TR_KEY = 'monsterlab.translation';
  var WORDS_PER_MINUTE = 120;   /* 학습자 기준 조용히 읽는 속도 */

  var KIND_ICONS = {
    vocabulary: '📚',
    phrasal: '🔗',
    collocation: '🧷',
    grammar: '🧩',
    pronunciation: '🔊',
    idioms: '🎭',
    slang: '🕶️',
    natural: '🗣️',
    conversation: '💬',
    listening: '🎧',
    reading: '📖',
    writing: '✍️',
    discussion: '🤝',
    culture: '🌍',
    quiz: '✅',
    humor: '😄',
    note: '📝'
  };

  var RATE_KEY = 'monsterlab.rate';
  var RATES = [0.75, 0.92, 1.15];       /* 느리게 · 보통(0.92) · 빠르게 */
  var speechRate = 0.92;

  var SRS_INTERVALS = [0, 1, 3, 7, 16, 35];   /* 단계별 복습 간격(일) */

  var ISSUES = window.MAGAZINE_ISSUES || [];
  var ISSUE = null;

  var api = window.MonsterLab || {
    t: function (key) { return key; },
    toast: function () {}
  };

  var savedWords = [];
  var doneSections = [];
  var speakingBtn = null;
  var speakQueue = [];
  var currentUtterance = null;
  var revealObserver = null;
  var activeSectionId = null;

  var wbQuery = '';
  var reviewQueue = [];
  var reviewIndex = 0;
  var reviewRevealed = false;

  /* ── 작은 도우미 ────────────────────────────────────────────────────── */
  function lang() {
    return document.documentElement.getAttribute('lang') === 'en' ? 'en' : 'ko';
  }

  function t(key) { return api.t(key); }

  /* { ko, en } 형태에서 화면 언어를 고릅니다. 문자열이면 그대로. */
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

  /* 한국어 도움말 — "번역 가리기"로 한 번에 감출 수 있습니다. */
  function trl(node) {
    node.classList.add('trl');
    return langTag(node, 'ko');
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

  function normSpace(text) { return String(text).replace(/\s+/g, ' ').trim(); }

  /* ── 읽기 시간·분량 ─────────────────────────────────────────────────── */
  function sectionText(section) {
    var text = [];

    if (section.body && isArray(section.body.en)) section.body.en.forEach(function (p) { text.push(p); });
    (section.items || []).forEach(function (i) {
      text.push(i.en);
      if (i.meaning) text.push(i.meaning);
      if (i.example) text.push(i.example);
    });
    (section.dialogue || []).forEach(function (l) { text.push(l.en); });
    (section.questions || []).forEach(function (q) { text.push(q.en || q.ko); });
    (section.bullets || []).forEach(function (b) { text.push(b.en || b.ko); });
    (section.reading || []).forEach(function (p) { text.push(p); });
    (section.quiz || []).forEach(function (q) { text.push(pick(q.q)); });

    return text.join(' ');
  }

  function sectionWords(section) {
    return sectionText(section).split(/\s+/).filter(function (w) { return w.length > 1; }).length;
  }

  /* 읽기 시간만으로는 학습 시간이 안 나옵니다. 항목·받아쓰기·문제를 푸는 시간을
     더해 "실제로 앉아 있어야 하는 시간"에 가깝게 잡습니다. */
  function sectionMinutes(section) {
    var reading = sectionWords(section) / WORDS_PER_MINUTE;
    var practice =
      (section.items ? section.items.length * 0.5 : 0) +
      (section.dialogue ? section.dialogue.length * 0.35 : 0) +
      (section.dictation ? section.dictation.length * 1.2 : 0) +
      (section.quiz ? section.quiz.length * 0.6 : 0) +
      (section.questions ? section.questions.length * 0.4 : 0);

    return Math.max(1, Math.round(reading + practice));
  }

  function issueWords() {
    return ISSUE.sections.reduce(function (sum, s) { return sum + sectionWords(s); }, 0);
  }

  function issueMinutes() {
    return ISSUE.sections.reduce(function (sum, s) { return sum + sectionMinutes(s); }, 0);
  }

  function issueQuizCount() {
    return ISSUE.sections.reduce(function (sum, s) { return sum + (s.quiz ? s.quiz.length : 0); }, 0);
  }

  function issueSentenceCount() {
    return ISSUE.sections.reduce(function (sum, s) {
      return sum + (s.dictation ? s.dictation.length : 0);
    }, 0);
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
    var adding = !isSaved(entry.en);

    savedWords = adding
      ? savedWords.concat([entry])
      : savedWords.filter(function (w) { return w.en !== entry.en; });

    save(WB_KEY, savedWords);
    renderWordbook();
    renderReview();
    updateCounts();
    syncSaveButtons();

    /* 새로 담았을 때만 학습 활동으로 기록합니다 (빼기는 제외) */
    if (adding) markStudy();
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
    var finishing = !isDone(id);

    doneSections = finishing
      ? doneSections.concat([id])
      : doneSections.filter(function (x) { return x !== id; });

    var all = store(PROGRESS_KEY, {});
    all[progressKey()] = doneSections;
    save(PROGRESS_KEY, all);

    renderToc();
    updateProgressUI();
    syncDoneButtons();
    updateResumeButton();

    /* 완료를 취소하는 것은 학습 활동이 아니므로 세지 않습니다 */
    if (finishing) markStudy();
  }

  /* ── 호(issue) 전환 ─────────────────────────────────────────────────── */
  function setIssue(issue, announce) {
    if (!issue) return;

    stopSpeaking();
    ISSUE = issue;
    reviewQueue = [];
    reviewIndex = 0;
    reviewRevealed = false;

    save(ISSUE_KEY, issue.slug);
    loadProgress();

    renderCover();
    renderContent();
    renderWordbook();
    renderReview();
    renderIssueNav();
    updateCounts();

    if (announce) {
      api.toast(t('mag.issueSwitched'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function renderIssueNav() {
    var holder = byId('issueNav');
    if (!holder) return;

    holder.textContent = '';
    if (!ISSUES.length) return;

    ISSUES.forEach(function (issue) {
      var btn = el('button', 'issue-btn' + (issue === ISSUE ? ' is-active' : ''));
      btn.type = 'button';
      btn.setAttribute('aria-pressed', issue === ISSUE ? 'true' : 'false');
      btn.appendChild(el('span', 'issue-btn-num', 'ISSUE ' + pad(issue.number)));
      btn.appendChild(el('span', 'issue-btn-theme', pick(issue.theme)));
      btn.appendChild(el('span', 'issue-btn-meta', String(issue.date).replace('-', '.') + ' · ' + issue.level));
      btn.addEventListener('click', function () {
        if (issue === ISSUE) return;
        setIssue(issue, true);
      });
      holder.appendChild(btn);
    });
  }

  /* ── 듣기 속도 ────────────────────────────────────────────────────── */
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

  /* ── 오디오 (브라우저 음성합성, 비용 0) ───────────────────────────────
     화자 라벨(Front desk / You)은 소리 내어 읽지 않습니다. 대신 화자마다
     음높이와 속도를 조금씩 달리해 누가 말하는지 귀로 구분합니다. */
  function speakableSupported() { return 'speechSynthesis' in window; }

  function englishVoices() {
    if (!speakableSupported() || !window.speechSynthesis.getVoices) return [];

    var voices = window.speechSynthesis.getVoices() || [];
    var english = voices.filter(function (v) { return /^en(-|_|$)/i.test(v.lang || ''); });

    return english.length ? english : voices;
  }

  function speakerKey(who) {
    var name = String(who || '').toLowerCase();
    if (/you|나|손님|guest|customer/.test(name)) return 1;
    if (/front desk|officer|doctor|staff|clerk|면접|직원/.test(name)) return 0;
    if (/friend|동료|colleague|ryan|maya|sam|lee/.test(name)) return 2;
    return 3;
  }

  /* 화자별 목소리·음높이 — 4명까지 구분합니다 */
  var SPEAKER_STYLE = [
    { pitch: 1.0, rate: 1.0 },
    { pitch: 1.18, rate: 1.0 },
    { pitch: 0.88, rate: 1.04 },
    { pitch: 1.08, rate: 0.96 }
  ];

  function applySpeaker(utterance, who) {
    var index = speakerKey(who);
    var style = SPEAKER_STYLE[index % SPEAKER_STYLE.length];
    var voices = englishVoices();

    utterance.pitch = style.pitch;
    utterance.rate = speechRate * style.rate;

    /* 목소리가 여러 개면 화자마다 다른 목소리를 붙여 구분을 더 쉽게 합니다 */
    if (voices.length > 1) {
      var voice = voices[index % Math.min(voices.length, 4)];
      if (voice) { utterance.voice = voice; utterance.lang = voice.lang || 'en-US'; }
    }
  }

  /* 긴 문장을 한 번에 읽으면 브라우저가 중간에 끊습니다. 문장 단위로 자릅니다. */
  function chunkText(text, who, maxLen) {
    var limit = maxLen || 180;
    var sentences = String(text).match(/[^.!?]+[.!?]*/g) || [String(text)];
    var chunks = [];
    var buffer = '';

    sentences.forEach(function (raw) {
      var sentence = normSpace(raw);
      if (!sentence) return;

      if (buffer && (buffer.length + sentence.length) > limit) {
        chunks.push({ text: buffer, who: who });
        buffer = '';
      }

      buffer = buffer ? buffer + ' ' + sentence : sentence;

      /* 한 문장이 너무 길면 그대로 잘라 넣습니다 */
      while (buffer.length > limit) {
        var cut = buffer.lastIndexOf(' ', limit);
        if (cut < 40) cut = limit;
        chunks.push({ text: buffer.slice(0, cut).trim(), who: who });
        buffer = buffer.slice(cut).trim();
      }
    });

    if (buffer) chunks.push({ text: buffer, who: who });
    return chunks;
  }

  function setSpeaking(btn, on) {
    if (!btn) return;
    btn.classList.toggle('is-on', on);
    if (btn.getAttribute('data-icon-only')) return;
    btn.textContent = on ? '⏹ ' + t('mag.stop') : '▶ ' + t('mag.listen');
  }

  function stopSpeaking() {
    if (speakableSupported()) window.speechSynthesis.cancel();
    speakQueue = [];
    currentUtterance = null;
    if (speakingBtn) setSpeaking(speakingBtn, false);
    speakingBtn = null;
  }

  function runQueue() {
    if (!speakQueue.length) {
      if (speakingBtn) setSpeaking(speakingBtn, false);
      speakingBtn = null;
      currentUtterance = null;
      return;
    }

    var item = speakQueue.shift();
    var utterance = new SpeechSynthesisUtterance(item.text);
    utterance.lang = 'en-US';
    applySpeaker(utterance, item.who);

    utterance.onend = function () { if (currentUtterance === utterance) runQueue(); };
    utterance.onerror = function () { if (currentUtterance === utterance) runQueue(); };

    currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  function speakChunks(btn, chunks) {
    if (!speakableSupported()) {
      api.toast(t('mag.noAudio'));
      return;
    }

    if (speakingBtn === btn) { stopSpeaking(); return; }

    stopSpeaking();
    speakQueue = chunks.filter(function (c) { return c && c.text; });
    if (!speakQueue.length) return;

    speakingBtn = btn;
    setSpeaking(btn, true);
    runQueue();
  }

  function speakOne(btn, text, who) {
    speakChunks(btn, chunkText(plain(text), who));
  }

  /* 섹션 전체: 영어 지문만, 대화는 화자 구분을 살려서 */
  function sectionChunks(section) {
    var chunks = [];

    if (section.body && isArray(section.body.en)) {
      section.body.en.forEach(function (p) {
        chunks = chunks.concat(chunkText(plain(p), ''));
      });
    }

    (section.reading || []).forEach(function (p) {
      chunks = chunks.concat(chunkText(plain(p), ''));
    });

    (section.items || []).forEach(function (item) {
      chunks = chunks.concat(chunkText(item.en, ''));
    });

    (section.dialogue || []).forEach(function (line) {
      chunks = chunks.concat(chunkText(line.en, line.who));
    });

    (section.questions || []).forEach(function (q) {
      chunks = chunks.concat(chunkText(q.en || q.ko, ''));
    });

    return chunks;
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
    chip(t('mag.minutes'), String(issueMinutes()));
    chip(t('mag.words'), String(issueWords()));
    chip(t('mag.kind.quiz'), String(issueQuizCount()));
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
      speakChunks(audioBtn, sectionChunks(section));
    });
    tools.appendChild(audioBtn);

    var doneBtn = el('button', 'm-btn');
    doneBtn.type = 'button';
    doneBtn.setAttribute('data-done-for', section.id);
    doneBtn.addEventListener('click', function () { toggleDone(section.id); });
    tools.appendChild(doneBtn);

    head.appendChild(tools);

    var hasContent = false;

    if (section.intro) {
      inner.appendChild(el('p', 'm-intro', pick(section.intro)));
      hasContent = true;
    }

    /* 본문 문단 — 영어가 본문, 한국어는 접었다 펼 수 있는 번역 */
    if (section.body) {
      hasContent = true;
      var bodyBox = el('div', 'm-body');
      var enParagraphs = isArray(section.body.en) ? section.body.en : [];
      enParagraphs.forEach(function (text) {
        bodyBox.appendChild(langTag(elRich('p', null, text), 'en'));
      });
      inner.appendChild(bodyBox);

      var koParagraphs = isArray(section.body.ko) ? section.body.ko : [];
      if (koParagraphs.length) inner.appendChild(buildTrlBlock(koParagraphs));
    }

    /* 독해 지문 (영어 단락 전용) */
    if (section.reading && section.reading.length) {
      hasContent = true;
      var reading = el('div', 'm-reading');
      section.reading.forEach(function (p) {
        reading.appendChild(langTag(elRich('p', null, p), 'en'));
      });
      inner.appendChild(reading);
    }

    /* 강조 인용 */
    if (section.quote) {
      hasContent = true;
      var quote = el('blockquote', 'm-quote');
      var quoteEn = typeof section.quote === 'string'
        ? section.quote
        : (section.quote.en || section.quote.ko);
      quote.appendChild(langTag(el('p', 'm-quote-en', plain(quoteEn)), 'en'));
      if (section.quote.ko && section.quote.en) {
        quote.appendChild(trl(el('p', 'm-quote-ko', section.quote.ko)));
      }
      inner.appendChild(quote);
    }

    /* 저장 버튼이 붙는 어휘·표현 */
    if (section.items && section.items.length) {
      hasContent = true;
      var items = el('ul', 'm-items');
      section.items.forEach(function (entry) {
        var li = el('li', 'm-item');

        var text = el('div', 'm-item-text');

        var top = el('div', 'm-item-top');
        top.appendChild(langTag(el('span', 'm-item-en', entry.en), 'en'));
        text.appendChild(top);

        if (entry.ko) text.appendChild(trl(el('span', 'm-item-ko', entry.ko)));
        if (entry.meaning) text.appendChild(langTag(el('span', 'm-item-meaning', entry.meaning), 'en'));
        if (entry.example) text.appendChild(langTag(el('span', 'm-item-example', entry.example), 'en'));
        if (entry.note) text.appendChild(el('span', 'm-item-note', entry.note));
        li.appendChild(text);

        var actions = el('div', 'm-item-actions');

        var playBtn = el('button', 'm-btn m-btn--icon');
        playBtn.type = 'button';
        playBtn.setAttribute('data-icon-only', '1');
        playBtn.setAttribute('aria-label', t('mag.playWord'));
        playBtn.setAttribute('title', t('mag.playWord'));
        playBtn.textContent = '🔊';
        playBtn.addEventListener('click', function () { speakOne(playBtn, entry.en, ''); });
        actions.appendChild(playBtn);

        var saveBtn = el('button', 'm-btn');
        saveBtn.type = 'button';
        saveBtn.setAttribute('data-save-for', entry.en);
        saveBtn.addEventListener('click', function () {
          toggleWord({
            en: entry.en,
            ko: entry.ko || '',
            note: entry.note || '',
            section: pick(section.title)
          });
        });
        actions.appendChild(saveBtn);

        li.appendChild(actions);
        items.appendChild(li);
      });
      inner.appendChild(items);
    }

    /* 저장 버튼 없는 목록 (해설 노트) */
    if (section.bullets && section.bullets.length) {
      hasContent = true;
      var bullets = el('ul', 'm-bullets');
      section.bullets.forEach(function (b) {
        var li = el('li');
        li.appendChild(langTag(elRich('span', 'm-bullet-en', b.en || b.ko), 'en'));
        if (b.ko && b.en) li.appendChild(trl(el('span', 'm-bullet-ko', b.ko)));
        bullets.appendChild(li);
      });
      inner.appendChild(bullets);
    }

    /* 표 (불규칙 동사, 격식 단계 등) */
    if (section.table) {
      hasContent = true;
      inner.appendChild(buildTable(section.table));
    }

    /* 대화문 */
    if (section.dialogue && section.dialogue.length) {
      hasContent = true;

      var dialogueTools = el('div', 'm-dialogue-tools');
      var allBtn = el('button', 'm-btn m-audio', '▶ ' + t('mag.playAll'));
      allBtn.type = 'button';
      allBtn.addEventListener('click', function () {
        var chunks = [];
        section.dialogue.forEach(function (line) {
          chunks = chunks.concat(chunkText(line.en, line.who));
        });
        speakChunks(allBtn, chunks);
      });
      dialogueTools.appendChild(allBtn);
      inner.appendChild(dialogueTools);

      var dialogue = el('div', 'm-dialogue');
      section.dialogue.forEach(function (line, li) {
        var row = el('div', 'm-line' + (li % 2 ? ' is-right' : ''));
        row.appendChild(el('span', 'm-avatar', String(line.who || '?').charAt(0).toUpperCase()));

        var bubble = el('div', 'm-bubble');

        var bubbleHead = el('div', 'm-bubble-head');
        bubbleHead.appendChild(el('span', 'm-who', line.who));

        var linePlay = el('button', 'm-bubble-play');
        linePlay.type = 'button';
        linePlay.setAttribute('aria-label', t('mag.playLine'));
        linePlay.setAttribute('title', t('mag.playLine'));
        linePlay.textContent = '🔊';
        linePlay.addEventListener('click', function () { speakOne(linePlay, line.en, line.who); });
        bubbleHead.appendChild(linePlay);

        bubble.appendChild(bubbleHead);
        bubble.appendChild(langTag(el('span', 'm-bubble-en', line.en), 'en'));
        if (line.ko) bubble.appendChild(trl(el('span', 'm-bubble-ko', line.ko)));
        row.appendChild(bubble);

        dialogue.appendChild(row);
      });
      inner.appendChild(dialogue);
    }

    /* 토론 질문 */
    if (section.questions && section.questions.length) {
      hasContent = true;
      var questions = el('ol', 'm-questions');
      section.questions.forEach(function (q) {
        var li = el('li');
        li.appendChild(langTag(el('span', 'm-q-en', q.en || q.ko), 'en'));
        if (q.ko && q.en) li.appendChild(trl(el('span', 'm-q-ko', q.ko)));
        questions.appendChild(li);
      });
      inner.appendChild(questions);
    }

    /* 받아쓰기 */
    if (section.dictation && section.dictation.length) {
      hasContent = true;
      inner.appendChild(buildDictation(section.dictation));
    }

    /* 확인 문제 */
    if (section.quiz && section.quiz.length) {
      hasContent = true;
      inner.appendChild(buildQuiz(section.quiz));
    }

    if (!hasContent) inner.appendChild(el('p', 'm-empty', t('mag.emptySection')));

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
      var reviewLink = el('a', 'm-next');
      reviewLink.href = '#review';
      reviewLink.appendChild(el('span', 'm-next-label', t('mag.reviewKicker')));
      reviewLink.appendChild(el('strong', 'm-next-title', t('mag.reviewTitle')));
      reviewLink.appendChild(el('span', 'm-next-arrow', '→'));
      foot.appendChild(reviewLink);
    }

    inner.appendChild(foot);
    return wrap;
  }

  function buildTrlBlock(paragraphs) {
    var box = el('div', 'm-trl');
    var label = el('p', 'm-trl-label', lang() === 'en' ? 'Translation' : '한국어 해설');
    box.appendChild(label);
    paragraphs.forEach(function (text) {
      box.appendChild(langTag(elRich('p', 'm-trl-text', text), 'ko'));
    });
    return trl(box);
  }

  function buildTable(table) {
    var box = el('div', 'm-table-box');
    var scroll = el('div', 'm-table-wrap');
    var node = el('table', 'm-table');

    if (table.caption) {
      var caption = el('caption', 'm-table-caption', pick(table.caption));
      node.appendChild(caption);
    }

    if (table.head && table.head.length) {
      var thead = el('thead');
      var headRow = el('tr');
      table.head.forEach(function (cell) { headRow.appendChild(el('th', null, pick(cell))); });
      thead.appendChild(headRow);
      node.appendChild(thead);
    }

    if (table.rows && table.rows.length) {
      var tbody = el('tbody');
      table.rows.forEach(function (row) {
        var tr = el('tr');
        row.forEach(function (cell, i) { tr.appendChild(el(i === 0 ? 'th' : 'td', i === 0 ? 'm-table-key' : null, pick(cell))); });
        tbody.appendChild(tr);
      });
      node.appendChild(tbody);
    }

    scroll.appendChild(node);
    box.appendChild(scroll);
    return box;
  }

  /* ── 받아쓰기 ───────────────────────────────────────────────────────── */
  function stripPunctuation(text) {
    return String(text).toLowerCase()
      .replace(/[’']/g, "'")
      .replace(/[^a-z0-9' ]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function buildDictation(list) {
    var box = el('div', 'dict');

    list.forEach(function (item, i) {
      var row = el('div', 'dict-item');

      var head = el('div', 'dict-head');
      head.appendChild(el('span', 'dict-num', String(i + 1)));

      var play = el('button', 'm-btn m-audio');
      play.type = 'button';
      play.textContent = '▶ ' + t('mag.listen');
      play.addEventListener('click', function () { speakOne(play, item.en, item.who); });
      head.appendChild(play);
      row.appendChild(head);

      var input = el('input', 'dict-input');
      input.type = 'text';
      input.setAttribute('lang', 'en');
      input.setAttribute('autocomplete', 'off');
      input.setAttribute('autocapitalize', 'off');
      input.setAttribute('spellcheck', 'false');
      input.setAttribute('placeholder', t('mag.youTyped'));
      row.appendChild(input);

      var actions = el('div', 'dict-actions');

      var checkBtn = el('button', 'm-btn', t('mag.check'));
      checkBtn.type = 'button';
      actions.appendChild(checkBtn);

      var revealBtn = el('button', 'm-btn', t('mag.reveal'));
      revealBtn.type = 'button';
      actions.appendChild(revealBtn);

      row.appendChild(actions);

      var result = el('div', 'dict-result');
      result.hidden = true;
      row.appendChild(result);

      /* kind: ok | bad | reveal — 한 곳에서만 결과 영역을 다시 그립니다.
         (예전에는 안내 문구를 먼저 붙이고 정답을 그리면서 지워지는 버그가 있었습니다) */
      function showResult(kind, wrongWords) {
        result.hidden = false;
        result.textContent = '';

        if (kind === 'ok') {
          row.classList.add('is-correct');
          row.classList.remove('is-wrong');
          result.appendChild(el('p', 'dict-ok', '✓ ' + t('mag.correct')));
          return;
        }

        if (kind === 'bad') {
          row.classList.add('is-wrong');
          row.classList.remove('is-correct');
          result.appendChild(el('p', 'dict-bad', '! ' + t('mag.incorrect')));
        }

        var answer = el('p', 'dict-answer');
        answer.appendChild(el('span', 'dict-answer-label', t('mag.answerIs') + ': '));

        /* 틀린 단어는 강조해서 보여줍니다 */
        var answerWords = plain(item.en).split(/\s+/);
        answerWords.forEach(function (word, wi) {
          var token = el('span', 'dict-word' + (wrongWords && wrongWords.indexOf(word.toLowerCase().replace(/[^a-z']/g, '')) > -1 ? ' is-miss' : ''), word);
          token.setAttribute('lang', 'en');
          answer.appendChild(token);
          answer.appendChild(document.createTextNode(' '));
        });
        result.appendChild(answer);

        if (item.ko) result.appendChild(trl(el('p', 'dict-ko', item.ko)));
      }

      checkBtn.addEventListener('click', function () {
        var typed = stripPunctuation(input.value);
        if (!typed) { api.toast(t('mag.typeFirst')); return; }

        var target = stripPunctuation(item.en);
        if (typed === target) { showResult('ok'); markStudy(); return; }

        /* 틀린 단어 추출 — 정답에 있는데 내가 쓰지 않은 단어 */
        var typedWords = typed.split(' ');
        var missed = target.split(' ').filter(function (w) { return typedWords.indexOf(w) === -1; });
        showResult('bad', missed);
      });

      revealBtn.addEventListener('click', function () { showResult('reveal'); });

      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') checkBtn.click();
      });

      box.appendChild(row);
    });

    return box;
  }

  /* ── 확인 문제 (즉시 채점 + 점수 + 다시 풀기) ─────────────────────── */
  function buildQuiz(list) {
    var box = el('div', 'm-quiz');
    var letters = 'ABCDEFGH';
    var answered = 0;
    var score = 0;
    var items = [];

    var summary = el('div', 'quiz-summary');
    summary.hidden = true;

    function refreshSummary() {
      if (answered < list.length) { summary.hidden = true; return; }

      summary.hidden = false;
      summary.textContent = '';

      var text = el('p', 'quiz-summary-text');
      text.appendChild(el('span', 'quiz-summary-score', score + ' / ' + list.length));
      text.appendChild(el('span', null, ' ' + t('mag.quizScore')));
      summary.appendChild(text);

      var actions = el('div', 'quiz-summary-actions');
      var retry = el('button', 'm-btn m-audio', '↺ ' + t('mag.quizRetry'));
      retry.type = 'button';
      retry.addEventListener('click', function () {
        answered = 0;
        score = 0;
        items.forEach(function (reset) { reset(); });
        refreshSummary();
      });
      actions.appendChild(retry);
      summary.appendChild(actions);
    }

    list.forEach(function (item, qi) {
      var row = el('div', 'quiz-item');

      var q = langTag(elRich('p', 'quiz-q', item.q.en || pick(item.q)), 'en');
      q.insertBefore(el('span', 'quiz-num', String(qi + 1)), q.firstChild);
      row.appendChild(q);

      if (item.q.en && item.q.ko) row.appendChild(trl(elRich('p', 'quiz-q-ko', item.q.ko)));

      var options = el('div', 'quiz-options');
      var feedback = null;

      var optionButtons = [];

      item.options.forEach(function (option, oi) {
        var btn = el('button', 'quiz-opt');
        btn.type = 'button';
        btn.appendChild(el('span', 'quiz-letter', letters.charAt(oi) || String(oi + 1)));
        btn.appendChild(langTag(el('span', 'quiz-text', option), 'en'));

        btn.addEventListener('click', function () {
          if (row.getAttribute('data-answered') === 'true') return;
          row.setAttribute('data-answered', 'true');

          var correct = oi === item.answer;
          btn.classList.add(correct ? 'is-correct' : 'is-wrong');
          answered++;
          if (correct) score++;

          if (!correct) {
            var right = options.children[item.answer];
            if (right) right.classList.add('is-correct');
          }

          feedback = el('div', 'quiz-feedback ' + (correct ? 'is-correct' : 'is-wrong'));
          feedback.appendChild(el('span', 'quiz-feedback-icon', correct ? '✓' : '!'));
          feedback.appendChild(langTag(el(
            'span',
            null,
            (correct ? t('mag.quizCorrect') : t('mag.quizWrong')) + ' — ' + (item.explain.en || pick(item.explain))
          ), 'en'));
          row.appendChild(feedback);

          if (item.explain.ko && item.explain.en) row.appendChild(trl(el('p', 'quiz-explain-ko', item.explain.ko)));

          refreshSummary();
          markStudy();
        });

        optionButtons.push(btn);
        options.appendChild(btn);
      });

      row.appendChild(options);

      items.push(function reset() {
        row.removeAttribute('data-answered');
        row.classList.remove('is-correct', 'is-wrong');
        optionButtons.forEach(function (btn) { btn.classList.remove('is-correct', 'is-wrong'); });
        if (feedback && feedback.parentNode) feedback.parentNode.removeChild(feedback);
        feedback = null;
        var trailing = row.querySelectorAll('.trl');
        Array.prototype.forEach.call(trailing, function (node) {
          if (node.parentNode) node.parentNode.removeChild(node);
        });
      });

      box.appendChild(row);
    });

    box.appendChild(summary);
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
  function filteredWords() {
    if (!wbQuery) return savedWords;
    var q = wbQuery.toLowerCase();
    return savedWords.filter(function (w) {
      return (w.en + ' ' + (w.ko || '') + ' ' + (w.note || '')).toLowerCase().indexOf(q) > -1;
    });
  }

  function renderWordbook() {
    var list = byId('wbList');
    var empty = byId('wbEmpty');
    var noMatch = byId('wbNoMatch');
    if (!list) return;

    list.textContent = '';

    var words = filteredWords();

    if (empty) empty.hidden = savedWords.length > 0;
    if (noMatch) noMatch.hidden = !(savedWords.length > 0 && words.length === 0);

    words.forEach(function (word) {
      var li = el('li', 'wb-item');

      var text = el('div', 'wb-text');
      text.appendChild(langTag(el('span', 'wb-en', word.en), 'en'));
      if (word.ko) text.appendChild(trl(el('span', 'wb-ko', word.ko)));
      if (word.note) text.appendChild(el('span', 'wb-note', word.note));
      if (word.section) text.appendChild(el('span', 'wb-from', word.section));
      li.appendChild(text);

      var actions = el('div', 'wb-actions-row');

      var play = el('button', 'm-btn m-btn--icon');
      play.type = 'button';
      play.setAttribute('data-icon-only', '1');
      play.setAttribute('aria-label', t('mag.playWord'));
      play.setAttribute('title', t('mag.playWord'));
      play.textContent = '🔊';
      play.addEventListener('click', function () { speakOne(play, word.en, ''); });
      actions.appendChild(play);

      var remove = el('button', 'm-btn', '✕ ' + t('mag.remove'));
      remove.type = 'button';
      remove.addEventListener('click', function () {
        savedWords = savedWords.filter(function (w) { return w.en !== word.en; });
        save(WB_KEY, savedWords);
        renderWordbook();
        renderReview();
        updateCounts();
        syncSaveButtons();
      });
      actions.appendChild(remove);

      li.appendChild(actions);
      list.appendChild(li);
    });
  }

  function wordbookText() {
    return savedWords.map(function (w) {
      return w.en + ' — ' + w.ko + (w.note ? '  (' + w.note + ')' : '');
    }).join('\n');
  }

  function csvCell(value) {
    var text = String(value == null ? '' : value).replace(/"/g, '""');
    return '"' + text + '"';
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

  /* ── 학습 리듬 (오늘의 활동 + 연속 학습일) ─────────────────────────── */
  function dateKey(date) {
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
  }

  function loadDays() {
    var days = store(DAYS_KEY, []);
    return isArray(days) ? days.filter(function (d) { return typeof d === 'string'; }) : [];
  }

  function todayCount() {
    var daily = store(DAILY_KEY, null);
    return daily && daily.date === dateKey(new Date()) ? daily.count : 0;
  }

  /* 학습으로 인정하는 행동(섹션 완료·단어 저장·문제 풀이·복습)을 할 때마다 기록합니다. */
  function markStudy() {
    var today = dateKey(new Date());

    var days = loadDays();
    if (days.indexOf(today) === -1) save(DAYS_KEY, days.concat([today]));

    var daily = store(DAILY_KEY, null);
    if (!daily || daily.date !== today) daily = { date: today, count: 0 };
    daily.count += 1;
    save(DAILY_KEY, daily);

    renderDaily();
    if (daily.count === DAILY_GOAL) api.toast(t('mag.dailyGoalReached'));
  }

  function streakOf(days) {
    var set = {};
    days.forEach(function (d) { set[d] = true; });

    var cursor = new Date();
    /* 오늘 아직 안 했으면 어제부터 셉니다 (하루가 지나도 연속이 끊기지 않게) */
    if (!set[dateKey(cursor)]) cursor.setDate(cursor.getDate() - 1);

    var streak = 0;
    while (set[dateKey(cursor)]) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  function bestStreakOf(days) {
    var sorted = days.slice().sort();
    var best = 0;
    var run = 0;
    var prev = null;

    sorted.forEach(function (day) {
      if (prev) {
        var next = new Date(prev + 'T00:00:00');
        next.setDate(next.getDate() + 1);
        run = dateKey(next) === day ? run + 1 : 1;
      } else {
        run = 1;
      }
      if (run > best) best = run;
      prev = day;
    });

    return best;
  }

  function renderDaily() {
    var days = loadDays();
    var count = todayCount();
    var streak = streakOf(days);

    var countEl = byId('dailyCount');
    var goalEl = byId('dailyGoal');
    var fillEl = byId('dailyFill');
    var streakEl = byId('streakCount');
    var bestEl = byId('bestStreak');
    var dots = byId('dailyDots');

    if (countEl) countEl.textContent = String(count);
    if (goalEl) goalEl.textContent = String(DAILY_GOAL);
    if (fillEl) fillEl.style.width = Math.min(100, Math.round((count / DAILY_GOAL) * 100)) + '%';
    if (streakEl) streakEl.textContent = String(streak);
    if (bestEl) bestEl.textContent = String(Math.max(bestStreakOf(days), streak));

    if (!dots) return;
    dots.textContent = '';

    var set = {};
    days.forEach(function (d) { set[d] = true; });

    for (var i = 6; i >= 0; i--) {
      var date = new Date();
      date.setDate(date.getDate() - i);
      var key = dateKey(date);

      var dot = el('span', 'daily-dot' + (set[key] ? ' is-on' : '') + (i === 0 ? ' is-today' : ''));
      dot.setAttribute('title', key);
      dot.setAttribute('aria-label', key);
      dots.appendChild(dot);
    }
  }

  /* ── 파일 저장 · 백업 · 복원 ───────────────────────────────────── */
  function download(filename, text, mime) {
    var blob = new Blob([text], { type: (mime || 'text/plain') + ';charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function exportCsv() {
    if (!savedWords.length) { api.toast(t('mag.exportEmpty')); return; }

    var rows = [['expression', 'meaning', 'note', 'section']];
    savedWords.forEach(function (w) {
      rows.push([w.en, w.ko || '', w.note || '', w.section || '']);
    });

    var csv = '\ufeff' + rows.map(function (row) {
      return row.map(csvCell).join(',');
    }).join('\r\n');

    try {
      download('engmon-wordbook.csv', csv, 'text/csv');
      api.toast(t('mag.exported'));
    } catch (e) {
      copyText(wordbookText(), 'mag.wbCopied');
    }
  }

  /* 단어장·복습 기록·진행률·학습일을 한 파일로 묶어 둡니다 (기기 이동·브라우저 초기화 대비) */
  function backupAll() {
    var payload = {
      app: 'EngMon',
      version: 1,
      exportedAt: new Date().toISOString(),
      wordbook: savedWords,
      srs: loadSrs(),
      progress: store(PROGRESS_KEY, {}),
      days: loadDays()
    };

    try {
      download('engmon-backup.json', JSON.stringify(payload, null, 2), 'application/json');
      api.toast(t('mag.backupDone'));
    } catch (e) {
      api.toast(t('mag.restoreFailed'));
    }
  }

  function restoreAll(file) {
    if (!file) return;
    if (typeof FileReader === 'undefined') { api.toast(t('mag.restoreFailed')); return; }

    var reader = new FileReader();

    reader.onerror = function () { api.toast(t('mag.restoreFailed')); };

    reader.onload = function () {
      var data;
      try { data = JSON.parse(String(reader.result)); } catch (e) { data = null; }
      if (!data || typeof data !== 'object') { api.toast(t('mag.restoreFailed')); return; }

      if (isArray(data.wordbook)) {
        data.wordbook.forEach(function (w) {
          if (w && w.en && !isSaved(w.en)) savedWords = savedWords.concat([w]);
        });
        save(WB_KEY, savedWords);
      }

      if (data.srs && typeof data.srs === 'object') {
        var srs = loadSrs();
        Object.keys(data.srs).forEach(function (key) {
          if (!srs[key]) srs[key] = data.srs[key];
        });
        save(SRS_KEY, srs);
      }

      if (data.progress && typeof data.progress === 'object') {
        var all = store(PROGRESS_KEY, {});
        Object.keys(data.progress).forEach(function (slug) {
          var mine = isArray(all[slug]) ? all[slug].slice() : [];
          var theirs = isArray(data.progress[slug]) ? data.progress[slug] : [];
          theirs.forEach(function (id) { if (mine.indexOf(id) === -1) mine.push(id); });
          all[slug] = mine;
        });
        save(PROGRESS_KEY, all);
      }

      if (isArray(data.days)) {
        var days = loadDays();
        data.days.forEach(function (day) {
          if (typeof day === 'string' && days.indexOf(day) === -1) days.push(day);
        });
        save(DAYS_KEY, days);
      }

      loadProgress();
      renderCover();
      renderContent();
      renderWordbook();
      renderReview();
      renderDaily();
      updateCounts();
      api.toast(t('mag.restoreDone'));
    };

    reader.readAsText(file);
  }

  /* ── 복습 카드 (간격 반복) ──────────────────────────────────────────── */
  function loadSrs() {
    var data = store(SRS_KEY, {});
    return data && typeof data === 'object' ? data : {};
  }

  function dueWords() {
    var srs = loadSrs();
    var now = Date.now();

    return savedWords.filter(function (w) {
      var rec = srs[w.en];
      if (!rec || rec.due == null) return true;
      return rec.due <= now;
    });
  }

  function gradeCard(word, known) {
    var srs = loadSrs();
    var rec = srs[word.en] || { box: 0 };
    var box = known ? Math.min(rec.box + 1, SRS_INTERVALS.length - 1) : 0;
    var days = SRS_INTERVALS[box];

    srs[word.en] = { box: box, due: Date.now() + days * 24 * 60 * 60 * 1000 };
    save(SRS_KEY, srs);
    markStudy();
  }

  function renderReview() {
    var stage = byId('reviewStage');
    if (!stage) return;

    stage.textContent = '';

    var due = dueWords();
    var pill = byId('reviewDueCount');
    if (pill) pill.textContent = String(due.length);

    if (!savedWords.length) {
      stage.appendChild(el('p', 'review-empty', t('mag.reviewEmpty')));
      return;
    }

    if (!reviewQueue.length) {
      if (!due.length) {
        stage.appendChild(el('p', 'review-empty', t('mag.reviewDone')));
        return;
      }

      var start = el('div', 'review-start');
      start.appendChild(el('p', 'review-count', due.length + ' / ' + savedWords.length + ' ' + t('mag.reviewDue')));
      var startBtn = el('button', 'btn btn-primary', t('mag.reviewStart'));
      startBtn.type = 'button';
      startBtn.addEventListener('click', function () {
        reviewQueue = due.slice(0, 20);
        reviewIndex = 0;
        reviewRevealed = false;
        renderReview();
      });
      start.appendChild(startBtn);
      stage.appendChild(start);
      return;
    }

    if (reviewIndex >= reviewQueue.length) {
      var done = el('div', 'review-done');
      done.appendChild(el('p', 'review-done-text', t('mag.reviewDone')));
      var again = el('button', 'btn btn-ghost', t('mag.reviewStart'));
      again.type = 'button';
      again.addEventListener('click', function () {
        reviewQueue = dueWords().slice(0, 20);
        reviewIndex = 0;
        reviewRevealed = false;
        renderReview();
      });
      done.appendChild(again);
      stage.appendChild(done);
      return;
    }

    var word = reviewQueue[reviewIndex];

    var card = el('div', 'review-card');

    var meta = el('div', 'review-meta');
    meta.appendChild(el('span', null, t('mag.reviewCard') + ' ' + (reviewIndex + 1) + ' / ' + reviewQueue.length));

    var play = el('button', 'm-btn m-btn--icon');
    play.type = 'button';
    play.setAttribute('data-icon-only', '1');
    play.setAttribute('aria-label', t('mag.playWord'));
    play.setAttribute('title', t('mag.playWord'));
    play.textContent = '🔊';
    play.addEventListener('click', function () { speakOne(play, word.en, ''); });
    meta.appendChild(play);
    card.appendChild(meta);

    card.appendChild(langTag(el('p', 'review-face-en', word.en), 'en'));

    if (reviewRevealed) {
      if (word.ko) card.appendChild(trl(el('p', 'review-face-ko', word.ko)));
      if (word.note) card.appendChild(el('p', 'review-face-note', word.note));
    }

    var actions = el('div', 'review-actions');

    if (!reviewRevealed) {
      var flip = el('button', 'btn btn-primary', t('mag.reviewFlip'));
      flip.type = 'button';
      flip.addEventListener('click', function () {
        reviewRevealed = true;
        renderReview();
      });
      actions.appendChild(flip);
    } else {
      var know = el('button', 'btn btn-primary', t('mag.reviewKnow'));
      know.type = 'button';
      know.addEventListener('click', function () {
        gradeCard(word, true);
        reviewIndex++;
        reviewRevealed = false;
        renderReview();
      });
      actions.appendChild(know);

      var again2 = el('button', 'btn btn-ghost', t('mag.reviewAgain'));
      again2.type = 'button';
      again2.addEventListener('click', function () {
        gradeCard(word, false);
        reviewIndex++;
        reviewRevealed = false;
        renderReview();
      });
      actions.appendChild(again2);
    }

    card.appendChild(actions);
    stage.appendChild(card);
  }

  /* ── 번역 가리기 ────────────────────────────────────────────────────── */
  function setupTranslation() {
    var root = document.documentElement;
    var buttons = document.querySelectorAll('[data-tr-toggle]');
    if (!buttons.length) return;

    function apply(mode, persist) {
      var on = mode === 'off';
      root.setAttribute('data-tr', on ? 'off' : 'on');

      Array.prototype.forEach.call(buttons, function (btn) {
        btn.setAttribute('aria-pressed', on ? 'false' : 'true');
        btn.classList.toggle('is-on', on);
      });

      if (persist) save(TR_KEY, on ? 'off' : 'on');
    }

    Array.prototype.forEach.call(buttons, function (btn) {
      btn.addEventListener('click', function () {
        var next = root.getAttribute('data-tr') === 'off' ? 'on' : 'off';
        apply(next, true);
        api.toast(t(next === 'off' ? 'mag.hideKoOn' : 'mag.hideKoOff'));
      });
    });

    var stored = store(TR_KEY, 'on');
    apply(stored === 'off' ? 'off' : 'on');
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
    if (!ISSUES.length) return;

    var wanted = store(ISSUE_KEY, '');
    ISSUE = ISSUES.filter(function (i) { return i.slug === wanted; })[0] || ISSUES[0];

    loadWordbook();
    loadProgress();

    renderCover();
    renderContent();
    renderWordbook();
    renderReview();
    renderDaily();
    renderIssueNav();
    updateCounts();
    setupReadBar();
    setupRate();
    setupTranslation();

    /* 언어가 바뀌면 그려진 문구도 다시 그립니다 (script.js가 보내는 이벤트) */
    document.addEventListener('langchange', function () {
      stopSpeaking();
      renderCover();
      renderContent();
      renderWordbook();
      renderReview();
      renderIssueNav();
      updateCounts();
    });

    var search = byId('wbSearch');
    if (search) {
      search.addEventListener('input', function () {
        wbQuery = search.value.trim();
        renderWordbook();
      });
    }

    var copyBtn = byId('wbCopyBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var text = wordbookText();
        if (text) copyText(text, 'mag.wbCopied');
      });
    }

    var exportBtn = byId('wbExportBtn');
    if (exportBtn) exportBtn.addEventListener('click', exportCsv);

    var backupBtn = byId('wbBackupBtn');
    if (backupBtn) backupBtn.addEventListener('click', backupAll);

    var restoreBtn = byId('wbRestoreBtn');
    var restoreFile = byId('wbRestoreFile');
    if (restoreBtn && restoreFile) {
      restoreBtn.addEventListener('click', function () { restoreFile.click(); });
      restoreFile.addEventListener('change', function () {
        var file = restoreFile.files && restoreFile.files[0];
        restoreAll(file);
        restoreFile.value = '';
      });
    }

    var printBtn = byId('printBtn');
    if (printBtn) {
      printBtn.addEventListener('click', function () {
        if (window.print) window.print();
      });
    }

    var reviewBtn = byId('wbReviewBtn');
    if (reviewBtn) {
      reviewBtn.addEventListener('click', function () {
        reviewQueue = dueWords().slice(0, 20);
        reviewIndex = 0;
        reviewRevealed = false;
        renderReview();

        var target = byId('review');
        if (target && target.scrollIntoView) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    var clearBtn = byId('wbClearBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        if (!savedWords.length) return;
        if (!window.confirm(t('mag.wbClearConfirm'))) return;

        savedWords = [];
        save(WB_KEY, savedWords);
        save(SRS_KEY, {});
        reviewQueue = [];
        renderWordbook();
        renderReview();
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
