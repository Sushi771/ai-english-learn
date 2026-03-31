"use client";

import React from "react";
import { ChevronRight, Star, TrendingUp, RefreshCcw } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import AudioWaveform from "./AudioWaveform";

interface PhonemeData {
  phoneme: string;
  pronunciation_score: number;
}

interface WordData {
  word: string;
  accuracy_score: number;
  error_type: string;
  phonemes: PhonemeData[];
}

interface FeedbackProps {
  onBack: () => void;
  result?: {
    transcript?: string;
    response?: string;
    audioUrl?: string;
    pronunciation?: {
      accuracy_score?: number;
      pronunciation_score?: number;
      completeness_score?: number;
      fluency_score?: number;
      text?: string;
      error?: string;
      words?: WordData[];
    }
  };
}

const FeedbackCard = ({ onBack, result }: FeedbackProps) => {
  const pronunciation = result?.pronunciation;
  const accuracy = pronunciation?.accuracy_score || 0;
  const audioUrl = result?.audioUrl;
  
  const renderHighlightedText = () => {
    if (!pronunciation?.words || pronunciation.words.length === 0) {
      return <p className="text-on-background/40 italic">正在等待发音详情...</p>;
    }

    return (
      <div className="flex flex-wrap gap-x-2 gap-y-1 text-lg leading-relaxed">
        {pronunciation.words.map((w, idx) => {
          let colorClass = "text-on-background/60";
          if (w.accuracy_score >= 90) colorClass = "text-emerald-500";
          else if (w.accuracy_score >= 60) colorClass = "text-amber-500";
          else colorClass = "text-rose-500 font-bold";

          return (
            <motion.span 
              key={idx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.05 }}
              className={cn("cursor-help underline decoration-dotted decoration-on-background/20 underline-offset-4", colorClass)}
              title={`得分: ${w.accuracy_score}${w.error_type !== "None" ? ` (${w.error_type})` : ""}`}
            >
              {w.word}
            </motion.span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-on-background p-6 md:p-10 font-sans transition-colors duration-500">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-on-background/40 hover:text-on-background mb-10 transition-colors"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          <span className="text-sm font-medium uppercase tracking-widest">返回主页 (Dashboard)</span>
        </button>

        <header className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-4xl font-bold tracking-tight text-on-background">练习报告分析</h1>
            {accuracy > 80 && (
              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-4 py-1 rounded-full text-sm font-bold border border-emerald-500/20">
                表现卓越
              </span>
            )}
          </div>
          <p className="text-on-background/60 text-lg">
            {accuracy > 0 
              ? `本次场景对话的综合准确率为 ${accuracy}%。` 
              : "正在分析您的发音数据..."}
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Audio Waveform Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="luminary-glass luminary-border rounded-3xl p-8 col-span-1 md:col-span-2"
          >
             {audioUrl && audioUrl !== "/dummy.wav" ? (
               <AudioWaveform url={audioUrl} />
             ) : (
               <div className="w-full bg-on-background/5 rounded-2xl p-8 border border-on-background/5 flex flex-col items-center justify-center text-on-background/40 italic">
                 <p>正在同步历史录音波形...</p>
               </div>
             )}
          </motion.div>

          {/* Pronunciation Details Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="luminary-glass luminary-border rounded-3xl p-8 col-span-1 md:col-span-2"
          >
            <div className="flex items-center gap-3 mb-6">
              <Star className="w-6 h-6 text-amber-500" />
              <h3 className="text-xl font-bold">发音详情回顾 (Highlights)</h3>
            </div>
            <div className="p-6 bg-on-background/5 rounded-2xl border border-on-background/5 mb-6">
              {renderHighlightedText()}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-on-background/5 rounded-2xl border border-on-background/10">
                <p className="text-[10px] text-on-background/40 uppercase font-bold mb-1">综合准确度</p>
                <p className="text-2xl font-bold text-primary">{accuracy}%</p>
              </div>
              <div className="p-4 bg-on-background/5 rounded-2xl border border-on-background/10">
                <p className="text-[10px] text-on-background/40 uppercase font-bold mb-1">流利度</p>
                <p className="text-2xl font-bold text-secondary">{pronunciation?.fluency_score || 0}</p>
              </div>
              <div className="p-4 bg-on-background/5 rounded-2xl border border-on-background/10">
                <p className="text-[10px] text-on-background/40 uppercase font-bold mb-1">完整度</p>
                <p className="text-2xl font-bold text-emerald-500">{pronunciation?.completeness_score || 0}</p>
              </div>
              <div className="p-4 bg-on-background/5 rounded-2xl border border-on-background/10">
                <p className="text-[10px] text-on-background/40 uppercase font-bold mb-1">发音分</p>
                <p className="text-2xl font-bold text-amber-500">{pronunciation?.pronunciation_score || 0}</p>
              </div>
            </div>
          </motion.div>

          {/* AI Insights Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="luminary-glass luminary-border rounded-3xl p-8 col-span-1 md:col-span-2"
          >
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-6 h-6 text-secondary" />
              <h3 className="text-xl font-bold">AI 导师对话反馈</h3>
            </div>
            <div className="space-y-4">
              <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10">
                <p className="text-xs text-primary font-bold uppercase mb-3">导师回复 (Tutor Response)</p>
                <p className="text-lg text-on-background leading-relaxed font-serif italic text-on-background/90">
                  "{result?.response || "继续保持练习，AI 导师会给出更详细的点评。"}"
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* CTA */}
        <div className="flex gap-4">
          <button 
            onClick={onBack}
            className="flex-1 py-4 bg-primary text-white dark:text-on-background rounded-2xl font-bold shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
          >
            返回看板
          </button>
          <button className="px-6 py-4 bg-on-background/5 hover:bg-on-background/10 rounded-2xl transition-all border border-on-background/10">
            <RefreshCcw className="w-6 h-6 text-on-background/40" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackCard;
