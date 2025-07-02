
"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { translateText } from '@/ai/flows/translate-text';
import { useAuth } from './use-auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface TranslationContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (text: string, placeholders?: Record<string, string | number>) => string;
  isTranslating: boolean;
}

const TranslationContext = createContext<TranslationContextType | null>(null);

// lang -> (original -> translated)
const translationCache = new Map<string, Map<string, string>>();

export const TranslationProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState('english');
  const [translations, setTranslations] = useState<Map<string, string>>(new Map());
  const [isTranslating, setIsTranslating] = useState(false);
  const { user } = useAuth();
  
  const translationQueue = useRef(new Set<string>());
  const isProcessingQueue = useRef(false);

  useEffect(() => {
    if (user && db) {
      const userRef = doc(db, 'users', user.uid);
      getDoc(userRef).then(docSnap => {
        if (docSnap.exists() && docSnap.data().language) {
          const userLang = docSnap.data().language;
          setLanguage(userLang); // Use the main setter to handle cache logic
        }
      });
    }
  }, [user]);

  const setLanguage = useCallback(async (lang: string) => {
    setLanguageState(lang);
    if (!translationCache.has(lang)) {
        translationCache.set(lang, new Map());
    }
    setTranslations(new Map(translationCache.get(lang)!));
    
    // Reset queue state when language changes
    translationQueue.current.clear();
    isProcessingQueue.current = false;
    setIsTranslating(false);

    if (user && db) {
      const userRef = doc(db, 'users', user.uid);
      try {
        await setDoc(userRef, { language: lang }, { merge: true });
      } catch (error) {
        console.error("Failed to save language preference:", error);
      }
    }
  }, [user]);
  
  const t = useCallback((originalText: string, placeholders: Record<string, string | number> = {}): string => {
    if (!originalText) {
      return "";
    }

    const processPlaceholders = (text: string) => {
      let result = text;
      for (const key in placeholders) {
        result = result.replace(`{{${key}}}`, String(placeholders[key]));
      }
      return result;
    };

    if (language.toLowerCase() === 'english') {
      return processPlaceholders(originalText);
    }

    const currentLangCache = translationCache.get(language);

    if (currentLangCache?.has(originalText)) {
      return processPlaceholders(currentLangCache.get(originalText)!);
    }

    if (currentLangCache && !currentLangCache.has(originalText)) {
        translationQueue.current.add(originalText);
    }
    
    // Return original text with placeholders while waiting for translation
    return processPlaceholders(originalText);

  }, [language]);

  useEffect(() => {
    const processQueue = () => {
      const textsToTranslate = Array.from(translationQueue.current);
      if (textsToTranslate.length === 0 || isProcessingQueue.current) {
        return;
      }

      isProcessingQueue.current = true;
      setIsTranslating(true);
      translationQueue.current.clear();

      translateText({ texts: textsToTranslate, targetLanguage: language })
        .then(result => {
          if (result.translations && result.translations.length === textsToTranslate.length) {
            const currentCache = translationCache.get(language)!;
            textsToTranslate.forEach((original, index) => {
              currentCache.set(original, result.translations[index]);
            });
            setTranslations(new Map(currentCache)); // This triggers a re-render
          }
        })
        .catch(error => {
          console.error("Batch translation failed:", error);
          // Optional: Add failed items back to the queue for retry
          // textsToTranslate.forEach(text => translationQueue.current.add(text));
        })
        .finally(() => {
          isProcessingQueue.current = false;
          // Check if the queue was populated again during the API call
          if (translationQueue.current.size > 0) {
            processQueue();
          } else {
            setIsTranslating(false);
          }
        });
    };
    
    // Debounce processing to batch all t() calls from a render pass
    const handler = setTimeout(processQueue, 100);

    return () => clearTimeout(handler);
  }, [language, translations, t]); // The `t` dependency ensures this runs after render when queue is populated

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t, isTranslating }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};
