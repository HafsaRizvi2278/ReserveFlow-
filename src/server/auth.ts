import { cookies } from "next/headers";
import { pool } from "./db";
import { hashToken } from "./security.mjs";
import type { User } from "../types";
export const SESSION_COOKIE = "reserveflow_session";
export async function currentUser(): Promise<User | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const result = await pool.query<User>(
    `SELECT u.id,u.name,u.email,u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now()`,
    [hashToken(token)],
  );
  return result.rows[0] ?? null;
}
