import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Octobots – CRUQAC",
  description: "Plateforme officielle de la compétition robotique Octobots organisée par le club de robotique de l'UQAC.",
  openGraph: {
    title: "Octobots – CRUQAC",
    description: "Compétition de robotique organisée par le club de robotique de l'UQAC.",
    siteName: "Octobots",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        {children}
      </body>
    </html>
  );
}
