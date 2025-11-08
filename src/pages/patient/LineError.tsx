import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

const LineError = () => {
  const [searchParams] = useSearchParams();
  const error = searchParams.get("error") || "unknown_error";

  const errorMessages: Record<string, { title: string; description: string }> = {
    missing_token: {
      title: "Missing Connection Link",
      description: "The connection link is incomplete. Please ask your practitioner to send you a new link.",
    },
    invalid_token: {
      title: "Invalid Connection Link",
      description: "This connection link is not valid. Please request a new link from your practitioner.",
    },
    expired_token: {
      title: "Link Has Expired",
      description: "This connection link has expired. LINE connection links are valid for 24 hours. Please request a new link from your practitioner.",
    },
    already_used: {
      title: "Link Already Used",
      description: "This connection link has already been used. If you need to update your LINE connection, please contact your practitioner.",
    },
    already_connected: {
      title: "Already Connected",
      description: "Your account is already connected to LINE. If you're experiencing issues, please contact your practitioner.",
    },
    wrong_token_type: {
      title: "Wrong Link Type",
      description: "This link is not for LINE connection. Please make sure you're using the correct link.",
    },
    verification_failed: {
      title: "Verification Failed",
      description: "We couldn't verify your connection link. Please try again or contact your practitioner for assistance.",
    },
    user_denied: {
      title: "Connection Cancelled",
      description: "You cancelled the LINE connection. If you'd like to connect your LINE account, please use the connection link again.",
    },
    line_error: {
      title: "LINE Connection Error",
      description: "There was an error connecting to LINE. Please try again later or contact your practitioner for assistance.",
    },
    unexpected_error: {
      title: "Unexpected Error",
      description: "An unexpected error occurred. Please try again or contact your practitioner for assistance.",
    },
    unknown_error: {
      title: "Connection Error",
      description: "There was a problem with your LINE connection. Please contact your practitioner for a new link.",
    },
  };

  const errorInfo = errorMessages[error] || errorMessages.unknown_error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md border-destructive">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl">{errorInfo.title}</CardTitle>
          <CardDescription className="text-base mt-2">
            {errorInfo.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Need help?</strong>
              <br />
              Contact your practitioner to receive a new connection link or for assistance with LINE integration.
            </p>
          </div>
          <Button
            onClick={() => window.close()}
            variant="outline"
            className="w-full"
          >
            Close This Window
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default LineError;
