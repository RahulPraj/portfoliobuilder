import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await loginUser(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-24">
      <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="font-display text-3xl mb-8">
        Welcome back
      </motion.h1>
      <form onSubmit={submit} className="space-y-4">
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
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="focus-ring w-full rounded-lg border border-ink/15 bg-white/70 px-4 py-3 text-sm"
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button className="w-full py-3 rounded-full bg-ink text-paper font-medium hover:bg-signal transition-colors">
          Log in
        </button>
      </form>
      <p className="text-sm text-ink/50 mt-6">
        New here? <Link to="/register" className="text-signal">Create an account</Link>
      </p>
      <p className="text-xs text-ink/30 mt-2">
        Admin? <Link to="/admin/login" className="underline">Sign in to the dashboard</Link>
      </p>
    </div>
  );
}
