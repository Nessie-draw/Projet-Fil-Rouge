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
};

export function PdfViewer({ url }: PdfViewerProps) {
  const [numPages, setNumPages] = useState(0);

  return (
    <div className="relative h-full bg-white text-black">
      {/* Zone de lecture.*/}
      <div
        className="h-full overflow-y-scroll [&_.react-pdf__Page]:w-full! [&_canvas]:w-full! [&_canvas]:h-auto!"
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

    </div>
  );
}
