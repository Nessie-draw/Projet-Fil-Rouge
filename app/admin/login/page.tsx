"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const justSetup    = searchParams.get("setup") === "1";

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, password }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok) { setError(data.error ?? "Erreur serveur."); return; }
      router.push("/admin/bracket");
      router.refresh();
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-8">
      <div className="w-full max-w-sm bg-[#0a0f1a] border border-[#1e293b] rounded-xl p-8">
        <h1 className="text-lg font-bold text-[#22c55e] mb-1 uppercase tracking-widest">Administrateur</h1>
        <p className="text-slate-500 text-xs mb-6">Accès réservé à l&apos;organisateur</p>

        {justSetup && (
          <div className="mb-4 p-3 bg-green-500/15 border border-green-800 text-green-400 text-xs rounded-lg">
            Compte créé avec succès. Vous pouvez maintenant vous connecter.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@example.com"
              autoComplete="email"
              className="w-full bg-[#1e293b] border border-[#334155] text-slate-200 text-sm px-4 py-3 rounded-lg outline-none focus:border-[#22c55e]"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Mot de passe</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full bg-[#1e293b] border border-[#334155] text-slate-200 text-sm px-4 py-3 rounded-lg outline-none focus:border-[#22c55e]"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/15 border border-red-800 text-red-400 text-xs rounded-lg">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#22c55e] hover:bg-[#16a34a] disabled:bg-slate-700 disabled:text-slate-500 text-[#020617] font-bold text-sm rounded-lg transition"
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
