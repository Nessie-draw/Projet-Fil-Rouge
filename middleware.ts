// middleware.ts — protège toutes les routes /admin/** sauf login et setup
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Routes admin accessibles sans être connecté
const PUBLIC_ADMIN = ["/admin/login", "/admin/setup"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && !PUBLIC_ADMIN.some(p => pathname.startsWith(p))) {
    const token = request.cookies.get("admin_token")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    try {
      const secret = new TextEncoder().encode(process.env.AUTH_SECRET!);
      await jwtVerify(token, secret);
      return NextResponse.next();
    } catch {
      // Token invalide ou expiré → retour au login
      const res = NextResponse.redirect(new URL("/admin/login", request.url));
      res.cookies.delete("admin_token");
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
