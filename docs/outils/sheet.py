import sys, glob
from PIL import Image, ImageDraw
pattern, out = sys.argv[1], sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 3
tw = int(sys.argv[4]) if len(sys.argv) > 4 else 480
files = sorted(glob.glob(pattern))
ims = [Image.open(f) for f in files]
th = int(ims[0].height * tw / ims[0].width)
rows = (len(ims) + cols - 1) // cols
pad = 8
sheet = Image.new('RGB', (cols * (tw + pad) + pad, rows * (th + pad + 14) + pad), (255, 255, 255))
d = ImageDraw.Draw(sheet)
for i, im in enumerate(ims):
    r, c = divmod(i, cols)
    x, y = pad + c * (tw + pad), pad + r * (th + pad + 14)
    sheet.paste(im.resize((tw, th), Image.LANCZOS), (x, y + 14))
    d.text((x, y), f"{i:02d}", fill=(0, 0, 0))
sheet.save(out, quality=82)
print(len(ims), sheet.size)
