# 例片 v3：去 AI 感 + 4K 60 帧

## 改了什么

- **画法**：所有镜头按"人类插画师的动画平涂画法"重新生成。
  - 头发画成几大块色面，每种材质只有一阶硬阴影；
  - 不要渐变、光泽、辉光和发丝噪点；
  - 线条粗细统一。
  - 提示词见 `prompts/`，原图见 `src_art/`。
- **キミ重新设计**：直顺的长发、齐刘海，薄荷青加粉色发梢，和ボク的乱发形成对比。见 `src_art/kimi_sheet.png` 和 `kimi_sheet_4k.png`。
- **4K**：用 Real-ESRGAN 动画模型（x4plus_anime_6B）超分到 3840×2160，线条和色面在 4K 下保持锐利。脚本：`tools/upscale.py`。
- **画面质感**（渲染时加）：
  - 线条抖动：线稿层按 12fps 轻微错位，模拟手绘动画的线条抖动；
  - 纸张纹理；
  - 胶片颗粒；
  - 黑白故事段只保留粉色和薄荷青两种颜色（`tools/post4k.py`）。
- **规格**：3840×2160，60fps。渲染器用 1920×1080 的逻辑坐标排版，再以 2 倍绘制。

## 重新出片

1. `python3 -I tools/upscale.py src_art/<name>.png up/<id>.png ...`：超分。
2. `python3 -I tools/post4k.py`：生成 `render/art/*.png`（不进 git）。
3. 在 `render/` 起一个本地 HTTP 服务（端口 8768），然后运行 `node tools/capture4k.js OUT 60 210.0 246.0 3`。浏览器逐帧渲染，直接送进 ffmpeg 编成分段。
4. 用 ffmpeg concat 合并分段，并混入 `audio_210_246.wav`。
