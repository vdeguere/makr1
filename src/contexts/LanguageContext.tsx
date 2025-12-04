import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { logger } from '@/lib/logger';

interface Language {
  code: string;
  name: string;
  flag: string;
}

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  availableLanguages: Language[];
  loading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'th', name: 'ไทย', flag: '🇹🇭' },
  { code: 'zh', name: '中文', flag: '🇨🇳' }
];

const DEFAULT_LANGUAGE = 'en';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const [language, setLanguageState] = useState<string>(() => {
    // Try to get from localStorage first
    return localStorage.getItem('preferred_language') || DEFAULT_LANGUAGE;
  });
  const [loading, setLoading] = useState(true);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  // Load user preference from profile on mount
  useEffect(() => {
    if (preferencesLoaded) return;

    const loadLanguage = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('profiles')
            .select('preferred_language')
            .eq('id', user.id)
            .maybeSingle();

          if (!error && data?.preferred_language) {
            setLanguageState(data.preferred_language);
            localStorage.setItem('preferred_language', data.preferred_language);
          }
        }
      } catch (error) {
        logger.error('Error loading language:', error);
      } finally {
        setLoading(false);
        setPreferencesLoaded(true);
      }
    };

    loadLanguage();
  }, [preferencesLoaded]);

  const setLanguage = async (newLanguage: string) => {
    try {
      setLanguageState(newLanguage);
      localStorage.setItem('preferred_language', newLanguage);
      
      // Update i18next language
      await i18n.changeLanguage(newLanguage);

      // Update in database if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ preferred_language: newLanguage })
          .eq('id', user.id);
      }
    } catch (error) {
      logger.error('Error updating language:', error);
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        availableLanguages: LANGUAGES,
        loading
      }}
    >
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
