"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-500">
      {/* Ambient background (from session/page.tsx) */}
      <div className="fixed inset-0 pointer-events-none opacity-40">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 blur-[100px] rounded-full animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-secondary/5 blur-[120px] rounded-full animate-pulse [animation-delay:2s]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="luminary-glass luminary-border p-10 md:p-12 rounded-[3rem] shadow-2xl backdrop-blur-3xl border border-white/5 bg-surface-container/30 relative">
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 border border-primary/20">
              <Sparkles className="text-primary w-8 h-8" />
            </div>
            <h1 className="text-3xl font-black font-manrope uppercase tracking-tight mb-2">欢迎回来</h1>
            <p className="text-on-background/50 text-sm font-medium tracking-wide">AI 英语学习助手，您的沉浸式语伴。</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-4">邮箱地址</label>
              <div className="relative group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-on-background/20 group-focus-within:text-primary transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-on-background/5 border border-on-background/5 rounded-[2rem] py-4 pl-14 pr-8 focus:outline-none focus:border-primary/30 transition-all font-manrope font-bold text-on-background"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-4">登录密码</label>
              <div className="relative group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-on-background/20 group-focus-within:text-primary transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-on-background/5 border border-on-background/5 rounded-[2rem] py-4 pl-14 pr-8 focus:outline-none focus:border-primary/30 transition-all font-manrope font-bold text-on-background"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold"
              >
                {error}
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-white dark:text-on-background py-5 rounded-[2rem] shadow-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : "立刻登录"}
            </motion.button>
          </form>

          <div className="mt-10 pt-8 border-t border-on-background/5 text-center">
            <p className="text-on-background/40 text-sm font-medium tracking-wide">
              还没有账号？{" "}
              <Link href="/register" className="text-primary hover:underline font-bold">
                立即注册
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
