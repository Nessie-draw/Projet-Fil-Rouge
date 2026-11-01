// app/windows/CompetitionContent.tsx
"use client";
import Image from "next/image";
import { useState } from "react";

export function CompetitionContent({
  onOpenInscriptions,
  onOpenBracket,
}: {
  onOpenInscriptions: () => void;
  onOpenBracket: () => void;
}) {
  return (
    <>
      <p className="mt-1 text-justify font-stretch-condensed">
        cliquez sur le bouton suivant pour vous inscrire.
      </p>
      <button
        onClick={onOpenInscriptions}
        className="mt-4 inline-flex items-center px-4 py-2 rounded-lg bg-[#22c55e] text-xs font-semibold text-[#020617] hover:bg-[#16a34a] transition"
      >Inscription
      </button>
      <p className="mt-5 text-justify font-stretch-condensed">
        cliquez sur le bouton suivant pour voir le tableau de tournois.
      </p>
      <button
        onClick={onOpenBracket}
        className="mt-4 inline-flex items-center px-4 py-2 rounded-lg bg-[#22c55e] text-xs font-semibold text-[#020617] hover:bg-[#16a34a] transition"
      >Arbre du tournoi
      </button>
    </>
  );
}
