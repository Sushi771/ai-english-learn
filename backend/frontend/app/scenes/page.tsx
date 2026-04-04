"use client";

import React, { useState, useEffect } from 'react';
import { 
  Search, Plane, Coffee, Hotel, Briefcase, ChefHat, 
  GraduationCap, Sparkles, ChevronRight, ChevronLeft,
  Filter, Zap, RefreshCw, Mic, ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { forgeScenario } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

const scenes = [
  { id: 'airport', icon: Plane, title: 'Airport Check-in', level: 'A1', desc: 'Navigate the check-in counter and security protocols.', difficulty: 1 },
  { id: 'cafe', icon: Coffee, title: 'Barista Service', level: 'A1', desc: 'Practice complex orders and casual dialogue.', difficulty: 1 },
  { id: 'hotel', icon: Hotel, title: 'Hotel Reservation', level: 'A2', desc: 'Handle check-in, room service, and billing inquiries.', difficulty: 2 },
  { id: 'interview', icon: Briefcase, title: 'Engineering Interview', level: 'B2', desc: 'Simulate high-stakes technical and behavioral interviews.', difficulty: 4 },
  { id: 'restaurant', icon: ChefHat, title: 'Fine Dining', level: 'B1', desc: 'Order from a complex menu and discuss dietary needs.', difficulty: 3 },
  { id: 'school', icon: GraduationCap, title: 'Academic Life', level: 'A2', desc: 'Basic interactions with peers and professors.', difficulty: 2 },
];

export default function SceneSelector() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [userLevel, setUserLevel] = useState('A1');
  const router = useRouter();

  useEffect(() => {
    const level = localStorage.getItem('user_level') || 'A1';
    setUserLevel(level);
  }, []);

  const handleForge = async (query: string) => {
    setIsGenerating(true);
    try {
      const scenario = await forgeScenario(query);
      router.push(`/session?scenario=${encodeURIComponent(scenario.title)}&isCustom=true`);
    } catch (err) {
      console.error("Forge failed", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredScenes = scenes.filter(scene => 
    scene.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    scene.desc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--on-background)] p-6 md:p-12 font-sans selection:bg-[var(--primary)]/30">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none opacity-40">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--primary)]/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[var(--secondary)]/10 blur-[100px] rounded-full" />
      </div>

      <header className="sticky top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-6 luminary-glass luminary-border mb-8">
        <Link href="/dashboard" className="flex items-center gap-2 text-[var(--outline)] hover:text-[var(--primary)] transition-colors">
            <ChevronLeft size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Back to Console</span>
        </Link>
        <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="flex items-center gap-2 px-3 py-1.5 luminary-glass luminary-border rounded-lg text-[var(--on-background)]">
                <Filter className="w-3 h-3 text-[var(--secondary)]" />
                <span className="text-[8px] font-black uppercase tracking-widest opacity-50">Level</span>
                <span className="text-xs font-bold">{userLevel}</span>
            </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto mb-12 relative z-10">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
            <div className="space-y-4">
                <h1 className="display-lg text-4xl md:text-6xl flex items-center gap-4">
                    Scenario Forge <Mic className="w-8 h-8 text-[var(--primary)]" />
                </h1>
                <p className="opacity-60 text-lg max-w-xl">
                    Select a curated track or use the Neural Forge to create a custom linguistic context.
                </p>
            </div>
            
            <div className="flex items-center gap-4">
                <ThemeToggle />
                <div className="flex items-center gap-3 px-4 py-2 luminary-glass luminary-border rounded-xl text-[var(--on-background)] transition-all">
                    <Filter className="w-4 h-4 text-[var(--secondary)]" />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-50 text-[var(--on-background)]">Current Level</span>
                    <span className="text-sm font-bold">{userLevel}</span>
                </div>
            </div>
        </div>
        
        <div className="relative group max-w-3xl">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--outline)] group-focus-within:text-[var(--primary)] transition-colors" size={20} />
          <input 
            type="text"
            placeholder="Search scenarios or type any custom context..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleForge(searchTerm)}
            className="w-full luminary-glass luminary-border rounded-3xl py-6 pl-16 pr-32 text-lg focus:outline-none focus:ring-4 focus:ring-[var(--primary)]/10 transition-all placeholder:text-[var(--outline)]"
          />
          <button 
            onClick={() => handleForge(searchTerm)}
            className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-3 bg-[var(--primary)] text-[var(--on-primary)] font-black uppercase tracking-widest text-xs rounded-2xl transition-all flex items-center gap-2 active:scale-95 shadow-lg shadow-[var(--primary)]/20"
          >
            Forge <Zap className="w-4 h-4" />
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10 pb-20">
        <AnimatePresence>
            {isGenerating && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 luminary-glass backdrop-blur-md flex flex-col items-center justify-center gap-6"
                >
                    <div className="w-16 h-16 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                    <p className="text-[10px] font-black text-[var(--primary)] uppercase tracking-widest animate-pulse">Fabricating contextual blueprint...</p>
                </motion.div>
            )}
        </AnimatePresence>

        {filteredScenes.map((scene, index) => (
          <motion.div
            key={scene.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -8 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
                "p-6 md:p-10 luminary-card flex flex-col group cursor-pointer relative overflow-hidden",
                userLevel === scene.level ? "ring-2 ring-[var(--primary)]/20 shadow-2xl shadow-[var(--primary)]/10" : ""
            )}
            onClick={() => router.push(`/session?scenario=${encodeURIComponent(scene.title)}`)}
          >
            <div className="flex items-center justify-between mb-8">
              <div className="w-16 h-16 bg-[var(--surface-container-high)] luminary-border rounded-2xl flex items-center justify-center text-[var(--primary)] group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-xl">
                <scene.icon size={32} />
              </div>
              <div className={cn(
                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border luminary-border",
                scene.difficulty <= 1 ? "text-emerald-400" :
                scene.difficulty <= 3 ? "text-amber-400" :
                "text-rose-400"
              )}>
                Level {scene.level}
              </div>
            </div>

            <h3 className="headline-md text-2xl mb-3">{scene.title}</h3>
            <p className="opacity-60 text-sm leading-relaxed mb-10 flex-1">
              {scene.desc}
            </p>

            <button className="w-full py-4 luminary-glass luminary-border hover:bg-[var(--primary)] hover:text-[var(--on-primary)] rounded-[1.5rem] flex items-center justify-center gap-2 transition-all text-[10px] font-black uppercase tracking-widest group-hover:shadow-2xl">
              Launch Session <ArrowUpRight className="w-4 h-4 shadow-sm" />
            </button>
            
            {userLevel === scene.level && (
                <div className="absolute top-3 right-3">
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-[var(--primary)] text-[var(--on-primary)] rounded-lg text-[8px] font-black uppercase tracking-widest shadow-xl shadow-[var(--primary)]/20">
                        <Sparkles size={8} /> IDEAL MATCH
                    </div>
                </div>
            )}
          </motion.div>
        ))}
        
        {/* Empty State */}
        {filteredScenes.length === 0 && !isGenerating && (
            <div className="col-span-full py-20 text-center border-2 border-dashed luminary-border rounded-[3rem] space-y-4">
                <div className="w-16 h-16 luminary-glass luminary-border rounded-full flex items-center justify-center mx-auto text-[var(--outline)]">
                    <Search className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                    <h3 className="text-xl font-bold opacity-80">No matches found</h3>
                    <p className="opacity-40 text-sm">Hit 'Enter' or click 'Forge' to build this custom scenario.</p>
                </div>
            </div>
        )}
      </main>
    </div>
  );
}
