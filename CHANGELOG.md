# Changelog

All notable changes to this project will be documented in this file.

## [3.2.0] - 2026-04-22

### Added
- **Learning Stats Dashboard**:
    - New `/dashboard/stats` visualization page using Recharts.
    - Integrated "Total Sessions" and "Vocab Mastery Rate" (SVG ring) modules.
    - Added "14-Day Review Trend" bar chart with interactive tooltips.
    - Created responsive sidebar entry card in AIDashboard.
- **Backend Analytics**:
    - New `GET /v1/stats/summary` endpoint providing session counts, mastery rates, and 14-day history.
    - Centralized routing structure in `backend/routes/`.
- **UI/UX**:
    - Added `--surface-variant` CSS tokens for consistent skeleton and component styling.

## [3.1.0] - 2026-04-22

### Added
- **AI Bubble Translation**:
    - On-demand translation for AI messages within the chat session.
    - In-session translation caching to optimize performance and reduce API latency.
    - Premium UI with glassmorphism styling and Framer Motion animations (height/opacity/blur).
    - Synchronized loading state with "Sparkles" visual feedback.
- **Security**: 
    - Protected `/v1/translate` endpoint with JWT authentication using `Depends(get_current_user)`.

### Changed
- **API Strategy**: Standardized on relative paths for `/v1/*` endpoints to support Next.js proxy rewrites.

## [3.0.0] - 2026-04-21

### Added
- **Session Intelligence:**
    - New `/v1/session/end` endpoint with dynamic scoring based on AI-generated corrections.
    - Post-session Summary Modal displaying "Correction Highlights" and "Experience Gained".
    - Automatic redirection back to the dashboard after session completion.
- **Cognitive Reinforcement:**
    - **Streak Tracking:** Backend implementation and Dashboard UI for daily learning streaks.
    - **Proactive Reviews:** "Due Tomorrow" notification system on the Home/Dashboard pages for Vocabulary Bank items.
- **Security & Infrastructure:**
    - **JWT-Secured TTS:** Migrated Speech-to-Text endpoint behind Supabase Auth verification.
    - **Middleware Stability:** Optimized auth checks using `supabase.auth.getUser()` for improved reliability.

### Fixed
- **Voice Experience:** Re-engineered `useTTS` hook to prevent audio overlapping using `requestIdRef` and `Audio` object reuse.
- **UI/UX Refinements:**
    - Resolved Scene Title truncation issues on mobile devices in the Session page.
    - Fixed Vocabulary Bank bugs preventing word deletion and translation persistence.
    - Optimized session creation logic to prevent database write failures.

## [2.6.0] - 2026-04-04


### Fixed
- **WordBank Persistence (SM-2):**
    - Corrected column naming mismatch from `repetition` to `repetitions` in SQL and Python models.
    - Sanitized Supabase `UPDATE` payload to remove non-existent columns (`status`, `updated_at`) that were causing schema cache errors.
    - Resolved issue where `interval` and `repetitions` remained at 0 after multiple reviews.
- **Backend Stability:** 
    - Fixed `KeyboardInterrupt` hang during `litellm` remote model cost fetching on startup.
    - Cleaned up debug print statements from production code.

### Added
- **SM-2 Core Engine:** Fully integrated `SchedulerService` into the word review endpoint with verified persistence.

## [2.5.0] - 2026-04-03

### Added
- **Luminary UI Overhaul (Phase 3 Visuals):**
    - Transitioned to a unified CSS Variable system (`:root` / `.dark`) for cross-thematic consistency.
    - Implemented a high-performance **Glassmorphism** layer using Tailwind v4 `@utility`.
    - Integrated **Manrope** (Headers) and **Inter** (Body) typography for a premium editorial feel.
    - Added decorative background textures (SVG Noise) and ambient pulse animations.
- **Modernized Components:**
    - **AIDashboard:** Refined grid layout with glass sidebars and glowing activity cards.
    - **Scenario Forge:** Redesigned scene selection with interactive hover scaling and elevation.
    - **Immersion Session:** HUD-inspired "Mission Compass" and interactive chat bubbles.
    - **WordBank:** Complete theme sync with the new Luminary tokens.

