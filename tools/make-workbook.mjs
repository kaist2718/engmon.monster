#!/usr/bin/env node
/* ==========================================================================
   EngMon — 워크북 생성기

     node tools/make-workbook.mjs [--out _workbook] [--no-pdf] [--html-only]

   하는 일
     issues.js 의 **발행된 주**를 읽어 판매용 파일 두 부를 만듭니다.

       _workbook/workbook.html      학습편 — 읽고 풀고 쓰는 본문 + 연습 여백
       _workbook/answer-key.html    정답편 — 채점·해설·모범 답안 + 누적 어휘 색인
       _workbook/*.pdf              위 두 문서의 인쇄용 PDF (헤드리스 Chrome)

   왜 이렇게 나누는가
     종이에서는 채점이 곧 학습입니다. 정답을 같은 문서 뒤에 붙여 두면
     풀다가 넘겨 보게 되므로, **정답편을 별도 파일**로 떼어 둡니다.

   왜 헤드리스 Chrome 인가
     이 저장소는 런타임 의존성이 0 입니다. PDF 라이브러리를 들이는 대신
     browser-test.js 가 이미 쓰고 있는 Chrome(CDP) 을 그대로 씁니다.
     Chrome 이 없으면 HTML 만 만들고 안내를 남깁니다(--no-pdf 와 같은 결과).

   판매 문구는 docs/PRODUCT-COPY.md, 가격·할인·환불의 정본은 docs/PRICING.md,
   결정 근거는 docs/MONETIZATION.md.
   ========================================================================== */

import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ARGS = process.argv.slice(2);
const argVal = (name, fallback) => {
  const i = ARGS.indexOf(name);
  if (i === -1) return fallback;
  const next = ARGS[i + 1];
  return next && !next.startsWith('--') ? next : fallback;
};
const OUT = path.resolve(ROOT, argVal('--out', '_workbook'));
const SKIP_PDF = ARGS.includes('--no-pdf') || ARGS.includes('--html-only');
const SITE = 'engmon.monster';

/* ── 1. 데이터 ────────────────────────────────────────────────────────────
   issues.js 는 브라우저 전역(var) 파일이라 Node 에서 그대로 require 할 수 없습니다.
   smoke-test.js 와 같은 방식(vm)으로 읽습니다. */

function loadMagazine() {
  const sandbox = vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'issues.js'), 'utf8'), sandbox, {
    filename: 'issues.js',
  });

  const issues = (sandbox.MAGAZINE_ISSUES || []).slice().sort((a, b) => a.week - b.week);
  const quarters = sandbox.MAGAZINE_QUARTERS || [];
  if (!issues.length) throw new Error('발행된 주가 없습니다 (issues.js 의 sections 를 확인하세요)');

  return { issues, quarters };
}

/* ── 2. 글자 다루기 ──────────────────────────────────────────────────────── */

const esc = (v) => String(v == null ? '' : v)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

/* 매거진과 같은 규칙 — **굵게** 만 지원합니다. */
const rich = (v) => esc(v).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

/* 워크북은 한국어 학습자용이라 한국어를 기본으로, 없으면 영어로 대체합니다. */
const ko = (v) => {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  return v.ko != null ? v.ko : (v.en != null ? v.en : '');
};
/* 보기(options)처럼 영어가 본문인 값에 씁니다. */
const en = (v) => {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  return v.en != null ? v.en : (v.ko != null ? v.ko : '');
};

/* script.js 의 mag.kind.* 와 같은 문구입니다 — 새 kind 를 만들면 여기도 추가하세요. */
const KIND_LABELS = {
  goals: '학습목표',
  vocabulary: '어휘',
  phrasal: '구동사',
  collocation: '연어',
  grammar: '문법',
  pronunciation: '발음',
  idioms: '이디엄',
  slang: '슬랭',
  natural: '자연스러운 표현',
  conversation: '회화',
  listening: '듣기·받아쓰기',
  reading: '독해',
  writing: '쓰기',
  discussion: '토론',
  culture: '문화',
  quiz: '확인 문제',
  humor: '유머',
  note: '해설 노트',
};
const kindLabel = (kind) => KIND_LABELS[kind] || kind;

const pad2 = (n) => String(n).padStart(2, '0');

/* ── 3. 인쇄용 스타일 ─────────────────────────────────────────────────────
   종이 한 장 기준으로만 씁니다. 화면용 스타일(styles.css)과 섞지 않습니다. */

