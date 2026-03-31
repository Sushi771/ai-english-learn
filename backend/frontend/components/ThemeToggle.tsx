"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 p-1 bg-white/05 dark:bg-white/05 luminary-border rounded-2xl backdrop-blur-md">
      {(["light", "dark", "system"] as const).map((t) => {
        const isActive = theme === t;
        
        return (
          <button
            key={t}
            onClick={() => setTheme(t)}
            className={cn(
              "relative p-2 rounded-xl transition-all duration-300",
              isActive 
                ? "text-primary shadow-lg shadow-primary/20" 
                : "text-[#6d758c] hover:text-[#ba9eff] hover:bg-white/05"
            )}
            title={`Switch to ${t} theme`}
          >
            {isActive && (
              <motion.div
                layoutId="active-theme"
                className="absolute inset-0 bg-white/10 dark:bg-white/10 rounded-xl"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <div className="relative z-10">
              {t === "light" && <Sun size={18} strokeWidth={2.5} />}
              {t === "dark" && <Moon size={18} strokeWidth={2.5} />}
              {t === "system" && <Monitor size={18} strokeWidth={2.5} />}
            </div>
          </button>
        );
      })}
    </div>
  );
}
