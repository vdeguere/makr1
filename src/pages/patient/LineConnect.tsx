import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const LineConnect = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"verifying" | "redirecting">("verifying");

  useEffect(() => {
    const initiateLineConnection = async () => {
      if (!token) {
        navigate("/patient-connect/line-error?error=missing_token");
        return;
      }

      try {
        // Verify the token
        const { data, error } = await supabase.functions.invoke(
          "verify-patient-connection-token",
          {
            body: { token },
          }
        );

        if (error) {
          console.error("Token verification error:", error);
          navigate("/patient-connect/line-error?error=verification_failed");
          return;
        }

        if (!data?.valid) {
          const errorReason = data?.error || "invalid_token";
          navigate(`/patient-connect/line-error?error=${errorReason}`);
          return;
        }

        if (data.connection_type !== "line_connect") {
          navigate("/patient-connect/line-error?error=wrong_token_type");
          return;
        }

        // Token is valid, redirect to LINE OAuth
        setStatus("redirecting");

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const lineChannelId = "2008089729"; // LINE Channel ID
        const redirectUri = `${supabaseUrl}/functions/v1/line-oauth-callback`;
        
        const lineAuthUrl = new URL("https://access.line.me/oauth2/v2.1/authorize");
        lineAuthUrl.searchParams.append("response_type", "code");
        lineAuthUrl.searchParams.append("client_id", lineChannelId);
        lineAuthUrl.searchParams.append("redirect_uri", redirectUri);
        lineAuthUrl.searchParams.append("state", JSON.stringify({ token, origin: window.location.origin }));
        lineAuthUrl.searchParams.append("scope", "profile openid");

        console.log("Redirecting to LINE OAuth:", lineAuthUrl.toString());
        
        // Small delay to show the redirecting message
        setTimeout(() => {
          window.location.href = lineAuthUrl.toString();
        }, 500);

      } catch (err) {
        console.error("Error initiating LINE connection:", err);
        navigate("/patient-connect/line-error?error=unexpected_error");
      }
    };

    initiateLineConnection();
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {status === "verifying" ? "Verifying Connection" : "Redirecting to LINE"}
          </CardTitle>
          <CardDescription>
            {status === "verifying" 
              ? "Please wait while we verify your connection link..."
              : "Redirecting you to LINE to complete the connection..."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </CardContent>
      </Card>
    </div>
  );
};

export default LineConnect;
