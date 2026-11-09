// app/windows/QuestionsContent.tsx
// Fenêtre « Question » : foire aux questions avec recherche
"use client";

import { useState } from "react";
import { ChatClub } from "./ChatClub";

// Liste des questions, regroupées par catégorie
const categories = [
  {
    titre: "Le club",
    questions: [
      {
        question: "Comment devenir membre du club ?",
        reponse: "Présentez-vous à une rencontre du club ou écrivez à un responsable ci-dessous",
      },
      {
        question: "Où se trouve le local du club ?",
        reponse: "Au deuxème étage de l'UQAC, au P2-2100",
      },
      {
        question: "Faut-il connaître la robotique pour participer ?",
        reponse: "Non. Le club offre des formations où les débutants apprennent à construire leur premier robot",
      },
    ],
  },
  {
    titre: "La compétition",
    questions: [
      {
        question: "Qu'est-ce qu'un combat de style sumo ?",
        reponse: "Deux robots s'affrontent dans une arène avec le but de pousser l'adversaire hors du cercle, sans chercher à le détruire.",
      },
      {
        question: "Comment inscrire mon équipe ?",
        reponse: "Ouvrez la fenêtre « Inscriptions » et remplissez le formulaire Pilote.",
      },
      {
        question: "Quand sera le prochain combat de robots ?",
        reponse: "La prochaine compétition OCTOBOTS aura lieu le 2 avril 2027",
      },
      
    ],
  },
];

export function QuestionsContent() {
  // Texte tapé dans le champ de recherche
  const [recherche, setRecherche] = useState("");

  // Texte cherché en minuscules, pour ignorer les majuscules
  const texte = recherche.trim().toLowerCase();

  // On garde seulement les questions qui contiennent le texte cherché
  const resultats = categories
    .map((categorie) => ({
      titre: categorie.titre,
      questions: categorie.questions.filter((q) =>
        (q.question + " " + q.reponse).toLowerCase().includes(texte),
      ),
    }))
    // On cache une catégorie si elle n'a plus aucune question
    .filter((categorie) => categorie.questions.length > 0);

  return (
    <div className="space-y-4 text-xs">
      {/* Champ de recherche */}
      <input
        type="search"
        aria-label="Chercher une question"
        placeholder="Chercher une question…"
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
        className="w-full rounded-md bg-[#020617] border border-[#1f2937] px-2 py-1 text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#CE9DE5]"
      />

      {/* Questions par catégorie */}
      {resultats.map((categorie) => (
        <section key={categorie.titre}>
          <h3 className="mb-2 uppercase tracking-widest text-[#CE9DE5]">{categorie.titre}</h3>

          {categorie.questions.map((q) => (
            <details key={q.question} className="mb-2 rounded-md border border-[#1f2937] p-2">
              <summary className="cursor-pointer">{q.question}</summary>
              <p className="mt-2 opacity-80">{q.reponse}</p>
            </details>
          ))}
        </section>
      ))}

      {/* Message si la recherche ne trouve rien */}
      {resultats.length === 0 && (
        <p className="opacity-60">Aucune question ne correspond à votre recherche.</p>
      )}
    {/* Si la FAQ ne suffit pas : discussion avec un membre du club */}
      <section className="pt-2 border-t border-[#1f2937]">
        <h3 className="mb-2 uppercase tracking-widest text-[#CE9DE5]">Une autre question ?</h3>
        <ChatClub />
      </section>
    </div>
  );
}