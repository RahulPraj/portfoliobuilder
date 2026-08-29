import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users, FileCheck2, Bell, Trash2, Check, X, Map, Plus, Eye, EyeOff,
  Pencil, LayoutDashboard, UserCheck, FileClock,
} from "lucide-react";
import api from "../api/axios.js";
import RepeatableFieldEditor from "../components/RepeatableFieldEditor.jsx";

const TABS = ["Overview", "Pending profiles", "Users", "Roadmaps", "Notifications"];

const emptyRoadmap = () => ({
  title: "",
  summary: "",
  category: "Roadmap",
  tags: [],
  isRoadmap: true,
  isFeatured: false,
  roadmapSteps: [],
});

export default function AdminDashboard() {
  const [tab, setTab] = useState(0);
  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState([]);
  const [users, setUsers] = useState([]);
  const [roadmaps, setRoadmaps] = useState([]);
  const [editingRoadmap, setEditingRoadmap] = useState(null); // null = list view, object = editor
  const [notifications, setNotifications] = useState({ pendingAccounts: [], pendingPortfolios: [] });
  const [q, setQ] = useState("");

  const loadStats = () => api.get("/admin/stats").then(({ data }) => setStats(data));
  const loadPending = () => api.get("/admin/portfolios/pending").then(({ data }) => setPending(data));
  const loadUsers = (query = "") => api.get("/admin/users", { params: { q: query } }).then(({ data }) => setUsers(data.items));
  const loadRoadmaps = () => api.get("/admin/articles", { params: { isRoadmap: true } }).then(({ data }) => setRoadmaps(data));
  const loadNotifications = () => api.get("/admin/notifications").then(({ data }) => setNotifications(data));

  useEffect(() => {
    loadStats();
    loadPending();
    loadUsers();
    loadRoadmaps();
    loadNotifications();
  }, []);

  const refreshAll = () => {
    loadStats();
    loadPending();
    loadNotifications();
  };

  const approvePortfolio = async (id) => {
    await api.patch(`/admin/portfolios/${id}/approve`, { autoPublish: true });
    refreshAll();
  };
  const rejectPortfolio = async (id) => {
    const note = prompt("Note for the user (what should they change?)") || "";
    await api.patch(`/admin/portfolios/${id}/reject`, { note });
    refreshAll();
  };
  const approveAccount = async (id) => {
    await api.patch(`/admin/users/${id}/approve`);
    loadUsers(q);
    refreshAll();
  };
  const deleteAccount = async (id) => {
    if (!confirm("Delete this account and its portfolio permanently?")) return;
    await api.delete(`/admin/users/${id}`);
    loadUsers(q);
    loadStats();
  };

  // roadmap create/edit/delete/publish
  const saveRoadmap = async () => {
    if (!editingRoadmap.title.trim()) return alert("Give the roadmap a title first.");
    if (editingRoadmap._id) {
      await api.put(`/admin/articles/${editingRoadmap._id}`, editingRoadmap);
    } else {
      await api.post("/admin/articles", editingRoadmap);
    }
    setEditingRoadmap(null);
    loadRoadmaps();
    loadStats();
  };
  const deleteRoadmap = async (id) => {
    if (!confirm("Delete this roadmap permanently?")) return;
    await api.delete(`/admin/articles/${id}`);
    loadRoadmaps();
    loadStats();
  };
  const togglePublishRoadmap = async (roadmap) => {
    await api.patch(`/admin/articles/${roadmap._id}/publish`, { isPublished: !roadmap.isPublished });
    loadRoadmaps();
  };

  const statCards = stats
    ? [
        { label: "Total users", value: stats.totalUsers, icon: Users, tint: "text-signal bg-signal/10" },
        { label: "Pending accounts", value: stats.pendingAccounts, icon: UserCheck, tint: "text-spark bg-spark/10" },
        { label: "Live portfolios", value: stats.publishedPortfolios, icon: FileCheck2, tint: "text-signal2 bg-signal2/10" },
        { label: "Profiles to review", value: stats.pendingPortfolios, icon: FileClock, tint: "text-spark bg-spark/10" },
        { label: "Articles", value: stats.totalArticles, icon: LayoutDashboard, tint: "text-signal bg-signal/10" },
        { label: "Roadmaps", value: stats.totalRoadmaps, icon: Map, tint: "text-signal2 bg-signal2/10" },
      ]
    : [];

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="font-display text-3xl mb-1">Admin Dashboard</h1>
      <p className="text-ink/50 text-sm mb-8">Manage accounts, permit profiles, and curate roadmaps.</p>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
        {statCards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-ink/10 bg-white/70 backdrop-blur p-4"
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${c.tint}`}>
              <c.icon size={16} />
            </div>
            <p className="font-display text-2xl leading-none">{c.value ?? "—"}</p>
            <p className="text-xs text-ink/50 mt-1">{c.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-8 border-b border-ink/10">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors inline-flex items-center gap-1.5 ${
              tab === i ? "border-signal text-signal" : "border-transparent text-ink/50 hover:text-ink"
            }`}
          >
            {t === "Pending profiles" && <FileCheck2 size={14} />}
            {t === "Users" && <Users size={14} />}
            {t === "Roadmaps" && <Map size={14} />}
            {t === "Notifications" && <Bell size={14} />}
            {t}
            {t === "Pending profiles" && pending.length > 0 && (
              <span className="text-[10px] bg-signal text-white rounded-full px-1.5">{pending.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-ink/10 bg-white/70 p-6">
            <h3 className="font-display text-xl mb-4">Needs your attention</h3>
            {pending.length === 0 && notifications.pendingAccounts.length === 0 && (
              <p className="text-sm text-ink/40">All caught up — nothing pending review.</p>
            )}
            {pending.slice(0, 4).map((p) => (
              <div key={p._id} className="flex items-center justify-between py-2 border-b border-ink/5 last:border-0 text-sm">
                <span>{p.fullName}'s profile is awaiting approval</span>
                <button onClick={() => approvePortfolio(p._id)} className="text-signal2 text-xs font-medium hover:underline">Approve</button>
              </div>
            ))}
            {notifications.pendingAccounts.slice(0, 4).map((a) => (
              <div key={a._id} className="flex items-center justify-between py-2 border-b border-ink/5 last:border-0 text-sm">
                <span>{a.name} just registered</span>
                <button onClick={() => approveAccount(a._id)} className="text-signal2 text-xs font-medium hover:underline">Approve</button>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-ink/10 bg-white/70 p-6">
            <h3 className="font-display text-xl mb-4">Roadmap library</h3>
            <p className="text-sm text-ink/50 mb-4">{roadmaps.length} roadmap{roadmaps.length !== 1 ? "s" : ""} · {roadmaps.filter((r) => r.isPublished).length} published</p>
            <button
              onClick={() => { setEditingRoadmap(emptyRoadmap()); setTab(3); }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-ink text-paper text-sm font-medium hover:bg-signal transition-colors"
            >
              <Plus size={14} /> New roadmap
            </button>
          </div>
        </motion.div>
      )}

      {/* Pending profiles */}
      {tab === 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {pending.length === 0 && <p className="text-ink/40 text-sm">No profiles waiting for review.</p>}
          {pending.map((p) => (
            <div key={p._id} className="rounded-xl border border-ink/10 bg-white/60 p-5 flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">{p.fullName}</p>
                <p className="text-sm text-ink/50">{p.user?.email}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => approvePortfolio(p._id)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-signal2/10 text-signal2 text-sm font-medium hover:bg-signal2 hover:text-white transition-colors">
                  <Check size={14} /> Approve & publish
                </button>
                <button onClick={() => rejectPortfolio(p._id)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-red-500/10 text-red-500 text-sm font-medium hover:bg-red-500 hover:text-white transition-colors">
                  <X size={14} /> Request changes
                </button>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Users */}
      {tab === 2 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <input
            placeholder="Search by name or email…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              loadUsers(e.target.value);
            }}
            className="focus-ring w-full max-w-sm mb-6 rounded-lg border border-ink/15 bg-white/70 px-4 py-2.5 text-sm"
          />
          <div className="overflow-x-auto rounded-xl border border-ink/10">
            <table className="w-full text-sm">
              <thead className="bg-ink/5 text-ink/50 text-left">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-t border-ink/5">
                    <td className="px-4 py-3">{u.name}</td>
                    <td className="px-4 py-3 text-ink/60">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-mono px-2 py-1 rounded-full ${
                        u.accountStatus === "approved" ? "bg-signal2/10 text-signal2" :
                        u.accountStatus === "suspended" ? "bg-red-500/10 text-red-500" : "bg-spark/10 text-spark"
                      }`}>
                        {u.accountStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink/40">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 flex gap-3">
                      {u.accountStatus !== "approved" && (
                        <button onClick={() => approveAccount(u._id)} className="text-signal2 hover:underline text-xs font-medium">Approve</button>
                      )}
                      <button onClick={() => deleteAccount(u._id)} className="text-red-500 hover:text-red-700">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Roadmaps */}
      {tab === 3 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {!editingRoadmap ? (
            <>
              <div className="flex justify-between items-center mb-6">
                <p className="text-sm text-ink/50">Create and manage the knowledge roadmaps users see in Articles &amp; Roadmaps.</p>
                <button
                  onClick={() => setEditingRoadmap(emptyRoadmap())}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-ink text-paper text-sm font-medium hover:bg-signal transition-colors"
                >
                  <Plus size={14} /> New roadmap
                </button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {roadmaps.map((r) => (
                  <div key={r._id} className="rounded-xl border border-ink/10 bg-white/60 p-5">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-display text-lg">{r.title}</h3>
                      <span className={`text-[10px] font-mono px-2 py-1 rounded-full shrink-0 ${r.isPublished ? "bg-signal2/10 text-signal2" : "bg-ink/10 text-ink/50"}`}>
                        {r.isPublished ? "Published" : "Draft"}
                      </span>
                    </div>
                    <p className="text-sm text-ink/60 mb-3">{r.summary}</p>
                    <p className="text-xs text-ink/40 mb-4">{r.roadmapSteps?.length || 0} steps</p>
                    <div className="flex gap-3 text-xs font-medium">
                      <button onClick={() => setEditingRoadmap(r)} className="inline-flex items-center gap-1 text-signal hover:underline">
                        <Pencil size={12} /> Edit
                      </button>
                      <button onClick={() => togglePublishRoadmap(r)} className="inline-flex items-center gap-1 text-ink/60 hover:text-ink">
                        {r.isPublished ? <EyeOff size={12} /> : <Eye size={12} />} {r.isPublished ? "Unpublish" : "Publish"}
                      </button>
                      <button onClick={() => deleteRoadmap(r._id)} className="inline-flex items-center gap-1 text-red-500 hover:underline">
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </div>
                ))}
                {roadmaps.length === 0 && <p className="text-ink/40 text-sm">No roadmaps yet — create your first one.</p>}
              </div>
            </>
          ) : (
            <div className="max-w-3xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display text-xl">{editingRoadmap._id ? "Edit roadmap" : "New roadmap"}</h3>
                <button onClick={() => setEditingRoadmap(null)} className="text-sm text-ink/50 hover:text-ink">Cancel</button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <label className="text-sm">
                  <span className="block text-ink/50 mb-1">Title</span>
                  <input
                    value={editingRoadmap.title}
                    onChange={(e) => setEditingRoadmap({ ...editingRoadmap, title: e.target.value })}
                    className="focus-ring w-full rounded-lg border border-ink/15 bg-white/70 px-3 py-2"
                  />
                </label>
                <label className="text-sm">
                  <span className="block text-ink/50 mb-1">Category</span>
                  <input
                    value={editingRoadmap.category}
                    onChange={(e) => setEditingRoadmap({ ...editingRoadmap, category: e.target.value })}
                    className="focus-ring w-full rounded-lg border border-ink/15 bg-white/70 px-3 py-2"
                  />
                </label>
                <label className="text-sm sm:col-span-2">
                  <span className="block text-ink/50 mb-1">Summary</span>
                  <textarea
                    rows={2}
                    value={editingRoadmap.summary}
                    onChange={(e) => setEditingRoadmap({ ...editingRoadmap, summary: e.target.value })}
                    className="focus-ring w-full rounded-lg border border-ink/15 bg-white/70 px-3 py-2"
                  />
                </label>
                <label className="text-sm sm:col-span-2">
                  <span className="block text-ink/50 mb-1">Tags (comma separated)</span>
                  <input
                    value={(editingRoadmap.tags || []).join(", ")}
                    onChange={(e) =>
                      setEditingRoadmap({
                        ...editingRoadmap,
                        tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    className="focus-ring w-full rounded-lg border border-ink/15 bg-white/70 px-3 py-2"
                  />
                </label>
              </div>

              <p className="text-sm font-medium mb-3">Topics / modules (drag order with the arrows)</p>
              <RepeatableFieldEditor
                items={editingRoadmap.roadmapSteps || []}
                onChange={(steps) => setEditingRoadmap({ ...editingRoadmap, roadmapSteps: steps })}
                addLabel="Add topic"
                emptyItem={() => ({ title: "", description: "", resources: [] })}
                fields={[
                  { key: "title", label: "Topic title", type: "text" },
                  { key: "description", label: "Description", type: "textarea" },
                  { key: "resources", label: "Resource links (comma separated)", type: "list" },
                ]}
              />

              <div className="flex gap-3 mt-6">
                <button onClick={saveRoadmap} className="px-6 py-2.5 rounded-full bg-ink text-paper text-sm font-medium hover:bg-signal transition-colors">
                  {editingRoadmap._id ? "Save changes" : "Create roadmap"}
                </button>
                <label className="inline-flex items-center gap-2 text-sm text-ink/60">
                  <input
                    type="checkbox"
                    checked={!!editingRoadmap.isFeatured}
                    onChange={(e) => setEditingRoadmap({ ...editingRoadmap, isFeatured: e.target.checked })}
                  />
                  Feature this roadmap
                </label>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Notifications */}
      {tab === 4 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-3">New accounts</h3>
            <div className="space-y-2">
              {notifications.pendingAccounts.map((a) => (
                <div key={a._id} className="text-sm rounded-lg border border-ink/10 bg-white/60 p-3">
                  {a.name} · <span className="text-ink/50">{a.email}</span>
                </div>
              ))}
              {notifications.pendingAccounts.length === 0 && <p className="text-ink/40 text-sm">Nothing new.</p>}
            </div>
          </div>
          <div>
            <h3 className="font-medium mb-3">Profiles awaiting review</h3>
            <div className="space-y-2">
              {notifications.pendingPortfolios.map((p) => (
                <div key={p._id} className="text-sm rounded-lg border border-ink/10 bg-white/60 p-3">
                  {p.fullName}
                </div>
              ))}
              {notifications.pendingPortfolios.length === 0 && <p className="text-ink/40 text-sm">Nothing new.</p>}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
