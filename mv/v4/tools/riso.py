# Procedural 4-ink risograph separation: fluorescent pink / mint / blue / black, AM halftone per plate,
# uneven ink and speckle. Writes one RGBA plate per ink (RGB = ink colour, A = ink coverage) + a preview.
import sys, numpy as np, cv2
INKS = {'pink': (255, 72, 176), 'mint': (104, 210, 200), 'blue': (42, 76, 176), 'black': (34, 31, 36)}
ANG = {'pink': 75, 'mint': 0, 'blue': 15, 'black': 45}
PAPER = np.array([242, 238, 227], np.float32) / 255
OFF = {'pink': (4, 3), 'mint': (-3, 4), 'blue': (2, -3), 'black': (0, 0)}   # preview misregistration (px @4K)
PITCH = 17.0
def hue_w(h, centre, width):
    d = np.abs(((h - centre + 180) % 360) - 180); return np.clip(1 - d / width, 0, 1)
def separate(rgb):
    f = rgb.astype(np.float32) / 255
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV_FULL).astype(np.float32); h = hsv[..., 0] * 360 / 255; s = hsv[..., 1] / 255; v = hsv[..., 2] / 255
    lab = cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB).astype(np.float32); L = lab[..., 0] / 255
    black = np.clip((0.34 - L) / 0.16, 0, 1)
    # line art: thin strokes darker than their surroundings go to the black plate
    g = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY).astype(np.float32) / 255
    bh = cv2.morphologyEx(g, cv2.MORPH_BLACKHAT, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (13, 13)))
    black = np.maximum(black, np.clip((bh - 0.10) / 0.12, 0, 1) * np.clip((0.75 - g) / 0.3, 0, 1))
    pinkw = np.maximum(hue_w(h, 335, 55), hue_w(h, 10, 28))
    pink = np.clip(pinkw * np.clip((s - 0.08) * 2.1, 0, 1) * (0.35 + 0.65 * v), 0, 1)
    mint = np.clip(hue_w(h, 178, 32) * np.clip(s * 3.2, 0, 1), 0, 1)
    bluew = hue_w(h, 228, 42)
    neutral_shadow = np.clip((0.9 - v) / 0.55, 0, 1) * np.clip(1 - s * 2.2, 0, 1) * (1 - black)
    blue = np.clip(bluew * np.clip(s * 1.5, 0, 1) * np.clip(0.25 + v, 0, 1.2) + 0.75 * neutral_shadow, 0, 1)
    # dark navy: blue plate solid + black plate partial
    navy = bluew * np.clip((0.35 - v) / 0.2, 0, 1); blue = np.maximum(blue, navy); black = np.maximum(black, navy * 0.55)
    return {'pink': pink, 'mint': mint, 'blue': blue, 'black': black}
def screen(cov, ang, pitch, seed):
    H, W = cov.shape; yy, xx = np.mgrid[0:H, 0:W].astype(np.float32); a = np.deg2rad(ang)
    u = (xx * np.cos(a) + yy * np.sin(a)) / pitch; v = (-xx * np.sin(a) + yy * np.cos(a)) / pitch
    spot = (np.cos(2 * np.pi * u) + np.cos(2 * np.pi * v)) / 4 + 0.5          # 0..1, dots -> checker -> holes
    rng = np.random.default_rng(seed)
    low = cv2.resize(rng.random((H // 64 + 2, W // 64 + 2)).astype(np.float32), (W, H), interpolation=cv2.INTER_CUBIC)
    hi = rng.random((H, W)).astype(np.float32)
    c = cov * (0.86 + 0.18 * low)                                               # uneven ink load
    t = spot + (hi - 0.5) * 0.10                                                # ragged dot edges
    ink = np.clip((c - (1 - t)) / 0.08 + 0.5, 0, 1)
    ink[cov > 0.965] = 1.0
    ink *= 1 - (hi > 0.992) * 0.9                                               # paper speckle in solids
    ink = cv2.GaussianBlur(ink, (0, 0), 0.6)                                    # slight ink spread
    return np.clip(ink, 0, 1)
def run(src, out):
    rgb = cv2.cvtColor(cv2.imread(src, cv2.IMREAD_COLOR), cv2.COLOR_BGR2RGB)
    rgb = cv2.bilateralFilter(rgb, 7, 30, 5)
    plates = separate(rgb); H, W = rgb.shape[:2]; comp = np.ones((H, W, 3), np.float32) * PAPER
    for i, (k, cov) in enumerate(plates.items()):
        cov = cv2.GaussianBlur(cov, (0, 0), 1.2)
        ink = screen(cov, ANG[k], PITCH if k != 'black' else PITCH * 0.7, 11 + i)
        if k == 'black': ink = np.maximum(ink, np.clip((cov - 0.55) / 0.15, 0, 1))  # keep line art solid
        col = np.array(INKS[k], np.float32) / 255
        rgba = np.dstack([np.broadcast_to((col * 255).astype(np.uint8), (H, W, 3)), (ink * 255).astype(np.uint8)])
        cv2.imwrite(f'{out}_{k}.png', cv2.cvtColor(rgba, cv2.COLOR_RGBA2BGRA))
        dx, dy = OFF[k]; M = np.float32([[1, 0, dx], [0, 1, dy]]); a = cv2.warpAffine(ink, M, (W, H), borderMode=cv2.BORDER_REPLICATE)
        comp *= (1 - a[..., None]) + a[..., None] * col
    cv2.imwrite(f'{out}_preview.png', cv2.cvtColor((np.clip(comp, 0, 1) * 255).astype(np.uint8), cv2.COLOR_RGB2BGR))
    print(out, 'ok')
if __name__ == '__main__':
    for s, o in zip(sys.argv[1::2], sys.argv[2::2]): run(s, o)
