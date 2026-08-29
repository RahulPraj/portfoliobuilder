import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Map, FileText } from "lucide-react";
import api from "../api/axios.js";

export default function Articles() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.get("/articles").then(({ data }) => setItems(data.items));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <h1 className="font-display text-4xl mb-2">Articles & Roadmaps</h1>
      <p className="text-ink/50 mb-10">Curated by the admin team — structured paths and deep dives.</p>
      <div className="grid sm:grid-cols-2 gap-6">
        {items.map((a, i) => (
          <motion.div key={a._id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
            <Link to={`/articles/${a.slug}`} className="block rounded-2xl border border-ink/10 bg-white/70 p-6 hover:shadow-xl transition-shadow h-full">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-signal mb-3">
                {a.isRoadmap ? <Map size={12} /> : <FileText size={12} />} {a.category}
              </span>
              <h3 className="font-display text-xl mb-2">{a.title}</h3>
              <p className="text-sm text-ink/60">{a.summary}</p>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
