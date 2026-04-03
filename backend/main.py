import logging
import os
import asyncio
import json
import uuid
import uvicorn
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse

# Configure global logging
logging.basicConfig(level=logging.INFO)

# Internal Services
from services.llm import gateway
# from services.speech import speech_service  # Phase 2: Azure removed
from services.scheduler import scheduler    # Phase 2: SM-2 enabled
from services.database import db_service
from services.review import review_service
from services.scenario_engine import scenario_engine
from services.placement_engine import placement_engine
from services.foundation import foundation_service
from services.auth_service import get_current_user

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
    data: Dict[str, Any],
    user_id: str = Depends(get_current_user)
):
    """Text-based chat endpoint to handle user typed messages (JSON Body)."""
    session_id = data.get("session_id")
    text = data.get("text")
    scenario = data.get("scenario", "General Conversation")
    model_id = data.get("model_id") or os.getenv("DEFAULT_MODEL", "glm-4-flash")
    raw_stream = data.get("stream", False)
    stream = raw_stream is True or str(raw_stream).lower() == "true"
    print(f"[DEBUG] /v1/chat stream={stream!r} raw={raw_stream!r} model={model_id}")

    if not session_id or not text:
        raise HTTPException(status_code=422, detail="session_id and text are required")

    active_session_id = session_id
    if active_session_id == "new":
        active_session_id = await db_service.create_session(user_id, scenario) or str(uuid.uuid4())

    await db_service.add_chat_log(active_session_id, "user", text)
    review_words = await review_service.get_review_context(user_id)

    messages = [{"role": "user", "content": text}]
    
    if stream:
        async def event_generator():
            full_response = ""
            try:
                # 1. Send start marker immediately
                yield "data: [START]\n\n"
                
                # 2. Get the stream from gateway
                # Note: gateway.get_chat_response is async, but it returns an AsyncGenerator
                # when stream=True. We must await the call but iterate the generator.
                generator = await gateway.get_chat_response(
                    messages, 
                    model=model_id,
                    role="fast_streamer", 
                    scenario=scenario,
                    review_words=review_words,
                    stream=True
                )
                
                async for chunk in generator:
                    if chunk.startswith("[ERROR]"):
                        yield f"data: {chunk}\n\n"
                    else:
                        full_response += chunk
                        yield f"data: {chunk}\n\n"
                
                # 3. Send done marker
                yield "data: [DONE]\n\n"
                
                # 4. Success: Log the assistant response to DB
                if full_response and "[ERROR]" not in full_response:
                    await db_service.add_chat_log(active_session_id, "assistant", full_response)
            except Exception as e:
                print(f"[API] Streaming Error: {e}")
                yield f"data: [ERROR] Internal Server Error: {str(e)}\n\n"

        return StreamingResponse(event_generator(), media_type="text/event-stream")

    # 原有非流式路径保持向后兼容
    ai_response = await gateway.get_chat_response(
        messages, 
        model=model_id,
        role="fast_streamer", 
        scenario=scenario,
        review_words=review_words,
        stream=False
    )

    await db_service.add_chat_log(active_session_id, "assistant", ai_response)

    return {
        "response": ai_response,
        "session_id": active_session_id
    }

@app.get("/v1/dashboard/stats")
async def get_dashboard_stats(user_id: str = Depends(get_current_user)):
    """Get aggregated statistics for the user dashboard."""
    stats = await db_service.get_user_stats(user_id)
    return stats

@app.get("/v1/dashboard/sessions")
async def get_dashboard_sessions(user_id: str = Depends(get_current_user)):
    """Get the most recent learning sessions for the user."""
    sessions = await db_service.get_recent_sessions(user_id)
    return sessions

@app.post("/v1/session/end")
async def end_session(
    session_id: str = Form(...),
    score: int = Form(0),
    user_id: str = Depends(get_current_user)
):
    """End a learning session and record the final score."""
    await db_service.end_session(session_id, score)
    # Award some XP for completing a session
    await db_service.update_user_score(user_id, points=score)
    return {"status": "success", "session_id": session_id}

@app.get("/v1/challenge/words")
async def get_challenge_words(user_id: str = Depends(get_current_user), limit: int = 5):
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
async def generate_custom_scenario(user_id: str = Depends(get_current_user), level: str = "A1", model_id: Optional[str] = None):
    """Generate a dynamic scenario based on the user's weak words."""
    all_words = await db_service.get_word_bank(user_id)
    weak_words = [w["word"] for w in all_words if w.get("mastery_level", 0) < 3]
    if not weak_words:
        weak_words = ["comprehensive", "innovative", "architect", "significant"]
    
    effective_model = model_id or os.getenv("DEFAULT_MODEL", "glm-4-flash")
    scenario = await scenario_engine.generate_scenario(user_id, weak_words, level=level, model_id=effective_model)
    return scenario