/* 본문 서체는 사이트와 같은 Pretendard 서브셋을 씁니다.
   파일은 저장소에 함께 있으므로 _workbook 에서 본 상대 경로를 넣어 줍니다.
   (없으면 시스템 한글 서체로 자동 대체되므로 실패하지 않습니다.) */
const printCss = (fontUrl) => `
  @font-face {
    font-family: "Pretendard Variable";
    src: url("${fontUrl}") format("woff2-variations");
    font-weight: 45 920;
    font-style: normal;
    font-display: block;
  }
  :root { --ink: #111; --dim: #6b6b6b; --line: #d7d7d7; --soft: #f4f4f4; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: "Pretendard Variable", "Malgun Gothic", -apple-system, BlinkMacSystemFont,
                 "Segoe UI", Roboto, "Noto Sans KR", sans-serif;
    color: var(--ink); font-size: 10.5pt; line-height: 1.55;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  h1, h2, h3, h4 { margin: 0; line-height: 1.3; }
  p { margin: 0 0 8px; }
  ul, ol { margin: 0 0 8px; padding-left: 18px; }
  li { margin: 0 0 4px; }
  strong { font-weight: 700; }
  a { color: inherit; text-decoration: none; }

  /* 표지 */
  .wk-cover { break-after: page; padding-top: 40mm; text-align: center; }
  .wk-cover-brand { font-size: 9pt; letter-spacing: .28em; color: var(--dim); }
  .wk-cover h1 { font-size: 26pt; margin: 10px 0 6px; letter-spacing: -.01em; }
  .wk-cover h2 { font-size: 12pt; color: var(--dim); font-weight: 500; margin-bottom: 26px; }
  .wk-cover-rule { width: 60mm; height: 2px; background: var(--ink); margin: 0 auto 26px; }
  .wk-cover-meta { font-size: 9.5pt; color: var(--dim); }
  .wk-cover-note { margin-top: 34mm; font-size: 9pt; color: var(--dim); text-align: left;
                   max-width: 120mm; margin-left: auto; margin-right: auto; }

  /* 차례 */
  .wk-toc { break-after: page; }
  .wk-toc h2 { font-size: 15pt; margin-bottom: 12px; }
  .wk-toc-quarter { margin-top: 14px; font-size: 10pt; font-weight: 700; color: var(--dim); }
  .wk-toc-item { display: flex; gap: 8px; padding: 5px 0; border-bottom: 1px dotted var(--line); }
  .wk-toc-item .n { width: 16mm; color: var(--dim); }
  .wk-toc-item .t { flex: 1; }
  .wk-toc-item .m { color: var(--dim); font-size: 9pt; }

  /* 주(week) */
  .wk-week { break-before: page; }
  .wk-week-head { border-bottom: 2px solid var(--ink); padding-bottom: 8px; margin-bottom: 16px; }
  .wk-week-kicker { font-size: 9pt; letter-spacing: .18em; color: var(--dim); }
  .wk-week-head h2 { font-size: 18pt; margin: 4px 0 6px; }
  .wk-week-meta { font-size: 9pt; color: var(--dim); }

  .wk-section { margin: 0 0 20px; break-inside: avoid; }
  .wk-section-head { display: flex; align-items: baseline; gap: 8px;
                     border-bottom: 1px solid var(--line); padding-bottom: 4px; margin-bottom: 10px; }
  .wk-section-kind { font-size: 8.5pt; letter-spacing: .1em; color: var(--dim); }
  .wk-section-head h3 { font-size: 12.5pt; }
  .wk-section-level { margin-left: auto; font-size: 8.5pt; color: var(--dim); }
  .wk-section-intro { font-size: 9.5pt; color: var(--dim); margin-bottom: 8px; }
  .wk-body-en { margin-bottom: 6px; }
  .wk-body-ko { font-size: 9.5pt; color: var(--dim); }

  /* 어휘·표현 표 */
  table.wk-items { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
  table.wk-items th, table.wk-items td {
    border-bottom: 1px solid var(--line); padding: 5px 6px; text-align: left; vertical-align: top;
  }
  table.wk-items th { background: var(--soft); font-size: 8.5pt; color: var(--dim); }
  table.wk-items td.wk-en { font-weight: 600; width: 32%; }

  /* 문제 */
  .wk-quiz-item { margin: 0 0 10px; break-inside: avoid; }
  .wk-quiz-q { font-weight: 600; }
  .wk-quiz-options { margin: 3px 0 0; padding-left: 16px; font-size: 9.5pt; }
  .wk-blank { border-bottom: 1px solid var(--line); height: 15mm; }
  .wk-lines { margin-top: 6px; }
  .wk-lines span { display: block; border-bottom: 1px solid var(--line); height: 8mm; }

  /* 회화 */
  .wk-line { display: flex; gap: 8px; margin-bottom: 5px; font-size: 9.5pt; }
  .wk-line .who { width: 22mm; font-weight: 700; color: var(--dim); }
  .wk-line .say { flex: 1; }

  /* 정답편 */
  .wk-answer { break-inside: avoid; margin-bottom: 12px; }
  .wk-answer-num { font-weight: 700; margin-right: 4px; }
  .wk-answer-correct { font-weight: 700; }
  .wk-explain { font-size: 9.5pt; color: var(--dim); }

  .wk-index table { width: 100%; border-collapse: collapse; font-size: 9pt; }
  .wk-index th, .wk-index td { border-bottom: 1px solid var(--line); padding: 4px 5px;
                               text-align: left; vertical-align: top; }
  .wk-index th { background: var(--soft); font-size: 8.5pt; color: var(--dim); }
  .wk-index .wk-week-cell { width: 14mm; color: var(--dim); }
  .wk-index .wk-kind-cell { width: 22mm; color: var(--dim); }
  .wk-index .wk-term { font-weight: 600; width: 34%; }

  .wk-hint { font-size: 9pt; color: var(--dim); border-left: 3px solid var(--line);
             padding: 6px 10px; background: var(--soft); margin: 0 0 12px; }
`;

