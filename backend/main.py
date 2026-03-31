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
from services.speech import speech_service
from services.scheduler import scheduler
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

@app.post("/v1/process-audio")
async def process_audio(
    session_id: str = Form(...),
    audio: UploadFile = File(...),
    scenario: str = Form("General Conversation"),
    target_text: Optional[str] = Form(None),
    level: str = Form("A1"),
    api_key: Optional[str] = Form(None),
    provider: Optional[str] = Form(None)
):
    """Legacy endpoint for non-streaming audio processing."""
    user_id = "test_user_id"
    # Create kwargs for easier passing later
    kwargs = {"level": level, "api_key": api_key, "provider": provider}
    active_session_id = session_id
    if active_session_id == "new":
        active_session_id = await db_service.create_session(user_id, scenario) or str(uuid.uuid4())

    content = await audio.read()
    ext = "wav"
    if content.startswith(b'\x1a\x45\xdf\xa3'): ext = "webm"
    elif content.startswith(b'RIFF'): ext = "wav"
        
    if len(content) > 25 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="语音文件过大，请保持在 25MB 以内。")

    temp_audio_path = f"temp_{uuid.uuid4()}.{ext}"
    
    try:
        with open(temp_audio_path, "wb") as buffer:
            buffer.write(content)

        # Pronunciation & Transcript
        # No more hardcoded "Hello, I am practicing my English." 
        pronunciation_result = await speech_service.assess_pronunciation(temp_audio_path, target_text or "")
        transcript = pronunciation_result.get("text") or await gateway.get_transcription(temp_audio_path)

        if not transcript:
            return {
                "transcript": "",
                "response": "Sorry, I didn't catch that. Could you please say it again or check your microphone?",
                "pronunciation": pronunciation_result,
                "session_id": active_session_id
            }

        # Log User Message
        await db_service.add_chat_log(active_session_id, "user", transcript)
        review_words = await review_service.get_review_context(user_id)

        # AI Response
        messages = [
            {"role": "user", "content": transcript}
        ]
        
        ai_response = await gateway.get_chat_response(
            messages, 
            role="fast_streamer", 
            scenario=scenario,
            level=kwargs.get("level", "A1"),
            review_words=review_words,
            api_key=kwargs.get("api_key"),
            provider=kwargs.get("provider")
        )

        await db_service.add_chat_log(active_session_id, "assistant", ai_response)
        
        # Word Bank & Scoring (background)
        asyncio.create_task(update_word_bank_background(user_id, pronunciation_result))
        # Points based on accuracy
        accuracy = pronunciation_result.get("accuracy_score", 0)
        points = 5
        if accuracy >= 90: points = 20
        elif accuracy >= 80: points = 15
        elif accuracy >= 70: points = 10
        
        asyncio.create_task(db_service.update_user_score(user_id, points=points)) 

        return {
            "transcript": transcript,
            "response": ai_response,
            "pronunciation": pronunciation_result,
            "session_id": active_session_id
        }
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_audio_path):
            os.remove(temp_audio_path)

