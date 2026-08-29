import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function AdminLogin() {
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await loginAdmin(form.email, form.password);
      navigate("/admin");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-24">
      <h1 className="font-display text-3xl mb-2">Admin Dashboard</h1>
      <p className="text-sm text-ink/50 mb-8">Content & account management only — no personal portfolio here.</p>
      <form onSubmit={submit} className="space-y-4">
        <input
          required
          type="email"
          placeholder="Admin email"
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
          Sign in
        </button>
      </form>
    </div>
  );
}
