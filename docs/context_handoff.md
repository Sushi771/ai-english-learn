# AI English Learn — 会话交接文档

## 你的角色
辅导我用 Antigravity Agent 开发这个 App。
不要自己写代码，而是告诉我该给 agent 下什么指令。

## 项目基本信息
- GitHub: https://github.com/Sushi771/ai-english-learn
- 本地路径: C:\ai-english-learn
- 技术栈: Next.js 15.3.0 + TypeScript + Tailwind CSS v4 + Framer Motion
           FastAPI + 智谱 GLM-4 + Supabase PostgreSQL
- 前端: C:\ai-english-learn\backend\frontend
- 后端: C:\ai-english-learn\backend

## Antigravity 可用能力
MCP: filesystem、github、puppeteer、memory、fetch、sequential-thinking、sqlite、StitchMCP
核心角色: Orchestrator、Architect、Senior Developer、QA/Reviewer
原则: 复杂任务先让 Orchestrator 拆解，用 github MCP 查参考实现，用 memory MCP 固化架构决策

## 当前完成状态（v2.2 MVP 全部闭环，已提交 GitHub）
✅ 基础设施、场景生成、核心对话、实时纠错
✅ 定级测试（A1-B2，数据库持久化）
✅ 词汇复习（WordBank 闪卡 + SM-2 间隔复习算法）
✅ 词汇收集（Session.tsx AI气泡逐词点击 + Mini-Drawer）
✅ Supabase Auth 完整接入并验证通过

## 已确认的架构决策（重要！）
- Supabase 新项目（2024年后）JWT 算法为 ES256，不是 HS256
- auth_service.py 已改为通过 JWKS 公钥验证，端点：
  https://osotmqdwnwrgwfececmm.supabase.co/auth/v1/.well-known/jwks.json
- SUPABASE_JWT_SECRET 已从 .env 删除，不再使用
- session 通过 createBrowserClient（@supabase/ssr）同步到 cookie
- user_id 从 JWT sub 字段提取
- Turbopack 已禁用，强制 Webpack
- Supabase URL: https://osotmqdwnwrgwfececmm.supabase.co

## 本次会话修复的 Bug（已完成）
1. evaluatePlacement 报"评估失败"（无信息）
   → api.ts 改为读取 response body 并抛出详细错误
2. page.tsx 传了多余的 "default_user" 参数
   → 删除，改为 evaluatePlacement(finalAnswers)
3. main.py evaluate_placement 缺少空值校验和异常处理
   → 加了 422 校验 + try/except 返回 500
4. placement_engine.py res["score"] 可能 KeyError
   → 改为 res.get("score", 0)
5. JWT 401 错误：python-jose 换 PyJWT 仍失败
   → 根本原因是 Supabase 新项目用 ES256，改为 JWKS 公钥验证后解决

## Phase 2 下一步（按优先级）
1. ✅ Supabase Auth（已完成）
2. 🔲 多模型支持（OpenAI / Gemini / DeepSeek 路由切换）
3. 🔲 流式响应优化
