"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Mic, 
  Volume2, 
  ChevronRight, 
  CheckCircle2, 
  Sparkles,
  Zap,
  Target,
  BookOpen,
  Info
} from "lucide-react";
import { getChallengeWords, processAudio } from "@/lib/api";
import { useTTS } from "@/hooks/useTTS";
import { cn } from "@/lib/utils";

interface ChallengeProps {
  onClose: () => void;
}

export default function Challenge({ onClose }: ChallengeProps) {
  const [words, setWords] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isAssessing, setIsAssessing] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [completed, setCompleted] = useState(false);
  const [sessionId, setSessionId] = useState<string>("new");
  const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array(16).fill(0));
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const { speak, isSpeaking } = useTTS();

  useEffect(() => {
    const fetchWords = async () => {
      try {
        const data = await getChallengeWords();
        // Sample dictionary data integration for the mockup/test
        const enrichedData = data.map((w: any) => ({
            ...w,
            definition: w.definition || "A systematic approach to solving a problem or achieving a goal.",
            example: w.example || "We need a more proactive strategy to address these challenges."
        }));
        setWords(enrichedData);
      } catch (err) {
        console.error("Failed to fetch challenge words", err);
      }
    };
    fetchWords();
  }, []);

  const currentWord = words[currentIndex];

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];
      mediaRecorder.current.ondataavailable = (event) => audioChunks.current.push(event.data);
      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: "audio/wav" });
        await handleAssessment(audioBlob);
      };
      mediaRecorder.current.start();
      setIsRecording(true);
      setLastResult(null);

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;
      source.connect(analyser);

      const updateData = () => {
        if (analyserRef.current) {
          const data = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(data);
          setAudioData(data.slice(0, 16));
          animationFrameRef.current = requestAnimationFrame(updateData);
        }
      };
      updateData();
    } catch (err) {
      console.error("Error accessing microphone", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
      setAudioData(new Uint8Array(16).fill(0));
    }
  };

  const handleAssessment = async (blob: Blob) => {
    setIsAssessing(true);
    try {
      const level = localStorage.getItem("user_level") || "A1";
      // Using generic session for challenge
      const result = await processAudio(blob, sessionId, "Vocabulary Audit", currentWord.word);
      if (sessionId === "new" && result.session_id) setSessionId(result.session_id);
      setLastResult(result.pronunciation);
    } catch (err) {
      console.error("Assessment failed", err);
    } finally {
      setIsAssessing(false);
    }
  };

  const nextWord = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setLastResult(null);
    } else {
      setCompleted(true);
    }
  };

  if (words.length === 0) return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950 gap-6">
      <div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest animate-pulse">Syncing Audit Protocol...</p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-3xl p-4 sm:p-6 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header HUD */}
        <div className="flex justify-between items-center px-8 sm:px-12 py-8 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Vocabulary Audit</h2>
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">
                Unit {currentIndex + 1} of {words.length} &bull; Phonetic Accuracy Model v2
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-500">
            <X size={24} />
          </button>
        </div>

        {/* Content Engine */}
        <div className="flex-1 overflow-y-auto p-8 sm:p-16 text-center space-y-12">
          {!completed ? (
            <>
              <AnimatePresence mode="wait">
                <motion.div 
                  key={currentWord.word}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="space-y-8"
                >
                  <div>
                    <h1 className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter text-white mb-2 leading-none">
                        {currentWord.word}
                    </h1>
                    <div className="flex items-center justify-center gap-4">
                        <span className="text-2xl font-medium text-indigo-400 font-mono tracking-widest">{currentWord.phonetic || "/.../"}</span>
                        <button 
                            onClick={() => speak(currentWord.word)}
                            className={cn(
                                "p-2 rounded-lg transition-all",
                                isSpeaking ? "text-indigo-400 scale-110" : "text-slate-500 hover:text-slate-300"
                            )}
                        >
                            <Volume2 className={isSpeaking ? "animate-pulse" : ""} />
                        </button>
                    </div>
                  </div>

                  {/* Dictionary Context */}
                  <div className="max-w-xl mx-auto space-y-4 text-left p-6 rounded-2xl bg-slate-950 border border-slate-800">
                    <div className="flex items-start gap-3">
                        <BookOpen className="w-4 h-4 text-indigo-500 mt-1 shrink-0" />
                        <div>
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Definition</div>
                            <p className="text-slate-300 text-sm leading-relaxed">{currentWord.definition}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 pt-4 border-t border-slate-900">
                        <Info className="w-4 h-4 text-emerald-500 mt-1 shrink-0" />
                        <div>
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Contextual Example</div>
                            <p className="text-slate-400 text-sm italic leading-relaxed">"{currentWord.example}"</p>
                        </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Interaction & Result */}
              <div className="min-h-[140px] flex flex-col items-center justify-center gap-8">
                {isRecording ? (
                   <div className="flex items-end gap-2 h-12">
                     {Array.from({ length: 16 }).map((_, i) => (
                       <motion.div
                         key={i}
                         animate={{ height: Math.max(4, (audioData[i] / 255) * 48) }}
                         className="w-2 bg-indigo-500 rounded-full"
                       />
                     ))}
                   </div>
                ) : isAssessing ? (
                   <div className="flex flex-col items-center gap-4">
                     <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                     <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">Analyzing spectral data...</span>
                   </div>
                ) : lastResult ? (
                   <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex gap-4">
                        <div className="px-8 py-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Accuracy</span>
                            <span className={cn("text-3xl font-black", lastResult.accuracy_score >= 80 ? "text-emerald-400" : "text-amber-400")}>
                                {Math.round(lastResult.accuracy_score)}%
                            </span>
                        </div>
                        <div className="px-8 py-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Fluency</span>
                            <span className="text-3xl font-black text-indigo-400">{Math.round(lastResult.fluency_score)}%</span>
                        </div>
                   </motion.div>
                ) : null}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-8 pb-8">
                <button
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
                  className={cn(
                    "w-28 h-28 rounded-full flex items-center justify-center transition-all shadow-2xl relative",
                    isRecording 
                      ? "bg-rose-600 scale-110 shadow-rose-500/20" 
                      : "bg-slate-800 border border-slate-700 text-indigo-400 hover:border-indigo-500"
                  )}
                >
                  <Mic className={cn(isRecording ? "w-10 h-10 text-white" : "w-10 h-10")} />
                  {isRecording && <div className="absolute inset-0 rounded-full border-4 border-white/20 animate-ping" />}
                </button>
                
                {lastResult && (
                    <button onClick={nextWord} className="h-20 px-10 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-indigo-500/20 flex items-center gap-2 active:scale-95">
                        Next Word <ChevronRight />
                    </button>
                )}
              </div>
            </>
          ) : (
             <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8 py-12">
               <div className="w-24 h-24 bg-emerald-500/20 rounded-3xl flex items-center justify-center mx-auto text-emerald-400 border border-emerald-500/30">
                 <CheckCircle2 className="w-12 h-12" />
               </div>
               <div className="space-y-2">
                 <h2 className="text-4xl font-bold">Audit Complete</h2>
                 <p className="text-slate-400">Your profile has been updated with these phonetic footprints.</p>
               </div>
               <button 
                 onClick={onClose}
                 className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 px-12 rounded-2xl transition-all active:scale-95"
               >
                 Return to Console
               </button>
             </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
