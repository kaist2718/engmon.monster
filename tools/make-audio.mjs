#!/usr/bin/env node
/* ==========================================================================
   EngMon 오디오 팩(MP3) 생성기 — tools/make-audio.mjs

   웹은 계속 브라우저 음성합성(speechSynthesis)을 씁니다. 이 도구는 **파는 쪽**,
   즉 구매자에게 함께 보내는 듣기 팩을 만듭니다.

   왜 파일로 굽는가
     speechSynthesis 는 기기마다 음성 목록이 다릅니다. 영어 음성이 하나뿐이거나
     품질이 나쁜 기기에서는 **받아쓰기가 성립하지 않습니다.** 파일로 고정하면
     ⑴ 품질이 기기와 무관해지고, ⑵ 미국식 회화와 영국식 회화를 오가며 들을 수 있고,
     ⑶ 오프라인에서도 재생됩니다.

   무엇을 굽는가 (기본)
     · dictation  받아쓰기 문장       — 두 악센트를 번갈아 (--dictation-voice alt)
     · dialogue   회화 대사           — 화자마다 악센트 고정(웹 화면과 같은 규칙)
     · examples   어휘·표현 낱말 + 예문 — 낱말과 예문을 따로
   더 넓히려면:  --groups all  (reading 지문 · quiz 문항까지)

   쓰는 법
     node tools/make-audio.mjs --dry-run          # 키 없이 분량·비용만 계산
     set GOOGLE_TTS_KEY=... && node tools/make-audio.mjs     (Windows bash: export)
     node tools/make-audio.mjs --week 1 --tier Chirp3
     node tools/make-audio.mjs --voice-a en-US-Neural2-F --voice-b en-GB-Neural2-B

   · 합성은 Google Cloud Text-to-Speech REST(v1)를 씁니다 — API 키 하나로 되고,
     출력물을 제품에 넣어 파는 것이 약관상 허용됩니다(출력물은 고객 콘텐츠).
     기본 음성만 씁니다. **실존 인물 목소리 복제는 하지 않습니다.**
   · 키는 이 스크립트 밖으로 나가지 않습니다. 저장소·산출물·로그에 남기지 마세요.
   · 산출물 `_audio/` 는 .gitignore 대상입니다(워크북의 `_workbook/` 과 같은 규칙).
     용량이 큰 바이너리를 git 에 쌓으면 저장소가 영구히 무거워집니다.
   · 판매 구성·가격은 docs/PRICING.md, 문구는 docs/PRODUCT-COPY.md 가 정본입니다.
   ========================================================================== */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ARGS = process.argv.slice(2);
const has = (flag) => ARGS.includes(flag);
const argVal = (name, fallback) => {
  const i = ARGS.indexOf(name);
  if (i === -1) return fallback;
  const next = ARGS[i + 1];
  return next && !next.startsWith('--') ? next : fallback;
};

const OUT = path.resolve(ROOT, argVal('--out', '_audio'));
const MANIFEST = path.join(OUT, 'manifest.json');
const DRY = has('--dry-run');
const FORCE = has('--force');
const KEY = argVal('--key', process.env.GOOGLE_TTS_KEY || process.env.GOOGLE_API_KEY || '');
const WEEK = argVal('--week', '') ? Number(argVal('--week', '')) : 0;
const GROUPS = String(argVal('--groups', 'dictation,dialogue,examples')).split(',').map((s) => s.trim()).filter(Boolean);
const TIER = argVal('--tier', 'Neural2');
const VOICE_A_OVERRIDE = argVal('--voice-a', '');
const VOICE_B_OVERRIDE = argVal('--voice-b', '');
const DICTATION_VOICE = argVal('--dictation-voice', 'alt'); /* a · b · alt */
const RATE = Number(argVal('--rate', '1')) || 1;
const MAX_BYTES = 4500; /* Google 은 요청당 5,000바이트까지 받습니다 — 여유를 둡니다 */

/* ── 1. 데이터 ────────────────────────────────────────────────────────────
   issues.js 는 브라우저 전역(var) 파일이라 Node 에서 그대로 require 할 수 없습니다.
   smoke-test.js · make-workbook.mjs 와 같은 방식(vm)으로 읽습니다. */

