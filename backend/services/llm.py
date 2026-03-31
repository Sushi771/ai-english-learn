import litellm
import os
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

class ModelGateway:
    def __init__(self):
        # Default model roles
        self.fast_streamer = os.getenv("DEFAULT_FAST_MODEL", "zhipuai/glm-4-flash")
        self.linguistic_master = "anthropic/claude-3-5-sonnet-20240620"
        self.memory_guardian = "gemini/gemini-1.5-pro"
        
        # Load default keys for system-level fallback
        self.default_keys = {
            "zhipu": os.getenv("ZHIPUAI_API_KEY"),
            "openai": os.getenv("OPENAI_API_KEY"),
            "gemini": os.getenv("GEMINI_API_KEY"),
            "anthropic": os.getenv("ANTHROPIC_API_KEY")
        }

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
            "fast_streamer": f"你是一位英语外教。场景：{scenario}。难度：{level} ({hint})。始终用英语回复，除非用户完全听不懂或要求中文。保持鼓励性。",
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
    ) -> Any:
        # Determine target model and provider
        target_model = model or getattr(self, role, self.fast_streamer)
        
        # Determine API Key: Priority 1: Request param, Priority 2: System Env
        active_key = api_key
        if not active_key:
            if "glm" in target_model.lower() or provider == "zhipu":
                active_key = self.default_keys["zhipu"]
            elif "gpt" in target_model.lower() or provider == "openai":
                active_key = self.default_keys["openai"]
            elif "gemini" in target_model.lower() or provider == "gemini":
                active_key = self.default_keys["gemini"]
            elif "claude" in target_model.lower() or provider == "anthropic":
                active_key = self.default_keys["anthropic"]

        # Ensure LiteLLM prefixing
        if "glm" in target_model.lower() and "zai/" not in target_model.lower():
            target_model = f"zai/{target_model.split('/')[-1]}"
        
        print(f"[DEBUG] Gateway Request: model={target_model}, level={level}, key_provided={bool(api_key)}")

        kwargs = {"api_key": active_key} if active_key else {}

        try:
            system_prompt = self._get_system_prompt(role, scenario, level)
            if review_words:
                system_prompt += f"\n\n### 重点练习单词: {', '.join(review_words)}"
            
            # Insert or replace system prompt
            new_messages = [{"role": "system", "content": system_prompt}] + [m for m in messages if m["role"] != "system"]

            if stream:
                return await litellm.acompletion(
                    model=target_model,
                    messages=new_messages,
                    stream=True,
                    **kwargs
                )
            
            response = await litellm.acompletion(
                model=target_model,
                messages=new_messages,
                **kwargs
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"ModelGateway Error: {e}")
            if "glm-4-flash" not in target_model:
                return await self.get_chat_response(messages, model="zai/glm-4-flash", level=level, role=role, api_key=api_key)
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
