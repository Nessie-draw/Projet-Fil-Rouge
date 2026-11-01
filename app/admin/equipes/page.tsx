"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Inscription = {
  id: string;
  email: string;
  prenom: string;
  nom: string;
  nomEquipe: string;
  nombrePilote: number;
  coequipier: string | null;
  nomRobot: string;
  etablissement: string;
  createdAt: string;
};

export default function AdminEquipesPage() {
  const [equipes, setEquipes] = useState<Inscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Formulaire d'ajout
  const [form, setForm] = useState({
    email: "",
    prenom: "",
    nom: "",
    nomEquipe: "",
    nombrePilote: "1",
    coequipier: "",
    nomRobot: "",
    etablissement: "",
  });

  async function loadEquipes() {
    try {
      setLoading(true);
      const res = await fetch("/api/inscriptions");
      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      if (!res.ok) throw new Error("Erreur serveur");
      const data = await res.json();
      setEquipes(data.inscriptions);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, nomRobot: string) {
    if (!confirm(`Supprimer l'équipe "${nomRobot}" ? Cette action est irréversible.`)) return;
    try {
      const res = await fetch("/api/inscriptions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Erreur suppression");
      setEquipes((prev) => prev.filter((e) => e.id !== id));
    } catch (e) {
      alert("Erreur : " + String(e));
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/inscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          nombrePilote: Number(form.nombrePilote),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur");
      }
      setForm({ email: "", prenom: "", nom: "", nomEquipe: "", nombrePilote: "1", coequipier: "", nomRobot: "", etablissement: "" });
      setShowForm(false);
      await loadEquipes();
    } catch (err) {
      alert("Erreur : " + String(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  useEffect(() => { void loadEquipes(); }, []);

  if (loading) return <div className="min-h-screen bg-[#020617] flex items-center justify-center text-slate-400 text-sm">Chargement…</div>;
  if (error) return <div className="min-h-screen bg-[#020617] flex items-center justify-center"><div className="p-4 bg-red-500/20 border border-red-500 text-red-300 text-xs rounded">{error}</div></div>;

  return (
    <div className="min-h-screen bg-[#020617] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-sm font-bold text-[#22c55e] uppercase tracking-widest">Admin · Équipes</h1>
          <p className="text-[10px] text-slate-500 mt-0.5">{equipes.length} équipe{equipes.length > 1 ? "s" : ""} inscrite{equipes.length > 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 text-xs bg-emerald-900/40 hover:bg-emerald-800/50 border border-emerald-800 text-emerald-400 rounded transition">
            {showForm ? "Annuler" : "+ Ajouter"}
          </button>
          <Link href="/admin/bracket" className="px-4 py-2 text-xs bg-[#1e293b] hover:bg-[#334155] text-slate-300 rounded transition">Bracket</Link>
          <Link href="/" className="px-4 py-2 text-xs bg-[#1e293b] hover:bg-[#334155] text-slate-300 rounded transition">← Site public</Link>
          <button onClick={handleLogout} className="px-4 py-2 text-xs bg-[#1e293b] hover:bg-[#334155] text-slate-400 hover:text-red-400 rounded transition">Déconnexion</button>
        </div>
      </div>

      {/* Formulaire d'ajout */}
      {showForm && (
        <form onSubmit={handleAdd} className="mb-6 p-4 bg-[#0a0f1a] border border-[#1e293b] rounded">
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-4">Nouvelle équipe</h2>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Prénom *" value={form.prenom} onChange={(v) => setForm({ ...form, prenom: v })} />
            <Input label="Nom *" value={form.nom} onChange={(v) => setForm({ ...form, nom: v })} />
            <Input label="Email *" value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" />
            <Input label="Nom d'équipe *" value={form.nomEquipe} onChange={(v) => setForm({ ...form, nomEquipe: v })} />
            <Input label="Nom du robot *" value={form.nomRobot} onChange={(v) => setForm({ ...form, nomRobot: v })} />
            <Input label="Coéquipier" value={form.coequipier} onChange={(v) => setForm({ ...form, coequipier: v })} />
            <Input label="Établissement" value={form.etablissement} onChange={(v) => setForm({ ...form, etablissement: v })} />
            <div>
              <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">Nb pilotes *</label>
              <select
                value={form.nombrePilote}
                onChange={(e) => setForm({ ...form, nombrePilote: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-[#020617] border border-[#1e293b] text-slate-200 rounded focus:border-emerald-600 outline-none"
              >
                <option value="1">1</option>
                <option value="2">2</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="mt-4 px-6 py-2 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded transition disabled:opacity-50"
          >
            {saving ? "Enregistrement…" : "Ajouter l'équipe"}
          </button>
        </form>
      )}

      {/* Tableau des équipes */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-[10px] text-slate-500 uppercase tracking-wider border-b border-[#1e293b]">
              <th className="pb-2 pr-4">Robot</th>
              <th className="pb-2 pr-4">Équipe</th>
              <th className="pb-2 pr-4">Pilote</th>
              <th className="pb-2 pr-4">Email</th>
              <th className="pb-2 pr-4">Coéquipier</th>
              <th className="pb-2 pr-4">Établissement</th>
              <th className="pb-2 pr-4">Pilotes</th>
              <th className="pb-2"></th>
            </tr>
          </thead>
          <tbody>
            {equipes.map((eq) => (
              <tr key={eq.id} className="border-b border-[#0f172a] hover:bg-[#0a0f1a] transition">
                <td className="py-3 pr-4 text-emerald-400 font-medium">{eq.nomRobot}</td>
                <td className="py-3 pr-4 text-slate-300">{eq.nomEquipe}</td>
                <td className="py-3 pr-4 text-slate-300">{eq.prenom} {eq.nom}</td>
                <td className="py-3 pr-4 text-slate-400">{eq.email}</td>
                <td className="py-3 pr-4 text-slate-400">{eq.coequipier || "—"}</td>
                <td className="py-3 pr-4 text-slate-400">{eq.etablissement || "—"}</td>
                <td className="py-3 pr-4 text-slate-400">{eq.nombrePilote}</td>
                <td className="py-3">
                  <button
                    onClick={() => handleDelete(eq.id, eq.nomRobot)}
                    className="px-3 py-1 text-[10px] bg-red-900/30 hover:bg-red-800/50 border border-red-900 text-red-400 rounded transition"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {equipes.length === 0 && (
        <p className="text-center text-slate-500 text-xs mt-8">Aucune équipe inscrite.</p>
      )}
    </div>
  );
}

function Input({ label, value, onChange, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-xs bg-[#020617] border border-[#1e293b] text-slate-200 rounded focus:border-emerald-600 outline-none"
        required={label.includes("*")}
      />
    </div>
  );
}
