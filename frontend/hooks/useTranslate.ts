"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useLanguage } from "@/contexts/language-context";

// In-memory cache: "lang:originalText" → translatedText
const cache = new Map<string, string>();

interface TranslateResult {
  translate: (text: string) => string;
  translateBatch: (texts: string[]) => Promise<string[]>;
  isTranslating: boolean;
}

export function useTranslate(): TranslateResult {
  const { language } = useLanguage();
  const [isTranslating, setIsTranslating] = useState(false);
  const [, forceUpdate] = useState(0);
  const pendingRef = useRef<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const targetLang = language === "es" ? "ES" : "EN";

  const cacheKey = (text: string) => `${targetLang}:${text}`;

  const flushPending = useCallback(async () => {
    const texts = Array.from(pendingRef.current);
    pendingRef.current.clear();
    if (texts.length === 0) return;

    // Filter out already cached
    const toTranslate = texts.filter((t) => !cache.has(cacheKey(t)));
    if (toTranslate.length === 0) return;

    setIsTranslating(true);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts: toTranslate, targetLang }),
      });

      if (res.ok) {
        const { translations } = await res.json();
        toTranslate.forEach((original, i) => {
          if (translations[i]) {
            cache.set(cacheKey(original), translations[i]);
          }
        });
        forceUpdate((n) => n + 1);
      }
    } catch {
      // Silently fail — show original text
    } finally {
      setIsTranslating(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetLang]);

  // Queue a text for translation, debounce the API call
  const translate = useCallback(
    (text: string): string => {
      if (!text) return text;
      const key = cacheKey(text);
      if (cache.has(key)) return cache.get(key)!;

      // Queue for batch translation
      pendingRef.current.add(text);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(flushPending, 150);

      return text; // Return original until translated
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [targetLang, flushPending]
  );

  const translateBatch = useCallback(
    async (texts: string[]): Promise<string[]> => {
      const uncached = texts.filter((t) => t && !cache.has(cacheKey(t)));

      if (uncached.length > 0) {
        setIsTranslating(true);
        try {
          const res = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ texts: uncached, targetLang }),
          });

          if (res.ok) {
            const { translations } = await res.json();
            uncached.forEach((original, i) => {
              if (translations[i]) {
                cache.set(cacheKey(original), translations[i]);
              }
            });
          }
        } catch {
          // fail silently
        } finally {
          setIsTranslating(false);
        }
      }

      return texts.map((t) => cache.get(cacheKey(t)) || t);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [targetLang]
  );

  // When language changes, trigger re-render to pick up cached or fetch new
  useEffect(() => {
    forceUpdate((n) => n + 1);
  }, [language]);

  return { translate, translateBatch, isTranslating };
}
