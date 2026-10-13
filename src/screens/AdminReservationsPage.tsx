"use client";
import { useMemo, useState } from "react";
import { useStore } from "../app/store";
import { formatDate, formatRange, inputDate } from "../lib/date";
import { apiService } from "../services/apiService";
import type { Reservation } from "../types";
import ReservationList from "../components/ReservationList";
import {
  Button,
  Card,
  Field,
  Input,
  LoadingSkeleton,
  Modal,
  PageHeader,
  Select,
  StatusBadge,
} from "../components/ui";

export default function AdminReservationsPage() {
  const { reservations, resources, users, loading, notify } = useStore();
  const [search, setSearch] = useState("");
  const [failure, setFailure] = useState("");
  const [busy, setBusy] = useState(false);
  const [resourceId, setResourceId] = useState("all");
  const [status, setStatus] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [details, setDetails] = useState<Reservation | null>(null);
  const [cancelling, setCancelling] = useState<Reservation | null>(null);
  const filtered = useMemo(
    () =>
      reservations
        .filter((item) => {
          const resource = resources.find(
            (entry) => entry.id === item.resourceId,
          );
          const owner = users.find((entry) => entry.id === item.userId);
          const query = search.toLowerCase();
          return (
            (!query ||
              `${item.title} ${resource?.name} ${owner?.name}`
                .toLowerCase()
                .includes(query)) &&
            (resourceId === "all" || item.resourceId === resourceId) &&
            (status === "all" || item.status === status) &&
            (!from || inputDate(item.startsAt) >= from) &&
            (!to || inputDate(item.startsAt) <= to)
          );
        })
        .sort((a, b) => b.startsAt.localeCompare(a.startsAt)),
    [reservations, resources, users, search, resourceId, status, from, to],
  );
  if (loading) return <LoadingSkeleton rows={6} />;
  const cancel = async () => {
    if (!cancelling || busy) return;
    setBusy(true);
    setFailure("");
    try {
      await apiService.cancelReservation(cancelling.id);
      notify("Reservation cancelled by admin.");
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
        title="All reservations"
        description="Review organization-wide bookings and resolve future reservations."
      />
      <Card>
        <div className="grid gap-4 border-b border-slate-200 p-4 sm:grid-cols-2 xl:grid-cols-5">
          <Field label="Search">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Title, employee, resource…"
            />
          </Field>
          <Field label="Resource">
            <Select
              value={resourceId}
              onChange={(e) => setResourceId(e.target.value)}
            >
              <option value="all">All resources</option>
              {resources.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </Field>
          <Field label="From date">
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </Field>
          <Field label="To date">
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </Field>
        </div>
        <div className="border-b border-slate-100 px-5 py-3 text-sm text-slate-500">
          <strong className="text-slate-900">{filtered.length}</strong> matching
          reservations
        </div>
        <ReservationList
          admin
          reservations={filtered}
          resources={resources}
          users={users}
          onDetails={setDetails}
          onCancel={setCancelling}
        />
      </Card>
      <Modal
        open={Boolean(details)}
        onClose={() => setDetails(null)}
        title="Reservation details"
        size="sm"
      >
        {details && (
          <div className="space-y-4 text-sm">
            {[
              [
                "Employee",
                users.find((item) => item.id === details.userId)?.name,
              ],
              [
                "Resource",
                resources.find((item) => item.id === details.resourceId)?.name,
              ],
              ["Purpose", details.title],
              [
                "Date & time",
                `${formatDate(details.startsAt)} · ${formatRange(details.startsAt, details.endsAt)}`,
              ],
              ["Notes", details.notes || "No notes provided"],
            ].map(([label, value]) => (
              <div key={label}>
                <div className="text-helper font-medium text-slate-500">
                  {label}
                </div>
                <div className="mt-1 text-slate-700">{value}</div>
              </div>
            ))}
            <StatusBadge
              tone={details.status === "confirmed" ? "success" : "neutral"}
            >
              {details.status === "confirmed" ? "Confirmed" : "Cancelled"}
            </StatusBadge>
          </div>
        )}
      </Modal>
      <Modal
        open={Boolean(cancelling)}
        onClose={() => setCancelling(null)}
        title="Cancel this reservation?"
        description="The employee’s reservation record remains visible and the slot will be released."
        size="sm"
      >
        {failure && (
          <p role="alert" className="mb-4 text-danger-700">
            {failure}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setCancelling(null)}>
            Keep reservation
          </Button>
          <Button variant="danger" disabled={busy} onClick={cancel}>
            Cancel reservation
          </Button>
        </div>
      </Modal>
    </>
  );
}
