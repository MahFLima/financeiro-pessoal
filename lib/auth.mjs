import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import fs from "fs";
import path from "path";
import { findUserById } from "./db.mjs";

export const AUTH_COOKIE_NAME = "fp_auth_token";
const TOKEN_EXPIRY = "7d";

function getSecretKey() {
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 16) {
    return new TextEncoder().encode(process.env.JWT_SECRET);
  }

  // Fallback seguro persistente para desenvolvimento local
  const secretFile = path.join(process.cwd(), "data", ".jwt_secret");
  try {
    if (fs.existsSync(secretFile)) {
      const secret = fs.readFileSync(secretFile, "utf8").trim();
      if (secret.length >= 16) return new TextEncoder().encode(secret);
    }
  } catch {}

  const generated = "fp_sec_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
  try {
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(secretFile, generated, "utf8");
  } catch {}
  return new TextEncoder().encode(generated);
}

export async function hashPassword(plainPassword) {
  return await bcrypt.hash(plainPassword, 10);
}

export async function comparePassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

export async function signToken(payload) {
  const secret = getSecretKey();
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(secret);
}

export async function verifyToken(token) {
  if (!token) return null;
  try {
    const secret = getSecretKey();
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

/**
 * Obtém o usuário atualmente autenticado a partir dos cookies da requisição.
 */
export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload?.sub) return null;

  const user = await findUserById(payload.sub);
  return user || null;
}
