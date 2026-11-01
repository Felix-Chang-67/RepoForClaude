# 4K art finishing for the renderer: two-accent monochrome for story shots, reflection-free split, grey frame.
import numpy as np, cv2, sys, os
U = '/home/user/work/v3/up'; A = '/home/user/work/v3/render/art'
def load(n): return cv2.cvtColor(cv2.imread(f'{U}/{n}.png', cv2.IMREAD_COLOR), cv2.COLOR_BGR2RGB)
def save(a, n): cv2.imwrite(f'{A}/{n}.png', cv2.cvtColor(a, cv2.COLOR_RGB2BGR))
def mono_two(a):
    hsv = cv2.cvtColor(a, cv2.COLOR_RGB2HSV_FULL).astype(np.float32); h = hsv[..., 0] * 360 / 255; s = hsv[..., 1] / 255
    pink = np.clip(np.maximum((h - 290) / 25, 0), 0, 1) * (h > 270) + np.clip((25 - h) / 12, 0, 1) * (h <= 25)
    cyan = np.clip(1 - np.abs(h - 182) / 34, 0, 1)
    keep = np.clip(pink * np.clip((s - .12) / .16, 0, 1) + cyan * np.clip((s - .06) / .10, 0, 1), 0, 1)
    keep = cv2.GaussianBlur(keep, (0, 0), 1.2)
    gray = cv2.cvtColor(a, cv2.COLOR_RGB2GRAY)[..., None].repeat(3, 2).astype(np.float32)
    out = gray * (1 - keep[..., None]) + a.astype(np.float32) * keep[..., None]
    return np.clip(out, 0, 255).astype(np.uint8)
names = sys.argv[1:] or ['m1', 'm2', 'm3', 'm4', 'm5', 'c1', 'c2', 'c3', 'c4', 'c5']
for n in names:
    if not os.path.exists(f'{U}/{n}.png'): print('skip', n); continue
    a = load(n)
    if n.startswith('m'): save(mono_two(a), n)
    else: save(a, n)
    if n == 'c2':
        H, W = a.shape[:2]; top = a[:300].astype(np.float32)
        bgL = np.median(top[:, 60:500].reshape(-1, 3), 0); bgR = np.median(top[:, W - 500:W - 60].reshape(-1, 3), 0)
        dl = np.abs(top - bgL).sum(2).mean(0); seg = dl[W // 2 - 160:W // 2 + 160] > 60
        cx = int(np.argmax(np.diff(seg.astype(int)) > 0)) + W // 2 - 160 + 1
        e = a.copy(); e[:, cx + 3:] = bgR.astype(np.uint8); save(e, 'c2e'); print('c2 split at', cx, 'bgR', bgR)
    if n == 'c5':
        g = cv2.cvtColor(a, cv2.COLOR_RGB2GRAY); g = cv2.normalize(g, None, 0, 255, cv2.NORM_MINMAX); save(np.stack([g] * 3, -1), 'c5g')
    print('ok', n)
