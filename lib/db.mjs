import { createClient } from "@libsql/client";
import fs from "fs";
import path from "path";
import { buildSeedPlan, SEED_IDS } from "./seed.mjs";

let clientInstance = null;

export function getDb() {
  if (!clientInstance) {
    const url = process.env.TURSO_DATABASE_URL || "file:data/financeiro.db";
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (url.startsWith("file:")) {
      const dbFile = url.replace("file:", "");
      const dir = path.dirname(path.resolve(dbFile));
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }

    clientInstance = createClient({
      url,
      authToken,
    });
  }
  return clientInstance;
}

let schemaInitialized = false;

export async function initSchema() {
  if (schemaInitialized) return;
  const db = getDb();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS plans (
      id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      focus TEXT,
      data TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_plans_user ON plans(user_id);`);
  schemaInitialized = true;
}

// ---- Funções de Usuário ----

export async function findUserByEmail(email) {
  await initSchema();
  const db = getDb();
  const res = await db.execute({
    sql: "SELECT * FROM users WHERE email = ?",
    args: [email.trim().toLowerCase()],
  });
  return res.rows[0] || null;
}

export async function findUserById(id) {
  await initSchema();
  const db = getDb();
  const res = await db.execute({
    sql: "SELECT id, name, email, created_at FROM users WHERE id = ?",
    args: [id],
  });
  return res.rows[0] || null;
}

export async function createUser({ id, name, email, passwordHash }) {
  await initSchema();
  const db = getDb();
  await db.execute({
    sql: "INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)",
    args: [id, name.trim(), email.trim().toLowerCase(), passwordHash],
  });
  return { id, name: name.trim(), email: email.trim().toLowerCase() };
}

// ---- Funções de Planos por Usuário ----

export async function listUserPlans(userId) {
  await initSchema();
  await ensureUserSeeds(userId);
  const db = getDb();
  const res = await db.execute({
    sql: "SELECT id, name, focus FROM plans WHERE user_id = ? ORDER BY id ASC",
    args: [userId],
  });
  return res.rows;
}

export async function readUserPlan(userId, planId) {
  await initSchema();
  await ensureUserSeeds(userId);
  const db = getDb();
  const res = await db.execute({
    sql: "SELECT data FROM plans WHERE user_id = ? AND id = ?",
    args: [userId, planId],
  });
  const row = res.rows[0];
  if (!row) return null;
  try {
    return typeof row.data === "string" ? JSON.parse(row.data) : row.data;
  } catch {
    return null;
  }
}

export async function writeUserPlan(userId, plan) {
  await initSchema();
  const db = getDb();
  const data = JSON.stringify(plan);
  await db.execute({
    sql: `
      INSERT INTO plans (user_id, id, name, focus, data, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, id) DO UPDATE SET
        name = excluded.name,
        focus = excluded.focus,
        data = excluded.data,
        updated_at = CURRENT_TIMESTAMP
    `,
    args: [userId, plan.id, plan.name, plan.focus || "", data],
  });
}

export async function deleteUserPlan(userId, planId) {
  await initSchema();
  const db = getDb();
  await db.execute({
    sql: "DELETE FROM plans WHERE user_id = ? AND id = ?",
    args: [userId, planId],
  });
}

export async function ensureUserSeeds(userId) {
  const db = getDb();
  const res = await db.execute({
    sql: "SELECT COUNT(*) as count FROM plans WHERE user_id = ?",
    args: [userId],
  });
  const count = Number(res.rows[0]?.count || 0);
  if (count > 0) return;

  for (const id of SEED_IDS) {
    let initialPlan = null;
    const jsonPath = path.join(process.cwd(), "data", `${id}.json`);
    if (fs.existsSync(jsonPath)) {
      try {
        initialPlan = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
      } catch {
        initialPlan = null;
      }
    }
    if (!initialPlan) {
      initialPlan = buildSeedPlan(id);
    }
    await writeUserPlan(userId, initialPlan);
  }
}
