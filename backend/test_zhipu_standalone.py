import asyncio
import litellm
import os
from dotenv import load_dotenv

load_dotenv()

async def standalone_test():
    key = os.getenv("ZHIPUAI_API_KEY")
    print(f"Using Zhipu Key: {key[:10]}...")
    
    test_messages = [
        {"role": "system", "content": "You are an English teacher."},
        {"role": "user", "content": "Hello, can you help me with a simple sentence?"}
    ]
    
    model = "zhipuai/glm-4"
    print(f"Testing model: {model}...")
    
    try:
        response = await litellm.acompletion(
            model=model,
            messages=test_messages,
            api_key=key
        )
        print(f"Response from {model}: {response.choices[0].message.content[:200]}...")
        print("SUCCESS: Connection to Zhipu AI is working!")
    except Exception as e:
        print(f"ERROR: Failed to test {model}: {e}")

if __name__ == "__main__":
    asyncio.run(standalone_test())
