import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

const ERROR_MESSAGES: Record<string, string> = {
  missing_params: "Missing authorization parameters from Xero.",
  token_exchange: "Failed to exchange authorization code. Please try again.",
  tenants_fetch: "Could not retrieve your Xero organisation.",
  no_tenants: "No Xero organisations found for this account.",
  storage_failed: "Failed to save your Xero connection. Please try again.",
  server_config: "Xero is not fully configured on the server.",
  access_denied: "You denied access to your Xero account.",
  unknown: "An unexpected error occurred. Please try again.",
};

const XeroCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    const tenant = searchParams.get("tenant");

    if (success === "true") {
      setStatus("success");
      setMessage(tenant ? `Connected to ${tenant}` : "Xero connected successfully!");
    } else if (error) {
      setStatus("error");
      setMessage(ERROR_MESSAGES[error] || ERROR_MESSAGES.unknown);
    } else {
      setStatus("loading");
      setMessage("Processing Xero connection...");
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-6 text-center">
          {status === "loading" && (
            <>
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-foreground mb-1">Connecting to Xero</h2>
              <p className="text-sm text-muted-foreground">{message}</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-1">Xero Connected!</h2>
              <p className="text-sm text-muted-foreground mb-6">{message}</p>
              <Button onClick={() => navigate("/dashboard/settings")} className="w-full">
                Go to Settings
              </Button>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-1">Connection Failed</h2>
              <p className="text-sm text-muted-foreground mb-6">{message}</p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => navigate("/dashboard/settings")}>
                  Back to Settings
                </Button>
                <Button className="flex-1" onClick={() => navigate("/dashboard/settings")}>
                  Try Again
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default XeroCallback;
