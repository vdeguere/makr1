import { useNavigate, useSearchParams } from "react-router-dom";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useEffect } from "react";

const CheckoutCancel = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    // Track checkout abandonment
    trackEvent('checkout_abandoned', {
      abandonment_reason: 'user_cancelled',
    });
  }, [trackEvent]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <XCircle className="h-10 w-10 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Payment Cancelled</CardTitle>
          <CardDescription>
            Your payment was cancelled. No charges were made.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
            <p>You can try again by clicking the button below.</p>
            <p className="text-muted-foreground">
              If you experienced any issues, please contact support.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {token && (
              <Button
                onClick={() => navigate(`/checkout/${token}`)}
                className="w-full"
              >
                Try Again
              </Button>
            )}
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="w-full"
            >
              Return to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckoutCancel;
