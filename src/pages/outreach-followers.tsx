import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearch } from "wouter";
import { Download, Search, Users, ChevronLeft, ChevronRight, Shield, Lock } from "lucide-react";

async function apiFetch(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw await res.json().catch(() => ({}));
  return res.json();
}

export default function OutreachFollowers() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const initialJob = params.get("job") || "";

  const [selectedJob, setSelectedJob] = useState(initialJob);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const limit = 25;

  const { data: jobs = [] } = useQuery({
    queryKey: ["outreach-jobs"],
    queryFn: () => apiFetch("/api/outreach/jobs"),
  });

  const completedJobs = jobs.filter((j: any) => j.status === "completed" || j.totalScraped > 0);

  const { data: result, isLoading } = useQuery({
    queryKey: ["outreach-followers", selectedJob, page, searchQuery],
    queryFn: () => {
      const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (searchQuery) qs.set("search", searchQuery);
      return apiFetch(`/api/outreach/jobs/${selectedJob}/followers?${qs}`);
    },
    enabled: !!selectedJob,
  });

  const followers = result?.followers || [];
  const total = result?.total || 0;
  const totalPages = result?.totalPages || 1;

  function handleJobChange(id: string) {
    setSelectedJob(id);
    setPage(1);
    setSearchQuery("");
    setSearchInput("");
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearchQuery(searchInput);
    setPage(1);
  }

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Outreach Followers</h1>
          <p className="text-slate-400 mt-1">Browse scraped Instagram followers by job</p>
        </div>
        {selectedJob && (
          <button
            onClick={() => window.open(`/api/outreach/jobs/${selectedJob}/export`, "_blank")}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border border-indigo-600/30 rounded-xl text-sm font-bold transition-all"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        )}
      </div>

      <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row gap-3 shadow-xl">
        <select
          value={selectedJob}
          onChange={e => handleJobChange(e.target.value)}
          className="flex-1 bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        >
          <option value="">Select a job...</option>
          {completedJobs.map((j: any) => (
            <option key={j.id} value={j.id}>@{j.targetUsername} — {j.totalScraped.toLocaleString()} followers</option>
          ))}
        </select>
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              disabled={!selectedJob}
              placeholder="Search username..."
              className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-40 transition-all"
            />
          </div>
          <button type="submit" disabled={!selectedJob} className="px-4 py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-bold rounded-xl text-sm transition-all">
            Search
          </button>
        </form>
      </div>

      <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800/40 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-200">
            {selectedJob ? `${total.toLocaleString()} followers` : "Select a job to browse followers"}
          </h2>
          {totalPages > 1 && (
            <span className="text-xs text-slate-500 font-medium">Page {page} of {totalPages}</span>
          )}
        </div>

        {!selectedJob ? (
          <div className="py-16 text-center">
            <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Select a completed job above</p>
          </div>
        ) : isLoading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto" />
          </div>
        ) : followers.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No followers found</p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800/40">
                  <th className="text-left px-6 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">User</th>
                  <th className="text-left px-6 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Full Name</th>
                  <th className="text-left px-6 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Followers</th>
                  <th className="text-right px-6 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {followers.map((f: any, i: number) => (
                  <tr key={f.id} className={`hover:bg-slate-800/20 transition-colors ${i < followers.length - 1 ? "border-b border-slate-800/30" : ""}`}>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        {f.profilePicUrl ? (
                          <img src={f.profilePicUrl} className="w-8 h-8 rounded-full object-cover" alt="" onError={e => { (e.target as any).style.display = "none"; }} />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                            <span className="text-xs font-bold text-slate-400">{f.username[0]?.toUpperCase()}</span>
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-100">@{f.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-slate-400 hidden sm:table-cell">{f.fullName || "—"}</td>
                    <td className="px-6 py-3.5 text-slate-400 hidden md:table-cell">{f.followerCount != null ? f.followerCount.toLocaleString() : "—"}</td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {f.isVerified && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-bold">
                            <Shield className="w-2.5 h-2.5" /> Verified
                          </span>
                        )}
                        {f.isPrivate && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-bold">
                            <Lock className="w-2.5 h-2.5" /> Private
                          </span>
                        )}
                        {!f.isPrivate && !f.isVerified && (
                          <span className="text-[10px] text-slate-600">Public</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-800/40 flex items-center justify-between">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-sm font-medium text-slate-300 transition-all">
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <span className="text-xs text-slate-500">{((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of {total.toLocaleString()}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-sm font-medium text-slate-300 transition-all">
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
