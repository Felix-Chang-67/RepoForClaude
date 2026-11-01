# Real-ESRGAN x4 anime (6 blocks) on CPU, tiled; result resized to 3840x2160.
import sys, time, numpy as np, cv2, torch, torch.nn as nn, torch.nn.functional as F
torch.set_num_threads(4)
class RDB(nn.Module):
    def __init__(s, nf=64, gc=32):
        super().__init__()
        s.conv1 = nn.Conv2d(nf, gc, 3, 1, 1); s.conv2 = nn.Conv2d(nf + gc, gc, 3, 1, 1); s.conv3 = nn.Conv2d(nf + 2 * gc, gc, 3, 1, 1)
        s.conv4 = nn.Conv2d(nf + 3 * gc, gc, 3, 1, 1); s.conv5 = nn.Conv2d(nf + 4 * gc, nf, 3, 1, 1); s.lrelu = nn.LeakyReLU(0.2, True)
    def forward(s, x):
        x1 = s.lrelu(s.conv1(x)); x2 = s.lrelu(s.conv2(torch.cat((x, x1), 1))); x3 = s.lrelu(s.conv3(torch.cat((x, x1, x2), 1)))
        x4 = s.lrelu(s.conv4(torch.cat((x, x1, x2, x3), 1))); x5 = s.conv5(torch.cat((x, x1, x2, x3, x4), 1)); return x5 * 0.2 + x
class RRDB(nn.Module):
    def __init__(s, nf, gc=32):
        super().__init__(); s.rdb1 = RDB(nf, gc); s.rdb2 = RDB(nf, gc); s.rdb3 = RDB(nf, gc)
    def forward(s, x): return s.rdb3(s.rdb2(s.rdb1(x))) * 0.2 + x
class RRDBNet(nn.Module):
    def __init__(s, nb=6, nf=64, gc=32):
        super().__init__()
        s.conv_first = nn.Conv2d(3, nf, 3, 1, 1); s.body = nn.Sequential(*[RRDB(nf, gc) for _ in range(nb)]); s.conv_body = nn.Conv2d(nf, nf, 3, 1, 1)
        s.conv_up1 = nn.Conv2d(nf, nf, 3, 1, 1); s.conv_up2 = nn.Conv2d(nf, nf, 3, 1, 1); s.conv_hr = nn.Conv2d(nf, nf, 3, 1, 1); s.conv_last = nn.Conv2d(nf, 3, 3, 1, 1)
        s.lrelu = nn.LeakyReLU(0.2, True)
    def forward(s, x):
        f = s.conv_first(x); f = f + s.conv_body(s.body(f))
        f = s.lrelu(s.conv_up1(F.interpolate(f, scale_factor=2, mode='nearest'))); f = s.lrelu(s.conv_up2(F.interpolate(f, scale_factor=2, mode='nearest')))
        return s.conv_last(s.lrelu(s.conv_hr(f)))
net = RRDBNet(); sd = torch.load('/home/user/work/models/RealESRGAN_x4plus_anime_6B.pth', map_location='cpu', weights_only=True)
net.load_state_dict(sd.get('params_ema', sd.get('params', sd)), strict=True); net.eval()
def up(img, tile=240, pad=12):
    h, w, _ = img.shape; out = np.zeros((h * 4, w * 4, 3), np.float32)
    x = torch.from_numpy(img.transpose(2, 0, 1)).float().unsqueeze(0) / 255.0
    for y0 in range(0, h, tile):
        for x0 in range(0, w, tile):
            ya, xa, yb, xb = max(0, y0 - pad), max(0, x0 - pad), min(h, y0 + tile + pad), min(w, x0 + tile + pad)
            with torch.inference_mode(): o = net(x[:, :, ya:yb, xa:xb]).clamp(0, 1)[0].numpy().transpose(1, 2, 0)
            ty, tx = (y0 - ya) * 4, (x0 - xa) * 4; th, tw = (min(h, y0 + tile) - y0) * 4, (min(w, x0 + tile) - x0) * 4
            out[y0 * 4:y0 * 4 + th, x0 * 4:x0 * 4 + tw] = o[ty:ty + th, tx:tx + tw]
    return out
for src, dst in zip(sys.argv[1::2], sys.argv[2::2]):
    t = time.time(); img = cv2.cvtColor(cv2.imread(src, cv2.IMREAD_COLOR), cv2.COLOR_BGR2RGB)
    o = up(img); o = cv2.resize(o, (3840, 2160), interpolation=cv2.INTER_AREA)
    cv2.imwrite(dst, cv2.cvtColor((o * 255 + 0.5).astype(np.uint8), cv2.COLOR_RGB2BGR)); print(dst, '%.0fs' % (time.time() - t), flush=True)
