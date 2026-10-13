"use client";
import { useState, type FormEvent } from "react";
import {
  colomboParts,
  durationLabel,
  formatDate,
  formatRange,
  inputDate,
  inputTime,
  overlaps,
  toIso,
} from "../lib/date";
import { ConflictError, apiService } from "../services/apiService";
import type { Reservation, Resource } from "../types";
import { useStore } from "../app/store";
import { Button, Field, Input, Select, Textarea } from "./ui";

export default function ReservationForm({
  resources,
  initialResourceId,
  initialDate,
  initialStart,
  initialEnd,
  reservation,
  onDone,
  onCancel,
}: {
  resources: Resource[];
  initialResourceId?: string;
  initialDate?: string;
  initialStart?: string;
  initialEnd?: string;
  reservation?: Reservation;
  onDone: () => void;
  onCancel: () => void;
}) {
  const { user, notify, reservations } = useStore();
  const tomorrow = colomboParts(new Date(Date.now() + 86400000)).date;
  const [values, setValues] = useState({
    resourceId:
      reservation?.resourceId ?? initialResourceId ?? resources[0]?.id ?? "",
    title: reservation?.title ?? "",
    notes: reservation?.notes ?? "",
    date: reservation
      ? inputDate(reservation.startsAt)
      : initialDate || tomorrow,
    start: reservation
      ? inputTime(reservation.startsAt)
      : initialStart || "09:00",
    end: reservation ? inputTime(reservation.endsAt) : initialEnd || "10:00",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const selected = resources.find((item) => item.id === values.resourceId);
  const set = (key: string, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  };

  async function submit(event: FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!values.resourceId) next.resourceId = "Choose a resource.";
    if (!values.title.trim()) next.title = "Enter a reservation title.";
    if (!values.date) next.date = "Choose a date.";
    if (!values.start) next.start = "Choose a start time.";
    if (!values.end) next.end = "Choose an end time.";
    const hasCompleteSlot = Boolean(values.date && values.start && values.end);
    const startsAt = hasCompleteSlot ? toIso(values.date, values.start) : "";
    const endsAt = hasCompleteSlot ? toIso(values.date, values.end) : "";
    if (hasCompleteSlot && new Date(startsAt) >= new Date(endsAt))
      next.end = "End time must be after start time.";
    if (startsAt && new Date(startsAt) <= new Date())
      next.start = "Reservations must start in the future.";
    if (!selected?.isActive)
      next.resourceId = "Inactive resources cannot be reserved.";
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }
    setSaving(true);
    try {
      const input = {
        resourceId: values.resourceId,
        title: values.title.trim(),
        notes: values.notes.trim(),
        startsAt,
        endsAt,
      };
      if (reservation)
        await apiService.updateReservation(reservation.id, input);
      else await apiService.createReservation(input, user!.id);
      notify(reservation ? "Reservation updated." : "Reservation confirmed.");
      onDone();
    } catch (error) {
      if (error instanceof ConflictError)
        setErrors({
          form: `Conflict: this resource is already booked ${formatRange(error.conflict.startsAt, error.conflict.endsAt)}. Change the time and retry.`,
        });
      else
        setErrors({
          form:
            error instanceof Error
              ? error.message
              : "Unable to save the reservation.",
        });
    } finally {
      setSaving(false);
    }
  }

  const startIso =
    values.date && values.start ? toIso(values.date, values.start) : "";
  const endIso =
    values.date && values.end ? toIso(values.date, values.end) : "";
  const hasValidSlot = Boolean(
    startIso && endIso && new Date(startIso) < new Date(endIso),
  );
  const localConflict = hasValidSlot
    ? reservations.find(
        (item) =>
          item.id !== reservation?.id &&
          item.resourceId === values.resourceId &&
          item.status === "confirmed" &&
          overlaps(startIso, endIso, item.startsAt, item.endsAt),
      )
    : undefined;
  return (
    <form onSubmit={submit} className="space-y-5">
      {errors.form && (
        <div
          className="rounded-lg border border-danger-200 bg-danger-50 p-3 text-body font-medium text-danger-700"
          role="alert"
        >
          <span className="mr-2" aria-hidden="true">
            !
          </span>
          {errors.form}
        </div>
      )}
      <Field label="Resource" error={errors.resourceId}>
        <Select
          value={values.resourceId}
          onChange={(event) => set("resourceId", event.target.value)}
        >
          {resources.map((resource) => (
            <option
              key={resource.id}
              value={resource.id}
              disabled={!resource.isActive}
            >
              {resource.name}
              {!resource.isActive ? " (Inactive)" : ""}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Reservation title or purpose" error={errors.title}>
        <Input
          value={values.title}
          onChange={(event) => set("title", event.target.value)}
          placeholder="e.g. Product planning"
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Date" error={errors.date}>
          <Input
            type="date"
            value={values.date}
            min={colomboParts().date}
            onChange={(event) => set("date", event.target.value)}
          />
        </Field>
        <Field label="Start time" error={errors.start}>
          <Input
            type="time"
            value={values.start}
            onChange={(event) => set("start", event.target.value)}
          />
        </Field>
        <Field label="End time" error={errors.end}>
          <Input
            type="time"
            value={values.end}
            onChange={(event) => set("end", event.target.value)}
          />
        </Field>
      </div>
      <Field label="Notes (optional)">
        <Textarea
          value={values.notes}
          onChange={(event) => set("notes", event.target.value)}
          placeholder="Anything attendees should know?"
        />
      </Field>
      {selected && hasValidSlot && (
        <div
          className={`rounded-xl border p-4 ${localConflict ? "border-danger-200 bg-danger-50" : "border-brand-700 bg-brand-50 ring-1 ring-brand-700"}`}
          role="status"
          aria-live="polite"
        >
          <div
            className={`text-helper font-semibold ${localConflict ? "text-danger-700" : "text-brand-800"}`}
          >
            <span className="mr-2" aria-hidden="true">
              {localConflict ? "!" : "✓"}
            </span>
            {localConflict ? "Conflict detected" : "Your selection"}
          </div>
          <div className="mt-2 font-semibold text-slate-900">
            {selected.name}
          </div>
          <div className="mt-1 text-body text-slate-600">
            {selected.location} · {formatDate(startIso)}
          </div>
          <div className="mt-1 text-body text-slate-600 tabular-nums">
            {formatRange(startIso, endIso)} · {durationLabel(startIso, endIso)}{" "}
            · UTC+05:30
          </div>
          {localConflict && (
            <p className="mt-2 text-helper text-danger-700">
              This selection overlaps an occupied interval from{" "}
              {formatRange(localConflict.startsAt, localConflict.endsAt)}.
              Change the time before submitting.
            </p>
          )}
        </div>
      )}
      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving
            ? "Checking availability…"
            : reservation
              ? "Save changes"
              : "Confirm reservation"}
        </Button>
      </div>
    </form>
  );
}
