import { NextResponse } from "next/server";
import { deletePlan, listPlans, readPlan, writePlan } from "@/lib/storage.mjs";
import { getSessionUser } from "@/lib/auth.mjs";

export const dynamic = "force-dynamic";

export async function GET(_req, { params }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }
    const { id } = await params;
    const plan = await readPlan(user.id, id);
    if (!plan) return NextResponse.json({ error: "Plano não encontrado" }, { status: 404 });
    return NextResponse.json({ plan });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function PUT(req, { params }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }
    const { id } = await params;
    const body = await req.json();
    if (!body || typeof body !== "object" || body.id !== id) {
      return NextResponse.json({ error: "Corpo inválido (id divergente)" }, { status: 400 });
    }
    if (!Array.isArray(body.incomes) || !Array.isArray(body.expenses)) {
      return NextResponse.json({ error: "incomes e expenses devem ser listas" }, { status: 400 });
    }
    if (!(await readPlan(user.id, id))) {
      return NextResponse.json({ error: "Plano não encontrado" }, { status: 404 });
    }
    await writePlan(user.id, body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(_req, { params }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }
    const { id } = await params;
    await deletePlan(user.id, id);
    return NextResponse.json({ ok: true, plans: await listPlans(user.id) });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
