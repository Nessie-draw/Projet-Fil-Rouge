// app/api/bracket/route.ts
import { NextRequest, NextResponse } from "next/server";
import sql from "../../lib/db";
import { bracketEmitter } from "../../lib/bracketEvents";
import { getCached, setCached, invalidateCache } from "../../lib/bracketCache";
import { verifyToken, COOKIE_NAME } from "../../lib/auth";

// ── GET — lecture publique avec cache 2 s ─────────────────────────────────────
export async function GET() {
  try {
    const cached = getCached();
    if (cached) return NextResponse.json(cached);

    const teams = await sql`
      SELECT id, nom_robot AS name
      FROM inscriptions
      ORDER BY id ASC
    `;

    const bracketRows = await sql`
      SELECT data FROM tournament WHERE id = 'bracket-2026'
    `;

    const savedBracket = bracketRows.length > 0 ? bracketRows[0].data : null;
    const result = { teams, savedBracket };

    setCached(result);
    return NextResponse.json(result);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("Erreur GET bracket:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ── POST — réservé à l'administrateur connecté ───────────────────────────────
export async function POST(request: NextRequest) {
  // Vérification JWT — seul l'admin peut modifier le bracket
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    // Limite de taille : max 500 KB pour le bracket
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 512_000) {
      return NextResponse.json({ error: "Données trop volumineuses" }, { status: 413 });
    }

    const body = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    const isDoubleElim = "_format" in body && body._format === "double_elimination" && "winners" in body && "losers" in body && "grandFinal" in body;
    const isCustom = "_format" in body && "round1" in body;
    const isRounds = "rounds" in body && "roundStructure" in body;
    const isLegacy = "leftBracket" in body && "rightBracket" in body;
    if (!isDoubleElim && !isCustom && !isRounds && !isLegacy) {
      return NextResponse.json({ error: "Structure du bracket invalide" }, { status: 400 });
    }

    // Vérification secondaire : le JSON sérialisé ne dépasse pas 500 KB
    const serialized = JSON.stringify(body);
    if (serialized.length > 512_000) {
      return NextResponse.json({ error: "Données trop volumineuses" }, { status: 413 });
    }

    await sql`
      INSERT INTO tournament (id, data, updated_at)
      VALUES ('bracket-2026', ${serialized}, NOW())
      ON CONFLICT (id) DO UPDATE SET
        data = EXCLUDED.data,
        updated_at = NOW()
    `;

    // Invalider le cache et notifier les clients SSE instantanément
    invalidateCache();
    bracketEmitter.emit("update", body);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("Erreur POST bracket:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
