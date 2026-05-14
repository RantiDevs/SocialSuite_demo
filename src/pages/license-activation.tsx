import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function LicenseActivation() {
  const [, setLocation] = useLocation();
  const [licenseKey, setLicenseKey] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [lookupEmail, setLookupEmail] = useState("");
  const [showLookup, setShowLookup] = useState(false);
  const { toast } = useToast();

  const { data: deviceInfo } = useQuery<{
    deviceId: string;
    deviceName: string;
    platform: string;
    arch: string;
  }>({
    queryKey: ["/api/license/device-info"],
  });

  const { data: licenseStatus } = useQuery<{
    hasLicense: boolean;
    isValid: boolean;
    daysRemaining?: number;
    license?: {
      status: string;
      activatedAt: string;
      expiresAt: string | null;
      licenseType?: string;
    };
  }>({
    queryKey: ["/api/license/status"],
    refetchInterval: 5000,
  });

  const activateMutation = useMutation({
    mutationFn: async (data: { licenseKey: string; deviceName?: string }) => {
      const response = await fetch("/api/license/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        try {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to activate your license. Please try again.");
        } catch (e) {
          throw new Error("Failed to activate your license. Please try again.");
        }
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "License Activated",
        description: "Your license has been successfully activated.",
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Activation Failed",
        description: error.message || "Failed to activate your license. Please try again.",
      });
    },
  });

  const lookupMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch(`/api/license/lookup/${encodeURIComponent(email)}`);
      if (!response.ok) {
        throw new Error("Lookup failed");
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (data.licenses && data.licenses.length > 0) {
        const activeLicense = data.licenses.find((l: any) => 
          l.status === "pending_activation" || l.status === "active"
        );
        if (activeLicense) {
          setLicenseKey(activeLicense.licenseKey);
          toast({
            title: "License Found",
            description: "Your license key has been filled in. Click Activate to continue.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "No Active License",
            description: "No active license found for this email. Please purchase a new one.",
          });
        }
      } else {
        toast({
          variant: "destructive",
          title: "No License Found",
          description: "No license found for this email address.",
        });
      }
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Lookup Failed",
        description: "Could not find license. Please check your email address.",
      });
    },
  });

  const resendEmailMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch("/api/license/resend-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to resend email");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email Sent",
        description: "License key has been resent to your email.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to Send",
        description: error.message,
      });
    },
  });

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    activateMutation.mutate({ licenseKey, deviceName });
  };

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (lookupEmail) {
      lookupMutation.mutate(lookupEmail);
    }
  };

  if (licenseStatus?.hasLicense && licenseStatus?.isValid) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-card/90 backdrop-blur-xl border border-border rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-key text-primary text-3xl"></i>
            </div>
            <h1 className="text-3xl font-bold mb-2">Activate Your License</h1>
            <p className="text-muted-foreground">
              Enter your license key to activate the app
            </p>
          </div>

          <form onSubmit={handleActivate} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="license-key">License Key</Label>
              <Input
                id="license-key"
                type="text"
                placeholder="IGANA-XXXX-XXXX-XXXX-XXXXMXXXX"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                required
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Format: IGANA-XXXX-XXXX-XXXX-XXXXMXXXX
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="device-name">Device Name (Optional)</Label>
              <Input
                id="device-name"
                type="text"
                placeholder={deviceInfo?.deviceName || "My Computer"}
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Device ID: {deviceInfo?.deviceId?.slice(0, 16)}...
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={activateMutation.isPending || !licenseKey}
            >
              {activateMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <i className="fas fa-spinner fa-spin"></i>
                  Activating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <i className="fas fa-check"></i>
                  Activate License
                </span>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-border">
            <button
              type="button"
              className="text-sm text-primary hover:underline w-full text-center"
              onClick={() => setShowLookup(!showLookup)}
            >
              {showLookup ? "Hide" : "Lost your license key? Look it up by email"}
            </button>

            {showLookup && (
              <form onSubmit={handleLookup} className="mt-4 space-y-3">
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={lookupEmail}
                    onChange={(e) => setLookupEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    disabled={lookupMutation.isPending || !lookupEmail}
                  >
                    {lookupMutation.isPending ? (
                      <i className="fas fa-spinner fa-spin"></i>
                    ) : (
                      <i className="fas fa-search"></i>
                    )}
                  </Button>
                </div>
                {lookupEmail && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => resendEmailMutation.mutate(lookupEmail)}
                    disabled={resendEmailMutation.isPending}
                  >
                    <i className="fas fa-envelope mr-2"></i>
                    Resend License Email
                  </Button>
                )}
              </form>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-border">
            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Don't have a license key?
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation("/purchase-crypto")}
                >
                  <i className="fab fa-bitcoin mr-2"></i>
                  Purchase with Crypto
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              className="text-muted-foreground"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Back to Dashboard
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              Platform: {deviceInfo?.platform} • Arch: {deviceInfo?.arch}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
