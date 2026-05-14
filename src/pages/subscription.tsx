import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface PaymentConfig {
  nowpayments: {
    configured: boolean;
    priceUsd: number;
  };
  emailService: {
    configured: boolean;
  };
}

export default function Subscription() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: licenseStatus, refetch } = useQuery<{
    hasLicense: boolean;
    isValid: boolean;
    daysRemaining?: number;
    license?: {
      status: string;
      activatedAt: string;
      expiresAt: string | null;
      customerEmail: string;
      customerName: string;
      productId: string;
      licenseType?: string;
    };
  }>({
    queryKey: ["/api/license/status"],
    refetchOnWindowFocus: true,
    staleTime: 0,
    gcTime: 0,
  });

  const { data: deviceInfo } = useQuery<{
    deviceId: string;
    deviceName: string;
    platform: string;
    arch: string;
  }>({
    queryKey: ["/api/license/device-info"],
  });

  const { data: paymentConfig } = useQuery<PaymentConfig>({
    queryKey: ["/api/license/payment-config"],
  });


  const getStatusBadge = (status: string) => {
    const badges = {
      active: "bg-green-500/10 text-green-500 border-green-500/20",
      expired: "bg-red-500/10 text-red-500 border-red-500/20",
      inactive: "bg-gray-500/10 text-gray-500 border-gray-500/20",
      pending_activation: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      deactivated: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    };
    return badges[status as keyof typeof badges] || badges.inactive;
  };

  const formatDate = (dateString: string | null, context?: string) => {
    if (!dateString) {
      if (licenseStatus?.license?.status === "pending_activation") {
        if (context === "activated") return "Not activated yet";
        if (context === "expires") return "Will be set upon activation";
      }
      return "N/A";
    }
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "N/A";
      }
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (e) {
      return "N/A";
    }
  };

  const isExpired =
    licenseStatus?.license?.expiresAt &&
    new Date(licenseStatus.license.expiresAt) < new Date();

  const daysRemaining = licenseStatus?.daysRemaining;
  const showRenewalWarning = daysRemaining !== undefined && daysRemaining <= 7 && daysRemaining > 0;

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <pre className="hidden">{JSON.stringify(licenseStatus, null, 2)}</pre>
          <div>
            <h1 className="text-3xl font-bold mb-2">License & Subscription</h1>
            <p className="text-muted-foreground">
              Manage your license and subscription details
            </p>
          </div>

          {!licenseStatus?.hasLicense ? (
            <Card className="p-8 text-center">
              <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-key text-muted-foreground text-3xl"></i>
              </div>
              <h2 className="text-2xl font-bold mb-2">No Active License</h2>
              <p className="text-muted-foreground mb-6">
                You don't have an active license on this device. Purchase a license or activate an existing one.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Button onClick={() => setLocation("/purchase-crypto")}>
                  <i className="fab fa-bitcoin mr-2"></i>
                  Purchase License
                </Button>
                <Button variant="outline" onClick={() => setLocation("/activate")}>
                  <i className="fas fa-key mr-2"></i>
                  Activate License
                </Button>
                <Button variant="ghost" onClick={() => setLocation("/")}>
                  <i className="fas fa-arrow-left mr-2"></i>
                  Back to Dashboard
                </Button>
              </div>
            </Card>
          ) : (
            <>
              {showRenewalWarning && (
                <Card className="p-4 bg-yellow-500/10 border-yellow-500/20">
                  <div className="flex items-center gap-3">
                    <i className="fas fa-exclamation-triangle text-yellow-500 text-xl"></i>
                    <div className="flex-1">
                      <p className="font-semibold text-yellow-500">
                        Your subscription expires in {daysRemaining} days
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Renew now to avoid interruption to your service.
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      className="bg-yellow-500 hover:bg-yellow-600"
                      onClick={() => setLocation("/purchase-crypto")}
                    >
                      Renew Now
                    </Button>
                  </div>
                </Card>
              )}

              {isExpired && (
                <Card className="p-4 bg-red-500/10 border-red-500/20">
                  <div className="flex items-center gap-3">
                    <i className="fas fa-times-circle text-red-500 text-xl"></i>
                    <div className="flex-1">
                      <p className="font-semibold text-red-500">
                        Your subscription has expired
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Renew your subscription to continue using all features.
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => setLocation("/purchase-crypto")}
                    >
                      Renew Subscription
                    </Button>
                  </div>
                </Card>
              )}

              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-6">License Details</h2>
                <div className="grid gap-4">
                  <div className="flex justify-between items-center py-3 border-b">
                    <span className="text-muted-foreground">Status</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadge(licenseStatus.license?.status || "inactive")}`}>
                      {licenseStatus.license?.status === "pending_activation" 
                        ? "Pending Activation" 
                        : (licenseStatus.license?.status ? licenseStatus.license.status.charAt(0).toUpperCase() + licenseStatus.license.status.slice(1) : "Unknown")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b">
                    <span className="text-muted-foreground">License Type</span>
                    <span className="font-medium">
                      {licenseStatus.license?.licenseType === "monthly" ? "Monthly Subscription" :
                       licenseStatus.license?.licenseType === "yearly" ? "Yearly Subscription" :
                       licenseStatus.license?.licenseType === "lifetime" ? "Lifetime License" : "Standard"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b">
                    <span className="text-muted-foreground">Activated On</span>
                    <span className="font-medium text-slate-100">{formatDate(licenseStatus.license?.activatedAt || null, "activated")}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b">
                    <span className="text-muted-foreground">Expires On</span>
                    <span className={`font-medium ${isExpired ? "text-red-500" : "text-slate-100"}`}>
                      {formatDate(licenseStatus.license?.expiresAt || null, "expires")}
                      {daysRemaining !== undefined && daysRemaining > 0 && !isExpired && (
                        <span className="text-sm text-slate-500 ml-2">
                          ({daysRemaining} days remaining)
                        </span>
                      )}
                    </span>
                  </div>
                  {licenseStatus.license?.customerEmail && (
                    <div className="flex justify-between items-center py-3 border-b">
                      <span className="text-muted-foreground">Registered Email</span>
                      <span className="font-medium">{licenseStatus.license.customerEmail}</span>
                    </div>
                  )}
                  {licenseStatus.license?.customerName && (
                    <div className="flex justify-between items-center py-3">
                      <span className="text-muted-foreground">Registered Name</span>
                      <span className="font-medium">{licenseStatus.license.customerName}</span>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                <div className="grid gap-4">
                  {showRenewalWarning && (
                    <Button 
                      variant="outline" 
                      className="h-auto py-4 flex-col gap-2"
                      onClick={() => setLocation("/purchase-crypto")}
                    >
                      <i className="fab fa-bitcoin text-xl text-orange-500"></i>
                      <span className="font-medium">Renew License with Crypto</span>
                      <span className="text-xs text-muted-foreground">
                        Your license expires in {daysRemaining} days
                      </span>
                    </Button>
                  )}

                  {!licenseStatus?.isValid && (
                    <Button 
                      variant="outline" 
                      className="h-auto py-4 flex-col gap-2"
                      onClick={() => setLocation("/purchase-crypto")}
                    >
                      <i className="fab fa-bitcoin text-xl text-orange-500"></i>
                      <span className="font-medium">Buy License with Crypto</span>
                      <span className="text-xs text-muted-foreground">
                        {paymentConfig?.nowpayments.configured 
                          ? `$${paymentConfig.nowpayments.priceUsd.toFixed(2)}` 
                          : "Pay with cryptocurrency"}
                      </span>
                    </Button>
                  )}

                  {!licenseStatus?.isValid && (
                    <Button 
                      variant="outline" 
                      className="h-auto py-4 flex-col gap-2"
                      onClick={() => setLocation("/activate")}
                    >
                      <i className="fas fa-key text-xl text-blue-500"></i>
                      <span className="font-medium">Activate License Key</span>
                      <span className="text-xs text-muted-foreground">
                        Already have a license key?
                      </span>
                    </Button>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-6">Device Information</h2>
                <div className="grid gap-4">
                  <div className="flex justify-between items-center py-3 border-b">
                    <span className="text-muted-foreground">Device Name</span>
                    <span className="font-medium">{deviceInfo?.deviceName || "Unknown"}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b">
                    <span className="text-muted-foreground">Platform</span>
                    <span className="font-medium capitalize">{deviceInfo?.platform || "Unknown"}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b">
                    <span className="text-muted-foreground">Architecture</span>
                    <span className="font-medium">{deviceInfo?.arch || "Unknown"}</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-muted-foreground">Device ID</span>
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {deviceInfo?.deviceId?.slice(0, 24)}...
                    </code>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-muted/30">
                <h2 className="text-xl font-semibold mb-4">Offline Usage</h2>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-wifi-slash text-green-500 text-xl"></i>
                  </div>
                  <div>
                    <p className="font-medium mb-2">Works Offline After Activation</p>
                    <p className="text-sm text-muted-foreground">
                      This app works offline after activation. You can view all your data without an
                      internet connection. However, you need to be online to run the scraper, as it
                      requires internet access to collect data from Instagram.
                    </p>
                  </div>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
