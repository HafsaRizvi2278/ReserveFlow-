import test from "node:test";
import assert from "node:assert/strict";
import {
  reservationInput,
  resourceInput,
  authorizeReservation,
} from "../src/server/validation.mjs";
import { hashPassword, verifyPassword } from "../src/server/security.mjs";
const now = Date.parse("2026-10-12T00:00:00Z");
const valid = {
  resourceId: "ocean",
  title: "Planning",
  notes: "",
  startsAt: "2026-10-13T09:00:00+05:30",
  endsAt: "2026-10-13T10:00:00+05:30",
};
test("Colombo input becomes an exact UTC instant", () =>
  assert.equal(
    reservationInput(valid, now).startsAt,
    "2026-10-13T03:30:00.000Z",
  ));
test("past edit, reversed range and invalid dates are rejected", () => {
  for (const change of [
    { startsAt: "2026-10-11T09:00:00+05:30" },
    { endsAt: valid.startsAt },
    { startsAt: "invalid" },
  ])
    assert.throws(() => reservationInput({ ...valid, ...change }, now));
});
test("cross-day bookings rejected in Colombo timezone", () =>
  assert.throws(() =>
    reservationInput({ ...valid, endsAt: "2026-10-14T00:00:00+05:30" }, now),
  ));
test("employees cannot mutate other bookings, cancelled or started bookings", () => {
  const user = { id: "one", role: "employee" };
  const item = {
    user_id: "two",
    status: "confirmed",
    starts_at: valid.startsAt,
  };
  assert.throws(() => authorizeReservation(user, item, now));
  assert.throws(() =>
    authorizeReservation(
      user,
      { ...item, user_id: "one", status: "cancelled" },
      now,
    ),
  );
  assert.throws(() =>
    authorizeReservation(
      user,
      { ...item, user_id: "one", starts_at: "2026-10-11" },
      now,
    ),
  );
});
test("admin can manage a future booking owned by someone else", () =>
  assert.doesNotThrow(() =>
    authorizeReservation(
      { id: "admin", role: "admin" },
      { user_id: "two", status: "confirmed", starts_at: valid.startsAt },
      now,
    ),
  ));
test("invalid resource capacity rejected", () =>
  assert.throws(() =>
    resourceInput({
      name: "Room",
      description: "Room",
      location: "Office",
      category: "Meeting Room",
      capacity: 1.5,
      amenities: [],
      isActive: true,
    }),
  ));
test("password hash rejects incorrect password", () => {
  const hash = hashPassword("demo-password");
  assert.equal(verifyPassword("demo-password", hash), true);
  assert.equal(verifyPassword("wrong", hash), false);
  assert.equal(verifyPassword("demo-password", "invalid"), false);
});
