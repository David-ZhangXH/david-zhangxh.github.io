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

# ------------------------------------------------------------------ the message board (painted at 2x)
# A slim cork pinboard on the ribbed wall between the monitor and the shelves.
# Visitors' words live behind it (see src/core/board.js); here it just hangs.
BOARD = (2052, 340, 2252, 800)   # 2x px; world rect ≈ w .24 h .55 at (.574, .444)
def paint_board(img, box):
    x0, y0, x1, y1 = box
    w, h = x1 - x0, y1 - y0
    rng = np.random.default_rng(716)
    layer = Image.new('RGBA', img.size, (0, 0, 0, 0))
    # wall shadow: soft, offset down-right like the shelf's
    sh = Image.new('RGBA', img.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).rectangle([x0 + 6, y0 + 10, x1 + 8, y1 + 12], fill=(0, 0, 0, 150))
    sh = sh.filter(ImageFilter.GaussianBlur(9))
    layer = Image.alpha_composite(layer, sh)
    d = ImageDraw.Draw(layer)
    # frame: dark walnut, a warmer bevel on the left where the magenta tube reaches
    d.rectangle([x0, y0, x1, y1], fill=(38, 22, 18, 255))
    d.rectangle([x0, y0, x0 + 3, y1], fill=(84, 44, 52, 255))
    d.rectangle([x0, y0, x1, y0 + 3], fill=(66, 36, 40, 255))
    d.rectangle([x1 - 3, y0, x1, y1], fill=(22, 12, 12, 255))
    d.rectangle([x0, y1 - 3, x1, y1], fill=(18, 10, 10, 255))
    # cork, lit dimly: warm brown with fine grain, darker toward the floor
    fx0, fy0, fx1, fy1 = x0 + 10, y0 + 10, x1 - 10, y1 - 10
    cw, ch = fx1 - fx0, fy1 - fy0
    yy = np.linspace(0, 1, ch)[:, None]
    base = np.array([108, 72, 50], dtype=np.float32) * (1.0 - 0.32 * yy)[..., None]
    base = np.broadcast_to(base, (ch, cw, 3)).copy()
    grain = rng.normal(0, 7, (ch, cw, 1)) + rng.normal(0, 3, (ch, cw, 3))
    spots = (rng.random((ch, cw)) > 0.985)[..., None] * -22
    cork = np.clip(base + grain + spots, 0, 255).astype(np.uint8)
    cork = Image.fromarray(cork).filter(ImageFilter.GaussianBlur(0.6))
    # magenta cast on the left third, faint cyan on the right edge
    cast = Image.new('RGB', (cw, ch), (0, 0, 0))
    cd = ImageDraw.Draw(cast)
    for i in range(cw):
        k = i / max(1, cw - 1)
        m = max(0, 1 - k * 2.4) * 34; c = max(0, (k - 0.75) * 4) * 18
        cd.line([(i, 0), (i, ch)], fill=(int(m * 0.9), int(c * 0.6), int(m * 0.8 + c)))
    cork = ImageChops.add(cork, cast)
    layer.paste(cork, (fx0, fy0))
    d = ImageDraw.Draw(layer)
    # pinned scraps: a few small, slightly tilted papers with a pin each
    scraps = [((22, 30), (70, 62), (206, 196, 176), (214, 70, 70), -4),
              ((104, 58), (62, 78), (196, 200, 186), (235, 200, 70), 5),
              ((30, 150), (84, 58), (210, 190, 170), (80, 130, 220), 3),
              ((96, 232), (72, 66), (200, 194, 182), (214, 70, 70), -6),
              ((26, 318), (66, 52), (208, 200, 176), (90, 180, 120), 4)]
    for (sx, sy), (sw, shh), col, pin, tilt in scraps:
        paper = Image.new('RGBA', (sw + 20, shh + 20), (0, 0, 0, 0))
        pd = ImageDraw.Draw(paper)
        dim = tuple(int(c * 0.56) for c in col) + (255,)
        pd.rectangle([10, 10, 10 + sw, 10 + shh], fill=dim)
        # faint handwriting lines
        for ly in range(10 + 14, 10 + shh - 6, 9):
            pd.line([(16, ly), (10 + sw - 8 - (ly * 7) % 15, ly)], fill=(58, 48, 44, 255), width=2)
        paper = paper.rotate(tilt, resample=Image.BICUBIC, expand=False)
        psh = Image.new('RGBA', paper.size, (0, 0, 0, 0))
        ImageDraw.Draw(psh).rectangle([12, 13, 12 + sw, 13 + shh], fill=(0, 0, 0, 120))
        psh = psh.rotate(tilt, resample=Image.BICUBIC).filter(ImageFilter.GaussianBlur(2))
        layer.alpha_composite(psh, (fx0 + sx - 10, fy0 + sy - 10))
        layer.alpha_composite(paper, (fx0 + sx - 10, fy0 + sy - 10))
        pcx, pcy = fx0 + sx + sw // 2, fy0 + sy + 6
        d.ellipse([pcx - 5, pcy - 5, pcx + 5, pcy + 5], fill=tuple(int(c * 0.75) for c in pin) + (255,))
        d.ellipse([pcx - 3, pcy - 4, pcx, pcy - 1], fill=(255, 255, 255, 110))
    # ambient: the whole board sits in the room's dusk
    dusk = Image.new('RGBA', img.size, (0, 0, 0, 0))
    ImageDraw.Draw(dusk).rectangle([x0, y0, x1, y1], fill=(6, 3, 12, 40))
    out = Image.alpha_composite(img.convert('RGBA'), layer)
    out = Image.alpha_composite(out, dusk)
    return out.convert('RGB')
base2 = paint_board(base2, BOARD)
base2.save(OUT_BASE, 'WEBP', quality=86, method=6)
base2.crop((1900, 250, 2500, 900)).save('/tmp/board-preview.png')

# previews for a human eye
full.crop((270, 50, 420, 390)).resize((300, 680), Image.LANCZOS).save('/tmp/notes-new.png')
print('baked', OUT_BASE, full.size)
