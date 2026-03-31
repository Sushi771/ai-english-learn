import asyncio
from services.llm import gateway

async def smoke_test():
    test_messages = [
        {"role": "system", "content": "You are an English teacher."},
        {"role": "user", "content": "Hello, can you help me with a simple sentence?"}
    ]
    
    models = [
        "zhipuai/glm-4"
    ]
    
    for model in models:
        print(f"Testing model: {model}...")
        try:
            response = await gateway.get_chat_response(test_messages, model=model)
            print(f"Response from {model}: {response[:100]}...")
            print("-" * 20)
        except Exception as e:
            print(f"Failed to test {model}: {e}")

if __name__ == "__main__":
    asyncio.run(smoke_test())
