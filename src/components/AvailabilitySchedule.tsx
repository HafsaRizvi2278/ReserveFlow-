"use client";
import { formatRange } from "../lib/date";
import type { Reservation } from "../types";
import { StatusBadge } from "./ui";

export default function AvailabilitySchedule({
  reservations,
  showDetails = false,
}: {
  reservations: Reservation[];
  showDetails?: boolean;
}) {
  const confirmed = reservations
    .filter((item) => item.status === "confirmed")
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  if (!confirmed.length)
    return (
      <div className="rounded-xl border border-slate-300 bg-slate-100 p-5">
        <div className="flex items-center gap-2 text-card-title font-semibold text-slate-700">
          <span aria-hidden="true">✓</span>Available
        </div>
        <p className="mt-1 text-body text-slate-500">
          There are no occupied intervals on this date.
        </p>
      </div>
    );
  return (
    <div className="space-y-3">
      {confirmed.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-4 rounded-xl border border-info-200 bg-info-50 p-4"
        >
          <div
            className="h-10 w-1 shrink-0 rounded-full bg-info-800"
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-info-800 tabular-nums">
              {formatRange(item.startsAt, item.endsAt)}
            </div>
            <div className="mt-0.5 text-body text-slate-600">
              {showDetails ? item.title : "Reserved interval"}
            </div>
          </div>
          <StatusBadge tone="info">Occupied</StatusBadge>
        </div>
      ))}
    </div>
  );
}
