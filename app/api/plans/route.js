import { NextResponse } from "next/server";
import { createPlan, listPlans } from "@/lib/storage.mjs";
import { getSessionUser } from "@/lib/auth.mjs";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }
    return NextResponse.json({ plans: await listPlans(user.id) });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const plan = await createPlan(user.id, {
      name: body.name,
      copyFrom: body.copyFrom,
      gross: body.gross,
      net: body.net,
    });
    return NextResponse.json({ plan, plans: await listPlans(user.id) }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
