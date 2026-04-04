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
  Compass,
  ArrowUpRight,
  TrendingUp,
  BrainCircuit
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { getDashboardStats, getRecentSessions, forgeScenario, getLearningStreak } from "@/lib/api";
import Challenge from "./Challenge";
import Link from "next/link";
import { cn } from "@/lib/utils";
import ThemeToggle from "./ThemeToggle";

const formatDate = (dateStr: string) => {
  if (!dateStr) return "Just Now";
  try {
    const d = new Date(dateStr);
    const diff = Date.now() - d.getTime();
    if (diff < 3600000) return "Moments ago";
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
  const [streakData, setStreakData] = useState<{ streak: number; total_days: number } | null>(null);
  const [loadingStreak, setLoadingStreak] = useState(true);

  useEffect(() => {
    const level = localStorage.getItem("user_level");
    if (!level) {
      router.push("/placement");
      return;
    }

    const fetchData = async () => {
      try {
        const [statsData, sessions, streak] = await Promise.all([
          getDashboardStats(),
          getRecentSessions(),
          getLearningStreak()
        ]);
        setStats(statsData);
        setRecentSessions(sessions);
        setStreakData(streak);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoadingStreak(false);
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
    <div className="min-h-screen bg-[var(--background)] text-[var(--on-background)] font-sans selection:bg-[var(--primary)]/20 overflow-x-hidden">
      {/* Ambient Lighting */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-[var(--primary)]/10 blur-[140px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-[var(--secondary)]/10 blur-[120px] rounded-full" />
      </div>

      {/* Navigation - The Digital Luminary Style */}
      <nav className="relative z-50 flex justify-between items-center px-6 md:px-12 py-8 bg-transparent">
        <div className="flex items-center gap-4 group">
          <div className="w-12 h-12 luminary-glass luminary-border rounded-2xl flex items-center justify-center shadow-2xl glow-primary transition-transform group-hover:scale-110">
            <BrainCircuit className="text-[var(--primary)] w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="display-lg text-2xl md:text-3xl bg-clip-text text-transparent bg-gradient-to-r from-[var(--on-background)] to-[var(--on-background)]/60">
              Antigravity AI
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--primary)]">Neural Immersion Engine</span>
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-8">
          <ThemeToggle />
          <div className="hidden md:flex items-center gap-3 px-5 py-2.5 luminary-glass luminary-border rounded-full">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest opacity-80">
                {stats?.level || "..."} PROFICIENCY
            </span>
          </div>
          <Link href="/settings" className="p-3 luminary-glass luminary-border rounded-xl text-[var(--on-background)] hover:text-[var(--primary)] transition-all hover:scale-110">
            <Settings className="w-5 h-5" />
          </Link>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Main Interface Console */}
        <div className="lg:col-span-8 space-y-16">
          
          {/* Hero Welcome */}
          <section className="space-y-6">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-2"
            >
                <div className="inline-flex items-center gap-2 text-[var(--primary)] mb-2">
                    <Sparkles size={16} />
                    <span className="text-xs font-black uppercase tracking-[0.25em]">Ready for immersion</span>
                </div>
                <h1 className="display-lg text-5xl md:text-7xl">
                    What should we <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]">forge</span> today?
                </h1>
            </motion.div>

            {/* Neural Forge - Floating Pill */}
            <form onSubmit={handleForge} className="relative group max-w-2xl">
                <div className="absolute inset-y-0 left-8 flex items-center pointer-events-none">
                    <Search className={cn(
                        "w-6 h-6 transition-all",
                        isForging ? "text-[var(--primary)] animate-spin" : "text-[var(--outline)] group-focus-within:text-[var(--primary)]"
                    )} />
                </div>
                <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isForging ? "Fabricating linguistic context..." : "Describe any scenario (e.g. A job interview at SpaceX)"}
                    className="w-full luminary-glass luminary-border rounded-[2.5rem] pl-20 pr-40 py-8 text-lg focus:outline-none focus:ring-4 focus:ring-[var(--primary)]/10 transition-all placeholder:text-[var(--outline)] shadow-2xl"
                />
                <div className="absolute inset-y-3 right-3 flex items-center">
                    <button 
                        type="submit"
                        disabled={isForging}
                        className="h-full px-10 bg-[var(--primary)] text-[var(--on-primary)] font-black uppercase tracking-widest text-xs rounded-[2rem] hover:opacity-90 transition-all flex items-center gap-3 active:scale-95 shadow-xl shadow-[var(--primary)]/20"
                    >
                        {isForging ? <RefreshCw className="w-4 h-4 animate-spin" /> : <>Forge <ArrowUpRight size={18}/></>}
                    </button>
                </div>
            </form>
          </section>

          {/* Quick Access Blocks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.button 
              whileHover={{ y: -8 }}
              onClick={() => onStartSession()}
              className="p-10 luminary-card text-left flex flex-col gap-10 group relative overflow-hidden"
            >
              <div className="w-16 h-16 bg-[var(--primary)] rounded-[1.5rem] flex items-center justify-center text-[var(--on-primary)] shadow-2xl shadow-[var(--primary)]/30 group-hover:rotate-6 transition-transform">
                <Mic className="w-8 h-8" />
              </div>
              <div>
                <h3 className="headline-md mb-2">Voice Sanctuary</h3>
                <p className="text-sm opacity-60 leading-relaxed max-w-[200px]">Enter an immersive environment for fluid real-time dialogue.</p>
              </div>
              <div className="absolute top-8 right-8 p-3 rounded-full bg-[var(--on-background)]/5 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUpRight size={20} />
              </div>
            </motion.button>

            <motion.button 
              whileHover={{ y: -8 }}
              onClick={onOpenWordBank}
              className="p-10 luminary-card text-left flex flex-col gap-10 group relative overflow-hidden border-dashed"
            >
              <div className="w-16 h-16 bg-[var(--surface-container-high)] rounded-[1.5rem] flex items-center justify-center text-[var(--primary)] shadow-xl group-hover:-rotate-6 transition-transform">
                <BookMarked className="w-8 h-8" />
              </div>
              <div>
                <h3 className="headline-md mb-2">Lexical Vault</h3>
                <p className="text-sm opacity-60 leading-relaxed max-w-[200px]">Review and audit the linguistic DNA you've acquired.</p>
              </div>
              <div className="absolute top-8 right-8 p-3 rounded-full bg-[var(--on-background)]/5 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUpRight size={20} />
              </div>
            </motion.button>
          </div>

          {/* Neural Traces (History) */}
          <section className="space-y-8">
            <div className="flex items-center justify-between border-b luminary-border border-x-0 border-t-0 pb-6">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] opacity-40 flex items-center gap-3">
                    <History className="w-4 h-4" /> Neural Traces
                </h3>
                <Link href="/history" className="text-[10px] font-black uppercase tracking-widest text-[var(--primary)] hover:opacity-70">
                    View Full Archive
                </Link>
            </div>

            <div className="space-y-4">
              {recentSessions.length > 0 ? recentSessions.slice(0, 3).map((session, i) => (
                <div 
                  key={session.id || i}
                  onClick={() => onStartSession(session.topic)}
                  className="p-6 luminary-card flex items-center justify-between group cursor-pointer hover:bg-[var(--surface-bright)]/50"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--surface-container-high)] flex items-center justify-center text-[var(--outline)] group-hover:text-[var(--secondary)] transition-colors">
                      <LayoutDashboard size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg mb-0.5">{session.topic}</h4>
                      <div className="flex items-center gap-2 opacity-40 text-[10px] font-black uppercase tracking-widest">
                          <span>{formatDate(session.started_at)}</span>
                          <span className="w-1 h-1 rounded-full bg-[var(--outline)]" />
                          <span>Stable Fluency</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-2 rounded-full border luminary-border opacity-0 group-hover:opacity-100 transition-all">
                    <ChevronRight size={16} />
                  </div>
                </div>
              )) : (
                <div className="py-20 text-center border luminary-border border-dashed rounded-[2.5rem] opacity-30">
                  <p className="text-sm font-black uppercase tracking-widest">No traces detected in current timeline</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Intelligence Sidebar */}
        <aside className="lg:col-span-4 space-y-8">
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="p-10 luminary-card space-y-10 glow-primary bg-gradient-to-br from-[var(--surface-container)] to-[var(--background)]"
            >
                <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50">Pulse Monitor</h3>
                    <TrendingUp className="text-[var(--primary)] w-4 h-4" />
                </div>

                <div className="relative flex justify-center">
                    {/* Simplified Progress SVG */}
                    <svg className="w-48 h-48 -rotate-90">
                        <circle cx="96" cy="96" r="88" stroke="var(--outline-variant)" strokeWidth="4" fill="transparent" opacity="0.1" />
                        <motion.circle 
                            cx="96" cy="96" r="88" stroke="var(--primary)" strokeWidth="8" fill="transparent" strokeDasharray="553"
                            initial={{ strokeDashoffset: 553 }}
                            animate={{ strokeDashoffset: 553 - (553 * Math.min(100, ((stats?.vocabularyCount || 0) / 1000) * 100)) / 100 }}
                            strokeLinecap="round"
                            transition={{ duration: 2, ease: "easeOut" }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-4xl font-black">{stats?.vocabularyCount || 0}</span>
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Words Resolved</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-3xl bg-[var(--on-background)]/5 border luminary-border">
                        <div className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">Due Audit</div>
                        <div className="text-xl font-bold text-[var(--secondary)]">{stats?.dueCount || 0}</div>
                    </div>
                    <div className="p-4 rounded-3xl bg-[var(--on-background)]/5 border luminary-border">
                        <div className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">Streak</div>
                        <div className="text-xl font-bold text-[var(--primary)]">
                            {loadingStreak ? "—d" : `${streakData?.streak ?? 0}d`}
                        </div>
                    </div>
                </div>

                <button 
                  onClick={onOpenWordBank}
                  className="w-full py-5 rounded-[1.5rem] bg-[var(--on-background)] text-[var(--background)] font-black uppercase tracking-widest text-[10px] hover:opacity-90 transition-all"
                >
                  Enter Word Vault
                </button>
            </motion.div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-8 luminary-card border-none bg-[var(--primary)]/5"
            >
                <div className="flex items-center gap-3 mb-4">
                    <Compass className="w-4 h-4 text-[var(--primary)]" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest">Ethereal Note</h4>
                </div>
                <p className="text-sm italic opacity-70 leading-relaxed font-medium">
                    "Your synthesis of <span className="text-[var(--on-background)]">technical dialect</span> is evolving. I've prepared a Silicon Valley board meeting scenario for your next immersion."
                </p>
            </motion.div>
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
