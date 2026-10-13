"use client";
import { useState } from "react";
import { Link, useParams } from "../lib/navigation";
import { useStore } from "../app/store";
import { colomboParts, formatDate, inputDate } from "../lib/date";
import AvailabilitySchedule from "../components/AvailabilitySchedule";
import ReservationForm from "../components/ReservationForm";
import {
  Button,
  ButtonLink,
  Card,
  EmptyState,
  Input,
  LoadingSkeleton,
  Modal,
  PageHeader,
  StatusBadge,
} from "../components/ui";

export default function ResourceDetailPage() {
  const { id } = useParams();
  const { resources, reservations, user, loading } = useStore();
  const [date, setDate] = useState(colomboParts().date);
  const [reserveOpen, setReserveOpen] = useState(false);
  if (loading) return <LoadingSkeleton rows={4} />;
  const resource = resources.find((item) => item.id === id);
  if (!resource)
    return (
      <Card>
        <EmptyState
          title="Resource not found"
          description="This resource may have been removed or the link is incorrect."
          action={<ButtonLink to="/resources">Return to resources</ButtonLink>}
        />
      </Card>
    );
  const dayReservations = reservations.filter(
    (item) =>
      item.resourceId === resource.id && inputDate(item.startsAt) === date,
  );
  return (
    <>
      <div className="mb-5">
        <Link
          to="/resources"
          className="rounded text-button font-semibold text-brand-800 hover:text-brand-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2"
        >
          ← Back to resources
        </Link>
      </div>
      <PageHeader
        title={resource.name}
        description={`${resource.category} · ${resource.location}`}
        action={
          <Button
            onClick={() => setReserveOpen(true)}
            disabled={!resource.isActive}
          >
            Reserve this resource
          </Button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.3fr]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between bg-brand-900 p-6 text-white">
            <span
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-700 text-2xl"
              aria-hidden="true"
            >
              ◇
            </span>
            <StatusBadge tone={resource.isActive ? "success" : "neutral"}>
              {resource.isActive ? "Active" : "Inactive"}
            </StatusBadge>
          </div>
          <div className="p-6">
            <p className="text-body text-slate-600">{resource.description}</p>
            <dl className="mt-6 grid grid-cols-2 gap-5 border-y border-slate-200 py-5">
              <div>
                <dt className="text-helper font-medium text-slate-500">
                  Location
                </dt>
                <dd className="mt-1 text-body font-semibold text-slate-800">
                  {resource.location}
                </dd>
              </div>
              <div>
                <dt className="text-helper font-medium text-slate-500">
                  Capacity
                </dt>
                <dd className="mt-1 text-body font-semibold text-slate-800 tabular-nums">
                  {resource.capacity}{" "}
                  {resource.category === "Equipment" ? "unit" : "people"}
                </dd>
              </div>
            </dl>
            <div className="mt-5">
              <div className="text-helper font-medium text-slate-500">
                Amenities
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {resource.amenities.map((item) => (
                  <span
                    key={item}
                    className="rounded-lg bg-slate-100 px-3 py-1.5 text-body text-slate-600"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-card-title font-semibold text-slate-900">
                Availability schedule
              </h2>
              <p className="mt-1 text-body text-slate-500">
                Occupied slots are shown in Sri Lanka time.
              </p>
            </div>
            <Input
              type="date"
              min={colomboParts().date}
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="sm:w-auto"
            />
          </div>
          <div className="p-5">
            <div className="mb-4 text-sm font-semibold text-slate-700">
              {dayReservations.length
                ? formatDate(dayReservations[0].startsAt)
                : date}
            </div>
            <AvailabilitySchedule
              reservations={dayReservations}
              showDetails={user?.role === "admin"}
            />
          </div>
        </Card>
      </div>
      <Modal
        open={reserveOpen}
        onClose={() => setReserveOpen(false)}
        title={`Reserve ${resource.name}`}
        description="Choose a future time. Adjacent bookings are allowed."
        size="lg"
      >
        <ReservationForm
          resources={resources}
          initialResourceId={resource.id}
          initialDate={date}
          onDone={() => setReserveOpen(false)}
          onCancel={() => setReserveOpen(false)}
        />
      </Modal>
    </>
  );
}
