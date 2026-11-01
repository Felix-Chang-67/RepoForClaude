# Build per-character timing for the lyrics using LRC line times + vocal-stem onsets.
import json, re, sys, numpy as np, librosa
LRC = json.load(open('/home/user/RepoForClaude/mv/data/lyric163.json'))
def parse(s):
    out=[]
    for line in s.splitlines():
        m=re.match(r'\[(\d+):(\d+\.\d+)\](.*)',line)
        if m: out.append((int(m.group(1))*60+float(m.group(2)), m.group(3).strip()))
    return out
jp=[(t,x) for t,x in parse(LRC['lrc']['lyric'])]
cn={round(t,2):x for t,x in parse(LRC['tlyric']['lyric']) if x}
# lines with text (skip credits), end = next timestamp
lines=[]
for i,(t,x) in enumerate(jp):
    if not x or '作' in x[:3]: continue
    nxt = next((tt for tt,_ in jp[i+1:]), t+8)
    lines.append({'t0':round(t,2),'t1':round(nxt,2),'jp':x,'cn':cn.get(round(t,2),'')})
# mora weights
SMALL=set('ゃゅょぁぃぅぇぉャュョァィゥェォ')
PUNCT=set('、。『』「」 　,.!?！？')
KW={'僕':2,'鏡':3,'生':1,'急':2,'互':2,'映':2,'初':2,'気':1,'付':1,'多':1,'分':1,'足':1,'教':2,'知':1,'君':2,'泣':1,'此':1,'処':1,
    '不':1,'揃':2,'形':3,'忘':2,'姿':3,'聞':1,'世':1,'界':2,'理':4,'内':2,'側':2,'触':1,'変':2,'言':2,'葉':1,'蜘':1,'蛛':1,'巣':1,
    '拡':2,'活':2,'絡':2,'思':1,'議':1,'夢':2,'見':1,'科':1,'書':1,'載':1,'台':1,'詞':2,'中':2,'腐':2,'吐':1,'出':1,'毒':2,'哀':2,'顔':2,
    '贅':2,'沢':2,'重':2,'有':1,'体':2,'私':3,'声':2,'取':1,'換':1,'効':1,'色':2,'佇':3,'移':2,'枠':2,'飛':1,'越':1,'時':2,'必':2,'要':2,
    '弱':2,'虫':2,'込':1,'暮':1,'何':2,'在':1}
def weight(ch):
    if ch in PUNCT: return 0.0
    if ch in SMALL: return 0.0
    if ch=='ー': return 1.0
    if '一'<=ch<='鿿': return float(KW.get(ch,2))
    return 1.0
sr=22050
v,_=librosa.load('/home/user/work/audio/stems/htdemucs/full/vocals.wav',sr=sr,mono=True)
hop=128
oenv=librosa.onset.onset_strength(y=v,sr=sr,hop_length=hop)
on=librosa.onset.onset_detect(onset_envelope=oenv,sr=sr,hop_length=hop,units='time',backtrack=False,delta=0.04,wait=3)
rms=librosa.feature.rms(y=v,hop_length=hop)[0]; rt=librosa.times_like(rms,sr=sr,hop_length=hop)
def voiced_end(t0,t1):
    m=(rt>t0)&(rt<t1)&(rms>0.025)
    idx=np.where(m)[0]
    return float(rt[idx[-1]]) if len(idx) else t1
for L in lines:
    chars=list(L['jp']); w=[weight(c) for c in chars]; M=sum(w)
    t0=L['t0']; t1=L['t1']
    cand=on[(on>t0-0.25)&(on<t1-0.05)]
    start=float(cand[0]) if len(cand) and abs(cand[0]-t0)<0.35 else t0
    end=min(voiced_end(start,t1),t1-0.05)
    span=max(end-start,0.3)
    # nominal times by cumulative mora (slightly compress so last mora starts before end)
    cum=0; times=[]
    used=set()
    for c,wi in zip(chars,w):
        nominal=start+span*(cum/max(M,1))*0.97
        if wi>0:
            # snap to nearest unused onset within 0.12s
            d=np.abs(cand-nominal) if len(cand) else np.array([])
            j=int(np.argmin(d)) if len(d) else -1
            if j>=0 and d[j]<0.12 and j not in used and (not times or cand[j]>=times[-1]):
                tt=float(cand[j]); used.add(j)
            else: tt=nominal
            if times and tt<times[-1]: tt=times[-1]
            times.append(round(tt,3)); cum+=wi
        else:
            times.append(times[-1] if times else round(start,3))
    L['ct']=times; L['sungEnd']=round(end,2)
open('/home/user/work/preview/site/lyrics.js','w').write('const LYRICS = '+json.dumps(lines,ensure_ascii=False)+';\n')
for L in lines[:3]+lines[-6:]:
    print(L['t0'],L['jp'][:20],L['ct'][:8],'end',L['sungEnd'])
print(len(lines),'lines')
