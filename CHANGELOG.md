# Changelog

All notable changes to this project will be documented in this file.

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
