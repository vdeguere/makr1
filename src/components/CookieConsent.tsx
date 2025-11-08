import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';

const CONSENT_KEY = 'xian-herbs-cookie-consent';

export const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already given consent
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      setShowBanner(true);
    } else if (consent === 'granted') {
      // Update GA4 consent
      updateGAConsent('granted');
    }
  }, []);

  const updateGAConsent = (consentStatus: 'granted' | 'denied') => {
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        analytics_storage: consentStatus,
      });
    }
  };

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, 'granted');
    updateGAConsent('granted');
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem(CONSENT_KEY, 'denied');
    updateGAConsent('denied');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-md">
      <Card className="border-border shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="text-base">Cookie Consent</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleDecline}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription className="text-sm">
            We use cookies to improve your experience and analyze site usage. By clicking "Accept", you consent to the use of analytics cookies.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2 pt-0">
          <Button
            onClick={handleAccept}
            size="sm"
            className="flex-1"
          >
            Accept
          </Button>
          <Button
            onClick={handleDecline}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            Decline
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
