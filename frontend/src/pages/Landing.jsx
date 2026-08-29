import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import api from "../api/axios.js";

export default function Landing() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchPortfolios = async (query = "") => {
    setLoading(true);
    try {
      const { data } = await api.get("/portfolio/public", { params: { q: query } });
      setItems(data.items);
    } catch {
      setItems([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPortfolios();
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-mono text-xs uppercase tracking-[0.3em] text-signal mb-4"
        >
          for students & early-career builders
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="font-display text-5xl md:text-6xl leading-[1.05] max-w-3xl"
        >
          Turn your resume into a portfolio people actually remember.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-ink/60 max-w-xl mt-6 text-lg"
        >
          Upload your resume, review the guided form, and publish in minutes.
          Every profile is reviewed by an admin before it goes live — so what's
          public is always real.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex gap-4 mt-8"
        >
          <Link
            to="/register"
            className="px-6 py-3 rounded-full bg-ink text-paper font-medium hover:bg-signal transition-colors"
          >
            Build my portfolio →
          </Link>
          <Link
            to="/articles"
            className="px-6 py-3 rounded-full border border-ink/20 font-medium hover:border-signal hover:text-signal transition-colors"
          >
            Browse roadmaps
          </Link>
        </motion.div>
      </section>

      {/* Search */}
      <section className="max-w-6xl mx-auto px-6 mb-10">
        <div className="relative max-w-md">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              fetchPortfolios(e.target.value);
            }}
            placeholder="Search by name, skill, or tech…"
            className="focus-ring w-full pl-11 pr-4 py-3 rounded-full border border-ink/15 bg-white/70 text-sm"
          />
        </div>
      </section>

      {/* Grid */}
      <section className="max-w-6xl mx-auto px-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-24">
        {loading && <p className="text-ink/50 col-span-full">Loading portfolios…</p>}
        {!loading && items.length === 0 && (
          <p className="text-ink/50 col-span-full">
            No published portfolios yet — be the first to publish one.
          </p>
        )}
        {items.map((p, i) => (
          <motion.div
            key={p._id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            whileHover={{ y: -6 }}
          >
            <Link
              to={`/p/${p.slug}`}
              className="block rounded-2xl border border-ink/10 bg-white/70 p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={p.avatarUrl ? (p.avatarUrl.startsWith("http") ? p.avatarUrl : p.avatarUrl) : "/uploads/rahul-avatar.jpg"}
                  alt={p.fullName}
                  className="w-14 h-14 rounded-full object-cover ring-2 ring-white shadow"
                />
                <div>
                  <h3 className="font-display text-lg leading-tight">{p.fullName}</h3>
                  <p className="text-xs text-ink/50">{p.headline}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {p.tags?.slice(0, 4).map((t) => (
                  <span key={t} className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-ink/5 text-ink/60">
                    {t}
                  </span>
                ))}
              </div>
            </Link>
          </motion.div>
        ))}
      </section>
    </div>
  );
}
