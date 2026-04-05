"""Generate square-cropped favicons from the wide logo PNG."""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src" / "assets" / "scarrow-final_logo.png"
ASSETS = ROOT / "src" / "assets"
ICO_OUT = ROOT / "src" / "favicon.ico"


def main() -> None:
    im = Image.open(SRC).convert("RGBA")
    w, h = im.size
    side = min(w, h)
    left = (w - side) // 2
    top = (h - side) // 2
    crop = im.crop((left, top, left + side, top + side))

    crop.resize((16, 16), Image.Resampling.LANCZOS).save(ASSETS / "favicon-16.png", optimize=True)
    crop.resize((32, 32), Image.Resampling.LANCZOS).save(ASSETS / "favicon-32.png", optimize=True)
    crop.resize((48, 48), Image.Resampling.LANCZOS).save(ASSETS / "favicon-48.png", optimize=True)
    crop.resize((180, 180), Image.Resampling.LANCZOS).save(ASSETS / "apple-touch-icon.png", optimize=True)

    crop.resize((16, 16), Image.Resampling.LANCZOS).save(
        ICO_OUT,
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)],
    )
    print(f"OK {w}x{h} -> square {side}px; wrote favicons + {ICO_OUT.name}")


if __name__ == "__main__":
    main()
