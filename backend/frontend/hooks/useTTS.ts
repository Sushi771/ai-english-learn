"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";

/**
 * Hook to perform high-quality neural TTS using edge-tts via backend.
 */
export const useTTS = () => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const objectUrlRef = useRef<string | null>(null);
    const requestIdRef = useRef(0);

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
        const currentId = ++requestIdRef.current;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                console.warn("TTS skipped: no session");
                return; // Silent skip as requested
            }

            // Extract the English portion only: 
            // Handles "English / Translation" or "English\nTranslation" formats
            const englishOnly = text.split('/')[0].split('\n')[0].trim();

            const response = await fetch("/v1/tts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ 
                    text: englishOnly,
                    voice: lang === "zh-CN" ? "zh-CN-XiaoxiaoNeural" : "en-US-AriaNeural"
                }),
            });

            if (!response.ok) {
                if (response.status === 401) {
                    console.warn("TTS unauthorized (401)");
                    return;
                }
                throw new Error("TTS fetch failed");
            }

            if (currentId !== requestIdRef.current) return;

            const blob = await response.blob();
            if (currentId !== requestIdRef.current) return;

            const url = URL.createObjectURL(blob);
            objectUrlRef.current = url;

            if (!audioRef.current) {
                audioRef.current = new Audio();
            }
            const audio = audioRef.current;

            // Re-check id before committing to playing
            if (currentId !== requestIdRef.current) {
                URL.revokeObjectURL(url);
                return;
            }

            audio.pause();
            audio.src = url;

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
