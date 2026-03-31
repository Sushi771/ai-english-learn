"use client";

import React, { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface AudioWaveformProps {
  url: string;
}

const AudioWaveform = ({ url }: AudioWaveformProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const waveSurferRef = useRef<WaveSurfer | null>(null);

  useEffect(() => {
    let wavesurfer: WaveSurfer | null = null;
    
    // Get theme-aware colors from CSS variables
    const getThemeColor = (varName: string, fallback: string) => {
      if (typeof window === 'undefined') return fallback;
      const computed = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
      return computed ? `hsl(${computed})` : fallback;
    };

    const primaryColor = getThemeColor('--primary', '#3b82f6');
    const secondaryColor = getThemeColor('--secondary', '#60a5fa');

    if (containerRef.current && url && url !== "/dummy.wav") {
      try {
        wavesurfer = WaveSurfer.create({
          container: containerRef.current,
          waveColor: primaryColor,
          progressColor: secondaryColor,
          cursorColor: secondaryColor,
          barWidth: 2,
          barGap: 3,
          barRadius: 4,
          height: 60,
          normalize: true,
        });

        waveSurferRef.current = wavesurfer;
        wavesurfer.load(url).catch(err => {
          if (err.name !== 'AbortError') {
            console.error('WaveSurfer load error:', err);
          }
        });
      } catch (err) {
        console.error('WaveSurfer creation error:', err);
      }

      return () => {
        if (wavesurfer) {
          try {
            wavesurfer.destroy();
          } catch (e) {
            // Silently handle cases where it's already destroyed or in mid-load
          }
        }
      };
    }
  }, [url]);

  return (
    <div className="w-full bg-on-background/5 rounded-2xl p-6 border border-on-background/5 shadow-inner transition-colors duration-500">
      <div ref={containerRef} className="w-full" />
      <div className="flex justify-between items-center mt-4 px-2">
        <span className="text-[10px] text-on-background/40 font-bold uppercase tracking-widest">录音波形对照 (Audio Waveform)</span>
        <button 
          onClick={() => waveSurferRef.current?.playPause()}
          className="px-4 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-full text-[10px] font-bold uppercase tracking-tighter transition-all"
        >
          Play / Pause
        </button>
      </div>
    </div>
  );
};

export default AudioWaveform;