function loadMagazine() {
  const sandbox = vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'issues.js'), 'utf8'), sandbox, {
    filename: 'issues.js',
  });

  const issues = (sandbox.MAGAZINE_ISSUES || []).slice().sort((a, b) => a.week - b.week);
  if (!issues.length) throw new Error('발행된 주가 없습니다 (issues.js 의 sections 를 확인하세요)');
  return issues;
}

const isArray = (v) => Object.prototype.toString.call(v) === '[object Array]';

/* ── 2. 글자 다루기 ──────────────────────────────────────────────────────── */

/* 낭독용으로 다듬습니다 — **굵게** 표시와 겹친 공백을 걷어냅니다. */
const spoken = (v) => String(v == null ? '' : v)
  .replace(/\*\*([^*]+)\*\*/g, '$1')
  .replace(/\s+/g, ' ')
  .trim();

const hash8 = (text) => crypto.createHash('sha1').update(text).digest('hex').slice(0, 8);

/* 파일명에 쓸 수 있게 id 를 다듬습니다 (앞머리 번호는 주차가 붙습니다). */
const slug = (v) => String(v || '')
  .toLowerCase()
  .replace(/[^a-z0-9-]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 48) || 'item';

const pad = (n) => String(n).padStart(2, '0');

/* ── 3. 화자 → 악센트 ─────────────────────────────────────────────────────
   magazine.js 의 speakerKey/SPEAKER_ACCENT 와 **같은 규칙**입니다. 화면에서
   들리는 구분과 파일로 받은 구분이 달라지면 학습이 흔들립니다. */

function speakerKey(who) {
  const name = String(who || '').toLowerCase();
  if (/you|나|손님|guest|customer/.test(name)) return 1;
  if (/front desk|officer|doctor|staff|clerk|면접|직원/.test(name)) return 0;
  if (/friend|동료|colleague|ryan|maya|sam|lee/.test(name)) return 2;
  return 3;
}

const SPEAKER_ACCENT = ['uk', 'us', 'us', 'uk']; /* 0 직원 · 1 손님 · 2 동료 · 3 그 외 */

/* ── 4. 무엇을 굽는가 (그룹별 수집) ─────────────────────────────────────── */

const GROUP_LABELS = {
  dictation: '받아쓰기',
  dialogue: '회화 대사',
  examples: '어휘·표현',
  reading: '독해 지문',
  quiz: '확인 문제',
};

