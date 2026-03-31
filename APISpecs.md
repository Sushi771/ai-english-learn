# AI English Learn - API Specifications (v1.0)

## 1. Base URL
`https://api.ai-english.example.com/v1`

## 2. Authentication
All requests must include a Bearer Token in the header:
`Authorization: Bearer <clerk_token>`

## 3. Endpoints

### 3.1 Sessions
*   **POST `/sessions/start`**
    *   **Desc**: Start a new learning session.
    *   **Input**: `{"topic": "Travel/Restaurant"}`
    *   **Output**: `{"session_id": "...", "initial_prompt": "Hello! Ready to order?"}`

### 3.2 Audio Processing (The Core)
*   **POST `/process-audio`**
    *   **Desc**: Upload user audio and get AI response + Pronunciation feedback.
    *   **Content-Type**: `multipart/form-data`
    *   **Request Body**:
        - `audio`: File (`.webm`)
        - `session_id`: UUID
        - `target_text`: String (Optional, for strictly following a sentence)
    *   **Response (JSON)**:
        ```json
        {
          "transcript": "I want to ordering a coffee.",
          "correction": "I would like to order a coffee.",
          "ai_reply": "Sure! Would you like milk or sugar with that?",
          "assessment": {
            "overall_score": 85,
            "accuracy": 80,
            "prosody": 90,
            "words": [
              {"word": "ordering", "error": "Grammar: should be base form 'order'"},
              {"word": "coffee", "phonemes": [...], "score": 95}
            ]
          }
        }
        ```

### 3.3 Mastery & Progress
*   **GET `/user/word-bank`**
    *   **Desc**: Get words marked for review.
    *   **Output**: `{"words": [{"word": "thorough", "score": 2, "next_review": "..."}]}`

### 3.4 Long-term Memory (RAG)
*   **GET `/user/learning-report`**
    *   **Desc**: Generate a summary of recent progress using Gemini 1.5.
    *   **Output**: `{"summary": "You have improved your 'th' sound by 20% this week..."}`

## 4. Error Codes
| Code | Meaning |
| :--- | :--- |
| 400 | Invalid Audio Format |
| 401 | Unauthorized |
| 429 | Rate Limit Exceeded (AI Provider) |
| 503 | Model Gateway Timeout |
