const API_BASE_URL = "http://127.0.0.1:8080";
import { supabase } from './supabase';

/**
 * Get authentication headers from the active Supabase session.
 */
async function getAuthHeader(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    return { "Authorization": `Bearer ${session.access_token}` };
  }
  return {};
}

/**
 * Get user settings for AI providers and progression.
 */
export function getAppSettings() {
  if (typeof window === "undefined") return { level: "A1", provider: "zhipu" };
  return {
    level: localStorage.getItem("user_level") || "A1",
    provider: localStorage.getItem("active_provider") || "zhipu",
    openaiKey: localStorage.getItem("openai_api_key"),
    geminiKey: localStorage.getItem("gemini_api_key"),
    zhipuKey: localStorage.getItem("zhipu_api_key"),
  };
}

export async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/health`);
    return await response.json();
  } catch (err) {
    console.error("Health check failed", err);
    return { status: "offline" };
  }
}

export interface PronunciationWord {
  word: string;
  accuracy_score: number;
  error_type?: string;
}

export interface PronunciationResult {
  accuracy_score: number;
  fluency_score: number;
  completeness_score: number;
  prosody_score: number;
  text?: string;
  words?: PronunciationWord[];
}

/**
 * Process audio by sending it to /v1/process-audio for STT and LLM response.
 */
export async function processAudio(audioBlob: Blob, sessionId: string, scenario: string) {
  const settings = getAppSettings();
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");
  formData.append("session_id", sessionId);
  formData.append("scenario", scenario);
  formData.append("level", settings.level);
  
  const model_id = localStorage.getItem("preferred_model") || "glm-4-flash";
  formData.append("model_id", model_id);

  const authHeader = await getAuthHeader();
  const response = await fetch(`${API_BASE_URL}/v1/process-audio`, {
    method: "POST",
    headers: { ...authHeader },
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = "无法处理语音请求";
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorMessage;
    } catch { }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return {
    transcript: data.transcript,
    reply: data.reply
  };
}

export async function sendMessage(text: string, scenario: string, sessionId: string = "default-session") {
  const settings = getAppSettings();
  const model_id = localStorage.getItem("preferred_model") ?? "glm-4-flash";
  
  const payload = {
    text: text,
    session_id: sessionId,
    scenario: scenario,
    level: settings.level,
    model_id: model_id
  };

  const authHeader = await getAuthHeader();
  const response = await fetch(`${API_BASE_URL}/v1/chat`, {
    method: "POST",
    headers: { 
      ...authHeader,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("无法发送消息");
  }

  return response.json();
}

/**
 * Wrapper for chat messages that matches the (text, sessionId, scenario) parameter order.
 */
export async function sendChatMessage(text: string, sessionId: string, scenario: string) {
  return sendMessage(text, scenario, sessionId);
}

export async function sendMessageStream(
  text: string,
  scenario: string,
  sessionId: string = "default-session",
  onChunk: (chunk: string) => void,
  onDone: (fullText: string) => void,
  onError?: (err: Error) => void
): Promise<void> {
  const settings = getAppSettings();
  // Try preferred_model first, fallback to selected_model_id, then glm-4-flash
  const model_id = localStorage.getItem("preferred_model") || 
                  localStorage.getItem("selected_model_id") || 
                  "glm-4-flash";
  
  const payload = {
    text,
    session_id: sessionId,
    scenario,
    level: settings.level,
    model_id,
    stream: true
  };

  try {
    const authHeader = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/v1/chat`, {
      method: "POST",
      headers: { 
        ...authHeader,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "无法连接到 AI 服务");
    }

    if (!response.body) {
      throw new Error("响应体为空");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulated_full_text = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      
      // Keep the last incomplete line in the buffer
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine.startsWith("data: ")) continue;

        const content = trimmedLine.slice(6);
        if (content === "[START]") continue;
        if (content === "[DONE]") {
          onDone(accumulated_full_text);
          return;
        }
        if (content.startsWith("[ERROR]")) {
          throw new Error(content);
        }
        
        accumulated_full_text += content;
        onChunk(content);
      }
    }
  } catch (err) {
    if (onError) {
      onError(err as Error);
    } else {
      console.error("[API] Streaming error:", err);
    }
  }
}

/**
 * Fetch a concise Chinese translation for a single English word.
 * Piggybacks on the existing /v1/chat endpoint with a translation prompt.
 */
export async function fetchWordTranslation(word: string, currentSessionId: string = "translate_helper"): Promise<string> {
  const model_id = localStorage.getItem("preferred_model") ?? "glm-4-flash";
  const payload = {
    text: `Translate this single English word to Chinese. Reply with ONLY the Chinese translation (1-4 characters), no punctuation, no quotes: "${word}"`,
    session_id: currentSessionId,
    scenario: "Word Translation Helper",
    model_id: model_id
  };

  try {
    const authHeader = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/v1/chat`, {
      method: "POST",
      headers: { 
        ...authHeader,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) return "—";
    const data = await response.json();
    // Strip any surrounding quotes or extra whitespace or trailing periods
    return (data.response || "—").trim()
      .replace(/^["']|["']$/g, "")
      .replace(/[。\.]$/, "");
  } catch {
    return "—";
  }
}

/**
 * Add a word to the user's word bank.
 */
export async function addToWordBank(
  word: string,
  exampleSentence: string
): Promise<{ status: string; word?: string; message?: string }> {
  const formData = new FormData();
  formData.append("word", word);
  formData.append("example_sentence", exampleSentence);

  const authHeader = await getAuthHeader();
  const response = await fetch(`${API_BASE_URL}/v1/word-bank/add`, {
    method: "POST",
    headers: { ...authHeader },
    body: formData,
  });

  if (!response.ok) throw new Error("无法添加单词到词库");
  return response.json();
}

export async function getDashboardStats() {
  try {
    const authHeader = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/v1/dashboard/stats`, {
      headers: { ...authHeader }
    });
    if (!response.ok) throw new Error("Failed to fetch stats");
    const data = await response.json();
    return {
        ...data,
        level: localStorage.getItem("user_level") || data.level || "A1"
    }
  } catch {
    return {
      streak: 0,
      dailyGoalProgress: 0,
      vocabularyCount: 0,
      accuracy: 0,
      totalMinutes: 0,
      points: 0,
      level: localStorage.getItem("user_level") || "A1"
    };
  }
}

