from datetime import datetime, timedelta
from math import ceil
from typing import Dict, Any

class SM2Scheduler:
    def __init__(self):
        pass

    def get_next_review(self, quality: int, ease: float = 2.5, interval: int = 0, repetitions: int = 0) -> Dict[str, Any]:
        """
        Implementation of the SM2 algorithm.
        quality: 0-5 (0: total failure, 5: perfect response)
        ease: Float (starts at 2.5)
        interval: Days between reviews
        repetitions: Number of times reviewed successfully
        """
        # Minimum ease floor at 1.3
        if ease < 1.3:
            ease = 1.3

        if quality >= 3:
            # Success logic
            if repetitions == 0:
                next_interval = 1
            elif repetitions == 1:
                next_interval = 6
            else:
                next_interval = ceil(interval * ease)
            
            next_repetitions = repetitions + 1
        else:
            # Failure logic: reset repetitions, interval stays small
            next_repetitions = 0
            next_interval = 1
        
        # Calculate new ease factor
        # next_ease = ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
        ease_change = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
        next_ease = max(1.3, ease + ease_change)
            
        next_review_date = datetime.now() + timedelta(days=next_interval)
        
        return {
            "ease": next_ease,
            "interval": next_interval,
            "repetitions": next_repetitions,
            "next_review": next_review_date
        }

scheduler = SM2Scheduler()
