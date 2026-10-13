"use client";
import { useMemo, useState } from "react";
import { useStore } from "../app/store";
import { formatDate, formatRange } from "../lib/date";
import { apiService } from "../services/apiService";
import type { Reservation } from "../types";
import ReservationForm from "../components/ReservationForm";
import ReservationList from "../components/ReservationList";
import {
  Button,
  Card,
  Field,
  Input,
  LoadingSkeleton,
  Modal,
  PageHeader,
  StatusBadge,
} from "../components/ui";

export default function ReservationsPage() {
  const { user, users, resources, reservations, loading, notify } = useStore();
  const [tab, setTab] = useState<"upcoming" | "past" | "cancelled">("upcoming");
  const [search, setSearch] = useState("");
  const [failure, setFailure] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Reservation | null>(null);
  const [cancelling, setCancelling] = useState<Reservation | null>(null);
  const [details, setDetails] = useState<Reservation | null>(null);
  const mine = useMemo(
    () =>
      reservations
        .filter((item) => item.userId === user?.id)
        .filter((item) => {
          const query = search.toLowerCase();
          const resource = resources.find(
            (entry) => entry.id === item.resourceId,
          );
          const matches =
            !query ||
            `${item.title} ${resource?.name}`.toLowerCase().includes(query);
          if (!matches) return false;
          if (tab === "cancelled") return item.status === "cancelled";
          if (item.status === "cancelled") return false;
          return tab === "upcoming"
            ? new Date(item.endsAt) > new Date()
            : new Date(item.endsAt) <= new Date();
        })
        .sort((a, b) =>
          tab === "past"
            ? b.startsAt.localeCompare(a.startsAt)
            : a.startsAt.localeCompare(b.startsAt),
        ),
    [reservations, user, resources, search, tab],
  );
  if (loading) return <LoadingSkeleton rows={5} />;
  const cancel = async () => {
    if (!cancelling || busy) return;
    setBusy(true);
    setFailure("");
    try {
      await apiService.cancelReservation(cancelling.id);
      notify("Reservation cancelled. The time slot is available again.");
      setCancelling(null);
    } catch (e) {
      setFailure(
        e instanceof Error ? e.message : "Unable to save. Please retry.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <PageHeader
        title="My reservations"
        description="Review, update, or cancel your own confirmed reservations."
      />
      <Card>
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-end sm:justify-between">
          <div
            className="flex gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1"
            role="group"
            aria-label="Reservation status"
          >
            {(["upcoming", "past", "cancelled"] as const).map((item) => (
              <button
                key={item}
                className={`rounded-md px-4 py-2 text-button font-semibold capitalize focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2 ${tab === item ? "bg-brand-50 text-brand-800 shadow-sm ring-1 ring-brand-200" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                onClick={() => setTab(item)}
                aria-pressed={tab === item}
              >
                {item}
              </button>
            ))}
          </div>
          <Field label="Search reservations">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Title or resource…"
              className="sm:w-64"
            />
          </Field>
        </div>
        <ReservationList
          reservations={mine}
          resources={resources}
          users={users}
          onEdit={setEditing}
          onCancel={setCancelling}
          onDetails={setDetails}
        />
      </Card>
      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Edit reservation"
        description="Availability will be checked without conflicting with this reservation."
        size="lg"
      >
        {editing && (
          <ReservationForm
            resources={resources}
            reservation={editing}
            onDone={() => setEditing(null)}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
      <Modal
        open={Boolean(cancelling)}
        onClose={() => setCancelling(null)}
        title="Cancel this reservation?"
        description="The record will be kept, but the occupied slot will be released."
        size="sm"
      >
        {failure && (
          <p role="alert" className="mb-4 text-danger-700">
            {failure}
          </p>
        )}
        <div className="rounded-lg bg-slate-50 p-4">
          <div className="font-semibold text-slate-900">
            {cancelling?.title}
          </div>
          <div className="mt-1 text-body text-slate-500 tabular-nums">
            {cancelling &&
              `${formatDate(cancelling.startsAt)} · ${formatRange(cancelling.startsAt, cancelling.endsAt)}`}
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setCancelling(null)}>
            Keep reservation
          </Button>
          <Button variant="danger" disabled={busy} onClick={cancel}>
            Cancel reservation
          </Button>
        </div>
      </Modal>
      <Modal
        open={Boolean(details)}
        onClose={() => setDetails(null)}
        title="Reservation details"
        size="sm"
      >
        {details && (
          <div className="space-y-4 text-body">
            <div>
              <div className="text-helper font-medium text-slate-500">
                Purpose
              </div>
              <div className="mt-1 font-semibold text-slate-900">
                {details.title}
              </div>
            </div>
            <div>
              <div className="text-helper font-medium text-slate-500">
                Resource
              </div>
              <div className="mt-1 text-slate-700">
                {resources.find((item) => item.id === details.resourceId)?.name}
              </div>
            </div>
            <div>
              <div className="text-helper font-medium text-slate-500">When</div>
              <div className="mt-1 text-slate-700 tabular-nums">
                {formatDate(details.startsAt)} ·{" "}
                {formatRange(details.startsAt, details.endsAt)}
              </div>
            </div>
            <div>
              <StatusBadge
                tone={details.status === "confirmed" ? "success" : "neutral"}
              >
                {details.status === "confirmed" ? "Confirmed" : "Cancelled"}
              </StatusBadge>
            </div>
            {details.notes && (
              <div>
                <div className="text-helper font-medium text-slate-500">
                  Notes
                </div>
                <div className="mt-1 text-slate-700">{details.notes}</div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
