# DeepSeek Code V5 — 也不是不行 (DSC)

[![GitHub Stars](https://img.shields.io/github/stars/xjwm5685-ui/deepseek-code?style=flat-square&logo=github&color=blue)](https://github.com/xjwm5685-ui/deepseek-code/stargazers)
[![GitHub Issues](https://img.shields.io/github/issues/xjwm5685-ui/deepseek-code?style=flat-square&color=orange)](https://github.com/xjwm5685-ui/deepseek-code/issues)
[![npm](https://img.shields.io/npm/v/deepseek-dsc?style=flat-square&color=red)](https://www.npmjs.com/package/deepseek-dsc)
[![Bun](https://img.shields.io/badge/runtime-Bun-black?style=flat-square&logo=bun)](https://bun.sh/)
[![Discord](https://img.shields.io/badge/Discord-Join-5865F2?style=flat-square&logo=discord)](https://discord.gg/uApuzJWGKX)

> 你喜欢哪个 AI？开源的才是最屌的。

牢 D (DeepSeek) 官方 Claude Code 全面魔改版。虽然很难绷，但是它不叫 CCB(踩踩背)了，现在叫 DSC(大傻春)... 我们基于开源版做了 DeepSeek 品牌替换、全面系统提示词重写、彩色渐变动画、上下文水位仪表、多 Provider 支持、Symphony 四乐章编程模式。

**这不是 Peri Code / Voice Mode / Computer Use / 插件市场 / Poor Mode / Goal / Ultracode / Artifacts / 多模型群控** — 那些是原版的功能。我们只列我们自己加了的东西。

[Discord 群，群主在线发癫](https://discord.gg/uApuzJWGKX)

| 特性 | 说明 |
|------|------|
| **🌈 彩虹渐变动画** | 输入框边框全彩渐变，蓝色紫色粉色橙色黄色绿色青色彩虹循环，摸鱼看着很爽 |
| **📊 实时上下文水位** | 底部状态栏 `██████░░░░ 62%`，绿黄红三色预警，超过 80% 疯狂闪烁逼你 compact |
| **🎵 Symphony 模式** | 四乐章编程纪律：读谱→排练→作曲→终曲，10 项自检清单，代码写得不像你写的 |
| **🌐 任意 API 协议** | OpenAI / Anthropic / Gemini / Grok / 任意转发站，`/login` 配一下就能用 |
| **📁 ~/.DeepSeek 配置** | `C:\Users\<你>\.DeepSeek\config.json` 手动配 API，兼容 Claude 旧配置自动回退 |
| **🔄 Shift+Tab 模式轮换** | Default → Gentle → Sharp → Workhorse → Token Saver → Super AI → Symphony 一键切换 |
| **🔵 全面 DeepSeek 化** | 从里到外 Claude 全换成 DeepSeek，包括所有系统提示词重写 |

- 🚀 [别 b 了，怎么启动](#-快速开始)
- 🐛 [程序又崩了，怎么调](#vs-code-调试)
- 📖 [想学写代码，教我](#teach-me-学习项目)

## ⚡ 快速开始

### npm 全局安装（推荐，省心）

```powershell
npm install -g deepseek-dsc
dsc
```

### 从源码跑（适合爱折腾的）

```bash
git clone https://github.com/xjwm5685-ui/deepseek-code.git
cd deepseek-code
bun install
bun run dev
```

> 安装/更新失败？先 `npm rm -g deepseek-dsc` 清理，再重试

## ⚡ 快速开始(源码版)

### ⚙️ 环境要求

一定要最新版本的 bun 啊, 不然一堆奇奇怪怪的 BUG!!! bun upgrade!!!

- 📦 [Bun](https://bun.sh/) >= 1.3.11

**安装 Bun：**

```bash
# Linux 和 macOS
curl -fsSL https://bun.sh/install | bash

# Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1 | iex"
```

**安装后的操作：**

1. **让当前终端识别 `bun` 命令**

   安装脚本会把 `~/.bun/bin` 写入对应的 shell 配置文件。macOS 默认 zsh 环境通常会看到：

   ```text
   Added "~/.bun/bin" to $PATH in "~/.zshrc"
   ```

   可以按安装脚本提示重启当前 shell：

   ```bash
   exec /bin/zsh
   ```

   如果你使用 bash，重新加载 bash 配置：

   ```bash
   source ~/.bashrc
   ```

   Windows PowerShell 用户关闭并重新打开 PowerShell 即可。

2. **验证 Bun 是否可用**

   ```bash
   bun --help
   bun --version
   ```

3. **如果已经安装过 Bun，更新到最新版本**

   ```bash
   bun upgrade
   ```

- ⚙️ 常规的配置 CC 的方式, 各大提供商都有自己的配置方式

### 📍 命令执行位置

- 安装或检查 Bun 的命令可以在任意目录执行：
  `curl -fsSL https://bun.sh/install | bash`、`bun --help`、`bun --version`、`bun upgrade`
- 安装本项目依赖、启动开发模式、构建项目时，必须先进入本仓库根目录，也就是包含 `package.json` 的目录。

### 📥 安装

```bash
cd /path/to/claude-code
bun install
```

### ▶️ 运行

```bash
# 开发模式, 看到版本号 888 说明就是对了
bun run dev

# 构建
bun run build
```

构建采用 code splitting 多文件打包（`build.ts`），产物输出到 `dist/` 目录（入口 `dist/cli.js` + 约 450 个 chunk 文件）。

构建出的版本 bun 和 node 都可以启动, 你 publish 到私有源可以直接启动

如果遇到 bug 请直接提一个 issues, 我们优先解决

### 👤 新人配置 /login

首次运行后，在 REPL 中输入 `/login` 命令进入登录配置界面，选择 **Anthropic Compatible** 即可对接第三方 API 兼容服务（无需 Anthropic 官方账号）。
选择 OpenAI 和 Gemini 对应的栏目都是支持相应协议的

需要填写的字段：

| 📌 字段      | 📝 说明       | 💡 示例                      |
| ------------ | ------------- | ---------------------------- |
| Base URL     | API 服务地址  | `https://api.example.com/v1` |
| API Key      | 认证密钥      | `sk-xxx`                     |
| Haiku Model  | 快速模型 ID   | `claude-haiku-4-5-20251001`  |
| Sonnet Model | 均衡模型 ID   | `claude-sonnet-4-6`          |
| Opus Model   | 高性能模型 ID | `claude-opus-4-6`            |

- ⌨️ **Tab / Shift+Tab** 切换字段，**Enter** 确认并跳到下一个，最后一个字段按 Enter 保存

> ℹ️ 支持所有 Anthropic API 兼容服务（如 OpenRouter、AWS Bedrock 代理等），只要接口兼容 Messages API 即可。

## Feature Flags

所有功能开关通过 `FEATURE_<FLAG_NAME>=1` 环境变量启用，例如：

```bash
FEATURE_BUDDY=1 FEATURE_FORK_SUBAGENT=1 bun run dev
```

各 Feature 的详细说明见 [`docs/features/`](docs/features/) 目录，欢迎投稿补充。

## VS Code 调试

TUI (REPL) 模式需要真实终端，无法直接通过 VS Code launch 启动调试。使用 **attach 模式**：

### 步骤

1. **终端启动 inspect 服务**：

   ```bash
   bun run dev:inspect
   ```

   会输出类似 `ws://localhost:8888/xxxxxxxx` 的地址。
2. **VS Code 附着调试器**：

   - 在 `src/` 文件中打断点
   - F5 → 选择 **"Attach to Bun (TUI debug)"**

## Teach Me 学习项目

我们新加了一个 teach-me skills, 通过问答式引导帮你理解这个项目的任何模块。(调整 [sigma skill 而来](https://github.com/sanyuan0704/sanyuan-skills))

```bash
# 在 REPL 中直接输入
/teach-me DeepSeek Code 架构
/teach-me React Ink 终端渲染 --level beginner
/teach-me Tool 系统 --resume
```

### 它能做什么

- **诊断水平** — 自动评估你对相关概念的掌握程度，跳过已知的、聚焦薄弱的
- **构建学习路径** — 将主题拆解为 5-15 个原子概念，按依赖排序逐步推进
- **苏格拉底式提问** — 用选项引导思考，而非直接给答案
- **错误概念追踪** — 发现并纠正深层误解
- **断点续学** — `--resume` 从上次进度继续

### 学习记录

学习进度保存在 `.claude/skills/teach-me/` 目录下，支持跨主题学习者档案。

## 相关文档及网站

- **在线文档（Mintlify）**: [ccb.agent-aura.top](https://ccb.agent-aura.top/) — 文档源码位于 [`docs/`](docs/) 目录，欢迎投稿 PR
- **DeepWiki**: [https://deepwiki.com/deepseek-code/claude-code](https://deepwiki.com/deepseek-code/claude-code)

## Star History

<a href="https://www.star-history.com/?repos=deepseek-code%2Fclaude-code&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/image?repos=deepseek-code/claude-code&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/image?repos=deepseek-code/claude-code&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/image?repos=deepseek-code/claude-code&type=date&legend=top-left" />
 </picture>
</a>

## 致谢

- [doubaoime-asr](https://github.com/starccy/doubaoime-asr) — 豆包 ASR 语音识别 SDK，为 Voice Mode 提供无需 Anthropic OAuth 的语音输入方案

## 许可证

本项目仅供学习研究用途。DeepSeek Code 的所有权利归 [Anthropic](https://www.anthropic.com/) 所有。
