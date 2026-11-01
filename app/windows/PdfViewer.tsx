// app/windows/PdfViewer.tsx
"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

// Worker 
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

// Largeur de rendu fixe  ; 
const RENDER_WIDTH = 1200;

type PdfViewerProps = {
  url: string;
  downloadName: string;
};

export function PdfViewer({ url, downloadName }: PdfViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [atEnd, setAtEnd] = useState(false);

  // Détecte l'arrivée en bas (fin de la dernière page) pour afficher le bouton.
  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    setAtEnd(el.scrollTop + el.clientHeight >= el.scrollHeight - 40);
  }

  return (
    <div className="relative h-full bg-white text-black">
      {/* Zone de lecture.*/}
      <div
        onScroll={handleScroll}
        className="h-full overflow-y-scroll [&_.react-pdf__Page]:!w-full [&_canvas]:!w-full [&_canvas]:!h-auto"
      >
        <Document
          file={url}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          loading={<div className="p-4 text-sm text-gray-600">Chargement du PDF…</div>}
          error={<div className="p-4 text-sm text-red-600">Impossible de charger le PDF.</div>}
        >
          {Array.from({ length: numPages }, (_, i) => (
            <Page
              key={i}
              pageNumber={i + 1}
              width={RENDER_WIDTH}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          ))}
        </Document>
      </div>

      {/* Bouton de téléchargement  */}
      <a
        href={url}
        download={downloadName}
        className={`absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-opacity duration-300 hover:bg-black/75 ${
          atEnd ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        Télécharger
      </a>
    </div>
  );
}