### Changed
- **Styling Architecture:** Removed legacy hardcoded HEX values in components in favor of `var(--background)`, `var(--primary)`, etc.
- **Layout:** Optimized padding and spacing for ultra-wide monitors using `max-w-luminary`.
    
## [2.4.0] - 2026-04-03
    
### Added
- **Streaming Response (Phase 3):** 
    - Full SSE support in `/v1/chat` via `FastAPI StreamingResponse`.
    - `stream_chat()` generator interface in `llm_router.py` for all clients.
    - Persistent typing cursor UI in the session page using `framer-motion`.
- **Robust Parsing:** Line-based buffering for SSE streams in `api.ts` to prevent character fragmentation.
- **UI UX:** Auto-scrolling chat history during active streaming.
    
### Changed
- **Backend Flow:** User messages are now persisted before the stream starts, and AI responses as soon as the stream finishes successfully.
- **Error Handling:** Centralized stream error reporting using `[ERROR]` protocol within the data stream.

## [2.3.0] - 2026-04-02

### Added
- **Multi-model Support (Phase 2):** 
    - Introduced `llm_router.py` with a centralized factory pattern for LLM clients.
    - Added support for **GLM-4 Flash** (Balanced) and **GLM-4.5 Air** (Fast).
    - Implemented `PlaceholderClient` for future integration of OpenAI, Gemini, and DeepSeek.
- **Model Selection UI:** New "Intelligence Model" section in the Settings page with real-time switching and persistence in `localStorage`.
- **Global Logging:** Configured backend to `INFO` level and added per-request model tracking in the router for easier debugging.

### Changed
- **API Protocol Unification:** 
    - Converted `/v1/chat` endpoint from `FormData` to **JSON Body** for better scalability.
    - Updated `/v1/scenario/forge` and `/v1/placement/evaluate` to support optional `model_id` parameter.
- **Backend Architecture:** Updated `PlacementEngine` and `ScenarioEngine` to utilize the new unified `ModelGateway` for model-agnostic prompting.

### Fixed
- **Module Import Error:** Fixed a `NameError` in `llm.py` and `main.py` caused by missing `os` and `uvicorn` imports after refactoring.
- **Auth Stability:** Verified JWKS public key verification for Supabase ES256 tokens.

## [2.2.0] - 2024-04-01

### Fixed
- **JWT Authentication:** Migrated from `python-jose` to `PyJWT` and implemented JWKS public key verification to support Supabase ES256 algorithm.
- **Placement Evaluation:** 
    - Frontend now correctly reads and displays detailed backend error messages.
    - Removed redundant `default_user` parameter in `evaluatePlacement` call.
    - Improved backend validation for empty submissions and added robust exception handling.
    - Fixed potential `KeyError` in `PlacementEngine` scoring logic.

### Added
- **UI States:** Added `isEvaluating` loading state and detailed error UI to the placement test page.
- **Diagnostics:** Created `diagnose_jwt.py` for debugging Supabase authentication issues.
- **Security:** Added `.env.local` to `.gitignore`.

## [2.1.0] - 2024-04-01

### Fixed
- **Supabase Connectivity:** Resolved `404 Not Found` and `ERR_NAME_NOT_RESOLVED` errors during registration by correcting the `NEXT_PUBLIC_SUPABASE_URL` in environment variables. 
    - Corrected project ID from `osotmqdwnrgwfececmm` to `osotmqdwnwrgwfececmm`.
- **Environment Management:** Synchronization of `.env` and `.env.local` to ensure local development consistency.

### Added
- **Connectivity Validation:** Implementation of browser-based smoke tests to verify authentication endpoints.

## [2.0.0] - 2024-03-29

### Added
- **Dual Luminary Design System:** Introduced Light Mode (Solar) and Dark Mode (Digital).
- **Theme Toggle:** Tactile UI component for instant environment switching.
- **ASR Stability:** Removed static mocks in favor of real-time `/v1/chat` logic.
