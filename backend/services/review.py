from typing import List, Dict, Any
from .database import db_service

class ReviewService:
    def __init__(self):
        self.max_injection = 3

    async def get_review_context(self, user_id: str) -> List[str]:
        """
        Fetches words that are due for review and returns them as a list of strings
        to be injected into the AI system prompt.
        """
        if not db_service.is_available():
            return []
            
        due_words = await db_service.get_due_words(user_id, limit=self.max_injection)
        return [w["word"] for w in due_words]

review_service = ReviewService()
