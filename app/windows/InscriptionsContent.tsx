"use client";

import React, { useState } from "react";

export function InscriptionsContent() {
  const [form, setForm] = useState({
    email: "",
    prenom: "",
    nom: "",
    nomEquipe: "",
    nombrePilote: "", 
    coequipier: "",
    nomRobot: "",
    etablissement: "",
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/inscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const contentType = response.headers.get("content-type") || "";
      const raw = await response.text();
      const data =
        contentType.includes("application/json") && raw
          ? JSON.parse(raw)
          : { error: raw };

      if (!response.ok) {
        throw new Error(data?.error || "Erreur lors de l'inscription");
      }

      setShowSuccess(true);
      setForm({
        email: "",
        prenom: "",
        nom: "",
        nomEquipe: "",
        nombrePilote: "",
        coequipier: "",
        nomRobot: "",
        etablissement: "",
      });

      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {showSuccess && (
        <div className="mb-4 p-3 rounded-md bg-green-500/20 border border-green-500 text-green-200 text-xs">
          Inscription réussie !
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3 text-xs">
        {/* E-mail */}
        <div>
          <label className="block mb-1 opacity-80" htmlFor="email">
            E-mail *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            className="w-full rounded-md bg-[#020617] border border-[#1f2937] px-2 py-1 text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#22c55e]"
            required
          />
        </div>

        {/* Prénom et Nom */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block mb-1 opacity-80" htmlFor="prenom">
              Votre Prénom *
            </label>
            <input
              id="prenom"
              name="prenom"
              type="text"
              value={form.prenom}
              onChange={handleChange}
              className="w-full rounded-md bg-[#020617] border border-[#1f2937] px-2 py-1 text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#22c55e]"
              required
            />
          </div>

          <div className="flex-1">
            <label className="block mb-1 opacity-80" htmlFor="nom">
              Votre Nom *
            </label>
            <input
              id="nom"
              name="nom"
              type="text"
              value={form.nom}
              onChange={handleChange}
              className="w-full rounded-md bg-[#020617] border border-[#1f2937] px-2 py-1 text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#22c55e]"
              required
            />
          </div>
        </div>

        {/* Nom de votre Équipe */}
        <div>
          <label className="block mb-1 opacity-80" htmlFor="nomEquipe">
            Nom de votre Équipe *
          </label>
          <input
            id="nomEquipe"
            name="nomEquipe"
            type="text"
            value={form.nomEquipe}
            onChange={handleChange}
            className="w-full rounded-md bg-[#020617] border border-[#1f2937] px-2 py-1 text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#22c55e]"
            required
          />
        </div>

        {/* Nombre de pilote */}
        <div>
          <label className="block mb-1.5 opacity-80">Nombre de pilote *</label>
          <p className="text-[10px] text-slate-400 mb-2">
            Votre coéquipier doit s&apos;inscrire séparément.
          </p>

          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="nombrePilote"
                value="1"
                checked={form.nombrePilote === "1"}
                onChange={handleChange}
                className="accent-[#22c55e]"
                required
              />
              <span className="text-slate-200">Équipe de 1</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="nombrePilote"
                value="2"
                checked={form.nombrePilote === "2"}
                onChange={handleChange}
                className="accent-[#22c55e]"
              />
              <span className="text-slate-200">Équipe de 2</span>
            </label>
          </div>
        </div>

        {/* Nom de votre coéquipier (conditionnel) */}
        {form.nombrePilote === "2" && (
          <div>
            <label className="block mb-1 opacity-80" htmlFor="coequipier">
              Nom de votre coéquipier
            </label>
            <p className="text-[10px] text-slate-400 mb-1">
              Ne s&apos;applique qu&apos;aux équipes de 2
            </p>
            <input
              id="coequipier"
              name="coequipier"
              type="text"
              value={form.coequipier}
              onChange={handleChange}
              className="w-full rounded-md bg-[#020617] border border-[#1f2937] px-2 py-1 text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#22c55e]"
            />
          </div>
        )}

        {/* Nom de votre Robot */}
        <div>
          <label className="block mb-1 opacity-80" htmlFor="nomRobot">
            Nom de votre Robot *
          </label>
          <input
            id="nomRobot"
            name="nomRobot"
            type="text"
            value={form.nomRobot}
            onChange={handleChange}
            className="w-full rounded-md bg-[#020617] border border-[#1f2937] px-2 py-1 text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#22c55e]"
            required
          />
        </div>

        {/* Établissement */}
        <div>
          <label className="block mb-1 opacity-80" htmlFor="etablissement">
            Établissement d&apos;études ou Organisation
          </label>
          <input
            id="etablissement"
            name="etablissement"
            type="text"
            value={form.etablissement}
            onChange={handleChange}
            className="w-full rounded-md bg-[#020617] border border-[#1f2937] px-2 py-1 text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#22c55e]"
          />
        </div>

        {/* Bouton */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-[#22c55e] text-[11px] font-semibold text-[#020617] hover:bg-[#16a34a] transition disabled:opacity-60"
          >
            {isLoading ? "Envoi..." : "Envoyer l'inscription"}
          </button>
        </div>
      </form>
    </>
  );
}
