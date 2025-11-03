# Knowledge - 企业内部 AI 知识助手

> **Fork from**: [Cherry Studio](https://github.com/CherryHQ/cherry-studio) | **License**: AGPL-3.0

基于 [Cherry Studio](https://github.com/CherryHQ/cherry-studio) 开源项目定制开发的企业内部知识管理与 AI 助手工具。

> **说明**：本项目为公司内部使用，仅用于企业知识管理和 AI 辅助工作。源代码基于 Cherry Studio 进行了定制化开发。
> 
> **注意**：本项目遵循 AGPL-3.0 开源协议。如果您在公网部署此应用，必须开源您的修改代码。

## 📋 项目简介

Knowledge 是一款基于 Electron 的桌面应用程序，专为企业内部知识管理和 AI 辅助而设计。通过集成多个 LLM 服务商，为团队提供统一的 AI 交互平台。

### 主要功能

- 🤖 支持多个 LLM 服务商（OpenAI、Anthropic、Gemini 等）
- 📚 企业知识库管理
- 💬 智能对话助手
- 📄 文档处理与分析
- 🔒 内部部署，数据安全

## 🛠️ 技术栈

- **前端框架**: React + TypeScript
- **桌面框架**: Electron
- **构建工具**: Vite
- **包管理**: Yarn

## � 开发环境

4. **Practical Tools Integration**:

- 🔍 Global Search Functionality
- 📝 Topic Management System
- 🔤 AI-powered Translation
- 🎯 Drag-and-drop Sorting
- 🔌 Mini Program Support
- ⚙️ MCP(Model Context Protocol) Server

5. **Enhanced User Experience**:

- 🖥️ Cross-platform Support for Windows, Mac, and Linux
- 📦 Ready to Use - No Environment Setup Required
- 🎨 Light/Dark Themes and Transparent Window
- 📝 Complete Markdown Rendering
- 🤲 Easy Content Sharing

# 📝 Roadmap

We're actively working on the following features and improvements:

1. 🎯 **Core Features**

- Selection Assistant with smart content selection enhancement
- Deep Research with advanced research capabilities
- Memory System with global context awareness
- Document Preprocessing with improved document handling
- MCP Marketplace for Model Context Protocol ecosystem

2. 🗂 **Knowledge Management**

- Notes and Collections
- Dynamic Canvas visualization
- OCR capabilities
- TTS (Text-to-Speech) support

3. 📱 **Platform Support**

- HarmonyOS Edition (PC)
- Android App (Phase 1)
- iOS App (Phase 1)
- Multi-Window support
- Window Pinning functionality
- Intel AI PC (Core Ultra) Support

4. 🔌 **Advanced Features**

- Plugin System
- ASR (Automatic Speech Recognition)
- Assistant and Topic Interaction Refactoring

Track our progress and contribute on our [project board](https://github.com/orgs/CherryHQ/projects/7).

Want to influence our roadmap? Join our [GitHub Discussions](https://github.com/CherryHQ/cherry-studio/discussions) to share your ideas and feedback!

# 🌈 Theme

- Theme Gallery: <https://cherrycss.com>
- Aero Theme: <https://github.com/hakadao/CherryStudio-Aero>
- PaperMaterial Theme: <https://github.com/rainoffallingstar/CherryStudio-PaperMaterial>
- Claude dynamic-style: <https://github.com/bjl101501/CherryStudio-Claudestyle-dynamic>
- Maple Neon Theme: <https://github.com/BoningtonChen/CherryStudio_themes>

Welcome PR for more themes

# 🤝 Contributing

We welcome contributions to Cherry Studio! Here are some ways you can contribute:

1. **Contribute Code**: Develop new features or optimize existing code.
2. **Fix Bugs**: Submit fixes for any bugs you find.
3. **Maintain Issues**: Help manage GitHub issues.

### 环境要求

- Node.js >= 22.0.0
- Yarn 包管理器

### 安装依赖

```bash
yarn install
```

### 启动开发服务器

```bash
# 方式 1: 使用 yarn 命令
yarn dev

# 方式 2: 使用启动脚本
启动Knowledge.bat
```

### 打包应用

```bash
# Windows 平台打包
yarn build:win
```

## 📝 环境配置

复制 `.env` 文件并配置必要的环境变量：

```bash
# API 配置示例
API_KEY="your-api-key"
BASE_URL="https://api.example.com/v1/"
MODEL="your-model-name"

# 日志配置
CSLOGGER_MAIN_LEVEL=info
CSLOGGER_RENDERER_LEVEL=info
```

## 📂 项目结构

```
knowledge/
├── src/
│   ├── main/          # Electron 主进程
│   ├── preload/       # 预加载脚本
│   └── renderer/      # 渲染进程（React 应用）
├── build/             # 应用资源（图标等）
├── resources/         # 打包资源
├── packages/          # 子包（aiCore 等）
└── scripts/           # 构建脚本
```

## 🙏 致谢

本项目基于 [Cherry Studio](https://github.com/CherryHQ/cherry-studio) 开源项目开发，感谢 Cherry Studio 团队的优秀工作。

## 📄 许可证

本项目为企业内部使用项目。原始代码遵循 Cherry Studio 的 AGPL-3.0 许可证。

---

**内部项目** | 仅供公司内部使用 | 基于 Cherry Studio 定制开发
<br /><br />

# 📊 GitHub Stats

![Stats](https://repobeats.axiom.co/api/embed/a693f2e5f773eed620f70031e974552156c7f397.svg 'Repobeats analytics image')

# ⭐️ Star History

<a href="https://www.star-history.com/#CherryHQ/cherry-studio&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=CherryHQ/cherry-studio&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=CherryHQ/cherry-studio&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=CherryHQ/cherry-studio&type=Date" />
 </picture>
</a>

# 📜 License

The Cherry Studio Community Edition is governed by the standard GNU Affero General Public License v3.0 (AGPL-3.0), available at https://www.gnu.org/licenses/agpl-3.0.html.

Use of the Cherry Studio Community Edition for commercial purposes is permitted, subject to full compliance with the terms and conditions of the AGPL-3.0 license.

Should you require a commercial license that provides an exemption from the AGPL-3.0 requirements, please contact us at bd@cherry-ai.com.

<!-- Links & Images -->

[deepwiki-shield]: https://img.shields.io/badge/Deepwiki-CherryHQ-0088CC?logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNy45MyAzMiI+PHBhdGggZD0iTTE5LjMzIDE0LjEyYy42Ny0uMzkgMS41LS4zOSAyLjE4IDBsMS43NCAxYy4wNi4wMy4xMS4wNi4xOC4wN2guMDRjLjA2LjAzLjEyLjAzLjE4LjAzaC4wMmMuMDYgMCAuMTEgMCAuMTctLjAyaC4wM2MuMDYtLjAyLjEyLS4wNS4xNy0uMDhoLjAybDMuNDgtMi4wMWMuMjUtLjE0LjQtLjQxLjQtLjdWOC40YS44MS44MSAwIDAgMC0uNC0uN2wtMy40OC0yLjAxYS44My44MyAwIDAgMC0uODEgMEwxOS43NyA3LjdoLS4wMWwtLjE1LjEyLS4wMi4wMnMtLjA3LjA5LS4xLjE0VjhhLjQuNCAwIDAgMC0uMDguMTd2LjA0Yy0uMDMuMDYtLjAzLjEyLS4wMy4xOXYyLjAxYzAgLjc4LS40MSAxLjQ5LTEuMDkgMS44OC0uNjcuMzktMS41LjM5LTIuMTggMGwtMS43NC0xYS42LjYgMCAwIDAtLjIxLS4wOGMtLjA2LS4wMS0uMTItLjAyLS4xOC0uMDJoLS4wM2MtLjA2IDAtLjExLjAxLS4xNy4wMmgtLjAzYy0uMDYuMDItLjEyLjA0LS4xNy4wN2gtLjAybC0zLjQ3IDIuMDFjLS4yNS4xNC0uNC40MS0uNC43VjE4YzAgLjI5LjE1LjU1LjQuN2wzLjQ4IDIuMDFoLjAyYy4wNi4wNC4xMS4wNi4xNy4wOGguMDNjLjA1LjAyLjExLjAzLjE3LjAzaC4wMmMuMDYgMCAuMTIgMCAuMTgtLjAyaC4wNGMuMDYtLjAzLjEyLS4wNS4xOC0uMDhsMS43NC0xYy42Ny0uMzkgMS41LS4zOSAyLjE3IDBzMS4wOSAxLjExIDEuMDkgMS44OHYyLjAxYzAgLjA3IDAgLjEzLjAyLjE5di4wNGMuMDMuMDYuMDUuMTIuMDguMTd2LjAycy4wOC4wOS4xMi4xM2wuMDIuMDJzLjA5LjA4LjE1LjExYzAgMCAuMDEgMCAuMDEuMDFsMy40OCAyLjAxYy4yNS4xNC41Ni4xNC44MSAwbDMuNDgtMi4wMWMuMjUtLjE0LjQtLjQxLjQtLjd2LTQuMDFhLjgxLjgxIDAgMCAwLS40LS43bC0zLjQ4LTIuMDFoLS4wMmMtLjA1LS4wNC0uMTEtLjA2LS4xNy0uMDhoLS4wM2EuNS41IDAgMCAwLS4xNy0uMDNoLS4wM2MtLjA2IDAtLjEyIDAtLjE4LjAyLS4wNy4wMi0uMTUuMDUtLjIxLjA4bC0xLjc0IDFjLS42Ny4zOS0xLjUuMzktMi4xNyAwYTIuMTkgMi4xOSAwIDAgMS0xLjA5LTEuODhjMC0uNzguNDItMS40OSAxLjA5LTEuODhaIiBzdHlsZT0iZmlsbDojNWRiZjlkIi8+PHBhdGggZD0ibS40IDEzLjExIDMuNDcgMi4wMWMuMjUuMTQuNTYuMTQuOCAwbDMuNDctMi4wMWguMDFsLjE1LS4xMi4wMi0uMDJzLjA3LS4wOS4xLS4xNGwuMDItLjAyYy4wMy0uMDUuMDUtLjExLjA3LS4xN3YtLjA0Yy4wMy0uMDYuMDMtLjEyLjAzLS4xOVYxMC40YzAtLjc4LjQyLTEuNDkgMS4wOS0xLjg4czEuNS0uMzkgMi4xOCAwbDEuNzQgMWMuMDcuMDQuMTQuMDcuMjEuMDguMDYuMDEuMTIuMDIuMTguMDJoLjAzYy4wNiAwIC4xMS0uMDEuMTctLjAyaC4wM2MuMDYtLjAyLjEyLS4wNC4xNy0uMDdoLjAybDMuNDctMi4wMmMuMjUtLjE0LjQtLjQxLjQtLjd2LTRhLjgxLjgxIDAgMCAwLS40LS43bC0zLjQ2LTJhLjgzLjgzIDAgMCAwLS44MSAwbC0zLjQ4IDIuMDFoLS4wMWwtLjE1LjEyLS4wMi4wMi0uMS4xMy0uMDIuMDJjLS4wMy4wNS0uMDUuMTEtLjA3LjE3di4wNGMtLjAzLjA2LS4wMy4xMi0uMDMuMTl2Mi4wMWMwIC43OC0uNDIgMS40OS0xLjA5IDEuODhzLTEuNS4zOS0yLjE4IDBsLTEuNzQtMWEuNi42IDAgMCAwLS4yMS0uMDhjLS4wNi0uMDEtLjEyLS4wMi0uMTgtLjAyaC0uMDNjLS4wNiAwLS4xMS4wMS0uMTcuMDJoLS4wM2MtLjA2LjAyLS4xMi4wNS0uMTcuMDhoLS4wMkwuNCA3LjcxYy0uMjUuMTQtLjQuNDEtLjQuNjl2NC4wMWMwIC4yOS4xNS41Ni40LjciIHN0eWxlPSJmaWxsOiM0NDY4YzQiLz48cGF0aCBkPSJtMTcuODQgMjQuNDgtMy40OC0yLjAxaC0uMDJjLS4wNS0uMDQtLjExLS4wNi0uMTctLjA4aC0uMDNhLjUuNSAwIDAgMC0uMTctLjAzaC0uMDNjLS4wNiAwLS4xMiAwLS4xOC4wMmgtLjA0Yy0uMDYuMDMtLjEyLjA1LS4xOC4wOGwtMS43NCAxYy0uNjcuMzktMS41LjM5LTIuMTggMGEyLjE5IDIuMTkgMCAwIDEtMS4wOS0xLjg4di0yLjAxYzAtLjA2IDAtLjEzLS4wMi0uMTl2LS4wNGMtLjAzLS4wNi0uMDUtLjExLS4wOC0uMTdsLS4wMi0uMDJzLS4wNi0uMDktLjEtLjEzTDguMjkgMTlzLS4wOS0uMDgtLjE1LS4xMWgtLjAxbC0zLjQ3LTIuMDJhLjgzLjgzIDAgMCAwLS44MSAwTC4zNyAxOC44OGEuODcuODcgMCAwIDAtLjM3LjcxdjQuMDFjMCAuMjkuMTUuNTUuNC43bDMuNDcgMi4wMWguMDJjLjA1LjA0LjExLjA2LjE3LjA4aC4wM2MuMDUuMDIuMTEuMDMuMTYuMDNoLjAzYy4wNiAwIC4xMiAwIC4xOC0uMDJoLjA0Yy4wNi0uMDMuMTItLjA1LjE4LS4wOGwxLjc0LTFjLjY3LS4zOSAxLjUtLjM5IDIuMTcgMHMxLjA5IDEuMTEgMS4wOSAxLjg4djIuMDFjMCAuMDcgMCAuMTMuMDIuMTl2LjA0Yy4wMy4wNi4wNS4xMS4wOC4xN2wuMDIuMDJzLjA2LjA5LjEuMTRsLjAyLjAycy4wOS4wOC4xNS4xMWguMDFsMy40OCAyLjAyYy4yNS4xNC41Ni4xNC44MSAwbDMuNDgtMi4wMWMuMjUtLjE0LjQtLjQxLjQtLjdWMjUuMmEuODEuODEgMCAwIDAtLjQtLjdaIiBzdHlsZT0iZmlsbDojNDI5M2Q5Ii8+PC9zdmc+
[deepwiki-link]: https://deepwiki.com/CherryHQ/cherry-studio
[twitter-shield]: https://img.shields.io/badge/Twitter-CherryStudioApp-0088CC?logo=x
[twitter-link]: https://twitter.com/CherryStudioHQ
[discord-shield]: https://img.shields.io/badge/Discord-@CherryStudio-0088CC?logo=discord
