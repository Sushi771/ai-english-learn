from dotenv import load_dotenv
load_dotenv()

import logging
import os
import asyncio
import json
import uuid
import uvicorn
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
import edge_tts

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
from services.llm_router import get_llm_client

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

@app.post("/v1/process-audio")
async def process_audio(
    audio: UploadFile = File(...),
    session_id: str = Form(...),
    scenario: str = Form("General Conversation"),
    model_id: Optional[str] = Form(None),
    target_phrases: Optional[str] = Form(None),
    user_id: str = Depends(get_current_user)
):
    """Receive audio, transcribe it, and get an AI response."""
    # 1. Read audio bytes
    audio_bytes = await audio.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Audio file is empty")

    # 2. Transcription (ASR)
    # Using the fixed gateway.get_transcription
    transcript = await gateway.get_transcription(audio_bytes, audio.content_type)
    if not transcript:
        raise HTTPException(status_code=400, detail="Transcription failed")

    print(f"[DEBUG] ASR Transcript: {transcript}")

    # Parse target_phrases if provided as JSON string from Form
    phrases = []
    if target_phrases:
        try:
            import json
            phrases = json.loads(target_phrases)
        except:
            phrases = []

    # 3. Process as a chat message
    # Logic extracted from /v1/chat to ensure consistency
    active_session_id = session_id
    if active_session_id == "new":
        active_session_id = await db_service.create_session(user_id, scenario) or str(uuid.uuid4())

    await db_service.add_chat_log(active_session_id, "user", transcript)
    review_words = await review_service.get_review_context(user_id)
    messages = [{"role": "user", "content": transcript}]

    # Non-streaming chat response for audio processing
    ai_reply = await gateway.get_chat_response(
        messages,
        model=model_id or os.getenv("DEFAULT_MODEL", "glm-4-flash"),
        role="fast_streamer",
        scenario=scenario,
        review_words=review_words,
        target_phrases=phrases,
        stream=False
    )

    await db_service.add_chat_log(active_session_id, "assistant", ai_reply)

    # 4. Return strictly aligned fields as per supplementary instructions
    return {
        "transcript": transcript,
        "reply": ai_reply
    }

@app.post("/v1/chat")
async def chat(
    data: Dict[str, Any],
    user_id: str = Depends(get_current_user)
):
    """Text-based chat endpoint to handle user typed messages (JSON Body)."""
    session_id = data.get("session_id")
    text = data.get("text")
    scenario = data.get("scenario", "General Conversation")
    target_phrases = data.get("target_phrases", [])
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
                    target_phrases=target_phrases,
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
        target_phrases=target_phrases,
        stream=False
    )

    await db_service.add_chat_log(active_session_id, "assistant", ai_response)

    return {
        "response": ai_response,
        "session_id": active_session_id
    }

@app.post("/v1/session/create")
async def create_session(
    data: Dict[str, Any],
    user_id: str = Depends(get_current_user)
):
    scenario = data.get("scenario", "General Conversation")
    session_id = await db_service.create_session(user_id, scenario)
    return {"session_id": session_id}

@app.post("/v1/tts")
async def text_to_speech(
    data: Dict[str, str],
    user_id: str = Depends(get_current_user)
):
    """Generate high-quality neural TTS from text."""
    text = data.get("text")
    if not text:
        raise HTTPException(status_code=422, detail="Text is required")
        
    voice = data.get("voice", "en-US-AriaNeural")
    
    # Auto-detect Chinese characters and switch to XiaoxiaoNeural
    import re
    if re.search(r'[\u4e00-\u9fa5]', text) and voice == "en-US-AriaNeural":
        voice = "zh-CN-XiaoxiaoNeural"
        
    async def generate():
        communicate = edge_tts.Communicate(text, voice)
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                yield chunk["data"]

    return StreamingResponse(generate(), media_type="audio/mpeg")

@app.post("/v1/translate")
async def translate_text(
    data: Dict[str, str],
    user_id: str = Depends(get_current_user)
):
    """Translate English text to Chinese for AI bubbles."""
    text = data.get("text")
    if not text:
        raise HTTPException(status_code=422, detail="Text is required")
    
    try:
        client = get_llm_client("glm-4-flash")
        system_prompt = "你是翻译助手，将用户输入的英文翻译成简洁的中文，只返回译文，不要解释"
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": text}
        ]
        
        translation = await client.chat(messages)
        return {"translation": translation}
    except Exception as e:
        print(f"Translation Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/v1/dashboard/stats")
async def get_dashboard_stats(user_id: str = Depends(get_current_user)):
    """Get aggregated statistics for the user dashboard."""
    stats = await db_service.get_user_stats(user_id)
    return stats

@app.get("/v1/stats/streak")
async def get_streak(user_id: str = Depends(get_current_user)):
    """Fetch user learning streak."""
    print(f"DEBUG - JWT user_id: {user_id}")
    result = await db_service.get_learning_streak(user_id)
    return result

