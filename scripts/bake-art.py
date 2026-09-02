# Builds every desk artwork asset from the pristine concept PNG:
#   src/assets/studio-desk.webp        base plate (2x, sharpened, holes inpainted)
#   src/assets/layers/<name>.webp      depth-layer cutouts (2x, alpha)
#   src/assets/layers/manifest.json    bbox + depth per layer (art px @1x)
#   src/assets/layers/cat-body.webp, cat-tail.webp   小花 asleep by the monitor
# Steps: repaint the sticky notes (Happy. / Love. / Dream & Passion.), bake the
# childhood photo into the painted frame, paint the cat, cut the layers.
from PIL import Image, ImageEnhance, ImageDraw, ImageFilter, ImageFont, ImageChops
import numpy as np, os, json, math
import cv2

SRC = '/mnt/user-data/uploads/davidworld-site/public/images/creator-studio-desk-v3.png'
OUT_BASE = 'src/assets/studio-desk.webp'
OUT_DIR = 'src/assets/layers'
os.makedirs(OUT_DIR, exist_ok=True)
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
        d.text((cx - (bb[2] - bb[0]) / 2 - bb[0], top_y + k * lh - bb[1]), ln, font=font, fill=(58, 42, 38))
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

full = art.copy()   # the complete painting, before cutting layers

# ------------------------------------------------------------------ layer cutouts
LAYERS = {
    # name: (polygon in art px, depth factor 0..1, extra)
    'tray':       ([(18, 655), (320, 632), (462, 690), (458, 850), (430, 885), (150, 895), (25, 860)], 1.0),
    'mug':        ([(466, 612), (486, 588), (600, 588), (606, 700), (500, 712), (468, 690)], 0.85),
    'keyboard':   ([(655, 618), (1010, 604), (1202, 608), (1206, 668), (1030, 702), (660, 702)], 0.55),
    'headphones': ([(1088, 402), (1212, 404), (1232, 470), (1222, 560), (1226, 598), (1090, 598), (1078, 560), (1076, 470)], 0.5),
    'handheld':   ([(1254, 498), (1470, 490), (1476, 626), (1400, 642), (1258, 616)], 0.45),
    'candle':     ([(1504, 478), (1606, 476), (1616, 656), (1508, 662)], 0.4),
}
def feathered_mask(poly, extra=None):
    m = Image.new('L', (W * 2, H * 2), 0)
    ImageDraw.Draw(m).polygon([(x * 2, y * 2) for x, y in poly], fill=255)
    m = m.resize((W, H), Image.LANCZOS)
    if extra is not None: m = ImageChops.lighter(m, extra)
    return m.filter(ImageFilter.GaussianBlur(0.8))

# plant: colour-keyed leaves inside its box + the pot polygon
arr = np.asarray(full).astype(int)
r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
leaves = (g > r + 12) & (g > b + 4) & (g > 55)
box = np.zeros_like(leaves); box[370:700, 0:150] = True
leaf_mask = Image.fromarray((leaves & box).astype(np.uint8) * 255)
leaf_mask = leaf_mask.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(3))
pot_poly = [(0, 560), (96, 560), (100, 690), (0, 700)]
plant_mask = feathered_mask(pot_poly, extra=leaf_mask)
masks = {}  # plant leaves are near-black in the source — no clean cut possible
for name, (poly, depthf) in LAYERS.items():
    masks[name] = (feathered_mask(poly), depthf)

manifest = {'w': W, 'h': H, 'layers': {}}
union = Image.new('L', (W, H), 0)
for name, (m, depthf) in masks.items():
    bbox = m.getbbox()
    x0, y0, x1, y1 = bbox
    cut = full.crop(bbox).convert('RGBA')
    cut.putalpha(m.crop(bbox))
    cut = cut.resize(((x1 - x0) * 2, (y1 - y0) * 2), Image.LANCZOS)
    cut.save(f'{OUT_DIR}/{name}.webp', 'WEBP', quality=88, method=6)
    manifest['layers'][name] = {'bbox': [x0, y0, x1, y1], 'depth': depthf}
    union = ImageChops.lighter(union, m)

