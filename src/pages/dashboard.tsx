import { useState } from "react";
import StatCard from "@/components/stat-card";
import FollowersChart from "@/components/followers-chart";
import PerformanceChart from "@/components/performance-chart";
import ReelsTable from "@/components/reels-table";
import ScraperStatus from "@/components/scraper-status";
import CreatorSelector from "@/components/creator-selector";
import ThemeToggle from "@/components/theme-toggle";
import { useQuery } from "@tanstack/react-query";
import { filterReelsByDate } from "@/lib/dateFilter";

interface ReelData {
  username: string;
  likes: number;
  comments: number;
  views: number;
  datePosted: string;
}

interface FollowerData {
  username: string;
  followers: number;
  following?: number;
  mediaCount?: number;
  clipsCount?: number;
  isVerified?: string;
  category?: string;
  biography?: string;
  externalUrl?: string;
  publicEmail?: string;
  publicPhone?: string;
  reelsScraped: number;
  timestamp: string;
}

export default function Dashboard() {
  const [timeFilter, setTimeFilter] = useState("all");
  const [selectedCreator, setSelectedCreator] = useState<string | null>(null);

  const creatorParam = selectedCreator ? `?creator=${selectedCreator}` : '';

  const { data: reels = [] } = useQuery<ReelData[]>({
    queryKey: [`/api/reels${creatorParam}`],
  });

  const { data: reelsCountData } = useQuery<{ count: number }>({
    queryKey: [`/api/analytics/total-reels${creatorParam}`],
  });

  const { data: followerData = [] } = useQuery<FollowerData[]>({
    queryKey: ['/api/followers/latest'],
  });

  const { data: scraperStatus } = useQuery<{ status: string }>({
    queryKey: ['/api/scrape/status'],
    refetchInterval: 1500,
    staleTime: 500,
    gcTime: 30000,
  });

  const { data: allFollowerHistory = [] } = useQuery<FollowerData[]>({
    queryKey: ['/api/followers'],
    refetchInterval: 2000,
    staleTime: 1000,
  });

  const { data: profileDetails = [] } = useQuery<any[]>({
    queryKey: [selectedCreator ? `/api/analytics/profile-details?creator=${selectedCreator}` : '/api/analytics/profile-details'],
  });

  const latestProfile = profileDetails.length > 0 ? profileDetails[profileDetails.length - 1] : null;

  const timeFilters = [
    { label: "7d", value: "7d" },
    { label: "14d", value: "14d" },
    { label: "30d", value: "30d" },
    { label: "90d", value: "90d" },
    { label: "180d", value: "180d" },
    { label: "YTD", value: "ytd" },
    { label: "All", value: "all" },
  ];

  let filteredReels = filterReelsByDate(reels, timeFilter);
  
  if (selectedCreator) {
    filteredReels = filteredReels.filter(r => r.username === selectedCreator);
  }

  const totalReels = reelsCountData?.count || 0;
  const totalLikes = filteredReels.reduce((sum, r) => sum + (r.likes > 0 ? r.likes : 0), 0);
  const totalComments = filteredReels.reduce((sum, r) => sum + r.comments, 0);
  const totalViews = filteredReels.reduce((sum, r) => sum + r.views, 0);
  const avgEngagement = totalViews > 0 
    ? ((totalLikes + totalComments) / totalViews * 100).toFixed(1)
    : '0.0';

  const totalFollowers = followerData.reduce((sum, creator) => sum + creator.followers, 0);
  const selectedCreatorData = selectedCreator 
    ? followerData.find(c => c.username === selectedCreator)
    : null;
  
  const displayFollowers = selectedCreatorData 
    ? selectedCreatorData.followers.toLocaleString()
    : totalFollowers.toLocaleString();

  // Calculate follower changes
  const calculateFollowerChange = () => {
    if (allFollowerHistory.length < 2) return { change: "No history", changeType: "neutral" as const };
    
    const sorted = [...allFollowerHistory].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    const latest = sorted[0];
    const previous = sorted[1];
    
    if (selectedCreator) {
      const latestCreator = sorted.find(s => s.username === selectedCreator);
      const prevCreator = sorted.slice(1).find(s => s.username === selectedCreator);
      
      if (!latestCreator || !prevCreator) return { change: "New creator", changeType: "neutral" as const };
      
      const diff = latestCreator.followers - prevCreator.followers;
      const changeType = diff > 0 ? "positive" as const : diff < 0 ? "negative" as const : "neutral" as const;
      return { change: `${diff > 0 ? '+' : ''}${diff} from last run`, changeType };
    }
    
    const latestTotal = sorted
      .filter(s => s.timestamp === latest.timestamp)
      .reduce((sum, s) => sum + s.followers, 0);
    const prevTotal = sorted
      .filter(s => s.timestamp === previous.timestamp)
      .reduce((sum, s) => sum + s.followers, 0);
    
    const diff = latestTotal - prevTotal;
    const changeType = diff > 0 ? "positive" as const : diff < 0 ? "negative" as const : "neutral" as const;
    return { change: `${diff > 0 ? '+' : ''}${diff} from last run`, changeType };
  };

  // Calculate last run time
  const getLastRunTime = () => {
    if (allFollowerHistory.length === 0) return "Never";
    
    const sorted = [...allFollowerHistory].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    const lastRun = new Date(sorted[0].timestamp);
    const now = new Date();
    const diffMs = now.getTime() - lastRun.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 24) {
      const days = Math.floor(diffHours / 24);
      return `${days}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else if (diffMins > 0) {
      return `${diffMins}m ago`;
    } else {
      return "Just now";
    }
  };

  const followerChange = calculateFollowerChange();
  const lastRunTime = getLastRunTime();
  const runStatus = scraperStatus?.status === 'running' ? 'Running...' : 'Completed';
  const runStatusType = scraperStatus?.status === 'running' ? 'neutral' as const : 'positive' as const;

  const mockStats = {
    followers: { current: displayFollowers, change: followerChange.change, changeType: followerChange.changeType },
    totalReels: { current: totalReels.toString(), change: `${filteredReels.length} in selected period`, changeType: "neutral" as const },
    avgEngagement: { current: `${avgEngagement}%`, change: "Likes + Comments / Views", changeType: "neutral" as const },
    lastRun: { current: lastRunTime, change: runStatus, changeType: runStatusType },
  };

  return (
    <div className="flex flex-col min-h-full">
      <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold" data-testid="page-title">Dashboard</h1>
              <p className="text-muted-foreground">
                {selectedCreator ? "Viewing individual creator analytics" : "Viewing overview of all creators"}
              </p>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <CreatorSelector 
                selectedCreator={selectedCreator} 
                onCreatorChange={setSelectedCreator}
              />
              <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                {timeFilters.map((filter) => (
                  <button
                    key={filter.value}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                      timeFilter === filter.value
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => setTimeFilter(filter.value)}
                    data-testid={`filter-${filter.value}`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Followers"
              value={mockStats.followers.current}
              change={mockStats.followers.change}
              changeType={mockStats.followers.changeType}
              icon="fas fa-users"
              color="bg-chart-4/10"
            />
            <StatCard
              title="Total Reels"
              value={mockStats.totalReels.current}
              change={mockStats.totalReels.change}
              changeType={mockStats.totalReels.changeType}
              icon="fas fa-video"
              color="bg-chart-1/10"
            />
            <StatCard
              title="Avg Engagement"
              value={mockStats.avgEngagement.current}
              change={mockStats.avgEngagement.change}
              changeType={mockStats.avgEngagement.changeType}
              icon="fas fa-heart"
              color="bg-chart-2/10"
            />
            <StatCard
              title="Last Run"
              value={mockStats.lastRun.current}
              change={mockStats.lastRun.change}
              changeType={mockStats.lastRun.changeType}
              icon="fas fa-clock"
              color="bg-chart-3/10"
            />
          </div>

          {latestProfile && selectedCreator && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-card p-6 rounded-2xl border border-border/50 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                    <i className="fas fa-id-card text-blue-500"></i>
                  </div>
                  <h3 className="font-bold">Account Highlights</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 rounded-lg bg-muted/30">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${latestProfile.is_verified ? 'bg-blue-500/20 text-blue-500' : 'bg-muted text-muted-foreground'}`}>
                      {latestProfile.is_verified ? 'Verified' : 'Standard'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-muted/30">
                    <span className="text-sm text-muted-foreground">Category</span>
                    <span className="text-sm font-bold">{latestProfile.category}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-muted/30">
                    <span className="text-sm text-muted-foreground">Links</span>
                    <span className="text-sm font-bold">{latestProfile.bio_links?.length || 0} active</span>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 bg-card p-6 rounded-2xl border border-border/50 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                    <i className="fas fa-rocket text-green-500"></i>
                  </div>
                  <h3 className="font-bold">Profile Growth Potential</h3>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex-1">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Completeness Score</span>
                      <span className="text-sm font-bold">{latestProfile.growth_potential || 0}%</span>
                    </div>
                    <div className="w-full h-4 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-1000" 
                        style={{ width: `${latestProfile.growth_potential || 0}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                      {latestProfile.growth_potential > 80 
                        ? "This profile is highly optimized for growth. Biography, contact details, and external links are all well-configured."
                        : "There is significant room for growth. Adding a clearer call-to-action in the bio or providing more contact methods could improve results."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FollowersChart timeFilter={timeFilter} selectedCreator={selectedCreator} />
            <PerformanceChart timeFilter={timeFilter} selectedCreator={selectedCreator} />
          </div>

          <ReelsTable timeFilter={timeFilter} selectedCreator={selectedCreator} />

          <ScraperStatus />
        </div>
    </div>
  );
}
