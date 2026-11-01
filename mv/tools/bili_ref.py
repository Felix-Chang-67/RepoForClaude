# Usage: python3 -I bili_ref.py OUTDIR "keyword1" "keyword2" ...
# For each keyword: bilibili search (by views), take the top hit, fetch the videoshot
# sprite (frame thumbnails across the timeline) and save a contact sheet.
import sys, json, re, io, os, uuid, urllib.request, urllib.parse
from PIL import Image, ImageDraw
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36"
COOKIE = "buvid3=%sinfoc" % uuid.uuid4()
def get(url, binary=False):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Referer": "https://www.bilibili.com/", "Cookie": COOKIE})
    with urllib.request.urlopen(req, timeout=25) as r:
        data = r.read()
    return data if binary else json.loads(data.decode('utf-8'))
out = sys.argv[1]; os.makedirs(out, exist_ok=True)
for kw in sys.argv[2:]:
    try:
        q = urllib.parse.urlencode({"keyword": kw, "search_type": "video", "order": "click"})
        res = get("https://api.bilibili.com/x/web-interface/search/type?" + q)["data"].get("result") or []
        if not res: print("NO RESULT", kw); continue
        v = res[0]; bv = v["bvid"]; title = re.sub("<[^>]+>", "", v["title"])
        shot = get("https://api.bilibili.com/x/player/videoshot?bvid=%s&index=1" % bv)["data"]
        imgs = shot.get("image") or []
        if not imgs: print("NO SHOTS", kw, bv); continue
        xs, ys, w, h = shot["img_x_len"], shot["img_y_len"], shot["img_x_size"], shot["img_y_size"]
        idx = shot.get("index") or []
        frames = []
        for u in imgs:
            sp = Image.open(io.BytesIO(get("https:" + u, binary=True))).convert("RGB")
            for j in range(ys):
                for i in range(xs):
                    if (j + 1) * h <= sp.height and (i + 1) * w <= sp.width:
                        frames.append(sp.crop((i * w, j * h, (i + 1) * w, (j + 1) * h)))
        n = min(len(frames), max(1, len(idx) - 1)) if idx else len(frames)
        frames = frames[:n]
        pick = [frames[int(k * (len(frames) - 1) / 19)] for k in range(20)] if len(frames) >= 20 else frames
        tw, th = 320, 180; cols = 5; rows = (len(pick) + cols - 1) // cols
        S = Image.new("RGB", (cols * tw, rows * th + 30), (20, 20, 20))
        for k, f in enumerate(pick): S.paste(f.resize((tw, th)), ((k % cols) * tw, 30 + (k // cols) * th))
        ImageDraw.Draw(S).text((8, 8), f"{bv}  {title[:80]}  views={v.get('play')}", fill=(255, 255, 255))
        fn = os.path.join(out, re.sub(r'[^\w]+', '_', kw)[:40] + ".jpg"); S.save(fn, quality=82)
        print("OK", kw, "->", bv, title[:60], "| views", v.get("play"), "| frames", len(frames), fn)
    except Exception as e:
        print("ERR", kw, e)
