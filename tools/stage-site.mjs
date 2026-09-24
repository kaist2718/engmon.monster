#!/usr/bin/env node
/**
 * 배포용 사이트 폴더(_site) 구성 — 공개할 파일만 골라 담습니다.
 *
 * 왜 필요한가:
 *   이 저장소는 사이트 파일과 운영 도구가 한 루트에 섞여 있습니다. main 브랜치를
 *   그대로 배포하면 tools/ · package.json · .github/ 까지 인터넷에 공개됩니다.
 *   GitHub Pages 를 "Deploy from a branch" 로 두면 브랜치 루트 전체가 공개되므로,
 *   배포 전에 **공개 목록에 있는 파일만** _site 로 복사하고 빠진 것이 없는지 검증합니다.
 *
 * 무엇을 검사하는가:
 *   ① 공개 목록의 파일·폴더가 실제로 있는가 (없으면 실패 — 조용히 빠지는 것을 막습니다)
 *   ② sitemap.xml 의 모든 URL 이 _site 안에 실제 파일로 존재하는가
 *   ③ _site 안의 HTML 이 부르는 로컬 자산(link·script·img·source)이 모두 있는가
 *   ④ _site 안에 운영 경로(tools/ · .github/ · package.json …)가 섞이지 않았는가
 *
 * 하지 않는 것 (의도적):
 *   index.html 의 인라인 스크립트(테마 부트스트랩·사이트 ID)는 첫 페인트 전에
 *   실행되어야 합니다. 다른 파일로 빼면 화면이 깜박이므로 배포본에서도 손대지 않습니다.
 *   (toeic.monster 처럼 인라인 분리·HTML 최소화를 하지 않는 이유입니다.)
 *
 * 실행:  node tools/stage-site.mjs
 * 종료 코드: 문제가 있으면 1, 없으면 0
 *
 * 외부 의존성 없음(Node 내장 모듈만 사용).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "_site");
const SITE = "https://engmon.monster";

/** 사이트로 그대로 배포하는 루트 파일. 새 파일을 만들면 여기에도 넣어야 배포됩니다. */
const PUBLIC_FILES = [
  "index.html",
  "404.html",
  "privacy.html",
  "terms.html",
  "manifest.webmanifest",
  "sw.js",
  "robots.txt",
  "sitemap.xml",
  "CNAME",
  "icon.svg",
  "icon-192.png",
  "icon-512.png",
  "icon-maskable-512.png",
  "apple-touch-icon.png",
  "og.png",
  // 사이트 스타일·스크립트 (index.html 이 부르는 파일)
  "styles.css",
  "script.js",
  "magazine.js",
  "issues.js",
];

/** 사이트로 그대로 배포하는 폴더. */
const PUBLIC_DIRS = ["assets"];

/** _site 안에 절대 있으면 안 되는 것들(개발·운영 자료). */
const NEVER_PUBLIC = [
  "tools",
  ".github",
  "_site",
  ".gitignore",
  ".gitattributes",
  "package.json",
  "smoke-test.js",
  "browser-test.js",
];

const problems = [];
const fail = (msg) => problems.push(msg);
const exists = (p) => fs.existsSync(path.join(ROOT, p));

/* ------------------------------------------------------------------ */
/* 1. _site 새로 만들고 공개 목록만 복사                                */
/* ------------------------------------------------------------------ */

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

let fileCount = 0;
let byteCount = 0;

for (const f of PUBLIC_FILES) {
  if (!exists(f)) {
    fail(`공개 목록에 있는 파일이 없습니다 — ${f} (아이콘은 python tools/make-icons.py 로 만듭니다)`);
    continue;
  }
  fs.copyFileSync(path.join(ROOT, f), path.join(OUT, f));
  fileCount++;
  byteCount += fs.statSync(path.join(OUT, f)).size;
}

for (const dir of PUBLIC_DIRS) {
  if (!exists(dir)) {
    fail(`공개 목록에 있는 폴더가 없습니다 — ${dir}/`);
    continue;
  }
  fs.cpSync(path.join(ROOT, dir), path.join(OUT, dir), { recursive: true });
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) walk(full);
      else {
        fileCount++;
        byteCount += fs.statSync(full).size;
      }
    }
  })(path.join(OUT, dir));
}

