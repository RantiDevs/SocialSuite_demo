import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2, CheckCircle2, AlertCircle, Ban, Zap, ShieldX, Upload, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

async function apiFetch(url: string, init?: RequestInit) {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  if (!res.ok) { const b = await res.json().catch(() => ({})); throw b; }
  if (res.status === 204) return null;
  return res.json();
}

function StatusBadge({ status, warmupDay }: { status: string; warmupDay: number }) {
  const map: Record<string, { icon: any; cls: string; label: string }> = {
    active:   { icon: CheckCircle2, cls: "text-emerald-400", label: "Active" },
    warming:  { icon: Zap,          cls: "text-amber-400",   label: `Warming D${warmupDay}` },
    flagged:  { icon: AlertCircle,  cls: "text-orange-400",  label: "Flagged" },
    banned:   { icon: Ban,          cls: "text-red-400",     label: "Banned" },
    challenged: { icon: ShieldX,   cls: "text-pink-400",    label: "Challenged" },
  };
  const cfg = map[status] || { icon: AlertCircle, cls: "text-slate-400", label: status };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${cfg.cls} uppercase`}>
      <Icon className="w-3.5 h-3.5" /> {cfg.label}
    </span>
  );
}

export default function OutreachAccounts() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [editingAcc, setEditingAcc] = useState<any>(null);

  const { data: accounts = [], isLoading, refetch } = useQuery({
    queryKey: ["outreach-accounts"],
    queryFn: () => apiFetch("/api/outreach/accounts"),
    staleTime: 10000,
  });

  const importMutation = useMutation({
    mutationFn: (data: any) => apiFetch("/api/outreach/accounts/import", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: (d) => {
      toast({ title: "Import complete", description: `${d.imported} imported, ${d.skipped} skipped, ${d.failed} failed` });
      setBulkText(""); setShowAdd(false);
      qc.invalidateQueries({ queryKey: ["outreach-accounts"] });
    },
    onError: (e: any) => toast({ title: "Import failed", description: e?.error, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiFetch(`/api/outreach/accounts/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => { toast({ title: "Account updated" }); setEditingAcc(null); qc.invalidateQueries({ queryKey: ["outreach-accounts"] }); },
    onError: (e: any) => toast({ title: "Update failed", description: e?.error, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/outreach/accounts/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["outreach-accounts"] }),
  });

  const active = accounts.filter((a: any) => a.status === "active").length;
  const banned = accounts.filter((a: any) => a.status === "banned").length;

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">IG Accounts</h1>
          <p className="text-slate-400 mt-1">Manage Instagram accounts used for DM sending</p>
        </div>
        <button onClick={() => setShowAdd(v => !v)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/20">
          <Upload className="w-4 h-4" /> Import Accounts
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total", value: accounts.length, color: "text-slate-100" },
          { label: "Active", value: active, color: "text-emerald-400" },
          { label: "Banned", value: banned, color: "text-red-400" },
        ].map(s => (
          <div key={s.label} className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-4 shadow-xl">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-6 mb-6 shadow-xl">
          <h2 className="text-sm font-bold text-slate-200 mb-2">Import Accounts</h2>
          <p className="text-xs text-slate-500 mb-3">One per line: <code className="text-slate-400">username:password</code> or <code className="text-slate-400">username:password:2fa_secret</code></p>
          <textarea
            value={bulkText}
            onChange={e => setBulkText(e.target.value)}
            placeholder={"johndoe:Pass123!\njane_smith:Secure456:ABCD1234"}
            className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none h-32 font-mono"
          />
          <div className="flex justify-end gap-3 mt-3">
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 font-bold text-sm transition-all">Cancel</button>
            <button onClick={() => importMutation.mutate({ rawText: bulkText })} disabled={!bulkText.trim() || importMutation.isPending} className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all">
              {importMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Import
            </button>
          </div>
        </div>
      )}

      <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="py-16 text-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" /></div>
        ) : accounts.length === 0 ? (
          <div className="py-16 text-center">
            <Upload className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No accounts yet</p>
            <p className="text-slate-600 text-sm mt-1">Import Instagram accounts using the button above</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800/40">
                <th className="text-left px-6 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Account</th>
                <th className="text-left px-6 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Added</th>
                <th className="text-right px-6 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a: any, i: number) => (
                <tr key={a.id} className={`hover:bg-slate-800/20 transition-colors ${i < accounts.length - 1 ? "border-b border-slate-800/30" : ""}`}>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs">
                        {a.username[0]?.toUpperCase()}
                      </div>
                      <span className="font-bold text-slate-100">@{a.username}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5"><StatusBadge status={a.status} warmupDay={a.warmupDay} /></td>
                  <td className="px-6 py-3.5 text-right text-slate-500 text-xs hidden md:table-cell">{new Date(a.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setEditingAcc({ ...a, newPassword: "", new2fa: "" })} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-indigo-400 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { if (confirm("Delete this account?")) deleteMutation.mutate(a.id); }} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editingAcc && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-slate-100 mb-5 flex items-center gap-2">
              <Pencil className="w-5 h-5 text-indigo-400" /> Edit @{editingAcc.username}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Username</label>
                <input value={editingAcc.username} onChange={e => setEditingAcc({ ...editingAcc, username: e.target.value })} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">New Password (leave blank to keep)</label>
                <input type="password" value={editingAcc.newPassword} onChange={e => setEditingAcc({ ...editingAcc, newPassword: e.target.value })} placeholder="••••••••" className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</label>
                <select value={editingAcc.status} onChange={e => setEditingAcc({ ...editingAcc, status: e.target.value })} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                  {["active", "warming", "flagged", "banned", "challenged"].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setEditingAcc(null)} className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 font-bold text-sm transition-all">Cancel</button>
                <button onClick={() => updateMutation.mutate({ id: editingAcc.id, username: editingAcc.username, password: editingAcc.newPassword || undefined, status: editingAcc.status })} disabled={updateMutation.isPending} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all">
                  {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