/* ── 4. 섹션 그리기 ─────────────────────────────────────────────────────── */

/* 쓰기 섹션의 body 는 두 종류가 섞여 있습니다.
     · 모범 답안 — 영어 지문이 '**Model answer**' 로 시작합니다 → 정답·해설편
     · 쓰기 안내문 — 그 밖의 문단 → 학습편
   학습자가 먼저 풀어야 하므로 모범 답안은 학습편에 실지 않습니다. */
function isModelAnswer(body) {
  const first = body && Array.isArray(body.en) && body.en[0] ? String(body.en[0]).trim() : '';
  return /^\*\*(Model answer|모범 답안)/.test(first);
}

const sectionHead = (s) => [
  '<div class="wk-section-head">',
  '<span class="wk-section-kind">' + esc(kindLabel(s.kind)) + '</span>',
  '<h3>' + rich(ko(s.title)) + '</h3>',
  s.level ? '<span class="wk-section-level">' + esc(s.level) + '</span>' : '',
  '</div>',
].join('');

const bodyBlock = (body) => {
  if (!body) return '';
  const paragraphs = (Array.isArray(body.en) ? body.en : [])
    .map((p) => '<p class="wk-body-en">' + rich(p) + '</p>').join('');
  const trans = body.ko
    ? '<div class="wk-body-ko">' + (Array.isArray(body.ko) ? body.ko : [body.ko])
      .map((p) => '<p>' + rich(p) + '</p>').join('') + '</div>'
    : '';
  return paragraphs + trans;
};

/* 어휘·표현 — 워크북에서는 뜻과 예문을 함께 두고, 필기 여백을 남깁니다. */
function itemsTable(items) {
  if (!items || !items.length) return '';
  const hasMeaning = items.some((i) => i.meaning);
  const hasExample = items.some((i) => i.example);
  const hasNote = items.some((i) => i.note);

  const head = ['<th>표현</th>', '<th>뜻</th>']
    .concat(hasExample ? ['<th>예문</th>'] : [])
    .concat(hasNote ? ['<th>해설</th>'] : [])
    .join('');

  const rows = items.map((i) => [
    '<tr>',
    '<td class="wk-en">' + esc(i.en) + '</td>',
    '<td>' + esc(i.ko || '') + (i.meaning ? ' <span class="wk-explain">(' + esc(i.meaning) + ')</span>' : '') + '</td>',
    hasExample ? '<td>' + esc(i.example || '') + '</td>' : '',
    hasNote ? '<td class="wk-explain">' + esc(i.note || '') + '</td>' : '',
    '</tr>',
  ].join('')).join('');

  return '<table class="wk-items"><thead><tr>' + head + '</tr></thead><tbody>' + rows + '</tbody></table>';
}

