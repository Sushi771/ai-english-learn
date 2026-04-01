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

export async function sendAudio(audioBlob: Blob, scenario: string, sessionId: string = "default-session", targetText?: string) {
  const settings = getAppSettings();
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.wav");
  formData.append("session_id", sessionId);
  formData.append("scenario", scenario);
  formData.append("level", settings.level);
  
  const key = settings.provider === "openai" ? settings.openaiKey : 
              settings.provider === "gemini" ? settings.geminiKey : 
              settings.zhipuKey;
  if (key) formData.append("api_key", key);
  if (settings.provider) formData.append("provider", settings.provider);

  if (targetText) {
    formData.append("target_text", targetText);
  }

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

  return response.json();
}

/**
 * Wrapper for audio processing that matches the (audioBlob, sessionId, scenario, targetText) parameter order.
 */
export async function processAudio(audioBlob: Blob, sessionId: string, scenario: string, targetText?: string) {
  return sendAudio(audioBlob, scenario, sessionId, targetText);
}

export async function sendMessage(text: string, scenario: string, sessionId: string = "default-session") {
  const settings = getAppSettings();
  const formData = new FormData();
  formData.append("text", text);
  formData.append("session_id", sessionId);
  formData.append("scenario", scenario);
  formData.append("level", settings.level);

  const key = settings.provider === "openai" ? settings.openaiKey : 
              settings.provider === "gemini" ? settings.geminiKey : 
              settings.zhipuKey;
  if (key) formData.append("api_key", key);

  const authHeader = await getAuthHeader();
  const response = await fetch(`${API_BASE_URL}/v1/chat`, {
    method: "POST",
    headers: { ...authHeader },
    body: formData,
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

/**
 * Fetch a concise Chinese translation for a single English word.
 * Piggybacks on the existing /v1/chat endpoint with a translation prompt.
 */
export async function fetchWordTranslation(word: string, currentSessionId: string = "translate_helper"): Promise<string> {
  const formData = new FormData();
  formData.append(
    "text",
    `Translate this single English word to Chinese. Reply with ONLY the Chinese translation (1-4 characters), no punctuation, no quotes: "${word}"`
  );
  formData.append("session_id", currentSessionId);
  formData.append("scenario", "Word Translation Helper");

  try {
    const authHeader = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/v1/chat`, {
      method: "POST",
      headers: { ...authHeader },
      body: formData,
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
    const formData = new FormData();
    formData.append("query", query);
    formData.append("level", settings.level);

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
    const authHeader = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/v1/placement/evaluate`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            ...authHeader
        },
        body: JSON.stringify({ submissions }),
    });

    if (!response.ok) throw new Error("评估失败");
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
