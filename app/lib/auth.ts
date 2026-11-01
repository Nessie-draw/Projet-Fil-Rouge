// Utilitaires JWT — sign/verify avec jose (compatible Edge runtime)
import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export interface AdminPayload extends JWTPayload {
  email:   string;
  adminId: string;
}

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET manquant dans les variables d'environnement");
  return new TextEncoder().encode(secret);
}

export async function signToken(payload: AdminPayload): Promise<string> {
  return new SignJWT(payload as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<AdminPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as AdminPayload;
  } catch {
    return null;
  }
}

// Nom du cookie de session admin
export const COOKIE_NAME = "admin_token";

// Options cookie sécurisées
export const cookieOptions = {
  httpOnly:  true,
  secure:    process.env.NODE_ENV === "production",
  sameSite:  "strict" as const,
  path:      "/",
  maxAge:    8 * 60 * 60, // 8 heures
};
