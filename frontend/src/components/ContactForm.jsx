import { useState } from "react";
import { motion } from "framer-motion";
import api from "../api/axios.js";

export default function ContactForm({ slug }) {
  const [form, setForm] = useState({ visitorName: "", visitorEmail: "", message: "", requestType: "feedback" });
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error

  const submit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    try {
      await api.post(`/portfolio/public/${slug}/feedback`, form);
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-signal2 font-medium">
        Sent — it's now pending the owner's review.
      </motion.p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <input
          required
          placeholder="Your name"
          value={form.visitorName}
          onChange={(e) => setForm({ ...form, visitorName: e.target.value })}
          className="focus-ring rounded-lg border border-ink/15 bg-white/70 px-4 py-2.5 text-sm"
        />
        <input
          required
          type="email"
          placeholder="Your email"
          value={form.visitorEmail}
          onChange={(e) => setForm({ ...form, visitorEmail: e.target.value })}
          className="focus-ring rounded-lg border border-ink/15 bg-white/70 px-4 py-2.5 text-sm"
        />
      </div>
      <select
        value={form.requestType}
        onChange={(e) => setForm({ ...form, requestType: e.target.value })}
        className="focus-ring rounded-lg border border-ink/15 bg-white/70 px-4 py-2.5 text-sm"
      >
        <option value="feedback">General feedback</option>
        <option value="contact">Request contact details</option>
      </select>
      <textarea
        required
        rows={4}
        placeholder="Your message"
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
        className="focus-ring w-full rounded-lg border border-ink/15 bg-white/70 px-4 py-2.5 text-sm"
      />
      <button
        disabled={status === "sending"}
        className="px-6 py-2.5 rounded-full bg-ink text-paper text-sm font-medium hover:bg-signal transition-colors disabled:opacity-50"
      >
        {status === "sending" ? "Sending…" : "Send message"}
      </button>
      {status === "error" && <p className="text-sm text-red-500">Something went wrong — try again.</p>}
    </form>
  );
}
