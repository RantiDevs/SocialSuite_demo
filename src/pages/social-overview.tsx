import { useQuery } from "@tanstack/react-query";
import StatCard from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import ThemeToggle from "@/components/theme-toggle";

export default function SocialOverview() {
  const { data: igStats } = useQuery<any>({
    queryKey: ['/api/analytics/total-reels'],
  });

  const { data: outreachStats } = useQuery<any>({
    queryKey: ['/api/outreach/stats'],
  });

  const { data: twitterStats } = useQuery<any>({
    queryKey: ['/api/twitter/stats'],
  });

  const stats = [
    {
      title: "Instagram",
      icon: "fab fa-instagram",
      color: "from-purple-600 to-pink-500",
      metrics: [
        { label: "Total Reels", value: igStats?.count || "0" },
        { label: "Growth", value: "+12.4%", trend: "positive" },
      ],
      link: "/reels",
      buttonText: "View Insights"
    },
    {
      title: "Twitter X",
      icon: "fab fa-twitter",
      color: "from-blue-500 to-cyan-400",
      metrics: [
        { label: "Tweets Scraped", value: "2,481" },
        { label: "Lead Quality", value: "High" },
      ],
      link: "/twitter",
      buttonText: "Run Scraper"
    },
    {
      title: "Mass Outreach",
      icon: "fas fa-paper-plane",
      color: "from-emerald-500 to-teal-400",
      metrics: [
        { label: "Active Campaigns", value: outreachStats?.activeCampaigns || "0" },
        { label: "DMs Sent Today", value: "124" },
      ],
      link: "/outreach/campaigns",
      buttonText: "Manage Campaigns"
    }
  ];

  return (
    <div className="flex flex-col min-h-full bg-transparent text-slate-100">
      <header className="bg-slate-900/50 border-b border-slate-800 px-6 py-6 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Social Suite Overview
            </h1>
            <p className="text-slate-500 font-medium mt-1">Unified performance tracking across all channels</p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="p-8 space-y-8">
        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((platform, idx) => (
            <Card key={idx} className="bg-slate-900/40 border-slate-800/60 overflow-hidden group hover:border-slate-700 transition-all duration-300">
              <div className={`h-1 w-full bg-gradient-to-r ${platform.color}`} />
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${platform.color} flex items-center justify-center text-white shadow-lg`}>
                    <i className={`${platform.icon} text-xl`} />
                  </div>
                  <Link href={platform.link}>
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                      <i className="fas fa-external-link-alt text-xs mr-2" />
                      Manage
                    </Button>
                  </Link>
                </div>
                <CardTitle className="text-xl font-bold mt-4">{platform.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {platform.metrics.map((m, i) => (
                    <div key={i}>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500">{m.label}</p>
                      <p className={`text-xl font-black mt-1 ${m.trend === 'positive' ? 'text-emerald-400' : 'text-slate-100'}`}>
                        {m.value}
                      </p>
                    </div>
                  ))}
                </div>
                <Link href={platform.link}>
                  <Button className={`w-full bg-gradient-to-r ${platform.color} text-white font-bold rounded-xl mt-2`}>
                    {platform.buttonText}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-slate-900/40 border-slate-800/60">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <i className="fas fa-bolt text-amber-400" />
                Live Automation Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { label: "IG Reel Scraper", status: "Active", time: "Just now", color: "text-emerald-400" },
                  { label: "Twitter Thread Miner", status: "Idle", time: "2h ago", color: "text-slate-500" },
                  { label: "Mass DM Engine", status: "Running", time: "Campaign #42", color: "text-blue-400" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <div>
                        <p className="text-sm font-bold">{item.label}</p>
                        <p className="text-xs text-slate-500">{item.time}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-black uppercase tracking-tighter ${item.color}`}>{item.status}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/40 border-slate-800/60">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <i className="fas fa-layer-group text-indigo-400" />
                Suite Integration Highlights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                 <h4 className="text-sm font-bold text-indigo-400">Cross-Platform Reach</h4>
                 <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                   Your social suite is currently tracking data across 3 platforms with unified identity management.
                 </p>
               </div>
               <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                 <h4 className="text-sm font-bold text-emerald-400">Outreach Efficiency</h4>
                 <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                   Automated leads from Instagram are being funneled directly into Outreach campaigns.
                 </p>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
