#!/usr/bin/env node
/**
 * 로컬 미리보기 서버 — 배포 구조와 같은 경로로 화면을 확인합니다.
 *
 * 왜 필요한가:
 *   이 사이트는 서비스 워커(sw.js)와 웹앱 매니페스트(manifest.webmanifest)를 씁니다.
 *   둘은 **file:// 로 열면 동작하지 않습니다**(보안 출처 제약). 오프라인·설치 동작을
 *   확인하려면 http 로 띄워야 합니다.
 *
 * 무엇을 하는가:
 *   · 프로젝트 루트를 그대로 서빙합니다(배포 구조와 같은 경로).
 *   · GitHub Pages 와 같게 동작시킵니다 — 없는 주소는 404.html 을 404 상태로 돌려줍니다.
 *   · .js · .css · .webmanifest 에 정확한 Content-Type 을 줍니다
 *     (타입이 틀리면 서비스워커·매니페스트가 조용히 무시됩니다).
 *
 * 캐시에 대해 (중요):
 *   서버는 no-store 로 보내지만, 페이지가 sw.js 를 등록합니다.
 *   sw.js 는 HTML 은 네트워크 우선(항상 최신), 그 밖의 에셋은 stale-while-revalidate
 *   입니다. 그래서 CSS/JS 를 고치면 첫 새로고침에는 옛 내용이 보이고 두 번째에 반영됩니다.
 *   개발 중이라면 개발자도구 → Application → Service Workers 에서
 *   "Update on reload" 를 켜 두세요. 걸리면 "Unregister" 로 등록을 해제하면 됩니다.
 *
 * 실행:  node tools/serve.mjs                 (http://localhost:8000)
 *        node tools/serve.mjs --port 5000
 *        node tools/serve.mjs --open          (기본 브라우저로 열기)
 * 종료:  Ctrl+C
 *
 * 외부 의존성 없음(Node 내장 모듈만 사용).
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const HOST = "127.0.0.1";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = argv.indexOf(name);
  return i === -1 ? fallback : argv[i + 1];
};
const startPort = Number(arg("--port", 8000)) || 8000;
const shouldOpen = argv.includes("--open");

/** 요청 주소를 프로젝트 안의 실제 파일로 바꿉니다. 루트 밖으로 나가면 null 입니다. */
function resolveFile(urlPath) {
  let p = urlPath;
  try {
    p = decodeURIComponent(p);
  } catch {
    return null;
  }
  p = p.split("?")[0].split("#")[0];
  const target = path.join(ROOT, p);

  // 루트 밖(../ 등)은 거부합니다.
  const rel = path.relative(ROOT, target);
  if (rel.startsWith("..") || path.isAbsolute(rel)) return null;

  if (!fs.existsSync(target)) {
    // 확장자 없는 주소에 .html 이 있으면 그것을 씁니다(GitHub Pages 와 같은 동작).
    if (!path.extname(target) && fs.existsSync(target + ".html")) return target + ".html";
    return null;
  }
  if (fs.statSync(target).isDirectory()) {
    const index = path.join(target, "index.html");
    return fs.existsSync(index) ? index : null;
  }
  return target;
}

const server = http.createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { "content-type": "text/plain; charset=utf-8", allow: "GET, HEAD" });
    res.end("GET / HEAD 만 지원합니다.\n");
    return;
  }

  const file = resolveFile(req.url || "/");
  const headers = { "cache-control": "no-store, must-revalidate" };

  if (!file) {
    // GitHub Pages 의 커스텀 404 와 같은 화면을 같은 상태 코드로 돌려줍니다.
    const notFound = path.join(ROOT, "404.html");
    console.log(`  404  ${req.url}`);
    if (fs.existsSync(notFound)) {
      headers["content-type"] = MIME[".html"];
      res.writeHead(404, headers);
      if (req.method === "HEAD") return res.end();
      fs.createReadStream(notFound).pipe(res);
      return;
    }
    headers["content-type"] = MIME[".txt"];
    res.writeHead(404, headers);
    res.end("not found\n");
    return;
  }

  headers["content-type"] = MIME[path.extname(file).toLowerCase()] || "application/octet-stream";
  headers["content-length"] = String(fs.statSync(file).size);
  res.writeHead(200, headers);
  if (req.method === "HEAD") return res.end();
  fs.createReadStream(file).pipe(res);
});

/** 포트가 사용 중이면 다음 포트를 시도합니다. */
function listen(port) {
  return new Promise((resolve, reject) => {
    const onError = (e) => {
      server.off("listening", onListening);
      reject(e);
    };
    const onListening = () => {
      server.off("error", onError);
      resolve(port);
    };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port, HOST);
  });
}

let port = startPort;
for (let i = 0; i < 20; i++) {
  try {
    port = await listen(startPort + i);
    break;
  } catch (e) {
    if (e.code !== "EADDRINUSE") throw e;
    if (i === 19) throw new Error(`포트 ${startPort}~${startPort + 19} 이 모두 사용 중입니다.`);
  }
}

const url = `http://localhost:${port}/`;

console.log("");
console.log("▲ engmon.monster 로컬 미리보기");
console.log(`   ${url}`);
if (port !== startPort) console.log(`   (${startPort} 이 사용 중이라 ${port} 로 열었습니다)`);
console.log("");
console.log("   · 매거진          " + url);
console.log("   · 개인정보처리방침 " + url + "privacy.html");
console.log("   · 이용약관        " + url + "terms.html");
console.log("");
console.log("   · 서버는 파일을 항상 새로 읽습니다(no-store) — 고친 뒤 새로고침이면 반영됩니다.");
console.log("   · 서비스워커가 에셋을 stale-while-revalidate 로 잡으므로, CSS/JS 를 고쳤다면");
console.log("     개발자도구 → Application → Service Workers 의 \"Update on reload\" 를 켜 두세요.");
console.log("   · Ctrl+C 로 종료");
console.log("");

if (shouldOpen) {
  const cmd =
    process.platform === "win32" ? ["cmd", ["/c", "start", "", url]]
      : process.platform === "darwin" ? ["open", [url]]
        : ["xdg-open", [url]];
  try {
    spawn(cmd[0], cmd[1], { detached: true, stdio: "ignore" }).unref();
  } catch {
    console.log("   ℹ️  브라우저를 자동으로 열지 못했습니다. 위 주소를 직접 열어 주세요.");
  }
}

for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    server.close();
    console.log("\n로컬 미리보기를 종료했습니다.");
    process.exit(0);
  });
}
