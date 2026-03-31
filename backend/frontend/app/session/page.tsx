"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  Send, 
  ArrowLeft, 
  Volume2, 
  CheckCircle2, 
  Sparkles,
  Loader2,
  ChevronRight,
  Target,
  Clock,
  Zap,
  LayoutGrid,
  BookOpen
} from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import ProtocolGuard from '../../components/ProtocolGuard';
import { processAudio, sendChatMessage, PronunciationWord } from '@/lib/api';
import { useTTS } from '@/hooks/useTTS';
import Notification from '@/components/Notification';
import ThemeToggle from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';

interface Message {
  id: number;
  role: 'user' | 'ai';
  content: string;
  translation?: string;
  score?: number;
}

function SessionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [rawScenario, setRawScenario] = useState('咖啡馆点餐练习');
  const [isCustom, setIsCustom] = useState(false);
  const [customData, setCustomData] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [sessionId, setSessionId] = useState('new');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isHUDExpanded, setIsHUDExpanded] = useState(false);
  const [isUltraWide, setIsUltraWide] = useState(false);
  
  // UX Architecture: Ultra-Wide Optimization
  useEffect(() => {
    const handleResize = () => {
      const ultraWide = window.innerWidth >= 1920;
      setIsUltraWide(ultraWide);
      if (ultraWide) setIsHUDExpanded(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { speak, isSpeaking } = useTTS();

  useEffect(() => {
    const topic = searchParams.get('topic') || '咖啡馆点餐练习';
    const custom = !!searchParams.get('isCustom') || !!sessionStorage.getItem('custom_scenario');
    setRawScenario(topic);
    setIsCustom(custom);

    let initialMsg = `您好！欢迎进入【${topic}】练习。请问我们现在开始吗？`;
    
    const stored = sessionStorage.getItem('custom_scenario');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data.title === topic) {
          setCustomData(data);
          initialMsg = data.initial_message || initialMsg;
          setIsHUDExpanded(true);
        }
      } catch (e) {
        console.error("Failed to parse custom scenario", e);
      }
    }

    setMessages([{ 
      id: 1, 
      role: 'ai', 
      content: initialMsg,
    }]);
  }, [searchParams]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const sendAudioData = async (audioBlob: Blob) => {
    const tempUserMsgId = Date.now();
    setMessages(prev => [...prev, { id: tempUserMsgId, role: 'user', content: '正在识别...' }]);
    setIsProcessing(true);

    try {
      const result = await processAudio(audioBlob, sessionId, customData?.title || rawScenario);
      setSessionId(result.session_id);
      setMessages(prev => prev.map(m => 
        m.id === tempUserMsgId 
          ? { ...m, content: result.transcript, score: result.pronunciation?.accuracy_score } 
          : m
      ));
      
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', content: result.response }]);
      speak(result.response);
      
      if (result.pronunciation?.words) {
        const lowScoreWords = result.pronunciation.words
          .filter((w: PronunciationWord) => w.accuracy_score < 80)
          .map((w: PronunciationWord) => w.word);
        
        if (lowScoreWords.length > 0) {
          setToastMessage(`"${lowScoreWords.slice(0, 2).join(", ")}" 已入库复习`);
          setShowToast(true);
        }
      }
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

    const newMessage: Message = { id: Date.now(), role: 'user', content: textToSend };
    setMessages(prev => [...prev, newMessage]);
    
    try {
      const result = await sendChatMessage(textToSend, sessionId, customData?.title || rawScenario);
      setSessionId(result.session_id);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'ai',
        content: result.response
      }]);
      speak(result.response);
    } catch (err) {
      console.error("Text chat failed:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ProtocolGuard>
      <div className="flex flex-col h-screen bg-background text-on-background font-inter overflow-hidden relative transition-colors duration-500">
        <Notification isVisible={showToast} message={toastMessage} onClose={() => setShowToast(false)} />

        <div className="fixed inset-0 pointer-events-none opacity-40">
           <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 blur-[100px] rounded-full animate-pulse" />
           <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-secondary/5 blur-[120px] rounded-full animate-pulse [animation-delay:2s]" />
           <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 contrast-150 brightness-50 mix-blend-overlay" />
        </div>

        <header className="fixed top-0 left-0 right-0 z-50 py-4 px-6 md:px-12 backdrop-blur-xl border-b border-white/5 bg-background/50">
           <div className="max-w-[1920px] mx-auto flex items-center justify-between">
             <div className="flex items-center gap-6">
                <button 
                  onClick={() => router.back()}
                  className="p-3 rounded-2xl bg-on-background/5 text-on-background/40 hover:text-primary transition-all hover:bg-primary/5"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="flex flex-col">
                   <h2 className="text-xl md:text-2xl font-bold font-manrope uppercase tracking-tight text-on-background">
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
                   onClick={() => setIsHUDExpanded(!isHUDExpanded)}
                   className="p-3 rounded-2xl bg-on-background/5 text-on-background shadow-lg hover:bg-on-background/10 transition-all"
                >
                   {isHUDExpanded ? <LayoutGrid size={22} className="text-primary" /> : <LayoutGrid size={22} />}
                </button>
             </div>
           </div>
        </header>

        <div className="flex-1 flex overflow-hidden pt-24 pb-40">
          <main ref={scrollRef} className={cn(
             "h-full overflow-y-auto scroll-smooth custom-scrollbar relative z-10 transition-all duration-700",
             isUltraWide && isHUDExpanded ? "flex-[1.5] px-12" : "flex-1 px-6 lg:px-12 flex justify-center"
           )}>
             <div className={cn(
                "w-full space-y-16 transition-all",
                isUltraWide && isHUDExpanded ? "max-w-4xl ml-auto mr-12" : "max-w-4xl mx-auto"
              )}>
               <AnimatePresence mode="popLayout">
                 {messages.map((msg, idx) => (
                   <motion.div
                     key={msg.id}
                     layout
                     initial={{ opacity: 0, y: 60, filter: "blur(20px)" }}
                     animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                     transition={{ type: "spring", stiffness: 80, damping: 20, delay: 0.1 }}
                     className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                   >
                     <div className={cn(
                       "relative group max-w-[85%] md:max-w-[70%]",
                       msg.role === 'user' ? "items-end" : "items-start"
                     )}>
                       <div className={cn(
                         "p-8 md:p-12 rounded-[3rem] shadow-2xl transition-all duration-500 relative",
                         msg.role === 'user' 
                           ? "bg-gradient-to-br from-primary to-[#7c5dfa] text-white dark:text-on-background glow-primary" 
                           : "luminary-glass luminary-border border-white/5 bg-surface-container/30 backdrop-blur-3xl"
                       )}>
                         <p className={cn(
                           "text-xl md:text-2xl font-semibold leading-[1.5] tracking-tight",
                           msg.role === 'user' ? "font-bold font-manrope" : "text-on-background"
                         )}>
                           {msg.content}
                         </p>
                         
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

                       {msg.role === 'user' && msg.score !== undefined && (
                         <motion.div 
                           initial={{ opacity: 0, scale: 0.8 }}
                           animate={{ opacity: 1, scale: 1 }}
                           className="mt-5 flex items-center justify-end gap-3"
                         >
                           <div className="px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-manrope text-[10px] font-black uppercase tracking-widest shadow-lg">
                             {msg.score}% Pronunciation Sync
                           </div>
                         </motion.div>
                       )}
                     </div>
                   </motion.div>
                 ))}
               </AnimatePresence>
               
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
                 animate={{ 
                   opacity: [0.1, 0.3, 0.1],
                   y: [0, 100, 0]
                 }}
                 transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                 className="absolute top-0 left-0 w-full h-px bg-primary shadow-[0_0_20px_white]"
               />
            </div>
            <div className="p-8 border-b border-on-background/5 flex justify-between items-center whitespace-nowrap">
               <div className="flex items-center gap-4">
                   <div className="p-3 rounded-xl bg-primary text-white dark:text-on-background">
                     <Target size={20} />
                   </div>
                   {isHUDExpanded && <span className="font-bold font-manrope uppercase tracking-widest text-on-background text-sm">Mission Compass</span>}
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
                   {[1,2,3].map(i => <div key={i} className="w-1 h-32 bg-on-background/5 rounded-full relative overflow-hidden">
                      <motion.div animate={{ height: ["0%", "100%", "0%"] }} transition={{ duration: 4, repeat: Infinity, delay: i * 0.5 }} className="w-full bg-primary/20" />
                   </div>)}
                 </div>
               )}
            </div>
          </motion.aside>
            )}
          </AnimatePresence>
        </div>

        <footer className="fixed bottom-0 left-0 right-0 z-50 p-6 md:p-10 backdrop-blur-3xl bg-background/50 border-t border-white/5">
           <div className="max-w-[1920px] mx-auto flex items-center justify-center gap-12">
             <div className="flex-1 max-w-3xl relative group">
               <div className="absolute inset-0 bg-primary/5 rounded-[2.5rem] blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
               <div className="relative bg-on-background/5 border border-on-background/5 rounded-[2.5rem] p-2 pl-8 flex items-center transition-all duration-500 focus-within:border-primary/30 shadow-2xl">
                 <textarea
                   rows={1}
                   value={userInput}
                   onChange={(e) => setUserInput(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                   placeholder={isProcessing ? "处理中..." : "输入..."}
                   disabled={isProcessing}
                   className="flex-1 bg-transparent py-4 focus:outline-none resize-none placeholder-on-background/20 text-primary text-xl font-bold uppercase tracking-tight disabled:opacity-20"
                 />
                 <motion.button 
                   whileHover={{ scale: 1.1 }}
                   onClick={handleSend}
                   disabled={!userInput.trim() || isProcessing}
                   className="p-6 bg-primary text-white dark:text-on-background rounded-full shadow-2xl disabled:opacity-20 transition-all ml-4"
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
                   "w-24 h-24 rounded-full transition-all flex items-center justify-center relative shadow-2xl overflow-hidden border-4",
                   isRecording ? "bg-rose-500 border-rose-400" : "bg-on-background/5 border-on-background/10 text-primary hover:border-primary/30"
                 )}
               >
                 <Mic className={cn("w-10 h-10", isRecording ? "animate-pulse" : "transition-transform")} strokeWidth={3} />
               </motion.button>
               <span className="text-[10px] font-black uppercase mt-3 tracking-widest text-on-background/40">
                 {isRecording ? "传输中" : "录音"}
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
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-primary">
       <Loader2 className="w-12 h-12 animate-spin" />
    </div>}>
      <SessionContent />
    </Suspense>
  );
}
