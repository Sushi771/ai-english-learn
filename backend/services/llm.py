import os
from typing import List, Dict, Any, Optional, Union, AsyncGenerator
from .llm_router import get_llm_client

class ModelGateway:
    def __init__(self):
        # Default model
        self.default_model = os.getenv("DEFAULT_MODEL", "glm-4-flash")
        self.fast_streamer = self.default_model
        self.linguistic_master = self.default_model
        self.memory_guardian = self.default_model
        
    def _get_system_prompt(self, role: str, scenario: str = "General", level: str = "A1") -> str:
        level_hints = {
            "Level 0": "使用最简单的英语单词，必须附带中文翻译，语速极慢，多用问候语。",
            "A1": "初级水平。语速缓慢，用词简单。在回复末尾附带关键单词的中文对照。",
            "A2": "入门水平。可以使用基础对话，偶尔引入一个新单词并解释。",
            "B1": "提高水平。可以进行完整的日常话题讨论。鼓励用户说长难句。",
            "B2+": "高阶水平。使用地道的俚语和职场词汇。进行深度辩论或复杂协作需求。"
        }
        hint = level_hints.get(level, level_hints["A1"])
        
        base_prompts = {
            "fast_streamer": f"你是一位专业英语外教。场景：{scenario}。难度：{level} ({hint})。1. 始终用英语回复，除非用户完全听不懂。2. 只回复外教的部分，严禁模拟、代答或预设学生的对话内容。3. 保持鼓励性，适时引导用户开口。4. 必须确保单词之间有正常的空格，标点后面跟空格，严禁将单词连在一起。",
            "linguistic_master": f"你是一位资深英语专家。请分析用户的输入，提供针对 {level} 水平的改进建议。重点纠正语法并推荐更地道的表达。",
            "memory_guardian": "你是一位学习分析师。分析用户的对话历史，总结其能力提升情况。"
        }
        return base_prompts.get(role, base_prompts["fast_streamer"])

    async def get_chat_response(
        self, 
        messages: List[Dict[str, str]], 
        model: Optional[str] = None, 
        role: str = "fast_streamer",
        scenario: str = "General",
        level: str = "A1",
        review_words: List[str] = None,
        stream: bool = False,
        api_key: Optional[str] = None, 
        provider: Optional[str] = None
    ) -> Union[str, AsyncGenerator[str, None]]:
        # Determine target model: priority for 'model' param, then role defaults
        target_model = model or getattr(self, role, self.default_model)
        
        print(f"[DEBUG] Gateway (Router) Request: model={target_model}, role={role}, level={level}")

        try:
            system_prompt = self._get_system_prompt(role, scenario, level)
            if review_words:
                system_prompt += f"\n\n### 重点练习单词: {', '.join(review_words)}"
            
            # Insert or replace system prompt
            new_messages = [{"role": "system", "content": system_prompt}] + [m for m in messages if m["role"] != "system"]

            # Use the new centralized router
            client = get_llm_client(target_model)
            if stream:
                return client.stream_chat(new_messages)
            else:
                return await client.chat(new_messages)
            
        except Exception as e:
            print(f"ModelGateway (Router) Error: {e}")
            # Fallback to flash only if it wasn't already flash
            if "glm-4-flash" not in target_model:
                return await self.get_chat_response(messages, model="glm-4-flash", level=level, role=role)
            raise e

    async def get_transcription(self, audio_file_path: str, api_key: Optional[str] = None) -> str:
        """Centralized STT using Zhipu."""
        import httpx
        try:
            active_key = api_key or self.default_keys["zhipu"]
            if not active_key: return "API key missing"

            url = "https://open.bigmodel.cn/api/paas/v4/audio/transcriptions"
            headers = {"Authorization": f"Bearer {active_key}"}
            async with httpx.AsyncClient(timeout=30.0) as client:
                with open(audio_file_path, "rb") as f:
                    files = {"file": (os.path.basename(audio_file_path), f, "audio/mpeg")}
                    data = {"model": "glm-asr-2512"}
                    response = await client.post(url, headers=headers, files=files, data=data)
                    if response.status_code == 200:
                        return response.json().get("text", "")
            return None
        except Exception as e:
            print(f"STT Error: {e}")
            return None

gateway = ModelGateway()
