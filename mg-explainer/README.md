# Clawd 的 15 种画法

一支约 2 分 20 秒的 B 站科普视频（1920×1080 · 30 fps · 只有字幕和配乐）。内容是讲解 [mg-styles-15](https://github.com/Vincentwei1021/mg-styles-15) 里那 15 种 MG 动态设计风格：AI 写代码，就能把它们一支一支做出来。

成片在 [`out/video.mp4`](out/video.mp4)（140 s，约 64 MB），B 站封面可以用 [`cover.jpg`](cover.jpg)。

这支视频本身也是用同样的方法做的：
- **画面**：一个网页，`window.renderAt(t)` 用 Canvas 画出任意时刻的那一帧。
- **出片**：无头 Chrome 逐帧截图，ffmpeg 合成 MP4。
- **配乐**：用 mgaudio 合成。

## 分镜

| 时间 | 段落 | 内容 |
|---|---|---|
| 0–10 s | 开场 | 终端里敲下需求 → 15 支原片拼成一面墙 → "没用任何生图、生视频模型" → 片名 |
| 10–35 s | 原理 5 步 | 提示词 → 网页代码 `renderAt(t)` → 逐帧截图 300 帧 → 代码配乐（cues 卡点）→ ffmpeg 合成 |
| 35–110 s | 15 种风格 | 每种 5 秒：原片片段（带原声）、风格名、标志技法、代码路线，外加 Clawd 用这种风格重画的自己 |
| 110–122 s | AI 评审 | 制作 → 评审 → 修改，共两轮；rubric 7 个维度；最终得分 7.57–8.21 |
| 122–140 s | 结尾 | 三步自己做一支 → 开源地址、原作者署名 → 一键三连 |

## 文件

| 路径 | 内容 |
|---|---|
| `index.html`, `js/film.js` | 整支片的时间线和各段场景 |
| `js/clawd.js` | Clawd 的 15 种画法（线条抖动、等轴体素、metaball、霓虹、花字……） |
| `js/styles.js` | 15 种风格的文案、截取片段的起点、配色 |
| `js/lib.js` | 缓动、文字排版、Clawd 的像素轮廓 |
| `audio.py` | 配乐：讲解段用 explainer 配乐模板加音效；风格段直接用各支原片的原声 |
| `harness/render.mjs` | 渲染器，取自 mg-styles-15。只改了一处：作品目录就是仓库根目录时，URL 拼接不再出错 |
| `tools/prep_frames.sh` | 从 15 支原片里截取要用的帧和音频，输出到 `out/frames`、`out/clips` |
| `fonts/` | Noto Sans SC、JetBrains Mono、站酷快乐体（均为 SIL OFL），只保留了片中用到的字符分片 |

## 重新渲染

需要 Node 22+、Chromium/Chrome、ffmpeg、Python 3.11+，还要准备 mg-styles-15 仓库的视频文件和 `lib/audio`：

```bash
git clone https://github.com/Vincentwei1021/mg-styles-15 ../mg-styles-15
npm install
pip install numpy scipy soundfile numba pedalboard pyloudnorm matplotlib
tools/prep_frames.sh ../mg-styles-15/videos           # 截取片段帧和原声
python3 audio.py ../mg-styles-15/lib/audio             # → out/audio.wav（−14 LUFS）
export MG_CHROME=/path/to/chrome                       # Linux 无 GPU 时再加：MG_GPU_ARGS="--no-sandbox"
node harness/render.mjs . --workers 3 --crf 18         # → out/video.mp4
node harness/render.mjs . --stills 9.2,40,120          # 只出几张静帧，用来检查
```

## 版权与署名

- 15 支原片、提示词、渲染器和 mgaudio 都来自 [Vincentwei1021/mg-styles-15](https://github.com/Vincentwei1021/mg-styles-15)，MIT 协议。片尾已经署名原作者。
- Clawd 是 Anthropic 的 Claude Code 吉祥物。这里按终端里的字符画重新绘制，用于科普。
- 字体为 SIL Open Font License，许可证见 `fonts/`。
