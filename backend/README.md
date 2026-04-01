# README - AI English Learning Assistant Backend

## Setup Instructions

1.  **Clone/Download** this repository.
2.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```
3.  **Environment Variables**:
    - Copy `.env.template` to `.env`.
    - Fill in your API keys for OpenAI, Anthropic, Gemini, and Azure Speech Service.
4.  **Run the Server**:
    ```bash
    python main.py
    ```

## Project Status: Phase 4 Complete (Learning Loop) 🧠

The project has reached a major milestone by closing the learning loop.
- **SM-2 Algorithm**: Integrated the **SuperMemo-2** algorithm for intelligent vocabulary scheduling.
- **Targeted Assessment**: Enhanced `/v1/process-audio` with `target_text` for focused word-level corrective feedback.

## Next Phase: Phase 5 - Persistence & Cloud Sync ☁️ [IN PROGRESS]
We have successfully initiated the transition to **Supabase Auth**. 
- [x] Corrected Supabase project URL and verified connectivity.
- [ ] Implement advanced **Learning Analytics** dashboards.

## Project Structure

- `main.py`: FastAPI entry point and routing.
- `services/`:
  - `llm.py`: Unified Model Gateway using **LiteLLM**.
  - `speech.py`: Azure Pronunciation Assessment integration.
  - `scheduler.py`: **SM-2** Spaced Repetition logic.
- `.env.template`: Template for required API keys.
- `frontend/`: Next.js 14 App Router optimized for English learning.
