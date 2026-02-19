import React, { createContext, useContext, useState, useEffect } from 'react';

import { updateEnrollment, getActiveEnrollment } from '@/lib/enrollment';
import { getCurrentUser } from '@/lib/auth';
import type { Language } from '@/lib/supabase';

// Define the shape of our context
interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => Promise<void>;
    t: (key: string, params?: Record<string, string | number>) => string;
    isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

interface LanguageProviderProps {
    children: React.ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
    // Default to English, or check localStorage/navigator
    const [language, setLanguageState] = useState<Language>('en');
    const [isLoading, setIsLoading] = useState(true);

    // Initialize language
    useEffect(() => {
        const initLanguage = async () => {
            // 1. Check localStorage
            const savedLang = localStorage.getItem('btg_language') as Language;
            if (savedLang && (savedLang === 'en' || savedLang === 'es')) {
                setLanguageState(savedLang);
                setIsLoading(false);
                return;
            }

            // 2. Check Enrollment (if logged in)
            try {
                const user = await getCurrentUser();
                if (user) {
                    const enrollment = await getActiveEnrollment();
                    if (enrollment && enrollment.language) {
                        setLanguageState(enrollment.language);
                        localStorage.setItem('btg_language', enrollment.language);
                        setIsLoading(false);
                        return;
                    }
                }
            } catch (err) {
                console.warn('Failed to fetch language from enrollment:', err);
            }

            // 3. Check Navigator
            const browserLang = navigator.language.split('-')[0];
            if (browserLang === 'es') {
                setLanguageState('es');
            }

            setIsLoading(false);
        };

        initLanguage();
    }, []);

    // Update language
    const setLanguage = async (newLang: Language) => {
        setLanguageState(newLang);
        localStorage.setItem('btg_language', newLang);

        // Update in Supabase if logged in
        try {
            const enrollment = await getActiveEnrollment();
            if (enrollment) {
                await updateEnrollment(enrollment.id, { language: newLang });
            }
        } catch (err) {
            console.error('Failed to sync language to database:', err);
        }
    };

    // Load dictionaries
    const [strings, setStrings] = useState<any>(null);

    useEffect(() => {
        const loadStrings = async () => {
            if (language === 'es') {
                const { uiStrings } = await import('@/content/es/uiStrings');
                setStrings(uiStrings);
            } else {
                const { uiStrings } = await import('@/content/en/uiStrings');
                setStrings(uiStrings);
            }
        };
        loadStrings();
    }, [language]);

    const t = (key: string): string => {
        if (!strings) return key;

        // Split key by dot (e.g., 'common.loading')
        const keys = key.split('.');
        let value = strings;

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return key; // Fallback to key if not found
            }
        }

        return typeof value === 'string' ? value : key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, isLoading }}>
            {children}
        </LanguageContext.Provider>
    );
}
