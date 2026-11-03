// app/api/messages/club/route.ts
// Route API réservée aux membres du club (admin) : lire tous les messages et répondre
import { NextRequest, NextResponse } from "next/server";
import sql from "../../../lib/db";
import { verifyToken, COOKIE_NAME } from "../../../lib/auth";

// Vérifie que la personne est connectée à l'espace admin
async function estAdmin(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  return Boolean(token && (await verifyToken(token)));
}

// GET /api/messages/club : tous les messages, du plus ancien au plus récent
export async function GET(request: NextRequest) {
  if (!(await estAdmin(request))) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const messages = await sql`
    SELECT id, nom, courriel, texte, auteur, created_at
    FROM messages
    ORDER BY created_at ASC
  `;
  return NextResponse.json(messages);
}

// POST /api/messages/club : réponse du club à un visiteur
export async function POST(request: NextRequest) {
  if (!(await estAdmin(request))) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const nom = String(body.nom ?? "").trim().slice(0, 100);
    const courriel = String(body.courriel ?? "").trim().toLowerCase().slice(0, 255);
    const texte = String(body.texte ?? "").trim().slice(0, 2000);

    if (!nom || !courriel || !texte) {
      return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
    }

    // La réponse est rangée dans la même conversation (même courriel), avec auteur = 'club'
    const [message] = await sql`
      INSERT INTO messages (nom, courriel, texte, auteur)
      VALUES (${nom}, ${courriel}, ${texte}, 'club')
      RETURNING id, nom, courriel, texte, auteur, created_at
    `;
    return NextResponse.json(message, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur lors de l'envoi de la réponse" }, { status: 500 });
  }
}