function tableBlock(table) {
  if (!table) return '';
  const head = (table.head || []).map((h) => '<th>' + rich(ko(h)) + '</th>').join('');
  const rows = (table.rows || [])
    .map((r) => '<tr>' + r.map((c) => '<td>' + rich(c) + '</td>').join('') + '</tr>').join('');
  return '<table class="wk-items">' +
    (table.caption ? '<caption style="text-align:left;font-size:9pt;color:#6b6b6b;padding-bottom:4px">' +
      esc(ko(table.caption)) + '</caption>' : '') +
    '<thead><tr>' + head + '</tr></thead><tbody>' + rows + '</tbody></table>';
}

function dialogueBlock(dialogue) {
  if (!dialogue || !dialogue.length) return '';
  return dialogue.map((line) => [
    '<div class="wk-line">',
    '<span class="who">' + esc(line.who || '') + '</span>',
    '<span class="say">' + esc(line.en) + '</span>',
    '</div>',
  ].join('')).join('');
}

const bulletsBlock = (bullets) => (!bullets || !bullets.length ? ''
  : '<ul>' + bullets.map((b) => '<li>' + rich(en(b)) + ' <span class="wk-explain">' + esc(ko(b) === en(b) ? '' : ko(b)) + '</span></li>').join('') + '</ul>');

/* ── 5. 학습편(workbook) ─────────────────────────────────────────────────
   확인 문제는 보기만, 받아쓰기는 빈 줄만 둡니다.
   정답·해설·모범 답안은 전부 answer-key.html 로 보냅니다. */

function renderWorkbookSection(s) {
  const parts = [sectionHead(s)];
  if (s.intro) parts.push('<p class="wk-section-intro">' + rich(ko(s.intro)) + '</p>');

  if (s.kind === 'goals') {
    parts.push(bulletsBlock(s.bullets));
    if (s.quote) parts.push('<p class="wk-hint">' + rich(ko(s.quote)) + '</p>');
    return parts.join('');
  }

  if (s.kind === 'quiz') {
    const list = (s.quiz || []).map((item, i) => [
      '<div class="wk-quiz-item">',
      '<p class="wk-quiz-q">' + (i + 1) + '. ' + rich(ko(item.q)) + '</p>',
      '<ol class="wk-quiz-options" type="A">' +
        (item.options || []).map((o) => '<li>' + esc(en(o)) + '</li>').join('') +
      '</ol>',
      '<div class="wk-blank"></div>',
      '</div>',
    ].join('')).join('');
    parts.push(list, '<p class="wk-hint">정답과 해설은 <b>정답·해설편</b>에 있습니다.</p>');
    return parts.join('');
  }

  if (s.kind === 'listening') {
    parts.push(
      '<p class="wk-hint">듣기는 <b>' + SITE + '</b> 에서 무료로 재생합니다. 들은 문장을 아래 줄에 적으세요. ' +
      '문장은 <b>정답·해설편</b>에 있습니다.</p>',
      '<div class="wk-lines">' + Array.from({ length: (s.dictation || []).length || 4 })
        .map((_, i) => '<span>' + (i + 1) + '.</span>').join('') + '</div>'
    );
    if (s.items && s.items.length) parts.push(itemsTable(s.items));
    return parts.join('');
  }

  if (s.kind === 'reading') {
    if (s.reading) {
      parts.push(s.reading.map((p) => '<p class="wk-body-en">' + rich(p) + '</p>').join(''));
    }
    if (s.items && s.items.length) parts.push(itemsTable(s.items));
    if (s.questions && s.questions.length) {
      parts.push('<ol>' + s.questions.map((q) => '<li>' + rich(en(q)) +
        ' <span class="wk-explain">' + esc(ko(q)) + '</span></li>').join('') + '</ol>');
      parts.push('<div class="wk-lines">' + Array.from({ length: 3 }).map(() => '<span></span>').join('') + '</div>');
    }
    return parts.join('');
  }

  if (s.kind === 'writing') {
    /* 모범 답안은 정답편으로 보냅니다 — 여기서 실으면 풀기 전에 답을 보게 됩니다. */
    if (s.body && !isModelAnswer(s.body)) parts.push(bodyBlock(s.body));
    parts.push(bulletsBlock(s.bullets));
    if (s.items && s.items.length) parts.push(itemsTable(s.items));
    parts.push('<p class="wk-hint">직접 써 보세요. 모범 답안은 <b>정답·해설편</b>에 있습니다.</p>');
    parts.push('<div class="wk-lines">' + Array.from({ length: 5 }).map(() => '<span></span>').join('') + '</div>');
    return parts.join('');
  }

  if (s.kind === 'discussion') {
    if (s.questions && s.questions.length) {
      parts.push('<ol>' + s.questions.map((q) => '<li>' + rich(en(q)) +
        ' <span class="wk-explain">' + esc(ko(q)) + '</span></li>').join('') + '</ol>');
    }
    parts.push('<div class="wk-lines">' + Array.from({ length: 4 }).map(() => '<span></span>').join('') + '</div>');
    return parts.join('');
  }

  if (s.kind === 'note') {
    parts.push('<p class="wk-hint">이 주의 함정 정리는 <b>정답·해설편</b>에 있습니다.</p>');
    return parts.join('');
  }

  /* 나머지: 본문 → 회화 → 표 → 항목 순서로 그대로 싣습니다. */
  parts.push(bodyBlock(s.body));
  if (s.dialogue && s.dialogue.length) parts.push(dialogueBlock(s.dialogue));
  if (s.table) parts.push(tableBlock(s.table));
  if (s.items && s.items.length) parts.push(itemsTable(s.items));
  if (s.bullets && s.bullets.length && !(s.items && s.items.length)) parts.push(bulletsBlock(s.bullets));
  if (s.quote) parts.push('<p class="wk-hint">' + rich(ko(s.quote)) + '</p>');
  return parts.join('');
}

