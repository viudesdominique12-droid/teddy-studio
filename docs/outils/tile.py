import sys
from PIL import Image
src, prefix = sys.argv[1], sys.argv[2]
tile_h = int(sys.argv[3]) if len(sys.argv) > 3 else 1800
scale = float(sys.argv[4]) if len(sys.argv) > 4 else 0.5
im = Image.open(src)
W, H = im.size
n = 0
for y in range(0, H, tile_h):
    t = im.crop((0, y, W, min(H, y + tile_h)))
    t = t.resize((int(t.width * scale), int(t.height * scale)), Image.LANCZOS)
    t.save(f"{prefix}-{n:02d}.jpg", quality=80)
    n += 1
print(n, "tiles", W, H)
