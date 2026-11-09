// app/windows/ChatClub.tsx
// Chat avec le club : formulaire nom/courriel, puis discussion enregistrée dans la base
"use client";

import { useEffect, useRef, useState } from "react";

// Un message tel que renvoyé par la route /api/messages
type Message = {
  id: number;
  nom: string;
  texte: string;
  auteur: string; // "visiteur" ou "club"
  created_at: string;
};

// Transforme la date d'un message en heure au format « 14 h 05 »
function formaterHeure(date: string) {
  const d = new Date(date);
  return d.getHours() + " h " + String(d.getMinutes()).padStart(2, "0");
}

// Demande à la route API les messages de ce courriel
async function lireMessages(courriel: string): Promise<Message[]> {
  const reponse = await fetch(`/api/messages?courriel=${encodeURIComponent(courriel)}`);
  return reponse.ok ? reponse.json() : [];
}

// Notification sonore : un petit « bip » créé avec l'API Web Audio (pas besoin de fichier son)
function jouerSon() {
  try {
    const audio = new AudioContext();
    const oscillateur = audio.createOscillator();
    oscillateur.frequency.value = 880; // note aiguë
    oscillateur.connect(audio.destination);
    oscillateur.start();
    oscillateur.stop(audio.currentTime + 0.2); // le son dure 0,2 seconde
  } catch {
    // son impossible (navigateur trop ancien) : pas grave
  }
}

// Compte les réponses du club dans une liste de messages
function compterReponses(liste: Message[]) {
  return liste.filter((m) => m.auteur === "club").length;
}

