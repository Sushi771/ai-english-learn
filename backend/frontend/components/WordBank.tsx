"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  X, 
  Search, 
  Volume2, 
  Star,
  Clock,
  ChevronRight,
  Loader2,
  Sparkles,
  Zap
} from 'lucide-react';
import { getWordBank } from '@/lib/api';
import { useTTS } from '@/hooks/useTTS';
import { cn } from '@/lib/utils';

interface WordRecord {
  word: string;
  mastery_level: number;
  next_review: string;
  error_type?: string;
  phonetic?: string;
}

interface WordBankProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WordBank({ isOpen, onClose }: WordBankProps) {
  const [words, setWords] = useState<WordRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { speak } = useTTS();

  useEffect(() => {
    if (isOpen) {
      const fetchWords = async () => {
        setLoading(true);
        try {
          const data = await getWordBank();
          setWords(data);
        } catch (err) {
          console.error("Failed to fetch word bank:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchWords();
    }
  }, [isOpen]);

  const filteredWords = words.filter(w => 
    w.word.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getUrgencyStyles = (dateStr: string) => {
    const next = new Date(dateStr);
    const now = new Date();
    if (next <= now) return "text-rose-400 bg-rose-400/10 border-rose-400/30 glow-rose";
    if (next.getTime() - now.getTime() < 86400000) return "text-amber-400 bg-amber-400/10 border-amber-400/30";
    return "text-emerald-400 bg-emerald-400/10 border-emerald-400/30";
  };

  const formatReviewDate = (dateStr: string) => {
    const next = new Date(dateStr);
    const now = new Date();
    const diff = next.getTime() - now.getTime();
    
    if (diff <= 0) return "急需复习";
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "今日复习";
    if (days === 1) return "明日复习";
    return `${days} 天后复习`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-xl z-[100]"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
            className="fixed right-0 top-0 h-full w-full max-w-lg bg-background border-l border-on-background/5 shadow-[-50px_0_100px_rgba(0,0,0,0.5)] z-[101] flex flex-col overflow-hidden transition-colors duration-500"
          >
            {/* Background Decor */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
               <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 blur-[100px] rounded-full" />
               <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-secondary/8 blur-[80px] rounded-full" />
            </div>

            {/* Header */}
            <div className="p-10 border-b border-on-background/5 space-y-8 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-primary/10 rounded-2xl text-primary border border-primary/20 shadow-inner">
                    <BookOpen size={28} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black font-manrope tracking-tighter text-on-background">
                      灵动词库
                    </h2>
                    <p className="text-[10px] font-black text-on-background/40 uppercase tracking-[0.3em]">间隔复习协议</p>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="p-3 hover:bg-on-background/5 rounded-2xl text-on-background/40 transition-colors"
                >
                  <X size={24} strokeWidth={3} />
                </button>
              </div>

              <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-on-background/30 group-focus-within:text-primary transition-all" size={20} />
                <input 
                  type="text"
                  placeholder="搜索词库存档..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-on-background/5 border border-on-background/5 rounded-[2rem] py-5 pl-16 pr-6 focus:outline-none focus:border-primary/40 transition-all text-primary placeholder-on-background/20 font-manrope font-black text-sm tracking-widest uppercase shadow-inner"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-10 py-6 space-y-8 custom-scrollbar relative z-10">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center gap-6">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-on-background/5 rounded-full" />
                    <div className="absolute inset-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(186,158,255,0.4)]" />
                  </div>
                  <p className="text-[10px] font-black text-on-background/40 uppercase tracking-[0.3em] animate-pulse">正在同步云端数据库...</p>
                </div>
              ) : filteredWords.length > 0 ? (
                filteredWords.map((word, i) => (
                  <motion.div
                    key={word.word}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="luminary-glass luminary-border p-8 rounded-[2.5rem] group hover:bg-surface-bright/20 transition-all cursor-pointer relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-6 opacity-[0.02] group-hover:opacity-[0.05] transition-all transform scale-150 rotate-12 text-on-background">
                       <Zap size={100} />
                    </div>

                    <div className="flex items-start justify-between mb-6 relative z-10">
                      <div>
                        <h3 className="text-3xl font-black text-on-background font-manrope tracking-tighter group-hover:text-primary transition-colors">{word.word}</h3>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-on-background/40 font-black tracking-widest uppercase">{word.phonetic || "/N.A/"}</span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); speak(word.word); }}
                            className="p-2 bg-on-background/5 rounded-lg text-primary hover:bg-primary hover:text-white dark:hover:text-[#060e20] transition-all shadow-xl"
                          >
                            <Volume2 size={16} strokeWidth={3} />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <div 
                              key={star} 
                              className={cn(
                                "w-1.5 h-6 rounded-full transition-all duration-500",
                                star <= word.mastery_level ? "bg-primary shadow-[0_0_10px_rgba(186,158,255,0.5)]" : "bg-on-background/5"
                              )}
                            />
                          ))}
                        </div>
                        <span className={cn(
                          "text-[9px] font-black px-3 py-1 rounded-full border tracking-[0.15em]",
                          getUrgencyStyles(word.next_review)
                        )}>
                          {formatReviewDate(word.next_review)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.15em] text-on-background/40 relative z-10">
                      <div className="flex items-center gap-2">
                        <Sparkles size={14} />
                        <span>掌握度: {Math.min(100, (word.mastery_level / 5) * 100)}%</span>
                      </div>
                      <button className="flex items-center gap-1 hover:text-primary transition-colors group-hover:opacity-100">
                        发音诊断 <ChevronRight size={14} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-6">
                  <div className="w-32 h-32 rounded-full luminary-glass border border-on-background/5 flex items-center justify-center text-6xl opacity-20 text-on-background">
                    <BookOpen size={60} strokeWidth={1} />
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-on-background font-manrope tracking-tight mb-2 uppercase">档案空空如也</h4>
                    <p className="text-sm font-medium text-on-background/40 leading-relaxed">
                      所有单词已同步并掌握。<br />开始更多对话来扩展词库。
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-10 border-t border-on-background/5 bg-on-background/5 relative z-10">
              <button 
                className="w-full bg-primary py-6 rounded-3xl text-white dark:text-[#060e20] font-black uppercase tracking-[0.2em] text-sm shadow-[0_20px_50px_rgba(186,158,255,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
                onClick={() => onClose()}
              >
                <Zap size={20} strokeWidth={3} className="fill-current" />
                开启词汇挑战
                <ChevronRight size={20} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
