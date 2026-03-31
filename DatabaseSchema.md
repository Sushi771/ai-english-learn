# AI English Learn - Database Schema (v1.0)

## 1. Overview
We use **Supabase (PostgreSQL)** for relational data and **pgvector** for vector search (long-term memory).

## 2. Relational Schema (PostgreSQL)

### `users`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Unique user ID (from Clerk/Auth). |
| `email` | String | User email. |
| `gse_score` | Integer | Initial GSE placement score. |
| `created_at` | Timestamp | Account creation date. |

### `sessions`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Session ID. |
| `user_id` | UUID (FK) | Reference to `users.id`. |
| `topic` | String | e.g., "Airport Check-in". |
| `started_at` | Timestamp | Session start time. |

### `chat_logs`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Log ID. |
| `session_id` | UUID (FK) | Reference to `sessions.id`. |
| `role` | Enum | `user` or `assistant`. |
| `content` | Text | The transcript or AI response. |
| `audio_url` | String | URL to stored audio file (S3/Supabase Storage). |
| `created_at` | Timestamp | Message time. |

### `word_bank` (The "Mistake" Tracker)
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Record ID. |
| `user_id` | UUID (FK) | Reference to `users.id`. |
| `word` | String | The target word. |
| `error_type` | Enum | `pronunciation`, `grammar`, `vocabulary`. |
| `mastery_level` | Integer | 0-5 (0: New, 5: Mastered). |
| `next_review` | Date | Scheduled review date (Spaced Repetition). |

## 3. Vector Schema (pgvector)

### `memory_vectors`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Vector ID. |
| `user_id` | UUID (FK) | Reference to `users.id`. |
| `content` | Text | Summarized learning point or specific feedback. |
| `embedding` | Vector(1536) | OpenAI `text-embedding-3-small` vector. |
| `metadata` | JSONB | e.g., `{"session_id": "...", "date": "..."}`. |
