import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth.mjs";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email },
  });
}
