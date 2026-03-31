"use client";

import React, { useState, useEffect } from "react";
import { 
  BarChart3, 
  Mic, 
  BookOpen, 
  Settings, 
  Plus, 
  Clock, 
  ChevronRight,
  Trophy
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getDashboardStats, getWordBank, getRecentSessions } from "@/lib/api";
import ThemeToggle from "./ThemeToggle";

interface DashboardProps {
  onStartSession: (scenario: string) => void;
  onOpenWordBank: () => void;
}

const Dashboard = ({ onStartSession, onOpenWordBank }: DashboardProps) => {
  const [stats, setStats] = useState<any>(null);
  const [wordCount, setWordCount] = useState(0);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsData, words, sessions] = await Promise.all([
          getDashboardStats(),
          getWordBank(),
          getRecentSessions()
        ]);
        setStats(statsData);
        setWordCount(words.length);
        setRecentSessions(sessions);
      } catch (err) {
        console.error("Dashboard data fetch error:", err);
      }
    };
    fetchDashboardData();
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "未知时间";
    try {
      const d = new Date(dateStr);
      const diff = Date.now() - d.getTime();
      if (diff < 3600000) return "刚刚";
      if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
      return d.toLocaleDateString("zh-CN");
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background p-6 md:p-10 selection:bg-primary/30 transition-colors duration-500">
      {/* Top Nav */}
      <nav className="max-w-luminary-wide mx-auto flex justify-between items-center mb-16 px-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/20">
            <Mic className="w-6 h-6 text-on-primary" />
          </div>
          <span className="text-2xl font-black tracking-tighter uppercase font-manrope">Luminary AI</span>
        </div>
        <div className="flex items-center gap-6">
          <ThemeToggle />
          <div className="w-12 h-12 rounded-2xl bg-surface-container border border-outline-variant flex items-center justify-center text-on-background/40 hover:text-primary transition-all cursor-pointer">
            <Settings className="w-6 h-6" />
          </div>
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-surface-container-high to-surface-container border border-outline-variant shadow-inner" />
        </div>
      </nav>

      <div className="max-w-luminary-wide mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 px-4">
        {/* Left Column: Progress & Stats */}
        <div className="lg:col-span-8 space-y-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden luminary-card p-10 group"
          >
            <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-10">
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">Synchronized Profile</p>
                <h2 className="text-4xl font-bold tracking-tight">欢迎回来, Alex</h2>
                <div className="flex items-center gap-4">
                   <div className="px-4 py-1.5 bg-primary/10 text-primary rounded-xl text-xs font-black border border-primary/20 tracking-widest uppercase">
                     LV.{stats?.level || 1}
                   </div>
                   <p className="text-on-background/40 text-sm font-medium italic">Next Milestone: {500 - ((stats?.points || 0) % 500)} XP remaining</p>
                </div>
              </div>
              <div className="flex flex-row md:flex-col items-center md:items-end gap-6">
                <div className="flex items-center gap-3 bg-secondary/10 text-secondary px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest border border-secondary/20">
                  <Trophy className="w-4 h-4" />
                  <span>{stats?.streak || 0} DAY STREAK</span>
                </div>
                <div className="text-[10px] text-on-background/20 font-black uppercase tracking-[0.2em]">CUMULATIVE: {stats?.points || 0} XP</div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="80" cy="80" r="72" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-on-background/5" />
                  <circle cx="80" cy="80" r="72" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray="452" strokeDashoffset={452 - (452 * (stats?.dailyGoalProgress || 0)) / 100} className="text-primary transition-all duration-1000 ease-out" strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold tracking-tighter">{stats?.dailyGoalProgress || 0}</span>
                  <span className="text-[10px] text-on-background/30 font-bold uppercase tracking-widest">% GOAL</span>
                </div>
              </div>
              
              <div className="flex-1 w-full grid grid-cols-2 gap-6">
                <div className="bg-on-background/5 rounded-3xl p-6 border border-on-background/5 group-hover:border-primary/20 transition-all">
                  <p className="text-[10px] text-on-background/30 font-black uppercase tracking-[0.2em] mb-2">Lexicon Index</p>
                  <p className="text-3xl font-bold tracking-tight">{wordCount} <span className="text-xs font-medium text-on-background/40">Words</span></p>
                </div>
                <div className="bg-on-background/5 rounded-3xl p-6 border border-on-background/5 group-hover:border-primary/20 transition-all">
                  <p className="text-[10px] text-on-background/30 font-black uppercase tracking-[0.2em] mb-2">Growth Score</p>
                  <p className="text-3xl font-bold tracking-tight text-primary">{stats?.points || 0} <span className="text-xs font-medium text-on-background/40">XP</span></p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Recent Sessions */}
          <section className="space-y-8">
            <div className="flex justify-between items-end border-b border-on-background/5 pb-4">
              <div className="space-y-1">
                <h3 className="text-2xl font-bold tracking-tight">最近练习</h3>
                <p className="text-xs text-on-background/30 font-medium italic">Tracking your linguistic transformation</p>
              </div>
              <button className="text-primary text-[10px] font-black uppercase tracking-widest hover:text-primary-container transition-colors">Archive View</button>
            </div>
            <div className="space-y-4">
              {recentSessions.length > 0 ? recentSessions.map((session, i) => (
                <motion.div 
                  key={session.id || i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => onStartSession(session.topic)}
                  className="group flex items-center justify-between p-6 bg-surface-container/30 border border-outline-variant/30 hover:border-primary/40 rounded-3xl transition-all cursor-pointer hover:bg-surface-container shadow-sm hover:shadow-xl"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-on-background/5 rounded-2xl flex items-center justify-center group-hover:bg-primary transition-all duration-500">
                      <Clock className="w-6 h-6 text-on-background/40 group-hover:text-on-primary transition-colors" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold group-hover:text-primary transition-colors">{session.topic}</h4>
                      <p className="text-xs text-on-background/40 font-medium">{formatDate(session.started_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-10">
                    <div className="text-right">
                      <p className="text-[10px] text-on-background/20 font-black uppercase tracking-widest mb-1">ACCURACY</p>
                      <p className="text-xl font-black text-primary italic">{session.score || "--"}%</p>
                    </div>
                    <div className="p-3 bg-secondary/10 group-hover:bg-primary rounded-xl transition-all">
                      <ChevronRight className="w-5 h-5 text-secondary group-hover:text-on-primary transition-all" />
                    </div>
                  </div>
                </motion.div>
              )) : (
                <div className="p-12 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
                   <p className="text-gray-500">尚无练习记录，开始您的第一场对话吧！</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Word Bank & CTA */}
        <div className="lg:col-span-4 space-y-10">
          <motion.div 
            whileHover={{ scale: 1.02, y: -5 }}
            onClick={() => onStartSession("Free Chat")}
            className="cursor-pointer bg-gradient-to-br from-primary to-primary-container rounded-[3rem] p-10 shadow-3xl shadow-primary/30 relative group overflow-hidden border border-white/20"
          >
            <div className="relative z-10 text-on-primary">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-8 group-hover:rotate-90 transition-transform duration-700">
                <Plus className="w-10 h-10" />
              </div>
              <h3 className="text-3xl font-bold tracking-tight mb-3">开启新对话</h3>
              <p className="text-on-primary/70 text-sm leading-relaxed font-medium">进入实时 AI 语境对练，建立深层肌肉记忆。</p>
            </div>
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
          </motion.div>

          <div className="luminary-card p-8 border border-outline-variant/30">
            <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-primary" />
              生词本 <span className="text-[10px] font-black text-on-background/20 tracking-[0.2em] uppercase">Lexicon</span>
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-5 bg-surface-container/50 rounded-2xl border border-outline-variant/20 hover:border-primary/20 transition-all">
                <span className="text-xs font-black uppercase tracking-widest text-on-background/40">Repository</span>
                <span className="text-lg font-bold">{wordCount} <span className="text-[10px] text-primary">WORDS</span></span>
              </div>
              <div className="flex justify-between items-center p-5 bg-surface-container/50 rounded-2xl border border-outline-variant/20 hover:border-primary/20 transition-all">
                <span className="text-xs font-black uppercase tracking-widest text-on-background/40">Spaced Recurrence</span>
                <span className="text-lg font-bold text-secondary">{stats?.dueCount || 0} <span className="text-[10px] text-secondary/60">DUE</span></span>
              </div>
            </div>
            <button 
              onClick={onOpenWordBank}
              className="w-full mt-8 py-5 bg-primary text-on-primary rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
            >
              Enter Word Bank
            </button>
          </div>
          
          {/* Quick Start Tip */}
          <div className="p-8 rounded-[3rem] bg-surface-container-low border border-outline-variant/30 border-l-primary border-l-8">
            <p className="text-[10px] text-primary font-black uppercase tracking-[0.3em] mb-4">Linguistic Insight</p>
            <p className="text-lg text-on-background/70 leading-relaxed font-medium italic opacity-80 serif">
              "试着练习一下以 'th' 开头的单词，比如 'thorough' —— 在你上一次练习中，这里稍微有一点不连贯。"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
