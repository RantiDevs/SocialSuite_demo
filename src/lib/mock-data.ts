export const MOCK_DATA: Record<string, any> = {
  "/api/user": {
    id: 1,
    username: "demo_admin",
    email: "demo@socialsuite.pro",
    subscriptionStatus: "active",
    subscriptionTier: "premium"
  },

  // ─── License ──────────────────────────────────────────────────────────────────
  "/api/license/status": {
    hasLicense: true,
    isValid: true,
    daysRemaining: 364,
    license: { status: "active", expiresAt: new Date(Date.now() + 365 * 86400000).toISOString() }
  },

  // ─── Instagram Analytics ──────────────────────────────────────────────────────
  "/api/analytics/total-reels": { count: 1247 },
  "/api/analytics/profile-details": [
    {
      username: "creator_demo",
      followers: 124000,
      following: 842,
      mediaCount: 156,
      clipsCount: 89,
      is_verified: true,
      category: "Digital Creator",
      biography: "Social Suite Pro Demo Account 🚀",
      growth_potential: 88,
      timestamp: new Date().toISOString()
    }
  ],
  "/api/analytics/engagement": { avgLikes: 9400, avgComments: 452, avgViews: 250000, engagementRate: 4.2 },
  "/api/analytics/growth": [
    { date: new Date(Date.now() - 86400000 * 6).toISOString(), followers: 118000 },
    { date: new Date(Date.now() - 86400000 * 5).toISOString(), followers: 119200 },
    { date: new Date(Date.now() - 86400000 * 4).toISOString(), followers: 120000 },
    { date: new Date(Date.now() - 86400000 * 3).toISOString(), followers: 121500 },
    { date: new Date(Date.now() - 86400000 * 2).toISOString(), followers: 122000 },
    { date: new Date(Date.now() - 86400000 * 1).toISOString(), followers: 123200 },
    { date: new Date().toISOString(), followers: 124000 },
  ],

  // ─── Reels ────────────────────────────────────────────────────────────────────
  "/api/reels": [
    { id: "1", instagramId: "reel_001", url: "#", caption: "🔥 Growth hacking tutorial", likes: 12400, comments: 452, views: 250000, datePosted: new Date().toISOString(), creatorId: "1", createdAt: new Date().toISOString() },
    { id: "2", instagramId: "reel_002", url: "#", caption: "How we hit 100K followers", likes: 8200, comments: 231, views: 180000, datePosted: new Date(Date.now() - 86400000).toISOString(), creatorId: "1", createdAt: new Date().toISOString() },
    { id: "3", instagramId: "reel_003", url: "#", caption: "Behind the scenes 🎬", likes: 15600, comments: 672, views: 320000, datePosted: new Date(Date.now() - 172800000).toISOString(), creatorId: "1", createdAt: new Date().toISOString() },
  ],
  "/api/reels/metrics": [],

  // ─── Followers ────────────────────────────────────────────────────────────────
  "/api/followers/latest": [
    { username: "creator_demo", followers: 124000, timestamp: new Date().toISOString() }
  ],
  "/api/followers": [
    { username: "creator_demo", followers: 120000, timestamp: new Date(Date.now() - 86400000 * 7).toISOString() },
    { username: "creator_demo", followers: 122000, timestamp: new Date(Date.now() - 86400000 * 3).toISOString() },
    { username: "creator_demo", followers: 124000, timestamp: new Date().toISOString() }
  ],

  // ─── Scraper ──────────────────────────────────────────────────────────────────
  "/api/scrape/status": { status: "idle" },
  "/api/scrape/runs": [],
  "/api/scrape/config": { targetUsername: "creator_demo", scheduleFrequency: "daily", autoTag: true },

  // ─── Credentials & Config ─────────────────────────────────────────────────────
  "/api/credentials": { instagramUsername: "creator_demo", instagramPassword: "••••••••" },
  "/api/settings": {},

  // ─── Creators ─────────────────────────────────────────────────────────────────
  "/api/creators": [
    { id: "1", username: "creator_demo", followers: 124000, userId: "1", lastScraped: new Date().toISOString(), createdAt: new Date().toISOString() }
  ],

  // ─── Outreach ─────────────────────────────────────────────────────────────────
  "/api/outreach/stats": {
    totalJobs: 5, totalFollowers: 12480, totalSkipped: 340,
    activeCampaigns: 3, totalSent: 1248, totalFailed: 12, successRate: "92%"
  },
  "/api/outreach/jobs": [
    { id: "1", targetUsername: "fitness_guru", status: "completed", totalScraped: 4200, createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), completedAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date().toISOString() },
    { id: "2", targetUsername: "travel_influencer", status: "completed", totalScraped: 3800, createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), completedAt: new Date(Date.now() - 86400000 * 4).toISOString(), updatedAt: new Date().toISOString() },
    { id: "3", targetUsername: "tech_reviews", status: "in_progress", totalScraped: 1200, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ],
  "/api/outreach/followers": [
    { id: "1", jobId: "1", username: "user_alpha", fullName: "Alpha User", userId: "u1", isVerified: false, isPrivate: false, followerCount: 8500, scrapedFrom: "fitness_guru", scrapedAt: new Date().toISOString() },
    { id: "2", jobId: "1", username: "beta_creator", fullName: "Beta Creator", userId: "u2", isVerified: true, isPrivate: false, followerCount: 24000, scrapedFrom: "fitness_guru", scrapedAt: new Date().toISOString() },
    { id: "3", jobId: "2", username: "gamma_model", fullName: "Gamma Model", userId: "u3", isVerified: false, isPrivate: false, followerCount: 15200, scrapedFrom: "travel_influencer", scrapedAt: new Date().toISOString() },
  ],
  "/api/outreach/campaigns": [
    { id: "1", name: "Fitness DM Blast", messageTemplate: "Hey {name}! 💪 Loved your content...", status: "active", totalTargets: 500, totalSent: 320, totalFailed: 5, targetJobId: "1", createdAt: new Date(Date.now() - 86400000).toISOString() },
    { id: "2", name: "Travel Outreach", messageTemplate: "Hi {name}! ✈️ I'm reaching out because...", status: "completed", totalTargets: 300, totalSent: 298, totalFailed: 2, targetJobId: "2", createdAt: new Date(Date.now() - 86400000 * 3).toISOString() },
  ],
  "/api/outreach/proxies": [
    { id: "1", protocol: "http", host: "proxy1.demo.com", port: "8080", status: "active", latencyMs: 120, createdAt: new Date().toISOString() },
    { id: "2", protocol: "http", host: "proxy2.demo.com", port: "8080", status: "active", latencyMs: 85, createdAt: new Date().toISOString() },
  ],
  "/api/outreach/accounts": [
    { id: "1", username: "outreach_bot_1", status: "active", warmupDay: 14, lastLoginAt: new Date().toISOString(), createdAt: new Date().toISOString() },
    { id: "2", username: "outreach_bot_2", status: "active", warmupDay: 7, lastLoginAt: new Date(Date.now() - 3600000).toISOString(), createdAt: new Date().toISOString() },
  ],
  "/api/outreach/skipped": [],

  // ─── Twitter ──────────────────────────────────────────────────────────────────
  "/api/twitter/stats": {
    totalJobs: 3, totalFollowers: 8240, totalEnriched: 6100, totalDmOpen: 2481,
    tweetsScraped: 2481, followersTracked: 12, lastRun: "2h ago"
  },
  "/api/twitter/jobs": [
    { id: "1", targetUsername: "elonmusk", status: "completed", totalFollowers: 5200, totalEnriched: 4100, totalDmOpen: 1800, progressPct: 100, createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), completedAt: new Date(Date.now() - 86400000 * 2).toISOString() },
    { id: "2", targetUsername: "sama", status: "completed", totalFollowers: 3040, totalEnriched: 2000, totalDmOpen: 681, progressPct: 100, createdAt: new Date(Date.now() - 86400000).toISOString(), completedAt: new Date().toISOString() },
  ],
  "/api/twitter/followers": [],

  // ─── 2FA ──────────────────────────────────────────────────────────────────────
  "/api/twofa/status": { pending: false },
};