function renderWorkbookWeek(week) {
  const head = [
    '<div class="wk-week-head">',
    '<p class="wk-week-kicker">WEEK ' + pad2(week.week) + ' · QUARTER ' + week.quarter + '</p>',
    '<h2>' + esc(ko(week.title)) + '</h2>',
    '<p class="wk-week-meta">' + esc(ko(week.theme)) + ' · 레벨 ' + esc(week.level) +
      ' · ' + (week.sections || []).length + '개 섹션</p>',
    '</div>',
    '<p class="wk-section-intro">' + rich(ko(week.summary)) + '</p>',
  ].join('');

  const sections = (week.sections || [])
    .map((s) => '<section class="wk-section">' + renderWorkbookSection(s) + '</section>')
    .join('');

  return '<article class="wk-week">' + head + sections + '</article>';
}

/* ── 6. 정답편(answer key) ─────────────────────────────────────────────── */

function renderAnswerWeek(week) {
  const blocks = [];
  let number = 0;

  (week.sections || []).forEach((s) => {
    if (s.kind === 'quiz') {
      number += 1;
      const list = (s.quiz || []).map((item, i) => {
        const options = item.options || [];
        return [
          '<div class="wk-answer">',
          '<p><span class="wk-answer-num">' + (i + 1) + '.</span>' +
            '<span class="wk-answer-correct">' + esc(en(options[item.answer])) + '</span></p>',
          item.explain ? '<p class="wk-explain">' + rich(ko(item.explain)) + '</p>' : '',
          '</div>',
        ].join('');
      }).join('');
      blocks.push('<section class="wk-section">' + sectionHead(s) + list + '</section>');
      return;
    }

    if (s.kind === 'listening' && s.dictation && s.dictation.length) {
      const lines = '<ol>' + s.dictation.map((d) =>
        '<li>' + esc(d.en) + ' <span class="wk-explain">' + esc(d.ko) + '</span></li>').join('') + '</ol>';
      blocks.push('<section class="wk-section">' + sectionHead(s) +
        '<p class="wk-section-intro">받아쓰기 정답</p>' + lines + '</section>');
      return;
    }

    if (s.kind === 'reading' && s.bullets && s.bullets.length) {
      blocks.push('<section class="wk-section">' + sectionHead(s) +
        '<p class="wk-section-intro">답할 때 쓸 표현</p>' + bulletsBlock(s.bullets) + '</section>');
      return;
    }

    if (s.kind === 'discussion' && s.bullets && s.bullets.length) {
      blocks.push('<section class="wk-section">' + sectionHead(s) +
        '<p class="wk-section-intro">말할 때 쓸 표현</p>' + bulletsBlock(s.bullets) + '</section>');
      return;
    }

    if (s.kind === 'writing' && s.body && isModelAnswer(s.body)) {
      blocks.push('<section class="wk-section">' + sectionHead(s) +
        '<p class="wk-section-intro">모범 답안</p>' + bodyBlock(s.body) + '</section>');
      return;
    }

    if (s.kind === 'note' && s.bullets && s.bullets.length) {
      blocks.push('<section class="wk-section">' + sectionHead(s) + bulletsBlock(s.bullets) + '</section>');
    }
  });

  if (!blocks.length) return '';

  return '<article class="wk-week">' + [
    '<div class="wk-week-head">',
    '<p class="wk-week-kicker">WEEK ' + pad2(week.week) + ' · 정답과 해설</p>',
    '<h2>' + esc(ko(week.title)) + '</h2>',
    '</div>',
  ].join('') + blocks.join('') + '</article>';
}

