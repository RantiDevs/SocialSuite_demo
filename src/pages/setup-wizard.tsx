import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { AlertCircle, CheckCircle2 } from "lucide-react";

const DEFAULT_APIFY_TOKEN = "YOUR_APIFY_TOKEN_HERE";

export default function SetupWizard() {
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState({
    instagram_username: "",
    instagram_password: "",
    apify_token: DEFAULT_APIFY_TOKEN,
  });
  const [completed, setCompleted] = useState(false);

  const handleNext = async () => {
    if (!credentials.instagram_username || !credentials.instagram_password) {
      alert("Please enter Instagram credentials");
      return;
    }

    setLoading(true);
    try {
      await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      if (window.electron?.saveSetupComplete) {
        await window.electron.saveSetupComplete();
      }
      setCompleted(true);
      setTimeout(() => {
        window.location.href = "/activate";
      }, 2000);
    } catch (error) {
      alert("Failed to save configuration");
    } finally {
      setLoading(false);
    }
  };

  if (completed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Card className="w-full max-w-md p-8 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Setup Complete!</h2>
          <p className="text-muted-foreground mb-6">
            Your app is ready. Redirecting to license activation...
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome!</h1>
            <p className="text-muted-foreground">
              Enter your Instagram credentials to get started
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex gap-2">
              <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-500">
                We need your Instagram credentials to scrape your reel analytics
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Instagram Username</Label>
              <Input
                id="username"
                placeholder="@yourname"
                value={credentials.instagram_username}
                onChange={(e) =>
                  setCredentials({
                    ...credentials,
                    instagram_username: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Instagram Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={credentials.instagram_password}
                onChange={(e) =>
                  setCredentials({
                    ...credentials,
                    instagram_password: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apify">Apify Token (Optional)</Label>
              <Input
                id="apify"
                placeholder="Leave blank to use default token"
                value={credentials.apify_token}
                onChange={(e) =>
                  setCredentials({
                    ...credentials,
                    apify_token: e.target.value || DEFAULT_APIFY_TOKEN,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Using default token for metrics collection. Enter your own token from{" "}
                <button
                  onClick={() => {
                    if (window.electron?.openExternalLink) {
                      window.electron.openExternalLink("https://apify.com");
                    } else {
                      window.open("https://apify.com", "_blank");
                    }
                  }}
                  className="underline hover:no-underline"
                >
                  apify.com
                </button>{" "}
                if needed
              </p>
            </div>
          </div>

          <div className="mt-8">
            <Button
              className="w-full"
              onClick={handleNext}
              disabled={loading}
            >
              {loading ? "Setting up..." : "Complete Setup"}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-4">
            Your credentials are stored securely on your device
          </p>
        </div>
      </Card>
    </div>
  );
}
