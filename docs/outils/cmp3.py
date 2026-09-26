import sys
from PIL import Image, ImageDraw
prefix, names, out = sys.argv[1], sys.argv[2].split(','), sys.argv[3]
tw = int(sys.argv[4]) if len(sys.argv) > 4 else 620
rows = []
for n in names:
    ims = [Image.open(f'{prefix}-{n}-{t}.jpg') for t in ['vert', 'nuit', 'papier']]
    th = int(ims[0].height * tw / ims[0].width)
    rows.append([im.resize((tw, th)) for im in ims])
th = rows[0][0].height
s = Image.new('RGB', (3 * tw + 20, len(rows) * (th + 10)), 'white')
for r, row in enumerate(rows):
    for c, im in enumerate(row):
        s.paste(im, (c * (tw + 10), r * (th + 10)))
s.save(out, quality=80); print(s.size)
