export default function Footer() {
  return (
    <footer className="border-t border-ink/10 mt-24">
      <div className="max-w-6xl mx-auto px-6 py-10 text-sm text-ink/50 flex flex-col md:flex-row justify-between gap-4">
        <p>© {new Date().getFullYear()} Portfolio Builder — built with the MERN stack.</p>
        <p className="font-mono text-xs">privacy-first · admin never sees your private messages</p>
      </div>
    </footer>
  );
}
