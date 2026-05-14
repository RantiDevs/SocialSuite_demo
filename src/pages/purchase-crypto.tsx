import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface PaymentConfig {
  flutterwave: {
    configured: boolean;
    publicKey: string;
    priceUsd: number;
    supportedCurrencies: string[];
    currencyRates: Record<string, number>;
  };
  nowpayments: {
    configured: boolean;
    priceUsd: number;
    paymentButtonId: string;
  };
  emailService: {
    configured: boolean;
  };
}

export default function PurchaseCrypto() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [showCustomPayment, setShowCustomPayment] = useState(false);
  const [paymentCreated, setPaymentCreated] = useState<{
    paymentId: string;
    payAddress: string;
    payAmount: number;
    payCurrency: string;
    expirationDate?: string;
  } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    }
  }, [user, authLoading, setLocation]);

  const { data: config } = useQuery<PaymentConfig>({
    queryKey: ["/api/license/payment-config"],
  });

  // Poll for payment status
  const { data: statusData } = useQuery({
    queryKey: ["/api/license/crypto/payment", paymentCreated?.paymentId],
    queryFn: async () => {
      if (!paymentCreated?.paymentId) return null;
      const response = await fetch(`/api/license/crypto/payment/${paymentCreated.paymentId}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!paymentCreated?.paymentId,
    refetchInterval: (query) => (query.state.data?.payment_status === "finished" ? false : 5000),
  });

  useEffect(() => {
    if (statusData?.payment_status === "finished" && statusData?.licenseKey) {
      toast({
        title: "Payment Successful!",
        description: "Your license key is ready. Copy it below and proceed to activation.",
      });
    }
  }, [statusData, toast]);

  const createPaymentMutation = useMutation({
    mutationFn: async (data: { payCurrency: string }) => {
      const response = await fetch("/api/license/crypto/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create payment");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setPaymentCreated(data);
      toast({
        title: "Payment Created",
        description: "Send the exact amount to the address shown below",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Payment Failed",
        description: error.message,
      });
    },
  });

  const handleCreatePayment = (currency: string) => {
    if (!user?.email) {
      toast({
        variant: "destructive",
        title: "Email Required",
        description: "Please log in with a valid email address",
      });
      return;
    }

    createPaymentMutation.mutate({
      payCurrency: currency,
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const priceUsd = config?.nowpayments?.priceUsd || 15.50;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <Card className="bg-card/90 backdrop-blur-xl border border-border">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <i className="fab fa-bitcoin text-primary text-3xl"></i>
            </div>
            <CardTitle className="text-3xl">Pay with Cryptocurrency</CardTitle>
            <CardDescription>
              Purchase your license using Bitcoin, Ethereum, or other cryptocurrencies
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-6 space-y-4">
              <h3 className="font-semibold text-lg">Crypto Payment Benefits:</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <i className="fas fa-check text-green-500 mt-1"></i>
                  <span>Secure and private transactions</span>
                </li>
                <li className="flex items-start gap-2">
                  <i className="fas fa-check text-green-500 mt-1"></i>
                  <span>Support for 100+ cryptocurrencies</span>
                </li>
                <li className="flex items-start gap-2">
                  <i className="fas fa-check text-green-500 mt-1"></i>
                  <span>Instant license delivery after confirmation</span>
                </li>
                <li className="flex items-start gap-2">
                  <i className="fas fa-check text-green-500 mt-1"></i>
                  <span>License key sent directly to your email</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded-lg p-6 text-center border border-orange-500/20">
              <p className="text-sm text-muted-foreground mb-2">Monthly Subscription</p>
              <p className="text-4xl font-bold text-orange-400">
                ${priceUsd.toFixed(2)} USD
              </p>
              <p className="text-sm text-muted-foreground mt-2">paid in cryptocurrency</p>
            </div>

            {!paymentCreated ? (
              <>
                {user && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 space-y-3">
                    <p className="text-sm font-semibold">License will be sent to:</p>
                    <div className="bg-background/50 rounded p-3">
                      <p className="text-sm text-muted-foreground">Email:</p>
                      <p className="font-mono text-sm font-bold text-foreground">{user.email}</p>
                    </div>
                  </div>
                )}

                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground mb-6">
                    Select your preferred cryptocurrency to pay:
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCreatePayment("btc")}
                      disabled={createPaymentMutation.isPending || !user}
                    >
                      <i className="fab fa-bitcoin mr-1"></i> BTC
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCreatePayment("eth")}
                      disabled={createPaymentMutation.isPending || !user}
                    >
                      <i className="fab fa-ethereum mr-1"></i> ETH
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCreatePayment("usdttrc20")}
                      disabled={createPaymentMutation.isPending || !user}
                    >
                      USDT (TRC20)
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCreatePayment("ltc")}
                      disabled={createPaymentMutation.isPending || !user}
                    >
                      LTC
                    </Button>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-6">
                    Powered by NowPayments - Accepts 300+ cryptocurrencies
                  </p>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-500 mb-2">
                    <i className={`fas ${statusData?.payment_status === "finished" ? "fa-check-double" : "fa-check-circle"}`}></i>
                    <span className="font-semibold">
                      {statusData?.payment_status === "finished" ? "Payment Successful!" : "Payment Created!"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {statusData?.payment_status === "finished" 
                      ? "Your payment has been confirmed and license generated. You are being redirected..."
                      : `Send the exact amount below to complete your payment. Your license key will be emailed to ${user?.email} after confirmation.`}
                  </p>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 space-y-4">
                  <div>
                    <Label className="text-muted-foreground text-xs">Amount to Send</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 bg-background p-2 rounded text-lg font-mono">
                        {paymentCreated.payAmount} {paymentCreated.payCurrency.toUpperCase()}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(paymentCreated.payAmount.toString(), "Amount")}
                      >
                        <i className="fas fa-copy"></i>
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-muted-foreground text-xs">Payment Address</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 bg-background p-2 rounded text-xs font-mono break-all">
                        {paymentCreated.payAddress}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(paymentCreated.payAddress, "Address")}
                      >
                        <i className="fas fa-copy"></i>
                      </Button>
                    </div>
                  </div>

                  {paymentCreated.expirationDate && (
                    <div className="text-center text-sm text-muted-foreground">
                      <i className="fas fa-clock mr-1"></i>
                      Payment expires: {new Date(paymentCreated.expirationDate).toLocaleString()}
                    </div>
                  )}

                  {statusData?.payment_status === "finished" && (
                    <div className="pt-4 space-y-3">
                      <div>
                        <Label className="text-muted-foreground text-xs">Generated License Key:</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="flex-1 bg-background p-3 rounded text-sm font-mono font-bold text-green-400 break-all">
                            {statusData.licenseKey}
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(statusData.licenseKey, "License Key")}
                          >
                            <i className="fas fa-copy"></i>
                          </Button>
                        </div>
                      </div>
                      <Button 
                        className="w-full bg-green-600 hover:bg-green-700" 
                        onClick={() => setLocation("/activate")}
                      >
                        <i className="fas fa-key mr-2"></i>
                        Go to Activation
                      </Button>
                    </div>
                  )}
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-yellow-500 mb-2">
                    <i className="fas fa-info-circle"></i>
                    <span className="font-semibold">Important</span>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>Send the <strong>exact amount</strong> shown above</li>
                    <li>Your license will be emailed after blockchain confirmation</li>
                    <li>Confirmation typically takes 10-30 minutes</li>
                  </ul>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setPaymentCreated(null);
                    setShowCustomPayment(false);
                  }}
                >
                  <i className="fas fa-arrow-left mr-2"></i>
                  Create New Payment
                </Button>
              </div>
            )}

            <div className="border-t pt-6 flex gap-3 justify-center flex-wrap">
              <Button
                variant="outline"
                onClick={() => setLocation("/activate")}
              >
                <i className="fas fa-key mr-2"></i>
                Already have a license key?
              </Button>
              <Button
                variant="ghost"
                onClick={() => setLocation("/")}
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Back to Dashboard
              </Button>
            </div>

            <div className="text-center">
              <Button
                variant="ghost"
                onClick={() => setLocation("/activate")}
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Back to Activation
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