@app.post("/v1/scenario/forge")
async def forge_scenario(
    query: str = Form(...),
    level: str = Form("A1"),
    model_id: Optional[str] = Form(None),
    user_id: str = Depends(get_current_user)
):
    """Forge a scenario from a natural language query (FormData)."""
    effective_model = model_id or os.getenv("DEFAULT_MODEL", "glm-4-flash")
    return await scenario_engine.generate_scenario_by_query(user_id, query, level, model_id=effective_model)

@app.get("/v1/placement/questions")
async def get_placement_questions():
    """Get a set of questions for the adaptive placement test."""
    return await placement_engine.get_test_questions()

@app.post("/v1/placement/evaluate")
async def evaluate_placement(data: Dict[str, Any], user_id: str = Depends(get_current_user)):
    """Evaluate the placement test results and return a CEFR level (JSON Body)."""
    submissions = data.get("submissions", [])
    model_id = data.get("model_id") or os.getenv("DEFAULT_MODEL", "glm-4-flash")
    
    if not submissions:
        raise HTTPException(
            status_code=422,
            detail="Submissions cannot be empty. Please complete the test before submitting."
        )

    try:
        result = await placement_engine.evaluate_test(submissions, model_id=model_id)
        
        # Persist the level in the database (profiles table, user_level field)
        # We follow the naming from the codebase's existing profile logic
        if db_service.is_available():
            level = result.get("level", "A1")
            try:
                # We update/create profile with the new level
                # Using user's specific request 'user_level' if possible or falling back
                db_service.client.table("profiles").upsert({
                    "id": user_id,
                    "user_level": level, 
                    "level": 1, # Base XP level
                    "updated_at": datetime.now().isoformat()
                }, on_conflict="id").execute()
            except Exception as e:
                print(f"Linguistic record persistence error: {e}")
                
        return result
    except Exception as e:
        print(f"Placement evaluation error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal error during evaluation: {str(e)}"
        )

@app.get("/v1/foundation/curriculum")
async def get_foundation_curriculum():
    """Get the introductory curriculum for Level 0 users."""
    return foundation_service.get_all_lessons()

@app.get("/v1/word-bank")
async def get_word_bank(user_id: str = Depends(get_current_user)):
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
    user_id: str = Depends(get_current_user)
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

@app.patch("/v1/word-bank/{word_id}/status")
async def update_word_bank_status(
    word_id: str,
    data: Dict[str, str],
    user_id: str = Depends(get_current_user)
):
    """Update only the status of a word in the bank."""
    status = data.get("status")
    uid = user_id # Using the authenticated user_id
    if not status:
        raise HTTPException(status_code=400, detail="Status is required")
    
    if not db_service.is_available():
        return {"success": True, "offline": True}
        
    try:
        # In this project, word_id is often the word string itself
        # Fetch existing record for this word
        record = await db_service.get_word_record(uid, word_id)
        
        # Mapping frontend status to quality scores
        # 'mastered' (Easy) -> 5
        # 'reviewing' (Hard) -> 3
        # 'new' (Forgot) -> 1
        quality_map = {"mastered": 5, "reviewing": 3, "new": 1}
        quality = quality_map.get(status, 3) 
        
        if record:
            # Use existing stats if available, otherwise use defaults
            current_ease = record.get("ease", 2.5) or 2.5
            current_interval = record.get("interval", 0) or 0
            current_reps = record.get("repetitions", 0) or 0
            
            # Calculate next review with SM-2
            sm2_result = scheduler.get_next_review(
                quality=quality,
                ease=current_ease,
                interval=current_interval,
                repetitions=current_reps
            )
            
            # Update word with complete SM-2 data
            await db_service.update_word_sm2(uid, word_id, sm2_result, status)
        else:
            # Fallback if record not found (shouldn't happen with valid word_id)
            await db_service.update_word_status(uid, word_id, status)
            
        return {"success": True}
    except Exception as e:
        print(f"Error updating word status: {e}")
        return {"success": False, "error": str(e)}

# SM-2 background updates demoted to Phase 2
# async def update_word_bank_background(user_id: str, pronunciation_result: dict):
#     """Helper to update word bank based on pronunciation assessment scores. (Phase 2)"""
#     ...

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=True)
