"""
Remove only background connected to image edges (typical gray frame/box),
without hollowing out interior logo artwork.
"""
from __future__ import annotations

from collections import deque

from PIL import Image

INPUT = r"src/assets/scarrow-final_logo.png"
OUTPUT = r"src/assets/scarrow-final_logo.png"


def is_bg_like(r: int, g: int, b: int) -> bool:
    """Neutral gray / light gray panels used as flat backgrounds."""
    if r < 95 or g < 95 or b < 95:
        return False
    if r > 252 and g > 252 and b > 252:
        return True
    drg = abs(int(r) - int(g))
    dgb = abs(int(g) - int(b))
    drb = abs(int(r) - int(b))
    if drg > 38 or dgb > 38 or drb > 38:
        return False
    # mid gray through light gray
    return max(r, g, b) < 245


def neighbors(x: int, y: int, w: int, h: int):
    if x > 0:
        yield x - 1, y
    if x + 1 < w:
        yield x + 1, y
    if y > 0:
        yield x, y - 1
    if y + 1 < h:
        yield x, y + 1


def main() -> None:
    im = Image.open(INPUT).convert("RGBA")
    w, h = im.size
    px = im.load()
    seen = [[False] * w for _ in range(h)]
    q: deque[tuple[int, int]] = deque()

    def try_add(x: int, y: int) -> None:
        if seen[y][x]:
            return
        r, g, b, a = px[x, y]
        if a < 200:
            return
        if not is_bg_like(r, g, b):
            return
        seen[y][x] = True
        q.append((x, y))

    for x in range(w):
        try_add(x, 0)
        try_add(x, h - 1)
    for y in range(h):
        try_add(0, y)
        try_add(w - 1, y)

    removed = 0
    while q:
        x, y = q.popleft()
        r, g, b, _ = px[x, y]
        px[x, y] = (r, g, b, 0)
        removed += 1
        for nx, ny in neighbors(x, y, w, h):
            if seen[ny][nx]:
                continue
            nr, ng, nb, na = px[nx, ny]
            if na < 200:
                continue
            if not is_bg_like(nr, ng, nb):
                continue
            # stay on similar tone to avoid eating into logo strokes
            if abs(nr - r) > 45 or abs(ng - g) > 45 or abs(nb - b) > 45:
                continue
            seen[ny][nx] = True
            q.append((nx, ny))

    im.save(OUTPUT, "PNG")
    print(f"edge-removed pixels: {removed} — {OUTPUT}")


if __name__ == "__main__":
    main()
