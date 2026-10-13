import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import pg from "pg";
// Exercise the actual application schema in an isolated schema; application rows remain untouched.
test("PostgreSQL rejects concurrent overlaps, permits adjacency, releases cancelled slots", async () => {
  if (!process.env.DATABASE_URL)
    throw new Error("Set DATABASE_URL in .env before running test:db.");
  const schema = "rf_test_" + randomUUID().replaceAll("-", "");
  const admin = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  let pool;
  try {
    await admin.query("CREATE EXTENSION IF NOT EXISTS btree_gist");
    await admin.query(`CREATE SCHEMA ${schema}`);
    pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      options: `-c search_path=${schema},public`,
    });
    await pool.query(
      await readFile(
        new URL("../database/001_initial.sql", import.meta.url),
        "utf8",
      ),
    );
    await pool.query(
      "INSERT INTO users(id,name,email,role,password_hash) VALUES('test-user','Test','test@example.com','employee','unused')",
    );
    await pool.query(
      "INSERT INTO resources(id,name,category,description,location,capacity) VALUES('test-room','Test room','Meeting Room','Test','Office',2)",
    );
    const insert = (id, start, end) =>
      pool.query(
        "INSERT INTO reservations(id,resource_id,user_id,title,starts_at,ends_at) VALUES($1,'test-room','test-user','Test',$2,$3)",
        [id, `2030-01-01T${start}:00Z`, `2030-01-01T${end}:00Z`],
      );
    const results = await Promise.allSettled([
      insert("one", "09:00", "10:00"),
      insert("two", "09:30", "10:30"),
    ]);
    assert.equal(results.filter((x) => x.status === "fulfilled").length, 1);
    assert.equal(
      results.find((x) => x.status === "rejected").reason.code,
      "23P01",
    );
    await pool.query("TRUNCATE reservations");
    await insert("base", "09:00", "10:00");
    await insert("adjacent", "10:00", "11:00");
    await pool.query(
      "UPDATE reservations SET status='cancelled' WHERE id='base'",
    );
    await insert("replacement", "09:00", "10:00");
  } finally {
    if (pool) await pool.end();
    await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await admin.end();
  }
});
