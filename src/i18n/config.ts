import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enCommon from './locales/en/common.json';
import enMarketing from './locales/en/marketing.json';
import enAuth from './locales/en/auth.json';
import enDashboard from './locales/en/dashboard.json';
import enValidation from './locales/en/validation.json';
import enChat from './locales/en/chat.json';

import thCommon from './locales/th/common.json';
import thMarketing from './locales/th/marketing.json';
import thAuth from './locales/th/auth.json';
import thDashboard from './locales/th/dashboard.json';
import thValidation from './locales/th/validation.json';
import thChat from './locales/th/chat.json';

import zhCommon from './locales/zh/common.json';
import zhMarketing from './locales/zh/marketing.json';
import zhAuth from './locales/zh/auth.json';
import zhDashboard from './locales/zh/dashboard.json';
import zhValidation from './locales/zh/validation.json';
import zhChat from './locales/zh/chat.json';

const resources = {
  en: {
    common: enCommon,
    marketing: enMarketing,
    auth: enAuth,
    dashboard: enDashboard,
    validation: enValidation,
    chat: enChat,
  },
  th: {
    common: thCommon,
    marketing: thMarketing,
    auth: thAuth,
    dashboard: thDashboard,
    validation: thValidation,
    chat: thChat,
  },
  zh: {
    common: zhCommon,
    marketing: zhMarketing,
    auth: zhAuth,
    dashboard: zhDashboard,
    validation: zhValidation,
    chat: zhChat,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('preferred_language') || 'en',
    fallbackLng: 'en',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
