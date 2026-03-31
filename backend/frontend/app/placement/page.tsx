"use client";

import React, { useState, useEffect } from "react";
import { getPlacementQuestions, evaluatePlacement } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Headphones, Languages, PenLine, ArrowRight, CheckCircle2, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PlacementTestPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    async function loadQuestions() {
      try {
        const data = await getPlacementQuestions();
        setQuestions(data);
      } catch (err) {
        console.error("Failed to load questions", err);
      } finally {
        setLoading(false);
      }
    }
    loadQuestions();
  }, []);

  const handleAnswer = (userAnswer: string) => {
    const currentQ = questions[currentIndex];
    const newAnswer = {
      ...currentQ,
      user_answer: userAnswer,
      correct_answer: currentQ.a || currentQ.hint // handle different types
    };
    
    const updatedAnswers = [...answers, newAnswer];
    setAnswers(updatedAnswers);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      submitTest(updatedAnswers);
    }
  };

  const submitTest = async (finalAnswers: any[]) => {
    setIsEvaluating(true);
    try {
      const evalResult = await evaluatePlacement(finalAnswers, "default_user");
      setResult(evalResult);
      // Persist level locally
      localStorage.setItem("user_level", evalResult.level);
    } catch (err) {
      console.error("Evaluation failed", err);
    } finally {
      setIsEvaluating(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-400 font-medium tracking-wide">Syncing Linguistic Patterns...</p>
    </div>
  );

  if (result) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full p-10 rounded-3xl bg-slate-900 border border-slate-800 text-center shadow-2xl"
      >
        <div className="w-20 h-20 bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-indigo-400 border border-indigo-500/30">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Evaluation Complete</h2>
        <p className="text-slate-400 text-sm mb-8">We've determined your starting proficiency.</p>
        
        <div className="bg-slate-950/50 rounded-2xl p-6 mb-8 border border-slate-800/50">
          <div className="text-sm text-slate-500 uppercase tracking-widest font-bold mb-1">Your Level</div>
          <div className="text-5xl font-black text-indigo-400 mb-4">{result.level}</div>
          <div className="text-sm text-slate-300 leading-relaxed px-4">{result.description}</div>
        </div>

        <button 
          onClick={() => router.push("/dashboard")}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-500/20"
        >
          Begin Discovery
        </button>
      </motion.div>
    </div>
  );

  const currentQ = questions[currentIndex];
  const progress = ((currentIndex) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-slate-900 overflow-hidden">
        <motion.div 
          className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="max-w-2xl w-full">
          {/* Question Header */}
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 shadow-xl">
              {currentQ.type === "choice" && <Brain className="w-6 h-6 text-indigo-400" />}
              {currentQ.type === "listening" && <Headphones className="w-6 h-6 text-yellow-400" />}
              {currentQ.type === "translate" && <Languages className="w-6 h-6 text-emerald-400" />}
              {currentQ.type === "fill" && <PenLine className="w-6 h-6 text-pink-400" />}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Question {currentIndex + 1} of {questions.length}</div>
              <div className="text-slate-400 text-sm">{currentQ.type.charAt(0).toUpperCase() + currentQ.type.slice(1)} Block</div>
            </div>
          </div>

          {/* Question Text */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={currentIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-12"
            >
              <h2 className="text-3xl font-semibold leading-tight text-balance">
                {currentQ.q}
              </h2>

              {/* Interaction Area */}
              <div className="grid grid-cols-1 gap-4">
                {currentQ.type === "choice" && currentQ.options.map((opt: string) => (
                  <button
                    key={opt}
                    onClick={() => handleAnswer(opt)}
                    className="flex items-center justify-between p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/50 transition-all text-left text-lg group active:scale-[0.98]"
                  >
                    <span>{opt}</span>
                    <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                  </button>
                ))}

                {currentQ.type === "listening" && (
                    <div className="space-y-6">
                        <div className="p-10 rounded-3xl bg-indigo-500/5 border border-indigo-500/20 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-indigo-500/10 transition-all">
                             <div className="w-16 h-16 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                                <Headphones className="w-8 h-8 text-white" />
                             </div>
                             <span className="text-sm font-medium text-indigo-300">Play Audio Clip</span>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {currentQ.options?.map((opt: string) => (
                                <button key={opt} onClick={() => handleAnswer(opt)} className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500 text-left">{opt}</button>
                            ))}
                            {!currentQ.options && (
                                <input 
                                    onKeyDown={(e) => e.key === "Enter" && handleAnswer(e.currentTarget.value)}
                                    placeholder="Type what you hear..."
                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-4 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            )}
                        </div>
                    </div>
                )}

                {(currentQ.type === "translate" || currentQ.type === "fill") && (
                  <div className="space-y-6">
                    <textarea 
                      autoFocus
                      onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleAnswer(e.currentTarget.value);
                          }
                      }}
                      placeholder={currentQ.type === "fill" ? "Enter the missing word..." : "Type your translation here..."}
                      className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 h-32 focus:ring-2 focus:ring-indigo-500 outline-none text-xl placeholder:text-slate-700 transition-all"
                    />
                    <div className="flex justify-end p-2">
                        <button className="flex items-center gap-2 text-indigo-400 font-semibold text-sm hover:text-indigo-300 transition-colors group">
                           Press Enter to Submit <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      
      {/* Footer Branding */}
      <footer className="p-8 text-center text-slate-600 text-xs tracking-widest font-medium uppercase mt-auto">
        Neural Proficiency Evaluation v2.0 &bull; Editorial Minimalist System
      </footer>
    </div>
  );
}
