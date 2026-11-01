import type { NextConfig } from "next";

// Construit la liste d'en-têtes de sécurité.
function buildSecurityHeaders() {
  return [
    // Empêche le site d'être chargé dans une iframe (clickjacking)
    { key: "X-Frame-Options", value: "DENY" },
    // Empêche le navigateur de deviner le type MIME (MIME sniffing)
    { key: "X-Content-Type-Options", value: "nosniff" },
    // Limite les infos envoyées dans le header Referer
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    // Désactive la détection DNS prefetch
    { key: "X-DNS-Prefetch-Control", value: "off" },
    // Désactive l'accès caméra, micro, géolocalisation
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    // Force HTTPS pendant 1 an (activer seulement en prod avec HTTPS)
    ...(process.env.NODE_ENV === "production"
      ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
      : []),
    // Content Security Policy — adapté au stack Next.js + Tailwind
    {
      key: "Content-Security-Policy",
      value: [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js nécessite unsafe-inline/eval
        "style-src 'self' 'unsafe-inline'",                // Tailwind utilise des styles inline
        "img-src 'self' data: blob:",
        "font-src 'self'",
        "media-src 'self' data:",                           // Sons UI (data:audio/wav)
        "connect-src 'self'",                              // SSE, fetch API
        "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com", // YouTube embed
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join("; "),
    },
  ];
}

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: buildSecurityHeaders(),
      },
    ];
  },
};

export default nextConfig;