/* ── 7. 누적 어휘 색인 ──────────────────────────────────────────────────
   워크북에만 있는 것. 웹에서는 주마다 흩어져 있는 항목을 한 표로 모읍니다. */

function buildIndex(issues) {
  const rows = [];
  issues.forEach((week) => {
    (week.sections || []).forEach((s) => {
      (s.items || []).forEach((item) => {
        if (!item.en) return;
        rows.push({
          week: week.week,
          kind: kindLabel(s.kind),
          en: item.en,
          ko: item.ko || '',
          meaning: item.meaning || '',
          example: item.example || '',
        });
      });
    });
  });

  /* 주차 순서는 그대로 두고, 같은 주 안에서는 알파벳 순으로 */
  rows.sort((a, b) => (a.week - b.week) || a.en.toLowerCase().localeCompare(b.en.toLowerCase()));
  return rows;
}

function renderIndex(rows) {
  const body = rows.map((r) => [
    '<tr>',
    '<td class="wk-week-cell">W' + pad2(r.week) + '</td>',
    '<td class="wk-kind-cell">' + esc(r.kind) + '</td>',
    '<td class="wk-term">' + esc(r.en) + '</td>',
    '<td>' + esc(r.ko) + (r.meaning ? ' <span class="wk-explain">(' + esc(r.meaning) + ')</span>' : '') + '</td>',
    '<td class="wk-explain">' + esc(r.example) + '</td>',
    '</tr>',
  ].join('')).join('');

  return '<article class="wk-week wk-index">' + [
    '<div class="wk-week-head">',
    '<p class="wk-week-kicker">INDEX</p>',
    '<h2>누적 어휘 색인</h2>',
    '<p class="wk-week-meta">' + rows.length + '개 항목 · 주차별 · 같은 주 안에서는 알파벳 순</p>',
    '</div>',
    '<table><thead><tr><th>주</th><th>종류</th><th>표현</th><th>뜻</th><th>예문</th></tr></thead>',
    '<tbody>' + body + '</tbody></table>',
    '</article>',
  ].join('');
}

/* ── 8. 문서 조립 ───────────────────────────────────────────────────────── */

function cover({ title, subtitle, lines }) {
  return [
    '<section class="wk-cover">',
    '<p class="wk-cover-brand">ENGMON · MONSTERLAB</p>',
    '<h1>' + esc(title) + '</h1>',
    '<h2>' + esc(subtitle) + '</h2>',
    '<div class="wk-cover-rule"></div>',
    '<p class="wk-cover-meta">' + lines.map(esc).join('<br />') + '</p>',
    '<div class="wk-cover-note">',
    '<p>이 파일은 구매자 본인만 사용합니다. 복제·공유·재판매는 금지됩니다.</p>',
    '<p>본문은 <strong>' + SITE + '</strong> 에서 무료로 읽을 수 있습니다. 이 워크북은 종이로 풀고 채점하기 위한 형태입니다.</p>',
    '</div>',
    '</section>',
  ].join('');
}

function toc(issues, quarters, note) {
  const byQuarter = quarters.map((q, qi) => {
    const weeks = issues.filter((w) => w.quarter === qi + 1);
    if (!weeks.length) return '';
    return '<p class="wk-toc-quarter">' + esc(ko(q.title) || (qi + 1) + '분기') + '</p>' +
      weeks.map((w) => [
        '<div class="wk-toc-item">',
        '<span class="n">W' + pad2(w.week) + '</span>',
        '<span class="t">' + esc(ko(w.title)) + '</span>',
        '<span class="m">' + esc(ko(w.theme)) + ' · ' + (w.sections || []).length + '섹션</span>',
        '</div>',
      ].join('')).join('');
  }).join('');

  return '<section class="wk-toc"><h2>차례</h2>' + byQuarter +
    '<p class="wk-cover-meta" style="margin-top:16px">' + esc(note) + '</p></section>';
}

