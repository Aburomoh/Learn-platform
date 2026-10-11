"""CET Learn logo exports (#591): the owner's handoff PNGs -> sized web assets in public/brand/ and src/app/.

Usage: python scripts/brand-assets.py [SOURCE_DIR]
SOURCE_DIR holds the handoff's assets/cet-learn-horizontal.png and assets/cet-learn-icon.png (the zip
`public/CET_Learn_Logo_Handoff.zip` unpacked; local only, never committed). Per CET_LEARN_LOGO_GUIDE.md
the artwork is scaled proportionally from the lossless PNG sources, never recoloured, cropped or
re-encoded from the supplied WebP; all metadata is dropped (Pillow writes none). Outputs:
  public/brand/cet-learn-horizontal-{48,96}.webp   header lockup at 1x and 2x of 48 CSS px tall (lossless)
  public/brand/cet-learn-icon-{48,96}.webp          the icon mark, 1x and 2x of 48 CSS px (lossless)
  src/app/icon.png (512), src/app/apple-icon.png (180), src/app/favicon.ico (16 + 32)  square, centred, padded
  public/brand/icon-192.png                          for the web manifest
Requires Pillow.
"""

import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "CET_Learn_Logo_Handoff"
OUT = ROOT / "public" / "brand"
APP = ROOT / "src" / "app"

HEADER_H = 48
ICON = 48


def load(name: str) -> Image.Image:
    im = Image.open(SRC / "assets" / name).convert("RGBA")
    im.info.pop("exif", None)
    return im


def by_height(im: Image.Image, h: int) -> Image.Image:
    w = round(im.width * h / im.height)
    return im.resize((w, h), Image.LANCZOS)


def square(im: Image.Image, side: int, pad: float) -> Image.Image:
    """The mark centred on a transparent square canvas with `pad` of the side as margin (guide: keep padding)."""
    inner = round(side * (1 - 2 * pad))
    scale = min(inner / im.width, inner / im.height)
    mark = im.resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))), Image.LANCZOS)
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(mark, ((side - mark.width) // 2, (side - mark.height) // 2), mark)
    return canvas


def save_webp(im: Image.Image, path: Path) -> None:
    im.save(path, "WEBP", lossless=True, quality=100, method=6, exif=b"")
    print(f"{path.relative_to(ROOT)}  {im.width}x{im.height}  {path.stat().st_size // 1024} KB")


def save_png(im: Image.Image, path: Path) -> None:
    im.save(path, "PNG", optimize=True)
    print(f"{path.relative_to(ROOT)}  {im.width}x{im.height}  {path.stat().st_size // 1024} KB")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    horizontal = load("cet-learn-horizontal.png")
    icon = load("cet-learn-icon.png")
    for k in (1, 2):
        save_webp(by_height(horizontal, HEADER_H * k), OUT / f"cet-learn-horizontal-{HEADER_H * k}.webp")
        save_webp(by_height(icon, ICON * k), OUT / f"cet-learn-icon-{ICON * k}.webp")
    # app icons: the mark centred with comfortable padding (10 %), as the guide asks for square canvases
    save_png(square(icon, 512, 0.1), APP / "icon.png")
    save_png(square(icon, 180, 0.1), APP / "apple-icon.png")
    save_png(square(icon, 192, 0.1), OUT / "icon-192.png")
    # favicon: 16 and 32 px frames; a little less padding so the mark stays readable at 16 px
    frames = [square(icon, s, 0.04) for s in (32, 16)]
    fav = APP / "favicon.ico"
    frames[0].save(fav, "ICO", sizes=[(32, 32), (16, 16)], append_images=frames[1:])
    print(f"{fav.relative_to(ROOT)}  16+32  {fav.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
