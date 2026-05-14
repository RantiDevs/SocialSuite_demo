import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useSearch } from "wouter";
import { Plus, Play, Pause, Trash2, FileText, ChevronDown, ChevronUp, FlaskConical, Zap, Timer, Clock, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

async function apiFetch(url: string, init?: RequestInit) {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  if (!res.ok) { const b = await res.json().catch(() => ({})); throw b; }
  if (res.status === 204) return null;
  return res.json();
}

const EMPTY = {
  name: "", message_template: "", message_template_b: "", ab_test_enabled: false,
  job_id: "", webhook_url: "", scheduled_start: "", scheduled_stop: "",
  filter_min_followers: "", filter_max_followers: "",
  filter_exclude_private: false, filter_exclude_verified: false, dm_send_style: "instant",
};

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    running: "bg-emerald-500/15 text-emerald-400",
    draft: "bg-slate-700/40 text-slate-400",
    paused: "bg-amber-500/15 text-amber-400",
    completed: "bg-blue-500/15 text-blue-400",
    scheduled: "bg-purple-500/15 text-purple-400",
  };
  return (
    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider ${map[status] ?? map.draft}`}>
      {status}
    </span>
  );
}

export default function OutreachCampaigns() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const search = useSearch();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [showAb, setShowAb] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["outreach-campaigns"],
    queryFn: () => apiFetch("/api/outreach/campaigns"),
    staleTime: 5000,
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ["outreach-jobs"],
    queryFn: () => apiFetch("/api/outreach/jobs"),
  });

  useEffect(() => {
    const p = new URLSearchParams(search);
    const jobId = p.get("job_id");
    if (jobId) { setForm(f => ({ ...f, job_id: jobId })); setShowAdd(true); }
  }, [search]);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const createMutation = useMutation({
    mutationFn: (data: any) => apiFetch("/api/outreach/campaigns", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => { toast({ title: "Campaign created" }); setForm(EMPTY); setShowAdd(false); qc.invalidateQueries({ queryKey: ["outreach-campaigns"] }); },
    onError: (e: any) => toast({ title: "Failed", description: e?.error, variant: "destructive" }),
  });

  const startMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/outreach/campaigns/${id}/start`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["outreach-campaigns"] }),
  });

  const pauseMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/outreach/campaigns/${id}/pause`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["outreach-campaigns"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/outreach/campaigns/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["outreach-campaigns"] }),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.job_id) { toast({ title: "Select a source job", variant: "destructive" }); return; }
    createMutation.mutate({
      ...form,
      filter_min_followers: form.filter_min_followers ? Number(form.filter_min_followers) : undefined,
      filter_max_followers: form.filter_max_followers ? Number(form.filter_max_followers) : undefined,
    });
  }

  const completedJobs = jobs.filter((j: any) => j.status === "completed" || j.totalScraped > 0);
  const inp = "w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 mt-1 transition-all";
  const lbl = "text-[11px] font-extrabold text-slate-500 uppercase tracking-wider";

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">DM Campaigns</h1>
          <p className="text-slate-400 mt-1">Create and manage Instagram outreach campaigns</p>
        </div>
        <button onClick={() => setShowAdd(v => !v)} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20">
          <Plus className="w-4 h-4" /> New Campaign
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleSubmit} className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-6 mb-6 shadow-xl">
          <h2 className="text-sm font-bold text-slate-200 mb-5">Create Campaign</h2>
          <div className="space-y-4">
            <div>
              <label className={lbl}>Campaign Name</label>
              <input className={inp} value={form.name} onChange={e => set("name", e.target.value)} placeholder="My Outreach Campaign" required />
            </div>
            <div>
              <label className={lbl}>Source Job</label>
              <select className={inp} value={form.job_id} onChange={e => set("job_id", e.target.value)} required>
                <option value="">Select scraped followers...</option>
                {completedJobs.map((j: any) => <option key={j.id} value={j.id}>@{j.targetUsername} — {j.totalScraped.toLocaleString()} followers</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Message Template (A)</label>
              <textarea className={`${inp} resize-none h-24`} value={form.message_template} onChange={e => set("message_template", e.target.value)} placeholder="Hey {{username}}, loved your content..." required />
            </div>

            <div className="space-y-3">
              <button type="button" onClick={() => setShowAb(v => !v)} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors">
                <FlaskConical className="w-3.5 h-3.5 text-purple-400" /> A/B Test {showAb ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {showAb && (
                <div className="pl-4 border-l-2 border-purple-500/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="ab" checked={form.ab_test_enabled} onChange={e => set("ab_test_enabled", e.target.checked)} className="rounded" />
                    <label htmlFor="ab" className="text-sm text-slate-300 font-medium">Enable A/B testing</label>
                  </div>
                  {form.ab_test_enabled && (
                    <div>
                      <label className={lbl}>Message Template (B)</label>
                      <textarea className={`${inp} resize-none h-20`} value={form.message_template_b} onChange={e => set("message_template_b", e.target.value)} placeholder="Alternative message..." />
                    </div>
                  )}
                </div>
              )}

              <button type="button" onClick={() => setShowFilters(v => !v)} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Filters {showFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {showFilters && (
                <div className="pl-4 border-l-2 border-amber-500/30 grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Min Followers</label>
                    <input type="number" className={inp} value={form.filter_min_followers} onChange={e => set("filter_min_followers", e.target.value)} placeholder="0" />
                  </div>
                  <div>
                    <label className={lbl}>Max Followers</label>
                    <input type="number" className={inp} value={form.filter_max_followers} onChange={e => set("filter_max_followers", e.target.value)} placeholder="Unlimited" />
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    <input type="checkbox" id="excPriv" checked={form.filter_exclude_private} onChange={e => set("filter_exclude_private", e.target.checked)} />
                    <label htmlFor="excPriv" className="text-sm text-slate-300">Exclude private accounts</label>
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    <input type="checkbox" id="excVer" checked={form.filter_exclude_verified} onChange={e => set("filter_exclude_verified", e.target.checked)} />
                    <label htmlFor="excVer" className="text-sm text-slate-300">Exclude verified accounts</label>
                  </div>
                </div>
              )}

              <button type="button" onClick={() => setShowSchedule(v => !v)} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors">
                <Clock className="w-3.5 h-3.5 text-blue-400" /> Schedule {showSchedule ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {showSchedule && (
                <div className="pl-4 border-l-2 border-blue-500/30 grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Start At</label>
                    <input type="datetime-local" className={inp} value={form.scheduled_start} onChange={e => set("scheduled_start", e.target.value)} />
                  </div>
                  <div>
                    <label className={lbl}>Stop At</label>
                    <input type="datetime-local" className={inp} value={form.scheduled_stop} onChange={e => set("scheduled_stop", e.target.value)} />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowAdd(false)} className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 font-bold transition-all">Cancel</button>
              <button type="submit" disabled={createMutation.isPending} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all">
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="py-16 text-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" /></div>
        ) : campaigns.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No campaigns yet</p>
            <p className="text-slate-600 text-sm mt-1">Create your first outreach campaign above</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/40">
            {campaigns.map((c: any) => {
              const pct = c.totalTargets > 0 ? Math.round((c.totalSent / c.totalTargets) * 100) : 0;
              return (
                <div key={c.id} className="px-6 py-4 hover:bg-slate-800/20 transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <Link href={`/outreach/campaign/${c.id}`}>
                          <span className="font-bold text-slate-100 hover:text-indigo-400 cursor-pointer transition-colors">{c.name}</span>
                        </Link>
                        <StatusPill status={c.status} />
                        {c.abTestEnabled && (
                          <span className="text-[10px] font-extrabold bg-purple-500/15 text-purple-400 px-2 py-0.5 rounded-lg flex items-center gap-1 uppercase">
                            <FlaskConical className="w-2.5 h-2.5" /> A/B
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>{c.totalSent}/{c.totalTargets} sent</span>
                        {c.totalTargets > 0 && <span>{pct}% complete</span>}
                        <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                      </div>
                      {c.totalTargets > 0 && (
                        <div className="mt-2 h-1 bg-slate-800 rounded-full overflow-hidden w-48">
                          <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link href={`/outreach/campaign/${c.id}`}>
                        <button className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all">View</button>
                      </Link>
                      {(c.status === "draft" || c.status === "paused") && (
                        <button onClick={() => startMutation.mutate(c.id)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-emerald-400 transition-colors">
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                      {c.status === "running" && (
                        <button onClick={() => pauseMutation.mutate(c.id)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-amber-400 transition-colors">
                          <Pause className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => { if (confirm("Delete this campaign?")) deleteMutation.mutate(c.id); }} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