@app.post("/v1/process-audio-stream")
async def process_audio_stream(
    session_id: str = Form(...),
    audio: UploadFile = File(...),
    scenario: str = Form("General Conversation"),
    target_text: Optional[str] = Form(None),
    level: str = Form("A1"),
    api_key: Optional[str] = Form(None),
    provider: Optional[str] = Form(None)
):
    """Premium streaming endpoint for audio processing."""
    user_id = "test_user_id"
    kwargs = {"level": level, "api_key": api_key, "provider": provider}
    active_session_id = session_id
    if active_session_id == "new":
        active_session_id = await db_service.create_session(user_id, scenario) or str(uuid.uuid4())

    content = await audio.read()
    ext = "wav"
    # Improved magic byte detection for WebM and WAV
    if content.startswith(b'\x1a\x45\xdf\xa3') or b'webm' in audio.content_type.lower(): 
        ext = "webm"
    elif content.startswith(b'RIFF'): 
        ext = "wav"

    print(f"[DEBUG] Incoming audio session: {active_session_id}, MIME: {audio.content_type}, Ext: {ext}, Size: {len(content)} bytes")

    temp_audio_path = f"temp_{uuid.uuid4()}.{ext}"
    with open(temp_audio_path, "wb") as buffer:
        buffer.write(content)

    try:
        # Assessment & Transcript
        pronunciation_result = await speech_service.assess_pronunciation(temp_audio_path, target_text or "")
        
        # If Azure fails or placeholder, get transcription from Zhipu
        transcript = pronunciation_result.get("text")
        if not transcript or transcript == "":
             print("[DEBUG] Azure failed/empty, falling back to Zhipu STT")
             transcript = await gateway.get_transcription(temp_audio_path)
        
        # Log User Message
        if not transcript:
            async def error_generator():
                yield "Sorry, I couldn't hear you clearly. Please try again or check your audio settings."
            return StreamingResponse(error_generator(), media_type="text/plain")

        await db_service.add_chat_log(active_session_id, "user", transcript)
        review_words = await review_service.get_review_context(user_id)

        async def ai_response_generator():
            messages = [
                {"role": "user", "content": transcript}
            ]
            
            initial_data = {
                "transcript": transcript,
                "pronunciation": pronunciation_result,
                "session_id": active_session_id
            }
            yield f"METADATA:{json.dumps(initial_data)}\n"

            full_response = ""
            stream = await gateway.get_chat_response(
                messages, 
                role="fast_streamer", 
                scenario=scenario,
                level=kwargs.get("level", "A1"),
                review_words=review_words,
                stream=True,
                api_key=kwargs.get("api_key"),
                provider=kwargs.get("provider")
            )

            async for chunk in stream:
                content_delta = chunk.choices[0].delta.content or ""
                if content_delta:
                    full_response += content_delta
                    yield content_delta
            
            await db_service.add_chat_log(active_session_id, "assistant", full_response)
            asyncio.create_task(update_word_bank_background(user_id, pronunciation_result))
            
            # Points based on fluency and accuracy
            accuracy = pronunciation_result.get("accuracy_score", 0)
            points = 5
            if accuracy >= 85: points = 25
            elif accuracy >= 70: points = 15
            
            asyncio.create_task(db_service.update_user_score(user_id, points=points)) 

        return StreamingResponse(ai_response_generator(), media_type="text/event-stream")

    except Exception as e:
        print(f"Streaming Error: {e}")
        if os.path.exists(temp_audio_path):
             os.remove(temp_audio_path)
        raise HTTPException(status_code=500, detail=str(e))
    # finally block already handles removal, but being explicit here
    finally:
        if os.path.exists(temp_audio_path):
            os.remove(temp_audio_path)

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
    # Background update user level in DB if possible
    # asyncio.create_task(db_service.update_user_level("test_user_id", result["level"]))
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

# Helper Functions
async def update_word_bank_background(user_id: str, pronunciation_result: dict):
    """Helper to update word bank based on pronunciation assessment scores."""
    if not pronunciation_result.get("words"):
        return
        
    for w in pronunciation_result["words"]:
        # Only track words with low scores
        if w.get("accuracy_score", 100) < 80:
            word_text = w["word"].lower().strip(".,!?")
            if not word_text: continue
            
            record = await db_service.get_word_record(user_id, word_text)
            
            # Granular SM2 Quality mapping (0-5)
            # 5: Perfect (acc > 95), 4: Great (acc > 85), 3: Pass (acc > 70), 2: Poor (acc > 50), 1: Fail, 0: Blackout
            acc = w.get("accuracy_score", 0)
            if acc > 95: quality = 5
            elif acc > 85: quality = 4
            elif acc > 70: quality = 3
            elif acc > 50: quality = 2
            elif acc > 30: quality = 1
            else: quality = 0
            
            record = await db_service.get_word_record(user_id, word_text) or {}
            ease = record.get("ease", 2.5)
            interval = record.get("interval", 0)
            repetitions = record.get("repetitions", 0)
            
            next_sched = scheduler.get_next_review(quality, ease, interval, repetitions)
            
            await db_service.upsert_word_bank(
                user_id=user_id,
                word=word_text,
                error_type=w.get("error_type", "pronunciation"),
                mastery_level=quality,
                ease=next_sched["ease"],
                interval=next_sched["interval"],
                repetitions=next_sched["repetitions"],
                next_review=next_sched["next_review"]
            )

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=True)
