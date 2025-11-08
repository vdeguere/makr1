import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, X, Share, Plus } from 'lucide-react';
import { isIOS, isAndroid } from '@/lib/platformDetection';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  
  const isIOSDevice = isIOS();
  const isAndroidDevice = isAndroid();
  const isSafari = isIOSDevice && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  
  const getPlatform = () => {
    if (isIOSDevice) return 'ios';
    if (isAndroidDevice) return 'android';
    return 'desktop';
  };
  
  // Track event using window.gtag directly (no Router context needed)
  const trackEvent = (eventName: string, params?: Record<string, any>) => {
    if (window.gtag) {
      window.gtag('event', eventName, params);
    }
  };

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Check if user previously dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      return;
    }

    // Handle iOS devices
    if (isIOSDevice && isSafari) {
      // Show iOS prompt after a short delay
      const timer = setTimeout(() => {
        setShowIOSPrompt(true);
        trackEvent('pwa_prompt_viewed', {
          platform: 'ios',
          browser: 'safari',
          prompt_type: 'manual'
        });
      }, 3000);
      
      return () => clearTimeout(timer);
    }

    // Handle Android/Desktop
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
      trackEvent('pwa_prompt_viewed', {
        platform: getPlatform(),
        prompt_type: 'native'
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isIOSDevice, isSafari]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    const platform = getPlatform();
    
    trackEvent('pwa_install_clicked', { platform });

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        trackEvent('pwa_install_success', { platform });
        console.log('PWA installed');
      } else {
        trackEvent('pwa_install_cancelled', { platform });
      }
    } catch (error) {
      trackEvent('pwa_install_failed', { 
        platform,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.error('PWA installation error:', error);
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    const platform = getPlatform();
    
    trackEvent('pwa_prompt_dismissed', { 
      platform,
      prompt_type: isIOSDevice ? 'manual' : 'native'
    });
    
    localStorage.setItem('pwa-install-dismissed', 'true');
    setShowPrompt(false);
    setShowIOSPrompt(false);
  };

  // iOS Safari prompt
  if (showIOSPrompt && isIOSDevice && isSafari) {
    return (
      <Card className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:max-w-sm z-[60] p-4 shadow-lg border-primary/20">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Download className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1">Install Xian Herbs</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Install this app on your iPhone for quick access and offline use
            </p>
            <div className="space-y-2 mb-3">
              <div className="flex items-center gap-2 text-xs">
                <div className="flex-shrink-0 w-6 h-6 bg-muted rounded flex items-center justify-center">
                  <Share className="w-3 h-3" />
                </div>
                <span className="text-muted-foreground">Tap the Share button</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="flex-shrink-0 w-6 h-6 bg-muted rounded flex items-center justify-center">
                  <Plus className="w-3 h-3" />
                </div>
                <span className="text-muted-foreground">Select "Add to Home Screen"</span>
              </div>
            </div>
            <Button onClick={handleDismiss} variant="ghost" size="sm" className="w-full">
              <X className="w-4 h-4 mr-2" />
              Dismiss
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // Android/Desktop prompt
  if (!showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <Card className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:max-w-sm z-[60] p-4 shadow-lg border-primary/20">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <Download className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm mb-1">Install Xian Herbs</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Add to your home screen for quick access and offline use
          </p>
          <div className="flex gap-2">
            <Button onClick={handleInstall} size="sm" className="flex-1">
              Install
            </Button>
            <Button onClick={handleDismiss} variant="ghost" size="sm">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
