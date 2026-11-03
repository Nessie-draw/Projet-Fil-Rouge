// app/api/messages/route.ts
// Route API du chat : enregistrer (POST) et lire (GET) les messages d'un visiteur
import { NextRequest, NextResponse } from "next/server";
import sql from "../../lib/db";
import { rateLimit } from "../../lib/rateLimit";

// Vérifie qu'un courriel a une forme valide (texte@texte.xx)
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// GET /api/messages?courriel=... : messages d'un visiteur, du plus ancien au plus récent
export async function GET(request: NextRequest) {
  const courriel = request.nextUrl.searchParams.get("courriel")?.trim().toLowerCase() ?? "";
  if (!emailRegex.test(courriel)) {
    return NextResponse.json({ error: "Adresse courriel invalide" }, { status: 400 });
  }

  const messages = await sql`
    SELECT id, nom, texte, auteur, created_at
    FROM messages
    WHERE courriel = ${courriel}
    ORDER BY created_at ASC
  `;
  return NextResponse.json(messages);
}

// POST /api/messages : enregistre un nouveau message envoyé par un visiteur
export async function POST(request: NextRequest) {
  // Anti-spam : 30 messages maximum par adresse IP toutes les 15 minutes
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { ok } = rateLimit(`message:${ip}`, 30);
  if (!ok) {
    return NextResponse.json({ error: "Trop de messages, réessayez plus tard." }, { status: 429 });
  }

  try {
    const body = await request.json();

    // Nettoyage et limite de longueur des champs
    const nom = String(body.nom ?? "").trim().slice(0, 100);
    const courriel = String(body.courriel ?? "").trim().toLowerCase().slice(0, 255);
    const texte = String(body.texte ?? "").trim().slice(0, 2000);

    if (!nom || !texte || !emailRegex.test(courriel)) {
      return NextResponse.json({ error: "Nom, courriel et message obligatoires" }, { status: 400 });
    }

    // Enregistrement dans la base (l'heure created_at est ajoutée automatiquement)
    const [message] = await sql`
      INSERT INTO messages (nom, courriel, texte)
      VALUES (${nom}, ${courriel}, ${texte})
      RETURNING id, nom, texte, auteur, created_at
    `;
    return NextResponse.json(message, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur lors de l'envoi du message" }, { status: 500 });
  }
}