function documentHtml({ title, body, fontUrl }) {
  return [
    '<!DOCTYPE html>',
    '<html lang="ko"><head><meta charset="utf-8" />',
    '<title>' + esc(title) + '</title>',
    '<style>' + printCss(fontUrl) + '</style>',
    '</head><body>',
    body,
    '</body></html>',
  ].join('\n');
}

function buildDocuments({ issues, quarters, fontUrl }) {
  const weeks = issues.map((w) => w.week);
  const first = issues[0];
  const last = issues[issues.length - 1];
  const quarter = first.quarter;
  const index = buildIndex(issues);

  const workbook = documentHtml({
    title: 'EngMon 워크북 — ' + (ko(quarters[quarter - 1] && quarters[quarter - 1].title) || quarter + '분기'),
    fontUrl,
    body: [
      cover({
        title: 'EngMon 워크북',
        subtitle: ko(quarters[quarter - 1] && quarters[quarter - 1].title) || (quarter + '분기'),
        lines: [
          'W' + pad2(first.week) + ' ~ W' + pad2(last.week) + ' (' + issues.length + '주 발행)',
          '학습편 — 읽고 풀고 쓰는 본문',
          '정답·해설은 별도 파일(정답·해설편)에 있습니다',
        ],
      }),
      toc(issues, quarters, '정답·해설·모범 답안·누적 어휘 색인은 「정답·해설편」에 있습니다.'),
      issues.map(renderWorkbookWeek).join(''),
    ].join(''),
  });

  const answerKey = documentHtml({
    title: 'EngMon 정답·해설편',
    fontUrl,
    body: [
      cover({
        title: 'EngMon 정답·해설편',
        subtitle: '확인 문제 해설 · 받아쓰기 정답 · 모범 답안 · 누적 어휘 색인',
        lines: [
          'W' + pad2(first.week) + ' ~ W' + pad2(last.week),
          '색인 ' + index.length + '개 항목',
          '학습편과 함께 사용하세요',
        ],
      }),
      issues.map(renderAnswerWeek).filter(Boolean).join(''),
      renderIndex(index),
    ].join(''),
  });

  return { workbook, answerKey, indexCount: index.length };
}

/* ── 9. 헤드리스 Chrome 으로 PDF 뽑기 ────────────────────────────────────
   browser-test.js 와 같은 방식입니다. Chrome 이 없으면 HTML 만 남기고 안내합니다. */

const CHROME_CANDIDATES = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);

const findChrome = () => CHROME_CANDIDATES
  .find((p) => { try { return fs.existsSync(p); } catch (e) { return false; } });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  const api = { ready: null, send: null, close: null };

  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result);
    }
  });

  api.ready = new Promise((res, rej) => {
    ws.addEventListener('open', res);
    ws.addEventListener('error', rej);
  });
  api.send = (method, params) => {
    const mid = ++id;
    return new Promise((res, rej) => {
      pending.set(mid, { resolve: res, reject: rej });
      ws.send(JSON.stringify({ id: mid, method, params: params || {} }));
    });
  };
  api.close = () => { try { ws.close(); } catch (e) { /* 무시 */ } };
  return api;
}

