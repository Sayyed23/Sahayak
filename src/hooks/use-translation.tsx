
"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
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

const translationCache = new Map<string, Map<string, string>>(); // lang -> (original -> translated)

export const TranslationProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState('english');
  const [translations, setTranslations] = useState<Map<string, string>>(new Map());
  const [isTranslating, setIsTranslating] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user && db) {
      const userRef = doc(db, 'users', user.uid);
      getDoc(userRef).then(docSnap => {
        if (docSnap.exists() && docSnap.data().language) {
          const userLang = docSnap.data().language;
          setLanguageState(userLang);
          if (translationCache.has(userLang)) {
            setTranslations(translationCache.get(userLang)!);
          } else {
            translationCache.set(userLang, new Map());
            setTranslations(new Map());
          }
        }
      });
    }
  }, [user]);

  const setLanguage = async (lang: string) => {
    setLanguageState(lang);
    if (!translationCache.has(lang)) {
        translationCache.set(lang, new Map());
    }
    setTranslations(new Map(translationCache.get(lang)!)); // Create new map to trigger re-render
    
    if (user && db) {
      const userRef = doc(db, 'users', user.uid);
      try {
        await setDoc(userRef, { language: lang }, { merge: true });
      } catch (error) {
        console.error("Failed to save language preference:", error);
      }
    }
  };
  
  const t = useCallback((text: string, placeholders: Record<string, string | number> = {}): string => {
    let interpolatedText = text;
    for (const key in placeholders) {
      interpolatedText = interpolatedText.replace(`{{${key}}}`, String(placeholders[key]));
    }

    if (language.toLowerCase() === 'english' || !text) {
      return interpolatedText;
    }

    const currentLangTranslations = translationCache.get(language);

    if (currentLangTranslations?.has(text)) {
      let translated = currentLangTranslations.get(text)!;
      for (const key in placeholders) {
        translated = translated.replace(`{{${key}}}`, String(placeholders[key]));
      }
      return translated;
    }

    if (currentLangTranslations && !currentLangTranslations.has(text)) {
        currentLangTranslations.set(text, text); 
        setIsTranslating(true);
        translateText({ text, targetLanguage: language })
            .then(result => {
                if(result.translation) {
                    currentLangTranslations.set(text, result.translation);
                    setTranslations(new Map(currentLangTranslations));
                }
            })
            .catch(error => {
                console.error("Translation failed for:", text, error);
                currentLangTranslations.delete(text);
            })
            .finally(() => {
                setIsTranslating(false);
            });
    }

    return interpolatedText;
  }, [language]);

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
