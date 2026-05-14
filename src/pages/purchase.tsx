import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function Purchase() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: config } = useQuery({
    queryKey: ["/api/license/payment-config"],
  });

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    }
  }, [user, authLoading, setLocation]);

  const handleCryptoPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.email) {
      toast({
        variant: "destructive",
        title: "Email Required",
        description: "Please log in with a valid email address",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch("/api/license/crypto/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ payCurrency: "btc" }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create payment");
      }

      const data = await response.json();
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to initiate payment",
      });
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <Card className="bg-card/90 backdrop-blur-xl border border-border">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <i className="fab fa-bitcoin text-primary text-3xl"></i>
            </div>
            <CardTitle className="text-3xl">Purchase License with Crypto</CardTitle>
            <CardDescription>
              Get instant access to all features with a single crypto payment
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-6 space-y-4">
              <h3 className="font-semibold text-lg">Premium Features Include:</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <i className="fas fa-check text-green-500 mt-1"></i>
                  <span>Unlimited Instagram scraping and analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <i className="fas fa-check text-green-500 mt-1"></i>
                  <span>Automated scheduling for hands-free tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <i className="fas fa-check text-green-500 mt-1"></i>
                  <span>Advanced analytics and insights</span>
                </li>
                <li className="flex items-start gap-2">
                  <i className="fas fa-check text-green-500 mt-1"></i>
                  <span>Export data to CSV for further analysis</span>
                </li>
                <li className="flex items-start gap-2">
                  <i className="fas fa-check text-green-500 mt-1"></i>
                  <span>Priority support and updates</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded-lg p-6 text-center border border-orange-500/20">
              <p className="text-sm text-muted-foreground mb-2">One-Time License Payment</p>
              <div className="text-3xl font-bold text-primary">Pay in Crypto</div>
              <p className="text-sm text-muted-foreground mt-2">Bitcoin, Ethereum, and 50+ cryptocurrencies accepted</p>
              <p className="text-xs text-muted-foreground mt-1">Powered by NowPayments</p>
            </div>

            {user && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 space-y-3">
                <p className="text-sm font-semibold">Payment will be sent to:</p>
                <div className="bg-background/50 rounded p-3">
                  <p className="text-sm text-muted-foreground">Email:</p>
                  <p className="font-mono text-sm font-bold text-foreground">{user.email}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleCryptoPayment} className="space-y-4">
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isProcessing || !user}
              >
                {isProcessing ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Processing...
                  </>
                ) : (
                  <>
                    <i className="fab fa-bitcoin mr-2"></i>
                    Continue to Crypto Payment
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Secure payment powered by NowPayments. Fast, secure, and anonymous.
              </p>
            </form>

            <div className="border-t pt-6 flex gap-3 justify-center flex-wrap">
              <Button
                variant="outline"
                onClick={() => setLocation("/activate")}
              >
                <i className="fas fa-key mr-2"></i>
                Already have a license key?
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation("/purchase-crypto")}
              >
                <i className="fab fa-bitcoin mr-2"></i>
                Pay with Crypto
              </Button>
              <Button
                variant="ghost"
                onClick={() => setLocation("/")}
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
