import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  UploadCloud, Plus, Trash2, Rocket, Inbox, ShieldAlert, ShieldCheck, Clock,
  ChevronUp, ChevronDown, Eye, Share2, Copy, Check, ExternalLink, Globe, Camera,
} from "lucide-react";
import api from "../api/axios.js";
import ProjectCard from "../components/ProjectCard.jsx";
import RepeatableFieldEditor from "../components/RepeatableFieldEditor.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const TABS = [
  "Import résumé", "Profile", "Experience", "Skills",
  "Projects", "Education", "Certifications", "Achievements",
  "Messages", "Preview & Share",
];

const STATUS = {
  pending:  { icon: Clock,       text: "Pending admin review", cls: "bg-spark/10 text-spark"     },
  approved: { icon: ShieldCheck, text: "Approved by admin",    cls: "bg-signal2/10 text-signal2" },
  rejected: { icon: ShieldAlert, text: "Changes requested",    cls: "bg-red-500/10 text-red-500" },
};

// Normalize any URL string to always have https:// prefix
function normalizeUrl(url) {
  if (!url || typeof url !== "string") return null;
  const t = url.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

export default function PortfolioBuilder() {
  const { user } = useAuth();
  const [tab, setTab] = useState(0);
  const [portfolio, setPortfolio] = useState(null);
  const [saving, setSaving]       = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [resumeSuggestion, setResumeSuggestion] = useState(null);
  const [feedback, setFeedback]   = useState([]);
  const [msg, setMsg]             = useState("");
  const [msgType, setMsgType]     = useState("success");
  const [copied, setCopied]       = useState(false);
  const avatarInputRef            = useRef(null);

  const load = () => api.get("/portfolio/me").then(({ data }) => setPortfolio(data));

  useEffect(() => {
    load();
    api.get("/feedback/me").then(({ data }) => setFeedback(data)).catch(() => {});
  }, []);

  const save = async (patch) => {
    setSaving(true);
    setMsg("");
    try {
      const { data } = await api.put("/portfolio/me", patch ?? portfolio);
      setPortfolio(data);
      setMsgType("success");
      setMsg("Saved.");
      setTimeout(() => setMsg(""), 1800);
      return data;
    } catch (err) {
      setMsgType("error");
      setMsg(err.response?.data?.message || "Couldn't save — try again.");
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const importResume = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    setImportError("");
    setResumeSuggestion(null);
    const fd = new FormData();
    fd.append("resume", file);
    try {
      const { data } = await api.post("/portfolio/import-resume", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResumeSuggestion(data.suggested);
    } catch (err) {
      setImportError(err.response?.data?.message || "Couldn't read that résumé — try a different PDF or DOCX.");
    } finally {
      setImporting(false);
    }
  };

  const applyResumeSuggestion = () => {
    if (!resumeSuggestion) return;
    setPortfolio((p) => ({
      ...p,
      fullName:       resumeSuggestion.fullName       || p.fullName,
      headline:       resumeSuggestion.headline       || p.headline,
      introduction:   resumeSuggestion.introduction   || p.introduction,
      location:       resumeSuggestion.location       || p.location,
      email:          resumeSuggestion.email          || p.email,
      phone:          resumeSuggestion.phone          || p.phone,
      github:         resumeSuggestion.github         || p.github,
      linkedin:       resumeSuggestion.linkedin       || p.linkedin,
      skills:         resumeSuggestion.skills?.length         ? resumeSuggestion.skills         : p.skills,
      experience:     resumeSuggestion.experience?.length     ? resumeSuggestion.experience     : p.experience,
      education:      resumeSuggestion.education?.length      ? resumeSuggestion.education      : p.education,
      certifications: resumeSuggestion.certifications?.length ? resumeSuggestion.certifications : p.certifications,
      projects:       resumeSuggestion.projects?.length       ? resumeSuggestion.projects       : p.projects,
    }));
    setResumeSuggestion(null);
  };

  const updateField   = (field, val) => setPortfolio((p) => ({ ...p, [field]: val }));
  const updateSection = (section, val) => setPortfolio((p) => ({ ...p, [section]: val }));

  const updateProject = (i, field, val) => {
    const projects = [...portfolio.projects];
    projects[i] = { ...projects[i], [field]: val };
    setPortfolio((p) => ({ ...p, projects }));
  };

  const addProject = () =>
    setPortfolio((p) => ({
      ...p,
      projects: [
        ...(p.projects || []),
        { title: "New project", description: "", bullets: [], techStack: [], githubUrl: "", liveUrl: "", featured: false },
      ],
    }));

  const removeProject = (i) =>
    setPortfolio((p) => ({ ...p, projects: p.projects.filter((_, idx) => idx !== i) }));

  const moveProject = (i, dir) => {
    setPortfolio((p) => {
      const j = i + dir;
      if (j < 0 || j >= p.projects.length) return p;
      const projects = [...p.projects];
      [projects[i], projects[j]] = [projects[j], projects[i]];
      return { ...p, projects };
    });
  };

  const publish = async () => {
    setPublishing(true);
    try {
      const saved = await save();
      const { data } = await api.post("/portfolio/me/publish");
      setPortfolio((p) => ({
        ...p,
        isPublished:    data.isPublished,
        approvalStatus: saved?.approvalStatus ?? p.approvalStatus,
        slug:           saved?.slug ?? p.slug,
      }));
      setMsgType("success");
      setMsg(data.message);
    } catch (err) {
      setMsgType("error");
      setMsg(err.response?.data?.message || "Couldn't publish — try again.");
    } finally {
      setPublishing(false);
    }
  };

  const unpublish = async () => {
    await api.post("/portfolio/me/unpublish");
    setPortfolio((p) => ({ ...p, isPublished: false }));
  };

  const uploadAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingAvatar(true);
    const fd = new FormData();
    fd.append("avatar", file);
    try {
      const { data } = await api.post("/portfolio/me/avatar", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPortfolio((p) => ({ ...p, avatarUrl: data.avatarUrl }));
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const decide = async (id, action) => {
    try {
      await api.patch(`/feedback/${id}/${action}`);
      const { data } = await api.get("/feedback/me");
      setFeedback(data);
    } catch {
      alert("Couldn't update that message — try again.");
    }
  };

  const handleCopyLink = () => {
    if (!portfolio?.slug) return;
    const url = `${window.location.origin}/p/${portfolio.slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!portfolio) return <p className="max-w-3xl mx-auto px-6 py-24 text-ink/40">Loading your workspace…</p>;

  const st  = STATUS[portfolio.approvalStatus] || STATUS.pending;
  const Icon = st.icon;
  const portfolioUrl = portfolio.slug ? `${window.location.origin}/p/${portfolio.slug}` : null;

  const SaveBar = ({ label = "Save changes" }) => (
    <div className="flex items-center gap-3 mt-6">
      <button
        onClick={() => save()}
        disabled={saving}
        className="px-6 py-2.5 rounded-full bg-ink text-paper text-sm font-medium hover:bg-signal transition-colors disabled:opacity-50"
      >
        {saving ? "Saving…" : label}
      </button>
      {msg && (
        <span className={`text-sm ${msgType === "error" ? "text-red-500" : "text-signal2"}`}>
          {msg}
        </span>
      )}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl">Your workspace</h1>
          <p className="text-ink/50 text-sm">Logged in as {user?.name}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-full ${st.cls}`}>
            <Icon size={13} /> {st.text}
          </span>
          <span className={`text-xs font-mono px-3 py-1.5 rounded-full ${portfolio.isPublished ? "bg-signal2/10 text-signal2" : "bg-ink/10 text-ink/50"}`}>
            {portfolio.isPublished ? "🟢 Live" : "⚫ Not published"}
          </span>
          {portfolio.slug && (
            <a
              href={`/p/${portfolio.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-signal text-signal hover:bg-signal hover:text-white transition-colors"
            >
              <Globe size={13} /> View Portfolio
            </a>
          )}
          {portfolio.isPublished ? (
            <button
              onClick={unpublish}
              className="text-xs font-medium px-3 py-1.5 rounded-full border border-ink/20 text-ink/60 hover:border-red-400 hover:text-red-500 transition-colors"
            >
              Unpublish
            </button>
          ) : (
            <button
              onClick={publish}
              disabled={publishing}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-4 py-1.5 rounded-full bg-signal text-white hover:bg-signal2 transition-colors disabled:opacity-60"
            >
              <Rocket size={13} /> {publishing ? "Submitting…" : "Publish"}
            </button>
          )}
        </div>
      </div>

      {portfolio.approvalStatus === "rejected" && portfolio.approvalNote && (
        <div className="mb-8 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <strong>Admin feedback:</strong> {portfolio.approvalNote}
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex flex-wrap gap-0 mb-8 border-b border-ink/10">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
              tab === i ? "border-signal text-signal" : "border-transparent text-ink/50 hover:text-ink"
            }`}
          >
            {t === "Messages" && feedback.filter((f) => f.status === "pending").length > 0 && (
              <span className="mr-1.5 text-[10px] bg-signal text-white rounded-full px-1.5">
                {feedback.filter((f) => f.status === "pending").length}
              </span>
            )}
            {t === "Preview & Share" && <Eye size={13} className="inline mr-1.5 -mt-0.5" />}
            {t}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════
          TAB 0 — Import résumé
      ══════════════════════════════════════════════════════════ */}
      {tab === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid md:grid-cols-2 gap-8">
          <div>
            <label className="block rounded-2xl border-2 border-dashed border-ink/20 hover:border-signal transition-colors p-10 text-center cursor-pointer">
              <UploadCloud className="mx-auto mb-3 text-signal" size={28} />
              <p className="font-medium">{importing ? "Reading your résumé…" : "Upload your résumé (PDF or DOCX)"}</p>
              <p className="text-xs text-ink/40 mt-1">
                We'll pre-fill your personal info, summary, experience, education, skills, projects and certifications.
              </p>
              <input type="file" accept=".pdf,.docx" className="hidden" onChange={importResume} disabled={importing} />
            </label>
            {importError && <p className="mt-3 text-sm text-red-500">{importError}</p>}
          </div>

          {resumeSuggestion && (
            <div className="rounded-2xl border border-signal/30 bg-signal/5 p-6">
              <p className="font-medium mb-3">Found in your résumé:</p>
              <ul className="text-sm space-y-1 text-ink/70 mb-5">
                <li><strong>Name:</strong> {resumeSuggestion.fullName || "—"}</li>
                <li><strong>Headline:</strong> {resumeSuggestion.headline || "—"}</li>
                <li><strong>Experience entries:</strong> {resumeSuggestion.experience?.length || 0}</li>
                <li><strong>Education entries:</strong> {resumeSuggestion.education?.length || 0}</li>
                <li><strong>Skills groups:</strong> {resumeSuggestion.skills?.length || 0}</li>
                <li><strong>Projects:</strong> {resumeSuggestion.projects?.length || 0}</li>
                <li><strong>Certifications:</strong> {resumeSuggestion.certifications?.length || 0}</li>
              </ul>
              <p className="text-xs text-ink/40 mb-4">Applying this overwrites non-empty sections. You can edit everything after.</p>
              <button onClick={applyResumeSuggestion} className="px-5 py-2 rounded-full bg-signal text-white text-sm font-medium hover:bg-signal2 transition-colors">
                Apply suggestions
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB 1 — Profile  (FIXED: clean layout, no overlap)
      ══════════════════════════════════════════════════════════ */}
      {tab === 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl">

          {/* ── Profile image section — self-contained block, never overlaps form ── */}
          <div className="mb-8 flex items-center gap-6">
            {/* Circular avatar */}
            <div className="relative flex-shrink-0">
              <div
                className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-xl ring-2 ring-signal/20"
                style={{ boxShadow: "0 8px 32px rgba(91,91,246,0.18), 0 2px 8px rgba(0,0,0,0.10)" }}
              >
                {portfolio.avatarUrl ? (
                  <img
                    src={portfolio.avatarUrl.startsWith("http") ? portfolio.avatarUrl : "/uploads/rahul-avatar.jpg"}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-signal to-signal2 flex items-center justify-center">
                    <span className="font-display text-white text-2xl">
                      {(portfolio.fullName || "U").split(" ").map((w) => w[0]).slice(0, 2).join("")}
                    </span>
                  </div>
                )}
              </div>
              {/* Camera badge */}
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-signal text-white flex items-center justify-center shadow-md hover:bg-signal2 transition-colors disabled:opacity-60"
                title="Change photo"
              >
                <Camera size={13} />
              </button>
            </div>

            {/* Name + change photo label */}
            <div>
              <p className="font-medium text-lg leading-tight">{portfolio.fullName || "Your Name"}</p>
              <p className="text-sm text-ink/50 mt-0.5">{portfolio.headline || "Your headline"}</p>
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="mt-2 text-sm text-signal hover:text-signal2 font-medium transition-colors disabled:opacity-50"
              >
                {uploadingAvatar ? "Uploading…" : "Change photo"}
              </button>
            </div>

            {/* Hidden file input — never visible, triggered by button/link */}
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={uploadAvatar}
            />
          </div>

          {/* ── Profile form fields — always below the avatar, never overlapping ── */}
          <div className="space-y-4">
            {[
              { key: "fullName",     label: "Full name",          type: "text"     },
              { key: "headline",     label: "Headline / role",    type: "text"     },
              { key: "introduction", label: "Introduction",       type: "textarea" },
              { key: "location",     label: "Location",           type: "text"     },
              { key: "email",        label: "Contact email",      type: "email"    },
              { key: "phone",        label: "Phone (optional)",   type: "text"     },
              { key: "github",       label: "GitHub profile URL", type: "url"      },
              { key: "linkedin",     label: "LinkedIn URL",       type: "url"      },
              { key: "website",      label: "Personal website",   type: "url"      },
            ].map(({ key, label, type }) =>
              type === "textarea" ? (
                <div key={key}>
                  <label className="block text-xs font-medium text-ink/50 mb-1">{label}</label>
                  <textarea
                    rows={4}
                    value={portfolio[key] || ""}
                    onChange={(e) => updateField(key, e.target.value)}
                    className="focus-ring w-full rounded-lg border border-ink/15 bg-white/70 px-3 py-2 text-sm resize-none"
                  />
                </div>
              ) : (
                <div key={key}>
                  <label className="block text-xs font-medium text-ink/50 mb-1">{label}</label>
                  <input
                    type={type}
                    value={portfolio[key] || ""}
                    onChange={(e) => updateField(key, e.target.value)}
                    className="focus-ring w-full rounded-lg border border-ink/15 bg-white/70 px-3 py-2 text-sm"
                  />
                </div>
              )
            )}
          </div>

          <SaveBar label="Save profile" />
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB 2 — Experience
      ══════════════════════════════════════════════════════════ */}
      {tab === 2 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl">
          <RepeatableFieldEditor
            items={portfolio.experience || []}
            onChange={(items) => updateSection("experience", items)}
            addLabel="Add experience"
            emptyItem={() => ({ role: "", company: "", startDate: "", endDate: "", bullets: [] })}
            fields={[
              { key: "role",      label: "Role / Title",          type: "text"    },
              { key: "company",   label: "Company",               type: "text"    },
              { key: "startDate", label: "Start date",            type: "text"    },
              { key: "endDate",   label: "End date (or Present)", type: "text"    },
              { key: "bullets",   label: "Bullet points",         type: "bullets" },
            ]}
          />
          <SaveBar label="Save experience" />
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB 3 — Skills
      ══════════════════════════════════════════════════════════ */}
      {tab === 3 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl">
          <RepeatableFieldEditor
            items={portfolio.skills || []}
            onChange={(items) => updateSection("skills", items)}
            addLabel="Add skill group"
            emptyItem={() => ({ category: "", items: [] })}
            fields={[
              { key: "category", label: "Category (e.g. Frontend)", type: "text" },
              { key: "items",    label: "Skills (comma separated)", type: "tags" },
            ]}
          />
          <SaveBar label="Save skills" />
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB 4 — Projects (with URL normalization hints)
      ══════════════════════════════════════════════════════════ */}
      {tab === 4 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex justify-between items-center mb-6">
            <p className="text-sm text-ink/50">This is exactly how visitors see your project cards.</p>
            <button onClick={addProject} className="inline-flex items-center gap-1.5 text-sm font-medium text-signal hover:underline">
              <Plus size={15} /> Add project
            </button>
          </div>

          {/* Live preview cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {portfolio.projects?.map((project, i) => (
              <div key={i} className="relative">
                <ProjectCard project={project} index={i} />
                <div className="absolute top-4 left-4 flex gap-1 bg-white/80 rounded-full p-1 shadow">
                  <button onClick={() => moveProject(i, -1)} disabled={i === 0} className="p-1 text-ink/40 hover:text-signal disabled:opacity-20" title="Move up">
                    <ChevronUp size={14} />
                  </button>
                  <button onClick={() => moveProject(i, 1)} disabled={i === (portfolio.projects.length - 1)} className="p-1 text-ink/40 hover:text-signal disabled:opacity-20" title="Move down">
                    <ChevronDown size={14} />
                  </button>
                  <button onClick={() => removeProject(i)} className="p-1 text-red-400 hover:text-red-600" title="Remove project">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Edit forms */}
          {portfolio.projects?.map((project, i) => (
            <div key={i} className="rounded-xl border border-ink/10 bg-white/50 p-4 mb-4 space-y-3">
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-ink/40 mb-1">Title</label>
                  <input
                    placeholder="My Awesome Project"
                    value={project.title}
                    onChange={(e) => updateProject(i, "title", e.target.value)}
                    className="focus-ring w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink/40 mb-1">Tech stack (comma separated)</label>
                  <input
                    placeholder="React, Node.js, MongoDB"
                    value={project.techStack?.join(", ")}
                    onChange={(e) => updateProject(i, "techStack", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                    className="focus-ring w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink/40 mb-1">Description</label>
                <textarea
                  placeholder="What this project does and why you built it"
                  value={project.description}
                  onChange={(e) => updateProject(i, "description", e.target.value)}
                  rows={2}
                  className="focus-ring w-full rounded-lg border border-ink/15 px-3 py-2 text-sm resize-none"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-ink/40 mb-1">GitHub URL</label>
                  <input
                    placeholder="https://github.com/username/repo"
                    value={project.githubUrl}
                    onChange={(e) => updateProject(i, "githubUrl", e.target.value)}
                    className="focus-ring w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
                  />
                  {project.githubUrl && !normalizeUrl(project.githubUrl)?.startsWith("https://github.com") && (
                    <p className="text-[11px] text-amber-600 mt-0.5 pl-1">⚠ Tip: GitHub URLs usually start with https://github.com/</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink/40 mb-1">Live demo URL</label>
                  <input
                    placeholder="https://myproject.vercel.app"
                    value={project.liveUrl}
                    onChange={(e) => updateProject(i, "liveUrl", e.target.value)}
                    className="focus-ring w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
                  />
                  {project.liveUrl && (
                    <p className="text-[11px] text-ink/40 mt-0.5 pl-1">
                      Opens: {normalizeUrl(project.liveUrl) || "—"}
                      {project.liveUrl && (
                        <a
                          href={normalizeUrl(project.liveUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-1.5 text-signal hover:underline inline-flex items-center gap-0.5"
                        >
                          test <ExternalLink size={10} />
                        </a>
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}

          <SaveBar label="Save projects" />
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB 5 — Education
      ══════════════════════════════════════════════════════════ */}
      {tab === 5 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl">
          <RepeatableFieldEditor
            items={portfolio.education || []}
            onChange={(items) => updateSection("education", items)}
            addLabel="Add education"
            emptyItem={() => ({ institution: "", degree: "", duration: "", score: "" })}
            fields={[
              { key: "institution", label: "Institution",       type: "text" },
              { key: "degree",      label: "Degree / program",  type: "text" },
              { key: "duration",    label: "Duration",          type: "text" },
              { key: "score",       label: "Score / GPA",       type: "text" },
            ]}
          />
          <SaveBar label="Save education" />
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB 6 — Certifications
      ══════════════════════════════════════════════════════════ */}
      {tab === 6 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl">
          <RepeatableFieldEditor
            items={portfolio.certifications || []}
            onChange={(items) => updateSection("certifications", items)}
            addLabel="Add certification"
            emptyItem={() => ({ title: "", issuer: "", year: "", description: "" })}
            fields={[
              { key: "title",       label: "Title",       type: "text"     },
              { key: "issuer",      label: "Issuer",      type: "text"     },
              { key: "year",        label: "Year",        type: "text"     },
              { key: "description", label: "Description", type: "textarea" },
            ]}
          />
          <SaveBar label="Save certifications" />
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB 7 — Achievements
      ══════════════════════════════════════════════════════════ */}
      {tab === 7 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl">
          <RepeatableFieldEditor
            items={portfolio.achievements || []}
            onChange={(items) => updateSection("achievements", items)}
            addLabel="Add achievement"
            emptyItem={() => ({ title: "", year: "", description: "" })}
            fields={[
              { key: "title",       label: "Title",       type: "text"     },
              { key: "year",        label: "Year",        type: "text"     },
              { key: "description", label: "Description", type: "textarea" },
            ]}
          />
          <SaveBar label="Save achievements" />
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB 8 — Messages
      ══════════════════════════════════════════════════════════ */}
      {tab === 8 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p className="text-sm text-ink/50 mb-6 inline-flex items-center gap-1.5">
            <Inbox size={15} /> Private to you — admins cannot read these messages.
          </p>
          {feedback.length === 0 && <p className="text-ink/40 text-sm">No messages yet.</p>}
          <div className="space-y-3">
            {feedback.map((f) => (
              <div key={f._id} className="rounded-xl border border-ink/10 bg-white/60 p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{f.visitorName} <span className="text-ink/40 font-normal text-xs">· {f.requestType}</span></p>
                    <p className="text-sm text-ink/60 mt-1">{f.message}</p>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-1 rounded-full shrink-0 ${
                    f.status === "pending"  ? "bg-spark/10 text-spark"     :
                    f.status === "approved" ? "bg-signal2/10 text-signal2" :
                    "bg-red-500/10 text-red-500"
                  }`}>
                    {f.status}
                  </span>
                </div>
                {f.status === "pending" && (
                  <div className="flex gap-3 mt-3">
                    <button onClick={() => decide(f._id, "approve")} className="text-xs font-medium text-signal2 hover:underline">Approve &amp; share contact</button>
                    <button onClick={() => decide(f._id, "reject")}  className="text-xs font-medium text-red-500 hover:underline">Decline</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB 9 — Preview & Share  (PDF download removed)
      ══════════════════════════════════════════════════════════ */}
      {tab === 9 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

          {!portfolioUrl ? (
            <div className="rounded-2xl border border-ink/10 bg-white/60 backdrop-blur p-10 text-center">
              <Globe size={40} className="mx-auto mb-4 text-ink/25" />
              <h2 className="font-display text-xl mb-2">Not published yet</h2>
              <p className="text-sm text-ink/50 mb-6 max-w-sm mx-auto">
                Fill in your profile and click <strong>Publish</strong>. An admin reviews before it goes public.
              </p>
              <button
                onClick={publish}
                disabled={publishing}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-signal text-white font-medium hover:bg-signal2 transition-colors disabled:opacity-60"
              >
                <Rocket size={16} /> {publishing ? "Submitting…" : "Publish my portfolio"}
              </button>
            </div>
          ) : (
            <>
              {/* Share link card */}
              <div className="mb-6 rounded-2xl border border-ink/10 bg-white/70 backdrop-blur p-6">
                <h2 className="font-display text-xl mb-1">Your portfolio link</h2>
                <p className="text-sm text-ink/50 mb-5">Share this link anywhere — anyone can view your portfolio.</p>

                {/* Link display + copy + open */}
                <div className="flex flex-wrap items-center gap-3 mb-5">
                  <div className="flex-1 min-w-0 flex items-center gap-2 rounded-xl border border-ink/15 bg-ink/5 px-4 py-3">
                    <Globe size={14} className="text-ink/40 shrink-0" />
                    <span className="text-sm font-mono truncate text-ink/80">{portfolioUrl}</span>
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-ink/15 text-sm font-medium hover:border-signal hover:text-signal transition-colors whitespace-nowrap"
                  >
                    {copied ? <><Check size={14} className="text-signal2" /> Copied!</> : <><Copy size={14} /> Copy link</>}
                  </button>
                  <a
                    href={portfolioUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-signal text-white text-sm font-medium hover:bg-signal2 transition-colors whitespace-nowrap"
                  >
                    <ExternalLink size={14} /> Open portfolio
                  </a>
                </div>

                {/* Social share buttons */}
                <p className="text-xs text-ink/40 font-medium mb-2 uppercase tracking-wide">Share on</p>
                <div className="flex flex-wrap gap-2">
                  <a href={`https://wa.me/?text=${encodeURIComponent("Check out my portfolio: " + portfolioUrl)}`}
                     target="_blank" rel="noreferrer"
                     className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-green-500/10 text-green-700 hover:bg-green-500/20 transition-colors">
                    📱 WhatsApp
                  </a>
                  <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(portfolioUrl)}`}
                     target="_blank" rel="noreferrer"
                     className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 transition-colors">
                    💼 LinkedIn
                  </a>
                  <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent("Check out my portfolio: " + portfolioUrl)}`}
                     target="_blank" rel="noreferrer"
                     className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-sky-500/10 text-sky-700 hover:bg-sky-500/20 transition-colors">
                    🐦 Twitter / X
                  </a>
                  <a href={`mailto:?subject=My Portfolio&body=${encodeURIComponent("Hi, here is my portfolio: " + portfolioUrl)}`}
                     className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-ink/5 text-ink/70 hover:bg-ink/10 transition-colors">
                    ✉️ Email
                  </a>
                </div>
              </div>

              {/* Live iframe preview — browser-frame style */}
              <div className="rounded-2xl border border-ink/10 overflow-hidden shadow-xl">
                <div className="bg-ink/5 border-b border-ink/10 px-4 py-3 flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-400" />
                    <span className="w-3 h-3 rounded-full bg-yellow-400" />
                    <span className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <span className="text-xs font-mono text-ink/40 truncate">{portfolioUrl}</span>
                  <a href={portfolioUrl} target="_blank" rel="noreferrer" className="ml-auto text-ink/30 hover:text-signal transition-colors" title="Open in new tab">
                    <ExternalLink size={13} />
                  </a>
                </div>
                <iframe
                  src={portfolioUrl}
                  title="Portfolio preview"
                  className="w-full"
                  style={{ height: "78vh", border: "none" }}
                />
              </div>
            </>
          )}
        </motion.div>
      )}

    </div>
  );
}
