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
  Zap,
  CheckCircle2,
  Brain,
  RotateCcw,
  Trophy,
  Trash2
} from 'lucide-react';
import { getWordBank, updateWordStatus, deleteFromWordBank, type Word } from '@/lib/api';
import { useTTS } from '@/hooks/useTTS';
import { cn } from '@/lib/utils';

interface WordBankProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WordBank({ isOpen, onClose }: WordBankProps) {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewResults, setReviewResults] = useState<{ forgot: number; hard: number; easy: number }>({ forgot: 0, hard: 0, easy: 0 });
  const [showSummary, setShowSummary] = useState(false);
  
  const { speak } = useTTS();

  const fetchWords = async () => {
    setLoading(true);
    try {
      const data = await getWordBank();
      // Ensure backend data matches our Word interface
      const normalizedData = data.map((item: any) => ({
        id: item.id || item.word, // Fallback to word string if no UUID
        word: item.word,
        translation: item.translation || item.example_sentence || "暂无翻译",
        example: item.example || item.example_sentence || "No example available.",
        status: item.status || 'new'
      }));
      setWords(normalizedData);
    } catch (err) {
      console.error("Failed to fetch word bank:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchWords();
    } else {
      // Reset state when closing
      setIsReviewMode(false);
      setShowSummary(false);
    }
  }, [isOpen]);

  const filteredWords = words.filter(w => 
    w.word.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteWord = async (word: string) => {
    try {
      await deleteFromWordBank(word);
      setWords(prev => prev.filter(w => w.word !== word));
    } catch (err) {
      console.error("Failed to delete word:", err);
    }
  };

  const startReview = () => {
    if (words.length === 0) return;
    setIsReviewMode(true);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setReviewResults({ forgot: 0, hard: 0, easy: 0 });
    setShowSummary(false);
  };

  const handleReviewAction = async (status: 'new' | 'reviewing' | 'mastered') => {
    const word = words[currentCardIndex];
    
    // Update locally for immediate feedback
    setWords(prev => prev.map((w, idx) => idx === currentCardIndex ? { ...w, status } : w));
    
    // Update summary counters
    setReviewResults(prev => ({
      ...prev,
      forgot: status === 'new' ? prev.forgot + 1 : prev.forgot,
      hard: status === 'reviewing' ? prev.hard + 1 : prev.hard,
      easy: status === 'mastered' ? prev.easy + 1 : prev.easy,
    }));

    // Call API
    try {
      await updateWordStatus(word.id, status);
    } catch (err) {
      console.error("Failed to update status:", err);
    }

    // Move to next card or show summary
    if (currentCardIndex < words.length - 1) {
      setIsFlipped(false);
      // Short delay for smoothness
      setTimeout(() => {
        setCurrentCardIndex(prev => prev + 1);
      }, 300);
    } else {
      setShowSummary(true);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[var(--background)]/80 backdrop-blur-3xl z-[100]"
          />

          {/* Flashcard Review Overlay */}
          <AnimatePresence>
            {isReviewMode && (
              <motion.div
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-0 z-[200] flex flex-col items-center justify-center p-6 md:p-12 overflow-hidden"
              >
                {/* Progress Bar */}
                <div className="absolute top-12 left-0 right-0 px-12 z-50">
                  <div className="max-w-xl mx-auto space-y-4">
                    <div className="flex justify-between items-end">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[var(--primary)]/20 rounded-lg text-[var(--primary)]">
                          <Brain size={18} />
                        </div>
                        <div>
                          <h4 className="text-xl font-black font-manrope tracking-tight text-[var(--on-background)]">词汇抗遗忘训练</h4>
                          <p className="text-[9px] font-black tracking-widest text-[var(--outline)] uppercase">Cognitive Protocol Active</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-[var(--outline)] font-manrope">
                        {showSummary ? '训练完成' : `${currentCardIndex + 1} / ${words.length}`}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-[var(--on-background)]/5 rounded-full overflow-hidden shadow-inner border border-[var(--on-background)]/5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentCardIndex + (showSummary ? 1 : 0)) / words.length) * 100}%` }}
                        className="h-full bg-[var(--primary)] shadow-[0_0_15px_rgba(186,158,255,0.6)]"
                      />
                    </div>
                  </div>
                </div>

                {showSummary ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="luminary-glass luminary-border p-12 rounded-[3.5rem] max-w-md w-full text-center space-y-10 relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
                    
                    <div className="relative">
                      <div className="w-24 h-24 bg-[var(--primary)]/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-[var(--primary)]/20 shadow-xl">
                        <Trophy size={48} className="text-[var(--primary)] animate-bounce fill-[var(--primary)]/20" />
                      </div>
                      <h3 className="text-4xl font-black font-manrope tracking-tighter text-[var(--on-background)]">复习完毕</h3>
                      <p className="text-sm font-medium text-[var(--outline)] mt-2 lowercase">Great job! Your memory pathway is strengthened.</p>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { label: '不认识', count: reviewResults.forgot, color: 'text-rose-400' },
                        { label: '模糊', count: reviewResults.hard, color: 'text-amber-400' },
                        { label: '已掌握', count: reviewResults.easy, color: 'text-emerald-400' }
                      ].map(stat => (
                        <div key={stat.label} className="p-4 bg-on-background/5 rounded-2xl border border-on-background/5 group hover:border-primary/20 transition-all">
                          <p className={cn("text-2xl font-black font-manrope mb-1", stat.color)}>{stat.count}</p>
                          <p className="text-[10px] font-bold text-on-background/30 uppercase tracking-widest">{stat.label}</p>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-4">
                      <button 
                        onClick={startReview}
                        className="w-full bg-[var(--primary)] py-5 rounded-2xl text-[var(--on-primary)] font-black uppercase tracking-[0.2em] text-xs shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                      >
                        <RotateCcw size={18} strokeWidth={3} />
                        再练一遍
                      </button>
                      <button 
                        onClick={() => setIsReviewMode(false)}
                        className="w-full bg-[var(--on-background)]/5 py-5 rounded-2xl text-[var(--on-background)]/60 font-black uppercase tracking-[0.2em] text-xs hover:bg-[var(--on-background)]/10 transition-all"
                      >
                        退出训练
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="w-full max-w-xl perspective-1000">
                    <motion.div
                      key={currentCardIndex}
                      initial={{ scale: 0.9, opacity: 0, rotateY: 0 }}
                      animate={{ scale: 1, opacity: 1, rotateY: isFlipped ? 180 : 0 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      transition={{ 
                        rotateY: { duration: 0.6, type: "spring", stiffness: 260, damping: 20 },
                        default: { duration: 0.4 }
                      }}
                      onClick={() => setIsFlipped(!isFlipped)}
                      className="relative w-full aspect-[4/3] cursor-pointer [transform-style:preserve-3d]"
                    >
                      {/* Front: Word */}
                      <div className="absolute inset-0 luminary-glass luminary-border [backface-visibility:hidden] rounded-[3rem] p-12 flex flex-col items-center justify-center text-center shadow-2xl">
                         <div className="absolute top-10 left-10 p-3 bg-[var(--primary)]/10 rounded-xl text-[var(--primary)] border border-[var(--primary)]/20">
                            <Volume2 size={24} onClick={(e) => { e.stopPropagation(); speak(words[currentCardIndex].word); }} />
                         </div>
                         <h2 className="text-6xl md:text-7xl font-black font-manrope tracking-tighter text-[var(--on-background)] group-hover:text-[var(--primary)] transition-colors mb-4 italic">
                            {words[currentCardIndex].word}
                         </h2>
                         <p className="text-sm font-black text-on-background/20 uppercase tracking-[0.4em] mt-8">点击翻转查看释义</p>
                      </div>

                      {/* Back: Translation & Example */}
                      <div className="absolute inset-0 luminary-glass luminary-border [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-[3rem] p-12 flex flex-col items-center justify-center text-center shadow-2xl bg-[var(--primary)]/5">
                        <div className="space-y-8">
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--primary)] mb-4 block">核心释义</span>
                            <h3 className="text-4xl font-black text-[var(--on-background)] font-manrope tracking-tight leading-snug">
                              {words[currentCardIndex].translation}
                            </h3>
                          </div>
                          <div className="pt-8 border-t border-[var(--primary)]/10">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--on-background)]/30 mb-4 block">语境案例</span>
                            <p className="text-lg font-medium text-[var(--on-background)]/70 leading-relaxed italic italic font-serif">
                              "{words[currentCardIndex].example}"
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Action Buttons */}
                    <AnimatePresence>
                      {isFlipped && (
                        <motion.div 
                          initial={{ opacity: 0, y: 40 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 20 }}
                          className="mt-12 flex gap-4 w-full"
                        >
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleReviewAction('new'); }}
                            className="flex-1 bg-rose-500/10 border-2 border-rose-500/30 text-rose-500 py-6 rounded-3xl font-black uppercase tracking-[0.1em] text-xs hover:bg-rose-500 hover:text-white transition-all shadow-lg active:scale-95"
                          >
                            不认识
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleReviewAction('reviewing'); }}
                            className="flex-1 bg-amber-500/10 border-2 border-amber-500/30 text-amber-500 py-6 rounded-3xl font-black uppercase tracking-[0.1em] text-xs hover:bg-amber-500 hover:text-white transition-all shadow-lg active:scale-95"
                          >
                            模糊
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleReviewAction('mastered'); }}
                            className="flex-1 bg-[var(--primary)] border-2 border-[var(--primary)] text-[var(--on-primary)] py-6 rounded-3xl font-black uppercase tracking-[0.1em] text-xs hover:scale-105 transition-all shadow-[0_20px_40px_rgba(186,158,255,0.3)] active:scale-95"
                          >
                            已掌握
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Sidebar (only visible when not in review mode) */}
          {!isReviewMode && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
              className="fixed right-0 top-0 h-full w-full max-w-lg bg-[var(--background)] border-l luminary-border shadow-[-50px_0_100px_rgba(0,0,0,0.5)] z-[101] flex flex-col overflow-hidden transition-colors duration-500"
            >
              {/* Background Decor */}
              <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[var(--primary)]/10 blur-[100px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[var(--secondary)]/8 blur-[80px] rounded-full" />
              </div>

              {/* Header */}
              <div className="p-10 border-b luminary-border space-y-8 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-[var(--primary)]/10 rounded-2xl text-[var(--primary)] border border-[var(--primary)]/20 shadow-inner">
                      <BookOpen size={28} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black font-manrope tracking-tighter text-[var(--on-background)]">
                        灵动词库
                      </h2>
                      <p className="text-[10px] font-black text-[var(--outline)] uppercase tracking-[0.3em]">词块档案馆</p>
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
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--outline)] group-focus-within:text-[var(--primary)] transition-all" size={20} />
                  <input 
                    type="text"
                    placeholder="搜索词库存档..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[var(--on-background)]/5 border border-[var(--on-background)]/5 rounded-[2rem] py-5 pl-16 pr-6 focus:outline-none focus:ring-4 focus:ring-[var(--primary)]/10 transition-all text-[var(--primary)] placeholder-[var(--outline)] font-manrope font-black text-sm tracking-widest uppercase shadow-inner"
                  />
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto px-10 py-6 space-y-8 custom-scrollbar relative z-10">
                {loading ? (
                  <div className="h-full flex flex-col items-center justify-center gap-6">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-[var(--on-background)]/5 rounded-full" />
                      <div className="absolute inset-0 w-16 h-16 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(186,158,255,0.4)]" />
                    </div>
                    <p className="text-[10px] font-black text-[var(--outline)] uppercase tracking-[0.3em] animate-pulse">正在同步云端数据库...</p>
                  </div>
                ) : filteredWords.length > 0 ? (
                  filteredWords.map((word, i) => (
                    <motion.div
                      key={word.id}
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
                          <h3 className="text-3xl font-black text-[var(--on-background)] font-manrope tracking-tighter group-hover:text-[var(--primary)] transition-colors">{word.word}</h3>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs text-[var(--outline)] font-black tracking-widest uppercase">{word.status === 'mastered' ? 'ALREADY MASTERED' : word.status === 'reviewing' ? 'IN REVIEW' : 'NEW ACQUISITION'}</span>
                            <button 
                              onClick={(e) => { e.stopPropagation(); speak(word.word); }}
                              className="p-2 bg-[var(--on-background)]/5 rounded-lg text-[var(--primary)] hover:bg-[var(--primary)] hover:text-[var(--on-primary)] transition-all shadow-xl"
                            >
                              <Volume2 size={16} strokeWidth={3} />
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-3">
                           <div className={cn(
                             "px-4 py-1.5 rounded-full border text-[10px] font-black tracking-widest uppercase",
                             word.status === 'mastered' ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/30" : 
                             word.status === 'reviewing' ? "text-amber-400 bg-amber-400/10 border-amber-400/30" : 
                             "text-[var(--primary)] bg-[var(--primary)]/10 border-[var(--primary)]/30"
                           )}>
                             {word.status}
                           </div>
                           <button
                             onClick={(e) => { e.stopPropagation(); handleDeleteWord(word.word); }}
                             className="p-2 rounded-xl text-[var(--outline)] hover:text-rose-400 hover:bg-rose-400/10 transition-all"
                             title="删除单词"
                           >
                             <Trash2 size={16} strokeWidth={2.5} />
                           </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-[var(--outline)] relative z-10">
                        <CheckCircle2 size={14} className={word.status === 'mastered' ? "text-emerald-400" : "opacity-20"} />
                        <span>{word.translation.substring(0, 30)}{word.translation.length > 30 ? '...' : ''}</span>
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
              <div className="p-10 border-t luminary-border bg-[var(--on-background)]/5 relative z-10">
                <button 
                  className="w-full bg-[var(--primary)] py-6 rounded-3xl text-[var(--on-primary)] font-black uppercase tracking-[0.2em] text-sm shadow-[0_20px_50px_rgba(186,158,255,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group disabled:opacity-50 disabled:grayscale"
                  onClick={startReview}
                  disabled={words.length === 0}
                >
                  <Brain size={20} strokeWidth={3} className="fill-current" />
                  开启词汇抗遗忘训练
                  <ChevronRight size={20} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
