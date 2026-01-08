/**
 * Translation Hook for BTG Platform
 * Provides reactive translations with language switching
 */

import { useState, useEffect, useCallback } from 'react';
import {
  type Language,
  getLanguage,
  setLanguage,
  persistLanguage,
  t as translate,
} from '@/lib/translations';

interface UseTranslationResult {
  language: Language;
  t: (key: string) => string;
  setLanguage: (lang: Language) => void;
  switchLanguage: () => void;
}

// Event for language changes
const LANGUAGE_CHANGE_EVENT = 'btg:language-change';

/**
 * Hook for using translations
 */
export function useTranslation(): UseTranslationResult {
  const [language, setLang] = useState<Language>(getLanguage);

  // Listen for language changes from other components
  useEffect(() => {
    const handleLanguageChange = (event: CustomEvent<Language>) => {
      setLang(event.detail);
    };

    window.addEventListener(LANGUAGE_CHANGE_EVENT, handleLanguageChange as EventListener);
    return () => {
      window.removeEventListener(LANGUAGE_CHANGE_EVENT, handleLanguageChange as EventListener);
    };
  }, []);

  // Translation function
  const t = useCallback((key: string): string => {
    return translate(key, language);
  }, [language]);

  // Set language and notify other components
  const handleSetLanguage = useCallback((lang: Language) => {
    setLanguage(lang);
    setLang(lang);

    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent(LANGUAGE_CHANGE_EVENT, { detail: lang }));

    // Persist to database
    persistLanguage(lang).catch(() => {
      // Already saved to localStorage, ignore DB errors
    });
  }, []);

  // Toggle between languages
  const switchLanguage = useCallback(() => {
    const newLang = language === 'en' ? 'es' : 'en';
    handleSetLanguage(newLang);
  }, [language, handleSetLanguage]);

  return {
    language,
    t,
    setLanguage: handleSetLanguage,
    switchLanguage,
  };
}

export default useTranslation;
