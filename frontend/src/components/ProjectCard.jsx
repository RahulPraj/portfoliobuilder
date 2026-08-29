import { motion } from "framer-motion";
import { Github, ExternalLink, Sparkles } from "lucide-react";

// Normalize a URL — ensures it always has a protocol so the browser opens
// it as an external link instead of treating it as a relative path.
function normalizeUrl(url) {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  // Already has a protocol — return as-is
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  // Has a different protocol (ftp://, etc.) — return as-is
  if (/^[a-z][a-z0-9+\-.]*:\/\//i.test(trimmed)) return trimmed;
  // No protocol — prepend https://
  return `https://${trimmed}`;
}

// hover lift/tilt, staggered tech chips, sheen sweep on hover
export default function ProjectCard({ project, index = 0, onLinkClick }) {
  const githubHref = normalizeUrl(project.githubUrl);
  const liveHref   = normalizeUrl(project.liveUrl);

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
      whileHover={{ y: -8, rotate: index % 2 === 0 ? -0.6 : 0.6 }}
      className="group relative rounded-2xl border border-ink/10 bg-white/70 backdrop-blur p-6 overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300"
    >
      {project.featured && (
        <span className="absolute top-4 right-4 inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-spark">
          <Sparkles size={12} /> featured
        </span>
      )}

      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 card-sheen animate-shimmer pointer-events-none" />

      <h3 className="font-display text-2xl mb-2 relative">{project.title}</h3>
      <p className="text-ink/70 text-sm mb-4 relative">{project.description}</p>

      {project.bullets?.length > 0 && (
        <ul className="text-sm text-ink/70 space-y-1.5 mb-5 relative">
          {project.bullets.map((b, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-signal mt-1">›</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2 mb-5 relative">
        {project.techStack?.map((t, i) => (
          <motion.span
            key={t}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.08 + i * 0.04 }}
            className="text-xs font-mono px-2.5 py-1 rounded-full bg-ink/5 text-ink/70 group-hover:bg-signal/10 group-hover:text-signal transition-colors"
          >
            {t}
          </motion.span>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 relative">
        {githubHref && (
          <a
            href={githubHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.stopPropagation();
              onLinkClick?.("github");
            }}
            className="focus-ring inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full bg-ink text-paper hover:bg-signal transition-colors"
          >
            <Github size={15} /> Code
          </a>
        )}
        {liveHref && (
          <a
            href={liveHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.stopPropagation();
              onLinkClick?.("live");
            }}
            className="focus-ring inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full border border-signal2 text-signal2 hover:bg-signal2 hover:text-white transition-colors"
          >
            <ExternalLink size={15} /> Live demo
          </a>
        )}
      </div>
    </motion.article>
  );
}
