import { NextResponse } from "next/server";
import { createUser, ensureUserSeeds, findUserByEmail } from "@/lib/db.mjs";
import { AUTH_COOKIE_NAME, hashPassword, signToken } from "@/lib/auth.mjs";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { name, email, password } = body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Informe um nome válido (mínimo 2 caracteres)." },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json(
        { error: "Informe um e-mail válido." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter no mínimo 6 caracteres." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await findUserByEmail(cleanEmail);
    if (existing) {
      return NextResponse.json(
        { error: "Já existe uma conta com este e-mail." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const userId = "usr_" + crypto.randomUUID().replace(/-/g, "").slice(0, 16);

    const user = await createUser({
      id: userId,
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
    });

    // Cria os planos iniciais padrão (A, B, C) para este novo usuário
    await ensureUserSeeds(user.id);

    // Gera o token de sessão
    const token = await signToken({
      sub: user.id,
      name: user.name,
      email: user.email,
    });

    const response = NextResponse.json(
      { user: { id: user.id, name: user.name, email: user.email } },
      { status: 201 }
    );

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
    return NextResponse.json({ error: e.message || "Erro ao criar conta." }, { status: 500 });
  }
}
