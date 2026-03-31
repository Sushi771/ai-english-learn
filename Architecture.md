# AI 英语学习助手 - 技术架构文档 (Architecture)

## 1. 系统架构总览
本项目采用前后端分离的现代化 Web 架构。前端基于 **Next.js 16 (App Router)** 提供响应式用户界面与多模式交互（文字/语音），后端采用 **FastAPI (Python 3.11+)** 构建高性能 AI 逻辑网关。核心 AI 能力由 **智谱 GLM-4.6** 模型驱动，涵盖对话生成与 ASR（语音转文字）。系统通过自适应难度引擎根据用户的定级测试结果（A1-B2）动态调整对话深度，实现个性化的语境对练。

## 2. 前端模块 (Frontend)
- **Route Handlers & Page Views**: 负责场景导航、对话练习、定级测试及词库管理。
- **Theme Provider**: 驱动 **Solar (Light)** 与 **Digital (Dark)** 双主题系统及 HSL 设计令牌。
- **HUD Interface (任务罗盘 - Mission Compass)**: 封装实时对话、任务进度及自适应侧边栏逻辑。
- **Level Manager (定级测试)**: 维护用户当前 Level 与难度自适应参数。
- **State Management**: 处理对话上下文、临时词汇收集状态及用户 Level 标签。
- **Animation Hub**: 利用 **Framer Motion** 实现主题平滑切换、气泡进场及交互反馈。

## 3. 后端模块 (Backend)
### 主要 API 端点
- `GET /v1/health`: 系统健康检查及 AI 供应商状态。
- `POST /v1/chat`: 文字/语音对话核心入口，集成纠错（correction 字段）与难度自适应逻辑。
- `GET /v1/placement/questions`: 获取定级测试题目。
- `POST /v1/placement/evaluate`: 评估测试结果并返回 A1-B2 等级。
- `GET /v1/word-bank`: 获取用户词库。
- `POST /v1/word-bank/add`: 将特定生词手动或自动加入词库。
- `POST /v1/scenario/forge`: 根据关键词动态生成场景自定义对话设定。

### 模块职责
- **Task Controller**: 路由分发与会话生命周期管理。
- **Logic Engine**: 封装 AI Response 生成、语法纠错提取及词汇自动标记。
- **Level Manager**: 维护用户当前 Level 与难度自适应参数。

## 4. AI 服务层 (AI Service Layer)
- **模型驱动**: 统一采用 **智谱 GLM-4.6** 模型，支持 Streaming 响应以降低响应延迟。
- **难度自适应逻辑**: 
    - **定级路径**: 用户完成 5 道交互式题目 -> 系统计算得分偏移 -> 映射至 A1/A2/B1/B2 标签。
    - **Prompt 策略**: 根据用户 Level 标签动态注入 `System Prompt`。例如，A1 级别会强制模型使用简单时态及高频词汇；B2 级别会启用复合句式及更丰富的习语表达。
- **实时纠错逻辑**: 模型在生成对话回复的同时，被要求在特定 JSON 字段或特定标记位输出用户上一句的语法/用词优化建议。

## 5. 数据持久化 (Data Persistence)
项目目前采用 **SQLite** 进行本地存储，未来计划迁移至 **Supabase** 进行云端同步。
### 表结构草案
- **users**: `id`, `user_level` (A1-B2), `xp`, `last_login_at`
- **word_bank**: `id`, `user_id`, `word`, `status` ('new' | 'reviewing' | 'mastered'), `last_assessed_at`
- **chat_logs**: `id`, `session_id`, `role` ('user', 'assistant'), `content`, `correction`, `created_at`
- **sessions**: `id`, `user_id`, `scenario_query`, `status`

## 6. MVP 功能清单
- [x] **基础设施**: Next.js + FastAPI 环境搭建 ✅
- [x] **场景生成**: 关键词动态场景构建 ✅
- [x] **核心对话**: 文字/语音双模对话集成 ✅
- [x] **实时纠错**: 基于 Prompt 的语法反馈逻辑 ✅
- [/] **定级测试**: 渐进难度算法与 Level 映射 🔧
- [/] **词汇收集**: 自动识别与手动入库流程 🔧
- [ ] **词库复习**: 三状态闪卡系统 📋 (Phase 2)
- [ ] **SM-2 算法**: 智能化复习间隔计算 📋 (Phase 2)

## 7. 已知技术风险
- **大模型纠错稳定性**: 在特定输入下，AI 可能产生过度纠错或漏报逻辑。
- **网络时延**: 跨国 ASR 调用（如有）或复杂 Prompt 处理可能导致 2s+ 的响应等待感。
- **本地持久化限制**: 现阶段 SQLite 无法实现多设备无缝同步，依赖 Supabase 的后续集成。
