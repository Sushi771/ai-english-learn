"use client";

import React, { useState, useEffect } from "react";
import { 
  Mic, 
  Settings, 
  Search,
  History,
  LayoutDashboard,
  BookMarked,
  Sparkles,
  Zap,
  RefreshCw,
  ChevronRight,
  ShieldCheck,
  Compass
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { getDashboardStats, getRecentSessions, forgeScenario } from "@/lib/api";
import Challenge from "./Challenge";
import Link from "next/link";

const formatDate = (dateStr: string) => {
  if (!dateStr) return "未知时间";
  try {
    const d = new Date(dateStr);
    const diff = Date.now() - d.getTime();
    if (diff < 3600000) return "Just Now";
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  } catch {
    return dateStr;
  }
};

interface AIDashboardProps {
  onStartSession: (scenario?: string) => void;
  onOpenWordBank: () => void;
}

const AIDashboard = ({ onStartSession, onOpenWordBank }: AIDashboardProps) => {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [showChallenge, setShowChallenge] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isForging, setIsForging] = useState(false);

  useEffect(() => {
    // Check for level - if not set, redirect to placement
    const level = localStorage.getItem("user_level");
    if (!level) {
      router.push("/placement");
      return;
    }

    const fetchData = async () => {
      try {
        const [statsData, sessions] = await Promise.all([
          getDashboardStats(),
          getRecentSessions()
        ]);
        setStats(statsData);
        setRecentSessions(sessions);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      }
    };
    fetchData();
  }, [router]);

  const handleForge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || isForging) return;
    
    setIsForging(true);
    try {
        const scenario = await forgeScenario(searchQuery);
        // UX Persistence: Store the forged data for the session to pick up
        if (typeof window !== "undefined") {
            sessionStorage.setItem("custom_scenario", JSON.stringify(scenario));
        }
        onStartSession(scenario.title);
    } catch (err) {
        console.error("Forge failed", err);
    } finally {
        setIsForging(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans overflow-x-hidden selection:bg-indigo-500/30">
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600/10 blur-[120px] rounded-full" />
        <div className="absolute top-1/2 -left-24 w-80 h-80 bg-blue-600/5 blur-[100px] rounded-full" />
      </div>

      <nav className="relative z-10 flex justify-between items-center px-8 py-8 border-b border-slate-900 border-dashed">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Mic className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">智学英语 AI</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-bold uppercase tracking-widest">{stats?.level || "..."} Proficiency</span>
          </div>
          <Link href="/settings" className="p-2 text-slate-400 hover:text-white transition-colors">
            <Settings className="w-6 h-6" />
          </Link>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-8 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Main Console */}
        <div className="lg:col-span-8 space-y-12">
          {/* Level 0 Foundation Banner */}
          {stats?.level === "Level 0" && (
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="p-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-blue-700 border border-indigo-400/30 shadow-2xl shadow-indigo-500/20 relative overflow-hidden group"
            >
                <div className="relative z-10 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] font-black uppercase tracking-widest text-white">
                        Absolute Beginner Path
                    </div>
                    <h2 className="text-3xl font-black text-white leading-tight">Start Your Foundations</h2>
                    <p className="text-indigo-100 max-w-md">You're at the beginning of your journey. Let's master the alphabet and phonetics before diving into conversations.</p>
                    <Link href="/foundation" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 font-black rounded-2xl hover:bg-indigo-50 transition-all active:scale-95 shadow-xl">
                        Launch Phase 1 <ChevronRight size={18} />
                    </Link>
                </div>
                <BookMarked className="absolute right-[-5%] bottom-[-10%] w-64 h-64 text-white/5 -rotate-12 group-hover:rotate-0 transition-transform duration-700" />
            </motion.div>
          )}

          {/* Neural Forge - Search Focused */}
          <section className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-4xl font-black tracking-tight flex items-center gap-3 text-white">
                   Neural Forge <Sparkles className="w-6 h-6 text-indigo-400" />
                </h1>
                <p className="text-slate-400">Input any scenario. AI builds the linguistic blueprint for you.</p>
            </div>
            
            <form onSubmit={handleForge} className="relative group">
                <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                    <Search className={`w-5 h-5 transition-colors ${isForging ? "text-indigo-400 animate-pulse" : "text-slate-500 group-focus-within:text-indigo-400"}`} />
                </div>
                <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isForging ? "Fabricating scenario..." : "e.g. Discussing the future of EV at Tesla, Job interview for Senior Dev..."}
                    className="w-full bg-slate-900 border border-slate-800 rounded-3xl pl-16 pr-32 py-6 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-700"
                />
                <div className="absolute inset-y-2 right-2">
                    <button 
                        type="submit"
                        disabled={isForging}
                        className="h-full px-8 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-bold rounded-2xl transition-all flex items-center gap-2 group-active:scale-95"
                    >
                        {isForging ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Forge"}
                    </button>
                </div>
            </form>
          </section>

          {/* Core Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button 
              onClick={() => onStartSession()}
              className="p-8 rounded-3xl bg-indigo-600/10 border border-indigo-500/20 hover:bg-indigo-600/20 transition-all text-left flex flex-col gap-6 group"
            >
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">Adaptive Immersion</h3>
                <p className="text-sm text-slate-400">Randomized scenarios at {stats?.level}+1 level.</p>
              </div>
            </button>

            <button 
              onClick={() => setShowChallenge(true)}
              className="p-8 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all text-left flex flex-col gap-6"
            >
              <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-400">
                <Compass className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">Vocabulary Audit</h3>
                <p className="text-sm text-slate-400">Review linguistic weak points identified by AI.</p>
              </div>
            </button>
          </div>

          {/* History */}
          <section className="space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2 text-slate-500">
              <History className="w-4 h-4" /> RECENT TRAJECTORY
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {recentSessions.length > 0 ? recentSessions.slice(0, 5).map((session, i) => (
                <div 
                  key={session.id || i}
                  onClick={() => onStartSession(session.topic)}
                  className="p-5 rounded-2xl bg-slate-900/50 border border-slate-900 hover:bg-slate-900 transition-colors cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-indigo-400 transition-colors">
                      <LayoutDashboard className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-200">{session.topic}</h4>
                      <p className="text-xs text-slate-500 uppercase tracking-widest">{formatDate(session.started_at)}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-slate-400" />
                </div>
              )) : (
                <div className="py-12 text-center border border-dashed border-slate-800 rounded-3xl text-slate-600">
                  No previous neural traces detected.
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar Intelligence */}
        <aside className="lg:col-span-4 space-y-8">
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-8">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-400 tracking-widest uppercase text-xs">Linguistic DNA</h3>
                    <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                        <BookMarked className="w-4 h-4" />
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex justify-between items-end">
                        <div>
                            <div className="text-xs text-slate-500 mb-1">ACQUIRED LEXICON</div>
                            <div className="text-3xl font-black">{stats?.vocabularyCount || 0}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-slate-500 mb-1">DUE AUDIT</div>
                            <div className="text-lg font-bold text-indigo-400">{stats?.dueCount || 0}</div>
                        </div>
                    </div>
                    
                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, ((stats?.vocabularyCount || 0) / 1000) * 100)}%` }}
                            className="h-full bg-indigo-500"
                        />
                    </div>
                </div>

                <button 
                  onClick={onOpenWordBank}
                  className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-lg shadow-indigo-500/10 active:scale-95"
                >
                  Inspect Word Bank
                </button>
            </div>

            <div className="p-8 rounded-3xl border border-slate-800 bg-slate-900/30">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <RefreshCw className="w-3 h-3" /> Adaptive Note
                </h4>
                <p className="text-slate-400 italic leading-relaxed text-sm">
                    "Your fluency in workplace scenarios at <span className="text-slate-100 font-bold">{stats?.level || 'A1'}</span> level is stabilizing. We've queued several difficulty idioms for your next Forge session."
                </p>
            </div>
        </aside>
      </main>
      
      <AnimatePresence>
        {showChallenge && (
          <Challenge onClose={() => setShowChallenge(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIDashboard;
