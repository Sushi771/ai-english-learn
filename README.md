# AI English Assistant (智学英语 AI) v2.6 - SM-2 Persistence Fix 🎯

一款专为中国用户打造的、基于 **智谱 AI (Zhipu AI)** 与 **Azure 发音评测** 技术的端到端英语学习助手。系统采用全新的 **"Luminary 3.0" (双生灵光)** 视觉系统，提供极速响应的毛玻璃界面、CSS 变量驱动的主題切换与深度 HUD 交互体验。

## 🌟 核心功能 (Features)

- [x] **AI 智能对话**: 接入 **GLM-4-Flash**，支持点击 AI 气泡单词进行即时翻译与收藏。
- [x] **对话词汇收集**: AI 气泡逐词渲染，点击单词弹出 Mini-Drawer 查词并一键存入生词库。 ✅
- [x] **Luminary 3.0 视觉系统**: 全球级毛玻璃质感、CSS 变量分发、24px 极速渲染滤镜。 ✅
- [x] **沉浸式闪卡复习**: 基于 Framer Motion 的 3D 翻转卡片逻辑，支持掌握程度标记与 SM-2 动态调度。 ✅
- [x] **音素级发音评测**: 深度整合 Azure Speech SDK，提供精准的发音反馈报告。
- [x] **成长大盘 & HUD**: 实时追踪 XP、等级，配合 Mission Compass 任务罗盘。 ✅

## 📈 MVP Build Completion

本项目已正式进入 **MVP 闭环**：
- **Dialog-to-Bank Interaction**: 实现了从对话交流到词汇沉淀的完整链路。
- **Build Optimization**: 针对 Next.js 16/15 的开发环境进行了稳定性优化。

## 🚀 Phase 2 Roadmap (未来计划)

- [x] **SM-2 算法优化**: 启用 `backend/services/scheduler.py` 中的 SuperMemo-2 算法进行动态复习调度。
- [x] **Supabase Auth Integration**: 实现用户账户系统与跨端数据同步 (JWKS 验证)。
- [x] **多模型联邦支持**: 路由支持 GLM-4-Flash / GLM-4.5-Air，具备模型选择持久化功能。
- [x] **全链路流式同步**: 优化 LLM 流式交互，实现“随收随显”真流式体验，保留关键空格与格式。

## 🛠️ 技术栈 (Tech Stack)

- **前端**: Next.js 16.2.1, Tailwind CSS v4, Framer Motion, Wavesurfer.js.
- **后端**: FastAPI, Supabase (PostgreSQL), SQLite (Local Cache).
- **引擎**: 智谱 ASR/GLM-4 (LLM), Azure Pronunciation Assessment.

## 🚀 运行与调试 (Dev Ops)

> [!IMPORTANT]
> **Build Mode (Webpack)**: 由于 Turbopack 在特定 Windows 环境下的稳定性问题，本项目推荐使用 Webpack 模式运行：
> `cd backend/frontend && npm run dev` (已在 package.json 强制确保稳定性)。

### 快速开始
- **本地启动**: 运行 `launcher.bat` 自动启动前后端。
- **手动启动**:
  - 后端: `cd backend && python -m uvicorn main:app --reload --port 8080`
  - 前端: `cd backend/frontend && npm run dev`

---
## 🤖 协作代理 (Agentic Fleet)
本项目由专职 AI 代理通过 Antigravity 平台协同构建：
- **`agency-ux-architect`**: Luminary 设计系统负责人。
- **`agency-senior-developer`**: React 交互与状态管理负责人。
- **`agency-project-shepherd`**: 文档与 MVP 闭环交付负责人。

*Final v2.6 Update: 2026-04-04 (SM-2 Persistence Fix)*
