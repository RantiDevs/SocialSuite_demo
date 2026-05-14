import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Pause, Download, FlaskConical, Clock, FileText, Loader2, Users } from "lucide-react";

async function apiFetch(url: string, init?: RequestInit) {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  if (!res.ok) { const b = await res.json().catch(() => ({})); throw b; }
  if (res.status === 204) return null;
  return res.json();
}

const STATUS_COLORS: Record<string, string> = {
  running: "bg-emerald-500/15 text-emerald-400",
  paused: "bg-amber-500/15 text-amber-400",
  completed: "bg-blue-500/15 text-blue-400",
  scheduled: "bg-purple-500/15 text-purple-400",
  draft: "bg-slate-700/40 text-slate-400",
};

export default function OutreachCampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const { data: campaign, isLoading } = useQuery({
    queryKey: ["outreach-campaign", id],
    queryFn: () => apiFetch(`/api/outreach/campaigns/${id}`),
    refetchInterval: 5000,
  });

  const { data: targetsResult } = useQuery({
    queryKey: ["outreach-campaign-targets", id],
    queryFn: () => apiFetch(`/api/outreach/campaigns/${id}/targets`),
    enabled: !!id,
    staleTime: 5000,
  });

  const pauseMutation = useMutation({
    mutationFn: () => apiFetch(`/api/outreach/campaigns/${id}/pause`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["outreach-campaign", id] }),
  });

  if (isLoading) return (
    <div className="p-6 flex items-center justify-center py-32">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
    </div>
  );

  if (!campaign) return (
    <div className="p-6">
      <p className="text-slate-400">Campaign not found</p>
    </div>
  );

  const pct = campaign.totalTargets > 0
    ? Math.round(((campaign.totalSent + campaign.totalFailed) / campaign.totalTargets) * 100)
    : 0;

  const targets = targetsResult?.targets || [];
  const totalTargets = targetsResult?.total || 0;

  return (
    <div className="p-6 max-w-5xl">
      <Link href="/outreach/campaigns">
        <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-widest mb-6 cursor-pointer transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Campaigns
        </span>
      </Link>

      <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-6 mb-6 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              <h1 className="text-2xl font-bold text-slate-100">{campaign.name}</h1>
              {campaign.abTestEnabled && (
                <span className="text-[10px] font-extrabold bg-purple-500/15 text-purple-400 px-2 py-0.5 rounded-lg flex items-center gap-1 uppercase">
                  <FlaskConical className="w-2.5 h-2.5" /> A/B
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-slate-500">
              {campaign.scheduledStart && (
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Start: {new Date(campaign.scheduledStart).toLocaleString()}</span>
              )}
              {campaign.webhookUrl && <span>Webhook configured</span>}
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-widest ${STATUS_COLORS[campaign.status] || STATUS_COLORS.draft}`}>
              {campaign.status}
            </span>
            {campaign.status === "running" && (
              <button onClick={() => pauseMutation.mutate()} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/30 text-amber-400 text-sm font-bold transition-all">
                <Pause className="w-3.5 h-3.5" /> Pause
              </button>
            )}
            <button onClick={() => window.open(`/api/outreach/campaigns/${id}/export-csv`, "_blank")} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold transition-all">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Targets", value: campaign.totalTargets.toLocaleString() },
            { label: "Sent", value: campaign.totalSent.toLocaleString() },
            { label: "Failed", value: campaign.totalFailed.toLocaleString() },
            { label: "Progress", value: `${pct}%` },
          ].map(s => (
            <div key={s.label} className="bg-slate-800/40 rounded-xl p-4">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">{s.label}</p>
              <p className="text-2xl font-bold text-slate-100">{s.value}</p>
            </div>
          ))}
        </div>

        {campaign.totalTargets > 0 && (
          <div className="mt-4">
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}

        {campaign.abTestEnabled && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-slate-800/40 rounded-xl p-4 border border-indigo-500/20">
              <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Variant A</p>
              <p className="text-2xl font-bold text-slate-100">{campaign.totalSentA.toLocaleString()}</p>
              <p className="text-xs text-slate-500 mt-1">messages sent</p>
            </div>
            <div className="bg-slate-800/40 rounded-xl p-4 border border-purple-500/20">
              <p className="text-[11px] font-bold text-purple-400 uppercase tracking-wider mb-1">Variant B</p>
              <p className="text-2xl font-bold text-slate-100">{campaign.totalSentB.toLocaleString()}</p>
              <p className="text-xs text-slate-500 mt-1">messages sent</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800/40">
          <h2 className="text-sm font-bold text-slate-200">DM Targets ({totalTargets.toLocaleString()})</h2>
        </div>

        {targets.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">No targets assigned yet — start the campaign to load targets</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800/40">
                <th className="text-left px-6 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Username</th>
                <th className="text-left px-6 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Variant</th>
                <th className="text-left px-6 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Sent At</th>
              </tr>
            </thead>
            <tbody>
              {targets.map((t: any, i: number) => (
                <tr key={t.id} className={`hover:bg-slate-800/20 ${i < targets.length - 1 ? "border-b border-slate-800/30" : ""}`}>
                  <td className="px-6 py-3.5 font-medium text-slate-200">@{t.username}</td>
                  <td className="px-6 py-3.5 hidden sm:table-cell">
                    {t.abVariant && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${t.abVariant === "B" ? "bg-purple-500/15 text-purple-400" : "bg-indigo-500/15 text-indigo-400"}`}>
                        {t.abVariant}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase ${
                      t.status === "sent" ? "bg-emerald-500/15 text-emerald-400" :
                      t.status === "failed" ? "bg-red-500/15 text-red-400" :
                      "bg-slate-700/40 text-slate-400"
                    }`}>{t.status}</span>
                  </td>
                  <td className="px-6 py-3.5 text-right text-slate-500 text-xs hidden md:table-cell">
                    {t.sentAt ? new Date(t.sentAt).toLocaleString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
