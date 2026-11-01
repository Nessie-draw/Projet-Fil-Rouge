// POST /api/auth/setup — crée le compte admin initial
// Bloqué définitivement dès qu'un admin existe en base
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import sql from "../../../lib/db";

export async function POST(request: NextRequest) {
  try {
    // 1. Créer la table admins si elle n'existe pas
    await sql`
      CREATE TABLE IF NOT EXISTS admins (
        id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        email        TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at   TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    // 2. Vérifier qu'aucun admin n'existe déjà
    const existing = await sql`SELECT id FROM admins LIMIT 1`;
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Un compte administrateur existe déjà. Utilisez la page de connexion." },
        { status: 403 }
      );
    }

    // 3. Valider les champs
    const body = await request.json() as { email?: string; password?: string };
    const email    = (body.email    ?? "").trim().toLowerCase();
    const password = (body.password ?? "").trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json({ error: "Adresse email invalide." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Le mot de passe doit faire au moins 8 caractères." }, { status: 400 });
    }

    // 4. Hasher le mot de passe (12 rounds = ~250 ms, résistant aux attaques brute-force)
    const passwordHash = await bcrypt.hash(password, 12);

    // 5. Insérer le compte
    await sql`
      INSERT INTO admins (email, password_hash) VALUES (${email}, ${passwordHash})
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("Erreur setup admin:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
