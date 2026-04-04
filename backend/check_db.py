import asyncio
import os
from services.database import db_service

async def check_columns():
    if not db_service.is_available():
        print("DB Not available")
        return
    
    # Fetch one record
    res = db_service.client.table("word_bank").select("*").limit(1).execute()
    if res.data:
        print("Columns in word_bank:", res.data[0].keys())
    else:
        print("No records found in word_bank")

if __name__ == "__main__":
    asyncio.run(check_columns())
