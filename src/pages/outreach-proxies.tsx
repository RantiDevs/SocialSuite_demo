import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2, RefreshCw, CheckCircle2, XCircle, Clock, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

async function apiFetch(url: string, init?: RequestInit) {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  if (!res.ok) { const b = await res.json().catch(() => ({})); throw b; }
  if (res.status === 204) return null;
  return res.json();
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { icon: any; cls: string; label: string }> = {
    active:   { icon: CheckCircle2, cls: "text-emerald-400 bg-emerald-500/10", label: "Active" },
    dead:     { icon: XCircle,      cls: "text-red-400 bg-red-500/10",         label: "Dead" },
    untested: { icon: Clock,        cls: "text-slate-400 bg-slate-700/40",      label: "Untested" },
    testing:  { icon: RefreshCw,    cls: "text-amber-400 bg-amber-500/10",      label: "Testing" },
  };
  const cfg = map[status] || map.untested;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase ${cfg.cls}`}>
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  );
}

export default function OutreachProxies() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [rawText, setRawText] = useState("");
  const [protocol, setProtocol] = useState("http");

  const { data: proxies = [], isLoading } = useQuery({
    queryKey: ["outreach-proxies"],
    queryFn: () => apiFetch("/api/outreach/proxies"),
    staleTime: 10000,
  });

  const importMutation = useMutation({
    mutationFn: (data: any) => apiFetch("/api/outreach/proxies/import", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: (d) => {
      toast({ title: "Proxies imported", description: `${d.imported} imported, ${d.skipped} skipped` });
      setRawText(""); setShowAdd(false);
      qc.invalidateQueries({ queryKey: ["outreach-proxies"] });
    },
    onError: (e: any) => toast({ title: "Import failed", description: e?.error, variant: "destructive" }),
  });

  const testAllMutation = useMutation({
    mutationFn: () => apiFetch("/api/outreach/proxies/test-all", { method: "POST" }),
    onSuccess: () => { toast({ title: "Testing all proxies..." }); setTimeout(() => qc.invalidateQueries({ queryKey: ["outreach-proxies"] }), 5000); },
  });

  const testOneMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/outreach/proxies/test/${id}`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["outreach-proxies"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/outreach/proxies/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["outreach-proxies"] }),
  });

  const active = proxies.filter((p: any) => p.status === "active").length;
  const dead = proxies.filter((p: any) => p.status === "dead").length;

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Proxy Manager</h1>
          <p className="text-slate-400 mt-1">Manage proxies for Instagram DM sending</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => testAllMutation.mutate()} disabled={proxies.length === 0 || testAllMutation.isPending} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 font-bold rounded-xl text-sm transition-all">
            <RefreshCw className={`w-4 h-4 ${testAllMutation.isPending ? "animate-spin" : ""}`} /> Test All
          </button>
          <button onClick={() => setShowAdd(v => !v)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/20">
            <Plus className="w-4 h-4" /> Import
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total", value: proxies.length, color: "text-slate-100" },
          { label: "Active", value: active, color: "text-emerald-400" },
          { label: "Dead", value: dead, color: "text-red-400" },
        ].map(s => (
          <div key={s.label} className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-4 shadow-xl">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-6 mb-6 shadow-xl">
          <h2 className="text-sm font-bold text-slate-200 mb-4">Import Proxies</h2>
          <p className="text-xs text-slate-500 mb-3">One proxy per line: <code className="text-slate-400">host:port</code> or <code className="text-slate-400">host:port:user:pass</code></p>
          <div className="mb-3">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Protocol</label>
            <select value={protocol} onChange={e => setProtocol(e.target.value)} className="w-full mt-1 bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
              <option value="http">HTTP</option>
              <option value="https">HTTPS</option>
              <option value="socks5">SOCKS5</option>
            </select>
          </div>
          <textarea
            value={rawText}
            onChange={e => setRawText(e.target.value)}
            placeholder={"192.168.1.1:8080\n192.168.1.2:8080:user:pass"}
            className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none h-32 font-mono"
          />
          <div className="flex justify-end gap-3 mt-3">
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 font-bold text-sm transition-all">Cancel</button>
            <button onClick={() => importMutation.mutate({ rawText, defaultProtocol: protocol })} disabled={!rawText.trim() || importMutation.isPending} className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all">
              {importMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Import
            </button>
          </div>
        </div>
      )}

      <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="py-16 text-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" /></div>
        ) : proxies.length === 0 ? (
          <div className="py-16 text-center">
            <Globe className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No proxies yet</p>
            <p className="text-slate-600 text-sm mt-1">Import proxies using the button above</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800/40">
                <th className="text-left px-6 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Proxy</th>
                <th className="text-left px-6 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Protocol</th>
                <th className="text-left px-6 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Latency</th>
                <th className="text-right px-6 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {proxies.map((p: any, i: number) => (
                <tr key={p.id} className={`hover:bg-slate-800/20 transition-colors ${i < proxies.length - 1 ? "border-b border-slate-800/30" : ""}`}>
                  <td className="px-6 py-3.5">
                    <p className="font-mono text-slate-200 font-medium">{p.host}:{p.port}</p>
                    {p.username && <p className="text-[11px] text-slate-500 mt-0.5">Auth configured</p>}
                  </td>
                  <td className="px-6 py-3.5 text-slate-400 uppercase text-xs font-bold hidden sm:table-cell">{p.protocol}</td>
                  <td className="px-6 py-3.5"><StatusBadge status={p.status} /></td>
                  <td className="px-6 py-3.5 text-right text-slate-400 text-xs hidden md:table-cell">{p.latencyMs ? `${p.latencyMs}ms` : "—"}</td>
                  <td className="px-6 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => testOneMutation.mutate(p.id)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-amber-400 transition-colors">
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteMutation.mutate(p.id)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-red-400 transition-colors">
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
    </div>
  );
}
