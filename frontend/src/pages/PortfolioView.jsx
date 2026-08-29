import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Github, Linkedin, Mail, MapPin, ShieldCheck, ArrowDown, Award, GraduationCap } from "lucide-react";
import api from "../api/axios.js";
import RotatingAvatar from "../components/RotatingAvatar.jsx";
import ProjectCard from "../components/ProjectCard.jsx";
import ContactForm from "../components/ContactForm.jsx";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const hasText = (v) => typeof v === "string" && v.trim().length > 0;

export default function PortfolioView() {
  const { slug } = useParams();
  const [p, setP] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/portfolio/public/${slug}`)
      .then(({ data }) => setP(data))
      .catch(() => setError("This portfolio isn't available."));
  }, [slug]);

  const trackClick = (type) => {
    api.post(`/portfolio/public/${slug}/click`, { type }).catch(() => {});
  };

  if (error) return <p className="max-w-3xl mx-auto px-6 py-24 text-center text-ink/60">{error}</p>;
  if (!p) return <p className="max-w-3xl mx-auto px-6 py-24 text-center text-ink/40">Loading…</p>;

  const avatarSrc = p.avatarUrl?.startsWith("http") ? p.avatarUrl : p.avatarUrl || "/uploads/rahul-avatar.jpg";

  // a portfolio only shows the sections it actually has content for
  const hasSkills = p.skills?.some((g) => g.items?.length);
  const hasProjects = p.projects?.length > 0;
  const hasExperience = p.experience?.length > 0;
  const hasEducation = p.education?.length > 0;
  const hasCertifications = p.certifications?.length > 0;
  const hasAchievements = p.achievements?.length > 0;
  const eduColColumns = [hasEducation, hasCertifications].filter(Boolean).length;

  return (
    <div>
      {/* dark hero */}
      <section className="relative overflow-hidden bg-ink text-paper min-h-[92vh] flex items-center">
        <div className="absolute inset-0 opacity-70" aria-hidden="true">
          <div className="absolute -top-1/3 -left-1/4 w-[60vw] h-[60vw] rounded-full bg-signal/30 blur-[100px]" />
          <div className="absolute -bottom-1/3 -right-1/4 w-[55vw] h-[55vw] rounded-full bg-signal2/25 blur-[100px]" />
          <div className="absolute top-1/3 right-1/4 w-[30vw] h-[30vw] rounded-full bg-spark/20 blur-[90px]" />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 py-20 grid md:grid-cols-[300px_1fr] gap-14 items-center w-full">
          <RotatingAvatar src={avatarSrc} name={p.fullName} size={280} dark showHint={true} />

          <div>
            {/* <motion.div initial="hidden" animate="show" variants={fadeUp} className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-widest text-signal2 bg-signal2/15 px-2.5 py-1 rounded-full backdrop-blur">
                <ShieldCheck size={12} /> admin-verified profile
              </span>
            </motion.div> */}
            <motion.h1
              initial="hidden"
              animate="show"
              variants={fadeUp}
              transition={{ delay: 0.05 }}
              className="font-display text-4xl md:text-6xl leading-[1.05]"
            >
              {p.fullName}
            </motion.h1>
            {hasText(p.headline) && (
              <motion.p
                initial="hidden"
                animate="show"
                variants={fadeUp}
                transition={{ delay: 0.1 }}
                className="text-signal2 font-medium mt-2 text-lg"
              >
                {p.headline}
              </motion.p>
            )}
            {hasText(p.introduction) && (
              <motion.p
                initial="hidden"
                animate="show"
                variants={fadeUp}
                transition={{ delay: 0.15 }}
                className="text-paper/70 mt-4 max-w-xl"
              >
                {p.introduction}
              </motion.p>
            )}

            <motion.div
              initial="hidden"
              animate="show"
              variants={fadeUp}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap items-center gap-4 mt-6 text-sm text-paper/70"
            >
              {p.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={15} /> {p.location}
                </span>
              )}
              {p.github && (
                <a
                  href={p.github}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => trackClick("github")}
                  className="inline-flex items-center gap-1.5 hover:text-signal2 transition-colors"
                >
                  <Github size={15} /> GitHub
                </a>
              )}
              {p.linkedin && (
                <a href={p.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-signal2 transition-colors">
                  <Linkedin size={15} /> LinkedIn
                </a>
              )}
            </motion.div>

            <motion.div
              initial="hidden"
              animate="show"
              variants={fadeUp}
              transition={{ delay: 0.28 }}
              className="flex flex-wrap gap-3 mt-8"
            >
              {hasProjects && (
                <a href="#projects" className="px-5 py-2.5 rounded-full bg-signal text-white text-sm font-medium hover:bg-signal2 transition-colors">
                  View projects
                </a>
              )}
              <a href="#contact" className="px-5 py-2.5 rounded-full border border-paper/25 text-paper text-sm font-medium hover:border-signal2 hover:text-signal2 transition-colors">
                Get in touch
              </a>
            </motion.div>
          </div>
        </div>

        <ArrowDown className="absolute bottom-8 left-1/2 -translate-x-1/2 text-paper/30 animate-bounce" size={22} aria-hidden="true" />
      </section>

      {/* light content, glass cards on the aurora background */}
      {hasSkills && (
        <section className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="font-display text-2xl mb-6">Skills</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {p.skills.filter((g) => g.items?.length).map((group, i) => (
              <motion.div
                key={group.category || i}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="rounded-xl border border-ink/10 bg-white/60 backdrop-blur p-4 shadow-sm hover:shadow-lg transition-shadow"
              >
                {group.category && (
                  <p className="font-mono text-[11px] uppercase tracking-widest text-ink/40 mb-2">
                    {group.category}
                  </p>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {group.items.map((s) => (
                    <span key={s} className="text-xs px-2 py-1 rounded-full bg-signal/10 text-signal">
                      {s}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {hasProjects && (
        <section id="projects" className="max-w-5xl mx-auto px-6 py-16 scroll-mt-8">
          <h2 className="font-display text-2xl mb-6">Projects</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {p.projects.map((project, i) => (
              <ProjectCard
                key={project.title || i}
                project={project}
                index={i}
                onLinkClick={trackClick}
              />
            ))}
          </div>
        </section>
      )}

      {hasExperience && (
        <section className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="font-display text-2xl mb-6">Experience</h2>
          <div className="space-y-8 border-l-2 border-ink/10 pl-6">
            {p.experience.map((e, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="relative"
              >
                <span className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-signal shadow-[0_0_12px_rgba(91,91,246,0.6)]" />
                {e.role && <p className="font-display text-lg">{e.role}</p>}
                {e.company && <p className="text-signal text-sm">{e.company}</p>}
                {(e.startDate || e.endDate) && (
                  <p className="font-mono text-xs text-ink/40 mb-2">
                    {e.startDate} — {e.endDate}
                  </p>
                )}
                <ul className="text-sm text-ink/70 space-y-1">
                  {e.bullets?.map((b, j) => (
                    <li key={j} className="flex gap-2">
                      <span className="text-signal">›</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {(hasEducation || hasCertifications) && (
        <section className={`max-w-5xl mx-auto px-6 py-16 grid gap-10 ${eduColColumns === 2 ? "md:grid-cols-2" : ""}`}>
          {hasEducation && (
            <div>
              <h2 className="font-display text-2xl mb-6 inline-flex items-center gap-2">
                <GraduationCap size={20} className="text-signal" /> Education
              </h2>
              <div className="space-y-4">
                {p.education.map((ed, i) => (
                  <div key={i} className="rounded-xl border border-ink/10 bg-white/60 backdrop-blur p-4 shadow-sm">
                    {ed.institution && <p className="font-medium">{ed.institution}</p>}
                    {ed.degree && <p className="text-sm text-ink/60">{ed.degree}</p>}
                    {(ed.duration || ed.score) && (
                      <p className="font-mono text-xs text-ink/40 mt-1">
                        {ed.duration} {ed.score && `· ${ed.score}`}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {hasCertifications && (
            <div>
              <h2 className="font-display text-2xl mb-6">Certifications</h2>
              <div className="space-y-4">
                {p.certifications.map((c, i) => (
                  <div key={i} className="rounded-xl border border-ink/10 bg-white/60 backdrop-blur p-4 shadow-sm">
                    {c.title && <p className="font-medium">{c.title}</p>}
                    {c.issuer && <p className="text-sm text-signal">{c.issuer}</p>}
                    {c.description && <p className="text-sm text-ink/60 mt-1">{c.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {hasAchievements && (
        <section className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="font-display text-2xl mb-6 inline-flex items-center gap-2">
            <Award size={20} className="text-spark" /> Achievements
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {p.achievements.map((a, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="rounded-xl border border-spark/20 bg-spark/5 backdrop-blur p-4"
              >
                {a.title && <p className="font-medium">{a.title}</p>}
                {a.year && <p className="font-mono text-xs text-ink/40">{a.year}</p>}
                {a.description && <p className="text-sm text-ink/60 mt-1">{a.description}</p>}
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* contact — private until the owner approves releasing it */}
      <section id="contact" className="max-w-3xl mx-auto px-6 py-24 scroll-mt-8">
        <h2 className="font-display text-2xl mb-2 flex items-center gap-2">
          <Mail size={20} className="text-signal" /> Get in touch
        </h2>
        <p className="text-sm text-ink/50 mb-6">
          Your message stays private to {p.fullName} until they approve releasing contact details to you.
        </p>
        <ContactForm slug={slug} />
      </section>
    </div>
  );
}
