# Builds the desk artwork from the pristine concept PNG:
#   src/assets/studio-desk.webp   the whole painting, 2x, gently sharpened
# Steps: repaint the sticky notes as whole sheets (Happy. / Love. / Dream & Passion.)
# and bake the childhood photo into the painted frame's true aperture.
# (v22's depth layers / cat were removed in v23 at David's request — calm desk.)
from PIL import Image, ImageEnhance, ImageDraw, ImageFilter, ImageFont, ImageChops
import numpy as np, os, json, math

SRC = '/mnt/user-data/uploads/davidworld-site/public/images/creator-studio-desk-v3.png'
OUT_BASE = 'src/assets/studio-desk.webp'
FONT_PATH = '/usr/share/fonts/truetype/google-fonts/Lora-Italic-Variable.ttf'

art = Image.open(SRC).convert('RGB')
W, H = art.size
pristine = art.copy()

# ------------------------------------------------------------------ notes
# Full paper repaint: (paper box, pin center, words). The paper is rebuilt as a
# whole sheet with the original's own tone gradient, so nothing looks half-erased.
NOTES = [
    ((310, 88, 385, 168), (347, 90), 'Happy.'),
    ((292, 192, 374, 262), (327, 192), 'Love.'),
    ((300, 292, 382, 362), (332, 290), 'Dream &\nPassion.'),
]
def paper_tone(x0, y0, x1, y1):
    # sample the paper's tone near its top and bottom edges (avoiding text)
    top = np.asarray(pristine.crop((x0 + 6, y0 + 14, x1 - 6, y0 + 20))).reshape(-1, 3).mean(0)
    bot = np.asarray(pristine.crop((x0 + 6, y1 - 12, x1 - 6, y1 - 6))).reshape(-1, 3).mean(0)
    return top, bot
for (x0, y0, x1, y1), (px_, py_), word in NOTES:
    pin = pristine.crop((px_ - 12, py_ - 12, px_ + 12, py_ + 12))
    pin_mask = Image.new('L', (24, 24), 0); ImageDraw.Draw(pin_mask).ellipse([1, 1, 22, 22], fill=255)
    top, bot = paper_tone(x0, y0, x1, y1)
    w, h = x1 - x0, y1 - y0
    grad = np.zeros((h, w, 3), dtype=np.uint8)
    for r in range(h):
        k = r / max(1, h - 1)
        grad[r, :, :] = (top * (1 - k) + bot * k).clip(0, 255)
    paper = Image.fromarray(grad)
    # gentle paper texture
    noise = Image.effect_noise((w, h), 6).convert('L')
    paper = Image.blend(paper, Image.merge('RGB', (noise, noise, noise)), 0.05)
    # soft drop shadow first, then the sheet, then a 1px darker edge
    shadow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rectangle([x0 + 3, y0 + 4, x1 + 3, y1 + 4], fill=(0, 0, 0, 110))
    shadow = shadow.filter(ImageFilter.GaussianBlur(4))
    art = Image.alpha_composite(art.convert('RGBA'), shadow).convert('RGB')
    art.paste(paper, (x0, y0))
    d = ImageDraw.Draw(art)
    edge = tuple(int(c * 0.78) for c in bot)
    d.rectangle([x0, y0, x1 - 1, y1 - 1], outline=edge)
    # words — sized to sit comfortably inside the sheet
    lines = word.split('\n')
    size = 17 if len(lines) == 1 else 14
    while size > 9:
        font = ImageFont.truetype(FONT_PATH, size)
        widest = max(d.textbbox((0, 0), ln, font=font)[2] - d.textbbox((0, 0), ln, font=font)[0] for ln in lines)
        if widest <= w - 16: break
        size -= 1
    lh = size + 5
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2 + 4
    top_y = cy - (lh * len(lines)) / 2
    for k, ln in enumerate(lines):
        bb = d.textbbox((0, 0), ln, font=font)
        d.text((cx - (bb[2] - bb[0]) / 2 - bb[0], top_y + k * lh - bb[1]), ln, font=font, fill=(40, 26, 26))
    art.paste(pin, (px_ - 12, py_ - 12), pin_mask)

# ------------------------------------------------------------------ photo in frame
quad = [(152.0, 524.4), (294.8, 507.2), (309.4, 601.6), (165.2, 622.0)]
cx = sum(p[0] for p in quad) / 4; cy = sum(p[1] for p in quad) / 4
quad = [(x + (cx - x) * 0.003, y + (cy - y) * 0.003) for x, y in quad]
tl, tr, br, bl = quad
topw = np.hypot(tr[0]-tl[0], tr[1]-tl[1]); botw = np.hypot(br[0]-bl[0], br[1]-bl[1])
lh_ = np.hypot(bl[0]-tl[0], bl[1]-tl[1]); rh = np.hypot(br[0]-tr[0], br[1]-tr[1])
aspect = ((topw + botw) / 2) / ((lh_ + rh) / 2)
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
        m.append([x, y, 1, 0, 0, 0, -X * x, -X * y]); m.append([0, 0, 0, x, y, 1, -Y * x, -Y * y])
    return np.linalg.solve(np.array(m, float), np.array([c for p in src_pts for c in p], float))
w_, h_ = crop.size
warped = crop.transform((W, H), Image.PERSPECTIVE, find_coeffs([(0, 0), (w_, 0), (w_, h_), (0, h_)], quad), Image.BICUBIC)
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

full = art.copy()   # the complete painting — shipped whole (David asked for the calm desk back)

# ------------------------------------------------------------------ base plate: 2x, gentle sharpen
base2 = full.resize((W * 2, H * 2), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.4, percent=55, threshold=2))
base2.save(OUT_BASE, 'WEBP', quality=86, method=6)

# previews for a human eye
full.crop((270, 50, 420, 390)).resize((300, 680), Image.LANCZOS).save('/tmp/notes-new.png')
print('baked', OUT_BASE, full.size)