function collect(issues, groups) {
  const out = [];
  const want = (g) => groups.indexOf(g) !== -1 || groups.indexOf('all') !== -1;

  issues.forEach((issue) => {
    if (WEEK && issue.week !== WEEK) return;
    const wk = 'w' + pad(issue.week);

    (issue.sections || []).forEach((sec) => {
      const sid = slug(sec.id || sec.kind);

      /* 받아쓰기 — 문장마다 파일 하나. 두 악센트를 섞는 편이 듣기 훈련에 좋습니다. */
      if (want('dictation')) {
        (sec.dictation || []).forEach((line, i) => {
          const text = spoken(line && line.en);
          if (!text) return;
          const accent = DICTATION_VOICE === 'a' ? 'us'
            : DICTATION_VOICE === 'b' ? 'uk'
              : (i % 2 === 0 ? 'us' : 'uk');
          out.push({
            id: wk + '-' + sid + '-d' + pad(i + 1),
            group: 'dictation',
            week: issue.week,
            section: sec.id || sec.kind,
            text,
            accent,
          });
        });
      }

      /* 회화 — 화자마다 악센트를 고정합니다(웹과 같은 규칙). */
      if (want('dialogue')) {
        (sec.dialogue || []).forEach((line, i) => {
          const text = spoken(line && line.en);
          if (!text) return;
          out.push({
            id: wk + '-' + sid + '-c' + pad(i + 1),
            group: 'dialogue',
            week: issue.week,
            section: sec.id || sec.kind,
            text,
            who: line && line.who ? String(line.who) : '',
            accent: SPEAKER_ACCENT[speakerKey(line && line.who)],
          });
        });
      }

      /* 어휘·표현·이디엄 — 낱말과 예문을 따로 굽습니다.
         낱말만 반복해서 듣고, 예문으로 문장 속 소리를 확인하는 식으로 씁니다. */
      if (want('examples') && isArray(sec.items)) {
        sec.items.forEach((item, i) => {
          const term = spoken(item && item.en);
          const example = spoken(item && item.example);

          if (term) {
            out.push({
              id: wk + '-' + sid + '-i' + pad(i + 1) + '-term',
              group: 'examples',
              week: issue.week,
              section: sec.id || sec.kind,
              text: term,
              accent: 'us',
            });
          }
          if (example) {
            out.push({
              id: wk + '-' + sid + '-i' + pad(i + 1) + '-example',
              group: 'examples',
              week: issue.week,
              section: sec.id || sec.kind,
              text: example,
              accent: 'us',
            });
          }
        });
      }

      /* 독해 지문 — --groups all 일 때만. */
      if (want('reading') && isArray(sec.reading)) {
        sec.reading.forEach((para, i) => {
          const text = spoken(para);
          if (!text) return;
          out.push({
            id: wk + '-' + sid + '-r' + pad(i + 1),
            group: 'reading',
            week: issue.week,
            section: sec.id || sec.kind,
            text,
            accent: 'us',
          });
        });
      }

      /* 확인 문제 — --groups all 일 때만. */
      if (want('quiz') && isArray(sec.quiz)) {
        sec.quiz.forEach((q, i) => {
          const text = spoken(q && (q.en || q.text));
          if (!text) return;
          out.push({
            id: wk + '-' + sid + '-q' + pad(i + 1),
            group: 'quiz',
            week: issue.week,
            section: sec.id || sec.kind,
            text,
            accent: 'us',
          });
        });
      }
    });
  });

  return out;
}

/* ── 5. 비용 계산용 견적 ───────────────────────────────────────────────── */

/* 100만 자당 (USD). 확인 시점 2026-09 · Google Cloud Text-to-Speech 가격 페이지.
   값이 바뀌면 여기만 고치면 됩니다. */
const TIER_PRICE = { Standard: 4, Wavenet: 16, Neural2: 16, 'Chirp3-HD': 30 };

const estimate = (chars, tier) => (chars * (TIER_PRICE[tier] || 16) / 1e6);
const words = (chars) => Math.round(chars / 6);
const minutes = (chars) => words(chars) / 155;
const mb = (chars, kbps) => minutes(chars) * 60 * kbps * 1000 / 8 / 1024 / 1024;

/* ── 6. Google TTS 호출 ────────────────────────────────────────────────── */

const API = 'https://texttospeech.googleapis.com/v1';

async function apiGet(pathname) {
  const res = await fetch(API + pathname + '?key=' + encodeURIComponent(KEY));
  const text = await res.text();
  if (!res.ok) throw new Error('voices 조회 실패 (' + res.status + '): ' + text.slice(0, 300));
  return JSON.parse(text);
}

/* 음성 이름과 성별·언어를 API 에서 직접 받아 고릅니다.
   이름을 코드에 박아 두면 서비스가 음성을 정리할 때 조용히 깨집니다. */
async function resolveVoices() {
  if (VOICE_A_OVERRIDE && VOICE_B_OVERRIDE) {
    return {
      us: { name: VOICE_A_OVERRIDE, lang: VOICE_A_OVERRIDE.slice(0, 5) },
      uk: { name: VOICE_B_OVERRIDE, lang: VOICE_B_OVERRIDE.slice(0, 5) },
      source: '직접 지정',
    };
  }

  const data = await apiGet('/voices');
  const all = (data.voices || []).filter((v) => v && v.name);

  const pick = (locale, gender) => {
    const pool = all.filter((v) => (v.languageCodes || []).some((l) => l.replace('_', '-').toLowerCase() === locale.toLowerCase()));
    const byGender = pool.filter((v) => String(v.ssmlGender || '').toUpperCase() === gender);
    const use = byGender.length ? byGender : pool;
    const rank = (v) => {
      const score = v.name.indexOf(TIER) !== -1 ? 0 : 1;
      return score;
    };
    const sorted = use.slice().sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
    return sorted[0] || null;
  };

  const us = pick('en-US', 'FEMALE');
  const uk = pick('en-GB', 'MALE');
  if (!us || !uk) {
    throw new Error('en-US(여성) 또는 en-GB(남성) 음성을 찾지 못했습니다 — --voice-a / --voice-b 로 직접 지정하세요');
  }

  return {
    us: { name: VOICE_A_OVERRIDE || us.name, lang: 'en-US' },
    uk: { name: VOICE_B_OVERRIDE || uk.name, lang: 'en-GB' },
    source: 'API 조회 (tier=' + TIER + ')',
  };
}

