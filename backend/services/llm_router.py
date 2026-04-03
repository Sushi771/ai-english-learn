import os
import litellm
import httpx
import json as json_lib
from typing import List, Dict, Any, Optional, Union, AsyncGenerator
from fastapi import HTTPException
from dotenv import load_dotenv

load_dotenv()

class BaseLLMClient:
    async def chat(self, messages: List[Dict[str, str]], **kwargs) -> Any:
        raise NotImplementedError

    async def stream_chat(self, messages: List[Dict[str, str]], **kwargs) -> AsyncGenerator[str, None]:
        """Returns an async generator of response chunks (strings)."""
        raise NotImplementedError

class ZhipuClient(BaseLLMClient):
    def __init__(self, model_id: str):
        self.model_id = model_id
        self.api_key = os.getenv("ZHIPUAI_API_KEY")

    async def chat(self, messages: List[Dict[str, str]], **kwargs) -> str:
        if not self.api_key:
            raise HTTPException(status_code=500, detail="ZHIPUAI_API_KEY not configured")
        
        # Use litellm for non-streaming
        model_name = self.model_id
        if "zai/" not in model_name.lower():
            model_name = f"zai/{model_name}"
        try:
            response = await litellm.acompletion(
                model=model_name,
                messages=messages,
                api_key=self.api_key,
                stream=False,
                **kwargs
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"ZhipuClient Error ({self.model_id}): {e}")
            raise HTTPException(status_code=500, detail=f"LLM Error: {str(e)}")

    async def stream_chat(self, messages: List[Dict[str, str]], **kwargs) -> AsyncGenerator[str, None]:
        if not self.api_key:
            raise HTTPException(status_code=500, detail="ZHIPUAI_API_KEY not configured")
            
        async for chunk in self._stream_generator(messages):
            yield chunk

    async def _stream_generator(self, messages: List[Dict[str, str]]):
        """Directly call Zhipu API for streaming using httpx."""
        url = "https://open.bigmodel.cn/api/paas/v4/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model_id,
            "messages": messages,
            "stream": True
        }
        
        try:
            print(f"[STREAM] Starting direct httpx call: model={self.model_id}, api_key_prefix={self.api_key[:8] if self.api_key else 'NONE'}...")
            async with httpx.AsyncClient(timeout=60.0) as client:
                async with client.stream("POST", url, headers=headers, json=payload) as response:
                    if response.status_code != 200:
                        error_text = await response.aread()
                        print(f"Zhipu Stream API Error: {response.status_code} - {error_text.decode()}")
                        yield f"[ERROR] API returned {response.status_code}"
                        return

                    async for line in response.aiter_lines():
                        if not line.startswith("data: "):
                            continue
                        
                        data = line[6:].strip()
                        if data == "[DONE]":
                            return
                        
                        try:
                            chunk = json_lib.loads(data)
                            delta = chunk["choices"][0]["delta"].get("content", "")
                            if delta:
                                print(f"[STREAM] chunk: {repr(delta[:20])}")
                                yield delta
                        except Exception:
                            continue
        except Exception as e:
            print(f"Zhipu Stream Generator Exception: {e}")
            yield f"[ERROR] Stream connection failed: {str(e)}"

class PlaceholderClient(BaseLLMClient):
    def __init__(self, provider: str):
        self.provider = provider

    async def chat(self, messages: List[Dict[str, str]], **kwargs) -> str:
        raise HTTPException(status_code=501, detail=f"Provider {self.provider} 暂未配置，敬请期待")

    async def stream_chat(self, messages: List[Dict[str, str]], **kwargs) -> AsyncGenerator[str, None]:
        raise HTTPException(status_code=501, detail=f"Provider {self.provider} 暂未配置，敬请期待")

def get_llm_client(model_id: str) -> BaseLLMClient:
    """
    Factory to get the appropriate LLM client based on model_id.
    """
    zhipu_models = ["glm-4-flash", "glm-4.5-air", "glm-4v-plus-0111"]
    
    # Extract provider for checking
    lower_id = model_id.lower()
    
    if any(m in lower_id for m in zhipu_models):
        # Even if it contains zai/ or other prefixes, as long as it matches one of our known IDs
        base_id = next(m for m in zhipu_models if m in lower_id)
        return ZhipuClient(base_id)
    
    if "gpt" in lower_id or "openai" in lower_id:
        return PlaceholderClient("OpenAI")
    if "deepseek" in lower_id:
        return PlaceholderClient("DeepSeek")
    if "gemini" in lower_id:
        return PlaceholderClient("Gemini")
        
    # Default to flash if unknown? Or raise error? 
    # Requirement says support specific 3 models and placeholder for others.
    return PlaceholderClient("Other")
