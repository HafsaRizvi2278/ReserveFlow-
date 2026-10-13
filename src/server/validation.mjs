export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
function fail(message) {
  throw new HttpError(400, message);
}
function text(value, label, max, required = true) {
  if (typeof value !== "string") fail(`${label} must be text.`);
  const result = value.trim();
  if ((required && !result) || result.length > max)
    fail(`${label} must contain ${required ? "1" : "0"}–${max} characters.`);
  return result;
}
export function reservationInput(body, now = Date.now()) {
  if (!body || typeof body !== "object") fail("Invalid reservation.");
  const resourceId = text(body.resourceId, "Resource", 100),
    title = text(body.title, "Title", 160),
    notes = text(body.notes ?? "", "Notes", 2000, false);
  const startsAt = text(body.startsAt, "Start time", 50),
    endsAt = text(body.endsAt, "End time", 50);
  const start = Date.parse(startsAt),
    end = Date.parse(endsAt);
  if (!Number.isFinite(start) || !Number.isFinite(end))
    fail("Enter valid date and time values.");
  if (start <= now) fail("Reservations must start in the future.");
  if (end <= start) fail("End time must be after start time.");
  const day = (t) => new Date(t + 19800000).toISOString().slice(0, 10);
  if (day(start) !== day(end))
    fail("Reservation must start and finish on the same Sri Lanka date.");
  return {
    resourceId,
    title,
    notes,
    startsAt: new Date(start).toISOString(),
    endsAt: new Date(end).toISOString(),
  };
}
export function resourceInput(body) {
  if (!body || typeof body !== "object") fail("Invalid resource.");
  const name = text(body.name, "Name", 120),
    description = text(body.description, "Description", 2000),
    location = text(body.location, "Location", 160);
  if (!["Meeting Room", "Workspace", "Equipment"].includes(body.category))
    fail("Choose a valid category.");
  if (
    !Number.isInteger(body.capacity) ||
    body.capacity < 1 ||
    body.capacity > 10000
  )
    fail("Capacity must be a positive integer no greater than 10000.");
  if (typeof body.isActive !== "boolean") fail("Choose an active status.");
  if (!Array.isArray(body.amenities) || body.amenities.length > 30)
    fail("Provide up to 30 amenities.");
  const amenities = body.amenities.map((item) => text(item, "Amenity", 80));
  return {
    name,
    description,
    location,
    category: body.category,
    capacity: body.capacity,
    isActive: body.isActive,
    amenities,
  };
}
export function authorizeReservation(user, item, now = Date.now()) {
  if (!item) throw new HttpError(404, "Reservation not found.");
  if (user.role !== "admin" && item.user_id !== user.id)
    throw new HttpError(403, "You can manage only your own reservations.");
  if (item.status !== "confirmed" || new Date(item.starts_at).getTime() <= now)
    throw new HttpError(
      400,
      "Only future confirmed reservations can be changed.",
    );
}
