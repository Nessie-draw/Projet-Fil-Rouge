// app/admin/messages/page.tsx
// Espace admin : lire les conversations des visiteurs et leur répondre
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Message = {
  id: number;
  nom: string;
  courriel: string;
  texte: string;
  auteur: string; // "visiteur" ou "club"
  created_at: string;
};

// Heure au format « 14 h 05 »
function formaterHeure(date: string) {
  const d = new Date(date);
  return d.getHours() + " h " + String(d.getMinutes()).padStart(2, "0");
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [courrielChoisi, setCourrielChoisi] = useState("");
  const [reponse, setReponse] = useState("");

  // Charge tous les messages ; si on n'est pas connecté, retour à la page de connexion
  async function chargerMessages() {
    const res = await fetch("/api/messages/club");
    if (res.status === 401) {
      window.location.href = "/admin/login";
      return;
    }
    if (res.ok) setMessages(await res.json());
  }

  // Au chargement, puis toutes les 5 secondes pour voir les nouveaux messages
  useEffect(() => {
    void chargerMessages();
    const intervalle = setInterval(chargerMessages, 5000);
    return () => clearInterval(intervalle);
  }, []);

  // Une conversation par courriel de visiteur (avec le nom du visiteur)
  const conversations = new Map<string, string>();
  messages.forEach((m) => {
    if (m.auteur === "visiteur") conversations.set(m.courriel, m.nom);
  });

  // Messages de la conversation ouverte
  const fil = messages.filter((m) => m.courriel === courrielChoisi);

  // Envoi de la réponse du club
  async function envoyerReponse(e: React.FormEvent) {
    e.preventDefault();
    if (reponse.trim() === "") return;

    const res = await fetch("/api/messages/club", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nom: "CRUQAC",
        courriel: courrielChoisi,
        texte: reponse,
      }),
    });
    if (res.ok) {
      setReponse("");
      void chargerMessages();
    }
  }

  return (
    <div className="min-h-screen bg-[#020617] p-6 text-xs text-slate-300">
      {/* En-tête, dans le même style que les autres pages admin */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-sm font-bold text-[#22c55e] uppercase tracking-widest">Admin · Messages</h1>
        <div className="flex gap-3">
          <Link href="/admin/equipes" className="px-4 py-2 bg-[#1e293b] hover:bg-[#334155] rounded transition">Équipes</Link>
          <Link href="/" className="px-4 py-2 bg-[#1e293b] hover:bg-[#334155] rounded transition">← Site public</Link>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Liste des visiteurs qui ont écrit */}
        <ul className="w-64 shrink-0 space-y-1">
          {[...conversations].map(([courriel, nom]) => (
            <li key={courriel}>
              <button
                onClick={() => setCourrielChoisi(courriel)}
                className={`w-full text-left px-3 py-2 rounded ${courriel === courrielChoisi ? "bg-[#1e293b] text-[#22c55e]" : "hover:bg-[#0a0f1a]"}`}
              >
                <strong className="block">{nom}</strong>
                <span className="opacity-60">{courriel}</span>
              </button>
            </li>
          ))}
          {conversations.size === 0 && <p className="opacity-60">Aucun message pour l&apos;instant.</p>}
        </ul>

        {/* Conversation ouverte */}
        <div className="flex-1 border border-[#1e293b] rounded p-4">
          {courrielChoisi === "" ? (
            <p className="opacity-60">Choisissez une conversation à gauche.</p>
          ) : (
            <>
              <ol className="space-y-2 mb-4 max-h-96 overflow-y-auto">
                {fil.map((m) => (
                  // Réponses du club à droite, messages du visiteur à gauche
                  <li key={m.id} className={m.auteur === "club" ? "flex justify-end" : "flex"}>
                    <div className={`max-w-[75%] rounded-lg px-3 py-2 ${m.auteur === "club" ? "bg-[#166534]" : "bg-[#1f2937]"}`}>
                      <p>{m.texte}</p>
                      <time className="block text-[10px] opacity-60">{formaterHeure(m.created_at)}</time>
                    </div>
                  </li>
                ))}
              </ol>

              {/* Champ de réponse */}
              <form onSubmit={envoyerReponse} className="flex gap-2">
                <input
                  type="text"
                  aria-label="Votre réponse"
                  placeholder="Répondre…"
                  value={reponse}
                  onChange={(e) => setReponse(e.target.value)}
                  className="min-w-0 flex-1 rounded bg-[#020617] border border-[#1e293b] px-3 py-2 outline-none focus:border-emerald-600"
                />
                <button type="submit" className="shrink-0 px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white">
                  Répondre
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}