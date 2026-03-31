import sys
import os

print("--- DIAGNOSTIC START ---")
sys.stdout.flush()

print(f"Python Version: {sys.version}")
print(f"Current Directory: {os.getcwd()}")
sys.stdout.flush()

try:
    import fastapi
    print("✓ fastapi imported")
except Exception as e:
    print(f"X fastapi failed: {e}")

try:
    import uvicorn
    print("✓ uvicorn imported")
except Exception as e:
    print(f"X uvicorn failed: {e}")

print("--- DIAGNOSTIC END ---")
sys.stdout.flush()
