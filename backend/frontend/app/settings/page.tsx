"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Brain, Shield, Zap, RefreshCw, Database } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const [activeProvider, setActiveProvider] = useState("zhipu");
  const [keys, setKeys] = useState({
    openai: "",
    gemini: "",
    zhipu: ""
  });
  const [userLevel, setUserLevel] = useState("A1");
  const [preferredModel, setPreferredModel] = useState("glm-4-flash");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load from LocalStorage
    setActiveProvider(localStorage.getItem("active_provider") || "zhipu");
    setKeys({
      openai: localStorage.getItem("openai_api_key") || "",
      gemini: localStorage.getItem("gemini_api_key") || "",
      zhipu: localStorage.getItem("zhipu_api_key") || ""
    });
    setUserLevel(localStorage.getItem("user_level") || "A1");
    setPreferredModel(localStorage.getItem("preferred_model") || "glm-4-flash");
  }, []);

  const handleSave = () => {
    localStorage.setItem("active_provider", activeProvider);
    localStorage.setItem("openai_api_key", keys.openai);
    localStorage.setItem("gemini_api_key", keys.gemini);
    localStorage.setItem("zhipu_api_key", keys.zhipu);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleModelChange = (modelId: string) => {
    setPreferredModel(modelId);
    localStorage.setItem("preferred_model", modelId);
  };

  const providers = [
    { id: "zhipu", name: "Zhipu AI", icon: <Zap className="w-5 h-5" />, desc: "Default balanced model (GLM-4)" },
    { id: "openai", name: "OpenAI", icon: <Brain className="w-5 h-5" />, desc: "Industry standard (GPT-4o)" },
    { id: "gemini", name: "Google Gemini", icon: <Database className="w-5 h-5" />, desc: "Large context specialist" }
  ];

  const models = [
    { id: "glm-4-flash", name: "GLM-4 Flash（均衡，默认）", status: "active" },
    { id: "glm-4.5-air", name: "GLM-4.5 Air（快速）", status: "active" },
    { id: "openai", name: "OpenAI GPT-4o（敬请期待）", status: "disabled" },
    { id: "deepseek", name: "DeepSeek（敬请期待）", status: "disabled" },
    { id: "gemini", name: "Gemini（敬请期待）", status: "disabled" }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center gap-6 mb-12">
          <Link href="/dashboard" className="p-2 rounded-full bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
            <p className="text-slate-400 mt-1">Configure your AI providers and proficiency profile.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-indigo-600/10 border border-indigo-500/20">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-5 h-5 text-indigo-400" />
                <h3 className="font-semibold text-indigo-100">Privacy Sync</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                All API keys are stored locally in your browser. They are never sent to our servers except as transit headers to the AI provider.
              </p>
            </div>
            
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                <h3 className="text-sm font-medium text-slate-500 uppercase tracking-widest mb-4">Current Profile</h3>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-xl">
                        {userLevel}
                    </div>
                    <div>
                        <div className="text-sm text-slate-400">CEFR Level</div>
                        <Link href="/placement" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mt-1 font-medium">
                            <RefreshCw className="w-3 h-3" /> Re-test Level
                        </Link>
                    </div>
                </div>
            </div>
          </div>

          {/* Main Form */}
          <div className="md:col-span-2 space-y-8">
            {/* Provider Selection */}
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" /> Active Neural Provider
              </h2>
              <div className="grid grid-cols-1 gap-3">
                {providers.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setActiveProvider(p.id)}
                    className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                      activeProvider === p.id 
                      ? "bg-indigo-600/10 border-indigo-500 ring-1 ring-indigo-500" 
                      : "bg-slate-900 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${activeProvider === p.id ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-400"}`}>
                      {p.icon}
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-slate-400">{p.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Model Selection */}
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-400" /> Intelligence Model
              </h2>
              <div className="grid grid-cols-1 gap-2">
                {models.map((m) => (
                  <button
                    key={m.id}
                    disabled={m.status === "disabled"}
                    onClick={() => handleModelChange(m.id)}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      preferredModel === m.id 
                      ? "bg-indigo-600/10 border-indigo-500" 
                      : "bg-slate-900 border-slate-800"
                    } ${m.status === "disabled" ? "opacity-40 cursor-not-allowed grayscale" : "hover:border-slate-700"}`}
                  >
                    <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${preferredModel === m.id ? "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" : "bg-slate-700"}`} />
                        <span className={`text-sm font-medium ${preferredModel === m.id ? "text-indigo-100" : "text-slate-400"}`}>
                            {m.name}
                        </span>
                    </div>
                    {preferredModel === m.id && (
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                            Active
                        </span>
                    )}
                  </button>
                ))}
              </div>
            </section>

            {/* API Keys */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" /> Authentication Keys
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 block">OpenAI API Key</label>
                  <input
                    type="password"
                    placeholder="sk-..."
                    value={keys.openai}
                    onChange={(e) => setKeys({...keys, openai: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 block">Gemini API Key</label>
                  <input
                    type="password"
                    placeholder="AIza..."
                    value={keys.gemini}
                    onChange={(e) => setKeys({...keys, gemini: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 block">Zhipu AI Key</label>
                  <input
                    type="password"
                    placeholder="Enter your Zhipu key"
                    value={keys.zhipu}
                    onChange={(e) => setKeys({...keys, zhipu: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  />
                </div>
              </div>
            </section>

            {/* Footer Actions */}
            <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
              <p className="text-xs text-slate-500">Last synced: Just now</p>
              <button
                onClick={handleSave}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-8 rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
              >
                {saved ? "Config Saved!" : "Apply Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
