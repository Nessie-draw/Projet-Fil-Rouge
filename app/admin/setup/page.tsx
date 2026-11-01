"use client";
// Page de configuration initiale — crée le compte admin unique
// Bloquée automatiquement dès qu'un admin existe déjà en base
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SetupPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) { setError("Les mots de passe ne correspondent pas."); return; }
    if (password.length < 8)  { setError("Le mot de passe doit faire au moins 8 caractères."); return; }

    setLoading(true);
    try {
      const res  = await fetch("/api/auth/setup", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, password }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok) { setError(data.error ?? "Erreur serveur."); return; }
      router.push("/admin/login?setup=1");
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-8">
      <div className="w-full max-w-sm bg-[#0a0f1a] border border-[#1e293b] rounded-xl p-8">
        <h1 className="text-lg font-bold text-[#22c55e] mb-1 uppercase tracking-widest">Configuration initiale</h1>
        <p className="text-slate-500 text-xs mb-6">Créez le compte administrateur unique</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@example.com"
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
              placeholder="Min. 8 caractères"
              className="w-full bg-[#1e293b] border border-[#334155] text-slate-200 text-sm px-4 py-3 rounded-lg outline-none focus:border-[#22c55e]"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Confirmer le mot de passe</label>
            <input
              type="password"
              required
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Répétez le mot de passe"
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
            {loading ? "Création en cours…" : "Créer le compte administrateur"}
          </button>
        </form>

        <p className="text-[10px] text-slate-600 mt-6 text-center">
          Cette page est automatiquement désactivée après la création du compte.
        </p>
      </div>
    </div>
  );
}