async function printPdf(chromePath, htmlFile, pdfFile) {
  const port = await freePort();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'engmon-workbook-'));
  const chrome = spawn(chromePath, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--remote-debugging-port=' + port, '--user-data-dir=' + profile, 'about:blank',
  ], { stdio: 'ignore' });

  const cleanup = () => {
    try {
      if (process.platform === 'win32') {
        spawnSync('taskkill', ['/PID', String(chrome.pid), '/T', '/F'], { stdio: 'ignore' });
      }
    } catch (e) { /* 무시 */ }
    try { chrome.kill(); } catch (e) { /* 무시 */ }
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) { /* 무시 */ }
  };

  try {
    let version = null;
    for (let i = 0; i < 80 && !version; i++) {
      try {
        const res = await fetch('http://127.0.0.1:' + port + '/json/version');
        version = await res.json();
      } catch (e) { await sleep(250); }
    }
    if (!version) throw new Error('DevTools 에 연결하지 못했습니다');

    const res = await fetch('http://127.0.0.1:' + port + '/json/new?about:blank', { method: 'PUT' });
    const cdp = connect((await res.json()).webSocketDebuggerUrl);
    await cdp.ready;
    await cdp.send('Page.enable');

    const url = 'file:///' + htmlFile.replace(/\\/g, '/');
    await cdp.send('Page.navigate', { url });

    /* 외부 요청이 없는 문서라 load 는 곧 끝납니다. 그래도 확인하고 넘어갑니다. */
    for (let i = 0; i < 60; i++) {
      const probe = await cdp.send('Runtime.evaluate', {
        expression: 'document.readyState',
        returnByValue: true,
      }).catch(() => null);
      if (probe && probe.result && probe.result.value === 'complete') break;
      await sleep(100);
    }
    await sleep(200);

    const { data } = await cdp.send('Page.printToPDF', {
      printBackground: true,
      paperWidth: 8.27,      /* A4 */
      paperHeight: 11.69,
      marginTop: 0.55,
      marginBottom: 0.7,
      marginLeft: 0.5,
      marginRight: 0.5,
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: '<div style="width:100%;font-size:8px;color:#888;text-align:center">' +
        '<span class="title"></span> · <span class="pageNumber"></span> / <span class="totalPages"></span>' +
        '</div>',
      preferCSSPageSize: false,
    });

    fs.writeFileSync(pdfFile, Buffer.from(data, 'base64'));
    cdp.close();
  } finally {
    cleanup();
  }
}

/* ── 10. 실행 ───────────────────────────────────────────────────────────── */

const kb = (file) => (fs.statSync(file).size / 1024).toFixed(0) + ' KB';

async function main() {
  const { issues, quarters } = loadMagazine();

  /* 워크북은 _workbook 안에 있고 서체는 assets/fonts 에 있습니다 — 상대 경로로 잇습니다. */
  const fontFile = path.join(ROOT, 'assets', 'fonts', 'pretendard-variable.woff2');
  const fontUrl = fs.existsSync(fontFile)
    ? path.relative(OUT, fontFile).replace(/\\/g, '/')
    : '';

  const { workbook, answerKey, indexCount } = buildDocuments({ issues, quarters, fontUrl });

  fs.mkdirSync(OUT, { recursive: true });
  const workbookFile = path.join(OUT, 'workbook.html');
  const answerFile = path.join(OUT, 'answer-key.html');
  fs.writeFileSync(workbookFile, workbook);
  fs.writeFileSync(answerFile, answerKey);

  const weeks = issues.map((w) => w.week);
  console.log('\n  EngMon 워크북 생성');
  console.log('  · 주        : W' + pad2(weeks[0]) + ' ~ W' + pad2(weeks[weeks.length - 1]) +
    ' (' + issues.length + '주)');
  console.log('  · 색인      : ' + indexCount + '개 항목');
  console.log('  · 학습편    : ' + path.relative(ROOT, workbookFile) + ' (' + kb(workbookFile) + ')');
  console.log('  · 정답편    : ' + path.relative(ROOT, answerFile) + ' (' + kb(answerFile) + ')');

  if (SKIP_PDF) {
    console.log('  · PDF       : 건너뜀 (--no-pdf)\n');
    return;
  }

  const chromePath = findChrome();
  if (!chromePath) {
    console.log('\n  Chrome 실행 파일을 찾지 못해 PDF 를 만들지 못했습니다.');
    console.log('  HTML 두 부는 만들어 두었습니다. 다음 중 하나로 PDF 로 바꾸세요.');
    console.log('    1) 브라우저에서 열고 인쇄 → PDF 로 저장 (여백 없음, 배경 그래픽 켜기)');
    console.log('    2) CHROME 환경변수에 Chrome 경로를 넣고 다시 실행\n');
    return;
  }

  const pairs = [
    [workbookFile, path.join(OUT, 'engmon-workbook.pdf')],
    [answerFile, path.join(OUT, 'engmon-answer-key.pdf')],
  ];

  for (const [htmlFile, pdfFile] of pairs) {
    await printPdf(chromePath, htmlFile, pdfFile);
    console.log('  · PDF       : ' + path.relative(ROOT, pdfFile) + ' (' + kb(pdfFile) + ')');
  }
  console.log('\n  판매 등록 순서·문구는 docs/PRODUCT-COPY.md, 가격·할인·환불은 docs/PRICING.md 를 보세요.\n');
}

main().catch((err) => {
  console.error('\n  워크북 생성 실패:', err && err.message ? err.message : err, '\n');
  process.exit(1);
});
