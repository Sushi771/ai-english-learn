import sys
import os
from datetime import datetime, timedelta

# Add backend to path
sys.path.append(os.getcwd())
from services.scheduler import scheduler

def test_sm2():
    # Test case 1: Initial review (repetitions=0), quality=5 (Great)
    res1 = scheduler.get_next_review(5, ease=2.5, interval=0, repetitions=0)
    print(f"Test 1 (q=5, reps=0): {res1}")
    assert res1['interval'] == 1
    assert res1['repetitions'] == 1
    assert res1['status'] == 'reviewing'

    # Test case 2: Second review (repetitions=1), quality=5
    res2 = scheduler.get_next_review(5, ease=res1['ease'], interval=res1['interval'], repetitions=res1['repetitions'])
    print(f"Test 2 (q=5, reps=1): {res2}")
    assert res2['interval'] == 6
    assert res2['repetitions'] == 2

    # Test case 3: Failure (quality=1)
    res3 = scheduler.get_next_review(1, ease=res2['ease'], interval=res2['interval'], repetitions=res2['repetitions'])
    print(f"Test 3 (q=1, failure): {res3}")
    assert res3['interval'] == 1
    assert res3['repetitions'] == 0
    assert res3['ease'] == res2['ease']  # Ease should stay same on failure
    assert res3['status'] == 'new'

    # Test case 4: Recovery from failure (repetitions=0), quality=5
    res4 = scheduler.get_next_review(5, ease=res3['ease'], interval=res3['interval'], repetitions=res3['repetitions'])
    print(f"Test 4 (q=5, recovery): {res4}")
    assert res4['interval'] == 1
    assert res4['repetitions'] == 1

    print("SM2 Tests Passed!")

if __name__ == "__main__":
    try:
        test_sm2()
    except Exception as e:
        print(f"Test Failed: {e}")
        sys.exit(1)
