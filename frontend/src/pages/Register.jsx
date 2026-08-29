import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
  const { registerUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await registerUser(form.name, form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-24">
      <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="font-display text-3xl mb-2">
        Build your portfolio
      </motion.h1>
      <p className="text-sm text-ink/50 mb-8">
        Create an account, then import your resume to pre-fill the builder.
      </p>
      <form onSubmit={submit} className="space-y-4">
        <input
          required
          placeholder="Full name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="focus-ring w-full rounded-lg border border-ink/15 bg-white/70 px-4 py-3 text-sm"
        />
        <input
          required
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="focus-ring w-full rounded-lg border border-ink/15 bg-white/70 px-4 py-3 text-sm"
        />
        <input
          required
          type="password"
          placeholder="Password (min. 8 characters)"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="focus-ring w-full rounded-lg border border-ink/15 bg-white/70 px-4 py-3 text-sm"
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button className="w-full py-3 rounded-full bg-ink text-paper font-medium hover:bg-signal transition-colors">
          Create account
        </button>
      </form>
      <p className="text-sm text-ink/50 mt-6">
        Already have an account? <Link to="/login" className="text-signal">Log in</Link>
      </p>
    </div>
  );
}
