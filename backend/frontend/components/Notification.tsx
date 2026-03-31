"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

export default function Notification({ message, isVisible, onClose }: ToastProps) {
  React.useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[200] min-w-[300px]"
        >
          <div className="luminary-glass luminary-border rounded-2xl p-4 shadow-2xl flex items-center gap-4 bg-[#141f38]/60 border-[#ba9eff1a] min-w-[320px] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#ba9eff10] blur-2xl rounded-full" />
            <div className="w-12 h-12 bg-[#ba9eff1a] rounded-xl flex items-center justify-center text-[#ba9eff] border border-[#ba9eff33] shadow-inner group-hover:scale-110 transition-transform">
              <Sparkles size={24} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-[#ba9eff] uppercase tracking-[0.2em] mb-0.5">Core Capture</p>
              <h4 className="text-sm font-bold text-white tracking-tight">{message}</h4>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/05 rounded-lg text-[#a3aac4] transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
