"""
Stats API routes — GET /v1/stats/summary
Returns aggregated learning statistics for the authenticated user.
"""

from datetime import date, datetime, timedelta
from typing import Dict, Any

from fastapi import APIRouter, Depends

from services.auth_service import get_current_user
from services.database import db_service

router = APIRouter(prefix="/v1/stats", tags=["stats"])


@router.get("/summary")
async def get_stats_summary(user_id: str = Depends(get_current_user)) -> Dict[str, Any]:
    """
    Aggregated learning statistics:
    - total_sessions: completed session count
    - vocab_mastery_rate: ratio of mastered words (mastery_level >= 3) to total words
    - review_history: per-day count of words whose next_review falls within the past 14 days
    """
    if not db_service.is_available():
        today = date.today()
        return {
            "total_sessions": 0,
            "vocab_mastery_rate": 0,
            "review_history": [
                {"date": (today - timedelta(days=13 - i)).isoformat(), "count": 0}
                for i in range(14)
            ],
        }

    try:
        # --- total_sessions: completed sessions ---
        sessions_res = (
            db_service.client.table("sessions")
            .select("id", count="exact")
            .eq("user_id", user_id)
            .eq("status", "completed")
            .execute()
        )
        total_sessions = sessions_res.count or 0

        # --- vocab_mastery_rate ---
        all_words_res = (
            db_service.client.table("word_bank")
            .select("id", count="exact")
            .eq("user_id", user_id)
            .execute()
        )
        total_words = all_words_res.count or 0

        if total_words == 0:
            vocab_mastery_rate = 0.0
        else:
            mastered_res = (
                db_service.client.table("word_bank")
                .select("id", count="exact")
                .eq("user_id", user_id)
                .gte("mastery_level", 3)
                .execute()
            )
            mastered_count = mastered_res.count or 0
            vocab_mastery_rate = round(mastered_count / total_words, 2)

        # --- review_history: past 14 days ---
        today = date.today()
        start_date = today - timedelta(days=13)  # 14 days including today

        # Fetch all word_bank rows with next_review in the 14-day window
        window_start = datetime.combine(start_date, datetime.min.time()).isoformat()
        window_end = datetime.combine(today, datetime.max.time()).isoformat()

        review_res = (
            db_service.client.table("word_bank")
            .select("next_review")
            .eq("user_id", user_id)
            .gte("next_review", window_start)
            .lte("next_review", window_end)
            .execute()
        )

        # Count per day
        day_counts: Dict[str, int] = {}
        for row in review_res.data or []:
            nr = row.get("next_review")
            if not nr:
                continue
            try:
                dt_str = nr.replace("Z", "+00:00")
                d = datetime.fromisoformat(dt_str).date().isoformat()
                day_counts[d] = day_counts.get(d, 0) + 1
            except Exception:
                continue

        # Build 14-entry list, fill missing dates with 0
        review_history = []
        for i in range(14):
            d = (start_date + timedelta(days=i)).isoformat()
            review_history.append({"date": d, "count": day_counts.get(d, 0)})

        return {
            "total_sessions": total_sessions,
            "vocab_mastery_rate": vocab_mastery_rate,
            "review_history": review_history,
        }

    except Exception as e:
        print(f"Error in get_stats_summary: {e}")
        today = date.today()
        return {
            "total_sessions": 0,
            "vocab_mastery_rate": 0,
            "review_history": [
                {"date": (today - timedelta(days=13 - i)).isoformat(), "count": 0}
                for i in range(14)
            ],
        }
