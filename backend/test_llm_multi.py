import asyncio
import os
from services.llm import gateway
from services.review import review_service
from services.database import db_service
from dotenv import load_dotenv

load_dotenv()

async def test_connectivity():
    print("Testing Multi-LLM Connectivity...")
    
    # 1. Test Qwen (Alibaba Bailian)
    print("\n[Testing Qwen-Plus (Bailian)]")
    try:
        resp = await gateway.get_chat_response([{"role": "user", "content": "Say hello from Qwen."}], model="dashscope/qwen-plus")
        print(f"Bailian Response: {resp}")
    except Exception as e:
        print(f"Bailian Failed: {e}")

    # 2. Test Claude
    print("\n[Testing Claude-3.5-Sonnet]")
    try:
        resp = await gateway.get_chat_response([{"role": "user", "content": "Say hello from Claude."}], model="anthropic/claude-3-5-sonnet-20240620")
        print(f"Claude Response: {resp}")
    except Exception as e:
        print(f"Claude Failed: {e}")

    # 3. Test Proactive Review Injection
    print("\n[Testing Proactive Review Injection]")
    user_id = "test_user_id"
    # Note: This requires the DB to be set up. If DB not available, it should return mock or empty.
    review_words = ["aesthetic", "phenomenon"]
    messages = [
        {"role": "system", "content": "Base prompt"},
        {"role": "user", "content": "How's the weather?"}
    ]
    resp = await gateway.get_chat_response(messages, role="fast_streamer", review_words=review_words)
    print(f"AI Response with Injection: {resp}")
    if any(word in resp.lower() for word in review_words):
        print("Success: Review words found in response.")
    else:
        print("Note: Review words requested but not explicitly in response (this can happen depending on AI logic).")

if __name__ == "__main__":
    asyncio.run(test_connectivity())
