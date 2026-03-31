import json
import random
from typing import List, Dict, Any, Optional
from .llm import gateway

class PlacementEngine:
    """
    Adaptive English Placement Engine (A1-C2).
    Includes Vocabulary, Listening, Fill-in-the-blanks, and Translation.
    """
    
    def __init__(self):
        # Sample question bank for the Placement Test
        # In a production app, these would come from a database or CEFR-SP dataset
        self.question_bank = {
            "A1": [
                {"type": "choice", "q": "I ____ a student.", "options": ["is", "am", "are", "be"], "a": "am"},
                {"type": "choice", "q": "Which is a fruit?", "options": ["Apple", "Book", "Car", "Desk"], "a": "Apple"},
                {"type": "translate", "q": "你好，我是李华。", "hint": "Hello, I am Li Hua."},
                {"type": "listening", "q": "Hear the sound and pick the word: [Apple]", "a": "Apple", "audio": "apple.mp3"}
            ],
            "A2": [
                {"type": "choice", "q": "She ____ to the gym yesterday.", "options": ["goes", "go", "went", "going"], "a": "went"},
                {"type": "fill", "q": "I am interested ____ learning English.", "a": "in"},
                {"type": "translate", "q": "我明天要去北京出差。", "hint": "I am going to Beijing for a business trip tomorrow."},
                {"type": "listening", "q": "Where did the speaker go? [I went to the park with my friends.]", "options": ["Office", "Park", "School", "Gym"], "a": "Park"}
            ],
            "B1": [
                {"type": "choice", "q": "If it ____ tomorrow, we will cancel the trip.", "options": ["rains", "rain", "will rain", "rained"], "a": "rains"},
                {"type": "fill", "q": "You should take advantage ____ this opportunity.", "a": "of"},
                {"type": "translate", "q": "虽然这项任务很困难，但我还是完成了它。", "hint": "Although this task was difficult, I still completed it."},
                {"type": "listening", "q": "What is the speaker's main concern? [The project timeline is quite tight.]", "options": ["Money", "Time", "Quality", "Personnel"], "a": "Time"}
            ],
            "B2": [
                {"type": "choice", "q": "Hardly ____ the room when the phone rang.", "options": ["had I entered", "I had entered", "I entered", "was I entering"], "a": "had I entered"},
                {"type": "fill", "q": "I was completely taken ____ by his sudden proposal.", "a": "aback"},
                {"type": "translate", "q": "我们需要制定一个全面的策略来应对这次市场挑战。", "hint": "We need to develop a comprehensive strategy to address this market challenge."}
            ]
        }

    async def get_test_questions(self, initial_level: str = "A1") -> List[Dict[str, Any]]:
        """
        Select 2 questions from each level (A1-B2) to form an 8-question set.
        Filtered: listening questions are removed for MVP phase.
        """
        test_packet = []
        for level in ["A1", "A2", "B1", "B2"]:
            level_pool = [q for q in self.question_bank.get(level, []) if q.get("type") != "listening"]
            if level_pool:
                sampled = random.sample(level_pool, min(2, len(level_pool)))
                for q in sampled:
                    q["level"] = level
                test_packet.extend(sampled)
        return test_packet

    async def evaluate_test(self, submissions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Evaluate the test and determine the CEFR level.
        submissions: list of { "level": "A1", "type": "choice", "user_answer": "...", "correct_answer": "..." }
        """
        points = 0
        total = 0
        level_scores = {"A1": 0, "A2": 0, "B1": 0, "B2": 0}
        level_totals = {"A1": 0, "A2": 0, "B1": 0, "B2": 0}

        ai_eval_prompts = []

        for sub in submissions:
            level = sub.get("level", "A1")
            q_type = sub.get("type", "choice")
            user_a = sub.get("user_answer", "").strip().lower()
            correct_a = sub.get("correct_answer", "").strip().lower()

            level_totals[level] += 1
            if q_type in ["choice", "fill", "listening"]:
                if user_a == correct_a:
                    level_scores[level] += 1
                    points += 1
            elif q_type == "translate":
                # Translation needs AI judgement
                ai_eval_prompts.append({
                    "level": level,
                    "target": sub.get("q"),
                    "user": sub.get("user_answer"),
                    "reference": sub.get("hint")
                })
        
        # Batch Evaluate Translation via AI
        if ai_eval_prompts:
            eval_result = await self._evaluate_translations_with_ai(ai_eval_prompts)
            for res in eval_result:
                level_scores[res["level"]] += res["score"] # score is 0 to 1

        # Determine Final Level
        # Logic: If accuracy > 70% at a level, they pass that level.
        final_level = "Level 0"
        if (level_scores["A1"] / max(1, level_totals["A1"])) > 0.7:
            final_level = "A1"
            if (level_scores["A2"] / max(1, level_totals["A2"])) > 0.7:
                final_level = "A2"
                if (level_scores["B1"] / max(1, level_totals["B1"])) > 0.6:
                    final_level = "B1"
                    if (level_scores["B2"] / max(1, level_totals["B2"])) > 0.6:
                        final_level = "B2+"

        return {
            "level": final_level,
            "scores": level_scores,
            "description": self._get_level_description(final_level)
        }

    async def _evaluate_translations_with_ai(self, items: List[Dict[str, str]]) -> List[Dict[str, Any]]:
        """Use LLM to grade translation accuracy."""
        prompt = "Assess the following Chinese-to-English translations. Return a JSON list with 'score' (0.0 to 1.0) and 'feedback' for each. 1.0 means perfect native expression, 0.5 means basic meaning conveyed but ungrammatical.\n\n"
        for i, item in enumerate(items):
            prompt += f"Item {i}:\nCN: {item['target']}\nUser: {item['user']}\nRef: {item['reference']}\n\n"
        
        try:
            messages = [{"role": "system", "content": "You are a professional English examiner."}, {"role": "user", "content": prompt}]
            response = await gateway.get_chat_response(messages, role="linguistic_master")
            
            # Rough cleanup for JSON
            clean_json = response
            if "```json" in response: clean_json = response.split("```json")[1].split("```")[0].strip()
            data = json.loads(clean_json)
            
            for i, result in enumerate(data):
                result["level"] = items[i]["level"]
            return data
        except:
            # Fallback if AI fails: simple fuzzy match or 0
            return [{"level": item["level"], "score": 0.5 if len(item['user']) > 5 else 0} for item in items]

    def _get_level_description(self, level: str) -> str:
        descriptions = {
            "Level 0": "零基础：建议从基础课开始学习。",
            "A1": "初级 (A1)：能进行最基础的日常沟通。",
            "A2": "入门 (A2)：能处理简单的生活任务和描述。",
            "B1": "提高 (B1)：能在大多数旅行和日常情境中自如表达。",
            "B2+": "进阶 (B2+)：能进行深入的讨论 and 复杂的交际。"
        }
        return descriptions.get(level, descriptions["Level 0"])

placement_engine = PlacementEngine()
