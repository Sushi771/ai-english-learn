from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import uvicorn
import os
import asyncio
import json
import uuid
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv

# Internal Services
from services.llm import gateway
# from services.speech import speech_service  # Phase 2: Azure removed
# from services.scheduler import scheduler    # Phase 2: SM-2 demoted
from services.database import db_service
from services.review import review_service
from services.scenario_engine import scenario_engine
from services.placement_engine import placement_engine
from services.foundation import foundation_service

load_dotenv()

app = FastAPI(title="AI English Learning Assistant API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/v1/health")
async def health_check():
    """Diagnostic endpoint for connectivity and API status."""
    zhipu_key = os.getenv("ZHIPUAI_API_KEY")
    supabase_available = db_service.is_available()
    return {
        "status": "online",
        "zhipu_api": "configured" if zhipu_key and len(zhipu_key) > 5 else "missing",
        "supabase": "connected" if supabase_available else "disconnected",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/")
async def root():
    return {"message": "AI English Learn API is running"}

# POST /v1/process-audio and /v1/process-audio-stream removed (Azure Speech SDK removed)

@app.post("/v1/chat")
async def chat(
    session_id: str = Form(...),
    text: str = Form(...),
    scenario: str = Form("General Conversation")
):
    """Text-based chat endpoint to handle user typed messages."""
    user_id = "test_user_id"
    active_session_id = session_id
    if active_session_id == "new":
        active_session_id = await db_service.create_session(user_id, scenario) or str(uuid.uuid4())

    await db_service.add_chat_log(active_session_id, "user", text)
    review_words = await review_service.get_review_context(user_id)

    messages = [{"role": "user", "content": text}]
    
    ai_response = await gateway.get_chat_response(
        messages, 
        role="fast_streamer", 
        scenario=scenario,
        review_words=review_words
    )

    await db_service.add_chat_log(active_session_id, "assistant", ai_response)

    return {
        "response": ai_response,
        "session_id": active_session_id
    }

@app.get("/v1/dashboard/stats")
async def get_dashboard_stats(user_id: str = "test_user_id"):
    """Get aggregated statistics for the user dashboard."""
    stats = await db_service.get_user_stats(user_id)
    return stats

@app.get("/v1/dashboard/sessions")
async def get_dashboard_sessions(user_id: str = "test_user_id"):
    """Get the most recent learning sessions for the user."""
    sessions = await db_service.get_recent_sessions(user_id)
    return sessions

@app.post("/v1/session/end")
async def end_session(
    session_id: str = Form(...),
    score: int = Form(0)
):
    """End a learning session and record the final score."""
    user_id = "test_user_id"
    await db_service.end_session(session_id, score)
    # Award some XP for completing a session
    await db_service.update_user_score(user_id, points=score)
    return {"status": "success", "session_id": session_id}

@app.get("/v1/challenge/words")
async def get_challenge_words(user_id: str = "test_user_id", limit: int = 5):
    """Fetch words for the Vocabulary Master Challenge."""
    # Priority: 1. Words due for review 2. Mastered words for reinforcement
    # SM-2 logic demoted to Phase 2, currently using simple fallback/limit
    due_words = await db_service.get_due_words(user_id, limit=limit)
    if len(due_words) < limit:
        all_words = await db_service.get_word_bank(user_id)
        # Pad with some other words if not enough due
        seen = {w["word"] for w in due_words}
        for w in all_words:
            if w["word"] not in seen and len(due_words) < limit:
                due_words.append(w)
                seen.add(w["word"])
    
    # Final fallback if word bank is empty
    if not due_words:
        return [
            {"word": "atmosphere", "phonetic": "/ˈætməsfɪər/"},
            {"word": "consequence", "phonetic": "/ˈkɒnsɪkwəns/"},
            {"word": "entrepreneur", "phonetic": "/ˌɒntrəprəˈnɜːr/"},
            {"word": "hypothesis", "phonetic": "/haɪˈpɒθəsɪs/"},
            {"word": "metaphor", "phonetic": "/ˈmetəfər/"}
        ]
    return due_words

@app.get("/v1/scenario/generate")
async def generate_custom_scenario(user_id: str = "test_user_id", level: str = "A1"):
    """Generate a dynamic scenario based on the user's weak words."""
    all_words = await db_service.get_word_bank(user_id)
    weak_words = [w["word"] for w in all_words if w.get("mastery_level", 0) < 3]
    if not weak_words:
        weak_words = ["comprehensive", "innovative", "architect", "significant"]
    scenario = await scenario_engine.generate_scenario(user_id, weak_words, level=level)
    return scenario

@app.post("/v1/scenario/forge")
async def forge_scenario(
    query: str = Form(...),
    level: str = Form("A1"),
    user_id: str = "test_user_id"
):
    """Forge a scenario from a natural language query."""
    return await scenario_engine.generate_scenario_by_query(user_id, query, level)

@app.get("/v1/placement/questions")
async def get_placement_questions():
    """Get a set of questions for the adaptive placement test."""
    return await placement_engine.get_test_questions()

@app.post("/v1/placement/evaluate")
async def evaluate_placement(submissions: List[Dict[str, Any]]):
    """Evaluate the placement test results and return a CEFR level."""
    result = await placement_engine.evaluate_test(submissions)
    return result

@app.get("/v1/foundation/curriculum")
async def get_foundation_curriculum():
    """Get the introductory curriculum for Level 0 users."""
    return foundation_service.get_all_lessons()

@app.get("/v1/word-bank")
async def get_word_bank(user_id: str = "test_user_id"):
    """Fetch the user's word bank from Supabase."""
    if not db_service.is_available():
        return [
            {"word": "aesthetic", "mastery_level": 1, "next_review": (datetime.now() + timedelta(days=1)).isoformat()},
            {"word": "phenomenon", "mastery_level": 0, "next_review": datetime.now().isoformat()},
            {"word": "integration", "mastery_level": 2, "next_review": (datetime.now() + timedelta(days=3)).isoformat()},
        ]
    
    try:
        result = db_service.client.table("word_bank") \
            .select("*") \
            .eq("user_id", user_id) \
            .order("next_review", desc=False) \
            .execute()
        return result.data
    except Exception as e:
        print(f"Error fetching word bank: {e}")
        return []

@app.post("/v1/word-bank/add")
async def add_to_word_bank(
    word: str = Form(...),
    example_sentence: str = Form(...),
    user_id: str = Form(...)
):
    """Stub for adding a word to the bank. Phase 1 implementation."""
    if not db_service.is_available():
        return {"status": "success", "message": "Word saved (local mode)", "word": word}
    try:
        data = {
            "user_id": user_id,
            "word": word,
            "example_sentence": example_sentence,
            "status": "new",
            "created_at": datetime.now().isoformat()
        }
        db_service.client.table("word_bank").insert(data).execute()
        return {"status": "success", "word": word}
    except Exception as e:
        print(f"Error adding word: {e}")
        return {"status": "error", "message": str(e)}

# SM-2 background updates demoted to Phase 2
# async def update_word_bank_background(user_id: str, pronunciation_result: dict):
#     """Helper to update word bank based on pronunciation assessment scores. (Phase 2)"""
#     ...

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=True)
