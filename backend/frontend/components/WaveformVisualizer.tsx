"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface WaveformVisualizerProps {
  barHeights: number[];
  isActive: boolean;
  className?: string;
}

/**
 * A real-time audio waveform visualizer component.
 * Uses Framer Motion for smooth transitions.
 */
const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  barHeights,
  isActive,
  className
}) => {
  return (
    <div className={cn("flex items-center justify-center gap-1.5 h-12", className)}>
      {barHeights.map((height, i) => (
        <motion.div
          key={i}
          animate={{ 
            height: isActive ? `${height * 100}%` : "15%",
            opacity: isActive ? 1 : 0.3
          }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 15,
            delay: i * 0.01 // Slight stagger for organic look
          }}
          className={cn(
            "w-1.5 rounded-full",
            // Use the primary gradient matching the "user" bubble theme
            "bg-gradient-to-t from-primary to-[#7c5dfa]",
            "shadow-[0_0_15px_rgba(124,93,250,0.3)]"
          )}
          style={{ minHeight: "4px" }}
        />
      ))}
    </div>
  );
};

export default WaveformVisualizer;
