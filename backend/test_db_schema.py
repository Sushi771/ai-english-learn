import os
import asyncio
from supabase import create_client

async def main():
    url = "https://osotmqdwnwrgwfececmm.supabase.co"
    key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zb3RtcWR3bndyZ3dmZWNlY21tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5Njk4NTgsImV4cCI6MjA5MDU0NTg1OH0.xPFNuqdzR5v-PyHXOM9fpeCaYgeZXGLLfV-JAHiRG-g"
    client = create_client(url, key)
    res = client.table("word_bank").select("*").limit(1).execute()
    if res.data:
        print(f"Keys: {res.data[0].keys()}")
    else:
        print("Empty table")

if __name__ == "__main__":
    asyncio.run(main())
