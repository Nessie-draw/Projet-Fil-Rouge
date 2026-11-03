// app/windows/ChatClub.tsx
// Chat avec le club : formulaire nom/courriel, puis discussion
"use client";

import { useState } from "react";

// Un message du chat
type Message = {
  auteur: string;
  texte: string;
  heure: string;
};

// Heure actuelle au format « 14 h 05 »
function heureActuelle() {
  const maintenant = new Date();
  const minutes = String(maintenant.getMinutes()).padStart(2, "0");
  return maintenant.getHours() + " h " + minutes;
}

// Style commun des champs de texte (le même que la fenêtre Inscriptions)
const styleChamp =
  "w-full rounded-md bg-[#020617] border border-[#1f2937] px-2 py-1 text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#22c55e]";

export function ChatClub() {
  // Étape affichée : d'abord le formulaire, ensuite le chat
  const [etape, setEtape] = useState<"formulaire" | "chat">("formulaire");
  const [nom, setNom] = useState("");
  const [courriel, setCourriel] = useState("");
  const [texte, setTexte] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  // Formulaire nom/courriel validé : on passe au chat avec un message de bienvenue
  const commencerChat = (e: React.FormEvent) => {
    e.preventDefault(); // empêche la page de se recharger
    setMessages([
      {
        auteur: "CRUQAC",
        texte: `Bonjour ${nom} ! Écrivez votre question : un membre du club vous répondra ici ou à ${courriel}.`,
        heure: heureActuelle(),
      },
    ]);
    setEtape("chat");
  };

  // Envoi d'un message dans le chat
  const envoyerMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (texte.trim() === "") return; // on ignore les messages vides

    // On ajoute le nouveau message à la fin de la liste
    // (plus tard : on l'enregistrera aussi dans la base de données avec fetch)
    setMessages([...messages, { auteur: nom, texte: texte.trim(), heure: heureActuelle() }]);
    setTexte("");
  };

  // Étape 1 : formulaire nom/courriel
  if (etape === "formulaire") {
    return (
      <form onSubmit={commencerChat} className="space-y-2">
        <p className="opacity-80">Écrivez directement à un membre du club.</p>

        <label htmlFor="chat-nom" className="block opacity-80">Votre nom *</label>
        <input id="chat-nom" type="text" required value={nom} onChange={(e) => setNom(e.target.value)} className={styleChamp} />

        <label htmlFor="chat-courriel" className="block opacity-80">Votre courriel *</label>
        <input id="chat-courriel" type="email" required value={courriel} onChange={(e) => setCourriel(e.target.value)} className={styleChamp} />

        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-[#22c55e] text-[11px] font-semibold text-[#020617] hover:bg-[#16a34a] transition"
        >
          Commencer la discussion
        </button>
      </form>
    );
  }

  // Étape 2 : le chat
  return (
    <div className="space-y-2">
      {/* Liste des messages : ceux du club à gauche, les nôtres à droite */}
      <ol className="space-y-2 max-h-48 overflow-y-auto">
        {messages.map((m, i) => (
          <li key={i} className={m.auteur === nom ? "flex justify-end" : "flex"}>
            <div className={`max-w-[75%] rounded-lg px-3 py-2 ${m.auteur === nom ? "bg-[#1d4ed8]" : "bg-[#1f2937]"}`}>
              <p>{m.texte}</p>
              <time className="block text-[10px] opacity-60">{m.heure}</time>
            </div>
          </li>
        ))}
      </ol>

      {/* Champ pour écrire un message (Entrée envoie le message) */}
      <form onSubmit={envoyerMessage} className="flex gap-2">
        <input
          type="text"
          aria-label="Votre message"
          placeholder="Votre message…"
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          className={`${styleChamp} min-w-0`}
        />
        <button type="submit" className="shrink-0 px-3 rounded-lg bg-[#22c55e] text-[11px] font-semibold text-[#020617]">
          Envoyer
        </button>
      </form>
    </div>
  );
}