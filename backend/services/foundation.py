from typing import List, Dict, Any

class FoundationService:
    """
    Service for generating basic English courses (26 letters, IPA, Greetings)
    for Level 0 / absolute beginners.
    """
    
    def __init__(self):
        self.curriculum = [
            {
                "id": "alphabet_1",
                "title": "26 个英文字母 (A-M)",
                "type": "alphabet",
                "description": "领教基础字母的发音与书写。",
                "items": ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M"],
                "tips": "注意 A /eɪ/ 和 E /i:/ 的区别。"
            },
            {
                "id": "alphabet_2",
                "title": "26 个英文字母 (N-Z)",
                "type": "alphabet",
                "description": "完成字母表的学习。",
                "items": ["N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"],
                "tips": "注意 W 的发音是 /ˈdʌbljuː/。"
            },
            {
                "id": "ipa_vowels",
                "title": "核心音标：元音",
                "type": "phonetic",
                "description": "攻克英语发音的核心——元音。",
                "items": [
                    {"symbol": "/i:/", "example": "bee"},
                    {"symbol": "/ɪ/", "example": "it"},
                    {"symbol": "/e/", "example": "egg"},
                    {"symbol": "/æ/", "example": "apple"}
                ]
            },
            {
                "id": "survival_greetings",
                "title": "生存口语：日常问候",
                "type": "conversation",
                "description": "开口说出你的第一句地道英语。",
                "dialogue": [
                    {"speaker": "A", "text": "Hello, how are you?", "translation": "你好，你好吗？"},
                    {"speaker": "B", "text": "I'm fine, thank you. And you?", "translation": "我很好，谢谢。你呢？"}
                ]
            }
        ]

    def get_lesson(self, lesson_id: str) -> Optional[Dict[str, Any]]:
        for lesson in self.curriculum:
            if lesson["id"] == lesson_id:
                return lesson
        return None

    def get_all_lessons(self) -> List[Dict[str, Any]]:
        return self.curriculum

foundation_service = FoundationService()
