"use client";

import { useState, useEffect, useRef } from 'react';

/**
 * Hook to process audio frequency data for visualization.
 * @param isRecording Whether the recording is active.
 * @param stream The active MediaStream from getUserMedia.
 * @param barCount Number of data points to return (bars in the visualizer).
 */
export const useAudioWaveform = (
  isRecording: boolean,
  stream: MediaStream | null,
  barCount: number = 25
) => {
  const [barHeights, setBarHeights] = useState<number[]>(new Array(barCount).fill(0.1));
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isRecording || !stream) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        // We keep the context open during the session instance if needed, 
        // but here we stop the processing loop.
      }
      // Reset heights to small default
      setBarHeights(new Array(barCount).fill(0.1));
      return;
    }

    const initAudio = async () => {
      try {
        // Initialize AudioContext on demand (satisfies user gesture as it's triggered by button click)
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        const context = audioContextRef.current;
        const analyser = context.createAnalyser();
        analyser.fftSize = 256; 
        analyserRef.current = analyser;

        const source = context.createMediaStreamSource(stream);
        source.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const update = () => {
          if (!isRecording) return;
          
          analyser.getByteFrequencyData(dataArray);

          // Downsample and normalize to [0.1, 1.0]
          const newHeights: number[] = [];
          const step = Math.floor(bufferLength / barCount);
          
          for (let i = 0; i < barCount; i++) {
            // Use an average or peak in the range for better responsiveness
            let sum = 0;
            for (let j = 0; j < step; j++) {
              sum += dataArray[i * step + j];
            }
            const avg = sum / step;
            // Normalize (0-255 -> 0.1-1.0)
            const normalized = Math.max(0.1, avg / 255);
            newHeights.push(normalized);
          }

          // Create a symmetrical effect if desired, but here we just return the raw scaled bars
          // To make it look "premium", let's mirror it from the center
          const symmetrical = [...newHeights.slice(0, Math.floor(barCount / 2)).reverse(), ...newHeights.slice(Math.floor(barCount / 2))];

          setBarHeights(symmetrical);
          animationFrameRef.current = requestAnimationFrame(update);
        };

        animationFrameRef.current = requestAnimationFrame(update);
      } catch (err) {
        console.error("useAudioWaveform error:", err);
      }
    };

    initAudio();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRecording, stream, barCount]);

  // Final cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(console.error);
      }
    };
  }, []);

  return barHeights;
};