@app.get("/v1/dashboard/sessions")
async def get_dashboard_sessions(user_id: str = Depends(get_current_user)):
    """Get the most recent learning sessions for the user."""
    sessions = await db_service.get_recent_sessions(user_id)
    return sessions

@app.post("/v1/session/end")
async def end_session(
    data: Dict[str, Any],
    user_id: str = Depends(get_current_user)
):
    """End a learning session and return a dynamic score based on corrections."""
    session_id = data.get("session_id")
    if not session_id:
        raise HTTPException(status_code=422, detail="session_id is required")
    
    # Task A-2: Get corrections and calculate score
    corrections = await db_service.get_session_corrections(session_id)
    correction_count = len(corrections)
    total_score = max(0, 100 - correction_count * 10)
    
    await db_service.end_session(session_id, total_score)
    
    return {
        "success": True, 
        "session_id": session_id,
        "total_score": total_score,
        "corrections": corrections
    }

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
async def get_word_bank(
    due_only: bool = False,
    due_tomorrow: bool = False,
    user_id: str = Depends(get_current_user)
):
    """Fetch the user's word bank from Supabase, optionally filtered by due date."""
    if due_only and due_tomorrow:
        raise HTTPException(status_code=400, detail="due_only and due_tomorrow cannot be both True")
    if not db_service.is_available():
        return [
            {"word": "aesthetic", "mastery_level": 1, "next_review": (datetime.now() + timedelta(days=1)).isoformat()},
            {"word": "phenomenon", "mastery_level": 0, "next_review": datetime.now().isoformat()},
            {"word": "integration", "mastery_level": 2, "next_review": (datetime.now() + timedelta(days=3)).isoformat()},
        ]
    
    try:
        data = await db_service.get_word_bank(user_id, due_only=due_only, due_tomorrow=due_tomorrow)
        return data
    except Exception as e:
        print(f"Error fetching word bank: {e}")
        return []

@app.post("/v1/word-bank/add")
async def add_to_word_bank(
    word: str = Form(...),
    example_sentence: str = Form(...),
    translation: str = Form(""),
    user_id: str = Depends(get_current_user)
):
    """Stub for adding a word to the bank. Phase 1 implementation."""
    if not db_service.is_available():
        return {"status": "success", "message": "Word saved (local mode)", "word": word}
    try:
        data = {
            "user_id": user_id,
            "word": word,
            "translation": translation,
            "example_sentence": example_sentence,
            "status": "new",
            "created_at": datetime.now().isoformat()
        }
        db_service.client.table("word_bank").insert(data).execute()
        return {"status": "success", "word": word}
    except Exception as e:
        print(f"Error adding word: {e}")
        return {"status": "error", "message": str(e)}

@app.delete("/v1/word-bank/{word_id}")
async def delete_from_word_bank(
    word_id: str,
    user_id: str = Depends(get_current_user)
):
    if not db_service.is_available():
        return {"status": "deleted", "word": word_id}
    try:
        result = db_service.client.table("word_bank")\
            .delete()\
            .eq("user_id", user_id)\
            .eq("word", word_id)\
            .execute()
        return {"status": "deleted", "word": word_id}
    except Exception as e:
        print(f"Error deleting word: {e}")
        raise HTTPException(status_code=404, detail=str(e))

@app.post("/v1/word-bank/review")
async def review_word(
    data: Dict[str, Any],
    user_id: str = Depends(get_current_user)
):
    """Refined SM-2 review endpoint."""
    word_id = data.get("word_id")
    quality = data.get("quality")
    
    if word_id is None or quality is None:
        raise HTTPException(status_code=422, detail="word_id and quality are required")
        
    if not db_service.is_available():
        return {"next_review": (datetime.now() + timedelta(days=1)).date().isoformat(), "interval": 1, "mastery_level": 1}

    try:
        record = await db_service.get_word_record(user_id, word_id)
        if not record:
            raise HTTPException(status_code=404, detail="Word not found in bank")

        sm2_result = scheduler.get_next_review(
            quality=int(quality),
            ease=record.get("ease", 2.5) or 2.5,
            interval=record.get("interval", 0) or 0,
            repetitions=record.get("repetitions", 0) or 0
        )
        
        await db_service.update_word_sm2(user_id, word_id, sm2_result)
        
        return {
            "next_review": sm2_result["next_review"],
            "interval": sm2_result["interval"],
            "mastery_level": sm2_result["mastery_level"],
            "status": sm2_result["status"]
        }
    except Exception as e:
        print(f"Error in review_word: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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
        record = await db_service.get_word_record(uid, word_id)
        
        quality_map = {"mastered": 5, "reviewing": 3, "new": 1}
        quality = quality_map.get(status, 3) 
        
        if record:
            sm2_result = scheduler.get_next_review(
                quality=quality,
                ease=record.get("ease", 2.5) or 2.5,
                interval=record.get("interval", 0) or 0,
                repetitions=record.get("repetitions", 0) or 0
            )
            await db_service.update_word_sm2(uid, word_id, sm2_result)
        else:
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
