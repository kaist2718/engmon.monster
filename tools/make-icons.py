#!/usr/bin/env python3
"""EngMon 홈 화면 아이콘(PNG) 생성기.

`icon.svg` 와 같은 도안(어두운 대각선 그라데이션 + 민트색 E 워드마크)을 PNG 로 굽습니다.
iOS 홈 화면(`apple-touch-icon`)과 Chrome 설치형 앱(manifest)은 SVG 를 쓰지 않으므로
192·512 래스터 아이콘이 필요합니다.

생성물 (저장소 루트):
  icon-192.png            일반 아이콘 (둥근 모서리, 투명 배경)
  icon-512.png            일반 아이콘
  icon-maskable-512.png   마스커블 — 안드로이드가 원형 등으로 잘라도 안전하도록 꽉 찬 사각형
  apple-touch-icon.png    iOS 홈 화면 (180px, 꽉 찬 사각형 — iOS 가 직접 둥글게 자릅니다)

실행:  python tools/make-icons.py
필요 환경: Python 3 + Pillow (개발자 PC 에서 한 번만 돌리는 도구입니다.
생성된 PNG 는 og.png 처럼 저장소에 함께 커밋합니다.)
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:  # pragma: no cover - 안내용
    print("❌ Pillow 가 필요합니다:  python -m pip install pillow", file=sys.stderr)
    raise SystemExit(1)

ROOT = Path(__file__).resolve().parent.parent

# icon.svg 의 도안 값 (viewBox 0 0 512 512 기준)
VIEW = 512
RADIUS = 112
GRAD_FROM = (0x14, 0x1B, 0x24)
GRAD_TO = (0x0A, 0x0E, 0x13)
LETTER = "E"
LETTER_SIZE = 250          # 폰트 크기(px, 512 기준)
LETTER_CY = 262            # 글자 중심 y
LETTER_COLOR = (0x6E, 0xE7, 0xA8, 255)
SUPERSAMPLE = 4            # 계단 현상을 줄이려 4배로 그린 뒤 줄입니다.

# 사용할 글꼴 후보(설치된 첫 번째 것을 씁니다).
LETTER_FONTS = [
    "C:/Windows/Fonts/arialbd.ttf",
    "C:/Windows/Fonts/arial.ttf",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
]


def first_existing(paths: list[str]) -> str | None:
    for p in paths:
        if os.path.exists(p):
            return p
    return None


def gradient(size: int) -> Image.Image:
    """좌상단 → 우하단 대각선 그라데이션(icon.svg 의 linearGradient 와 같은 방향)."""
    img = Image.new("RGB", (size, size))
    px = img.load()
    span = (size - 1) * 2  # x+y 의 최댓값
    for y in range(size):
        for x in range(size):
            t = (x + y) / span if span else 0.0
            px[x, y] = (
                round(GRAD_FROM[0] + (GRAD_TO[0] - GRAD_FROM[0]) * t),
                round(GRAD_FROM[1] + (GRAD_TO[1] - GRAD_FROM[1]) * t),
                round(GRAD_FROM[2] + (GRAD_TO[2] - GRAD_FROM[2]) * t),
            )
    return img


def draw_icon(size: int, *, rounded: bool, content_scale: float) -> Image.Image:
    """아이콘 한 장을 그립니다.

    rounded=True  → 둥근 모서리 + 투명 배경(일반 아이콘)
    rounded=False → 꽉 찬 사각형(마스커블·iOS). 플랫폼이 직접 잘라 씁니다.
    content_scale → 도안을 얼마나 줄여 가운데 둘지(마스커블 안전 영역 확보용)
    """
    ss = size * SUPERSAMPLE
    base = Image.new("RGBA", (ss, ss), (0, 0, 0, 0))

    grad = gradient(ss).convert("RGBA")
    if rounded:
        mask = Image.new("L", (ss, ss), 0)
        ImageDraw.Draw(mask).rounded_rectangle(
            [0, 0, ss - 1, ss - 1], radius=round(RADIUS / VIEW * ss), fill=255
        )
        base.paste(grad, (0, 0), mask)
    else:
        base.paste(grad, (0, 0))

    design = Image.new("RGBA", (ss, ss), (0, 0, 0, 0))
    k = ss / VIEW  # 512 좌표계 → 현재 캔버스

    font_path = first_existing(LETTER_FONTS)
    if font_path:
        font = ImageFont.truetype(font_path, round(LETTER_SIZE * k))
        ImageDraw.Draw(design).text(
            (VIEW / 2 * k, LETTER_CY * k), LETTER, font=font, anchor="mm", fill=LETTER_COLOR
        )
    else:
        print("⚠️  글꼴을 찾지 못했습니다(글자 없이 생성).", file=sys.stderr)

    if content_scale != 1.0:
        inner = round(ss * content_scale)
        design = design.resize((inner, inner), Image.LANCZOS)
        canvas = Image.new("RGBA", (ss, ss), (0, 0, 0, 0))
        off = (ss - inner) // 2
        canvas.paste(design, (off, off))
        design = canvas

    base.alpha_composite(design)
    return base.resize((size, size), Image.LANCZOS)


def check(img: Image.Image, path: Path, *, opaque_square: bool) -> list[str]:
    """생성 결과가 쓸 만한지 확인합니다(빈 이미지·투명 배경 사고 방지)."""
    problems: list[str] = []
    w, h = img.size
    if w != h:
        problems.append(f"{path.name}: 정사각형이 아닙니다 ({w}×{h})")
    alpha = img.getchannel("A")
    corner = alpha.getpixel((0, 0))
    center = alpha.getpixel((w // 2, h // 2))
    if opaque_square:
        if corner != 255:
            problems.append(f"{path.name}: 꽉 찬 사각형이어야 하는데 모서리가 투명합니다")
    else:
        if corner != 0:
            problems.append(f"{path.name}: 둥근 모서리여야 하는데 모서리가 불투명합니다")
    if center != 255:
        problems.append(f"{path.name}: 가운데가 비어 있습니다")
    colors = img.convert("RGB").getcolors(maxcolors=100000)
    if not colors or len(colors) < 8:
        problems.append(f"{path.name}: 색이 너무 적습니다(빈 이미지일 수 있음)")
    return problems


def main() -> int:
    # Windows 콘솔(cp949)에서도 한글이 깨지지 않도록 출력 인코딩을 UTF-8로 맞춥니다.
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass

    ap = argparse.ArgumentParser(description="EngMon 아이콘 생성")
    ap.parse_args()

    # (파일명, 크기, 둥근 모서리, 도안 배율)
    targets = [
        ("icon-192.png", 192, True, 1.0),
        ("icon-512.png", 512, True, 1.0),
        ("icon-maskable-512.png", 512, False, 0.72),
        ("apple-touch-icon.png", 180, False, 0.72),
    ]

    problems: list[str] = []
    print("🎨 아이콘 생성")
    for name, size, rounded, scale in targets:
        img = draw_icon(size, rounded=rounded, content_scale=scale)
        out = ROOT / name
        img.save(out, "PNG", optimize=True)
        kb = out.stat().st_size / 1024
        print(f"   · {name}  {size}×{size}  {kb:.1f}KB")
        problems += check(img, out, opaque_square=not rounded)

    if problems:
        print("\n❌ 문제가 있습니다")
        for p in problems:
            print("   - " + p)
        return 1
    print("\n✅ 아이콘 4종 생성 완료 (manifest·apple-touch-icon 연결은 소스에서 관리합니다)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