/* 요청당 5,000바이트 제한 — 문장이 길면 공백에서 잘라 이어 붙입니다.
   (MP3 를 단순히 이어 붙이므로 문장 사이가 아주 짧게 끊길 수 있습니다.
    지금 콘텐츠에는 4,500바이트를 넘는 문장이 없습니다.) */
function byteChunks(text, limit) {
  const bytes = Buffer.byteLength(text, 'utf8');
  if (bytes <= limit) return [text];

  const pieces = [];
  let buffer = '';
  text.split(' ').forEach((word) => {
    const next = buffer ? buffer + ' ' + word : word;
    if (Buffer.byteLength(next, 'utf8') > limit && buffer) {
      pieces.push(buffer);
      buffer = word;
    } else {
      buffer = next;
    }
  });
  if (buffer) pieces.push(buffer);
  return pieces;
}

async function synthesize(text, voice) {
  const buffers = [];

  for (const part of byteChunks(text, MAX_BYTES)) {
    const body = {
      input: { text: part },
      voice: { languageCode: voice.lang, name: voice.name },
      audioConfig: { audioEncoding: 'MP3', speakingRate: RATE },
    };

    const res = await fetch(API + '/text:synthesize?key=' + encodeURIComponent(KEY), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(body),
    });
    const raw = await res.text();

    if (!res.ok) {
      /* 자주 나오는 실패는 그대로 안내합니다 — 원인을 찾느라 시간을 쓰지 않게. */
      const hint = res.status === 403
        ? '\n    · 결제가 연결된 프로젝트인지, Text-to-Speech API 가 사용 설정인지 확인하세요.'
        : res.status === 400
          ? '\n    · 음성 이름이 그 언어에 없을 수 있습니다 — --voice-a / --voice-b 로 바꿔 보세요.'
          : '';
      throw new Error('합성 실패 (' + res.status + '): ' + raw.slice(0, 300) + hint);
    }

    const json = JSON.parse(raw);
    buffers.push(Buffer.from(json.audioContent || '', 'base64'));
  }

  return Buffer.concat(buffers);
}

/* ── 7. 매니페스트 ───────────────────────────────────────────────────────
   문장마다 내용 해시를 남깁니다. 본문을 고치면 그 문장만 다시 굽고,
   나머지는 그대로 둡니다(합성 비용·시간 절약). */

function loadManifest() {
  try {
    return JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  } catch {
    return { generatedAt: '', voices: {}, items: {} };
  }
}

/* ── 8. 실행 ────────────────────────────────────────────────────────────── */

function summarize(entries) {
  const byGroup = {};
  entries.forEach((e) => {
    byGroup[e.group] = byGroup[e.group] || { count: 0, chars: 0 };
    byGroup[e.group].count++;
    byGroup[e.group].chars += e.text.length;
  });

  const chars = entries.reduce((a, e) => a + e.text.length, 0);

  console.log('\n  굽을 대상');
  Object.keys(byGroup).forEach((g) => {
    const v = byGroup[g];
    console.log('   · ' + (GROUP_LABELS[g] || g).padEnd(10) + ' ' + String(v.count).padStart(4) + '개 · ' +
      String(v.chars).padStart(7) + '자 · 약 ' + minutes(v.chars).toFixed(0) + '분');
  });
  console.log('   ' + '합계'.padEnd(11) + ' ' + String(entries.length).padStart(4) + '개 · ' +
    String(chars).padStart(7) + '자 · 약 ' + minutes(chars).toFixed(0) + '분');
  console.log('\n  예상 비용 (100만 자당 Standard $4 · Neural2/Wavenet $16 · Chirp3-HD $30)');
  ['Standard', 'Neural2', 'Chirp3-HD'].forEach((t) => {
    const usd = estimate(chars, t);
    console.log('   · ' + t.padEnd(9) + ' $' + usd.toFixed(2));
  });
  console.log('\n  예상 용량 (한 파일로 이어 붙였을 때)');
  [32, 48].forEach((kbps) => {
    console.log('   · ' + kbps + 'kbps mono  ' + mb(chars, kbps).toFixed(1) + 'MB');
  });
}

