"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mic, 
  Square, 
  Send, 
  ChevronLeft, 
  Volume2, 
  Settings, 
  Sparkles,
  Zap,
  Loader2,
  AlertCircle,
  Star
} from "lucide-react";
import { formatTime } from "@/lib/utils";
import { useTTS } from "@/hooks/useTTS";
import { sendMessage, sendAudio } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  assessment?: any;
}

interface SessionProps {
  scenario: string;
  onExit: () => void;
}

export default function Session({ scenario, onExit }: SessionProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: `Hello! I'm your AI assistant for this ${scenario} scenario. How can I help you today?`,
      timestamp: new Date(),
    },
  ]);
  const [userInput, setUserInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showAssessment, setShowAssessment] = useState(false);
  const [lastAssessment, setLastAssessment] = useState<any>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { speak } = useTTS();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordingTime(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        await handleSendAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("无法访问麦克风。请确保已授予权限。");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSendText = async () => {
    if (!userInput.trim() || isProcessing) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userInput,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setUserInput("");
    setIsProcessing(true);

    try {
      const response = await sendMessage(userInput, scenario);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      speak(response.content);
    } catch (err) {
      console.error("Send message error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendAudio = async (blob: Blob) => {
    setIsProcessing(true);
    try {
      const result = await sendAudio(blob, scenario);

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: result.transcription,
        timestamp: new Date(),
        assessment: result.assessment,
      };

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: result.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg, aiMsg]);
      setLastAssessment(result.assessment);
      setShowAssessment(true);
      speak(result.response);
    } catch (err) {
      console.error("Audio processing error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background text-on-background flex flex-col font-inter transition-colors duration-500 overflow-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
         <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-primary/10 blur-[150px] rounded-full" />
         <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-secondary/10 blur-[120px] rounded-full" />
      </div>

      {/* Header */}
      <header className="luminary-glass border-b border-on-background/5 p-6 flex items-center justify-between relative z-50">
        <div className="flex items-center gap-6">
          <button
            onClick={onExit}
            className="p-4 hover:bg-on-background/5 rounded-2xl text-on-background/40 hover:text-primary transition-all group"
          >
            <ChevronLeft size={24} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <h1 className="text-2xl font-black font-manrope tracking-tighter">
              场景: <span className="text-primary">{scenario}</span>
            </h1>
            <div className="flex items-center gap-2 mt-1">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-background/40">灵动同步中</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-3 luminary-glass luminary-border rounded-xl text-on-background/40 hover:text-primary transition-all">
            <Settings size={20} />
          </button>
          <div className="px-4 py-2 luminary-glass luminary-border rounded-xl flex items-center gap-3">
             <Star className="text-amber-400 fill-amber-400" size={16} />
             <span className="text-sm font-black font-manrope">2,450 XP</span>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-6 py-12 custom-scrollbar relative z-10">
        <div className="max-w-4xl mx-auto space-y-12">
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  "flex group",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-[2rem] p-8 shadow-2xl relative transition-all duration-500",
                    msg.role === "user"
                      ? "bg-primary text-on-primary rounded-tr-none glow-primary"
                      : "luminary-glass luminary-border rounded-tl-none"
                  )}
                >
                  <div className="absolute top-2 right-4 opacity-0 group-hover:opacity-10 transition-opacity">
                     {msg.role === "user" ? <Zap size={80} /> : <Sparkles size={80} />}
                  </div>

                  <p className="text-lg leading-relaxed font-medium mb-4 relative z-10">
                    {msg.content}
                  </p>
                  <div className={cn(
                    "flex items-center gap-6 relative z-10",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {msg.role === "assistant" && (
                      <button 
                        onClick={() => speak(msg.content)}
                        className="p-2 bg-on-background/5 rounded-lg hover:bg-primary hover:text-white transition-all"
                      >
                        <Volume2 size={16} strokeWidth={2.5} />
                      </button>
                    )}
                  </div>

                  {msg.assessment && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      className="mt-6 pt-6 border-t border-on-primary/10 overflow-hidden"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className="px-3 py-1 bg-on-primary/20 rounded-full text-[10px] font-black tracking-widest uppercase">
                          发音得分: {msg.assessment.pronunciation_score}
                        </div>
                        <div className="flex gap-1">
                          {[1,2,3,4,5].map(s => (
                            <div key={s} className={cn("w-1 h-3 rounded-full", s <= Math.round(msg.assessment.pronunciation_score/20) ? "bg-on-primary" : "bg-on-primary/20")} />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs italic opacity-80">{msg.assessment.feedback}</p>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isProcessing && (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="flex justify-start"
            >
               <div className="luminary-glass luminary-border rounded-[2rem] rounded-tl-none p-8 flex items-center gap-4">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary animate-pulse">AI 正在深度思考中...</span>
               </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Footer / Input */}
      <footer className="luminary-glass border-t border-on-background/5 p-8 relative z-50">
        <div className="max-w-4xl mx-auto flex items-center gap-6">
          <div className="relative flex-1 group">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="在此输入您的英语回答..."
              disabled={isProcessing || isRecording}
              className="w-full bg-on-background/5 border border-on-background/5 rounded-[2rem] px-8 py-5 pr-20 focus:outline-none focus:border-primary/40 transition-all placeholder:text-on-background/20 font-medium text-lg shadow-inner"
            />
            <button
              onClick={handleSendText}
              disabled={!userInput.trim() || isProcessing || isRecording}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-primary hover:scale-110 disabled:opacity-0 transition-all"
            >
              <Send size={24} strokeWidth={3} />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <AnimatePresence>
              {isRecording && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-4 px-6 py-4 luminary-glass luminary-border rounded-2xl glow-primary"
                >
                  <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                  <span className="text-lg font-black font-manrope tabular-nums">{formatTime(recordingTime)}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl relative group overflow-hidden",
                isRecording 
                  ? "bg-rose-500 text-white scale-110 rotate-90" 
                  : "bg-primary text-on-primary hover:scale-110"
              )}
            >
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity animate-pulse" />
              {isRecording ? <Square size={32} /> : <Mic size={32} strokeWidth={2.5} />}
            </button>
          </div>
        </div>
      </footer>

      {/* Assessment HUD overlay */}
      <AnimatePresence>
        {showAssessment && lastAssessment && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/60 backdrop-blur-3xl"
          >
            <motion.div className="max-w-md w-full luminary-card p-12 space-y-10 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Zap size={150} />
               </div>

               <div className="text-center space-y-4">
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto border border-primary/20 mb-6">
                     <Sparkles className="w-12 h-12 text-primary" />
                  </div>
                  <h2 className="text-4xl font-black font-manrope tracking-tighter uppercase">表现反馈</h2>
                  <p className="text-on-background/40 font-black text-[10px] tracking-[0.4em] uppercase">Performance Assessment</p>
               </div>

               <div className="grid grid-cols-2 gap-8">
                  <div className="luminary-glass p-6 rounded-3xl text-center space-y-2 border border-primary/20 group hover:bg-primary/10 transition-colors">
                     <div className="text-4xl font-black font-manrope text-primary tabular-nums">{lastAssessment.pronunciation_score}</div>
                     <div className="text-[9px] font-black uppercase tracking-widest opacity-40">发音准确度</div>
                  </div>
                  <div className="luminary-glass p-6 rounded-3xl text-center space-y-2 border border-secondary/20 group hover:bg-secondary/10 transition-colors">
                     <div className="text-4xl font-black font-manrope text-secondary tabular-nums">+{lastAssessment.points || 25}</div>
                     <div className="text-[9px] font-black uppercase tracking-widest opacity-40">获得积分</div>
                  </div>
               </div>

               <div className="space-y-4 luminary-glass p-8 rounded-3xl border border-on-background/5">
                  <div className="flex items-center gap-3 text-primary">
                     <AlertCircle size={18} />
                     <span className="text-[10px] font-black uppercase tracking-widest">关键反馈</span>
                  </div>
                  <p className="text-sm font-medium leading-relaxed italic">{lastAssessment.feedback}</p>
               </div>

               <button 
                 onClick={() => setShowAssessment(false)}
                 className="w-full py-6 rounded-3xl bg-primary text-on-primary font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-primary/40 hover:scale-[1.02] transition-all"
               >
                 继续练习
               </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
