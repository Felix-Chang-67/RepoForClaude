# MIRROR 例片（3:30–4:06）

- 方向：C + A 融合。静音前是黑白故事段，只保留粉色头发和红色小物；3:50 起切成钴蓝纯色背景的立绘副歌，配巨大歌词。
- 角色：`character_sheet.png`（用户提供）。分镜由 codex 以设定图为参考生成，提示词见 `prompts/`。
- 渲染：`render/clip.html` + `clip.js`，用浏览器 Canvas 逐帧绘制（`render(t)` 输入歌曲时间）。推镜、震屏、负片闪、色差、故障切片都由 `drums.js` 里的真实鼓点驱动，歌词按人声逐字对齐。
- 出片：
  1. `node capture.js OUTDIR 30 210.0 246.0 3` 输出 1080 帧 PNG。
  2. 用 ffmpeg 合成 `data/audio_210_246.wav`。
- 成片在 `mv/renders/`（不进 git）：`MIRROR_sample_v1.mp4`（CRF 23）和 `MIRROR_sample_v1_HQ.mp4`（CRF 17）。
