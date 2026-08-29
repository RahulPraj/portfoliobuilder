import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios.js";

export default function ArticleDetail() {
  const { slug } = useParams();
  const [a, setA] = useState(null);

  useEffect(() => {
    api.get(`/articles/${slug}`).then(({ data }) => setA(data));
  }, [slug]);

  if (!a) return <p className="max-w-3xl mx-auto px-6 py-24 text-ink/40">Loading…</p>;

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <span className="text-xs font-mono uppercase tracking-widest text-signal">{a.category}</span>
      <h1 className="font-display text-4xl mt-2 mb-6">{a.title}</h1>
      <p className="text-ink/70 mb-10">{a.content}</p>

      {a.isRoadmap && (
        <div className="space-y-6 border-l-2 border-ink/10 pl-6">
          {a.roadmapSteps.map((s, i) => (
            <div key={i} className="relative">
              <span className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-signal" />
              <p className="font-medium">{i + 1}. {s.title}</p>
              <p className="text-sm text-ink/60">{s.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
