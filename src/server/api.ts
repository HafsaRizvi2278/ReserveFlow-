import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { randomBytes, randomUUID } from "node:crypto";
import { pool, transaction } from "./db";
import { currentUser, SESSION_COOKIE } from "./auth";
import { hashToken, verifyPassword, hashPassword } from "./security.mjs";
import {
  HttpError,
  reservationInput,
  resourceInput,
  authorizeReservation,
} from "./validation.mjs";
import type { User } from "../types";
import type { PoolClient } from "pg";
const dummyPassword = hashPassword("invalid-account-password");
const resourceColumns = `id,name,category,description,location,capacity,amenities,is_active AS "isActive",created_at AS "createdAt",updated_at AS "updatedAt"`;
const reservationColumns = `id,resource_id AS "resourceId",user_id AS "userId",title,notes,starts_at AS "startsAt",ends_at AS "endsAt",status,created_at AS "createdAt",updated_at AS "updatedAt"`;
function ok(body: unknown) {
  return NextResponse.json(body, { headers: { "Cache-Control": "no-store" } });
}
function admin(user: User) {
  if (user.role !== "admin") throw new HttpError(403, "Admins only.");
}
async function json(request: NextRequest) {
  try {
    const raw = await request.text();
    if (raw.length > 20000) throw new HttpError(413, "Request is too large.");
    return JSON.parse(raw);
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new HttpError(400, "Invalid JSON request.");
  }
}
function checkOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  const allowed = process.env.APP_ORIGIN;
  if (!allowed)
    throw new HttpError(
      503,
      "Set APP_ORIGIN in your environment configuration.",
    );
  if (origin !== new URL(allowed).origin)
    throw new HttpError(403, "Request origin is not allowed.");
}
async function resourceLock(client: PoolClient, id: string) {
  const { rows } = await client.query(
    "SELECT id,is_active FROM resources WHERE id=$1 FOR UPDATE",
    [id],
  );
  if (!rows[0]) throw new HttpError(404, "Resource not found.");
  if (!rows[0].is_active)
    throw new HttpError(400, "Inactive resources cannot be reserved.");
}
export async function handle(request: NextRequest, path: string[]) {
  try {
    const route = path.join("/"),
      method = request.method;
    if (method !== "GET") checkOrigin(request);
    if (route === "auth/login" && method === "POST") {
      const body = await json(request);
      if (
        typeof body.email !== "string" ||
        typeof body.password !== "string" ||
        body.email.length > 254 ||
        body.password.length > 256
      )
        throw new HttpError(400, "Enter a valid email and password.");
      const email = body.email.trim().toLowerCase();
      const attempt = await pool.query(
        `INSERT INTO login_attempts(email,attempts,window_start) VALUES($1,1,now()) ON CONFLICT(email) DO UPDATE SET attempts=CASE WHEN login_attempts.window_start<now()-interval '15 minutes' THEN 1 ELSE login_attempts.attempts+1 END,window_start=CASE WHEN login_attempts.window_start<now()-interval '15 minutes' THEN now() ELSE login_attempts.window_start END RETURNING attempts`,
        [email],
      );
      if (attempt.rows[0].attempts > 10)
        throw new HttpError(
          429,
          "Too many sign-in attempts. Try again in 15 minutes.",
        );
      const { rows } = await pool.query("SELECT * FROM users WHERE email=$1", [
        email,
      ]);
      const record = rows[0];
      const valid = verifyPassword(
        body.password,
        record?.password_hash ?? dummyPassword,
      );
      if (!record || !valid)
        throw new HttpError(401, "Invalid email or password.");
      await pool.query("DELETE FROM login_attempts WHERE email=$1", [email]);
      const jar = await cookies();
      const old = jar.get(SESSION_COOKIE)?.value;
      if (old)
        await pool.query("DELETE FROM sessions WHERE token_hash=$1", [
          hashToken(old),
        ]);
      const token = randomBytes(32).toString("hex");
      await pool.query("DELETE FROM sessions WHERE expires_at<=now()");
      await pool.query(
        "INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '8 hours')",
        [hashToken(token), record.id],
      );
      jar.set(SESSION_COOKIE, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.COOKIE_SECURE === "true",
        path: "/",
        maxAge: 28800,
      });
      return ok({
        id: record.id,
        name: record.name,
        email: record.email,
        role: record.role,
      });
    }
    if (route === "auth/logout" && method === "POST") {
      const jar = await cookies();
      const token = jar.get(SESSION_COOKIE)?.value;
      if (token)
        await pool.query("DELETE FROM sessions WHERE token_hash=$1", [
          hashToken(token),
        ]);
      jar.delete(SESSION_COOKIE);
      return ok({ success: true });
    }
    const user = await currentUser();
    if (route === "snapshot" && method === "GET") {
      if (!user)
        return ok({ user: null, users: [], resources: [], reservations: [] });
      const resources = await pool.query(
        `SELECT ${resourceColumns} FROM resources ORDER BY name`,
      );
      const users =
        user.role === "admin"
          ? await pool.query(
              "SELECT id,name,email,role FROM users ORDER BY name",
            )
          : { rows: [user] };
      // Non-owned slots carry only occupancy information; private fields never leave the server.
      const reservations =
        user.role === "admin"
          ? await pool.query(
              `SELECT ${reservationColumns} FROM reservations ORDER BY starts_at`,
            )
          : await pool.query(
              `SELECT id,resource_id AS "resourceId",CASE WHEN user_id=$1 THEN user_id ELSE '' END AS "userId",CASE WHEN user_id=$1 THEN title ELSE 'Reserved interval' END AS title,CASE WHEN user_id=$1 THEN notes ELSE '' END AS notes,starts_at AS "startsAt",ends_at AS "endsAt",status,created_at AS "createdAt",updated_at AS "updatedAt" FROM reservations WHERE user_id=$1 OR (status='confirmed' AND ends_at>now()) ORDER BY starts_at`,
              [user.id],
            );
      return ok({
        user,
        users: users.rows,
        resources: resources.rows,
        reservations: reservations.rows,
      });
    }
    if (!user) throw new HttpError(401, "Sign in to continue.");
    if (path[0] === "resources") {
      admin(user);
      if (path.length === 1 && method === "POST") {
        const input = resourceInput(await json(request));
        const id = randomUUID();
        await pool.query(
          "INSERT INTO resources(id,name,category,description,location,capacity,amenities,is_active) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
          [
            id,
            input.name,
            input.category,
            input.description,
            input.location,
            input.capacity,
            input.amenities,
            input.isActive,
          ],
        );
        return ok({ id });
      }
      if (path.length === 2 && method === "PATCH") {
        const input = resourceInput(await json(request));
        const result = await pool.query(
          "UPDATE resources SET name=$2,category=$3,description=$4,location=$5,capacity=$6,amenities=$7,is_active=$8,updated_at=now() WHERE id=$1",
          [
            path[1],
            input.name,
            input.category,
            input.description,
            input.location,
            input.capacity,
            input.amenities,
            input.isActive,
          ],
        );
        if (!result.rowCount) throw new HttpError(404, "Resource not found.");
        return ok({ success: true });
      }
      if (path.length === 3 && path[2] === "status" && method === "PATCH") {
        const body = await json(request);
        if (typeof body.isActive !== "boolean")
          throw new HttpError(400, "Invalid active status.");
        const result = await pool.query(
          "UPDATE resources SET is_active=$2,updated_at=now() WHERE id=$1",
          [path[1], body.isActive],
        );
        if (!result.rowCount) throw new HttpError(404, "Resource not found.");
        return ok({ success: true });
      }
    }
    if (path[0] === "reservations") {
      if (
        (path.length === 1 && method === "POST") ||
        (path.length === 2 && method === "PATCH")
      ) {
        const input = reservationInput(await json(request));
        const id = path[1] ?? randomUUID();
        return await transaction(async (client) => {
          // Resource row locks synchronize booking with deactivation. The exclusion constraint is the final concurrency guard.
          await resourceLock(client, input.resourceId);
          if (method === "PATCH") {
            const result = await client.query(
              "SELECT * FROM reservations WHERE id=$1 FOR UPDATE",
              [id],
            );
            authorizeReservation(user, result.rows[0]);
          }
          const conflict = await client.query(
            `SELECT ${reservationColumns} FROM reservations WHERE resource_id=$1 AND status='confirmed' AND id<>$4 AND starts_at<$3 AND ends_at>$2 LIMIT 1`,
            [input.resourceId, input.startsAt, input.endsAt, id],
          );
          if (conflict.rows[0]) {
            const slot = conflict.rows[0];
            return NextResponse.json(
              {
                error: "This time overlaps an existing reservation.",
                conflict: {
                  ...slot,
                  userId: "",
                  title: "Reserved interval",
                  notes: "",
                },
              },
              { status: 409 },
            );
          }
          if (method === "POST")
            await client.query(
              "INSERT INTO reservations(id,resource_id,user_id,title,notes,starts_at,ends_at) VALUES($1,$2,$3,$4,$5,$6,$7)",
              [
                id,
                input.resourceId,
                user.id,
                input.title,
                input.notes,
                input.startsAt,
                input.endsAt,
              ],
            );
          else
            await client.query(
              "UPDATE reservations SET resource_id=$2,title=$3,notes=$4,starts_at=$5,ends_at=$6,updated_at=now() WHERE id=$1",
              [
                id,
                input.resourceId,
                input.title,
                input.notes,
                input.startsAt,
                input.endsAt,
              ],
            );
          return ok({ id });
        });
      }
      if (path.length === 3 && path[2] === "cancel" && method === "POST")
        return await transaction(async (client) => {
          const result = await client.query(
            "SELECT * FROM reservations WHERE id=$1 FOR UPDATE",
            [path[1]],
          );
          authorizeReservation(user, result.rows[0]);
          await client.query(
            "UPDATE reservations SET status='cancelled',updated_at=now() WHERE id=$1",
            [path[1]],
          );
          return ok({ success: true });
        });
    }
    throw new HttpError(404, "Endpoint not found.");
  } catch (error) {
    if (error instanceof HttpError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    const code = (error as { code?: string }).code;
    if (code === "23P01")
      return NextResponse.json(
        { error: "That slot was just reserved. Change the time and retry." },
        { status: 409 },
      );
    if (code === "40P01" || code === "40001")
      return NextResponse.json(
        { error: "Another request changed this booking. Please retry." },
        { status: 409 },
      );
    console.error("ReserveFlow API error", error);
    return NextResponse.json(
      {
        error:
          "Unable to complete the request. Check the database connection and retry.",
      },
      { status: 503 },
    );
  }
}
