# Changelog

All notable changes to this project will be documented in this file.

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
