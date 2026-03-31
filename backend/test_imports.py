import sys

try:
    print("Testing imports...")
    import fastapi
    print("✓ fastapi")
    import uvicorn
    print("✓ uvicorn")
    import dotenv
    print("✓ python-dotenv")
    import litellm
    print("✓ litellm")
    import azure.cognitiveservices.speech
    print("✓ azure-cognitiveservices-speech")
    
    from services.llm import gateway
    print("✓ services.llm")
    from services.speech import speech_service
    print("✓ services.speech")
    from services.scheduler import scheduler
    print("✓ services.scheduler")
    
    print("ALL IMPORTS SUCCESSFUL")
except Exception as e:
    print(f"FAILED: {e}")
    import traceback
    traceback.print_exc()
