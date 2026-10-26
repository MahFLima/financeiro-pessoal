import { NextResponse } from "next/server";
import { findUserByEmail } from "@/lib/db.mjs";
import { AUTH_COOKIE_NAME, comparePassword, signToken } from "@/lib/auth.mjs";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Informe e-mail e senha." },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = await findUserByEmail(cleanEmail);

    if (!user) {
      return NextResponse.json(
        { error: "E-mail ou senha inválidos." },
        { status: 401 }
      );
    }

    const match = await comparePassword(password, user.password_hash);
    if (!match) {
      return NextResponse.json(
        { error: "E-mail ou senha inválidos." },
        { status: 401 }
      );
    }

    const token = await signToken({
      sub: user.id,
      name: user.name,
      email: user.email,
    });

    const response = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email },
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    });

    return response;
  } catch (e) {
    return NextResponse.json({ error: e.message || "Erro ao autenticar." }, { status: 500 });
  }
}
