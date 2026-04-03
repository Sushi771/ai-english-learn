import os
from supabase import create_client, Client
from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional

class DatabaseService:
    def __init__(self):
        self.url = os.getenv("SUPABASE_URL")
        self.key = os.getenv("SUPABASE_ANON_KEY")
        self.client: Optional[Client] = None
        
        if self.url and self.key:
            if "placeholder" not in self.url.lower():
                try:
                    self.client = create_client(self.url, self.key)
                    print("Supabase client initialized successfully.")
                except Exception as e:
                    print(f"Failed to initialize Supabase client: {e}")

    def is_available(self) -> bool:
        return self.client is not None

    async def create_session(self, user_id: str, topic: str) -> Optional[str]:
        print(f"[DEBUG] create_session called: user_id={user_id}, topic={topic}")
        if not self.client: return None
        data = {
            "user_id": user_id,
            "topic": topic,
            "started_at": datetime.now().isoformat(),
            "status": "active"
        }
        try:
            result = self.client.table("sessions").insert(data).execute()
            return result.data[0]["id"] if result.data else None
        except Exception as e:
            print(f"DB Error (create_session): {e}")
            return None

    async def end_session(self, session_id: str, score: int = 0):
        """Mark a session as completed and record the end time."""
        if not self.client: return
        data = {
            "ended_at": datetime.now().isoformat(),
            "status": "completed",
            "total_score": score
        }
        try:
            self.client.table("sessions").update(data).eq("id", session_id).execute()
        except Exception as e:
            print(f"DB Error (end_session): {e}")

    async def add_chat_log(self, session_id: str, role: str, content: str, audio_url: Optional[str] = None):
        if not self.client: return
        data = {
            "session_id": session_id,
            "role": role,
            "content": content,
            "audio_url": audio_url,
            "created_at": datetime.now().isoformat()
        }
        try:
            self.client.table("chat_logs").insert(data).execute()
        except Exception as e:
            print(f"DB Error (add_chat_log): {e}")

    async def upsert_word_bank(self, user_id: str, word: str, error_type: str, mastery_level: int, 
                               ease: float, interval: int, repetitions: int, next_review: datetime):
        if not self.client: return
        data = {
            "user_id": user_id,
            "word": word,
            "error_type": error_type,
            "mastery_level": mastery_level,
            "ease": ease,
            "interval": interval,
            "repetitions": repetitions,
            "next_review": next_review.isoformat(),
        }
        try:
            # Simple upsert logic using word and user_id as unique constraint
            self.client.table("word_bank").upsert(data, on_conflict="user_id,word").execute()
        except Exception as e:
            print(f"DB Error (upsert_word_bank): {e}")

    async def get_word_record(self, user_id: str, word: str) -> Optional[Dict]:
        if not self.client: return None
        try:
            # Case-insensitive or exact match? word_bank UNIQUE(user_id, word) is exact.
            result = self.client.table("word_bank").select("*").eq("user_id", user_id).eq("word", word).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"DB Error (get_word_record): {e}")
            return None

    async def get_due_words(self, user_id: str, limit: int = 5) -> List[Dict]:
        if not self.client: return []
        try:
            now = datetime.now().isoformat()
            result = self.client.table("word_bank") \
                .select("*") \
                .eq("user_id", user_id) \
                .lte("next_review", now) \
                .order("next_review", desc=False) \
                .limit(limit) \
                .execute()
            return result.data
        except Exception as e:
            print(f"DB Error (get_due_words): {e}")
            return []

    async def get_user_stats(self, user_id: str) -> Dict[str, Any]:
        """Aggregate user learning statistics."""
        if not self.client: 
            return {"streak": 0, "vocabularyCount": 0, "accuracy": 0, "dailyGoalProgress": 0, "totalMinutes": 0, "points": 0, "level": 1}
        
        try:
            # Get data from profile
            profile = await self.get_user_profile(user_id)
            
            # Vocabulary Count
            words_res = self.client.table("word_bank").select("word", count="exact").eq("user_id", user_id).execute()
            word_count = words_res.count or 0

            # Due words
            now = datetime.now().isoformat()
            due_res = self.client.table("word_bank").select("word", count="exact").eq("user_id", user_id).lte("next_review", now).execute()
            due_count = due_res.count or 0

            # Sessions
            sessions_res = self.client.table("sessions").select("started_at, ended_at, total_score").eq("user_id", user_id).order("started_at", desc=True).execute()
            sessions = sessions_res.data or []
            
            total_minutes = 0
            for s in sessions:
                if s.get("started_at") and s.get("ended_at"):
                    try:
                        start = datetime.fromisoformat(s["started_at"].replace('Z', '+00:00'))
                        end = datetime.fromisoformat(s["ended_at"].replace('Z', '+00:00'))
                        duration = (end - start).total_seconds() / 60
                        total_minutes += max(0, duration)
                    except:
                        continue
            
            # If no ended sessions yet, but they have many starts, we'll give a floor of 1 min per session
            if total_minutes == 0 and len(sessions) > 0:
                total_minutes = len(sessions)

            return {
                "streak": profile.get("learning_streak", 0),
                "vocabularyCount": word_count,
                "dueCount": due_count,
                "totalPoints": profile.get("total_score", 0),
                "level": profile.get("level", 1),
                "accuracy": 85, 
                "dailyGoalProgress": min(100, profile.get("total_score", 0) % 100), 
                "totalMinutes": round(total_minutes, 1)
            }
        except Exception as e:
            print(f"DB Error (get_user_stats): {e}")
            return {"streak": 0, "vocabularyCount": 0, "accuracy": 0, "dailyGoalProgress": 0, "totalMinutes": 0}

    async def get_user_profile(self, user_id: str) -> Dict[str, Any]:
        """Fetch user profile, creating it if it doesn't exist."""
        if not self.client: return {}
        try:
            res = self.client.table("profiles").select("*").eq("id", user_id).execute()
            if res.data:
                return res.data[0]
            
            # Create default profile
            new_profile = {
                "id": user_id,
                "name": "Learner",
                "total_score": 0,
                "learning_streak": 0,
                "level": 1,
                "badges": []
            }
            res = self.client.table("profiles").insert(new_profile).execute()
            return res.data[0] if res.data else new_profile
        except Exception as e:
            print(f"DB Error (get_user_profile): {e}")
            return {}

    async def update_user_score(self, user_id: str, points: int):
        """Update user total score and check for level ups."""
        if not self.client: return
        try:
            profile = await self.get_user_profile(user_id)
            new_score = profile.get("total_score", 0) + points
            new_level = (new_score // 500) + 1 # Level up every 500 points
            
            # Logic for streak
            today = date.today().isoformat()
            last_date = profile.get("last_practice_date")
            streak = profile.get("learning_streak", 0)
            
            if last_date != today:
                if last_date == (date.today() - timedelta(days=1)).isoformat():
                    streak += 1
                else:
                    streak = 1
            
            update_data = {
                "total_score": new_score,
                "level": new_level,
                "learning_streak": streak,
                "last_practice_date": today
            }
            self.client.table("profiles").update(update_data).eq("id", user_id).execute()
        except Exception as e:
            print(f"DB Error (update_user_score): {e}")

    async def get_recent_sessions(self, user_id: str, limit: int = 5) -> List[Dict]:
        if not self.client: return []
        try:
            result = self.client.table("sessions") \
                .select("id, topic, started_at") \
                .eq("user_id", user_id) \
                .order("started_at", desc=True) \
                .limit(limit) \
                .execute()
            return result.data or []
        except Exception as e:
            print(f"DB Error (get_recent_sessions): {e}")
            return []

    async def get_word_bank(self, user_id: str) -> List[Dict]:
        if not self.client: return []
        try:
            result = self.client.table("word_bank") \
                .select("*") \
                .eq("user_id", user_id) \
                .execute()
            return result.data or []
        except Exception as e:
            print(f"DB Error (get_word_bank): {e}")
            return []

    async def update_word_sm2(self, user_id: str, word: str, sm2_data: Dict[str, Any], status: str):
        """Update the SM-2 data and status of a word."""
        if not self.client or not word: return
        data = {
            "status": status,
            "ease": sm2_data["ease"],
            "interval": sm2_data["interval"],
            "repetitions": sm2_data["repetitions"],
            "next_review": sm2_data["next_review"].isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        try:
            self.client.table("word_bank").update(data).eq("user_id", user_id).eq("word", word).execute()
        except Exception as e:
            print(f"DB Error (update_word_sm2): {e}")

    async def get_learning_streak(self, user_id: str) -> Dict[str, int]:
        """
        Calculate current learning streak based on sessions started_at field.
        """
        if not self.client:
            return {"streak": 0, "total_days": 0}

        try:
            # Fetch dates of activity for the user
            res = self.client.table("sessions") \
                .select("started_at") \
                .eq("user_id", user_id) \
                .order("started_at", desc=True) \
                .execute()
            
            if not res.data:
                return {"streak": 0, "total_days": 0}

            # Extract distinct dates
            processed_dates = []
            for row in res.data:
                try:
                    # Handle Z and ISO formats
                    dt_str = row["started_at"].replace('Z', '+00:00')
                    processed_dates.append(datetime.fromisoformat(dt_str).date())
                except:
                    continue
            
            dates = sorted(list(set(processed_dates)), reverse=True)
            print(f"[DEBUG] dates={dates}, today={date.today()}")

            if not dates:
                return {"streak": 0, "total_days": 0}

            today = date.today()
            yesterday = today - timedelta(days=1)

            # Rule: If dates[0] is neither today nor yesterday, streak is 0
            if dates[0] != today and dates[0] != yesterday:
                return {"streak": 0, "total_days": len(dates)}

            streak = 0
            current_check = dates[0]
            
            # Start counting from the most recent date
            for d in dates:
                if d == current_check:
                    streak += 1
                    current_check -= timedelta(days=1)
                else:
                    break

            return {"streak": streak, "total_days": len(dates)}
        except Exception as e:
            print(f"DB Error (get_learning_streak): {e}")
            return {"streak": 0, "total_days": 0}

    async def update_word_status(self, user_id: str, word: str, status: str):
        """Simple update for status only."""
        if not self.client or not word: return
        data = {
            "status": status,
            "updated_at": datetime.now().isoformat()
        }
        try:
            self.client.table("word_bank").update(data).eq("user_id", user_id).eq("word", word).execute()
        except Exception as e:
            print(f"DB Error (update_word_status): {e}")

db_service = DatabaseService()
