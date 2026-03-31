# AI English Assistant (智学英语 AI) v2.1

一款专为中国用户打造的、基于 **智谱 AI (Zhipu AI)** 与 **Azure 发音评测** 技术的端到端英语学习助手。系统采用全新的 **"Luminary 2.0" (双生灵光)** 视觉系统，提供超宽屏适配、纸质触感与社论级排版体验。

## 🌟 核心功能 (Features)

- **AI 智能对话**: 接入 **GLM-4-Flash**，提供极致低延迟的场景化英语口语练习。
- [x] **Luminary 2.0 视觉系统**: 兼顾 **"Solar" (日光)** 与 **"Digital" (数字)** 双主题，引入 **0.04 触感噪点** 与 **谐音排版**。
- [x] **音素级发音纠错**: 深度整合 Azure Speech SDK，提供反馈精准的红/黄/绿发音报告。
- [x] **ArchitectUX Grid Spine**: 核心布局根据屏幕分辨率动态调整，在超宽屏下自动将 HUD 锁定为常驻侧边栏。
- [x] **智能生词本 (SM-2)**: 自动提取生词，利用 SuperMemo-2 记忆算法动态调度复习逻辑。
- [x] **成长大盘 (Learning Dashboard)**: 实时追踪 XP 经验值、等级进度与每日学习目标。

## 📈 Project Status: Phase 7 Evolution Complete 🌓

本项目已完成第二次重大视觉与功能修正：
- **Design Refinement**: 从基础深色模式进化为具有纸张质感与精准字重的 **Luminary 2.0** 体系。
- **Stability Upgrade**: 解决了 Next.js 16 在处理全局状态与 SessionStorage 时的水合 (Hydration) 冲突。
- **Status**: 系统架构进入极致稳定期，准备进入 Phase 8 (多端云同步)。

## 🚀 Next Phase: Phase 8 - Persistence & Cloud Sync ☁️
即将接入 **Supabase Auth / Clerk**，实现多端数据漫游。

## 🛠️ 技术栈 (Tech Stack)

- **前端**: Next.js 16.2.1, Tailwind CSS v4, Framer Motion, Wavesurfer.js.
- **后端**: FastAPI (Python 3.10+), SQLite (Local Persistence).
- **AI 接口**: 智谱 ASR (STT), 智谱 GLM-4 (LLM), Azure Pronunciation Assessment.

## 🚀 快速开始 (Quick Start)

### 1. 环境准备
- **智谱 AI**: 获取 `ZHIPUAI_API_KEY`。
- **Azure Speech**: 获取 `SPEECH_KEY` 与 `SPEECH_REGION`。

### 2. 运行项目
#### 快捷方式 (推荐)
- 在项目根目录下，双击 **`launcher.bat`**。
- 系统会自动启动后端 (Port 8080)、前端 (Port 3001) 并打开预览。

#### 手动运行
```bash
# 后端
cd backend
python -m uvicorn main:app --reload --port 8080

# 前端
cd backend/frontend
npm run dev -- -p 3001
```

---
## 🤖 协作代理 (Agentic Fleet)
本项目由以下专职 AI 代理共同维护：
- **`agency-ux-architect`**: 负责 Luminary 2.0 令牌系统与 ArchitectUX 布局设计。
- **`agency-backend-architect`**: 负责 SM-2 算法实现与 Zhipu AI 驱动层稳定性。
- **`agency-frontend-developer`**: 负责 Next.js 16 架构迁移与 Tailwind v4 适配。
- **`agency-project-shepherd`**: 负责 PRD v2.1 同步与全量文档自动化更新。

*Last Update: 2026-03-29 15:30*
