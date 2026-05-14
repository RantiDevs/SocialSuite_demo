import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import CreatorSelector from "@/components/creator-selector";
import ThemeToggle from "@/components/theme-toggle";
import { useQuery, useMutation } from "@tanstack/react-query";

interface HashtagPerformance {
  hashtag: string;
  usageCount: number;
  avgViews: number;
  avgLikes: number;
  avgComments: number;
  avgEngagement: number;
}

interface PostingTimeData {
  bestHours: Array<{ hour: number; label: string; score: number; avgViews: number; avgEngagement: number }>;
  bestDays: Array<{ day: string; score: number; avgViews: number; avgEngagement: number }>;
  recommendations: string[];
}

interface CaptionAnalysis {
  avgLength: number;
  avgHashtags: number;
  avgMentions: number;
  topPerformingCaptions: Array<{ caption: string; engagement: number; views: number; likes: number }>;
}

interface EngagementTrend {
  period: string;
  totalViews: number;
  totalLikes: number;
  avgEngagement: number;
}

interface AISuggestion {
  captionSuggestions: string[];
  hashtagRecommendations: string[];
  performancePrediction: { estimatedEngagement: string; bestPostingTime: string; confidence: number };
  improvements: string[];
}

export default function AdvancedAnalytics() {
  const [selectedCreator, setSelectedCreator] = useState<string | null>(null);
  const [newCaption, setNewCaption] = useState("");
  const [newHashtags, setNewHashtags] = useState("");

  const creatorParam = selectedCreator ? `?creator=${selectedCreator}` : '';

  const { data: hashtagData, isLoading: hashtagLoading } = useQuery<{ hashtags: HashtagPerformance[] }>({
    queryKey: [`/api/analytics/hashtag-performance${creatorParam}`],
  });

  const { data: postingTimeData, isLoading: postingTimeLoading } = useQuery<PostingTimeData>({
    queryKey: [`/api/analytics/optimal-posting-time${creatorParam}`],
  });

  const { data: captionData, isLoading: captionLoading } = useQuery<CaptionAnalysis>({
    queryKey: [`/api/analytics/caption-analysis${creatorParam}`],
  });

  const { data: engagementData, isLoading: engagementLoading } = useQuery<{ monthly: EngagementTrend[] }>({
    queryKey: [`/api/analytics/engagement-trends${creatorParam}`],
  });

  const formatNumber = (num: number | undefined | null) => {
    if (!num && num !== 0) return "0";
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(0);
  };

  return (
    <div className="">
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold">Advanced Analytics</h1>
              <p className="text-muted-foreground">AI-powered insights and detailed performance analysis</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <CreatorSelector selectedCreator={selectedCreator} onCreatorChange={setSelectedCreator} />
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 bg-background">
          <Tabs defaultValue="hashtags" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="hashtags">Hashtags</TabsTrigger>
              <TabsTrigger value="captions">Captions</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
            </TabsList>

            <TabsContent value="hashtags" className="space-y-6 mt-6">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Hashtags</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{hashtagData?.hashtags?.length || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Best Performing</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">#{hashtagData?.hashtags?.[0]?.tag || 'N/A'}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Avg Engagement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{hashtagData?.hashtags?.[0]?.avgEngagement?.toFixed(1) || 0}%</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Hashtag Performance</CardTitle>
                  <CardDescription>See which hashtags drive the most engagement</CardDescription>
                </CardHeader>
                <CardContent>
                  {hashtagLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading...</div>
                  ) : hashtagData?.hashtags?.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">No hashtags found for {selectedCreator ? `${selectedCreator}` : 'this creator'}.</p>
                      <p className="text-xs text-muted-foreground/60 mt-2">This creator may not use hashtags or has limited data.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {hashtagData?.hashtags?.slice(0, 15).map((tag: any, i: number) => (
                        <div key={tag.tag} className="flex items-center gap-4">
                          <span className="text-muted-foreground w-6">{i + 1}.</span>
                          <Badge variant="secondary" className="min-w-[120px]">#{tag.tag}</Badge>
                          <div className="flex-1">
                            <Progress value={Math.min((tag.avgEngagement / 10) * 100, 100)} className="h-2" />
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm text-right min-w-[200px]">
                            <span>{tag.count} uses</span>
                            <span>{formatNumber(tag.totalViews)} views</span>
                            <span>{(tag.avgEngagement || 0).toFixed(1)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="captions" className="space-y-6 mt-6">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Avg Length</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{captionData?.avgLength || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Avg Hashtags</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{captionData?.avgHashtags?.toFixed(1) || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Avg Mentions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{captionData?.avgMentions?.toFixed(1) || 0}</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Captions</CardTitle>
                </CardHeader>
                <CardContent>
                  {captionLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading...</div>
                  ) : !captionData?.topPerformingCaptions || captionData.topPerformingCaptions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">No captions found for {selectedCreator ? `${selectedCreator}` : 'this creator'}.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {captionData?.topPerformingCaptions?.map((item, i: number) => (
                        <div key={i} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <Badge variant="outline">#{i + 1}</Badge>
                            <span className="text-primary text-sm font-medium">{(item.engagement || 0).toFixed(1)}% engagement</span>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-3">{item.caption}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trends" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Engagement Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  {engagementLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading...</div>
                  ) : !engagementData?.monthly || engagementData.monthly.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">No trend data available yet</p>
                      <p className="text-xs text-muted-foreground/60 mt-2">Trends will appear as more scrapes are collected</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {engagementData.monthly.slice(-6).map((trend: EngagementTrend) => (
                        <div key={trend.period} className="flex items-center gap-4">
                          <span className="w-20 font-medium text-sm">{trend.period}</span>
                          <Progress value={Math.min(((trend.avgEngagement || 0) / 10) * 100, 100)} className="flex-1 h-2" />
                          <span className="text-sm min-w-[150px] text-right">{trend.totalViews || 0} views, {(trend.avgEngagement || 0).toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        </main>
      </div>
    </div>
  );
}