async function main() {
  const issues = loadMagazine();
  const entries = collect(issues, GROUPS);

  if (!entries.length) throw new Error('굽을 문장이 없습니다 — --groups 값을 확인하세요 (' + GROUPS.join(',') + ')');

  console.log('\n  EngMon 오디오 팩 — ' + (DRY ? '분량만 계산(--dry-run)' : 'Google Cloud TTS 로 합성'));
  summarize(entries);

  if (DRY) {
    console.log('\n  --dry-run 이라 파일을 만들지 않았습니다.');
    console.log('  실제 합성:  export GOOGLE_TTS_KEY=...  &&  node tools/make-audio.mjs\n');
    return;
  }

  if (!KEY) {
    throw new Error('Google TTS API 키가 없습니다 — GOOGLE_TTS_KEY 환경변수 또는 --key 로 넘기세요');
  }
  if (typeof fetch !== 'function') {
    throw new Error('이 Node 버전에는 fetch 가 없습니다 — Node 18 이상으로 실행하세요');
  }

  fs.mkdirSync(OUT, { recursive: true });

  const voices = await resolveVoices();
  console.log('\n  음성 — 미국식: ' + voices.us.name + ' · 영국식: ' + voices.uk.name + '  (' + voices.source + ')');

  const manifest = loadManifest();
  manifest.voices = { us: voices.us, uk: voices.uk, rate: RATE };
  manifest.items = manifest.items || {};

  let made = 0;
  let skipped = 0;
  let bytes = 0;

  for (const entry of entries) {
    const voice = entry.accent === 'uk' ? voices.uk : voices.us;
    const hash = hash8(entry.text + '|' + voice.name + '|' + RATE);
    const file = entry.id + '.mp3';
    const target = path.join(OUT, file);
    const known = manifest.items[entry.id];

    entry.file = file;
    entry.voice = voice.name;
    entry.accent = entry.accent || 'us';

    if (!FORCE && known && known.hash === hash && fs.existsSync(target)) {
      skipped++;
      manifest.items[entry.id] = Object.assign(known, {
        group: entry.group, week: entry.week, text: entry.text, file, voice: voice.name, hash,
      });
      continue;
    }

    const audio = await synthesize(entry.text, voice);
    fs.writeFileSync(target, audio);
    bytes += audio.length;
    made++;

    manifest.items[entry.id] = {
      group: entry.group,
      week: entry.week,
      section: entry.section,
      accent: entry.accent,
      who: entry.who || '',
      text: entry.text,
      file,
      voice: voice.name,
      hash,
    };

    console.log('   ✓ ' + file + '  ' + Math.round(audio.length / 1024) + 'KB  ' + entry.text.slice(0, 40));
  }

  manifest.generatedAt = new Date().toISOString();
  manifest.count = Object.keys(manifest.items).length;
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1) + '\n');

  console.log('\n  합성 ' + made + '개 · 그대로 둔 것 ' + skipped + '개 · 새 파일 ' + (bytes / 1024 / 1024).toFixed(1) + 'MB');
  console.log('  위치: ' + path.relative(ROOT, OUT) + '/  (gitignore 대상 — 저장소에 커밋하지 마세요)');
  console.log('  판매 묶음: Gumroad 상품의 파일 목록에 이 폴더의 mp3 를 함께 올립니다.');
  console.log('  구성·가격은 docs/PRICING.md, 상품 문구는 docs/PRODUCT-COPY.md 를 보세요.\n');
}

main().catch((err) => {
  console.error('\n  오디오 팩 생성 실패: ' + (err && err.message ? err.message : err) + '\n');
  process.exitCode = 1;
});
