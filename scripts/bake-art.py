# Builds public/images/studio-desk.jpg from the pristine concept PNG:
# 1) sticky notes repainted to David's words  2) childhood photo baked
# into the painted frame's true aperture (v15 recipe).
from PIL import Image, ImageEnhance, ImageDraw, ImageFilter, ImageFont
import numpy as np, os

SRC = '/mnt/user-data/uploads/davidworld-site/public/images/creator-studio-desk-v3.png'
art = Image.open(SRC).convert('RGB')
W, H = art.size

# ---- 1. sticky notes: Happy. / Love. / Dream. ----
NOTES = [  # (text area strictly inside each paper), text
    ((313, 106, 382, 163), 'Happy.'),
    ((295, 208, 372, 258), 'Love.'),
    ((303, 304, 379, 359), 'Dream &\nPassion.')
]
FONT_PATH = '/usr/share/fonts/truetype/google-fonts/Lora-Italic-Variable.ttf'
for (x0, y0, x1, y1), word in NOTES:
    region = art.crop((x0, y0, x1, y1))
    region = region.filter(ImageFilter.MedianFilter(11)).filter(ImageFilter.MedianFilter(7))
    region = region.filter(ImageFilter.GaussianBlur(1.2))
    art.paste(region, (x0, y0))
    d = ImageDraw.Draw(art)
    lines = word.split('\n')
    size = 22 if len(lines) == 1 else 17
    while size > 10:
        font = ImageFont.truetype(FONT_PATH, size)
        widest = max(d.textbbox((0, 0), ln, font=font)[2] - d.textbbox((0, 0), ln, font=font)[0] for ln in lines)
        if widest <= (x1 - x0) - 6: break
        size -= 1
    lh = size + 4
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    top = cy - (lh * len(lines)) / 2
    for k, ln in enumerate(lines):
        bb = d.textbbox((0, 0), ln, font=font)
        tw = bb[2] - bb[0]
        d.text((cx - tw / 2 - bb[0], top + k * lh - bb[1] + 2), ln, font=font, fill=(52, 38, 34))

# ---- 2. photo bake (v15) ----
quad = [(152.0, 524.4), (294.8, 507.2), (309.4, 601.6), (165.2, 622.0)]
cx = sum(p[0] for p in quad) / 4; cy = sum(p[1] for p in quad) / 4
quad = [(x + (cx - x) * 0.003, y + (cy - y) * 0.003) for x, y in quad]
tl, tr, br, bl = quad
topw = np.hypot(tr[0]-tl[0], tr[1]-tl[1]); botw = np.hypot(br[0]-bl[0], br[1]-bl[1])
lh = np.hypot(bl[0]-tl[0], bl[1]-tl[1]); rh = np.hypot(br[0]-tr[0], br[1]-tr[1])
aspect = ((topw + botw) / 2) / ((lh + rh) / 2)
photo = Image.open('public/photos/then.jpg').convert('RGB')
cw = 386; ch = int(cw / aspect)
crop = photo.crop((200, 30, 200 + cw, 30 + ch)).resize((772, int(772 / aspect)), Image.LANCZOS)
crop = ImageEnhance.Brightness(crop).enhance(0.74)
crop = ImageEnhance.Color(crop).enhance(0.90)
crop = ImageEnhance.Contrast(crop).enhance(1.05)
crop = Image.blend(crop, Image.new('RGB', crop.size, (44, 38, 58)), 0.06)

def find_coeffs(src_pts, dst_pts):
    m = []
    for (X, Y), (x, y) in zip(src_pts, dst_pts):
        m.append([x, y, 1, 0, 0, 0, -X * x, -X * y])
        m.append([0, 0, 0, x, y, 1, -Y * x, -Y * y])
    return np.linalg.solve(np.array(m, float), np.array([c for p in src_pts for c in p], float))

w, h = crop.size
coeffs = find_coeffs([(0, 0), (w, 0), (w, h), (0, h)], quad)
warped = crop.transform((W, H), Image.PERSPECTIVE, coeffs, Image.BICUBIC)
mask = Image.new('L', (W * 2, H * 2), 0)
ImageDraw.Draw(mask).polygon([(x * 2, y * 2) for x, y in quad], fill=255)
mask = mask.resize((W, H), Image.LANCZOS).filter(ImageFilter.GaussianBlur(0.5))
art.paste(warped, (0, 0), mask)
depth = 0.06
tl2 = (tl[0] + (bl[0] - tl[0]) * depth, tl[1] + (bl[1] - tl[1]) * depth)
tr2 = (tr[0] + (br[0] - tr[0]) * depth, tr[1] + (br[1] - tr[1]) * depth)
sh = Image.new('L', (W * 2, H * 2), 0)
ImageDraw.Draw(sh).polygon([(p[0] * 2, p[1] * 2) for p in [tl, tr, tr2, tl2]], fill=58)
sh = sh.resize((W, H), Image.LANCZOS).filter(ImageFilter.GaussianBlur(1.3))
sh = Image.composite(sh, Image.new('L', (W, H), 0), mask)
art = Image.composite(Image.new('RGB', (W, H), (6, 5, 9)), art, sh)

art.save('src/assets/studio-desk.jpg', 'JPEG', quality=88, optimize=True)
art.crop((270, 50, 420, 390)).resize((300, 680), Image.LANCZOS).save('/tmp/notes-new.png')
print('saved', os.path.getsize('src/assets/studio-desk.jpg') // 1024, 'KB')
