const COLOMBO_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const zone = "Asia/Colombo";

export function colomboParts(date = new Date()) {
  const shifted = new Date(date.getTime() + COLOMBO_OFFSET_MS);
  return {
    date: shifted.toISOString().slice(0, 10),
    time: shifted.toISOString().slice(11, 16),
  };
}

export function toIso(date: string, time: string) {
  return new Date(`${date}T${time}:00+05:30`).toISOString();
}

export function addDays(days: number, time = "09:00") {
  const now = new Date();
  const current = colomboParts(now).date;
  const base = new Date(`${current}T${time}:00+05:30`);
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString();
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-LK", {
    timeZone: zone,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

export function formatRange(start: string, end: string) {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

export function inputDate(iso: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

export function inputTime(iso: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: zone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
  return parts === "24:00" ? "00:00" : parts;
}

export function isToday(iso: string) {
  return inputDate(iso) === colomboParts().date;
}

export function overlaps(
  start: string,
  end: string,
  existingStart: string,
  existingEnd: string,
) {
  return (
    new Date(start) < new Date(existingEnd) &&
    new Date(end) > new Date(existingStart)
  );
}

export function durationLabel(start: string, end: string) {
  const mins = Math.round(
    (new Date(end).getTime() - new Date(start).getTime()) / 60000,
  );
  const hours = Math.floor(mins / 60);
  const rest = mins % 60;
  return [hours ? `${hours}h` : "", rest ? `${rest}m` : ""]
    .filter(Boolean)
    .join(" ");
}