// Clé utilisée pour garder le visiteur connecté dans le navigateur (localStorage)
const CLE_VISITEUR = "chat-visiteur";

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
  const [erreur, setErreur] = useState("");
  // Bandeau visible quand le club vient de répondre
  const [nouvelleReponse, setNouvelleReponse] = useState(false);
  // Nombre de réponses du club déjà vues (pour savoir s'il y en a une nouvelle)
  const reponsesVues = useRef(0);

  // Notification visuelle et sonore quand une nouvelle réponse du club arrive
  const notifier = () => {
    jouerSon();
    setNouvelleReponse(true);
    // Si l'onglet n'est pas regardé, on change son titre pour attirer l'œil
    if (document.hidden) document.title = "💬 Nouvelle réponse du club";
  };

  // Quand on revient sur l'onglet, on remet le titre normal
  useEffect(() => {
    const titreNormal = document.title;
    const auRetour = () => {
      if (!document.hidden) document.title = titreNormal;
    };
    document.addEventListener("visibilitychange", auRetour);
    return () => document.removeEventListener("visibilitychange", auRetour);
  }, []);

  // À l'ouverture : si le visiteur s'est déjà présenté, on le reconnecte directement
  useEffect(() => {
    try {
      const sauvegarde = localStorage.getItem(CLE_VISITEUR);
      if (!sauvegarde) return;
      const visiteur = JSON.parse(sauvegarde); // le texte redevient un objet { nom, courriel }
      // On charge son historique, puis on ouvre directement le chat
      lireMessages(visiteur.courriel).then((liste) => {
        setNom(visiteur.nom);
        setCourriel(visiteur.courriel);
        setMessages(liste);
        reponsesVues.current = compterReponses(liste);
        setEtape("chat");
      });
    } catch {
      // localStorage indisponible (navigation privée) : on garde le formulaire
    }
  }, []);

  // Pendant le chat : on recharge les messages toutes les 5 secondes,
  // pour voir les réponses du club presque en temps réel
  useEffect(() => {
    if (etape !== "chat") return;
    const intervalle = setInterval(async () => {
      const liste = await lireMessages(courriel);
      // Plus de réponses du club qu'avant ? C'est une nouvelle réponse : on notifie
      const reponses = compterReponses(liste);
      if (reponses > reponsesVues.current) notifier();
      reponsesVues.current = reponses;
      setMessages(liste);
    }, 5000);
    return () => clearInterval(intervalle); // on arrête quand la fenêtre se ferme
  }, [etape, courriel]);

  // Formulaire nom/courriel validé : on charge l'historique, puis on passe au chat
  const commencerChat = async (e: React.FormEvent) => {
    e.preventDefault(); // empêche la page de se recharger
    try {
      // On garde le nom et le courriel (en texte JSON) pour la prochaine visite
      localStorage.setItem(CLE_VISITEUR, JSON.stringify({ nom, courriel }));
    } catch {
      // Pas grave si ça échoue : le chat fonctionne quand même
    }
    const liste = await lireMessages(courriel);
    setMessages(liste);
    reponsesVues.current = compterReponses(liste);
    setEtape("chat");
  };

  // Envoi d'un message : on l'enregistre dans la base avec la route API
  const envoyerMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (texte.trim() === "") return; // on ignore les messages vides
    setErreur("");

    const reponse = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom, courriel, texte }),
    });
    const resultat = await reponse.json();

    if (!reponse.ok) {
      setErreur(resultat.error || "Le message n'a pas pu être envoyé.");
      return;
    }

    // Le message enregistré (avec son heure) est ajouté à la fin de la liste
    setMessages([...messages, resultat]);
    setTexte("");
  };

  // Déconnexion : on oublie le visiteur et on revient au formulaire
  const seDeconnecter = () => {
    try {
      localStorage.removeItem(CLE_VISITEUR);
    } catch {
      // rien à faire
    }
    setNom("");
    setCourriel("");
    setMessages([]);
    reponsesVues.current = 0;
    setNouvelleReponse(false);
    setEtape("formulaire");
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
      {/* Qui est connecté, avec un bouton pour se déconnecter */}
      <div className="flex items-center justify-between">
        <p className="opacity-60">Connecté : {nom}</p>
        <button type="button" onClick={seDeconnecter} className="underline opacity-80 hover:opacity-100">
          Se déconnecter
        </button>
      </div>

      <ol className="space-y-2 max-h-48 overflow-y-auto">
        {/* Message de bienvenue (affiché seulement, pas enregistré) */}
        <li className="flex">
          <div className="max-w-[75%] rounded-lg px-3 py-2 bg-[#1f2937]">
            <p>Bonjour {nom} ! Écrivez votre question : un membre du club vous répondra ici ou à {courriel}.</p>
          </div>
        </li>

        {/* Messages enregistrés : les nôtres à droite, ceux du club à gauche */}
        {messages.map((m) => (
          <li key={m.id} className={m.auteur === "visiteur" ? "flex justify-end" : "flex"}>
            <div className={`max-w-[75%] rounded-lg px-3 py-2 ${m.auteur === "visiteur" ? "bg-[#1d4ed8]" : "bg-[#1f2937]"}`}>
              <p>{m.texte}</p>
              <time className="block text-[10px] opacity-60">{formaterHeure(m.created_at)}</time>
            </div>
          </li>
        ))}
      </ol>

      {/* Notification visuelle : bandeau quand le club a répondu (clic pour le fermer) */}
      {nouvelleReponse && (
        <button
          type="button"
          onClick={() => setNouvelleReponse(false)}
          className="w-full rounded-md bg-[#CE9DE5] px-2 py-1 text-left font-semibold text-[#020617]"
        >
          💬 Le club vous a répondu ! (cliquer pour fermer)
        </button>
      )}

      {/* Message d'erreur si l'envoi échoue */}
      {erreur && <p className="text-red-400">{erreur}</p>}

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
        <button type="submit" className="shrink-0 px-3 rounded-lg bg-[#CE9DE5] text-[11px] font-semibold text-[#020617] hover:bg-[#B984D4] transition">
          Envoyer
        </button>
      </form>
    </div>
  );
}