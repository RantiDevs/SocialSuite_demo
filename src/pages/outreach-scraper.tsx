import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Search, Pause, Play, Trash2, Loader2, Plus, Sparkles, Rocket, Users, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STATUS_CONFIG: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  queued:    { label: "Queued",    dot: "bg-amber-400",   text: "text-amber-400",   bg: "bg-amber-400/10" },
  running:   { label: "Running",   dot: "bg-emerald-400", text: "text-emerald-400", bg: "bg-emerald-400/10" },
  paused:    { label: "Paused",    dot: "bg-blue-400",    text: "text-blue-400",    bg: "bg-blue-400/10" },
  completed: { label: "Completed", dot: "bg-violet-400",  text: "text-violet-400",  bg: "bg-violet-400/10" },
  failed:    { label: "Failed",    dot: "bg-red-400",     text: "text-red-400",     bg: "bg-red-400/10" },
};

async function apiFetch(url: string, init?: RequestInit) {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  if (!res.ok) { const b = await res.json().catch(() => ({})); throw b; }
  if (res.status === 204) return null;
  return res.json();
}

export default function OutreachScraper() {
  const [input, setInput] = useState("");
  const qc = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["outreach-jobs"],
    queryFn: () => apiFetch("/api/outreach/jobs"),
    staleTime: 4000,
  });

  useEffect(() => {
    const hasActive = jobs.some((j: any) => j.status === "running" || j.status === "queued");
    if (hasActive) {
      pollRef.current = setInterval(() => qc.invalidateQueries({ queryKey: ["outreach-jobs"] }), 3000);
    } else if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [jobs, qc]);

  const startMutation = useMutation({
    mutationFn: (usernames: string[]) => apiFetch("/api/outreach/jobs/start", { method: "POST", body: JSON.stringify({ usernames }) }),
    onSuccess: () => { toast({ title: "Scrape queued" }); setInput(""); qc.invalidateQueries({ queryKey: ["outreach-jobs"] }); },
    onError: (e: any) => toast({ title: "Error", description: e?.error || "Failed", variant: "destructive" }),
  });

  const pauseMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/outreach/jobs/pause/${id}`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["outreach-jobs"] }),
  });

  const resumeMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/outreach/jobs/resume/${id}`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["outreach-jobs"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/outreach/jobs/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["outreach-jobs"] }),
  });

  function handleStart(e: React.FormEvent) {
    e.preventDefault();
    const parsed = input.split(/[\s,]+/).map(u => u.trim().replace(/^@/, "")).filter(Boolean);
    if (!parsed.length) return;
    if (parsed.length > 5) { toast({ title: "Max 5 usernames", variant: "destructive" }); return; }
    startMutation.mutate(parsed);
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100">IG Follower Scraper</h1>
        <p className="text-slate-400 mt-1">Scrape Instagram followers from any public account for outreach campaigns</p>
      </div>

      <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-6 mb-6 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-bold text-slate-200">New Scrape Job</h2>
        </div>
        <form onSubmit={handleStart} className="flex gap-3">
          <div className="flex-1 relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm pointer-events-none">@</span>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="username1, username2  (max 5)"
              className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl pl-8 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={startMutation.isPending || !input.trim()}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20"
          >
            {startMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
            Start
          </button>
        </form>
      </div>

      <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800/40">
          <h2 className="text-sm font-bold text-slate-200">Scrape Jobs</h2>
        </div>

        {isLoading ? (
          <div className="py-16 text-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" /></div>
        ) : jobs.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No scrape jobs yet</p>
            <p className="text-slate-600 text-sm mt-1">Enter an Instagram username above to start</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/40">
            {jobs.map((job: any) => {
              const cfg = STATUS_CONFIG[job.status] || STATUS_CONFIG.queued;
              return (
                <div key={job.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-800/20 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-100">@{job.targetUsername}</span>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase ${cfg.bg} ${cfg.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${job.status === "running" ? "animate-pulse" : ""}`} />
                        {cfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                      <span>{job.totalScraped.toLocaleString()} followers scraped</span>
                      <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {job.totalScraped > 0 && (
                      <Link href={`/outreach/followers?job=${job.id}`}>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 text-xs font-bold transition-all">
                          <Users className="w-3 h-3" /> View
                        </button>
                      </Link>
                    )}
                    {job.totalScraped > 0 && (
                      <Link href={`/outreach/campaigns?job_id=${job.id}`}>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 text-xs font-bold transition-all">
                          <Rocket className="w-3 h-3" /> Campaign
                        </button>
                      </Link>
                    )}
                    {(job.status === "running" || job.status === "queued") && (
                      <button onClick={() => pauseMutation.mutate(job.id)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-yellow-400 transition-colors">
                        <Pause className="w-4 h-4" />
                      </button>
                    )}
                    {job.status === "paused" && (
                      <button onClick={() => resumeMutation.mutate(job.id)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-emerald-400 transition-colors">
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => deleteMutation.mutate(job.id)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
