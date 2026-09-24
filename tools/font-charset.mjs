#!/usr/bin/env node
/**
 * 사이트가 실제로 화면에 내보내는 글자 집합 — 폰트 서브셋의 입력.
 *
 * 왜 필요한가:
 *   본문 서체(Pretendard)를 통째로 내려받으면 수 MB 입니다. 그래서 사이트에
 *   **실제로 나오는 글자만** 담은 서브셋을 만들어 우리 도메인에서 한 파일로 줍니다.
 *   이 파일이 그 입력(문자 집합)을 만드는 유일한 정의입니다 — Python 도구
 *   (tools/make-font-subset.py)가 같은 정의를 씁니다.
 *
 * 하는 일:
 *   화면에 글자가 나오는 파일(HTML + 데이터 JS + 스타일)을 모두 읽어
 *   코드포인트 합집합을 만듭니다.
 *
 * 실행:
 *   node tools/font-charset.mjs                       # 통계만
 *   node tools/font-charset.mjs --out .cache/charset.txt
 * 종료 코드: 항상 0.
 *
 * 외부 의존성 없음(Node 내장 모듈만 사용).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * 화면에 글자가 나오는 파일들. 새 콘텐츠 파일을 추가하면 여기에도 넣어야 합니다
 * (빠뜨리면 그 글자가 서브셋에 없어 다른 글꼴로 보입니다).
 */
const FILES = [
  "index.html",
  "404.html",
  "privacy.html",
  "terms.html",
  "manifest.webmanifest",
  "styles.css",
  "assets/site.css",
  "script.js",
  "magazine.js",
  "issues.js",
];

/** 사이트 화면에 나오는 글자를 모두 모읍니다. */
export function collectCharset(root = ROOT) {
  const files = FILES.filter((f) => fs.existsSync(path.join(root, f)));

  const set = new Set();
  for (const rel of files) {
    const text = fs.readFileSync(path.join(root, rel), "utf8");
    for (const ch of text) set.add(ch.codePointAt(0));
  }
  return { codepoints: [...set].sort((a, b) => a - b), files };
}

/** 코드포인트 목록을 fontTools 가 읽는 형식(`--unicodes-file`)으로. */
export function toUnicodeFile(codepoints) {
  return codepoints.map((c) => c.toString(16)).join(",") + "\n";
}

/** 0xAC00~0xD7A3 한글 음절 수. */
export const countHangul = (codepoints) => codepoints.filter((c) => c >= 0xac00 && c <= 0xd7a3).length;

/* 실행될 때만 통계를 찍습니다(다른 도구가 import 할 때는 조용히). */
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { codepoints, files } = collectCharset();
  const outAt = process.argv.indexOf("--out");
  if (outAt >= 0 && process.argv[outAt + 1]) {
    const out = path.resolve(ROOT, process.argv[outAt + 1]);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, toUnicodeFile(codepoints));
    console.log(`→ ${path.relative(ROOT, out)} (${codepoints.length}자)`);
  }
  console.log(
    `사이트 글자 ${codepoints.length}자 (한글 음절 ${countHangul(codepoints)}자) · ` +
      `파일 ${files.length}개에서 수집`,
  );
}
