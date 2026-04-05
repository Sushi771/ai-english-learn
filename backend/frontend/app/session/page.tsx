"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  Send, 
  ArrowLeft, 
  Volume2, 
  Sparkles,
  Loader2,
  Target,
  LayoutGrid,
  Star,
  X,
  ArrowUpRight,
} from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import ProtocolGuard from '../../components/ProtocolGuard';
import { processAudio, sendMessageStream, fetchWordTranslation, addToWordBank, PronunciationWord, createSession, endSession } from '@/lib/api';
import { useTTS } from '@/hooks/useTTS';
import Notification from '@/components/Notification';
import ThemeToggle from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';
import { useAudioWaveform } from '@/hooks/useAudioWaveform';
import WaveformVisualizer from '@/components/WaveformVisualizer';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Message {
  id: number;
  role: 'user' | 'ai';
  content: string;
  translation?: string;
  score?: number;
}

// ---------------------------------------------------------------------------
// WordMiniDrawer — small card that pops up below an AI bubble
// ---------------------------------------------------------------------------
interface WordMiniDrawerProps {
  word: string;
  translation: string;
  isTranslating: boolean;
  isSaved: boolean;
  isSaving: boolean;
  onSave: () => void;
  onClose: () => void;
}

function WordMiniDrawer({
  word,
  translation,
  isTranslating,
  isSaved,
  isSaving,
  onSave,
  onClose,
}: WordMiniDrawerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      className="mt-4 luminary-glass luminary-border border border-white/10 rounded-3xl shadow-2xl backdrop-blur-3xl overflow-hidden"
    >
      {/* shimmer top line */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="px-7 py-5 flex items-center justify-between gap-4">
        {/* Word + translation */}
        <div className="min-w-0">
          <p className="text-lg font-bold font-manrope text-on-background tracking-tight truncate">
            {word}
          </p>
          {isTranslating ? (
            <p className="text-sm text-on-background/40 mt-0.5 animate-pulse">翻译中…</p>
          ) : (
            <p className="text-sm text-on-background/55 mt-0.5">{translation}</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Star / save button */}
          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            onClick={onSave}
            disabled={isSaving}
            title={isSaved ? "已收录" : "收录到词库"}
            className={cn(
              "p-3 rounded-2xl transition-all border shadow-lg",
              isSaved
                ? "bg-primary border-primary text-white dark:text-on-background"
                : "bg-on-background/5 border-on-background/10 text-on-background/40 hover:text-primary hover:border-primary/30 hover:bg-primary/5"
            )}
          >
            {isSaving ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Star
                size={18}
                className={cn("transition-all", isSaved ? "fill-current" : "")}
              />
            )}
          </motion.button>

          {/* Close button */}
          <button
            onClick={onClose}
            title="关闭"
            className="p-2 rounded-xl text-on-background/30 hover:text-on-background/60 hover:bg-on-background/8 transition-all"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Helper: strip leading/trailing punctuation from a token
// ---------------------------------------------------------------------------
function normalizeWord(raw: string): string {
  return raw.replace(/^[^a-zA-Z'-]+|[^a-zA-Z'-]+$/g, "").toLowerCase();
}

// ---------------------------------------------------------------------------
// Main session component
// ---------------------------------------------------------------------------
function SessionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [rawScenario, setRawScenario] = useState('咖啡馆点餐练习');
  const [isCustom, setIsCustom] = useState(false);
  const [customData, setCustomData] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [sessionId, setSessionId] = useState('new');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const barHeights = useAudioWaveform(isRecording, mediaStream);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isHUDExpanded, setIsHUDExpanded] = useState(false);
  const [isUltraWide, setIsUltraWide] = useState(false);
  
  // Task A-4: End Session Result State
  const [sessionResult, setSessionResult] = useState<{ score: number; corrections: string[] } | null>(null);
  const [showEndModal, setShowEndModal] = useState(false);

  // ── Word-collection state ────────────────────────────────────────────────
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [wordDrawerMsgId, setWordDrawerMsgId] = useState<number | null>(null);
  const [wordTranslation, setWordTranslation] = useState<string>("—");
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSavingWord, setIsSavingWord] = useState(false);
  // savedWords: words collected in this session (displayed as solid star immediately)
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());
  // exampleContext: the full message content where the word was clicked
  const wordContextRef = useRef<string>("");
  // ────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const handleResize = () => {
      const ultraWide = window.innerWidth >= 1920;
      setIsUltraWide(ultraWide);
      if (ultraWide) setIsHUDExpanded(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // VisualViewport logic for mobile keyboard handling
    const handleViewportResize = () => {
      if (window.visualViewport && scrollRef.current) {
        // Adjust padding or height if needed, or just force scroll to bottom
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    };
    window.visualViewport?.addEventListener('resize', handleViewportResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('resize', handleViewportResize);
    };
  }, []);

  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { speak, isSpeaking } = useTTS();

  /**
   * Typewriter animation for AI messages
   * @param targetMsgId The message id to update
   * @param fullText The entire text to type out
   * @param onComplete Optional callback when done
   */
  const typewriterAnimate = (targetMsgId: number, fullText: string, onComplete?: () => void) => {
    let currentText = "";
    const words = fullText.split(" ");
    let i = 0;

    const interval = setInterval(() => {
      if (i < words.length) {
        currentText += (i === 0 ? "" : " ") + words[i];
        setMessages((prev) =>
          prev.map((m) =>
            m.id === targetMsgId ? { ...m, content: currentText } : m
          )
        );
        i++;
      } else {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, 40); // 40ms per word for smooth flow
  };

  useEffect(() => {
    const topic = searchParams.get('scenario') || searchParams.get('topic') || '咖啡馆点餐练习';
    const isCustomParam = searchParams.get('isCustom') === 'true';
    
    setRawScenario(topic);
    setIsCustom(isCustomParam);

    let initialMsg = `您好！欢迎进入【${topic}】练习。请问我们现在开始吗？`;
    let effectiveScenarioName = topic;
    
    // Attempt to load scenario metadata (for both custom and official tracks)
    const stored = sessionStorage.getItem('custom_scenario');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        // Match by title or assume current if just came from selection
        if (data.title === topic || !isCustomParam) {
          setCustomData(data);
          initialMsg = data.initial_message || initialMsg;
          setIsHUDExpanded(true);
          effectiveScenarioName = data.title || topic;
        }
      } catch (e) {
        console.error("Failed to parse scenario metadata", e);
      } finally {
        // ALWAYS remove after reading to prevent stale data in next session
        sessionStorage.removeItem('custom_scenario');
      }
    }

    setMessages([{ id: 1, role: 'ai', content: initialMsg }]);

    // 在 useEffect 初始化时：
    (async () => {
      const sid = await createSession(effectiveScenarioName);
      setSessionId(sid);
    })();
  }, [searchParams]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // ── Word-click handler ──────────────────────────────────────────────────
  const handleWordClick = useCallback(
    async (rawToken: string, msgId: number, msgContent: string) => {
      const word = normalizeWord(rawToken);
      if (!word || word.length < 2) return; // skip punctuation-only tokens

      // If clicking the same word in the same bubble — toggle off
      if (selectedWord === word && wordDrawerMsgId === msgId) {
        setWordDrawerMsgId(null);
        setSelectedWord(null);
        return;
      }

      setSelectedWord(word);
      setWordDrawerMsgId(msgId);
      wordContextRef.current = msgContent;
      setWordTranslation("—");
      setIsTranslating(true);

      const translation = await fetchWordTranslation(word, sessionId);
      setWordTranslation(translation);
      setIsTranslating(false);
    },
    [selectedWord, wordDrawerMsgId, sessionId]
  );

  const handleCloseDrawer = useCallback(() => {
    setWordDrawerMsgId(null);
    setSelectedWord(null);
  }, []);

  const handleSaveWord = useCallback(async () => {
    if (!selectedWord) return;
    setIsSavingWord(true);
    try {
      await addToWordBank(selectedWord, wordContextRef.current, wordTranslation);
      setSavedWords(prev => new Set(prev).add(selectedWord));
      setToastMessage(`"${selectedWord}" 已收录到词库 ⭐`);
      setShowToast(true);
    } catch (err) {
      console.error("Failed to save word:", err);
      setToastMessage("收录失败，请重试");
      setShowToast(true);
    } finally {
      setIsSavingWord(false);
    }
  }, [selectedWord, wordTranslation]);

  // Handle global key events (Esc to close drawer/modal)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedWord) handleCloseDrawer();
        if (showEndModal) setShowEndModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedWord, handleCloseDrawer, showEndModal]);

  // Handle click-away: close the drawer if clicking outside dialogue or the drawer itself
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (selectedWord && !target.closest('.ai-message-bubble') && !target.closest('.word-mini-drawer')) {
        handleCloseDrawer();
      }
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [selectedWord, handleCloseDrawer]);
  // ────────────────────────────────────────────────────────────────────────

  const startRecording = async () => {
    if (!window.isSecureContext) {
      alert("⚠️ 录音功能需要安全上下文。");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        sendAudioData(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setMediaStream(stream);
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
      setMediaStream(null);
    }
  };

  const sendAudioData = async (audioBlob: Blob) => {
    const tempUserMsgId = Date.now();
    setMessages(prev => [...prev, { id: tempUserMsgId, role: 'user', content: '正在识别...' }]);
    setIsProcessing(true);

    try {
      const result = await processAudio(
        audioBlob, 
        sessionId, 
        customData?.title || rawScenario,
        customData?.target_phrases
      );
      
      setMessages(prev => prev.map(m => 
        m.id === tempUserMsgId 
          ? { ...m, content: result.transcript, score: undefined } 
          : m
      ));
      
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', content: result.reply }]);
      speak(result.reply);

    } catch (err) {
      setMessages(prev => prev.map(m => 
        m.id === tempUserMsgId ? { ...m, content: "处理失败，请重试。" } : m
      ));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSend = async () => {
    if (!userInput.trim() || isProcessing) return;
    const textToSend = userInput.trim();
    setUserInput('');
    setIsProcessing(true);

    const userMsg: Message = { id: Date.now(), role: 'user', content: textToSend };
    const aiMsgId = Date.now() + 1;
    const placeholderMsg: Message = { id: aiMsgId, role: 'ai', content: '' };
    
    setMessages(prev => [...prev, userMsg, placeholderMsg]);

    try {
      await sendMessageStream(
        textToSend,
        customData?.title || rawScenario,
        sessionId,
        (chunk) => {
          // Real-time incremental update
          setMessages(prev => prev.map(m => 
            m.id === aiMsgId ? { ...m, content: m.content + chunk } : m
          ));
        },
        (fullText) => {
          // Success: finalize processing and start audio
          setMessages(prev => prev.map(m => 
            m.id === aiMsgId ? { ...m, content: fullText } : m
          ));
          speak(fullText);
          setIsProcessing(false);
        },
        async (err) => {
          console.error("Streaming chat failed, falling back to legacy:", err);
          setIsProcessing(false);
        },
        customData?.target_phrases
      );
    } catch (err) {
      console.error("Text chat wrapper error:", err);
      setIsProcessing(false);
    }
  };
  
  const handleEndSession = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const res: any = await endSession(sessionId);
      if (res.success) {
        setSessionResult({
          score: res.total_score,
          corrections: res.corrections || []
        });
        setShowEndModal(true);
      } else {
        setToastMessage("结束对话失败，请重试");
        setShowToast(true);
      }
    } catch (err) {
      console.error("Failed to end session:", err);
      setToastMessage("结束对话失败，请重试");
      setShowToast(true);
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Render AI bubble content with clickable words ───────────────────────
  const renderAIContent = (msg: Message, isLast: boolean) => (
    <div className="text-xl md:text-2xl font-semibold leading-[1.75] tracking-tight text-on-background select-none">
      {msg.content.split(/(\s+)/).filter(t => t.length > 0).map((token, i) => {
        const trimmed = token.trim();
        // If it is just whitespace, render it directly as text to keep it simple
        if (!trimmed) return <span key={`gap-${msg.id}-${i}`}>{token}</span>;
        
        const word = normalizeWord(trimmed);
        const isActive = selectedWord === word && wordDrawerMsgId === msg.id;
        return (
          <span
            key={`word-${msg.id}-${i}`}
            onClick={(e) => {
              e.stopPropagation();
              handleWordClick(trimmed, msg.id, msg.content);
            }}
            title="点击查词"
            className={cn(
              "cursor-pointer rounded-md px-0.5 transition-all duration-150 inline-block",
              isActive
                ? "bg-primary/20 text-primary"
                : "hover:bg-primary/10 hover:text-primary"
            )}
          >
            {token}
          </span>
        );
      })}
      
      {/* Typing Cursor */}
      {isLast && isProcessing && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          className="inline-block w-1.5 h-6 ml-1 bg-primary/60 align-middle rounded-full"
        />
      )}
    </div>
  );
  // ────────────────────────────────────────────────────────────────────────

  return (
    <ProtocolGuard>
      <div className="flex flex-col min-h-screen bg-[var(--background)] text-[var(--on-background)] font-inter relative transition-colors duration-500">
        <Notification isVisible={showToast} message={toastMessage} onClose={() => setShowToast(false)} />

        {/* End Session Modal */}
        <AnimatePresence>
          {showEndModal && sessionResult && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 md:p-12">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-xl"
                onClick={() => setShowEndModal(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className="relative w-full max-w-2xl luminary-glass luminary-border p-10 md:p-14 rounded-[3.5rem] bg-surface-container/60 shadow-[0_40px_120px_rgba(0,0,0,0.5)] overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                
                <div className="text-center mb-12">
                  <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-primary/20 shadow-inner">
                    <Star size={48} className="text-primary fill-primary/30 animate-pulse" />
                  </div>
                  <h3 className="text-4xl font-black font-manrope tracking-tighter text-on-background uppercase">对话评估就绪</h3>
                  <p className="text-[10px] font-black tracking-[0.3em] text-on-background/30 uppercase mt-2">Analytical Insight Complete</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                  <div className="p-8 luminary-glass luminary-border rounded-3xl text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-on-background/40 mb-2">综合同步得分</p>
                    <div className="text-6xl font-black font-manrope text-primary tracking-tighter italic">
                      {sessionResult.score}
                    </div>
                  </div>
                  <div className="p-8 luminary-glass luminary-border rounded-3xl text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-on-background/40 mb-2">语境纠错点</p>
                    <div className="text-6xl font-black font-manrope text-rose-400 tracking-tighter italic">
                      {sessionResult.corrections.length}
                    </div>
                  </div>
                </div>

                {sessionResult.corrections.length > 0 && (
                  <div className="mb-12 space-y-4 max-h-48 overflow-y-auto pr-4 custom-scrollbar">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">建议改进方向 | Recommendations</h4>
                    <div className="space-y-3">
                      {sessionResult.corrections.map((corr, idx) => (
                        <div key={idx} className="p-5 rounded-2xl bg-white/5 border border-white/5 flex items-start gap-4">
                          <Sparkles size={16} className="text-primary mt-1 shrink-0" />
                          <p className="text-sm font-medium text-on-background/80 leading-relaxed italic">{corr}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col md:flex-row gap-4 pt-4">
                  <button
                    onClick={() => router.push('/')}
                    className="flex-1 bg-primary text-white dark:text-on-background py-6 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    存入档案并返回控制台
                  </button>
                  <button
                    onClick={() => setShowEndModal(false)}
                    className="flex-1 bg-white/5 py-6 rounded-2xl text-on-background/60 font-black uppercase tracking-[0.2em] text-xs hover:bg-white/10 transition-all"
                  >
                    查看对话记录
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Ambient background */}
        <div className="fixed inset-0 pointer-events-none opacity-40">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 blur-[100px] rounded-full animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-secondary/5 blur-[120px] rounded-full animate-pulse [animation-delay:2s]" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 contrast-150 brightness-50 mix-blend-overlay" />
        </div>

        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 h-14 px-6 md:px-12 backdrop-blur-3xl border-b luminary-border bg-[var(--background)]/50 flex items-center">
          <div className="max-w-[1920px] mx-auto flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button
                onClick={() => router.back()}
                className="p-3 rounded-2xl luminary-glass luminary-border text-[var(--outline)] hover:text-[var(--primary)] transition-all"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex flex-col">
                <h2 className="display-lg text-lg md:text-xl font-bold uppercase tracking-tight text-[var(--on-background)] truncate max-w-[150px] md:max-w-none">
                  {rawScenario}
                </h2>
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border",
                    isCustom
                      ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                      : "bg-primary/10 border-primary/20 text-primary/60"
                  )}>
                    {isCustom ? "Neural Forge" : "Official Scenario"}
                  </span>
                  <div className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    双向链路就绪
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <ThemeToggle />
              <button
                onClick={handleEndSession}
                disabled={isProcessing}
                className="px-6 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 font-black uppercase tracking-widest text-xs hover:bg-rose-500 hover:text-white transition-all disabled:opacity-50"
              >
                结束
              </button>
              <button
                onClick={() => setIsHUDExpanded(!isHUDExpanded)}
                className="p-3 rounded-2xl luminary-glass luminary-border text-[var(--on-background)] shadow-2xl hover:scale-110 transition-all"
              >
                {isHUDExpanded ? <LayoutGrid size={22} className="text-[var(--primary)]" /> : <LayoutGrid size={22} />}
              </button>
            </div>
          </div>
        </header>

        {/* Main chat area */}
        <div className="flex-1 flex pt-24 pb-40">
          <main
            ref={scrollRef}
            className={cn(
              "flex-1 overflow-y-auto scroll-smooth custom-scrollbar relative z-10 transition-all duration-700",
              isUltraWide && isHUDExpanded ? "flex-[1.5] px-12" : "flex-1 px-6 lg:px-12 flex justify-center"
            )}
          >
            <div className={cn(
              "w-full space-y-16 transition-all",
              isUltraWide && isHUDExpanded ? "max-w-4xl ml-auto mr-12" : "max-w-4xl mx-auto"
            )}>
              <AnimatePresence mode="popLayout">
                {messages.map((msg, index) => (
                  <motion.div
                    key={msg.id}
                    layout
                    initial={{ opacity: 0, y: 60, filter: "blur(20px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ type: "spring", stiffness: 80, damping: 20, delay: 0.1 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={cn(
                      "relative group max-w-[90%] md:max-w-[75%]",
                      msg.role === 'user' ? "items-end" : "items-start"
                    )}>
                      {/* Bubble */}
                        <div className={cn(
                          "p-8 md:p-12 rounded-[3rem] shadow-2xl transition-all duration-500 relative",
                          msg.role === 'user'
                            ? "bg-gradient-to-br from-primary to-[#7c5dfa] text-white dark:text-on-background glow-primary"
                            : "luminary-glass luminary-border border-white/5 bg-surface-container/30 backdrop-blur-3xl ai-message-bubble"
                        )}>
                        {/* AI messages: clickable words. User messages: plain text. */}
                        {msg.role === 'ai' ? (
                          renderAIContent(msg, index === messages.length - 1)
                        ) : (
                          <p className={cn(
                            "text-xl md:text-2xl font-semibold leading-[1.5] tracking-tight",
                            "font-bold font-manrope"
                          )}>
                            {msg.content}
                          </p>
                        )}

                        {/* TTS button for AI messages */}
                        {msg.role === 'ai' && (
                          <div className="mt-8 flex items-center gap-6">
                            <motion.button
                              whileHover={{ scale: 1.1, rotate: -5 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => speak(msg.content)}
                              className={cn(
                                "p-4 rounded-2xl transition-all border shadow-2xl flex items-center gap-4 group/btn",
                                isSpeaking
                                  ? "bg-primary text-white dark:text-on-background border-primary"
                                  : "bg-on-background/5 border-on-primary/10 text-primary hover:bg-primary/5 hover:text-primary"
                              )}
                            >
                              <Volume2 size={24} className={isSpeaking ? "animate-pulse" : ""} />
                              <span className="text-xs font-black uppercase tracking-widest hidden group-hover/btn:block">Voice Output</span>
                            </motion.button>
                          </div>
                        )}
                      </div>

                      {/* Word Mini-Drawer — visible when this bubble's word is selected */}
                      <AnimatePresence>
                        {msg.role === 'ai' && wordDrawerMsgId === msg.id && selectedWord && (
                            <div className="word-mini-drawer">
                            <WordMiniDrawer
                              word={selectedWord}
                              translation={wordTranslation}
                              isTranslating={isTranslating}
                              isSaved={savedWords.has(selectedWord)}
                              isSaving={isSavingWord}
                              onSave={handleSaveWord}
                              onClose={handleCloseDrawer}
                            />
                          </div>
                        )}
                      </AnimatePresence>

                      {/* Pronunciation score badge */}
                      {msg.role === 'user' && msg.score !== undefined && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="mt-5 flex items-center justify-end gap-3"
                        >
                          <div className="px-4 py-2 rounded-full luminary-glass luminary-border text-emerald-400 font-manrope text-[10px] font-black uppercase tracking-widest shadow-2xl">
                            {msg.score}% Pronunciation Sync
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Processing indicator */}
              {isProcessing && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="luminary-glass p-10 rounded-[2.5rem] flex items-center gap-6 shadow-2xl border-white/5">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full border-2 border-primary/20 animate-ping absolute inset-0" />
                      <Loader2 className="w-8 h-8 animate-spin text-primary relative z-10" />
                    </div>
                    <p className="text-sm font-black text-on-background/40 uppercase tracking-[0.2em]">Processing Synaptic Data...</p>
                  </div>
                </motion.div>
              )}
            </div>
          </main>

          {/* HUD aside */}
          <AnimatePresence>
            {isHUDExpanded && (
              <motion.aside
                initial={isUltraWide ? { opacity: 0 } : { x: 400, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={isUltraWide ? { opacity: 0 } : { x: 400, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className={cn(
                  "luminary-glass luminary-border z-40 flex flex-col overflow-hidden shadow-2xl backdrop-blur-3xl transition-all duration-500",
                  isUltraWide
                    ? "relative w-[480px] h-full m-8 rounded-[3rem] border border-white/10"
                    : "fixed right-10 top-32 bottom-32 w-[380px] rounded-[3.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.4)]"
                )}
              >
                <div className="absolute inset-0 pointer-events-none opacity-10">
                  <motion.div
                    animate={{ opacity: [0.1, 0.3, 0.1], y: [0, 100, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                    className="absolute top-0 left-0 w-full h-px bg-primary shadow-[0_0_20px_white]"
                  />
                </div>
                <div className="p-8 border-b border-on-background/5 flex justify-between items-center whitespace-nowrap">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-primary text-white dark:text-on-background">
                      <Target size={20} />
                    </div>
                    {isHUDExpanded && (
                      <span className="font-bold font-manrope uppercase tracking-widest text-on-background text-sm">Mission Compass</span>
                    )}
                  </div>
                  <button
                    onClick={() => setIsHUDExpanded(!isHUDExpanded)}
                    className="p-2 hover:bg-on-background/5 rounded-lg text-on-background/40"
                  >
                    <LayoutGrid size={20} />
                  </button>
                </div>

                <div className="flex-1 p-8 space-y-10 overflow-y-auto whitespace-nowrap">
                  {isHUDExpanded && (customData || isCustom) ? (
                    <>
                      <div className="space-y-4 whitespace-normal">
                        <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">对话协议</h4>
                        <p className="text-lg leading-relaxed text-on-background/60 font-medium italic">
                          "{customData?.setting || "深入进行的对谈与口语训练。"}"
                        </p>
                      </div>
                      {customData?.target_phrases && (
                        <div className="space-y-6 whitespace-normal">
                          <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">核心词汇</h4>
                          <div className="space-y-3">
                            {customData.target_phrases.map((phrase: string, idx: number) => (
                              <div key={idx} className="p-4 rounded-2xl bg-on-background/5 border border-on-background/5 flex items-center justify-between group hover:border-primary/30 transition-all">
                                <span className="font-bold text-on-background/80">{phrase}</span>
                                <div className="w-2 h-2 rounded-full bg-on-background/10 group-hover:bg-primary transition-colors" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-12 pt-12">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-1 h-32 bg-on-background/5 rounded-full relative overflow-hidden">
                          <motion.div
                            animate={{ height: ["0%", "100%", "0%"] }}
                            transition={{ duration: 4, repeat: Infinity, delay: i * 0.5 }}
                            className="w-full bg-primary/20"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>

        {/* Footer input bar */}
        <footer className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-8 pb-safe backdrop-blur-3xl bg-[var(--background)]/50 border-t luminary-border shadow-[0_-20px_40px_rgba(0,0,0,0.1)]">
          <div className="max-w-[1920px] mx-auto flex items-center justify-center gap-12">
            <div className="flex-1 max-w-3xl relative group">
              <div className="absolute inset-0 bg-[var(--primary)]/5 rounded-[2.5rem] blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
              <div className="relative luminary-glass luminary-border rounded-[2.5rem] p-2 pl-8 flex items-center transition-all duration-500 focus-within:ring-4 focus-within:ring-[var(--primary)]/10 shadow-2xl">
                <textarea
                  rows={1}
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder={isProcessing ? "处理中..." : "输入..."}
                  disabled={isProcessing}
                  className="flex-1 bg-transparent py-4 focus:outline-none resize-none placeholder-[var(--outline)] text-[var(--primary)] text-xl font-bold uppercase tracking-tight disabled:opacity-20"
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  onClick={handleSend}
                  disabled={!userInput.trim() || isProcessing}
                  className="p-6 bg-[var(--primary)] text-[var(--on-primary)] rounded-full shadow-2xl disabled:opacity-20 transition-all ml-4"
                >
                  <Send className="w-8 h-8" strokeWidth={3} />
                </motion.button>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => (isRecording ? stopRecording() : startRecording())}
                className={cn(
                  "w-16 h-16 md:w-24 md:h-24 rounded-full transition-all flex items-center justify-center relative shadow-2xl overflow-hidden border-4",
                  isRecording
                    ? "bg-rose-500 border-rose-400"
                    : "luminary-glass luminary-border text-[var(--primary)] hover:scale-105"
                )}
              >
                {isRecording ? (
                  <WaveformVisualizer barHeights={barHeights} isActive={isRecording} className="w-10 md:w-16" />
                ) : (
                  <Mic className="w-6 h-6 md:w-10 md:h-10 transition-transform" strokeWidth={3} />
                )}
              </motion.button>
              <span className="text-[10px] font-black uppercase mt-3 tracking-widest opacity-40">
                {isRecording ? "正在倾听" : "按下录制"}
              </span>
            </div>
          </div>
        </footer>
      </div>
    </ProtocolGuard>
  );
}

export default function ChatSession() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center text-[var(--primary)]">
        <Loader2 className="w-12 h-12 animate-spin" />
      </div>
    }>
      <SessionContent />
    </Suspense>
  );
}
