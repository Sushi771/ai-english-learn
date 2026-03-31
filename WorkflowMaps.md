# AI English Learn - Workflow Maps (v2.0)

## 1. The "Magic Loop" (Audio & Theme-Aware Processing)
This sequence diagram describes the round-trip from the user's voice to AI feedback, including theme-aware rendering.

```mermaid
sequenceDiagram
    participant U as User (Next.js)
    participant B as Backend (FastAPI)
    participant Z as Zhipu AI (GLM-4 / ASR)
    participant A as Azure Pronunciation
    participant D as Database (Postgres)

    U->>B: POST /process-audio (audio + theme_context)
    B->>Z: STT (Audio to Text)
    Z-->>B: Text Transcript
    B->>Z: LLM (Analyze & Generate Reply)
    Z-->>B: {corrected_text, ai_reply}
    B->>A: Evaluate Pronunciation (audio + target_text)
    A-->>B: {accuracy, fluency, phonemes}
    B->>D: Update Word Bank (SM-2 Sync)
    B-->>U: Combined Response (JSON)
    U->>U: Apply Theme-Aware Colors (Adaptive HSL)
    U->>U: Render HUD & Feedback Cards
```

## 2. Theme Orchestration Flow
How the system manages the "Solar" vs "Digital" state.

```mermaid
flowchart TD
    Start[User Interaction] --> Context{ThemeProvider}
    Context -->|Toggle Click| Logic[Update State: light/dark]
    Logic --> Local[Save to LocalStorage]
    Logic --> CSS[Apply .dark Class to HTML]
    CSS --> Tokens[Variable Switch: --background, --primary]
    Tokens --> Render[Re-render Components with Framer Motion]
```

## 3. Spaced Repetition (SM-2) Logic
How the "Word Bank" decides when to show a word again.

1.  ** মাস্টারি লেভেল (Mastery Stage)**: 评分 0-100 映射至 0-5 级。
2.  ** Interval Calculation**: 
    - 级 3+: $I(n) = I(n-1) \times E$
    - 级 0-2: $I(n) = 1$ 天
3.  ** Topic-Based Prioritization**: 实时从对话场景中提取关键词，优先展示词库中语义相关的待完成单词。
