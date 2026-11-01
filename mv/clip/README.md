# MIRROR 例片（3:30–4:06）

- 方向：C + A 融合。静音前是黑白故事段，只保留粉色头发和红色小物；3:50 起切成钴蓝纯色背景的立绘副歌，配巨大歌词。
- 角色：`character_sheet.png`（用户提供）。分镜由 codex 以设定图为参考生成，提示词见 `prompts/`。
- 渲染：`render/clip.html` + `clip.js`，用浏览器 Canvas 逐帧绘制（`render(t)` 输入歌曲时间）。推镜、震屏、负片闪、色差、故障切片都由 `drums.js` 里的真实鼓点驱动，歌词按人声逐字对齐。
- 出片：
  1. `node capture.js OUTDIR 30 210.0 246.0 3` 输出 1080 帧 PNG。
  2. 用 ffmpeg 合成 `data/audio_210_246.wav`。
- 成片在 `mv/renders/`（不进 git）：`MIRROR_sample_v1.mp4`（CRF 23）和 `MIRROR_sample_v1_HQ.mp4`（CRF 17）。

## v2：镜像角色「キミ」

- 设定图：`kimi_sheet.png`，两人并排对照：`boku_kimi_lineup.png`。
- 设计思路：キミ是ボク的"裏面"。
  - 所有不对称细节左右翻转，配色取反：粉发换成薄荷青（发梢底下藏着一层粉），米色开衫换成藏黑，白衬衫换成黑，红领带换成青，靴子黑白对调。
  - 不戴眼镜，左眼下一道泪痕状的镜面裂纹，代表"一直在哭的那个人"。
- 例片 v2 里有镜像出场的镜头都换成了キミ。
- 色彩规则：
  - 黑白故事段只保留两种颜色：ボク的粉、キミ的薄荷青。
  - 副歌里ボク的背景是钴蓝，キミ的背景是藏黑。
- 成片：`mv/renders/MIRROR_sample_v2.mp4`（另有 `_HQ` 高画质版）。
