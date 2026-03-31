"use client";

import { useCallback, useState } from "react";

export const useTTS = () => {
    const [isSpeaking, setIsSpeaking] = useState(false);

    /**
     * Speaks the given text using the browser's SpeechSynthesis API.
     * @param text The text to speak.
     * @param lang Optional language code (default is "en-US", but will auto-detect Chinese characters).
     */
    const speak = useCallback((text: string, lang?: string) => {
        if (typeof window === "undefined" || !window.speechSynthesis) {
            console.error("Speech synthesis not supported in this browser.");
            return;
        }

        if (!text || text.trim().length === 0) {
            return;
        }

        // Auto-detect language if not provided
        let detectedLang = lang || "en-US";
        if (typeof text === 'string' && !lang && /[\u4e00-\u9fa5]/.test(text)) {
            detectedLang = "zh-CN";
        }

        // Defensively cancel speech (some browsers like it others skip it)
        try {
            window.speechSynthesis.cancel();
        } catch (e) {
            console.error("Failed to cancel speech synthesis:", e);
        }

        // Wait for voices to be loaded if they aren't ready yet (browser quirks)
        const startSpeaking = () => {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = detectedLang;
            utterance.rate = 1.0; // Slightly faster default
            utterance.pitch = 1.0;

            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = (err: SpeechSynthesisErrorEvent) => {
                // If the error is 'interrupted', don't log it as an error as it's common (user clicked again)
                if (err.error !== 'interrupted') {
                    console.error("Speech synthesis error event:", err.error, err);
                }
                setIsSpeaking(false);
            };

            try {
                window.speechSynthesis.speak(utterance);
            } catch (e) {
                console.error("Failed to execute speak():", e);
                setIsSpeaking(false);
            }
        };

        // If voices aren't loaded, Chrome might fail silently or error
        if (window.speechSynthesis.getVoices().length === 0) {
            window.speechSynthesis.onvoiceschanged = () => {
                startSpeaking();
                window.speechSynthesis.onvoiceschanged = null; // Clean up
            };
        } else {
            startSpeaking();
        }
    }, []);

    const stop = useCallback(() => {
        if (typeof window !== "undefined" && window.speechSynthesis) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    }, []);

    return { speak, stop, isSpeaking };
};
