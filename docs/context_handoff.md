# AI English Learn — 会话交接文档

## 你的角色
辅导我用 Antigravity Agent 开发这个 App。
不要自己写代码，而是告诉我该给 agent 下什么指令。

## 项目基本信息
- GitHub: https://github.com/Sushi771/ai-english-learn
- 本地路径: C:\ai-english-learn（Antigravity Agent 可直接读取本地项目，不需要 filesystem MCP）
- 技术栈: Next.js 15.3.0 + TypeScript + Tailwind CSS v4 + Framer Motion
           FastAPI + 智谱 GLM-4 + Supabase PostgreSQL
- 前端: C:\ai-english-learn\backend\frontend
- 后端: C:\ai-english-learn\backend

## Antigravity 可用能力
MCP: filesystem、github、puppeteer、memory、fetch、sequential-thinking、sqlite、StitchMCP
核心角色: Orchestrator、Architect、Senior Developer、QA/Reviewer
原则: 复杂任务先让 Orchestrator 拆解，用 github MCP 查参考实现，用 memory MCP 固化架构决策

## 当前完成状态（v2.3 Phase 2 已交付）
✅ 基础设施、场景生成、核心对话、实时纠错
✅ 定级测试（A1-B2，数据库持久化）
✅ 词汇复习（WordBank 闪卡 + SM-2 间隔复习算法）
✅ 词汇收集（Session.tsx AI气泡逐词点击 + Mini-Drawer）
✅ Supabase Auth 完整接入并验证通过
✅ 多模型支持（GLM-4 Flash / GLM-4.5 Air 路由切换，已端到端验证）
✅ **Luminary 3.0 UI Overhaul**（全量 CSS 变量架构 + 毛玻璃系统 100% 覆盖）
✅ **Learning Streak**（基于实时 Session 数据的练习连续天数统计）
✅ **Bug Fixes: AI Metadata & Mission Compass**（解耦 AI 气泡词汇表，补全官方场景 HUD）

## 已确认的架构决策（重要！）
- Supabase 新项目（2024年后）JWT 算法为 ES256，不是 HS256
- auth_service.py 已改为通过 JWKS 公钥验证，端点：
  https://osotmqdwnwrgwfececmm.supabase.co/auth/v1/.well-known/jwks.json
- SUPABASE_JWT_SECRET 已从 .env 删除，不再使用
- session 通过 createBrowserClient（@supabase/ssr）同步到 cookie
- user_id 从 JWT sub 字段提取
- Turbopack 已禁用，强制 Webpack
- Supabase URL: https://osotmqdwnwrgwfececmm.supabase.co
- /v1/chat 端点已从 FormData 改为 JSON Body（Phase 2 期间统一）
- 模型选择持久化在 localStorage key: preferred_model
- **UI 变量系统**: 全量采用 `globals.css` 中的 CSS 变量，严禁在组件中硬编码 HEX。
- **字体规范**: 标题使用 `var(--font-manrope)`，正文使用 `var(--font-inter)`。

## Phase 2 多模型支持 — 已完成架构（重要！）

### 新增 / 修改文件清单
| 文件 | 类型 | 说明 |
|------|------|------|
| `backend/services/llm_router.py` | 新建 | 工厂函数 get_llm_client(model_id)，统一 BaseLLMClient 接口 |
| `backend/services/llm.py` | 修改 | ModelGateway 改为调用 llm_router，移除 litellm 依赖 |
| `backend/services/placement_engine.py` | 修改 | 直接使用 get_llm_client，支持 model_id 透传 |
| `backend/services/scenario_engine.py` | 修改 | 直接使用 get_llm_client，支持 model_id 透传 |
| `backend/main.py` | 修改 | /v1/chat 改 JSON，三端点加 model_id 参数，统一兜底逻辑 |
| `backend/.env` | 修改 | 新增 DEFAULT_MODEL=glm-4-flash |
| `backend/frontend/lib/api.ts` | 修改 | 三函数自动读 localStorage preferred_model 传 model_id |
| `backend/frontend/app/settings/page.tsx` | 修改 | 新增模型选择 UI |

### 支持的模型（共用同一个 ZHIPUAI_API_KEY）
- `glm-4-flash`：默认，均衡
- `glm-4.5-air`：快速
- `glm-4v-plus-0111`：占位，暂不激活
- `openai` / `deepseek` / `gemini`：PlaceholderClient，返回 501

### 关键设计原则
- model_id 单一兜底点在 main.py（`os.getenv("DEFAULT_MODEL", "glm-4-flash")`）
- engine 层不再做默认值回退
- 所有调用统一使用前端传来的 model_id，后端不做角色级别的模型覆盖
- STT 模型（glm-asr-2512）独立，不参与路由

### 端点 model_id 传递方式
- `/v1/chat`：JSON body 字段
- `/v1/scenario/forge`：FormData 字段
- `/v1/placement/evaluate`：JSON body 字段

### 验证结论
- 前端设置页切换 GLM-4.5 Air 后，Network Payload 确认 model_id: "glm-4.5-air" 正确传入
- 后端返回 200 OK，对话功能正常

## Phase 3 & Bug Fixes (2026-04-05) — 已完成
### 1. AI 气泡元数据解耦
- **问题**: A1 等级 AI 会在回复末尾强行附带中文单词对照，破坏对话流畅度。
- **修复**: 移除 `llm.py` 系统提示词中的强制翻译指令。新增 `target_phrases` 内部指令流，让 AI 在对话中自然运用关键词而非罗列。

### 2. 官方场景 Mission Compass (HUD) 增强
- **问题**: 只有自定义场景有 HUD，官方场景进入后 Mission Compass 为空。
- **修复**: 在 `scenes/page.tsx` 中为所有官方场景补全了 `setting` 和 `target_phrases` 元数据。
- **同步**: 官方场景选择后同样写入 `sessionStorage`，并确保在 Session 页面读取后立即 `removeItem`（保留用户要求的清理逻辑）。

### 3. 鲁棒的 TTS 文本提取
- **修复**: `useTTS.ts` 采用 `text.split('/')[0].split('\n')[0].trim()`，兼容斜杠翻译和多行回复，确保只朗读英文原文。

## 下一步（按优先级）
1. 🔲 **语音评测细节打磨** (优化评测算法与 UI 反馈)
2. 🔲 **场景生成多样性** (丰富 AI 锻造场景的模板)
