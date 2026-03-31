"use client";

import React, { useEffect, useState } from 'react';
import { ShieldAlert, ExternalLink, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProtocolGuard({ children }: { children: React.ReactNode }) {
  const [isInvalidProtocol, setIsInvalidProtocol] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if the page is being accessed via file:// protocol
      if (window.location.protocol === 'file:') {
        setIsInvalidProtocol(true);
      }
    }
  }, []);

  if (isInvalidProtocol) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#060e20] text-[#dee5ff] flex items-center justify-center p-6 font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl w-full bg-[#141f38] border-2 border-rose-500/50 rounded-[2.5rem] p-10 shadow-[0_0_50px_rgba(244,63,94,0.2)] text-center relative overflow-hidden"
        >
          {/* Background Highlight */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-rose-500/10 blur-[80px] rounded-full -z-10" />

          <div className="flex flex-col items-center gap-6">
            <div className="w-20 h-20 bg-rose-500 text-[#060e20] rounded-3xl flex items-center justify-center shadow-[0_0_30px_rgba(244,63,94,0.4)] mb-2">
              <ShieldAlert size={44} strokeWidth={2.5} />
            </div>

            <h1 className="text-4xl font-bold tracking-tight">访问协议错误</h1>
            
            <div className="space-y-4 max-w-lg">
              <p className="text-lg text-[#a3aac4] leading-relaxed">
                您正通过 <code className="bg-[#0f1930] px-2 py-1 rounded text-rose-400 font-mono">file://</code> 本地路径直接访问。
                浏览器出于安全考量，会拦截所有对 AI 后端的连接请求。
              </p>
              
              <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl text-rose-300 text-sm font-medium">
                ⚠️ 这会导致录音功能、发音评分和 AI 对话全部失效。
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full pt-6">
              <button 
                onClick={() => window.location.href = 'http://localhost:3000'}
                className="flex-1 bg-gradient-to-r from-[#ba9eff] to-[#ae8dff] text-[#060e20] font-bold py-5 px-8 rounded-2xl shadow-lg hover:shadow-[0_0_30px_rgba(186,158,255,0.4)] transition-all flex items-center justify-center gap-2 group"
              >
                <ExternalLink size={20} className="group-hover:translate-x-1 transition-transform" />
                立即跳转至 localhost:3000
              </button>
              
              <button 
                onClick={() => window.location.reload()}
                className="bg-[#1f2b49] text-[#dee5ff] font-bold py-5 px-8 rounded-2xl hover:bg-[#2a3a5e] transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw size={20} />
                重新检查
              </button>
            </div>

            <div className="text-xs text-[#6d758c] pt-4">
              提示：请通过项目脚本 <code className="text-[#34b5fa]">start_project.ps1</code> 运行，并使用它自动打开的网页。
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}
