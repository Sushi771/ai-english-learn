"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, BarChart3, Trophy, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { supabase } from "@/lib/supabase";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

/* ─── Types ─── */
interface ReviewDay {
  date: string;
  count: number;
}

interface StatsSummary {
  total_sessions: number;
  vocab_mastery_rate: number;
  review_history: ReviewDay[];
}

/* ─── Ring Progress SVG ─── */
function RingProgress({ value }: { value: number }) {
  const r = 54;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - circumference * Math.min(value, 1);

  return (
    <svg width="140" height="140" className="-rotate-90 mx-auto">
      <circle
        cx="70"
        cy="70"
        r={r}
        stroke="var(--surface-variant)"
        strokeWidth="10"
        fill="transparent"
      />
      <motion.circle
        cx="70"
        cy="70"
        r={r}
        stroke="var(--primary)"
        strokeWidth="10"
        fill="transparent"
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />
    </svg>
  );
}

/* ─── Custom Tooltip ─── */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 luminary-glass luminary-border rounded-xl text-xs">
      <p className="font-bold text-[var(--on-background)]">{label}</p>
      <p className="text-[var(--primary)]">{payload[0].value} 词条</p>
    </div>
  );
}

/* ─── Skeleton ─── */
function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-[var(--surface-variant)] rounded-2xl ${className}`}
    />
  );
}

/* ─── Main Page ─── */
export default function StatsPage() {
  const [data, setData] = useState<StatsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          setError(true);
          setLoading(false);
          return;
        }

        const res = await fetch("/v1/stats/summary", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (!res.ok) throw new Error("fetch failed");
        const json: StatsSummary = await res.json();
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchStats();
    return () => {
      cancelled = true;
    };
  }, []);

  /* Format "2026-04-09" → "04/09" */
  const fmtDate = (iso: string) => {
    const parts = iso.split("-");
    return `${parts[1]}/${parts[2]}`;
  };

  const chartData =
    data?.review_history.map((d) => ({
      name: fmtDate(d.date),
      count: d.count,
    })) ?? [];

  const pct = data ? Math.round(data.vocab_mastery_rate * 100) : 0;

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--on-background)] font-[family-name:var(--font-inter)] selection:bg-[var(--primary)]/20">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none opacity-40">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--primary)]/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[var(--secondary)]/10 blur-[100px] rounded-full" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 h-14 flex items-center justify-between px-6 luminary-glass luminary-border">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-[var(--outline)] hover:text-[var(--primary)] transition-colors"
        >
          <ChevronLeft size={18} />
          <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">
            Back to Console
          </span>
        </Link>

        <h1 className="font-[family-name:var(--font-manrope)] text-lg font-bold tracking-tight">
          学习统计
        </h1>

        <ThemeToggle />
      </header>

      <main className="relative z-10 max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-12 space-y-8">
        {/* ─── Data Cards Row ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Card 1 — Total Sessions */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="p-8 luminary-card flex flex-col items-center gap-4"
          >
            {loading ? (
              <>
                <Skeleton className="w-10 h-10 rounded-xl" />
                <Skeleton className="w-20 h-10" />
                <Skeleton className="w-28 h-4" />
              </>
            ) : error ? (
              <p className="text-sm opacity-50">暂无数据</p>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-[var(--surface-container-high)] flex items-center justify-center text-[var(--primary)]">
                  <Trophy size={28} />
                </div>
                <span className="font-[family-name:var(--font-manrope)] text-5xl font-extrabold">
                  {data!.total_sessions}
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
                  累计完成场次
                </span>
              </>
            )}
          </motion.div>

          {/* Card 2 — Vocab Mastery */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="p-8 luminary-card flex flex-col items-center gap-4"
          >
            {loading ? (
              <>
                <Skeleton className="w-[140px] h-[140px] rounded-full" />
                <Skeleton className="w-28 h-4" />
              </>
            ) : error ? (
              <p className="text-sm opacity-50">暂无数据</p>
            ) : (
              <>
                <div className="relative">
                  <RingProgress value={data!.vocab_mastery_rate} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
                    <span className="font-[family-name:var(--font-manrope)] text-3xl font-extrabold">
                      {pct}%
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
                  词汇掌握率
                </span>
              </>
            )}
          </motion.div>
        </div>

        {/* ─── Bar Chart Card ─── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 md:p-10 luminary-card"
        >
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 size={18} className="text-[var(--primary)]" />
            <h2 className="font-[family-name:var(--font-manrope)] text-lg font-bold">
              近 14 天复习量
            </h2>
          </div>

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="w-full h-[200px]" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center py-16 opacity-40">
              <BookOpen size={32} className="mb-3" />
              <p className="text-sm font-semibold">暂无数据</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--outline-variant)"
                  opacity={0.2}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "var(--outline)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "var(--outline)" }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ fill: "var(--surface-variant)", opacity: 0.3 }}
                />
                <Bar
                  dataKey="count"
                  fill="var(--primary)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </main>
    </div>
  );
}
