"use client";
import { useMemo, useState } from "react";
import { useStore } from "../app/store";
import { colomboParts, overlaps, toIso } from "../lib/date";
import type { Resource } from "../types";
import ReservationForm from "../components/ReservationForm";
import ResourceCard from "../components/ResourceCard";
import {
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  LoadingSkeleton,
  Modal,
  PageHeader,
  Select,
} from "../components/ui";

export default function ResourcesPage() {
  const { resources, reservations, loading } = useStore();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [capacity, setCapacity] = useState("");
  const [status, setStatus] = useState("active");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [date, setDate] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [reserve, setReserve] = useState<Resource | null>(null);
  const completeSlot = Boolean(date && start && end && start < end);
  const slotStart = completeSlot ? toIso(date, start) : "";
  const slotEnd = completeSlot ? toIso(date, end) : "";
  const filtered = useMemo(
    () =>
      resources.filter((resource) => {
        const query = search.toLowerCase();
        return (
          (!query ||
            `${resource.name} ${resource.location}`
              .toLowerCase()
              .includes(query)) &&
          (category === "all" || resource.category === category) &&
          (!capacity || resource.capacity >= Number(capacity)) &&
          (status === "all" ||
            (status === "active" ? resource.isActive : !resource.isActive))
        );
      }),
    [resources, search, category, capacity, status],
  );
  const clear = () => {
    setSearch("");
    setCategory("all");
    setCapacity("");
    setStatus("active");
    setDate("");
    setStart("");
    setEnd("");
  };
  const available = (resourceId: string, from = slotStart, to = slotEnd) =>
    !reservations.some(
      (item) =>
        item.resourceId === resourceId &&
        item.status === "confirmed" &&
        overlaps(from, to, item.startsAt, item.endsAt),
    );
  const now = new Date();
  if (loading) return <LoadingSkeleton rows={5} />;
  return (
    <>
      <PageHeader
        title="Find the right resource"
        description="Search rooms, workspaces, and equipment—then reserve an available time."
        action={
          <Button
            disabled={!resources.some((item) => item.isActive)}
            onClick={() =>
              setReserve(resources.find((item) => item.isActive) ?? null)
            }
          >
            New reservation
          </Button>
        }
      />
      <Card className="mb-6 p-4 sm:p-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Search">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name or location…"
            />
          </Field>
          <Field label="Category">
            <Select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="all">All categories</option>
              <option>Meeting Room</option>
              <option>Workspace</option>
              <option>Equipment</option>
            </Select>
          </Field>
          <Field label="Minimum capacity">
            <Input
              type="number"
              min="1"
              value={capacity}
              onChange={(event) => setCapacity(event.target.value)}
              placeholder="Any capacity"
            />
          </Field>
          <Field label="Operational status">
            <Select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
              <option value="all">All statuses</option>
            </Select>
          </Field>
        </div>
        <div className="mt-4 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-3 lg:grid-cols-[1fr_1fr_1fr_auto]">
          <Field label="Availability date">
            <Input
              type="date"
              min={colomboParts().date}
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </Field>
          <Field label="Start time">
            <Input
              type="time"
              value={start}
              onChange={(event) => setStart(event.target.value)}
            />
          </Field>
          <Field
            label="End time"
            error={
              start && end && start >= end
                ? "End must be after start."
                : undefined
            }
          >
            <Input
              type="time"
              value={end}
              onChange={(event) => setEnd(event.target.value)}
            />
          </Field>
          <div className="flex items-end">
            <Button variant="ghost" onClick={clear}>
              Clear filters
            </Button>
          </div>
        </div>
      </Card>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-body text-slate-500">
          <strong className="font-semibold text-slate-900 tabular-nums">
            {filtered.length}
          </strong>{" "}
          {filtered.length === 1 ? "resource" : "resources"}
        </p>
        <div
          className="flex rounded-lg border border-slate-200 bg-white p-1"
          role="group"
          aria-label="Resource display"
        >
          <button
            className={`rounded-md px-3 py-1.5 text-helper font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2 ${view === "grid" ? "bg-brand-50 text-brand-800 ring-1 ring-brand-200" : "text-slate-600 hover:bg-slate-100"}`}
            onClick={() => setView("grid")}
            aria-pressed={view === "grid"}
          >
            Grid
          </button>
          <button
            className={`rounded-md px-3 py-1.5 text-helper font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2 ${view === "list" ? "bg-brand-50 text-brand-800 ring-1 ring-brand-200" : "text-slate-600 hover:bg-slate-100"}`}
            onClick={() => setView("list")}
            aria-pressed={view === "list"}
          >
            List
          </button>
        </div>
      </div>
      {filtered.length ? (
        <div
          className={
            view === "grid"
              ? "grid gap-5 md:grid-cols-2 xl:grid-cols-3"
              : "space-y-4"
          }
        >
          {filtered.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              view={view}
              availableNow={available(
                resource.id,
                now.toISOString(),
                new Date(now.getTime() + 1000).toISOString(),
              )}
              availability={completeSlot ? available(resource.id) : undefined}
              onReserve={() => setReserve(resource)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            title="No matching resources"
            description="Try adjusting your search or filters."
            action={
              <Button variant="secondary" onClick={clear}>
                Clear filters
              </Button>
            }
          />
        </Card>
      )}
      <Modal
        open={Boolean(reserve)}
        onClose={() => setReserve(null)}
        title="Create reservation"
        description="Availability is checked again when you submit."
        size="lg"
      >
        {reserve && (
          <ReservationForm
            resources={resources}
            initialResourceId={reserve.id}
            initialDate={completeSlot ? date : undefined}
            initialStart={completeSlot ? start : undefined}
            initialEnd={completeSlot ? end : undefined}
            onDone={() => setReserve(null)}
            onCancel={() => setReserve(null)}
          />
        )}
      </Modal>
    </>
  );
}
