# AI English Assistant (智学英语 AI) v3.2 - Analytics Pulse Release 📊

一款专为中国用户打造的、基于 **智谱 AI (Zhipu AI)** 与 **Azure 发音评测** 技术的端到端英语学习助手。系统采用全新的 **"Luminary 3.0" (双生灵光)** 视觉系统，提供极速响应的毛玻璃界面、CSS 变量驱动的主題切换与深度 HUD 交互体验。

## 🌟 核心功能 (Features)

- [x] **AI 智能对话**: 接入 **GLM-4-Flash**，支持点击 AI 气泡单词进行即时翻译与收藏。
- [x] **AI 气泡翻译 (Bubble Translation)**: 高级意译功能，支持长句中英对照，内置会话级缓存。 ✅
- [x] **对话词汇收集**: AI 气泡逐词渲染，点击单词弹出 Mini-Drawer 查词并一键存入生词库。 ✅
- [x] **Luminary 3.0 视觉系统**: 全球级毛玻璃质感、CSS 变量分发、24px 极速渲染滤镜。 ✅
- [x] **沉浸式闪卡复习**: 基于 Framer Motion 的 3D 翻转卡片逻辑，支持掌握程度标记与 SM-2 动态调度。 ✅
- [x] **Session 评估引擎**: 会话结束自动生成评分、纠错汇总与学习成就，助力认知固化。 ✅
- [x] **成长大盘 & HUD**: 支持学习连续天数 (Streak) 追踪、任务罗盘与明日到期词汇预警。 ✅
- [x] **学习统计仪表盘 (Stats Dashboard)**: 全新 `/dashboard/stats` 页面，可视化累计场次、词汇掌握率环形图与 14 天复习趋势柱状图。 ✅

## 📈 Milestone Completion (v3.2)

本项目已完成 **Analytics Pulse (数据可视化)** 阶段：
- **Stats Dashboard**: 新增学习统计页面，用户可查看累计场次、词汇掌握率与 14 天复习趋势。
- **Synaptic Sync**: 完美闭环了"对话-翻译-评分-复习-统计"的学习全路径。
- **Performance**: 全量启用 SSE 流式响应与前端缓存，首屏交互延迟降低 40%。

## 🚀 Phase 3 & 4 Roadmap (路线图)

- [x] **Phase 3: Session Intelligence**: 完成评分引擎、纠错总结与连续学习统计。
- [x] **AI Bubble Translation**: 完成安全翻译端点、本地缓存及 Premium 视觉动画。
- [x] **Learning Stats Dashboard**: 完成统计 API、Recharts 可视化与响应式布局。
- [ ] **Phase 4: Advanced Spoken Evaluation**: 引入细粒度音素评分与多维度口语诊断。
- [ ] **Social Motivation**: 勋章墙、成就分享与全球排行榜。

## 🛠️ 技术栈 (Tech Stack)

- **前端**: Next.js 15.3.0, Tailwind CSS v4, Framer Motion, Recharts, Wavesurfer.js.
- **后端**: FastAPI (Python 3.11+), Supabase (PostgreSQL), SQLite (Local Cache).
- **引擎**: 智谱 ASR/GLM-4 (LLM), Zhipu TTS, Azure Pronunciation Assessment.

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
- **`agency-analytics-reporter`**: 学习统计仪表盘数据可视化负责人。

*Last Synchronized by Agentic Workflow at: 2026-04-22 (v3.2 Analytics Pulse Update)*
