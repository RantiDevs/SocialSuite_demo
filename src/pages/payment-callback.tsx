import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PaymentCallback() {
  const [, setLocation] = useLocation();
  const [reference, setReference] = useState<string | null>(null);
  const [status, setStatus] = useState<"verifying" | "success" | "failed">("verifying");
  const [licenseKey, setLicenseKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get("reference") || urlParams.get("trxref");
    setReference(ref);
  }, []);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["/api/license/paystack/verify", reference],
    queryFn: async () => {
      if (!reference) return null;
      
      const response = await fetch(`/api/license/paystack/verify/${reference}`);
      if (!response.ok) {
        throw new Error("Verification failed");
      }
      return response.json();
    },
    enabled: !!reference,
    retry: 3,
    retryDelay: 2000,
  });

  useEffect(() => {
    if (data) {
      if (data.success && data.licenseKey) {
        setStatus("success");
        setLicenseKey(data.licenseKey);
      } else if (data.success && data.status === "success") {
        setStatus("success");
        setLicenseKey(data.licenseKey || null);
      } else {
        setStatus("failed");
        setErrorMessage(data.message || "Payment verification failed");
      }
    } else if (isError) {
      setStatus("failed");
      setErrorMessage("Could not verify payment. Please contact support.");
    }
  }, [data, isError]);

  const copyLicenseKey = () => {
    if (licenseKey) {
      navigator.clipboard.writeText(licenseKey);
    }
  };

  if (!reference) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-card/90 backdrop-blur-xl border border-border">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-exclamation-triangle text-red-500 text-3xl"></i>
            </div>
            <CardTitle className="text-2xl">Invalid Request</CardTitle>
            <CardDescription>
              No payment reference found. Please try again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={() => setLocation("/purchase")}
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Back to Purchase
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-6">
      <Card className="w-full max-w-md bg-card/90 backdrop-blur-xl border border-border">
        {status === "verifying" && (
          <>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-spinner fa-spin text-blue-500 text-3xl"></i>
              </div>
              <CardTitle className="text-2xl">Verifying Payment</CardTitle>
              <CardDescription>
                Please wait while we confirm your payment...
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-sm text-muted-foreground">
                Reference: {reference}
              </div>
            </CardContent>
          </>
        )}

        {status === "success" && (
          <>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-check-circle text-green-500 text-3xl"></i>
              </div>
              <CardTitle className="text-2xl text-green-500">Payment Successful!</CardTitle>
              <CardDescription>
                Thank you for your purchase. Your license is ready!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {licenseKey ? (
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-2 text-center">Your License Key:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-background p-3 rounded text-center font-mono text-sm break-all">
                      {licenseKey}
                    </code>
                    <Button variant="outline" size="sm" onClick={copyLicenseKey}>
                      <i className="fas fa-copy"></i>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 text-center">
                    A copy has also been sent to your email
                  </p>
                </div>
              ) : (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <p className="text-sm text-center">
                    Your license key has been sent to your email address. Please check your inbox (and spam folder).
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <Button
                  className="w-full"
                  onClick={() => setLocation("/activate")}
                >
                  <i className="fas fa-key mr-2"></i>
                  Activate License
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setLocation("/")}
                >
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {status === "failed" && (
          <>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-times-circle text-red-500 text-3xl"></i>
              </div>
              <CardTitle className="text-2xl text-red-500">Payment Failed</CardTitle>
              <CardDescription>
                {errorMessage || "Something went wrong with your payment"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center text-sm text-muted-foreground">
                Reference: {reference}
              </div>
              <div className="space-y-3">
                <Button
                  className="w-full"
                  onClick={() => setLocation("/purchase")}
                >
                  <i className="fas fa-redo mr-2"></i>
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.location.href = "mailto:support@iganalytics.app?subject=Payment Issue - " + reference}
                >
                  <i className="fas fa-envelope mr-2"></i>
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
