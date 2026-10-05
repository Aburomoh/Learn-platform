"""Tutor pose assets (#354): owner's local pose PNGs -> small WebP files in public/tutor/.

Usage: python scripts/tutor-assets.py [SOURCE_DIR]
SOURCE_DIR defaults to MyPics/tutor-pose-library (git-ignored, local only); the expressive poses
(#378) are read from SOURCE_DIR/expressive. The source PNGs are never committed; only the outputs are:
  public/tutor/<pose>.webp        168 px square head-and-shoulders crop (3x the 56 px disc)
  public/tutor/<pose>-waist.webp  480 px wide waist-up figure
Edges are cleaned first: near-invisible speckles dropped, alpha eroded by 1 px, and the colour of
semi-transparent edge pixels replaced by the nearby opaque colour (removes the red fringe).
Requires Pillow and NumPy.
"""

import io
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "MyPics" / "tutor-pose-library"
OUT = ROOT / "public" / "tutor"

POSES = ["neutral", "explaining", "thinking", "focus", "encouraging", "try_again", "correct", "point_left", "point_right", "welcome"]
# The expressive extension (#378): only the five poses the design system uses (DESIGN_SYSTEM.md, Tutor
# area); they live in SOURCE_DIR/expressive. The other thirteen are deliberately not generated.
EXPRESSIVE = ["aha", "proud", "reassuring", "caution", "curious"]
CROP_PX, WAIST_W = 168, 480
BUDGET = {"crop": 15_000, "waist": 45_000}
# Head-and-shoulders square, as fractions of the source width: side, and margin above the hair.
CROP_SIDE, CROP_HEADROOM = 0.68, 0.06


def blur(a: np.ndarray, r: int = 4) -> np.ndarray:
    """Box sum over a (2r+1) square window (summed-area table)."""
    p = np.pad(a.astype(np.float64), ((r + 1, r), (r + 1, r))).cumsum(0).cumsum(1)
    k = 2 * r + 1
    return p[k:, k:] - p[:-k, k:] - p[k:, :-k] + p[:-k, :-k]


def clean(im: Image.Image) -> Image.Image:
    rgba = np.asarray(im.convert("RGBA")).astype(np.float32)
    alpha = rgba[..., 3]
    alpha[alpha < 16] = 0  # stray speckles around the figure
    eroded = np.asarray(Image.fromarray(alpha.astype(np.uint8)).filter(ImageFilter.MinFilter(3))).astype(np.float32)
    # Colour bleed: average colour of fully opaque pixels nearby, used for every edge pixel.
    solid = (alpha >= 250).astype(np.float32)
    weight = blur(solid)
    rgb = rgba[..., :3].copy()
    edge = (eroded > 0) & (eroded < 250) & (weight > 0)
    for c in range(3):
        bled = blur(rgba[..., c] * solid) / np.maximum(weight, 1e-6)
        rgb[..., c][edge] = bled[edge]
    out = np.dstack([rgb, eroded]).clip(0, 255).astype(np.uint8)
    return Image.fromarray(out, "RGBA")


def head_box(im: Image.Image) -> tuple[int, int, int, int]:
    """Square around the head and shoulders: centred on the hair/face mass near the top."""
    alpha = np.asarray(im)[..., 3]
    w, h = im.size
    rows = np.nonzero((alpha > 128).sum(axis=1) > 8)[0]
    top = int(rows[0])
    band = alpha[top : top + int(0.2 * w)] > 128
    cx = int(np.nonzero(band)[1].mean())
    side = int(CROP_SIDE * w)
    left = min(max(cx - side // 2, 0), w - side)
    upper = max(top - int(CROP_HEADROOM * w), 0)
    return left, upper, left + side, upper + side


def webp(im: Image.Image, budget: int) -> bytes:
    for quality in range(85, 30, -5):
        buf = io.BytesIO()
        im.save(buf, "WEBP", quality=quality, alpha_quality=80, method=6)
        if buf.tell() <= budget:
            return buf.getvalue()
    raise SystemExit(f"cannot meet {budget} bytes")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for pose in POSES + EXPRESSIVE:
        source = SRC / ("expressive" if pose in EXPRESSIVE else "") / f"tutor_{pose}.png"
        im = clean(Image.open(source))
        crop = im.crop(head_box(im)).resize((CROP_PX, CROP_PX), Image.LANCZOS)
        waist = im.resize((WAIST_W, round(im.height * WAIST_W / im.width)), Image.LANCZOS)
        for name, img, kind in ((f"{pose}.webp", crop, "crop"), (f"{pose}-waist.webp", waist, "waist")):
            data = webp(img, BUDGET[kind])
            (OUT / name).write_bytes(data)
            print(f"{name:24} {len(data) / 1000:5.1f} kB")


if __name__ == "__main__":
    main()
