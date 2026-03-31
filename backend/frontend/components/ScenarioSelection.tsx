"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, ArrowLeft, Send, Sparkles, 
  ChevronRight, Coffee, Plane, Briefcase, ShoppingBag, Utensils, Heart,
  Loader2, Home, BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const predefinedScenarios = [
  { id: 'airport', title: '机场值机', description: '办理登机手续，托运行李并选择座位', icon: Plane, color: '#34b5fa' },
  { id: 'cafe', title: '咖啡馆点餐', description: '在大都会咖啡馆点一杯定制拿铁', icon: Coffee, color: '#ba9eff' },
  { id: 'interview', title: '模拟面试', description: '准备应对技术公司的高管面试', icon: Briefcase, color: '#10B981' },
  { id: 'shopping', title: '百货购物', description: '询问尺码、价格并进行退换货协商', icon: ShoppingBag, color: '#F59E0B' },
  { id: 'restaurant', title: '餐厅订位', description: '预定窗边座位并询问当日特色菜', icon: Utensils, color: '#EC4899' },
  { id: 'medical', title: '看病就医', description: '向医生描述症状并咨询用药建议', icon: Heart, color: '#EF4444' },
];

export default function ScenarioSelection() {
  const [searchTerm, setSearchTerm] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const filteredScenarios = predefinedScenarios.filter(s => 
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGenerate = () => {
    if (!customTopic) return;
    setIsGenerating(true);
    // Simulate AI Generation
    setTimeout(() => {
      window.location.href = `/session?topic=${encodeURIComponent(customTopic)}`;
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background text-on-background pb-40 transition-colors duration-500 overflow-x-hidden relative">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/20 blur-[120px] rounded-full -translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="max-w-luminary-wide mx-auto px-6 lg:px-10">
        <header className="py-12 md:py-16 lg:py-24 flex flex-col md:flex-row md:items-end justify-between gap-10 relative z-10 border-b border-on-background/5 mb-16">
          <div className="space-y-6">
            <Link href="/dashboard" className="flex items-center gap-2 text-primary hover:text-primary-container transition-colors font-black uppercase tracking-[0.3em] text-[10px] mb-4 group">
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              Return to Nexus
            </Link>
            <h1 className="text-5xl md:text-7xl font-bold font-manrope tracking-tighter leading-none">
               选择学习场景
            </h1>
            <p className="text-on-background/50 text-xl md:text-2xl font-medium max-w-xl italic">
               Curated linguistic environments or AI-generated custom realms.
            </p>
          </div>

          <div className="relative w-full md:w-[450px]">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-primary/40" size={20} />
            <input 
              type="text" 
              placeholder="Filter scenarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface-container/30 border border-outline-variant/30 rounded-full py-6 pl-16 pr-8 focus:outline-none focus:ring-2 focus:ring-primary/20 luminary-glass transition-all placeholder:text-on-background/20 font-medium text-lg"
            />
          </div>
        </header>

        <main className="space-y-12 md:space-y-16 lg:space-y-20 relative z-10">
          {/* Custom Generator Card */}
          <section>
            <motion.div 
               whileHover={{ y: -6 }}
               className="luminary-glass p-10 md:p-16 rounded-[3rem] border border-primary/30 shadow-3xl relative overflow-hidden group mb-20"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-8">
                  <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-primary/10 rounded-full border border-primary/20">
                     <Sparkles size={16} className="text-primary animate-pulse" />
                     <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Neural Forge</span>
                  </div>
                  <h2 className="text-5xl font-manrope font-bold tracking-tight">你想聊聊什么？</h2>
                  <p className="text-on-background/50 text-xl leading-relaxed italic opacity-80">
                    Input any topic or specific scenario, and Luminary AI will forge a custom learning environment.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <input 
                    type="text" 
                    placeholder="例如: 讨论现代建筑设计..."
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    className="flex-1 bg-background/50 border border-on-background/10 rounded-2xl py-5 px-6 focus:outline-none focus:ring-2 focus:ring-primary transition-all placeholder:text-on-background/20 font-medium"
                  />
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleGenerate}
                    disabled={isGenerating || !customTopic}
                    className="bg-primary text-on-primary font-black uppercase tracking-[0.2em] text-[10px] py-6 px-12 rounded-2xl flex items-center justify-center gap-4 hover:shadow-2xl transition-all disabled:opacity-50 shadow-xl shadow-primary/20 self-center sm:self-auto"
                  >
                    {isGenerating ? (
                      <Loader2 size={24} className="animate-spin" />
                    ) : (
                      <Plus size={24} />
                    )}
                    <span>{isGenerating ? 'Forging...' : 'Forge Scenario'}</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </section>

          {/* Scenarios Grid */}
          <section className="space-y-12">
            <h3 className="text-2xl font-black font-manrope uppercase tracking-[0.2em] text-on-background/30 px-2 lg:px-6">精选场景库</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
              {filteredScenarios.map((scenario, index) => (
                <Link href={`/session?topic=${encodeURIComponent(scenario.title)}`} key={scenario.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -16, scale: 1.02 }}
                    className="luminary-glass p-10 rounded-[3rem] border border-outline-variant/30 hover:border-primary/50 transition-all duration-700 group cursor-pointer shadow-sm hover:shadow-3xl dark:hover:shadow-primary/10 relative overflow-hidden h-full flex flex-col"
                  >
                    <div 
                      className="absolute -right-12 -top-12 w-48 h-48 blur-[80px] rounded-full opacity-5 group-hover:opacity-20 transition-all duration-1000 group-hover:scale-150"
                      style={{ backgroundColor: scenario.color }}
                    />
                    
                    <div 
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mb-10 border transition-all duration-700 shadow-xl group-hover:rotate-12 group-hover:scale-110"
                      style={{ 
                        backgroundColor: `${scenario.color}10`,
                        borderColor: `${scenario.color}20`,
                        color: scenario.color 
                      }}
                    >
                      <scenario.icon size={32} />
                    </div>
                    
                    <div className="flex-1 space-y-4">
                      <h4 className="text-2xl font-bold font-manrope tracking-tight leading-tight group-hover:text-primary transition-colors">{scenario.title}</h4>
                      <p className="text-on-background/40 text-sm font-medium leading-relaxed italic opacity-80">{scenario.description}</p>
                    </div>

                    <div className="mt-12 pt-8 border-t border-on-background/5 flex items-center justify-between">
                       <span className="text-[10px] font-black uppercase tracking-[0.3em] text-on-background/20 group-hover:text-primary/60 transition-colors">Foundation Layer</span>
                       <div className="w-12 h-12 rounded-full bg-on-background/5 flex items-center justify-center group-hover:bg-primary group-hover:text-on-primary transition-all shadow-inner border border-outline-variant/20">
                          <ChevronRight size={20} />
                       </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </section>
        </main>
      </div>

      {/* Responsive Navigation Bar */}
      <motion.nav 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[90%] md:w-[600px] lg:w-[480px] z-50 lg:scale-110"
      >
         <div className="luminary-glass p-3 rounded-full border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.3)] shadow-2xl flex items-center justify-between">
            <Link href="/dashboard" className="p-4 rounded-full text-on-background/40 hover:text-primary hover:bg-primary/10 transition-all group flex items-center gap-3">
               <Home size={22} className="group-hover:scale-110 transition-transform" />
               <span className="text-xs font-black uppercase tracking-widest md:block hidden">回主页</span>
            </Link>
            
            <div className="h-8 w-px bg-on-background/5 hidden md:block" />

            <div className="flex items-center gap-1">
               <button className="p-4 rounded-full text-primary bg-primary/10 font-black uppercase tracking-widest text-[10px] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  情境选择
               </button>
            </div>

            <Link href="/word-bank" className="p-4 rounded-full text-on-background/40 hover:text-secondary hover:bg-secondary/10 transition-all group">
               <BookOpen size={22} className="group-hover:scale-110 transition-transform" />
            </Link>
         </div>
      </motion.nav>
    </div>
  );
}