export async function getLearningStreak(): Promise<{ streak: number; total_days: number }> {
  try {
    const authHeader = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/v1/stats/streak`, {
      headers: { ...authHeader }
    });
    if (!response.ok) throw new Error("Failed to fetch streak");
    return await response.json();
  } catch (err) {
    console.error("Streak fetch error:", err);
    return { streak: 0, total_days: 0 };
  }
}

export async function generateCustomScenario() {
  const settings = getAppSettings();
  try {
    const authHeader = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/v1/scenario/generate?level=${settings.level}`, {
      headers: { ...authHeader }
    });
    if (!response.ok) throw new Error("Failed to generate scenario");
    return await response.json();
  } catch (err) {
    console.error("Scenario generation error:", err);
    throw err;
  }
}

export async function forgeScenario(query: string) {
    const settings = getAppSettings();
    const model_id = localStorage.getItem("preferred_model") ?? "glm-4-flash";
    const formData = new FormData();
    formData.append("query", query);
    formData.append("level", settings.level);
    formData.append("model_id", model_id);

    const authHeader = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/v1/scenario/forge`, {
        method: "POST",
        headers: { ...authHeader },
        body: formData,
    });

    if (!response.ok) throw new Error("无法锻造场景");
    return await response.json();
}

export async function getPlacementQuestions() {
    const response = await fetch(`${API_BASE_URL}/v1/placement/questions`);
    if (!response.ok) throw new Error("无法获取定级测试题");
    return await response.json();
}

export async function evaluatePlacement(submissions: any[]) {
    const model_id = localStorage.getItem("preferred_model") ?? "glm-4-flash";
    const authHeader = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/v1/placement/evaluate`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            ...authHeader
        },
        body: JSON.stringify({ submissions, model_id }),
    });

    if (!response.ok) {
        let detail = "评估失败";
        try {
            const errData = await response.json();
            detail = errData.detail || JSON.stringify(errData);
        } catch {}
        throw new Error(`评估失败 (HTTP ${response.status}): ${detail}`);
    }
    return await response.json();
}

export async function getFoundationCurriculum() {
    const response = await fetch(`${API_BASE_URL}/v1/foundation/curriculum`);
    if (!response.ok) throw new Error("无法获取基础课程");
    return await response.json();
}

export async function getRecentSessions() {
  try {
    const authHeader = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/v1/dashboard/sessions`, {
      headers: { ...authHeader }
    });
    if (!response.ok) throw new Error("Failed to fetch sessions");
    return await response.json();
  } catch {
    return [];
  }
}

export async function getChallengeWords() {
  try {
    const authHeader = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/v1/challenge/words`, {
      headers: { ...authHeader }
    });
    if (!response.ok) throw new Error("Failed to fetch challenge words");
    return await response.json();
  } catch {
    return [];
  }
}

export async function getWordBank() {
  const authHeader = await getAuthHeader();
  const response = await fetch(`${API_BASE_URL}/v1/word-bank`, {
    headers: { ...authHeader }
  });
  if (!response.ok) throw new Error("无法加载词库");
  return response.json();
}

export async function endSession(sessionId: string, score: number = 0) {
  const formData = new FormData();
  formData.append("session_id", sessionId);
  formData.append("score", score.toString());

  const authHeader = await getAuthHeader();
  const response = await fetch(`${API_BASE_URL}/v1/session/end`, {
    method: "POST",
    headers: { ...authHeader },
    body: formData,
  });

  if (!response.ok) {
    console.error("Failed to end session");
  }
  return response.json();
}

export async function createSession(scenario: string): Promise<string> {
  const authHeader = await getAuthHeader();
  const response = await fetch(`${API_BASE_URL}/v1/session/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader },
    body: JSON.stringify({ scenario }),
  });
  if (!response.ok) return "new";
  const data = await response.json();
  return data.session_id || "new";
}

/**
 * Word record used in flashcard review.
 */
export interface Word {
  id: string;
  word: string;
  translation: string;
  example: string;
  status: 'new' | 'reviewing' | 'mastered';
}

/**
 * Update the learning status of a word.
 */
export async function updateWordStatus(wordId: string, status: 'new' | 'reviewing' | 'mastered') {
  const authHeader = await getAuthHeader();
  const response = await fetch(`${API_BASE_URL}/v1/word-bank/${encodeURIComponent(wordId)}/status`, {
    method: "PATCH",
    headers: { 
      "Content-Type": "application/json",
      ...authHeader
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error("无法更新单词状态");
  }
  return response.json();
}
