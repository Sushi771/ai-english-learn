from datetime import datetime, timedelta

class SM2Scheduler:
    def __init__(self):
        pass

    def get_next_review(self, quality: int, ease: float, interval: int, repetitions: int):
        """
        Implementation of the SM2 algorithm.
        quality: 0-5 (0: total failure, 5: perfect response)
        ease: Float (starts at 2.5)
        interval: Days between reviews
        repetitions: Number of times reviewed
        """
        if quality >= 3:
            if repetitions == 0:
                next_interval = 1
            elif repetitions == 1:
                next_interval = 6
            else:
                next_interval = round(interval * ease)
            next_repetitions = repetitions + 1
        else:
            next_repetitions = 0
            next_interval = 1
        
        next_ease = ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
        if next_ease < 1.3:
            next_ease = 1.3
            
        next_review_date = datetime.now() + timedelta(days=next_interval)
        
        return {
            "ease": next_ease,
            "interval": next_interval,
            "repetitions": next_repetitions,
            "next_review": next_review_date
        }

scheduler = SM2Scheduler()
