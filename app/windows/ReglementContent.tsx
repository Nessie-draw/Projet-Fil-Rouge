// app/windows/ReglementContent.tsx
"use client";

import dynamic from "next/dynamic";

// react-pdf (pdfjs) utilise des API navigateur (DOMMatrix…) indisponibles au SSR.
// On charge donc le viewer uniquement côté client.
const PdfViewer = dynamic(
  () => import("./PdfViewer").then((m) => m.PdfViewer),
  {
    ssr: false,
    loading: () => (
      <div className="p-4 text-sm text-gray-600">Chargement du PDF…</div>
    ),
  }
);

export function ReglementContent() {
  return (
    <PdfViewer url="/reglements.pdf" downloadName="Reglements-Octobots-2026.pdf" />
  );
}
