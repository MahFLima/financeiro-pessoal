// Persistência no banco SQLite por usuário.
import { buildBasePlan, SEED_IDS } from "./seed.mjs";
import {
  deleteUserPlan,
  listUserPlans,
  readUserPlan,
  writeUserPlan,
} from "./db.mjs";

const ID_RE = /^plan[A-Za-z0-9]+$/;
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const PROTECTED_IDS = SEED_IDS;

export async function readPlan(userId, id) {
  if (!id && typeof userId === "string" && !userId.includes("-")) {
    // fallback caso chamado apenas com id
    id = userId;
    userId = "default";
  }
  if (!ID_RE.test(id)) throw new Error("ID de plano inválido");
  return await readUserPlan(userId, id);
}

export async function listPlans(userId = "default") {
  return await listUserPlans(userId);
}

export async function writePlan(userId, plan) {
  if (!plan && typeof userId === "object") {
    plan = userId;
    userId = "default";
  }
  if (!ID_RE.test(plan.id)) throw new Error("ID de plano inválido");
  return await writeUserPlan(userId, plan);
}

export async function createPlan(userId, { name, copyFrom, gross, net }) {
  if (typeof userId === "object" && !userId.id && !userId.sub) {
    // Parâmetros invertidos / sem userId
    net = userId.net;
    gross = userId.gross;
    copyFrom = userId.copyFrom;
    name = userId.name;
    userId = "default";
  }
  const uId = typeof userId === "string" ? userId : (userId?.id || "default");

  const existing = (await listPlans(uId)).map((p) => p.id);
  let id = null;
  let label = null;
  for (const l of LETTERS) {
    if (!existing.includes(`plan${l}`)) {
      id = `plan${l}`;
      label = l;
      break;
    }
  }
  if (!id) {
    let n = 1;
    while (existing.includes(`plan${n}`)) n++;
    id = `plan${n}`;
    label = String(n);
  }
  const finalName = (name && name.trim()) || `Plano ${label}`;

  let salary = undefined;
  if ((gross !== undefined && gross !== null && gross !== "") || (net !== undefined && net !== null && net !== "")) {
    salary = {
      gross: Math.max(0, parseFloat(String(gross).replace(",", ".")) || 0),
      net: Math.max(0, parseFloat(String(net).replace(",", ".")) || 0),
    };
  }

  let plan;
  if (copyFrom) {
    const src = await readPlan(uId, copyFrom);
    if (!src) throw new Error("Plano de origem não encontrado");
    plan = {
      ...structuredClone(src),
      id,
      name: finalName,
      focus: `Cópia de ${src.name}`,
      ...(salary ? { salary } : {}),
    };
  } else {
    plan = buildBasePlan({ id, name: finalName, focus: "Personalizado", salary, clean: true });
  }
  await writePlan(uId, plan);
  return plan;
}

export async function deletePlan(userId, id) {
  if (!id && typeof userId === "string") {
    id = userId;
    userId = "default";
  }
  await deleteUserPlan(userId, id);
}
