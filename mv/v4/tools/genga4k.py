# Pencil keyframe sheets to 4K "scans": Lanczos + mild sharpen, mint pencil nudged to cyan,
# graphite/coloured-pencil breaking up on paper tooth. Also builds a blank sheet with peg holes.
import sys, numpy as np, cv2
W, H = 3840, 2160
rng = np.random.default_rng(5)
def tooth():
    n1 = rng.random((H, W)).astype(np.float32)
    n2 = cv2.resize(rng.random((H // 3, W // 3)).astype(np.float32), (W, H), interpolation=cv2.INTER_CUBIC)
    t = np.clip((n1 * 0.55 + n2 * 0.45 - 0.62) / 0.25, 0, 1)
    return cv2.GaussianBlur(t, (0, 0), 0.7)
T = tooth()
def finish(src, dst):
    im = cv2.cvtColor(cv2.imread(src, cv2.IMREAD_COLOR), cv2.COLOR_BGR2RGB)
    big = cv2.resize(im, (W, H), interpolation=cv2.INTER_LANCZOS4).astype(np.float32) / 255
    big = np.clip(big + 0.55 * (big - cv2.GaussianBlur(big, (0, 0), 1.8)), 0, 1)
    hsv = cv2.cvtColor((big * 255).astype(np.uint8), cv2.COLOR_RGB2HSV_FULL).astype(np.float32)
    h = hsv[..., 0] * 360 / 255; s = hsv[..., 1] / 255
    green = (h > 95) & (h < 170) & (s > 0.06)
    h2 = np.where(green, h + (178 - h) * 0.75, h); hsv[..., 0] = h2 * 255 / 360
    hsv[..., 1] = np.where(green, np.clip(hsv[..., 1] * 1.15, 0, 255), hsv[..., 1])
    big = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2RGB_FULL).astype(np.float32) / 255
    paper = np.median(big[H // 3:H // 3 * 2:8, 40:300:8].reshape(-1, 3), 0)
    lum = big.mean(2); ink = np.clip((paper.mean() - lum) / 0.35, 0, 1)
    out = big + (paper - big) * (0.32 * T * ink)[..., None]
    cv2.imwrite(dst, cv2.cvtColor((np.clip(out, 0, 1) * 255).astype(np.uint8), cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 95])
    print(dst, 'paper', (paper * 255).astype(int))
    return paper
def blank(paper, dst):
    base = np.ones((H, W, 3), np.float32) * paper
    low = cv2.resize(rng.random((7, 12)).astype(np.float32), (W, H), interpolation=cv2.INTER_CUBIC)
    mid = cv2.resize(rng.random((60, 106)).astype(np.float32), (W, H), interpolation=cv2.INTER_CUBIC)
    base *= (0.985 + 0.02 * low + 0.008 * mid)[..., None]
    fib = cv2.GaussianBlur((rng.random((H, W)) > 0.9985).astype(np.float32), (0, 0), 1.2) * 0.25
    base -= fib[..., None] * 0.08
    img = (np.clip(base, 0, 1) * 255).astype(np.uint8)
    dark = (28, 26, 30)
    cv2.circle(img, (W // 2, 70), 34, dark, -1, cv2.LINE_AA)
    for cx in (W // 2 - 1240, W // 2 + 1240):
        cv2.rectangle(img, (cx - 110, 50), (cx + 110, 92), dark, -1, cv2.LINE_AA)
        cv2.circle(img, (cx - 110, 71), 21, dark, -1, cv2.LINE_AA); cv2.circle(img, (cx + 110, 71), 21, dark, -1, cv2.LINE_AA)
    # faint blue-pencil frame guide
    ov = img.copy(); cv2.rectangle(ov, (300, 230), (W - 300, H - 170), (120, 140, 190), 3, cv2.LINE_AA)
    img = cv2.addWeighted(ov, 0.35, img, 0.65, 0)
    cv2.imwrite(dst, cv2.cvtColor(img, cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 95]); print(dst)
if __name__ == '__main__':
    pairs = list(zip(sys.argv[1::2], sys.argv[2::2])); p = None
    for s, d in pairs: p = finish(s, d)
    blank(p, '/home/user/work/v4/art/blank.jpg')
