import json
from typing import List, Dict, Any
from .llm import gateway

class ScenarioEngine:
    async def generate_scenario(self, user_id: str, weak_words: List[str], level: str = "A1") -> Dict[str, Any]:
        """Generate a custom scenario using the provided weak words and target level."""
        limited_words = weak_words[:5]
        return await self.generate_scenario_by_query(user_id, f"使用以下词汇的日常场景: {', '.join(limited_words)}", level)

    async def generate_scenario_by_query(self, user_id: str, query: str, level: str = "A1") -> Dict[str, Any]:
        """Generate a custom scenario from a user query and level."""
        
        # Level-specific instructions
        level_instructions = {
            "Level 0": "零基础：使用极简单词，提供全中英双语对照，包含字母发音提示。",
            "A1": "初级 (A1)：使用基础词汇（如 move, water, happy），句子简短，提供关键短语的中英对照。",
            "A2": "入门 (A2)：引入更多生活词汇，句子稍长，侧重于日常任务的处理。",
            "B1": "提高 (B1)：使用进阶词汇，引入一些地道表达 (+1 难度)，侧重于描述观点和计划。",
            "B2+": "进阶 (B2+)：使用学术或职场高级词汇，句子结构复杂，要求进行深入讨论。"
        }
        
        instruction = level_instructions.get(level, level_instructions["A1"])

        prompt = f"""
        基于用户的需求生成一个英语对话练习场景。
        
        ### 用户需求：
        {query}
        
        ### 难度等级：
        {level} ({instruction})
        
        ### 返回格式：
        请务必返回以下 JSON 格式：
        {{
            "title": "中文标题",
            "description": "中文场景描述",
            "setting": "英文背景设定 (符合等级难度)",
            "target_phrases": ["针对该等级的 3-5 个地道英文例句/词组"],
            "suggestions": ["给用户的 2 个建议练习点"],
            "ai_role": "AI 扮演的角色名称",
            "user_role": "用户扮演的角色名称",
            "initial_message": "AI 作为该角色的第一条开场白 (必须是英文，符合等级难度)"
        }}
        
        请直接返回 JSON，不要包含任何解释性文字。
        """
        
        messages = [
            {"role": "system", "content": f"你是一位资深的课程设计师。你专注于为【{level}】水平的英语学习者设计场景。{instruction}"},
            {"role": "user", "content": prompt}
        ]
        
        try:
            response = await gateway.get_chat_response(messages, role="linguistic_master")
            
            clean_json = response
            if "```json" in response:
                clean_json = response.split("```json")[1].split("```")[0].strip()
            elif "```" in response:
                clean_json = response.split("```")[1].split("```")[0].strip()
                
            data = json.loads(clean_json)
            data["level"] = level
            print(f"[DEBUG] Custom Scenario Generated for {level}: {data.get('title')}")
            return data
        except Exception as e:
            print(f"Scenario Engine Error: {e}")
            return {
                "title": "快速练习助手",
                "description": f"基于你的需求 '{query[:20]}...' 快速生成的练习。",
                "setting": "A simplified conversation tailored to your request.",
                "target_phrases": ["Hello, how can I help you?", "That sounds interesting."],
                "ai_role": "Assistant",
                "user_role": "Learner",
                "level": level
            }

scenario_engine = ScenarioEngine()