/* ------------------------------------------------------------------ */
/* 2. 검증                                                             */
/* ------------------------------------------------------------------ */

/** _site 안에 실제로 있는 파일인지. */
const inSite = (rel) => fs.existsSync(path.join(OUT, rel));

/** URL·상대 주소를 _site 기준 상대 경로로 바꿉니다(디렉터리 주소는 index.html). */
const toFile = (entry) => {
  let f = String(entry).trim().replace(/^\.?\//, "");
  if (f === "" || f.endsWith("/")) f += "index.html";
  return f;
};

// ② sitemap.xml 의 모든 URL 이 _site 에 있는가
const sitemapPath = path.join(OUT, "sitemap.xml");
if (!fs.existsSync(sitemapPath)) {
  fail("sitemap.xml 이 _site 에 없습니다.");
} else {
  const locs = [...fs.readFileSync(sitemapPath, "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  if (!locs.length) fail("sitemap.xml 에 <loc> 항목이 없습니다.");
  for (const loc of locs) {
    if (!loc.startsWith(SITE)) {
      fail(`sitemap.xml: 다른 사이트 주소가 들어 있습니다 — ${loc}`);
      continue;
    }
    const rel = toFile(loc.slice(SITE.length));
    if (!inSite(rel)) {
      fail(
        `sitemap.xml 의 페이지가 _site 에 없습니다 — ${loc}\n` +
          "     → 새 섹션을 만들었다면 tools/stage-site.mjs 의 PUBLIC_FILES/PUBLIC_DIRS 에 추가하세요.",
      );
    }
  }
}

// ③ _site 안 HTML 이 부르는 로컬 자산이 모두 있는가
const htmlFiles = [];
(function collectHtml(dir, prefix) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${e.name}` : e.name;
    if (e.isDirectory()) collectHtml(path.join(dir, e.name), rel);
    else if (e.name.endsWith(".html")) htmlFiles.push(rel);
  }
})(OUT, "");

const missingAssets = new Set();
for (const page of htmlFiles) {
  const html = fs.readFileSync(path.join(OUT, page), "utf8");
  for (const m of html.matchAll(/<(?:link|script|img|source)\b[^>]*\b(?:href|src)="([^"]+)"/g)) {
    const value = m[1].trim();
    if (!value) continue;
    if (/^(https?:)?\/\//i.test(value) || /^(mailto:|tel:|data:|#)/i.test(value)) continue;
    const clean = value.split("?")[0].split("#")[0];
    const rel = clean.startsWith("/")
      ? clean.slice(1)
      : path.posix.normalize(path.posix.join(path.posix.dirname(page), clean));
    if (!rel || !inSite(rel)) missingAssets.add(`${value} (${page})`);
  }
}
for (const a of missingAssets) fail(`_site 안에서 자산을 찾을 수 없습니다 — ${a}`);

// ④ 개발·운영 경로가 섞이지 않았는가
for (const bad of NEVER_PUBLIC) {
  if (fs.existsSync(path.join(OUT, bad))) {
    fail(`_site 에 공개하면 안 되는 경로가 들어 있습니다 — ${bad}`);
  }
}

/* ------------------------------------------------------------------ */
/* 3. 리포트                                                           */
/* ------------------------------------------------------------------ */

console.log("📦 배포용 사이트 폴더(_site) 구성");
console.log(`   · 파일 ${fileCount}개 · ${(byteCount / 1024 / 1024).toFixed(2)}MB`);
console.log(`   · 공개 파일 ${PUBLIC_FILES.length}개 · 공개 폴더 ${PUBLIC_DIRS.join(", ")}`);
console.log(`   · 제외: ${NEVER_PUBLIC.join(", ")}`);

if (problems.length) {
  console.log(`\n❌ 문제 ${problems.length}건`);
  problems.forEach((p) => console.log("   - " + p));
  process.exit(1);
}
console.log("\n✅ 배포할 파일만 담겼고, 빠진 자산도 없습니다");
