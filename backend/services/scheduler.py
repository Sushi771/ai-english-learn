from datetime import datetime, timedelta
from math import ceil
from typing import Dict, Any

class SM2Scheduler:
    def __init__(self):
        pass

    def get_next_review(self, quality: int, ease: float = 2.5, interval: int = 0, repetitions: int = 0) -> Dict[str, Any]:
        """
        Implementation of the SM2 algorithm.
        quality: 0-5 (q < 3 is failure, q >= 3 is success)
        ease: Float (starts at 2.5)
        interval: Days between reviews
        repetitions: Number of times reviewed successfully
        """
        if quality >= 3:
            # Success logic
            if repetitions == 0:
                next_interval = 1
            elif repetitions == 1:
                next_interval = 6
            else:
                next_interval = round(interval * ease)
            
            next_repetitions = repetitions + 1
            # Update ease factor only on success
            ease_change = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
            next_ease = max(1.3, ease + ease_change)
        else:
            # Failure logic: reset repetitions, interval resets to 1, ease remains same
            next_repetitions = 0
            next_interval = 1
            next_ease = ease
            
        next_review_date = (datetime.now() + timedelta(days=next_interval)).date()
        
        # Determine status and mastery level
        mastery_level = min(5, next_repetitions)
        if next_repetitions >= 5:
            status = "mastered"
        elif next_repetitions > 0:
            status = "reviewing"
        else:
            status = "new"

        return {
            "ease": next_ease,
            "interval": next_interval,
            "repetitions": next_repetitions,
            "next_review": next_review_date.isoformat(),
            "mastery_level": mastery_level,
            "status": status
        }

scheduler = SM2Scheduler()
