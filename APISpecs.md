# AI English Learn - API Specifications (v2.3)

## 1. Base URL
`https://api.ai-english.example.com/v1`

## 2. Authentication
All requests must include a Bearer Token in the header (Supabase Auth JWT):
`Authorization: Bearer <access_token>`

## 3. Endpoints

### 3.1 Sessions
*   **POST `/v1/session/end`**
    *   **Desc**: End a session and save score.
    *   **Input (FormData)**: `session_id`, `score`
    *   **Output**: `{"status": "success", "session_id": "..."}`

### 3.2 Conversation & Chat
*   **POST `/v1/chat`**
    *   **Desc**: Unified text-based chat endpoint.
    *   **Input (JSON Body)**:
        ```json
        {
          "session_id": "string (or 'new')",
          "text": "string",
          "scenario": "string (optional)",
          "model_id": "string (optional)"
        }
        ```
    *   **Response (JSON)**:
        ```json
        {
          "response": "AI reply text",
          "session_id": "uuid"
        }
        ```

### 3.3 Scenario Generation
*   **POST `/v1/scenario/forge`**
    *   **Desc**: Generate a practice scenario from natural language.
    *   **Input (FormData)**: `query`, `level`, `model_id` (optional)
    *   **Output**: Scenario object with title, context, and tasks.

*   **GET `/v1/scenario/generate`**
    *   **Desc**: Auto-generate scenario based on weak words.
    *   **Parameters**: `level`, `model_id`

### 3.4 Placement Test
*   **POST `/v1/placement/evaluate`**
    *   **Desc**: Evaluate test results.
    *   **Input (JSON body)**: `submissions`, `model_id`
    *   **Output**: `{ "level": "B1", "score": 85, "rationale": "..." }`

### 3.5 Mastery & Word Bank
*   **GET `/v1/word-bank`**
    *   **Desc**: Fetch all user's words.
*   **POST `/v1/word-bank/add`**
    *   **Desc**: Add a word manually.
*   **PATCH `/v1/word-bank/{word_id}/status`**
    *   **Desc**: Update word status (mastered/reviewing/new) using SM-2 algorithm.

## 4. Error Codes
| Code | Meaning |
| :--- | :--- |
| 401 | Unauthorized (Invalid/Expired Token) |
| 422 | Unprocessable Entity (Missing Parameters) |
| 429 | Rate Limit Exceeded |
| 500 | Internal AI Provider Error |
