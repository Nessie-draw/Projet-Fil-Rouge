// app/api/inscriptions/route.ts
import { NextRequest, NextResponse } from "next/server";
import sql from "../../lib/db";
import { verifyToken, COOKIE_NAME } from "../../lib/auth";
import { rateLimit } from "../../lib/rateLimit";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_LEN = 255;

export async function POST(request: NextRequest) {
  // Rate limiting : max 10 inscriptions par IP par 15 min
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? "unknown";
  const { ok, retryAfterSec } = rateLimit(`inscription:${ip}`, 10);
  if (!ok) {
    return NextResponse.json(
      { error: `Trop de tentatives. Réessayez dans ${Math.ceil(retryAfterSec / 60)} minute(s).` },
      { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
    );
  }

  try {
    const body = await request.json();

    // Validation des champs obligatoires
    if (!body.email || !body.prenom || !body.nom || !body.nomEquipe || !body.nombrePilote || !body.nomRobot) {
      return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
    }

    // Validation email
    const email = String(body.email).trim().toLowerCase();
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Adresse email invalide" }, { status: 400 });
    }

    // Validation longueur des champs
    const prenom = String(body.prenom).trim().slice(0, MAX_LEN);
    const nom = String(body.nom).trim().slice(0, MAX_LEN);
    const nomEquipe = String(body.nomEquipe).trim().slice(0, MAX_LEN);
    const nomRobot = String(body.nomRobot).trim().slice(0, MAX_LEN);
    const coequipier = body.coequipier ? String(body.coequipier).trim().slice(0, MAX_LEN) : null;
    const etablissement = body.etablissement ? String(body.etablissement).trim().slice(0, MAX_LEN) : "";

    // Validation nombrePilote (1 ou 2)
    const nombrePilote = Number(body.nombrePilote);
    if (nombrePilote !== 1 && nombrePilote !== 2) {
      return NextResponse.json({ error: "Le nombre de pilotes doit être 1 ou 2" }, { status: 400 });
    }

    const equipeId = nomRobot
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    await sql`
      INSERT INTO inscriptions (id, email, prenom, nom, nom_equipe, nombre_pilote, coequipier, nom_robot, etablissement)
      VALUES (
        ${equipeId},
        ${email},
        ${prenom},
        ${nom},
        ${nomEquipe},
        ${nombrePilote},
        ${coequipier},
        ${nomRobot},
        ${etablissement}
      )
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        prenom = EXCLUDED.prenom,
        nom = EXCLUDED.nom,
        nom_equipe = EXCLUDED.nom_equipe,
        nombre_pilote = EXCLUDED.nombre_pilote,
        coequipier = EXCLUDED.coequipier,
        nom_robot = EXCLUDED.nom_robot,
        etablissement = EXCLUDED.etablissement
    `;

    return NextResponse.json({ success: true, id: equipeId }, { status: 201 });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("Erreur inscription:", error);
    return NextResponse.json({ error: "Erreur du serveur" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const { id } = await request.json() as { id?: string };
    if (!id) {
      return NextResponse.json({ error: "ID requis." }, { status: 400 });
    }

    const result = await sql`DELETE FROM inscriptions WHERE id = ${id}`;
    if (result.length === 0 && !result.command) {
      // neon returns empty for successful DELETEs
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("Erreur suppression:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const rows = await sql`
      SELECT id, email, prenom, nom, nom_equipe AS "nomEquipe", nombre_pilote AS "nombrePilote",
             coequipier, nom_robot AS "nomRobot", etablissement, created_at AS "createdAt"
      FROM inscriptions
      ORDER BY created_at DESC
    `;
    return NextResponse.json({ inscriptions: rows });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("Erreur récupération:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
