import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const AUTH_COOKIE_NAME = "fp_auth_token";
const DEFAULT_SECRET = "financeiro_pessoal_secret_key_change_me_in_production_2026";

function getSecret() {
  const secret = process.env.JWT_SECRET || DEFAULT_SECRET;
  return new TextEncoder().encode(secret);
}

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // Rotas públicas que nunca devem ser bloqueadas
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  let isValid = false;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, getSecret());
      if (payload?.sub) {
        isValid = true;
      }
    } catch {
      isValid = false;
    }
  }

  const isAuthPage = pathname === "/login" || pathname === "/register";

  // Se NÃO está autenticado e tenta acessar página protegida (ex: dashboard /)
  if (!isValid && !isAuthPage) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Se JÁ está autenticado e tenta acessar /login ou /register
  if (isValid && isAuthPage) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
