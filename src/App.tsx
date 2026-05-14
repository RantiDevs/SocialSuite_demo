import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Configuration from "@/pages/configuration";
import ScraperControl from "@/pages/scraper-control";
import ReelAnalytics from "@/pages/reel-analytics";
import Followers from "@/pages/followers";
import VideoTagging from "@/pages/video-tagging";
import RunHistory from "@/pages/run-history";
import AdvancedAnalytics from "@/pages/advanced-analytics";
import LicenseActivation from "@/pages/license-activation";
import Subscription from "@/pages/subscription";
import Purchase from "@/pages/purchase";
import PurchaseCrypto from "@/pages/purchase-crypto";
import PaymentCallback from "@/pages/payment-callback";
import SetupWizard from "@/pages/setup-wizard";
import OutreachScraper from "@/pages/outreach-scraper";
import OutreachFollowers from "@/pages/outreach-followers";
import OutreachCampaigns from "@/pages/outreach-campaigns";
import OutreachCampaignDetail from "@/pages/outreach-campaign-detail";
import OutreachProxies from "@/pages/outreach-proxies";
import OutreachAccounts from "@/pages/outreach-accounts";
import TwitterScraper from "@/pages/twitter-scraper";
import SocialOverview from "@/pages/social-overview";
import TwoFAModal from "@/components/modals/two-fa-modal";
import { useTwoFA } from "@/hooks/use-twofa";
import Sidebar from "@/components/sidebar";
import MainLayout from "@/components/layout/main-layout";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";

function Router() {
  const [setupComplete, setSetupComplete] = useState(true);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const [location] = useLocation();

  useEffect(() => {
    setSetupComplete(true);
    setLoading(false);
  }, []);

  if (loading || authLoading) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-slate-400 font-medium animate-pulse">Loading Social Suite Pro...</p>
        </div>
      </div>
    );
  }

  // Demo mode: no auth gates, no login page
  return (
    <Switch>
      <Route path="/">
        <Landing />
      </Route>
      <Route>
        <div className="flex h-screen w-screen overflow-hidden bg-slate-950">
          <Sidebar />
          <MainLayout>
            <Switch>
              <Route path="/dashboard" component={SocialOverview} />
              <Route path="/activate" component={LicenseActivation} />
              <Route path="/purchase" component={Purchase} />
              <Route path="/purchase-crypto" component={PurchaseCrypto} />
              <Route path="/subscription" component={Subscription} />
              <Route path="/instagram" component={Dashboard} />
              <Route path="/configuration" component={Configuration} />
              <Route path="/scraper" component={ScraperControl} />
              <Route path="/reels" component={ReelAnalytics} />
              <Route path="/advanced-analytics" component={AdvancedAnalytics} />
              <Route path="/followers" component={Followers} />
              <Route path="/tagging" component={VideoTagging} />
              <Route path="/run-history" component={RunHistory} />
              <Route path="/outreach/scraper" component={OutreachScraper} />
              <Route path="/outreach/followers" component={OutreachFollowers} />
              <Route path="/outreach/campaigns" component={OutreachCampaigns} />
              <Route path="/outreach/proxies" component={OutreachProxies} />
              <Route path="/outreach/accounts" component={OutreachAccounts} />
              <Route path="/twitter" component={TwitterScraper} />
              <Route component={NotFound} />
            </Switch>
          </MainLayout>
        </div>
      </Route>
    </Switch>
  );
}

function App() {
  const { isOpen, currentRequest, handleSubmit, setIsOpen } = useTwoFA();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
          <TwoFAModal
            open={isOpen}
            onOpenChange={setIsOpen}
            request={currentRequest}
            onSubmit={handleSubmit}
          />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
