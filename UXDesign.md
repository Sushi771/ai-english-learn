# AI English Learn - UX 设计文档 (v3.0: Luminary Overhaul)

## 1. 设计系统 (Design System)
保留现有的 **Luminary 2.0** 双生皮肤系统，确保在该视觉体系下完成交互适配。

### 设计令牌 (Design Tokens)

| Token | Solar Luminary (Light) | Digital Luminary (Dark) |
|-------|------------------------|-------------------------|
| **Background** | `#f0f0fd` (Soft Lavender) | `#0c0e17` (Deep Obsidian) |
| **On-Background** | `#0c0e17` (Deep Blue) | `#f0f0fd` (Pale Lavender) |
| **Primary** | `#694fa9` (Deep Indigo) | `#ba9eff` (Electric Purple) |
| **Secondary** | `#34b5fa` (Azure Sky) | `#34b5fa` (Azure Sky) |
| **Noise Opacity** | `0.03` (Subtle Grain) | `0.15` (Digital Grain) |
| **Glass Blur** | 24px (High Translucency) | 24px (High Translucency) |
| **Surface Radius** | `2.5rem` (Squircle) | `2.5rem` (Squircle) |

### 1.1 核心视觉架构 (Architecture)

- **CSS 变量分发**: 放弃硬编码 HEX，全面采用 `:root` 与 `.dark` 变量映射。
- **毛玻璃系统 (Glassmorphic Layer)**: 
  - `@utility luminary-glass`: 极高模糊值 (24px) 配合低透明度背景，营造灵动虚化感。
  - `@utility luminary-border`: 细微描边 (1px) 强化玻璃边缘质感。
- **微交互光效**:
  - `glow-primary`: 柔和的主色漫反射阴影。
  - `glow-secondary`: 柔和的辅助色漫反射阴影。
- **排版系统**:
  - **Manrope**: 用于标题和装饰性文本，增强现代感与设计张力。
  - **Inter**: 用于正文阅读，保证易读性与清晰度。

## 2. 核心用户流程 (User Flows)

### 2.1 新用户首入流程 (Onboarding)
1. **唤醒引导**: 用户进入 Landing Page，点击“开始测试 (Start Placement)”。
2. **定级练习**: 系统分 5 步展示对话。第一步弹出简单问题（A1），用户录音/打字回应。
3. **进度感知**: 顶部进度条随题目完成度平滑增长。
4. **结果判定**: 第 5 题完成后，展示“检测到您的等级为 B1”动态卡片。
5. **首次体验**: 点击卡片下方“进入首个场景”，自动跳转至 Dashboard。

### 2.2 场景自定义对话完整流程 (Dialogue Flow)
1. **场景构建**: 用户在 Dashboard 输入“在海关柜台”。
2. **AI 配置**: 点击“开始对练”，屏幕呈现 AI 正在配置场景角色。
3. **主对话流**: AI 先行发话，底部输入区激活。
4. **录音交互**: 长按录音球展示频率波纹；松开即发送并重置。
5. **会话结束**: 点击顶部“退出”，弹出简短汇总（本场耗时、习得新词数）。

### 2.3 词汇收集触发与交互 (Vocab Collection)
1. **逐词点击**: AI 消息气泡中的每个单词均可点击，悬停时有 `primary` 颜色高亮及下划线反馈。
2. **Mini-Drawer 弹出**: 点击单词后，在消息气泡下方平滑弹出小型抽屉（非全屏），展示单词标题、实时翻译（Loading 状态）及例句。
3. **收藏动作**: 点击 Drawer 中的“星号”按钮，触发 `addToWordBank` API。星号变为实心金黄色，表示成功加入词库。

### 2.4 词汇复习流程 (Review Flow)
1. **全屏覆盖层**: 从 Word Bank 点击“开始复习”进入全屏闪卡模式（Framer Motion 动画）。
2. **3D 翻转卡片**: 点击卡片中心，卡片沿 Y 轴进行 **3D 翻转** 展示背面（释义 + 原文例句）。
3. **算法反馈按钮**: 翻转后底部展示三个按钮：**不认识 (New)**、**模糊 (Reviewing)**、**已掌握 (Mastered)**。
4. **SM-2 驱动切换**: 点击按钮后果断触发状态更新并调用 SM-2 调度算法，卡片左右滑出并自动推入下一张。

## 3. 核心页面线框图描述

### 3.1 首页 / Dashboard
- **顶部区域**: 用户等级勋章（A1-B2）与总 XP 进度。
- **中部核心**: 非对称格栅卡片，显眼展示“最近未掌握单词数”与“今日练习时长”。
- **底部悬浮**: “快速开始练习”入口，支持直接输入关键词。

### 3.2 场景选择页
- **顶部横排**: 推荐场景分类标签（旅行、职场、社交）。
- **主输入框**: 占据视觉中心，带有提示语“您想在哪里练习？”。
- **下方瀑布流**: 展示历史练习过的场景快照及收藏。

### 3.3 对话练习页 (Dialogue Scene)
- **主体流**: 中部垂直滚动区域，左侧 AI 气泡，右侧用户气泡。
- **气泡细节**: AI 气泡下方预留“实时纠错层”，仅当 AI 识别出错误时显示。
- **右下角 HUD**: 小型 HUD (任务罗盘 - Mission Compass)，点击可查看当场任务进度（Mission Checkpoints）。
- **底部输入**: 录音球居中，左右侧分别为键盘输入切换与单词查询快速入口。

### 3.4 词库与复习页 (Word Bank)
- **左侧边栏**: 字母顺序索引或日期排序切换。
- **右侧主区**: 单词条目列表；点击顶部“开始今日复习”触发全屏闪卡模式叠加层（Overlay）。

## 4. 关键交互状态 (Interaction States)

- **AI 思考中**: 用户气泡发送后，AI 头像旁出现微小的呼吸灯光效（脉动渐变），而非传统 Loading 转圈。
- **AI 纠错显示**: 纠错文字采用淡黄色半透明背景（Warning Amber），平滑滑入用户上一句气泡下方，避免突兀。
- **定级测试反馈**: 每一题回答后，底部会闪过微小的“Correct”或“Nice Effort”触觉反馈级文字提醒。
- **录音状态**: 录音球外围出现基于音量分贝的实时缩放阴影（Ripple Effect）。