# ------------------------------------------------------------------ 小花, asleep beside the monitor
def paint_cat():
    S = 3                                   # paint at 3x, ship at 2x
    cw_, ch_ = 190, 90                      # art px footprint (x 878..1068, y 538..628)
    body = Image.new('RGBA', (cw_ * S, ch_ * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(body)
    # contact shadow on the desk
    shadow = Image.new('RGBA', body.size, (0, 0, 0, 0))
    ImageDraw.Draw(shadow).ellipse([12 * S, 56 * S, 178 * S, 86 * S], fill=(6, 3, 8, 175))
    shadow = shadow.filter(ImageFilter.GaussianBlur(6 * S))
    ao = Image.new('RGBA', body.size, (0, 0, 0, 0))
    ImageDraw.Draw(ao).ellipse([24 * S, 64 * S, 160 * S, 80 * S], fill=(4, 2, 6, 200))
    shadow = Image.alpha_composite(shadow, ao.filter(ImageFilter.GaussianBlur(2.5 * S)))
    # silhouette: curled body (ellipse) + tucked head (circle) + ears
    sil = Image.new('L', body.size, 0)
    sd = ImageDraw.Draw(sil)
    sd.ellipse([18 * S, 26 * S, 150 * S, 78 * S], fill=255)              # body
    sd.ellipse([118 * S, 22 * S, 176 * S, 74 * S], fill=255)             # head
    sd.polygon([(126 * S, 32 * S), (130 * S, 8 * S), (148 * S, 28 * S)], fill=255)   # left ear
    sd.polygon([(154 * S, 26 * S), (168 * S, 8 * S), (174 * S, 34 * S)], fill=255)  # right ear
    sil = sil.filter(ImageFilter.GaussianBlur(0.6 * S))
    # fuzzy fur silhouette: erode the clean shape a little, then grow it back
    # with noise so the edge breaks into soft fur instead of a vector line
    fuzz = np.asarray(Image.effect_noise(body.size, 40).convert('L')).astype(np.float32) / 255
    sil_np = np.asarray(sil).astype(np.float32) / 255
    core = np.asarray(sil.filter(ImageFilter.MinFilter(5))).astype(np.float32) / 255
    band = sil_np - core
    sil_np = np.clip(core + band * (fuzz > 0.42), 0, 1)
    sil = Image.fromarray((sil_np * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.9))
    # fur base + volumetric shading (light: cool purple from top-left, cyan rim from the right)
    base = np.zeros((ch_ * S, cw_ * S, 3), dtype=np.float32)
    yy, xx = np.mgrid[0:ch_ * S, 0:cw_ * S].astype(np.float32)
    lx, ly = 70 * S, 18 * S
    dist = np.sqrt((xx - lx) ** 2 + (yy - ly) ** 2) / (125 * S)
    light = np.clip(1.08 - dist * 0.9, 0.22, 1.0)
    # belly / contact darkening toward the desk
    belly = np.clip((yy - 44 * S) / (36 * S), 0, 1) ** 1.4
    light = light * (1 - 0.55 * belly)
    grey = np.array([112, 116, 128], dtype=np.float32)
    base[:, :, :] = grey * light[:, :, None]
    base[:, :, 2] += 14 * light; base[:, :, 0] += 5 * light          # cool cast
    rim = np.clip((xx - 128 * S) / (52 * S), 0, 1) * np.clip(1 - (yy - 26 * S) / (48 * S), 0, 1)
    base[:, :, 1] += 26 * rim; base[:, :, 2] += 34 * rim              # cyan rim (hex lights)
    lrim = np.clip(1 - (xx - 18 * S) / (30 * S), 0, 1) * np.clip(1 - (yy - 26 * S) / (40 * S), 0, 1)
    base[:, :, 0] += 30 * lrim; base[:, :, 2] += 26 * lrim            # magenta rim (LED strip)
    # directional fur: noise streaked along the body curve
    fur = np.asarray(Image.effect_noise((cw_ * S, ch_ * S), 26).convert('L')
                     .resize((cw_ * S // 6, ch_ * S), Image.BOX).resize((cw_ * S, ch_ * S), Image.BILINEAR)).astype(np.float32) / 255 - 0.5
    fine = np.asarray(Image.effect_noise((cw_ * S, ch_ * S), 18).convert('L')).astype(np.float32) / 255 - 0.5
    base += fur[:, :, None] * 22 + fine[:, :, None] * 8
    fur_img = Image.fromarray(np.clip(base, 0, 255).astype(np.uint8))
    cat = Image.new('RGBA', body.size, (0, 0, 0, 0))
    cat.paste(fur_img, (0, 0), sil)
    cd = ImageDraw.Draw(cat)
    # tabby stripes along the back, soft
    stripes = Image.new('RGBA', body.size, (0, 0, 0, 0))
    sd2 = ImageDraw.Draw(stripes)
    for k in range(5):
        x = (44 + k * 18) * S
        sd2.arc([x - 10 * S, 28 * S, x + 14 * S, 70 * S], 200, 330, fill=(40, 42, 52, 140), width=int(2.2 * S))
    stripes = stripes.filter(ImageFilter.GaussianBlur(1.2 * S))
    cat = Image.alpha_composite(cat, Image.composite(stripes, Image.new('RGBA', body.size, (0, 0, 0, 0)), sil))
    # white spots: chest patch + a blaze on the face (小花 has white spots)
    spots = Image.new('RGBA', body.size, (0, 0, 0, 0))
    sp = ImageDraw.Draw(spots)
    sp.ellipse([96 * S, 52 * S, 134 * S, 78 * S], fill=(232, 232, 226, 235))
    sp.ellipse([146 * S, 46 * S, 166 * S, 66 * S], fill=(236, 236, 230, 230))
    spots = spots.filter(ImageFilter.GaussianBlur(1.0 * S))
    cat = Image.alpha_composite(cat, Image.composite(spots, Image.new('RGBA', body.size, (0, 0, 0, 0)), sil))
    cd = ImageDraw.Draw(cat)
    # ear insides, closed eyes, nose, whiskers
    cd.polygon([(131 * S, 29 * S), (133 * S, 15 * S), (143 * S, 27 * S)], fill=(150, 108, 118, 220))
    cd.polygon([(157 * S, 27 * S), (166 * S, 15 * S), (169 * S, 31 * S)], fill=(150, 108, 118, 220))
    cd.arc([132 * S, 40 * S, 146 * S, 50 * S], 15, 165, fill=(28, 26, 34, 255), width=int(1.4 * S))
    cd.arc([152 * S, 40 * S, 166 * S, 50 * S], 15, 165, fill=(28, 26, 34, 255), width=int(1.4 * S))
    cd.ellipse([146 * S, 52 * S, 152 * S, 56 * S], fill=(196, 130, 138, 255))
    for ang in (-12, 0, 12):
        a = math.radians(ang)
        cd.line([(146 * S, 55 * S), (146 * S - 26 * S * math.cos(a), 55 * S + 12 * S * math.sin(a))], fill=(220, 220, 214, 120), width=max(1, S // 2))
        cd.line([(152 * S, 55 * S), (152 * S + 26 * S * math.cos(a), 55 * S + 12 * S * math.sin(a))], fill=(220, 220, 214, 120), width=max(1, S // 2))
    # soft outline to seat it in the painting
    outline = sil.filter(ImageFilter.MaxFilter(3)).point(lambda v: v)  # slightly larger
    edge = ImageChops.subtract(outline, sil)
    edge_img = Image.new('RGBA', body.size, (12, 8, 16, 0)); edge_img.putalpha(edge.point(lambda v: int(v * 0.55)))
    cat = Image.alpha_composite(cat, edge_img)
    body_layer = Image.alpha_composite(shadow, cat)

    # tail: separate layer, pivot at the body's rear-bottom (world attach point)
    tw, th = 96, 44
    tail = Image.new('RGBA', (tw * S, th * S), (0, 0, 0, 0))
    tm = Image.new('L', tail.size, 0)
    td = ImageDraw.Draw(tm)
    # a thick curve from the pivot (left) sweeping right along the front
    pts = [(6, 10), (20, 24), (40, 30), (62, 28), (80, 20)]
    for i in range(len(pts) - 1):
        (x0, y0), (x1, y1) = pts[i], pts[i + 1]
        td.line([(x0 * S, y0 * S), (x1 * S, y1 * S)], fill=255, width=int((12 - i * 1.6) * S))
        td.ellipse([x0 * S - 6 * S + i * S, y0 * S - 6 * S + i * S, x0 * S + 6 * S - i * S, y0 * S + 6 * S - i * S], fill=255)
    tm = tm.filter(ImageFilter.GaussianBlur(0.6 * S))
    tbase = np.zeros((th * S, tw * S, 3), dtype=np.float32)
    tyy, txx = np.mgrid[0:th * S, 0:tw * S].astype(np.float32)
    tl_ = np.clip(1.0 - tyy / (th * S) * 0.7, 0.35, 1)
    tbase[:, :, :] = grey * tl_[:, :, None]
    tbase[:, :, 2] += 10 * tl_
    tfur = np.asarray(Image.effect_noise((tw * S, th * S), 22).convert('L')).astype(np.float32) / 255 - 0.5
    tbase += tfur[:, :, None] * 14
    tail_img = Image.new('RGBA', tail.size, (0, 0, 0, 0))
    tail_img.paste(Image.fromarray(np.clip(tbase, 0, 255).astype(np.uint8)), (0, 0), tm)
    # white tip
    tip = Image.new('RGBA', tail.size, (0, 0, 0, 0))
    ImageDraw.Draw(tip).ellipse([80 * S, 14 * S, 94 * S, 30 * S], fill=(232, 232, 226, 220))
    tail_img = Image.alpha_composite(tail_img, Image.composite(tip, Image.new('RGBA', tail.size, (0, 0, 0, 0)), tm))
    tedge = ImageChops.subtract(tm.filter(ImageFilter.MaxFilter(3)), tm)
    te = Image.new('RGBA', tail.size, (12, 8, 16, 0)); te.putalpha(tedge.point(lambda v: int(v * 0.55)))
    tail_img = Image.alpha_composite(tail_img, te)

    body_out = body_layer.resize((cw_ * 2, ch_ * 2), Image.LANCZOS)
    tail_out = tail_img.resize((tw * 2, th * 2), Image.LANCZOS)
    return body_out, tail_out, (878, 538, 878 + cw_, 538 + ch_), (tw, th)

cat_body, cat_tail, cat_bbox, tail_wh = paint_cat()
cat_body.save(f'{OUT_DIR}/cat-body.webp', 'WEBP', quality=90, method=6)
cat_tail.save(f'{OUT_DIR}/cat-tail.webp', 'WEBP', quality=90, method=6)
# tail sits at the body's rear-bottom: pivot (art px) and its box size
tail_pivot = (cat_bbox[0] + 30, cat_bbox[1] + 66)
manifest['cat'] = {'bbox': list(cat_bbox), 'tail': {'pivot': list(tail_pivot), 'w': tail_wh[0], 'h': tail_wh[1], 'pivotLocal': [6, 10]}}

# ------------------------------------------------------------------ base plate: inpaint holes, 2x, sharpen
hole = np.asarray(union.point(lambda v: 255 if v > 40 else 0)).astype(np.uint8)
hole = cv2.dilate(hole, np.ones((5, 5), np.uint8), iterations=1)
base_bgr = cv2.cvtColor(np.asarray(full), cv2.COLOR_RGB2BGR)
inpainted = cv2.inpaint(base_bgr, hole, 6, cv2.INPAINT_TELEA)
base = Image.fromarray(cv2.cvtColor(inpainted, cv2.COLOR_BGR2RGB))
base2 = base.resize((W * 2, H * 2), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.4, percent=55, threshold=2))
base2.save(OUT_BASE, 'WEBP', quality=86, method=6)
json.dump(manifest, open(f'{OUT_DIR}/manifest.json', 'w'), indent=1)

# previews for a human eye
prev = full.copy()
prev.paste(cat_body.resize((cat_bbox[2] - cat_bbox[0], cat_bbox[3] - cat_bbox[1]), Image.LANCZOS), (cat_bbox[0], cat_bbox[1]), cat_body.resize((cat_bbox[2] - cat_bbox[0], cat_bbox[3] - cat_bbox[1]), Image.LANCZOS))
tsz = (tail_wh[0], tail_wh[1])
tl_img = cat_tail.resize(tsz, Image.LANCZOS)
prev.paste(tl_img, (tail_pivot[0] - 6, tail_pivot[1] - 10), tl_img)
prev.crop((820, 480, 1120, 660)).resize((900, 540), Image.LANCZOS).save('/tmp/cat-preview.png')
prev.crop((270, 50, 420, 390)).resize((300, 680), Image.LANCZOS).save('/tmp/notes-new.png')
base.crop((0, 550, 700, 941)).save('/tmp/base-holes.png')
sizes = {f: os.path.getsize(os.path.join(OUT_DIR, f)) // 1024 for f in sorted(os.listdir(OUT_DIR))}
print('base', os.path.getsize(OUT_BASE) // 1024, 'KB |', sizes)
