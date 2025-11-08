import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalytics } from "@/hooks/useAnalytics";

const CheckoutSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get("session_id");
  const { trackEvent } = useAnalytics();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Track purchase event
    if (sessionId) {
      trackEvent('purchase', {
        transaction_id: sessionId,
        payment_method: 'promptpay',
        currency: 'THB',
      });
    }

    // Simulate processing delay
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [sessionId, trackEvent]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Processing your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          <CardDescription>
            Your order has been confirmed and is being processed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessionId && (
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Session ID</p>
              <p className="text-xs font-mono break-all">{sessionId}</p>
            </div>
          )}
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>✓ Payment received via PromptPay</p>
            <p>✓ Order confirmation sent</p>
            <p>✓ Your herbs will be prepared for shipment</p>
          </div>
          <Button
            onClick={() => navigate("/")}
            className="w-full"
          >
            Return to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckoutSuccess;
