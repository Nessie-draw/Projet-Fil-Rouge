// POST /api/auth/login — vérifie les identifiants et pose le cookie de session
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import sql from "../../../lib/db";
import { signToken, COOKIE_NAME, cookieOptions } from "../../../lib/auth";
import { rateLimit, resetLimit } from "../../../lib/rateLimit";

export async function POST(request: NextRequest) {
  // ── Rate limiting : max 5 tentatives / 15 min par IP ──────────────────────
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? "unknown";

  const { ok, retryAfterSec } = rateLimit(ip);
  if (!ok) {
    return NextResponse.json(
      { error: `Trop de tentatives. Réessayez dans ${Math.ceil(retryAfterSec / 60)} minute(s).` },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfterSec) },
      }
    );
  }

  try {
    const body = await request.json() as { email?: string; password?: string };
    const email    = (body.email    ?? "").trim().toLowerCase();
    const password = (body.password ?? "").trim();

    if (!email || !password) {
      return NextResponse.json({ error: "Email et mot de passe requis." }, { status: 400 });
    }

    const rows = await sql`SELECT id, password_hash FROM admins WHERE email = ${email} LIMIT 1`;

    // Toujours exécuter bcrypt.compare pour éviter les attaques par timing
    const admin = rows.length > 0 ? rows[0] as { id: string; password_hash: string } : null;
    const dummyHash = "$2a$12$000000000000000000000uGOTzRMFGO7hKPSD3VkZsVHCvlp86tBi";
    const valid = await bcrypt.compare(password, admin?.password_hash ?? dummyHash);
    if (!admin || !valid) {
      return NextResponse.json({ error: "Identifiants incorrects." }, { status: 401 });
    }

    // Login réussi → réinitialiser le compteur de tentatives
    resetLimit(ip);

    const token = await signToken({ email, adminId: admin.id });
    const res   = NextResponse.json({ success: true });
    res.cookies.set(COOKIE_NAME, token, cookieOptions);
    return res;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("Erreur login:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
