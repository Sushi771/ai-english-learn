# AI English Assistant (智学英语 AI) v2.2 - MVP Completion 🎯

一款专为中国用户打造的、基于 **智谱 AI (Zhipu AI)** 与 **Azure 发音评测** 技术的端到端英语学习助手。系统采用全新的 **"Luminary 2.0" (双生灵光)** 视觉系统，提供超宽屏适配、纸质触感与社论级排版体验。

## 🌟 核心功能 (Features)

- [x] **AI 智能对话**: 接入 **GLM-4-Flash**，支持点击 AI 气泡单词进行即时翻译与收藏。
- [x] **对话词汇收集**: AI 气泡逐词渲染，点击单词弹出 Mini-Drawer 查词并一键存入生词库。 ✅
- [x] **Luminary 2.0 视觉系统**: 纸张质感、0.04 触感噪点与动态 Grid Spine 布局。
- [x] **沉浸式闪卡复习**: 基于 Framer Motion 的 3D 翻转卡片逻辑，支持掌握程度标记。
- [x] **音素级发音纠错**: 深度整合 Azure Speech SDK，提供精准的发音反馈报告。
- [x] **成长大盘 (Learning Dashboard)**: 实时追踪 XP、等级与每日目标。

## 📈 MVP Build Completion

本项目已正式进入 **MVP 闭环**：
- **Dialog-to-Bank Interaction**: 实现了从对话交流到词汇沉淀的完整链路。
- **Build Optimization**: 针对 Next.js 16/15 的开发环境进行了稳定性优化。

## 🚀 Phase 2 Roadmap (未来计划)

- [x] **SM-2 算法优化**: 启用 `backend/services/scheduler.py` 中的 SuperMemo-2 算法进行动态复习调度。
- [/] **Supabase Auth / Clerk**: 实现用户账户系统与跨端数据同步 (已完成基础连接修复)。
- [ ] **多模型联邦支持**: 扩展对 OpenAI, Gemini 以及 DeepSeek 等多模型的高级路由支持。
- [ ] **多语言流式同步**: 优化 ASR 与 LLM 的流式交互体验，进一步降低延迟。

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

*Final MVP Update: 2026-04-01*
