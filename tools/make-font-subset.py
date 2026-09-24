#!/usr/bin/env python3
"""본문 서체(Pretendard Variable) 서브셋 생성기.

왜 필요한가
  Pretendard 원본 가변 폰트는 6.7MB 입니다. 통째로 내려주기는 큽니다.
  그래서 사이트에 **실제로 나오는 글자만** 남긴 woff2 를 만들어 **우리 도메인에서**
  한 파일로 내려줍니다(외부 CDN 요청 0).

무엇을 하는가
  1) `node tools/font-charset.mjs --out .cache/charset.txt` 로 사이트 글자 집합을 받습니다
     (정의는 그 파일 한 곳).
  2) 그 글자만 남겨 `assets/fonts/pretendard-variable.woff2` 를 만듭니다(가변 축 유지).
  3) 폰트가 실제로 담은 글자 목록을 `assets/fonts/charset.json` 에 적습니다.

언제 다시 돌리나
  화면에 나오는 글자가 늘었을 때(새 주 발행 등). 실행:  python tools/make-font-subset.py
필요 환경: Python 3 + fontTools + brotli.
          생성된 woff2 와 charset.json 은 저장소에 함께 커밋합니다.
"""

import json
import os
import subprocess
import sys
import urllib.request

# Windows 콘솔 기본 인코딩(cp949)에서 한글·이모지 출력이 깨지지 않게 합니다.
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:  # pragma: no cover - 구버전 파이썬
    pass

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE_DIR = os.path.join(ROOT, ".cache")
SOURCE_URL = (
    "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9"
    "/packages/pretendard/dist/public/variable/PretendardVariable.ttf"
)
SOURCE_VERSION = "v1.3.9"
SOURCE_FONT = os.path.join(CACHE_DIR, "PretendardVariable.ttf")
CHARSET_TXT = os.path.join(CACHE_DIR, "charset.txt")
OUT_FONT = os.path.join(ROOT, "assets", "fonts", "pretendard-variable.woff2")
OUT_META = os.path.join(ROOT, "assets", "fonts", "charset.json")

# 남길 OpenType 기능. 발음기호 결합 문자에 mark/mkmk 가 필요합니다.
LAYOUT_FEATURES = "kern,liga,calt,ccmp,mark,mkmk,rlig,clig,locl"


def codepoints_to_ranges(codepoints):
    """[32, 33, 34, 40, 41] → ["20-22", "28-29"] — 목록을 짧고 읽기 쉽게(줄 단위 = 구간)."""
    ranges = []
    for cp in sorted(codepoints):
        if ranges and cp == ranges[-1][1] + 1:
            ranges[-1][1] = cp
        else:
            ranges.append([cp, cp])
    return [f"{a:x}" if a == b else f"{a:x}-{b:x}" for a, b in ranges]


def run(cmd, **kwargs):
    print("  $ " + " ".join(cmd))
    return subprocess.run(cmd, cwd=ROOT, check=True, **kwargs)


def main():
    try:
        from fontTools import subset  # noqa: F401
        from fontTools.ttLib import TTFont
    except ImportError:
        print("❌ fontTools 가 필요합니다:  python -m pip install fonttools brotli", file=sys.stderr)
        return 1

    os.makedirs(CACHE_DIR, exist_ok=True)
    os.makedirs(os.path.dirname(OUT_FONT), exist_ok=True)

    # 1) 사이트 글자 집합 — 정의는 Node 쪽 한 곳(tools/font-charset.mjs).
    run(["node", "tools/font-charset.mjs", "--out", os.path.relpath(CHARSET_TXT, ROOT).replace("\\", "/")])

    # 2) 원본 가변 폰트(6.7MB). 커밋하지 않고 .cache 에만 받아 둡니다.
    if not os.path.exists(SOURCE_FONT):
        print(f"  원본 폰트 내려받기 … {SOURCE_URL}")
        try:
            urllib.request.urlretrieve(SOURCE_URL, SOURCE_FONT)
        except Exception as e:  # 네트워크 없음 등
            print(f"❌ 원본 폰트를 받지 못했습니다({e}).\n   네트워크가 되면 다시 실행하세요.", file=sys.stderr)
            return 1

    # 3) 서브셋 — .cache/charset.txt 의 글자만 남기고 woff2 로 굽습니다.
    from fontTools import subset as subset_mod

    subset_mod.main(
        [
            SOURCE_FONT,
            f"--unicodes-file={CHARSET_TXT}",
            f"--layout-features={LAYOUT_FEATURES}",
            "--no-hinting",
            "--flavor=woff2",
            f"--output-file={OUT_FONT}",
        ]
    )

    # 4) 폰트가 실제로 담은 글자 ↔ 요청했지만 못 담은 글자(이모지 등).
    requested = {
        int(tok, 16)
        for tok in open(CHARSET_TXT, encoding="utf-8").read().replace("\n", "").split(",")
        if tok
    }
    font = TTFont(OUT_FONT)
    covered = set(font.getBestCmap().keys())
    ignored = sorted(requested - covered)
    size = os.path.getsize(OUT_FONT)

    meta = {
        "family": "Pretendard Variable",
        "source": SOURCE_URL,
        "version": SOURCE_VERSION,
        "file": "assets/fonts/pretendard-variable.woff2",
        "bytes": size,
        "glyphs": len(covered),
        "covered": codepoints_to_ranges(covered),
        "ignored": codepoints_to_ranges(ignored),
    }
    with open(OUT_META, "w", encoding="utf-8", newline="\n") as f:
        json.dump(meta, f, ensure_ascii=False, indent=1, sort_keys=False)
        f.write("\n")

    print(f"\n  글자 {len(requested)}자 요청 → 폰트가 담은 글자 {len(covered)}자 · 무시 {len(ignored)}자(이모지 등)")
    print(f"  assets/fonts/pretendard-variable.woff2  {size / 1024:.1f}KB")
    print(f"  assets/fonts/charset.json               {os.path.getsize(OUT_META) / 1024:.1f}KB")
    print("\n✅ 서브셋 생성 완료")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
