// apps/web/src/components/LanguageContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { SupportedLanguages, t } from '@/lib/i18n';

interface LanguageContextType {
  language: SupportedLanguages;
  setLanguage: (lang: SupportedLanguages) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguages>('en');

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLang = localStorage.getItem('preferred-language') as SupportedLanguages;
    if (savedLang && (savedLang === 'en' || savedLang === 'am')) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: SupportedLanguages) => {
    setLanguageState(lang);
    localStorage.setItem('preferred-language', lang);
    document.documentElement.lang = lang;
  };

  const translate = (key: string, params?: Record<string, string | number>) => {
    return t(key, language, params);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translate }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
