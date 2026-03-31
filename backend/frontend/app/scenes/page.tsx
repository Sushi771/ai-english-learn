"use client";

import React, { useState, useEffect } from 'react';
import { 
  Search, Plane, Coffee, Hotel, Briefcase, ChefHat, 
  GraduationCap, Sparkles, ChevronRight, ChevronLeft,
  Filter, Zap, RefreshCw, Mic
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { forgeScenario } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Link from 'next/link';

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
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 sm:p-12 font-sans selection:bg-indigo-500/30">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none opacity-40">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/10 blur-[100px] rounded-full" />
      </div>

      <header className="max-w-5xl mx-auto mb-16 relative z-10">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-8 bg-slate-900/50 px-4 py-2 rounded-xl border border-slate-800">
            <ChevronLeft size={18} />
            <span className="text-xs font-bold uppercase tracking-widest">Back to Console</span>
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
            <div className="space-y-4">
                <h1 className="text-5xl font-black tracking-tight flex items-center gap-4">
                    Scenario Forge <Mic className="w-8 h-8 text-indigo-500" />
                </h1>
                <p className="text-slate-400 text-lg max-w-xl">
                    Select a curated track or use the Neural Forge to create a custom linguistic context.
                </p>
            </div>
            
            <div className="flex items-center gap-3 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl">
                <Filter className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Current Level:</span>
                <span className="text-sm font-bold text-white">{userLevel}</span>
            </div>
        </div>
        
        <div className="relative group max-w-3xl">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={20} />
          <input 
            type="text"
            placeholder="Search scenarios or type any custom context..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleForge(searchTerm)}
            className="w-full bg-slate-900 border border-slate-800 rounded-3xl py-6 pl-16 pr-32 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-700"
          />
          <button 
            onClick={() => handleForge(searchTerm)}
            className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all flex items-center gap-2 active:scale-95 text-sm"
          >
            Forge <Zap className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10 pb-20">
        <AnimatePresence>
            {isGenerating && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center gap-6"
                >
                    <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-black text-indigo-400 uppercase tracking-widest animate-pulse">Fabricating contextual blueprint...</p>
                </motion.div>
            )}
        </AnimatePresence>

        {filteredScenes.map((scene, index) => (
          <motion.div
            key={scene.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
                "p-8 rounded-[2rem] bg-slate-900 border border-slate-800 flex flex-col group hover:border-indigo-500/30 transition-all cursor-pointer relative overflow-hidden",
                userLevel === scene.level ? "ring-2 ring-indigo-500/20 bg-indigo-500/5" : ""
            )}
            onClick={() => router.push(`/session?scenario=${encodeURIComponent(scene.title)}`)}
          >
            <div className="flex items-center justify-between mb-8">
              <div className="w-14 h-14 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                <scene.icon size={28} />
              </div>
              <div className={cn(
                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                scene.difficulty <= 1 ? "border-emerald-500/20 text-emerald-400" :
                scene.difficulty <= 3 ? "border-amber-500/20 text-amber-400" :
                "border-rose-500/20 text-rose-400"
              )}>
                Level {scene.level}
              </div>
            </div>

            <h3 className="text-2xl font-bold mb-3">{scene.title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-10 flex-1">
              {scene.desc}
            </p>

            <button className="w-full py-4 bg-slate-950 border border-slate-800 hover:bg-slate-900 rounded-2xl flex items-center justify-center gap-2 transition-colors text-xs font-bold uppercase tracking-widest">
              Launch Session <ChevronRight className="w-4 h-4" />
            </button>
            
            {userLevel === scene.level && (
                <div className="absolute top-2 right-2">
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-indigo-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20">
                        <Sparkles size={10} /> BEST MATCH
                    </div>
                </div>
            )}
          </motion.div>
        ))}
        
        {/* Empty State */}
        {filteredScenes.length === 0 && !isGenerating && (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-800 rounded-[3rem] space-y-4">
                <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto text-slate-700">
                    <Search className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                    <h3 className="text-xl font-bold text-slate-300">No matches found</h3>
                    <p className="text-slate-500">Hit 'Enter' or click 'Forge' to build this custom scenario.</p>
                </div>
            </div>
        )}
      </main>
    </div>
  );
}
