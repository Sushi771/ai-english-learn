"use client";

import { useCallback, useState, useRef, useEffect } from "react";

/**
 * Hook to perform high-quality neural TTS using edge-tts via backend.
 */
export const useTTS = () => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const objectUrlRef = useRef<string | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current);
            }
        };
    }, []);

    const stop = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            setIsSpeaking(false);
        }
        if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
            objectUrlRef.current = null;
        }
    }, []);

    const speak = useCallback(async (text: string, lang?: string) => {
        if (!text || text.trim().length === 0) return;

        // Interrupt existing speech
        stop();

        try {
            const response = await fetch("http://localhost:8080/v1/tts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ 
                    text,
                    voice: lang === "zh-CN" ? "zh-CN-XiaoxiaoNeural" : "en-US-AriaNeural"
                }),
            });

            if (!response.ok) {
                throw new Error("TTS fetch failed");
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            objectUrlRef.current = url;

            const audio = new Audio(url);
            audioRef.current = audio;

            audio.onplay = () => setIsSpeaking(true);
            audio.onended = () => {
                setIsSpeaking(false);
                URL.revokeObjectURL(url);
                if (objectUrlRef.current === url) objectUrlRef.current = null;
            };
            audio.onerror = () => {
                setIsSpeaking(false);
                URL.revokeObjectURL(url);
                if (objectUrlRef.current === url) objectUrlRef.current = null;
            };

            await audio.play();
        } catch (e) {
            console.error("Neural TTS Error:", e);
            setIsSpeaking(false);
        }
    }, [stop]);

    return { speak, stop, isSpeaking };
};
