import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import './i18n/config'; // Initialize i18n
import { registerSW } from 'virtual:pwa-register';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { toast } from 'sonner';
import { isIOS, isAndroid } from './lib/platformDetection';
import { logger } from './lib/logger';

// Track if app is opened in standalone mode (installed as PWA)
if (window.matchMedia('(display-mode: standalone)').matches) {
  const platform = isIOS() ? 'ios' : isAndroid() ? 'android' : 'desktop';
  
  // Track PWA usage
  if (window.gtag) {
    window.gtag('event', 'pwa_app_opened', { 
      platform,
      display_mode: 'standalone'
    });
  }
  
  // Log first-time install (only once per device)
  const hasLoggedInstall = localStorage.getItem('pwa_install_logged');
  if (!hasLoggedInstall && window.gtag) {
    window.gtag('event', 'pwa_first_launch', { platform });
    localStorage.setItem('pwa_install_logged', 'true');
  }
}

// Fix for mobile browsers where 100vh includes address bar
function setViewportHeight() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

setViewportHeight();
window.addEventListener('resize', setViewportHeight);

// Register service worker only in production
if (import.meta.env.PROD) {
  const updateSW = registerSW({
    onNeedRefresh() {
      toast('An update is available', {
        action: {
          label: 'Refresh now',
          onClick: () => updateSW(true),
        },
      });
    },
    onOfflineReady() {
      logger.log('App is ready to work offline');
    },
  });
} else {
  // Cleanup: unregister service workers in development
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => registration.unregister());
    });
  }
}

createRoot(document.getElementById("root")!).render(
  <CurrencyProvider>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </CurrencyProvider>
);
