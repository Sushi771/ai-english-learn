"use client";

import React, { useState, useEffect } from "react";
import { getFoundationCurriculum } from "@/lib/api";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Volume2, CheckCircle, ChevronRight, LayoutPanelTop } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function FoundationPage() {
  const [lessons, setLessons] = useState<any[]>([]);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadCurriculum() {
      try {
        const data = await getFoundationCurriculum();
        setLessons(data);
      } catch (err) {
        console.error("Failed to load curriculum", err);
      } finally {
        setLoading(false);
      }
    }
    loadCurriculum();
  }, []);

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">Loading curriculum...</div>;

  const currentLesson = lessons[currentLessonIndex];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">
      {/* Navigation */}
      <div className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Exit Course</span>
        </Link>
        <div className="flex items-center gap-4">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest hidden sm:block">Foundation Unit {currentLessonIndex + 1}</div>
            <div className="h-1.5 w-32 bg-slate-900 rounded-full overflow-hidden">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentLessonIndex + 1) / lessons.length) * 100}%` }}
                    className="h-full bg-indigo-500 shadow-lg shadow-indigo-500/30"
                />
            </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Lesson Header */}
        <header className="mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest">
            {currentLesson.type} Level
          </div>
          <h1 className="text-4xl font-black tracking-tight">{currentLesson.title}</h1>
          <p className="text-slate-400 text-lg leading-relaxed">{currentLesson.description}</p>
        </header>

        {/* Content Area */}
        <div className="bg-slate-900/50 rounded-3xl border border-slate-800 p-8 sm:p-12 mb-12">
            {currentLesson.type === "alphabet" && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                    {currentLesson.items.map((letter: string) => (
                        <button key={letter} className="aspect-square rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center gap-2 hover:border-indigo-500/50 hover:bg-slate-900 transition-all group active:scale-95">
                            <span className="text-3xl font-black tracking-tighter">{letter}</span>
                            <Volume2 className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                        </button>
                    ))}
                </div>
            )}

            {currentLesson.type === "phonetic" && (
                <div className="space-y-6">
                    {currentLesson.items.map((item: any) => (
                        <div key={item.symbol} className="flex items-center justify-between p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-indigo-500/30 transition-colors">
                            <div className="flex items-center gap-6">
                                <span className="text-4xl font-bold text-indigo-400">{item.symbol}</span>
                                <div className="text-left">
                                    <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">Example Word</div>
                                    <div className="text-xl font-semibold">{item.example}</div>
                                </div>
                            </div>
                            <button className="p-4 rounded-xl bg-slate-900 hover:bg-slate-800 transition-colors text-slate-400 hover:text-white">
                                <Volume2 className="w-6 h-6" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {currentLesson.type === "conversation" && (
                <div className="space-y-8">
                    {currentLesson.dialogue.map((line: any, idx: number) => (
                        <motion.div 
                            initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            key={idx} 
                            className={`flex ${idx % 2 === 0 ? "justify-start" : "justify-end"}`}
                        >
                            <div className={`max-w-[80%] p-6 rounded-3xl ${idx % 2 === 0 ? "bg-slate-950 border border-slate-800 rounded-bl-none" : "bg-indigo-600 shadow-xl shadow-indigo-500/10 rounded-br-none"}`}>
                                <div className="text-sm mb-1 opacity-60 font-bold uppercase tracking-widest">Speaker {line.speaker}</div>
                                <div className="text-xl font-semibold mb-2">{line.text}</div>
                                <div className="text-sm opacity-80 border-t border-white/10 pt-2 italic">{line.translation}</div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between">
            <div className="text-sm text-slate-500 italic p-4 bg-slate-900/40 rounded-xl max-w-xs border border-slate-800 border-dashed">
                {currentLesson.tips || "Take your time. Repeat the sounds clearly and loudly."}
            </div>
            
            {currentLessonIndex < lessons.length - 1 ? (
                <button 
                    onClick={() => setCurrentLessonIndex(currentLessonIndex + 1)}
                    className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-10 rounded-2xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                >
                    Next Lesson <ChevronRight className="w-5 h-5" />
                </button>
            ) : (
                <button 
                    onClick={() => router.push("/dashboard")}
                    className="flex items-center gap-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 px-10 rounded-2xl transition-all shadow-lg shadow-emerald-500/20"
                >
                    Finish Phase 1 <CheckCircle className="w-5 h-5" />
                </button>
            )}
        </div>
      </main>

      <footer className="max-w-4xl mx-auto px-6 py-12 text-center text-slate-700 text-xs tracking-widest font-medium uppercase border-t border-slate-900 mt-12">
        Phonetic Foundation &bull; Neural Path A1 Early
      </footer>
    </div>
  );
}
