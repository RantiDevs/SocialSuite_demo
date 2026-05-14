import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Pause, Play, Trash2, Loader2, Rocket, Twitter, Download, Users, ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

async function apiFetch(url: string, init?: RequestInit) {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  if (!res.ok) { const b = await res.json().catch(() => ({})); throw b; }
  if (res.status === 204) return null;
  return res.json();
}

const STATUS_CONFIG: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  queued:    { label: "Queued",    dot: "bg-amber-400",   text: "text-amber-400",   bg: "bg-amber-400/10" },
  running:   { label: "Running",   dot: "bg-emerald-400", text: "text-emerald-400", bg: "bg-emerald-400/10" },
  paused:    { label: "Paused",    dot: "bg-blue-400",    text: "text-blue-400",    bg: "bg-blue-400/10" },
  completed: { label: "Completed", dot: "bg-violet-400",  text: "text-violet-400",  bg: "bg-violet-400/10" },
  failed:    { label: "Failed",    dot: "bg-red-400",     text: "text-red-400",     bg: "bg-red-400/10" },
};

export default function TwitterScraper() {
  const [input, setInput] = useState("");
  const [selectedJob, setSelectedJob] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [dmOnly, setDmOnly] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 25;

  const qc = useQueryClient();
  const { toast } = useToast();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ["twitter-jobs"],
    queryFn: () => apiFetch("/api/twitter/jobs"),
    staleTime: 4000,
  });

  useEffect(() => {
    const hasActive = jobs.some((j: any) => j.status === "running" || j.status === "queued");
    if (hasActive) {
      pollRef.current = setInterval(() => qc.invalidateQueries({ queryKey: ["twitter-jobs"] }), 3000);
    } else if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [jobs, qc]);

  const { data: followersResult, isLoading: followersLoading } = useQuery({
    queryKey: ["twitter-followers", selectedJob, page, searchQuery, dmOnly],
    queryFn: () => {
      const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (searchQuery) qs.set("search", searchQuery);
      if (dmOnly) qs.set("dm_only", "true");
      return apiFetch(`/api/twitter/jobs/${selectedJob}/followers?${qs}`);
    },
    enabled: !!selectedJob,
    staleTime: 5000,
  });

  const followers = followersResult?.followers || [];
  const total = followersResult?.total || 0;
  const totalPages = followersResult?.totalPages || 1;

  const startMutation = useMutation({
    mutationFn: (usernames: string[]) => apiFetch("/api/twitter/jobs/start", { method: "POST", body: JSON.stringify({ usernames }) }),
    onSuccess: () => { toast({ title: "Twitter scrape started" }); setInput(""); qc.invalidateQueries({ queryKey: ["twitter-jobs"] }); },
    onError: (e: any) => toast({ title: "Error", description: e?.error, variant: "destructive" }),
  });

  const pauseMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/twitter/jobs/pause/${id}`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["twitter-jobs"] }),
  });

  const resumeMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/twitter/jobs/resume/${id}`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["twitter-jobs"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/twitter/jobs/${id}`, { method: "DELETE" }),
    onSuccess: () => { if (selectedJob === id) setSelectedJob(""); qc.invalidateQueries({ queryKey: ["twitter-jobs"] }); },
  });

  function handleStart(e: React.FormEvent) {
    e.preventDefault();
    const parsed = input.split(/[\s,]+/).map(u => u.trim().replace(/^@/, "")).filter(Boolean);
    if (!parsed.length) return;
    if (parsed.length > 5) { toast({ title: "Max 5 usernames", variant: "destructive" }); return; }
    startMutation.mutate(parsed);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearchQuery(searchInput);
    setPage(1);
  }

  const completedJobs = jobs.filter((j: any) => j.status === "completed" || j.totalEnriched > 0);

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
            <Twitter className="w-4 h-4 text-sky-400" />
          </div>
          <h1 className="text-3xl font-bold text-slate-100">Twitter Follower Scraper</h1>
        </div>
        <p className="text-slate-400 mt-1 ml-11">Collect Twitter followers with enrichment — username, location, DM-open status</p>
      </div>

      <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-6 mb-6 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <Rocket className="w-4 h-4 text-sky-400" />
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
              className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl pl-8 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={startMutation.isPending || !input.trim()}
            className="flex items-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg shadow-sky-600/20"
          >
            {startMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
            Start
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-slate-800/40">
            <h2 className="text-sm font-bold text-slate-200">Scrape Jobs</h2>
          </div>
          {jobsLoading ? (
            <div className="py-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-sky-500 mx-auto" /></div>
          ) : jobs.length === 0 ? (
            <div className="py-12 text-center">
              <Twitter className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No jobs yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/40">
              {jobs.map((job: any) => {
                const cfg = STATUS_CONFIG[job.status] || STATUS_CONFIG.queued;
                return (
                  <div
                    key={job.id}
                    className={`px-5 py-4 cursor-pointer transition-colors ${selectedJob === job.id ? "bg-sky-500/5 border-l-2 border-sky-500" : "hover:bg-slate-800/20"}`}
                    onClick={() => { setSelectedJob(job.id); setPage(1); setSearchQuery(""); setSearchInput(""); }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-slate-100 text-sm">@{job.targetUsername}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase ${cfg.bg} ${cfg.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${job.status === "running" ? "animate-pulse" : ""}`} />
                            {cfg.label}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 space-y-0.5">
                          <p>{job.totalEnriched.toLocaleString()} enriched · {job.totalDmOpen.toLocaleString()} DM open</p>
                          {job.status === "running" && job.progressPct > 0 && (
                            <div className="h-1 bg-slate-800 rounded-full overflow-hidden mt-1">
                              <div className="h-full bg-sky-500 rounded-full transition-all" style={{ width: `${job.progressPct}%` }} />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                        {(job.status === "running" || job.status === "queued") && (
                          <button onClick={() => pauseMutation.mutate(job.id)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-amber-400 transition-colors">
                            <Pause className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {job.status === "paused" && (
                          <button onClick={() => resumeMutation.mutate(job.id)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-emerald-400 transition-colors">
                            <Play className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => deleteMutation.mutate(job.id)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-red-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl overflow-hidden shadow-xl flex flex-col">
          <div className="px-6 py-4 border-b border-slate-800/40 flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-sm font-bold text-slate-200">
              {selectedJob ? `${total.toLocaleString()} followers` : "Select a job"}
            </h2>
            {selectedJob && (
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                  <input type="checkbox" checked={dmOnly} onChange={e => { setDmOnly(e.target.checked); setPage(1); }} className="rounded" />
                  DM open only
                </label>
                <button onClick={() => window.open(`/api/twitter/jobs/${selectedJob}/export${dmOnly ? "?dm_only=true" : ""}`, "_blank")} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-600/20 hover:bg-sky-600/40 text-sky-400 text-xs font-bold transition-all">
                  <Download className="w-3 h-3" /> CSV
                </button>
              </div>
            )}
          </div>

          {!selectedJob ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <div className="text-center">
                <Twitter className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">Select a job to view followers</p>
              </div>
            </div>
          ) : (
            <>
              <form onSubmit={handleSearch} className="px-4 py-3 border-b border-slate-800/40">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    placeholder="Search username..."
                    className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500/50 transition-all"
                  />
                </div>
              </form>

              {followersLoading ? (
                <div className="flex-1 flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-sky-500" />
                </div>
              ) : followers.length === 0 ? (
                <div className="flex-1 flex items-center justify-center py-12">
                  <div className="text-center">
                    <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">No followers found</p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-slate-900/90 backdrop-blur-sm">
                      <tr className="border-b border-slate-800/40">
                        <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">User</th>
                        <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Location</th>
                        <th className="text-right px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">DM</th>
                      </tr>
                    </thead>
                    <tbody>
                      {followers.map((f: any, i: number) => (
                        <tr key={f.id} className={`hover:bg-slate-800/20 ${i < followers.length - 1 ? "border-b border-slate-800/30" : ""}`}>
                          <td className="px-5 py-3">
                            <p className="font-bold text-slate-100 text-xs">@{f.username}</p>
                            {f.name && <p className="text-[11px] text-slate-500">{f.name}</p>}
                          </td>
                          <td className="px-5 py-3 text-xs text-slate-500 hidden sm:table-cell">{f.location || "—"}</td>
                          <td className="px-5 py-3 text-right">
                            {f.canDm ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                                <MessageCircle className="w-2.5 h-2.5" /> Open
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-600">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {totalPages > 1 && (
                <div className="px-5 py-3 border-t border-slate-800/40 flex items-center justify-between">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-medium text-slate-300 transition-all">
                    <ChevronLeft className="w-3.5 h-3.5" /> Prev
                  </button>
                  <span className="text-xs text-slate-500">Page {page} / {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-medium text-slate-300 transition-all">
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
