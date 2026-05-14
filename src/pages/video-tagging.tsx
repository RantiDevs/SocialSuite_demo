import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CreatorSelector from "@/components/creator-selector";
import ThemeToggle from "@/components/theme-toggle";
import { ErrorToast } from "@/components/error-toast";
import { SuccessToast } from "@/components/success-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { filterReelsByDate } from "@/lib/dateFilter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ReelData {
  username: string;
  url: string;
  likes: number;
  comments: number;
  views: number;
  caption: string;
  videoUrl: string;
  datePosted: string;
  manual_tags?: string;
}

export default function VideoTagging() {
  const [selectedReel, setSelectedReel] = useState<ReelData | null>(null);
  const [videoType, setVideoType] = useState("");
  const [selectedCreator, setSelectedCreator] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState("all");
  const [isSaving, setIsSaving] = useState(false);
  const [videoErrors, setVideoErrors] = useState<Record<string, boolean>>({});
  const [errorToast, setErrorToast] = useState<{ title: string; message: string } | null>(null);
  const [successToast, setSuccessToast] = useState<{ title: string; message: string } | null>(null);
  
  const queryClient = useQueryClient();

  const creatorParam = selectedCreator ? `?creator=${selectedCreator}` : '';

  const { data: reels = [] } = useQuery<ReelData[]>({
    queryKey: [`/api/reels${creatorParam}`],
  });

  let filteredReels = filterReelsByDate(reels, timeFilter);
  
  if (selectedCreator) {
    filteredReels = filteredReels.filter(r => r.username === selectedCreator);
  }

  // Extract previously used tags from all reels
  const previousTags = Array.from(
    new Set(
      reels
        .map(r => r.manual_tags)
        .filter((tag): tag is string => Boolean(tag))
        .flatMap((tag: string) => tag.split(',').map(t => t.trim()))
        .filter(Boolean)
    )
  ).sort();

  const handleTagReel = async () => {
    if (!selectedReel || !videoType) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(`/api/reels/tag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          videoUrl: selectedReel.videoUrl,
          tag: videoType 
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Invalidate and wait for refetch to complete
        await queryClient.invalidateQueries({ queryKey: ['/api/reels'] });
        await queryClient.refetchQueries({ queryKey: ['/api/reels'] });
        
        setSuccessToast({
          title: "Perfect!",
          message: `Tagged as "${videoType}"`
        });
        
        setSelectedReel(null);
        setVideoType("");
      } else {
        throw new Error(data.error || 'Unable to save tag');
      }
    } catch (error) {
      setErrorToast({
        title: "Couldn't save tag",
        message: error instanceof Error ? error.message : "Please try again"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const untaggedCount = filteredReels.filter(r => !r.manual_tags || r.manual_tags.trim() === '').length;

  return (
    <div className="">
      {errorToast && (
        <ErrorToast 
          title={errorToast.title} 
          message={errorToast.message}
          onClose={() => setErrorToast(null)}
        />
      )}
      {successToast && (
        <SuccessToast 
          title={successToast.title} 
          message={successToast.message}
          onClose={() => setSuccessToast(null)}
        />
      )}
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold">Video Tagging</h1>
              <p className="text-muted-foreground">
                {selectedCreator ? "Categorize reels for selected creator" : "Categorize your reels for better analytics"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <CreatorSelector 
                selectedCreator={selectedCreator} 
                onCreatorChange={setSelectedCreator}
              />
              <Badge variant="secondary">{untaggedCount} untagged</Badge>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <div className="flex gap-2 mb-6 flex-wrap">
            {[
              { label: "7d", value: "7d" },
              { label: "14d", value: "14d" },
              { label: "30d", value: "30d" },
              { label: "90d", value: "90d" },
              { label: "180d", value: "180d" },
              { label: "YTD", value: "ytd" },
              { label: "All", value: "all" },
            ].map((filter) => (
              <Button
                key={filter.value}
                variant={timeFilter === filter.value ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeFilter(filter.value)}
              >
                {filter.label}
              </Button>
            ))}
          </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {filteredReels.map((reel, index) => (
          <Card key={`${reel.url || ''}-${reel.username}-${index}`} className="overflow-hidden">
            <div className="relative aspect-[9/16] bg-muted flex items-center justify-center overflow-hidden">
              {reel.videoUrl ? (
                <video 
                  src={reel.videoUrl} 
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                  onMouseEnter={(e) => {
                    const playPromise = e.currentTarget.play();
                    if (playPromise !== undefined) {
                      playPromise.catch(() => {});
                    }
                  }}
                  onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                  onError={(e) => {
                    console.error('Video preview error:', reel.videoUrl);
                    setVideoErrors(prev => ({ ...prev, [reel.videoUrl]: true }));
                  }}
                />
              ) : (
                <i className="fas fa-video text-6xl text-muted-foreground/20"></i>
              )}
              {videoErrors[reel.videoUrl] && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/80">
                  <i className="fas fa-video-slash text-4xl text-muted-foreground/40"></i>
                </div>
              )}
              <div className="absolute bottom-2 right-2 flex flex-col gap-1 items-end">
                <Badge variant="secondary">@{reel.username}</Badge>
                {reel.manual_tags && reel.manual_tags.trim() && (
                  <Badge variant="default" className="bg-primary">
                    {reel.manual_tags}
                  </Badge>
                )}
              </div>
            </div>
            <CardContent className="p-4">
              <p className="text-sm mb-3 line-clamp-2">{reel.caption || 'No caption'}</p>
              <div className="grid grid-cols-3 gap-2 mb-3 text-xs text-muted-foreground">
                <div>
                  <div className="font-medium text-foreground">{formatNumber(reel.views)}</div>
                  <div>Views</div>
                </div>
                <div>
                  <div className="font-medium text-foreground">{formatNumber(reel.likes)}</div>
                  <div>Likes</div>
                </div>
                <div>
                  <div className="font-medium text-foreground">{formatNumber(reel.comments)}</div>
                  <div>Comments</div>
                </div>
              </div>
              <Button
                variant="default"
                className="w-full"
                size="sm"
                onClick={() => setSelectedReel(reel)}
              >
                Tag Video
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedReel} onOpenChange={() => setSelectedReel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tag Video Type</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="aspect-[9/16] bg-muted rounded-lg overflow-hidden max-h-80 flex items-center justify-center">
              {selectedReel?.videoUrl ? (
                <video 
                  src={selectedReel.videoUrl} 
                  className="w-full h-full object-cover"
                  controls
                  muted
                  playsInline
                  crossOrigin="anonymous"
                  onError={() => {
                    setErrorToast({
                      title: "Video unavailable",
                      message: "This video isn't available right now. You can still add a tag."
                    });
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center">
                  <i className="fas fa-video text-6xl text-muted-foreground/20 mb-2"></i>
                  <p className="text-sm text-muted-foreground">No video available</p>
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{selectedReel?.caption || 'No caption'}</p>
            <div className="space-y-2">
              <Label htmlFor="video-tag">Video Tag</Label>
              <Input
                id="video-tag"
                value={videoType}
                onChange={(e) => setVideoType(e.target.value)}
                placeholder="e.g., Tutorial, Funny, Behind the Scenes"
                list="previous-tags"
              />
              <datalist id="previous-tags">
                {previousTags.map((tag) => (
                  <option key={tag} value={tag} />
                ))}
              </datalist>
              {previousTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <p className="text-xs text-muted-foreground w-full">Quick select from previous tags:</p>
                  {previousTags.slice(0, 8).map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => setVideoType(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Type any tag to categorize this video
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={() => setSelectedReel(null)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleTagReel} 
                disabled={!videoType || isSaving}
              >
                {isSaving ? "Saving..." : "Save Tag"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
        </main>
      </div>
    </div>
  );
}
